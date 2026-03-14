"use client";

import { useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import type { Company } from "../lib/types";
import { useGoogleMaps } from "./GoogleMapsProvider";

type MapPreviewProps = {
  items: Company[];
  onSelect?: (company: Company) => void;
};

export function MapPreview({ items, onSelect }: MapPreviewProps) {
  const { isLoaded, loadError } = useGoogleMaps();

  const points = useMemo(() => {
    return items
      .filter(
        (item) => typeof item.latitude === "number" && typeof item.longitude === "number"
      )
      .slice(0, 40);
  }, [items]);

  const center = useMemo(() => {
    if (!points.length) return { lat: -23.5505, lng: -46.6333 }; // São Paulo default

    const avgLat = points.reduce((acc: number, curr: any) => acc + (curr.latitude as number), 0) / points.length;
    const avgLng = points.reduce((acc: number, curr: any) => acc + (curr.longitude as number), 0) / points.length;
    return { lat: avgLat, lng: avgLng };
  }, [points]);

  if (loadError) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-sm text-red-400">
        Erro ao carregar a API do Google Maps. Verifique a sua chave no painel.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-6 text-sm text-[var(--ink-muted)]">
        Carregando mapa...
      </div>
    );
  }

  if (!points.length) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-6 text-sm text-[var(--ink-muted)] text-center">
        Sem coordenadas para montar o mapa. Tente usar a busca com diferentes filtros ou registre empresas com latitude/longitude.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)]/80 p-0 shadow-sm h-full isolate">
      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl -z-10" />
      <div className="absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-[var(--accent-2)]/20 blur-3xl -z-10" />
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "1rem" }}
        center={center}
        zoom={points.length === 1 ? 14 : 11}
        options={{
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
        }}
      >
        {points.map((pt: any) => (
          <MarkerF
            key={pt.id}
            position={{ lat: pt.latitude as number, lng: pt.longitude as number }}
            title={pt.name}
            onClick={() => onSelect?.(pt)}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
