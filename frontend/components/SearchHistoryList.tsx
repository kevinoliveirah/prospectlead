"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { SearchHistory } from "../lib/types";
import { useAuth } from "./AuthProvider";

interface SearchHistoryListProps {
  onSelect: (item: SearchHistory) => void;
}

export function SearchHistoryList({ onSelect }: SearchHistoryListProps) {
  const { token } = useAuth();
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<SearchHistory[]>("/companies/history", {}, token);
        setHistory(data || []);
      } catch (err) {
        console.error("Failed to fetch search history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  if (loading) return <div className="text-xs text-[var(--ink-muted)]">Carregando histórico...</div>;
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--ink-muted)]">Buscas Recentes</h3>
      <div className="flex flex-wrap gap-2">
        {history.slice(0, 10).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex flex-col items-start gap-1 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left transition hover:border-[var(--accent)]/30 hover:bg-white/10"
          >
            <span className="text-sm font-semibold text-white group-hover:text-[var(--accent)]">
              {item.query || item.category || "Busca Geral"}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
              {item.city ? `📍 ${item.city}` : "Brasil"} • {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
