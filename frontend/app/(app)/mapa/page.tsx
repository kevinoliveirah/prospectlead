"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import type { Company, Lead } from "../../../lib/types";
import { useAuth } from "../../../components/AuthProvider";
import { MapPreview } from "../../../components/MapPreview";
import { CompanyDetailsModal } from "../../../components/CompanyDetailsModal";
import { CityAutocomplete } from "../../../components/CityAutocomplete";

type SearchResponse = {
  source: string;
  results: Company[];
};

const INITIAL_QUERY = {
  q: "",
  city: "",
  category: "",
  rating_min: "",
  size: "",
  limit: "100",
  radius_km: ""
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export default function MapaPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const initializedQueryRef = useRef(false);
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<Company[]>([]);
  const [source, setSource] = useState<string>("database");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Companies explicitly B2C go to B2C; everything else (B2B, Both, or unclassified) goes to B2B.
  // This ensures no results get "lost" in the void when AI hasn't classified yet.
  const b2bResults = results.filter(r => r.business_type !== 'B2C');
  const b2cResults = results.filter(r => r.business_type === 'B2C');

  useEffect(() => {
    if (!token) return;
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const searchData = await apiFetch<SearchResponse>("/companies/search?limit=25", {}, token);
        setResults(searchData.results || []);
        setSource(searchData.source || "database");
      } catch (err: any) {
        console.error("Failed to fetch initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [token]);

  useEffect(() => {
    if (!token || initializedQueryRef.current) return;

    const qParam = searchParams.get("q") ?? "";
    const cityParam = searchParams.get("city") ?? "";
    const radiusParam = searchParams.get("radius_km") ?? "";
    const limitParam = searchParams.get("limit") ?? "";
    const auto = searchParams.get("auto") === "1";

    if (!qParam && !cityParam && !radiusParam) {
      initializedQueryRef.current = true;
      return;
    }

    const nextQuery = {
      ...INITIAL_QUERY,
      q: qParam,
      city: cityParam,
      radius_km: radiusParam,
      limit: limitParam || INITIAL_QUERY.limit
    };

    setQuery(nextQuery);
    initializedQueryRef.current = true;

    if (auto) {
      performSearch(nextQuery);
    }
  }, [token, searchParams]);

  useEffect(() => {
    if (!token || !selectedCompany) return;
    const needsDetails =
      !selectedCompany.phone ||
      !selectedCompany.website ||
      !selectedCompany.email ||
      !selectedCompany.social;

    if (!needsDetails) {
      setDetailsError(null);
      setDetailsLoading(false);
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);
    setDetailsError(null);

    apiFetch<Company>(`/companies/details/${selectedCompany.id}`, {}, token)
      .then((data) => {
        if (cancelled) return;
        setSelectedCompany((prev) => (prev && prev.id === selectedCompany.id ? { ...prev, ...data } : prev));
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "erro_desconhecido";
        setDetailsError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompany?.id, token]);

  const performSearch = async (activeQuery: typeof query) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const cleanParams = Object.fromEntries(
        Object.entries(activeQuery).filter(([_, v]) => v !== "")
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      
      const data = await apiFetch<SearchResponse>(
        `/companies/search?${queryString}`,
        {},
        token
      );
      setResults(data.results || []);
      setSource(data.source || "database");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await performSearch(query);
  };

  const handleSaveLead = async (company: Company) => {
    if (!token) return;
    try {
      await apiFetch("/leads", {
        method: "POST",
        body: JSON.stringify({
          company_id: (company.id && isUuid(company.id)) ? company.id : undefined,
          company_name: company.name,
          phone: company.phone ?? undefined,
          website: company.website ?? undefined,
          notes: `Setor: ${company.category}. Faturamento: ${company.revenue_estimate}. Tipo: ${company.business_type}`
        })
      }, token);
      setMessage(`Lead ${company.name} salvo com sucesso!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["Nome", "Endereço", "Telefone", "Website", "Categoria", "Tipo", "Faturamento Estimado"];
    const rows = results.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${(c.website || "").replace(/"/g, '""')}"`,
      `"${(c.category || "").replace(/"/g, '""')}"`,
      `"${(c.business_type || "").replace(/"/g, '""')}"`,
      `"${(c.revenue_estimate || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mapa_b2b_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap items-end justify-between gap-6 pb-2">
        <div className="max-w-xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Mapa de Prospecção</h1>
          <p className="text-[var(--ink-muted)] leading-relaxed text-sm">
            Busque empresas por segmento e cidade. A IA classifica automaticamente o tipo de negócio e potencial financeiro.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">Resultados</span>
             <span className="text-xl font-bold text-white">{results.length}</span>
          </div>
          
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-1 pr-4 ring-1 ring-white/10 shadow-sm">
             <span className="flex h-8 items-center justify-center rounded-xl bg-[var(--accent)] px-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[var(--accent)]/20">
              Fonte
            </span>
            <span className="text-xs font-semibold text-white uppercase tracking-wider">{source}</span>
          </div>
          
          <button 
            onClick={handleExportCSV}
            disabled={results.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50 shadow-sm"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[var(--surface)]/50 p-8 shadow-sm backdrop-blur-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">O que você busca?</label>
            <input
              type="text"
              placeholder="Ex: Serraria, embalagens, metalurgia..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 outline-none shadow-sm"
              value={query.q}
              onChange={(e) => setQuery({ ...query, q: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Cidade</label>
            <CityAutocomplete
              placeholder="Ex: São Paulo, RS..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 outline-none shadow-sm"
              value={query.city}
              onChange={(val) => setQuery({ ...query, city: val })}
            />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Limite</label>
             <input
              type="number"
              min="1"
              max="500"
              placeholder="Ex: 100"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 outline-none shadow-sm"
              value={query.limit}
              onChange={(e) => setQuery({ ...query, limit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Raio (KM)</label>
             <input
              type="number"
              placeholder="Ex: 50"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 outline-none shadow-sm"
              value={query.radius_km}
              onChange={(e) => setQuery({ ...query, radius_km: e.target.value })}
            />
          </div>
          <div className="flex items-end">
             <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--accent)] py-3 font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Explorar Mapa"}
            </button>
          </div>
        </form>
      </div>


      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          ✅ {message}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="h-[350px] md:h-[500px] w-full relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all">
          <MapPreview items={results} onSelect={(company) => setSelectedCompany(company)} />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* B2B Column */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--accent)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"></span>
              Foco B2B / Indústrias
            </h3>
            <div className="space-y-4">
              {b2bResults.length ? (
                b2bResults.map((company) => (
                  <CompanyCard 
                    key={company.id} 
                    company={company} 
                    onSave={handleSaveLead} 
                    onView={() => setSelectedCompany(company)}
                  />
                ))
              ) : (
                <EmptyState text="Nenhuma indústria ou empresa B2B encontrada neste raio." />
              )}
            </div>
          </div>

          {/* B2C Column */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
              Foco B2C / Varejo
            </h3>
            <div className="space-y-4">
              {b2cResults.length ? (
                b2cResults.map((company) => (
                  <CompanyCard 
                    key={company.id} 
                    company={company} 
                    onSave={handleSaveLead} 
                    onView={() => setSelectedCompany(company)}
                  />
                ))
              ) : (
                <EmptyState text="Nenhum estabelecimento comercial ou varejo encontrado." />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-xs text-[var(--ink-muted)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
               <h4 className="font-bold text-white mb-2 uppercase tracking-tighter">Exportação Habilitada</h4>
               <p>Baixe seus resultados em CSV para importar no Excel ou ferramentas de prospecção.</p>
             </div>
             <div>
               <h4 className="font-bold text-white mb-2 uppercase tracking-tighter">Classificação em Tempo Real</h4>
               <p>A IA analisa o nome e atividade para separar fornecedores industriais de consumidores finais.</p>
             </div>
             <div>
               <h4 className="font-bold text-white mb-2 uppercase tracking-tighter">Novos Dados</h4>
               <p>Telefones e sites são buscados automaticamente para acelerar seu contato.</p>
             </div>
          </div>
        </div>
      </div>

      {selectedCompany && (
        <CompanyDetailsModal 
          company={selectedCompany} 
          onClose={() => {
            setSelectedCompany(null);
            setDetailsError(null);
            setDetailsLoading(false);
          }}
          onSave={handleSaveLead}
          loadingDetails={detailsLoading}
          detailsError={detailsError}
        />
      )}
    </section>
  );
}

function CompanyCard({ 
  company, 
  onSave, 
  onView 
}: { 
  company: Company, 
  onSave: (c: Company) => void,
  onView: () => void
}) {
  const hasSocial = company.social && Object.values(company.social).some(Boolean);

  const SOCIAL_ICONS: Record<string, { icon: string; color: string }> = {
    instagram: { icon: "📷", color: "text-pink-400 hover:text-pink-300" },
    whatsapp:  { icon: "💬", color: "text-green-400 hover:text-green-300" },
    facebook:  { icon: "👍", color: "text-blue-400 hover:text-blue-300" },
    linkedin:  { icon: "💼", color: "text-sky-400 hover:text-sky-300" },
    youtube:   { icon: "▶️", color: "text-red-400 hover:text-red-300" },
    tiktok:    { icon: "🎵", color: "text-white/80 hover:text-white" },
    pinterest: { icon: "📌", color: "text-red-300 hover:text-red-200" },
    twitter:   { icon: "🐦", color: "text-sky-300 hover:text-sky-200" },
  };

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[var(--surface)]/80 p-5 shadow-sm transition-all hover:border-[var(--accent)]/30 hover:bg-[var(--surface)] hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 cursor-pointer min-w-0" onClick={onView}>
          <h3 className="text-base font-bold text-white group-hover:text-[var(--accent)] transition-colors leading-tight truncate mb-1">
            {company.name}
          </h3>
          <p className="text-[10px] text-[var(--ink-muted)] line-clamp-1 mb-3">
            📍 {company.address ?? company.city ?? "Endereço não informado"}
          </p>
          
          {/* Contact chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white ring-1 ring-white/5 hover:ring-white/20 transition-all"
              >
                📞 {company.phone}
              </a>
            )}
            {company.revenue_estimate && (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                💰 {company.revenue_estimate}
              </span>
            )}
          </div>

          {/* Social media icons */}
          {hasSocial && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(company.social!).map(([key, url]) => {
                if (!url || !SOCIAL_ICONS[key]) return null;
                const { icon, color } = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`text-base transition-all hover:scale-110 ${color}`}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  >
                    {icon}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(company); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg text-[var(--ink-muted)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm"
            title="Salvar no CRM"
          >
            📂
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg text-[var(--ink-muted)] hover:bg-white/10 hover:text-white transition-all shadow-sm"
            title="Ver Detalhes"
          >
            👁️
          </button>
        </div>
      </div>
      
      {company.website && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <a 
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[10px] font-medium text-blue-400 hover:text-blue-300 transition-colors truncate"
          >
            <span>🌐</span> {company.website}
          </a>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
      <p className="max-w-[200px] mx-auto text-xs text-[var(--ink-muted)] leading-relaxed">{text}</p>
    </div>
  );
}
