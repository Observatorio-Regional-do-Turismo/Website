import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart2,
  Building2,
  CalendarDays,
  Compass,
  Globe,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  Maximize2,
  Newspaper,
  Phone,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ImageGalleryCarousel } from "@/components/ImageGalleryCarousel";
import { RichTextContent } from "@/components/RichTextContent";
import { ShareButton } from "@/components/ShareButton";
import {
  formatarArea,
  formatarDataCurta,
  formatarDataHoraCurta,
  formatarDensidade,
  formatarEscolarizacao,
  formatarHospedagem,
  formatarIDH,
  formatarMUNIC,
  formatarNumero,
  formatarPIB,
  formatarPIBPerCapita,
  formatarPNAD,
  formatarPopulacao,
  formatarRestaurantes,
  formatarSalariosMinimos,
} from "@/lib/formatters";
import { fetchServerEntityBySlugOrId, fetchServerListSafe } from "@/lib/website-api";
import { getCoverImage, stripHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CidadeDetalhada extends ApiCidade {
  pontos_turisticos?: ApiPontoTuristico[];
  eventos?: ApiEventos[];
}

function hasValue(val: unknown): boolean {
  return val !== null && val !== undefined && String(val).trim() !== "";
}

export default async function CidadeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const baseCidade = await fetchServerEntityBySlugOrId<ApiCidade>("cidades", slug);
  if (!baseCidade) {
    notFound();
  }

  const cityIdParam = encodeURIComponent(String(baseCidade.id));
  const [detailedOrNull, noticiasDaCidade, pontos, eventos] = await Promise.all([
    fetchServerEntityBySlugOrId<CidadeDetalhada>("cidades", String(baseCidade.id)),
    fetchServerListSafe<ApiNoticia>(`noticias/?cidade=${cityIdParam}`),
    fetchServerListSafe<ApiPontoTuristico>(`pontos-turisticos/?cidade=${cityIdParam}`),
    fetchServerListSafe<ApiEventos>(`eventos/?cidade=${cityIdParam}`),
  ]);
  const detailedCidade = detailedOrNull || (baseCidade as CidadeDetalhada);

  const info = detailedCidade.information;
  const indicadores = [
    { label: "População (Censo)", value: formatarPopulacao(info?.populacao), icon: Users },
    {
      label: "População Estimada",
      value: formatarPopulacao(info?.populacao_estimada),
      icon: Users,
    },
    { label: "PIB Municipal", value: formatarPIB(info?.pib), icon: TrendingUp },
    { label: "PIB per Capita", value: formatarPIBPerCapita(info?.pib_per_capta), icon: TrendingUp },
    { label: "VAB Serviços", value: formatarPIB(info?.vab_servicos), icon: BarChart2 },
    { label: "IDHM", value: formatarIDH(info?.idhm ?? info?.idh), icon: Award },
    {
      label: "Hospedagem",
      value: hasValue(info?.hospedagens) ? `${formatarHospedagem(info?.hospedagens)} estab.` : null,
      icon: Building2,
    },
    { label: "Leitos", value: formatarNumero(info?.leitos), icon: Building2 },
    {
      label: "Alimentação",
      value: hasValue(info?.restaurantes)
        ? `${formatarRestaurantes(info?.restaurantes)} unid.`
        : null,
      icon: UtensilsCrossed,
    },
    {
      label: "Cultura & Lazer",
      value: formatarNumero(info?.unidades_cultura_lazer),
      icon: Compass,
    },
    {
      label: "Empresas Atuantes",
      value: formatarNumero(info?.empresas_atuantes),
      icon: Building2,
    },
    {
      label: "Pessoal Ocupado",
      value: formatarNumero(info?.pessoal_ocupado),
      icon: Users,
    },
    {
      label: "Salário Médio",
      value: formatarSalariosMinimos(info?.salario_medio_mensal),
      icon: Award,
    },
    {
      label: "Área Territorial",
      value: formatarArea(info?.area_territorial ?? info?.area),
      icon: Maximize2,
    },
    {
      label: "Densidade Demográfica",
      value: formatarDensidade(info?.densidade_demografica ?? info?.densidade),
      icon: Layers,
    },
    {
      label: "Escolarização",
      value: formatarEscolarizacao(info?.escolarizacao ?? info?.taxa_escolarizacao),
      icon: GraduationCap,
    },
    {
      label: "Indicador MUNIC",
      value: formatarMUNIC(info?.indicador_cultural_munic ?? info?.munic),
      icon: Award,
    },
    {
      label: "Indicador PNAD",
      value: formatarPNAD(info?.estatistica_pnad ?? info?.pnad),
      icon: BarChart2,
    },
  ].filter((item) => Boolean(item.value));

  const contatos = detailedCidade.contatos || [];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge={`${detailedCidade.state_name || "Minas Gerais"}${detailedCidade.igr_name ? ` • ${detailedCidade.igr_name}` : ""}`}
        title={detailedCidade.name}
        subtitle="Panorama turístico, galeria de imagens, indicadores socioeconômicos do IBGE e agenda municipal."
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/cidades"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar às cidades
            </Link>
            {Array.isArray(detailedCidade.igrs) && detailedCidade.igrs.length > 0
              ? detailedCidade.igrs.map((igrItem) => (
                  <Link
                    key={igrItem.id}
                    href={`/selos?id=${encodeURIComponent(String(igrItem.id))}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-[#1D5C1B] hover:bg-emerald-100 transition-colors"
                  >
                    <Layers className="h-4 w-4" />
                    {igrItem.name}
                  </Link>
                ))
              : detailedCidade.igr && (
                  <Link
                    href={`/selos?id=${encodeURIComponent(String(detailedCidade.igr))}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-[#1D5C1B] hover:bg-emerald-100 transition-colors"
                  >
                    <Layers className="h-4 w-4" />
                    {detailedCidade.igr_name || "Ver IGR"}
                  </Link>
                )}
          </div>

          <ShareButton path={`/cidades/${encodeURIComponent(detailedCidade.slug)}`} />
        </div>

        {/* Carrossel de Imagens da Cidade + Apresentação */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <ImageGalleryCarousel
            imagens={detailedCidade.imagens}
            title={detailedCidade.name}
            heightClass="h-72 sm:h-96 lg:h-[480px]"
            fallbackIcon={<Building2 className="h-16 w-16 text-white/40 mb-2" />}
            fallbackSubtitle={detailedCidade.state_name || "Município Integrado"}
          >
            <div className="absolute bottom-5 left-5 right-5 sm:left-8 sm:right-8 z-20 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                  {detailedCidade.state_name || "Minas Gerais"}
                </span>
                {detailedCidade.ibge_code && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/55 text-slate-200 text-xs font-medium backdrop-blur-md">
                    Código IBGE: {detailedCidade.ibge_code}
                  </span>
                )}
              </div>
            </div>
          </ImageGalleryCarousel>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Sobre {detailedCidade.name}</h2>
              <RichTextContent
                html={detailedCidade.description}
                fallback="Apresentação do município em atualização pela gestão local."
              />
            </div>

            {contatos.length > 0 && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contatos.map((contato) => {
                  const icon =
                    contato.type === "phone" || contato.type === "whatsapp" ? (
                      <Phone className="h-4 w-4 text-[#1D5C1B] shrink-0" />
                    ) : contato.type === "email" ? (
                      <Mail className="h-4 w-4 text-[#1D5C1B] shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-[#1D5C1B] shrink-0" />
                    );
                  return (
                    <div
                      key={contato.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-slate-700"
                    >
                      {icon}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          {contato.label || contato.type_display}
                        </p>
                        <p className="font-medium truncate">{contato.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Indicadores IBGE */}
        {indicadores.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Indicadores Socioeconômicos & Turísticos (IBGE)
              </h2>
              <Link
                href={`/cidades?id=${encodeURIComponent(String(detailedCidade.id))}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1D5C1B] hover:underline"
              >
                Abrir painel analítico interativo
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {indicadores.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-[#EAF4E9]/50 rounded-xl p-3.5 border border-[#5BAF56]/30 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1D5C1B] uppercase">
                      {label}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-[#359830] shrink-0" />
                  </div>
                  <span className="text-base font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Atrativos Turísticos da Cidade */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#1D5C1B]" />
              Atrativos Turísticos em {detailedCidade.name}
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {pontos.length} {pontos.length === 1 ? "atrativo" : "atrativos"}
            </span>
          </div>

          {pontos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Nenhum ponto turístico cadastrado para este município até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {pontos.map((ponto) => {
                const cover = getCoverImage(ponto.imagens);
                return (
                  <Link
                    key={ponto.id}
                    href={`/atrativos/${encodeURIComponent(ponto.slug)}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-44 bg-slate-100 overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={ponto.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1D5C1B] to-[#2b7a29] text-white">
                          <Compass className="h-10 w-10 opacity-50" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-[#1D5C1B] transition-colors">
                          {ponto.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {stripHtml(ponto.description) || "Ponto turístico local."}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#1D5C1B] mt-3 inline-flex items-center gap-1">
                        Ver atrativo <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Eventos & Notícias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#1D5C1B]" />
                Agenda de Eventos
              </h2>
              <span className="text-xs font-semibold text-slate-500">{eventos.length} eventos</span>
            </div>

            {eventos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
                Sem eventos cadastrados no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/eventos?id=${encodeURIComponent(String(ev.id))}`}
                    className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{ev.name}</h3>
                      <span className="text-xs font-semibold text-[#1D5C1B] shrink-0">
                        {formatarDataCurta(ev.start_date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {stripHtml(ev.description)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#1D5C1B]" />
                Notícias de {detailedCidade.name}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {noticiasDaCidade.length} publicações
              </span>
            </div>

            {noticiasDaCidade.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
                Nenhuma notícia publicada especificamente para este município.
              </div>
            ) : (
              <div className="space-y-3">
                {noticiasDaCidade.map((noticia) => (
                  <Link
                    key={noticia.id}
                    href={`/noticias?id=${encodeURIComponent(String(noticia.id))}`}
                    className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{noticia.title}</h3>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {formatarDataHoraCurta(noticia.published_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{noticia.summary}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
