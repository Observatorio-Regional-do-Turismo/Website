import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Compass,
  ExternalLink,
  Globe,
  Layers,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ImageGalleryCarousel } from "@/components/ImageGalleryCarousel";
import { RichTextContent } from "@/components/RichTextContent";
import { ShareButton } from "@/components/ShareButton";
import { fetchServerEntityBySlugOrId, fetchServerListSafe } from "@/lib/website-api";
import { getCoverImage, stripHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AtrativoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const atrativo = await fetchServerEntityBySlugOrId<ApiPontoTuristico>("pontos-turisticos", slug);
  if (!atrativo) {
    notFound();
  }

  const citySpots = atrativo.cidade
    ? await fetchServerListSafe<ApiPontoTuristico>(
        `pontos-turisticos/?cidade=${encodeURIComponent(String(atrativo.cidade))}`,
      )
    : [];
  const otherSpots = citySpots.filter((item) => item.id !== atrativo.id).slice(0, 3);

  const latitude =
    atrativo.latitude !== undefined && atrativo.latitude !== null
      ? Number(atrativo.latitude)
      : null;
  const longitude =
    atrativo.longitude !== undefined && atrativo.longitude !== null
      ? Number(atrativo.longitude)
      : null;
  const hasCoordinates =
    latitude !== null && longitude !== null && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const locationContact = atrativo.contatos?.find((c) => c.type === "location");
  const otherContacts = (atrativo.contatos || []).filter((c) => c.type !== "location");

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header
        badge={atrativo.category || "Atrativo Turístico"}
        title={atrativo.name}
        subtitle={
          atrativo.cidade_name
            ? `${atrativo.cidade_name}${atrativo.igr_name ? ` — ${atrativo.igr_name}` : ""}`
            : "Observatório Regional do Turismo"
        }
      />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/atrativos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Todos os atrativos
            </Link>
            {atrativo.cidade_slug && (
              <Link
                href={`/cidades/${encodeURIComponent(atrativo.cidade_slug)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-[#1D5C1B] hover:bg-emerald-100 transition-colors"
              >
                <Building2 className="h-4 w-4" />
                {atrativo.cidade_name}
              </Link>
            )}
          </div>

          <ShareButton path={`/atrativos/${encodeURIComponent(atrativo.slug)}`} />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <ImageGalleryCarousel
            imagens={atrativo.imagens}
            title={atrativo.name}
            heightClass="h-72 sm:h-96 lg:h-[460px]"
            fallbackIcon={<Compass className="h-16 w-16 text-white/40 mb-2" />}
            fallbackSubtitle={atrativo.category || "Atrativo Turístico"}
          >
            <div className="absolute bottom-5 left-5 right-5 sm:left-8 sm:right-8 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              {atrativo.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Principal Atrativo
                </span>
              )}
              {atrativo.igr_name && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-md">
                  <Layers className="h-3.5 w-3.5 text-emerald-300" />
                  {atrativo.igr_name}
                </span>
              )}
            </div>
          </ImageGalleryCarousel>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Sobre o atrativo</h2>
              <RichTextContent
                html={atrativo.description}
                fallback="Descrição em atualização pelo município responsável."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#1D5C1B]" />
                  Endereço e Localização
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {locationContact?.value ||
                    locationContact?.label ||
                    (atrativo.cidade_name
                      ? `${atrativo.cidade_name} — Minas Gerais`
                      : "Região do Observatório")}
                </p>
                {hasCoordinates && (
                  <div className="pt-1 flex flex-wrap items-center gap-4 text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1D5C1B] hover:underline"
                    >
                      Ver no Google Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-slate-400">
                      Coordenadas: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contatos e Atendimento
                </p>
                {otherContacts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum canal adicional cadastrado para este ponto turístico.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {otherContacts.map((contato) => {
                      const icon =
                        contato.type === "phone" || contato.type === "whatsapp" ? (
                          <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
                        ) : contato.type === "email" ? (
                          <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Globe className="h-4 w-4 text-emerald-700 shrink-0" />
                        );
                      return (
                        <div
                          key={contato.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          {icon}
                          <span className="font-semibold">
                            {contato.label || contato.type_display}:
                          </span>
                          <span>{contato.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {otherSpots.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Outros atrativos em {atrativo.cidade_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {otherSpots.map((spot) => {
                const img = getCoverImage(spot.imagens);
                return (
                  <Link
                    key={spot.id}
                    href={`/atrativos/${encodeURIComponent(spot.slug)}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-40 bg-slate-100 overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={spot.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-900/80 text-white">
                          <Compass className="h-8 w-8 opacity-60" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 group-hover:text-[#1D5C1B] transition-colors line-clamp-1">
                        {spot.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {stripHtml(spot.description) || "Atrativo turístico local."}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
