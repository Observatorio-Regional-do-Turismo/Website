"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import axios from "axios";
import { loginManager, getManagerSession } from "@/lib/manager-api";
import { Header } from "@/components/Header";

export default function AcessoPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getManagerSession()
      .then(() => router.replace("/gestao"))
      .catch(() => undefined);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginManager(username.trim(), password);
      router.replace("/gestao");
    } catch (requestError) {
      const message = axios.isAxiosError<{ detail?: string }>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      setError(message || "Não foi possível entrar. Verifique suas credenciais e tente novamente.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Header
        imageSrc="/images/sul_de_minas_bg.jpg"
        imageAlt="Paisagem panorâmica do Sul de Minas Gerais"
      />
      <section className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12 sm:px-6">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-9">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-[#1D5C1B]">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Acesso de gestores</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use o usuário e a senha fornecidos pela equipe do Observatório.
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">
              Usuário
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Senha
              <input
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
              />
            </label>
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5C1B] px-4 py-3 font-bold text-white transition hover:bg-[#287524] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submitting ? "Verificando..." : "Entrar"}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">
            Contas são criadas manualmente pela equipe.{" "}
            <Link href="/fale-conosco" className="font-semibold text-[#1D5C1B] hover:underline">
              Fale conosco
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
