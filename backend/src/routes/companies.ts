import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { classifyCompany } from "./ai.js";

const router = Router();

const searchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  radius_km: z.preprocess(
    (value) => (value ? Number(value) : undefined),
    z.number().min(1).max(200).optional()
  ),
  category: z.string().optional(),
  rating_min: z.preprocess(
    (value) => (value ? Number(value) : undefined),
    z.number().min(0).max(5).optional()
  ),
  size: z.string().optional(),
  limit: z.preprocess(
    (value) => (value ? Number(value) : undefined),
    z.number().min(1).max(500).optional()
  )
});

router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query);
    const overallLimit = Math.min(params.limit || 50, 500);

    // Save to search history
    if (req.user && (params.q || params.category)) {
      await pool.query(
        `INSERT INTO search_history (id, user_id, query, city, radius_km, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          req.user.id,
          params.q || "",
          params.city || null,
          params.radius_km || null,
          params.category || null
        ]
      );
    }

    let results: any[] = [];
    let source = "database";

    // 1. Search Database first
    const dbValues: Array<string | number> = [];
    const searchTerm = `%${params.q || ""}%`;
    let dbQuery = `
      SELECT * FROM companies 
      WHERE (name LIKE $1 OR category LIKE $2 OR city LIKE $3)
      LIMIT $4
    `;
    dbValues.push(searchTerm); // $1
    dbValues.push(searchTerm); // $2
    dbValues.push(searchTerm); // $3
    dbValues.push(overallLimit); // $4

    const dbResult = await pool.query(dbQuery, dbValues);
    results = dbResult.rows || [];

    // 2. Search Google if API Key and Query present
    if (env.GOOGLE_MAPS_API_KEY && params.q) {
      const googleLimit = Math.min(overallLimit, 60);
      const expandedQueries = expandQuery(params.q, params.city);
      const queryCount = Math.min(expandedQueries.length, 2);
      const perQueryLimit = Math.ceil(googleLimit / Math.max(queryCount, 1));
      const apiKey = env.GOOGLE_MAPS_API_KEY;
      const searchPromises = expandedQueries.slice(0, queryCount).map(q =>
        searchGoogle(q, apiKey, params.radius_km, perQueryLimit)
      );
      const allGoogleResults = (await Promise.all(searchPromises)).flat();

      // Deduplicate by name
      const seenNames = new Set<string>();
      const dedupedGoogle = allGoogleResults.filter(g => {
        const key = g.name.toLowerCase().trim();
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });

      // Classify: use Google Place types first, only call AI for ambiguous cases
      const enrichedGoogle = await Promise.all(
        dedupedGoogle.slice(0, googleLimit).map(async (company: any) => {
          // 1. Google Place types give a reliable, instant signal
          const placeTypeResult = company.googleTypeClassification as string | null;

          let type: string;
          let revenue: string;

          if (placeTypeResult) {
            // Types clearly identified — no need for AI
            type = placeTypeResult;
            revenue = "Sob consulta";
          } else {
            // Ambiguous — call AI with full context including keyword hint
            const classification = await classifyCompany({
              name: company.name,
              category: company.category,
              address: company.address
            });
            type = classification.type;
            revenue = classification.revenue;
          }

          const { googleTypeClassification: _gtc, googleTypes: _gt, ...rest } = company;
          return { ...rest, business_type: type, revenue_estimate: revenue };
        })
      );

      // Merge with database results (deduplicate by name)
      const existingNames = new Set(results.map((r: any) => r.name.toLowerCase()));
      const uniqueGoogle = enrichedGoogle.filter((g: any) => !existingNames.has(g.name.toLowerCase()));

      results = [...results, ...uniqueGoogle];
      source = "hybrid";
    }

    return res.json({ source, results });
  } catch (err) {
    return next(err);
  }
});

router.get("/details/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const result = await pool.query(
        `SELECT id, name, address, phone, website, email, category, city, latitude, longitude, rating, size, revenue_estimate, business_type
         FROM companies
         WHERE id = $1
         LIMIT 1`,
        [id]
      );
      if (!result.rowCount) {
        return res.status(404).json({ error: "not_found" });
      }
      return res.json(result.rows[0]);
    }

    if (!env.GOOGLE_MAPS_API_KEY) {
      return res.status(400).json({ error: "google_api_key_missing" });
    }

    const details = await fetchPlaceDetails(id, env.GOOGLE_MAPS_API_KEY);
    return res.json(details);
  } catch (err) {
    return next(err);
  }
});

// Keyword expansion map for broader search coverage
function expandQuery(q: string, city?: string): string[] {
  const base = city ? `${q} ${city}` : q;
  const lower = q.toLowerCase().trim();
  
  const expansionMap: Record<string, string[]> = {
    "embalagem": ["embalagens industriais", "embalagem plastica", "distribuidora embalagens"],
    "pet": ["industria pet", "embalagens pet", "fabrica pet"],
    "movel": ["fabrica moveis", "industria moveleira", "moveis planejados industria"],
    "móvel": ["fabrica moveis", "industria moveleira"],
    "madeira": ["serraria", "beneficiamento madeira", "madeireira industrial"],
    "metalurgica": ["metalurgia", "usinagem", "ferramentaria", "caldeiraria"],
    "metalúrgica": ["metalurgia", "usinagem", "ferramentaria"],
    "plastico": ["transformacao plasticos", "injecao plastica", "reciclagem plastico"],
    "plástico": ["transformação plásticos", "injeção plástica"],
    "alimento": ["industria alimenticia", "processamento alimentos", "fabricante alimentos"],
    "roupa": ["confeccao", "industria textil", "fabrica roupas"],
    "tecido": ["industria textil", "fiacao", "tecelagem"],
    "quimica": ["industria quimica", "petroquimica", "distribuidora quimicos"],
    "química": ["indústria química", "petroquímica"],
    "logistica": ["transportadora", "armazem", "carga e descarga", "distribuicao"],
    "logística": ["transportadora", "armazém logística"],
    "construcao": ["construtora", "empreiteira", "incorporadora"],
    "construção": ["construtora", "empreiteira"],
    "farmaceutico": ["industria farmaceutica", "laboratorio farmaceutico"],
    "farmacêutico": ["indústria farmacêutica", "laboratório farmacêutico"],
    "papel": ["papelao", "industria papel", "papelaria industrial"],
    "borracha": ["industria borracha", "artefatos borracha"],
    "ceramica": ["ceramica industrial", "revestimentos ceramicos"],
    "cerâmica": ["cerâmica industrial"],
    "automovel": ["autopecas", "autopeças", "industria automotiva"],
    "automóvel": ["autopeças", "indústria automotiva"],
  };
  
  // Find synonyms
  for (const [key, variants] of Object.entries(expansionMap)) {
    if (lower.includes(key)) {
      const variantQuery = city ? `${variants[0]} ${city}` : variants[0];
      return [base, variantQuery];
    }
  }
  
  // No specific expansion — try generic industrial variant
  return [base];
}

// ─── Types from Google Places that indicate B2C businesses ───────────────────
const B2C_PLACE_TYPES = new Set([
  "restaurant", "food", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery",
  "store", "clothing_store", "shoe_store", "jewelry_store", "book_store",
  "electronics_store", "furniture_store", "hardware_store", "home_goods_store",
  "pet_store", "supermarket", "grocery_or_supermarket",
  "beauty_salon", "hair_care", "spa", "gym", "fitness_center",
  "school", "primary_school", "secondary_school", "university",
  "hospital", "doctor", "dentist", "pharmacy", "drugstore", "veterinary_care",
  "hotel", "lodging", "hostel", "guest_house",
  "movie_theater", "night_club", "bowling_alley", "amusement_park",
  "gas_station", "car_wash",
  "laundry", "dry_cleaning",
  "florist", "optician",
  "post_office", "bank",
]);

const B2B_PLACE_TYPES = new Set([
  "storage", "moving_company", "insurance_agency", "lawyer",
  "accounting", "real_estate_agency", "travel_agency",
  "car_dealer", "car_rental", "car_repair",
  "electrician", "plumber", "roofing_contractor", "general_contractor",
  "lodging" // NOT in B2C here, but actually this could be either
]);

function classifyByGoogleTypes(types: string[]): "B2B" | "B2C" | null {
  if (!types?.length) return null;
  const isB2C = types.some(t => B2C_PLACE_TYPES.has(t));
  const isB2B = types.some(t => B2B_PLACE_TYPES.has(t));
  if (isB2C && !isB2B) return "B2C";
  if (isB2B && !isB2C) return "B2B";
  return null;
}

// ─── Website data scraper ─────────────────────────────────────────────────────
interface WebsiteData {
  social: Record<string, string>;
  phone?: string;
  email?: string;
}

async function scrapeWebsiteData(websiteUrl: string): Promise<WebsiteData> {
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' }
    });
    clearTimeout(timeout);

    if (!resp.ok) return { social: {} };
    const html = await resp.text();

    const social: Record<string, string> = {};

    // ── Social patterns ──────────────────────────────────────────────────────
    const socialPatterns: Array<{ key: string; re: RegExp }> = [
      { key: 'instagram', re: /href=["'](https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|explore|reel)[A-Za-z0-9_.]{2,})\/?["']/gi },
      { key: 'facebook',  re: /href=["'](https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog)[A-Za-z0-9_./-]{3,})\/?["']/gi },
      { key: 'linkedin',  re: /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_.-]+)\/?["']/gi },
      { key: 'twitter',   re: /href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent)[A-Za-z0-9_]{2,})\/?["']/gi },
      { key: 'youtube',   re: /href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:channel|@|c)\/[A-Za-z0-9_@-]+)\/?["']/gi },
      { key: 'tiktok',    re: /href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.]+)\/?["']/gi },
      { key: 'pinterest', re: /href=["'](https?:\/\/(?:www\.)?pinterest\.com\/[A-Za-z0-9_/-]+)\/?["']/gi },
      { key: 'whatsapp',  re: /href=["'](https?:\/\/(?:wa\.me|api\.whatsapp\.com|wa\.link)\/[0-9A-Za-z?=&_-]+)["']/gi },
    ];

    // WhatsApp number from send link
    const waMatch = html.match(/href=["']https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)([+\d]{8,})/i);
    if (waMatch) social['whatsapp'] = `https://wa.me/${waMatch[1].replace(/\D/g, '')}`;

    for (const { key, re } of socialPatterns) {
      if (social[key]) continue;
      re.lastIndex = 0;
      const m = re.exec(html);
      if (m) social[key] = m[1];
    }

    // ── Phone extraction ─────────────────────────────────────────────────────
    let phone: string | undefined;

    // 1. tel: links (most reliable)
    const telMatch = html.match(/href=["']tel:([+\d\s()-]{8,20})["']/i);
    if (telMatch) {
      phone = telMatch[1].trim();
    }

    // 2. BR phone patterns in visible text (fallback)
    if (!phone) {
      const brPhone = html.match(/(?<!\d)(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-.\s]?\d{4}(?!\d)/);
      if (brPhone) {
        const cleaned = brPhone[0].replace(/[^\d+]/g, '');
        if (cleaned.length >= 10) phone = brPhone[0].trim();
      }
    }

    // ── Email extraction ─────────────────────────────────────────────────────
    let email: string | undefined;
    const mailtoMatch = html.match(/href=["']mailto:([^\s"'?]+@[^\s"'?]+\.[a-z]{2,})["']/i);
    if (mailtoMatch) {
      email = mailtoMatch[1].toLowerCase();
    } else {
      // Fallback: find email in text
      const emailMatch = html.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
      if (emailMatch && !emailMatch[1].includes('example') && !emailMatch[1].includes('seusite')) {
        email = emailMatch[1].toLowerCase();
      }
    }

    return { social, phone, email };
  } catch {
    return { social: {} };
  }
}

async function searchGoogle(query: string, apiKey: string, radiusKm?: number, limit: number = 20) {
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const basicResults: any[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 0;

  while (basicResults.length < safeLimit && pageCount < 3) {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (radiusKm) url += `&radius=${radiusKm * 1000}`;
    if (nextPageToken) url += `&pagetoken=${nextPageToken}`;

    const response = await fetch(url);
    const data = (await response.json()) as any;
    const pageResults = data.results ?? [];
    basicResults.push(...pageResults);

    nextPageToken = data.next_page_token;
    pageCount += 1;

    if (!nextPageToken) break;
    if (basicResults.length < safeLimit) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const slicedResults = basicResults.slice(0, safeLimit);

  const detailedResults = await Promise.all(
    slicedResults.map(async (item: any) => {
      let details: Partial<WebsiteData & { phone?: string; website?: string; email?: string; social?: Record<string, string> }> = {};
      try {
        details = await fetchPlaceDetails(item.place_id, apiKey);
      } catch {
        details = {};
      }

      // Classify using Google Place types immediately (reliable signal)
      const googleTypeClassification = classifyByGoogleTypes(item.types ?? []);

      return {
        id: item.place_id,
        name: item.name,
        address: item.formatted_address,
        category: item.types?.[0],
        googleTypes: item.types ?? [],
        googleTypeClassification, // store for use in classification step
        latitude: item.geometry?.location?.lat,
        longitude: item.geometry?.location?.lng,
        rating: item.rating,
        phone: details.phone,
        website: details.website,
        email: details.email,
        social: details.social ?? null
      };
    })
  );

  return detailedResults;
}

async function fetchPlaceDetails(placeId: string, apiKey: string) {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number,website,formatted_address,types,name,rating,geometry&key=${apiKey}`;
  const dResp = await fetch(detailsUrl);
  const dData = (await dResp.json()) as any;

  if (dData.status && dData.status !== "OK") {
    throw new Error(`google_details_${dData.status.toLowerCase()}`);
  }

  const website: string | undefined = dData.result?.website;
  const phone: string | undefined =
    dData.result?.formatted_phone_number ?? dData.result?.international_phone_number;
  const name: string | undefined = dData.result?.name;
  const address: string | undefined = dData.result?.formatted_address;
  const category: string | undefined = dData.result?.types?.[0];
  const googleTypeClassification = classifyByGoogleTypes(dData.result?.types ?? []);

  const classification = await classifyCompany({
    name: name ?? placeId,
    category,
    address
  });

  // Scrape website for additional contact info + social links
  let webData: WebsiteData = { social: {} };
  if (website) {
    webData = await scrapeWebsiteData(website);
  }

  return {
    id: placeId,
    name,
    address,
    category,
    rating: dData.result?.rating,
    latitude: dData.result?.geometry?.location?.lat,
    longitude: dData.result?.geometry?.location?.lng,
    phone: phone ?? webData.phone,
    website,
    email: webData.email,
    social: Object.keys(webData.social).length > 0 ? webData.social : undefined,
    business_type: googleTypeClassification ?? classification.type,
    revenue_estimate: classification.revenue
  };
}

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [req.user?.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/history/segments", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT
          COALESCE(NULLIF(category, ''), NULLIF(query, '')) AS segment,
          COUNT(*) AS total,
          MAX(created_at) AS last_searched,
          (
            SELECT city
            FROM search_history h2
            WHERE h2.user_id = h.user_id
              AND COALESCE(NULLIF(h2.category, ''), NULLIF(h2.query, '')) =
                  COALESCE(NULLIF(h.category, ''), NULLIF(h.query, ''))
            ORDER BY created_at DESC
            LIMIT 1
          ) AS last_city,
          (
            SELECT radius_km
            FROM search_history h3
            WHERE h3.user_id = h.user_id
              AND COALESCE(NULLIF(h3.category, ''), NULLIF(h3.query, '')) =
                  COALESCE(NULLIF(h.category, ''), NULLIF(h.query, ''))
            ORDER BY created_at DESC
            LIMIT 1
          ) AS last_radius_km
        FROM search_history h
        WHERE user_id = $1
          AND COALESCE(NULLIF(category, ''), NULLIF(query, '')) IS NOT NULL
        GROUP BY segment
        ORDER BY last_searched DESC
        LIMIT 50
      `,
      [req.user?.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
