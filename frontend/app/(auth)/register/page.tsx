"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { apiFetch } from "../../../lib/api";
import type { User } from "../../../lib/types";
import Image from "next/image";

type RegisterResponse = {
  user: User;
  token: string;
};

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();
  
  if (normalized.includes("email_in_use")) {
    return {
      title: "Email ja cadastrado",
      detail: "Ja existe uma conta com este email. Tente fazer login."
    };
  }

  if (normalized.includes("request_timeout")) {
    return {
      title: "Servidor lento",
      detail: "A resposta demorou demais. Verifique o backend e tente novamente."
    };
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return {
      title: "Sem conexao",
      detail: "Verifique sua internet ou tente novamente em instantes."
    };
  }

  return {
    title: "Nao foi possivel criar conta",
    detail: "Ocorreu um erro no cadastro. Tente novamente."
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ title: string; detail: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const payload = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          company: company || undefined
        })
      });
      setAuth(payload);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro_desconhecido";
      setError(message);
      setErrorDetail(mapAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-16 text-[var(--ink)]">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">
              Comece agora
            </p>
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-muted)] hover:text-white transition">
              ← Voltar ao inicio
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            Criar conta no Prospect Lead
          </h1>
          

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              Nome completo
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-sm outline-none ring-[var(--accent)] focus:ring-2"
                placeholder="Seu nome"
              />
            </label>
            <label className="block text-sm">
              Empresa
              <input
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-sm outline-none ring-[var(--accent)] focus:ring-2"
                placeholder="Nome da empresa"
              />
            </label>
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
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-sm outline-none ring-[var(--accent)] focus:ring-2"
                placeholder="Minimo 6 caracteres"
              />
            </label>
            {errorDetail ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                <p className="font-semibold text-red-200">{errorDetail.title}</p>
                <p className="mt-1">{errorDetail.detail}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--ink-muted)]">
            Ja tem conta?{" "}
            <Link className="font-semibold text-[var(--accent)]" href="/login">
              Fazer login
            </Link>
          </p>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold">O que voce ativa</h2>
          <div className="mt-4 space-y-4 text-sm text-[var(--ink-muted)]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Controle rapido de leads com status e notas.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Buscas inteligentes por segmento e cidade.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              IA para gerar mensagens consultivas.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
