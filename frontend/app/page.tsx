"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Unbounded, Sora } from "next/font/google";
import { useAuth } from "../components/AuthProvider";
import { CheckCircle, Search, ArrowRight, Zap, BarChart3, Cloud, Filter, Download, Users, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { CityAutocomplete } from "../components/CityAutocomplete";

const heading = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

const body = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

const SAMPLE_LEADS = [
  {
    initials: "PL",
    name: "Prime Line",
    meta: "Vila Mariana · B2B",
    email: "contato@primeline.com",
    phone: "+55 11 91234-7788"
  },
  {
    initials: "NV",
    name: "Nova Vista",
    meta: "Moema · Serviços",
    email: "comercial@novavista.co",
    phone: "+55 11 92345-8899"
  },
  {
    initials: "OT",
    name: "Octane Tech",
    meta: "Pinheiros · SaaS",
    email: "hello@octane.tech",
    phone: "+55 11 93456-9900"
  }
];

const FEATURES_EXTENDED = [
  {
    title: "Dados enriquecidos",
    text: "Fontes públicas completam telefone, e-mail e social.",
    icon: <Cloud className="text-[var(--accent)]" size={20} />
  },
  {
    title: "Filtros precisos",
    text: "Busca por bairro ou KM para refinar a prospecção.",
    icon: <Filter className="text-[var(--accent)]" size={20} />
  },
  {
    title: "Exportação CSV",
    text: "Pronto para importar no seu CRM sem retrabalho.",
    icon: <Download className="text-[var(--accent)]" size={20} />
  },
  {
    title: "Fluxo integrado",
    text: "Mapa e pipeline em um só lugar para o seu time.",
    icon: <Users className="text-[var(--accent)]" size={20} />
  },
  {
    title: "Validação",
    text: "Redução de dados incompletos em tempo real.",
    icon: <CheckCircle className="text-[var(--accent)]" size={20} />
  },
  {
    title: "Métricas",
    text: "Visualize o retorno por segmento e localidade.",
    icon: <SlidersHorizontal className="text-[var(--accent)]" size={20} />
  }
];

const STEPS = [
  {
    title: "Informe o alvo",
    text: "Escolha segmento e local. O motor busca as empresas relevantes."
  },
  {
    title: "Enriqueça rápido",
    text: "Capturamos contatos públicos e organizamos em cards prontos."
  },
  {
    title: "Leve para o CRM",
    text: "Exporte CSV ou sincronize o pipeline para ativar o outbound."
  }
];

const PRICING = [
  {
    name: "Solo",
    price: "R$ 49",
    cadence: "/mês",
    description: "Para consultores e SDRs que querem volume com foco.",
    features: [
      "2.500 leads / mês",
      "Exportação CSV",
      "Dados públicos",
      "Acesso à API"
    ],
    cta: "Começar teste"
  },
  {
    name: "Time",
    price: "R$ 149",
    cadence: "/mês",
    description: "Para equipes que rodam campanhas contínuas.",
    features: [
      "10.000 leads / mês",
      "Integrações com CRM",
      "Dados completos",
      "Suporte prioritário"
    ],
    cta: "Começar agora",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    cadence: "",
    description: "Para operações com SLA e integrações dedicadas.",
    features: [
      "Volume sob medida",
      "Webhooks",
      "Multi-times",
      "Onboarding assistido"
    ],
    cta: "Falar com vendas"
  }
];

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");

  const handleQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window !== "undefined") {
      const payload = {
        q: segment.trim(),
        city: city.trim()
      };
      window.localStorage.setItem("prospect_lead_pending_search", JSON.stringify(payload));
      const rawAuth = window.localStorage.getItem("mapa_b2b_auth");
      if (rawAuth) {
        const params = new URLSearchParams();
        if (payload.q) params.set("q", payload.q);
        if (payload.city) params.set("city", payload.city);
        params.set("auto", "1");
        router.push(`/mapa?${params.toString()}`);
        return;
      }
    }
    router.push("/login");
  };

  return (
    <main className={`min-h-screen bg-[var(--bg)] text-[var(--ink)] ${body.className}`}>
      <section className="relative overflow-hidden">
        <header className="relative z-10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
            <Link href="/" className="group flex items-center gap-3 transition hover:opacity-80">
              <h1 className="text-xl font-bold text-white transition-colors group-hover:text-[var(--accent)]">
                Prospect Lead
              </h1>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
              <Link href="#capacidades" className="rounded-full border border-white/10 px-4 py-2 hover:text-white hover:bg-white/5 transition">
                Recursos
              </Link>
              <Link href="#processo" className="rounded-full border border-white/10 px-4 py-2 hover:text-white hover:bg-white/5 transition">
                Processo
              </Link>
              <Link href="#planos" className="rounded-full border border-white/10 px-4 py-2 hover:text-white hover:bg-white/5 transition">
                Planos
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              {token ? (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[var(--accent)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[var(--accent)]/30 transition hover:brightness-110"
                >
                  Ir para o sistema
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10 transition"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[var(--accent)]/30"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-[var(--accent-2)]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(249,115,22,0.12),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-start">
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--ink-muted)] mb-6">
                Prospect Lead
              </p>
              <h1 className={`mt-6 text-4xl leading-tight md:text-5xl ${heading.className}`}>
                Prospecção local com dados públicos organizados em minutos.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-[var(--ink-muted)]">
                Defina categoria e cidade, deixe o motor buscar, enriquecer e entregar uma lista pronta para contato.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-5 shadow-sm backdrop-blur">
                <form
                  onSubmit={handleQuickSearch}
                  className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] items-end"
                >
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    Segmento
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40"
                      placeholder="Ex: Indústrias de embalagens"
                      value={segment}
                      onChange={(event) => setSegment(event.target.value)}
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Cidade</span>
                    <CityAutocomplete
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40"
                      placeholder="Ex: Curitiba, PR"
                      value={city}
                      onChange={setCity}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/30 transition hover:brightness-110"
                  >
                    <Search size={18} />
                    Buscar
                  </button>
                </form>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)]">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                    <span className="text-[10px]">⌘</span>K para buscar rápido
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    50 leads de demonstração
                  </span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {token ? (
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                  >
                    Ir para o Painel
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                    >
                      Iniciar agora
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/10"
                    >
                      Entrar
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="animate-fade-up rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-6 shadow-lg backdrop-blur" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] uppercase tracking-[0.35em]">
                <span>Painel</span>
                <span>São Paulo, SP</span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-5xl font-semibold text-white">64</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Resultados</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Atualizado
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {SAMPLE_LEADS.map((lead) => (
                  <div key={lead.name} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                      {lead.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{lead.name}</p>
                      <p className="text-xs text-[var(--ink-muted)]">{lead.meta}</p>
                    </div>
                    <div className="text-right text-xs text-[var(--ink-muted)]">
                      <p>{lead.email}</p>
                      <p>{lead.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-4 text-xs text-[var(--ink-muted)] uppercase tracking-[0.4em]">
            <span>Times que confiam</span>
            <span className="rounded-full border border-white/10 px-4 py-2">ACME</span>
            <span className="rounded-full border border-white/10 px-4 py-2">GlobalTech</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Nexus</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Stratos</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Lumina</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Sem motor</p>
            <h2 className={`mt-4 text-2xl ${heading.className}`}>Pesquisa manual trava o ritmo.</h2>
            <div className="mt-6 space-y-3 text-sm text-[var(--ink-muted)]">
              <p>Mapas em abas, contatos dispersos e planilhas incompletas.</p>
              <p>Resultado: baixa cobertura e follow-up lento.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--ink-muted)]">
              Média: 1-2 horas para fechar 50 leads.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Com o Prospect Lead</p>
            <h2 className={`mt-4 text-2xl ${heading.className}`}>Entrega rápida e organizada.</h2>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--ink-muted)]">
              <span>embalagens industriais · Curitiba PR</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                2.8s <CheckCircle size={14} />
              </span>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[var(--ink-muted)]">
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2">
                <span>Studio Norte</span>
                <span>hi@studionorte.com</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2">
                <span>Atlas Pack</span>
                <span>comercial@atlaspack.co</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2">
                <span>Volta Labs</span>
                <span>oi@voltalabs.io</span>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--ink-muted)]">
              Resultado: 200+ leads prontos para CRM.
            </div>
          </div>
        </div>
      </section>

      <section id="capacidades" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Capacidades</p>
            <h2 className={`mt-4 text-3xl ${heading.className}`}>Um motor, vários atalhos.</h2>
          </div>
          <Link
            href="/crm"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10 transition"
          >
            Conectar com CRM
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES_EXTENDED.map((feature: any) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-6 transition hover:bg-[var(--surface)] hover:border-[var(--accent)]/30 group">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:bg-[var(--accent)]/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="processo" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Processo</p>
            <h2 className={`mt-4 text-3xl ${heading.className}`}>Três passos, um pipeline.</h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              O Prospect Lead deixa a pesquisa pronta para ação comercial.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Status</p>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10">
              <div className="h-2 w-[68%] rounded-full bg-[var(--accent)]" />
            </div>
            <p className="mt-3 text-xs text-[var(--ink-muted)]">Enriquecendo 142 leads</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                Etapa {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Planos</p>
            <h2 className={`mt-4 text-3xl ${heading.className}`}>Pague pelo volume que usar.</h2>
          </div>
          <p className="text-sm text-[var(--ink-muted)]">Sem taxa por assento.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-6 ${plan.highlight ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/10 bg-[var(--surface)]/70"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                {plan.highlight && (
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-semibold text-white">{plan.price}</span>
                <span className="text-sm text-[var(--ink-muted)]">{plan.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-muted)]">{plan.description}</p>
              <div className="mt-5 space-y-2 text-sm text-[var(--ink-muted)]">
                {plan.features.map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="rounded-3xl border border-white/10 bg-[var(--surface)]/80 p-10 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--ink-muted)]">Comece agora</p>
          <h2 className={`mt-4 text-3xl ${heading.className}`}>Chega de planilha solta.</h2>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Prospecção local organizada, pronta para o CRM.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/30 transition hover:brightness-110"
            >
              Criar conta
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-white/10 transition"
            >
              Ver exemplo
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            Dados públicos enriquecidos · Sem cartão de crédito
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 md:grid-cols-[1.3fr_1fr_1fr] text-sm text-[var(--ink-muted)]">
          <div>
            <p className={`text-lg text-white ${heading.className}`}>Prospect Lead</p>
            <p className="mt-4">
              Prospecção local com dados públicos organizados para o time comercial.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Produto</p>
            <div className="mt-3 space-y-2">
              <p>Recursos</p>
              <p>Integrações CRM</p>
              <p>Preços</p>
              <p>API</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">Empresa</p>
            <div className="mt-3 space-y-2">
              <p>Sobre</p>
              <p>Privacidade</p>
              <p>Termos</p>
              <p>Contato</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
