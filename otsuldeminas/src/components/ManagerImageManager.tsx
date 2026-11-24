"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import {
  deleteManagerImage,
  ManagerImagem,
  ManagerTargetType,
  setCoverManagerImage,
  uploadManagerImage,
} from "@/lib/manager-api";

interface ManagerImageManagerProps {
  targetType: ManagerTargetType;
  targetId: number;
  images: ManagerImagem[];
  onChanged: (images: ManagerImagem[]) => void;
  title?: string;
}

export function ManagerImageManager({
  targetType,
  targetId,
  images,
  onChanged,
  title = "Galeria de Imagens",
}: ManagerImageManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [isCover, setIsCover] = useState(images.length === 0);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("target_type", targetType);
      formData.append("target_id", String(targetId));
      formData.append("image", file);
      if (altText.trim()) formData.append("alt_text", altText.trim());
      if (caption.trim()) formData.append("caption", caption.trim());
      formData.append("is_cover", String(isCover));
      formData.append("order", String(images.length));

      const created = await uploadManagerImage(formData);
      const updated = isCover
        ? [...images.map((img) => ({ ...img, is_cover: false })), created]
        : [...images, created];
      onChanged(updated);
      setFile(null);
      setAltText("");
      setCaption("");
      setIsCover(false);
    } catch {
      setError("Não foi possível enviar a imagem. Verifique o formato e tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = async (imageId: number) => {
    setBusyId(imageId);
    setError("");
    try {
      const updatedImg = await setCoverManagerImage(imageId);
      onChanged(
        images.map((img) => ({
          ...img,
          is_cover: img.id === updatedImg.id,
        })),
      );
    } catch {
      setError("Erro ao definir a imagem principal.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!window.confirm("Remover esta imagem?")) return;
    setBusyId(imageId);
    setError("");
    try {
      await deleteManagerImage(imageId);
      onChanged(images.filter((img) => img.id !== imageId));
    } catch {
      setError("Erro ao excluir a imagem.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <span className="text-xs font-semibold text-slate-500">
          {images.length} {images.length === 1 ? "imagem" : "imagens"}
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
            >
              <div className="h-24 bg-slate-100">
                <img
                  src={img.image}
                  alt={img.alt_text || img.caption || "Imagem"}
                  className="w-full h-full object-cover"
                />
              </div>
              {img.is_cover && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-[#1D5C1B] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                  Capa
                </span>
              )}
              <div className="p-2 flex items-center justify-between gap-1 text-[11px]">
                {!img.is_cover ? (
                  <button
                    type="button"
                    disabled={busyId === img.id}
                    onClick={() => handleSetCover(img.id)}
                    className="font-semibold text-[#1D5C1B] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Definir capa
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">Principal</span>
                )}
                <button
                  type="button"
                  disabled={busyId === img.id}
                  onClick={() => handleDelete(img.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  title="Excluir imagem"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5 border-t border-slate-200 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#1D5C1B] hover:file:bg-emerald-100"
          />
          <input
            type="text"
            placeholder="Legenda opcional"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#359830]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Texto alternativo (SEO)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#359830]"
            />
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isCover}
                onChange={(e) => setIsCover(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#1D5C1B]"
              />
              Definir como capa
            </label>
          </div>

          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5C1B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#287524] disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Enviar imagem
          </button>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}
