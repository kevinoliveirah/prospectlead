"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { apiFetch } from "../../../lib/api";
import type { User } from "../../../lib/types";
import Image from "next/image";

type LoginResponse = {
  user: User;
  token: string;
};

const PENDING_SEARCH_KEY = "prospect_lead_pending_search";

function mapLoginError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid_credentials")) {
    return {
      title: "Nao foi possivel entrar",
      detail: "Email ou senha incorretos. Confira os dados e tente novamente."
    };
  }

  if (normalized.includes("unauthorized")) {
    return {
      title: "Sessao invalida",
      detail: "Sua sessao expirou ou nao e valida. Faca login novamente."
    };
  }

  if (normalized.includes("request_failed_429")) {
    return {
      title: "Muitas tentativas",
      detail: "Aguarde alguns minutos e tente de novo."
    };
  }

  if (normalized.includes("request_timeout")) {
    return {
      title: "Servidor lento",
      detail: "A resposta demorou demais. Verifique o backend e tente novamente."
    };
  }

  if (normalized.includes("request_failed_500") || normalized.includes("internal_server_error")) {
    return {
      title: "Servidor indisponivel",
      detail: "O servidor nao respondeu. Tente novamente em instantes."
    };
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return {
      title: "Sem conexao com o servidor",
      detail: "Verifique sua internet ou se o backend esta ligado."
    };
  }

  if (normalized.includes("request_failed_") || normalized.includes("erro_desconhecido")) {
    return {
      title: "Nao foi possivel entrar",
      detail: "Ocorreu um erro inesperado. Tente novamente."
    };
  }

  return {
    title: "Nao foi possivel entrar",
    detail: message
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorDetail, setErrorDetail] = useState<{ title: string; detail: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const payload = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setAuth(payload);
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(PENDING_SEARCH_KEY);
        if (raw) {
          try {
            const data = JSON.parse(raw) as { q?: string; city?: string; radius_km?: string };
            window.localStorage.removeItem(PENDING_SEARCH_KEY);
            const params = new URLSearchParams();
            if (data.q) params.set("q", data.q);
            if (data.city) params.set("city", data.city);
            if (data.radius_km) params.set("radius_km", data.radius_km);
            params.set("auto", "1");
            router.push(`/mapa?${params.toString()}`);
            return;
          } catch {
            window.localStorage.removeItem(PENDING_SEARCH_KEY);
          }
        }
      }
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro_desconhecido";
      setError(message);
      setErrorDetail(mapLoginError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-16 text-[var(--ink)]">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">
              Bem-vindo de volta
            </p>
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)] hover:text-white transition">
              ← Voltar ao inicio
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            Entrar no Prospect Lead
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Acesse seu pipeline, veja o mapa e continue a prospeccao.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-sm outline-none ring-[var(--accent)] focus:ring-2"
                placeholder="voce@empresa.com"
              />
            </label>
            <label className="block text-sm">
              Senha
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent)]">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent px-1 py-2 text-sm text-white placeholder:text-white/40 outline-none"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-lg border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] hover:text-white hover:bg-white/10 transition"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>
            {errorDetail ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                <p className="font-semibold text-red-200">{errorDetail.title}</p>
                <p className="mt-1 text-red-300">{errorDetail.detail}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("admin@prospect.com");
                setPassword("prospect123");
                // Small delay to allow state update to be visible
                setTimeout(() => {
                  const form = document.querySelector("form");
                  if (form) form.requestSubmit();
                }, 100);
              }}
              className="w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
            >
              Acesso Rapido (Conta Demo)
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            Ainda nao tem conta?{" "}
            <Link className="font-semibold text-[var(--accent)]" href="/register">
              Criar agora
            </Link>
          </p>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.clear();
                window.location.reload();
              }
            }}
            className="mt-8 w-full text-[10px] uppercase tracking-widest text-[var(--ink-muted)] hover:text-white transition"
          >
            Problemas para entrar? Clique aqui para limpar dados do navegador
          </button>
        </section>

        <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] p-8">
          <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-[var(--accent)]/20 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-[var(--accent-2)]/30 blur-3xl" />
          <h2 className="text-lg font-semibold">O que voce encontra aqui</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--ink-muted)]">
            <li>Mapa com filtros de segmento e cidade.</li>
            <li>CRM leve para acompanhar leads.</li>
            <li>Mensagens de prospeccao geradas por IA.</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface)]/80 p-4 text-xs text-[var(--ink-muted)]">
            Dica: use o mesmo email do seu time comercial para manter tudo
            centralizado.
          </div>
        </aside>
      </div>
    </main>
  );
}
