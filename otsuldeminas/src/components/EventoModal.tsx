"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Share2,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";

interface EventoModalProps {
  evento: ApiEventos | null;
  onClose: () => void;
}

function formatFullDate(value?: string) {
  if (!value) return "Data a definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value?: string) {
  if (!value) return "A definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "A definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function EventoModal({ evento, onClose }: EventoModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [eventoDetalhesApi, setEventoDetalhesApi] = useState<ApiEventos | null>(null);

  // Carregar detalhes adicionais caso a API forneça endpoint específico /eventos/{id}/
  useEffect(() => {
    let active = true;
    setEventoDetalhesApi(null);
    setSelectedImageIndex(0);
    setImageError(false);

    if (!evento?.id) return;

    try {
      const baseUrl = getWebsiteApiBaseUrl();
      axios
        .get<ApiEventos>(`${baseUrl}/eventos/${encodeURIComponent(evento.id)}/`)
        .then((response) => {
          if (active && response?.data) {
            setEventoDetalhesApi(response.data);
          }
        })
        .catch(() => {
          // Mantém os dados já recebidos na lista
        });
    } catch {
      // Ignora erro de base url
    }

    return () => {
      active = false;
    };
  }, [evento?.id]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bloqueio de scroll no body quando o modal estiver aberto
  useEffect(() => {
    if (evento) {
      document.body.style.overflow = "hidden";
      setImageError(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [evento]);

  const currentEvento = eventoDetalhesApi || evento;

  const imagesList = useMemo(() => {
    if (!currentEvento) return [];
    const list = currentEvento.imagens && Array.isArray(currentEvento.imagens) ? [...currentEvento.imagens] : [];
    // Ordena colocando a imagem de capa em primeiro
    list.sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
    return list;
  }, [currentEvento]);

  if (!currentEvento) return null;

  const activeImage = imagesList[selectedImageIndex]?.image || imagesList[0]?.image;

  // Status do evento
  const now = Date.now();
  const start = currentEvento.start_date ? new Date(currentEvento.start_date).getTime() : NaN;
  const end = currentEvento.end_date ? new Date(currentEvento.end_date).getTime() : start;
  const isPast = !Number.isNaN(end) && end < now;
  const isOngoing = !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;

  // Endereço e contatos
  const addressContato = currentEvento.contatos?.find((c) => c.address || c.label);
  const locationText = addressContato?.address || addressContato?.label || currentEvento.cidade_name || "Sul de Minas Gerais";

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${locationText}${currentEvento.cidade_name ? `, ${currentEvento.cidade_name}` : ""}, Minas Gerais`
  )}`;

  // Link para Adicionar ao Google Agenda
  const googleCalendarUrl = (() => {
    if (!currentEvento.start_date) return null;
    const formatIsoForCal = (dateStr?: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const startIso = formatIsoForCal(currentEvento.start_date);
    if (!startIso) return null;

    let endIso = currentEvento.end_date ? formatIsoForCal(currentEvento.end_date) : "";
    if (!endIso) {
      const d = new Date(currentEvento.start_date);
      d.setHours(d.getHours() + 3);
      endIso = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    }

    const cleanDesc = (currentEvento.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const titleParam = encodeURIComponent(currentEvento.name);
    const detailsParam = encodeURIComponent(cleanDesc);
    const locationParam = encodeURIComponent(locationText);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleParam}&dates=${startIso}/${endIso}&details=${detailsParam}&location=${locationParam}`;
  })();

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasHtml = currentEvento.description && /<[a-z][\s\S]*>/i.test(currentEvento.description);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Botão Fechar Flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-[#C90C0F] backdrop-blur-md transition-all shadow-lg focus:outline-none"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero / Imagem de Capa do Evento */}
        <div className="relative h-60 sm:h-80 w-full bg-slate-900 shrink-0 overflow-hidden">
          {!imageError && activeImage ? (
            <img
              src={activeImage}
              alt={currentEvento.name}
              className="w-full h-full object-cover object-center brightness-95"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1D5C1B] to-[#287524] text-white p-6 text-center">
              <CalendarDays className="h-16 w-16 text-white/40 mb-2" />
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-200">
                Observatório de Turismo
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges de Status e Localidade sobre a Imagem */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center gap-2">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Acontecendo agora
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                Encerrado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#359830] text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                <Sparkles className="h-3.5 w-3.5" /> Programado
              </span>
            )}

            {currentEvento.cidade_name && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-xs font-bold border border-white/10">
                <MapPin className="h-3 w-3 text-[#C90C0F]" />
                {currentEvento.cidade_name}
              </span>
            )}
          </div>

          {/* Navegação entre fotos caso haja múltiplas imagens */}
          {imagesList.length > 1 && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md text-white rounded-full px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1))
                }
                className="p-1 hover:text-emerald-300 transition-colors"
                title="Imagem anterior"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-semibold px-1">
                {selectedImageIndex + 1}/{imagesList.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0))
                }
                className="p-1 hover:text-emerald-300 transition-colors"
                title="Próxima imagem"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Miniaturas de Fotos se houver múltiplas */}
        {imagesList.length > 1 && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
            {imagesList.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative h-14 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  selectedImageIndex === idx
                    ? "border-[#359830] ring-2 ring-[#359830]/40 scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img.image} alt={img.caption || `Foto ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo Rolável do Evento */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Barra de Ações Rápidas: Compartilhar & Adicionar à Agenda */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-100 pb-4">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1D5C1B]">
              <Calendar className="h-4 w-4 text-[#359830]" />
              Agenda de Eventos Regional
            </span>

            <div className="flex items-center gap-2">
              {googleCalendarUrl && (
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#1D5C1B] hover:bg-emerald-100 text-xs font-semibold transition-colors"
                  title="Salvar evento na sua conta Google Agenda"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-[#359830]" />
                  <span>Google Agenda</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Copiar link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#359830]" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? "Copiado!" : "Compartilhar"}</span>
              </button>
            </div>
          </div>

          {/* Nome / Título do Evento */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
              {currentEvento.name}
            </h2>
          </div>

          {/* Painel de Horário e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card de Data e Horário */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF4E9] text-[#1D5C1B] flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-[#359830]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Data e Horário
                  </span>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">
                    {formatFullDate(currentEvento.start_date)}
                  </p>
                  {currentEvento.end_date && (
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Até {formatShortDate(currentEvento.end_date)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card de Localização */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C90C0F] flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Local do Evento
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                    {currentEvento.cidade_name || "Município a confirmar"}
                  </p>
                  {addressContato?.address && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {addressContato.address}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#359830] hover:text-[#1D5C1B] transition-colors self-start"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Descrição Completa do Evento */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1D5C1B]">
              Sobre o evento
            </h3>
            {currentEvento.description ? (
              <div className="prose prose-slate max-w-none text-sm sm:text-base text-slate-600 leading-relaxed">
                {hasHtml ? (
                  <div
                    className="text-justify"
                    dangerouslySetInnerHTML={{ __html: currentEvento.description }}
                  />
                ) : (
                  <div className="space-y-3 text-justify">
                    {currentEvento.description
                      .split("\n\n")
                      .filter((p) => p.trim())
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Nenhuma descrição detalhada informada pelos organizadores.
              </div>
            )}
          </div>

          {/* Seção de Contatos e Informações Turísticas do Evento */}
          {currentEvento.contatos && currentEvento.contatos.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1D5C1B]">
                Informações e Atendimento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentEvento.contatos.map((contato) => {
                  const typeLower = (contato.type || "").toLowerCase();
                  const isEmail = typeLower.includes("email") || (contato.value && contato.value.includes("@"));
                  const isPhone = typeLower.includes("tel") || typeLower.includes("cel") || typeLower.includes("fone") || typeLower.includes("whats");
                  const isWeb = typeLower.includes("site") || typeLower.includes("link") || typeLower.includes("web") || typeLower.includes("insta");

                  return (
                    <div
                      key={contato.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-[#359830] shrink-0">
                        {isEmail ? (
                          <Mail className="h-4 w-4 text-[#C90C0F]" />
                        ) : isWeb ? (
                          <Globe className="h-4 w-4 text-[#359830]" />
                        ) : isPhone ? (
                          <Phone className="h-4 w-4 text-[#359830]" />
                        ) : (
                          <MapPin className="h-4 w-4 text-[#C90C0F]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase text-slate-500">
                          {contato.type_display || contato.label || contato.type || "Contato"}
                        </span>
                        {contato.value && (
                          <p className="text-sm font-semibold text-slate-800 break-words mt-0.5">
                            {isEmail ? (
                              <a href={`mailto:${contato.value}`} className="hover:text-[#359830] underline underline-offset-2">
                                {contato.value}
                              </a>
                            ) : isPhone ? (
                              <a href={`tel:${contato.value.replace(/\D/g, "")}`} className="hover:text-[#359830]">
                                {contato.value}
                              </a>
                            ) : isWeb ? (
                              <a
                                href={contato.value.startsWith("http") ? contato.value : `https://${contato.value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-[#359830] underline underline-offset-2"
                              >
                                {contato.value}
                                <ExternalLink className="h-3 w-3 inline" />
                              </a>
                            ) : (
                              contato.value
                            )}
                          </p>
                        )}
                        {contato.address && (
                          <p className="text-xs text-slate-500 mt-0.5">{contato.address}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Observatório de Turismo do Sul de Minas Gerais</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#359830] text-white font-bold rounded-xl hover:bg-[#1D5C1B] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
