"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatarPIB, formatarPopulacao } from "@/lib/formatters";
import { getCoverImage, stripHtml } from "@/lib/utils";

export interface MapLayerVisibility {
  cidades: boolean;
  pontos: boolean;
  estabelecimentos: boolean;
  eventos: boolean;
}

interface InteractiveMapProps {
  cidades: ApiMapaCidade[];
  pontos: ApiPontoTuristico[];
  eventos: ApiEventos[];
  estabelecimentos: ApiEstabelecimentoGeo[];
  layers: MapLayerVisibility;
  focusTarget?: { lat: number; lon: number; zoom?: number } | null;
  alwaysShowDetails?: boolean;
  onZoomChange?: (zoom: number) => void;
  onSelectCidade?: (slug: string) => void;
}

const DETAIL_ZOOM_THRESHOLD = 11;

function createPinIcon(color: string, label: string, size: "lg" | "sm" = "sm") {
  const dim = size === "lg" ? 30 : 24;
  return L.divIcon({
    className: "custom-ort-pin",
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim],
    popupAnchor: [0, -dim + 2],
    html: `<div style="width:${dim}px;height:${dim}px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.32);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:${size === "lg" ? 11 : 10}px;font-family:system-ui,sans-serif;">${label}</div>`,
  });
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function InteractiveMap({
  cidades,
  pontos,
  eventos,
  estabelecimentos,
  layers,
  focusTarget,
  alwaysShowDetails = false,
  onZoomChange,
  onSelectCidade,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const cityLayerRef = useRef<L.LayerGroup | null>(null);
  const detailLayerRef = useRef<L.LayerGroup | null>(null);
  const zoomRef = useRef<number>(8);
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const initialCitiesRef = useRef(cidades);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const validCities = initialCitiesRef.current.filter(
      (c) => c.latitude !== null && c.longitude !== null,
    );
    const initialCenter: [number, number] =
      validCities.length > 0
        ? [Number(validCities[0].latitude), Number(validCities[0].longitude)]
        : [-21.7878, -46.5613];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 8,
      minZoom: 5,
      maxZoom: 18,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    cityLayerRef.current = L.layerGroup().addTo(map);
    detailLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (validCities.length > 1) {
      const bounds = L.latLngBounds(
        validCities.map((c) => [Number(c.latitude), Number(c.longitude)] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }

    zoomRef.current = map.getZoom();
    onZoomChangeRef.current?.(zoomRef.current);

    const handleZoom = () => {
      const z = map.getZoom();
      zoomRef.current = z;
      onZoomChangeRef.current?.(z);
    };

    map.on("zoomend", handleZoom);

    return () => {
      map.off("zoomend", handleZoom);
      map.remove();
      mapRef.current = null;
      cityLayerRef.current = null;
      detailLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    map.flyTo([focusTarget.lat, focusTarget.lon], focusTarget.zoom ?? 13, { duration: 0.7 });
  }, [focusTarget]);

  useEffect(() => {
    const map = mapRef.current;
    const cityLayer = cityLayerRef.current;
    const detailLayer = detailLayerRef.current;
    if (!map || !cityLayer || !detailLayer) return;

    const renderMarkers = () => {
      const currentZoom = map.getZoom();
      const showDetails = alwaysShowDetails || currentZoom >= DETAIL_ZOOM_THRESHOLD;

      cityLayer.clearLayers();
      detailLayer.clearLayers();

      if (layers.cidades) {
        cidades.forEach((cidade) => {
          if (cidade.latitude === null || cidade.longitude === null) return;
          const marker = L.marker([Number(cidade.latitude), Number(cidade.longitude)], {
            icon: createPinIcon("#1D5C1B", "C", showDetails ? "sm" : "lg"),
          });

          const popupEl = document.createElement("div");
          popupEl.className = "min-w-[220px] space-y-1.5 text-xs text-slate-700";
          popupEl.innerHTML = `
            <div style="font-weight:800;font-size:14px;color:#1D5C1B;">${escapeHtml(cidade.name)}</div>
            ${cidade.igr_name ? `<div style="color:#287524;font-weight:600;">${escapeHtml(cidade.igr_name)}</div>` : ""}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;">
              <div><strong>Pop.:</strong> ${escapeHtml(formatarPopulacao(cidade.populacao))}</div>
              <div><strong>PIB:</strong> ${escapeHtml(formatarPIB(cidade.pib))}</div>
              <div><strong>Atrativos:</strong> ${cidade.pontos_count}</div>
              <div><strong>Eventos:</strong> ${cidade.eventos_count}</div>
              <div><strong>Hosp.:</strong> ${cidade.hospedagens ?? 0}</div>
              <div><strong>Alim.:</strong> ${cidade.restaurantes ?? 0}</div>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;">
              <button type="button" data-zoom-city="1" style="flex:1;background:#359830;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-weight:700;cursor:pointer;">Aproximar</button>
              <a href="/cidades/${encodeURIComponent(cidade.slug)}" style="flex:1;text-align:center;background:#EAF4E9;color:#1D5C1B;border-radius:6px;padding:5px 8px;font-weight:700;text-decoration:none;">Página</a>
            </div>
          `;

          const zoomBtn = popupEl.querySelector("[data-zoom-city]");
          zoomBtn?.addEventListener("click", () => {
            map.flyTo([Number(cidade.latitude), Number(cidade.longitude)], 13, { duration: 0.7 });
            onSelectCidade?.(cidade.slug);
          });

          marker.bindPopup(popupEl);
          marker.bindTooltip(cidade.name, { direction: "top", offset: [0, -24] });
          marker.addTo(cityLayer);
        });
      }

      // Atrativos turísticos permanecem visíveis sempre que a camada estiver ativa
      if (layers.pontos) {
        pontos.forEach((ponto) => {
          if (
            ponto.latitude === null ||
            ponto.latitude === undefined ||
            ponto.longitude === null ||
            ponto.longitude === undefined
          ) {
            return;
          }
          const marker = L.marker([Number(ponto.latitude), Number(ponto.longitude)], {
            icon: createPinIcon("#2E7D32", "A", ponto.is_featured ? "lg" : "sm"),
          });
          const cover = getCoverImage(ponto.imagens);
          const desc = stripHtml(ponto.description).slice(0, 130);
          marker.bindPopup(`
            <div style="min-width:220px;font-size:12px;color:#334155;">
              ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(ponto.name)}" style="width:100%;height:96px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ""}
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#2E7D32;">
                ${escapeHtml(ponto.category || "Atrativo Turístico")}${ponto.is_featured ? " • Destaque" : ""}
              </div>
              <div style="font-weight:800;font-size:13px;color:#0f172a;margin:2px 0;">${escapeHtml(ponto.name)}</div>
              ${ponto.cidade_name ? `<div style="color:#475569;margin-bottom:4px;">${escapeHtml(ponto.cidade_name)}</div>` : ""}
              ${desc ? `<p style="margin:4px 0;line-height:1.4;">${escapeHtml(desc)}...</p>` : ""}
              <a href="/atrativos/${encodeURIComponent(ponto.slug)}" style="display:inline-block;margin-top:6px;color:#1D5C1B;font-weight:700;text-decoration:none;">Ver atrativo &rarr;</a>
            </div>
          `);
          marker.bindTooltip(`${ponto.name}${ponto.cidade_name ? ` — ${ponto.cidade_name}` : ""}`, {
            direction: "top",
            offset: [0, -20],
          });
          marker.addTo(detailLayer);
        });
      }

      if (!showDetails) return;

      if (layers.estabelecimentos) {
        estabelecimentos.forEach((est) => {
          const isFood = est.categoria.toLowerCase().includes("aliment");
          const color = isFood ? "#E65100" : "#1976D2";
          const marker = L.marker([Number(est.latitude), Number(est.longitude)], {
            icon: createPinIcon(color, isFood ? "R" : "H", "sm"),
          });
          marker.bindPopup(`
            <div style="min-width:200px;font-size:12px;color:#334155;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:${color};">${escapeHtml(est.categoria)}</div>
              <div style="font-weight:800;font-size:13px;color:#0f172a;margin:2px 0;">${escapeHtml(est.nome)}</div>
              ${est.cidade_name ? `<div style="color:#475569;">${escapeHtml(est.cidade_name)}</div>` : ""}
              ${est.endereco ? `<div style="color:#64748b;margin-top:4px;">${escapeHtml(est.endereco)}</div>` : ""}
              ${est.telefone ? `<div style="color:#1D5C1B;font-weight:600;margin-top:2px;">${escapeHtml(est.telefone)}</div>` : ""}
              <a href="/atrativos" style="display:inline-block;margin-top:6px;color:${color};font-weight:700;text-decoration:none;">Ver catálogo &rarr;</a>
            </div>
          `);
          marker.bindTooltip(`${est.nome} (${est.categoria})`, {
            direction: "top",
            offset: [0, -20],
          });
          marker.addTo(detailLayer);
        });
      }

      if (layers.eventos) {
        eventos.forEach((evento) => {
          if (
            evento.latitude === null ||
            evento.latitude === undefined ||
            evento.longitude === null ||
            evento.longitude === undefined
          ) {
            return;
          }
          const marker = L.marker([Number(evento.latitude), Number(evento.longitude)], {
            icon: createPinIcon("#C90C0F", "E", "sm"),
          });
          marker.bindPopup(`
            <div style="min-width:200px;font-size:12px;color:#334155;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#C90C0F;">Evento</div>
              <div style="font-weight:800;font-size:13px;color:#0f172a;margin:2px 0;">${escapeHtml(evento.name)}</div>
              ${evento.cidade_name ? `<div style="color:#475569;">${escapeHtml(evento.cidade_name)}</div>` : ""}
              <a href="/eventos?id=${encodeURIComponent(String(evento.id))}" style="display:inline-block;margin-top:6px;color:#359830;font-weight:700;text-decoration:none;">Ver na agenda &rarr;</a>
            </div>
          `);
          marker.bindTooltip(evento.name, { direction: "top", offset: [0, -20] });
          marker.addTo(detailLayer);
        });
      }
    };

    renderMarkers();
    map.on("zoomend", renderMarkers);
    return () => {
      map.off("zoomend", renderMarkers);
    };
  }, [cidades, pontos, eventos, estabelecimentos, layers, alwaysShowDetails, onSelectCidade]);

  return <div ref={containerRef} className="w-full h-[65vh] min-h-[460px] rounded-2xl z-10" />;
}
