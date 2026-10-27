import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { InscricaoGestorForm } from "@/components/InscricaoGestorForm";

export default function FaleConoscoPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Header
        imageSrc="/images/sul_de_minas_bg.jpg"
        imageAlt="Paisagem panorâmica do Sul de Minas Gerais"
      />

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 text-center">
        {/* Ícone e Título Institucional */}
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-[#1D5C1B]">
          <Mail className="h-7 w-7" />
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Fale conosco</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Entre em contato com a equipe do Observatório Regional do Turismo para dúvidas,
          sugestões, envio de dados ou solicitação de acesso para gestão municipal.
        </p>

        {/* Card de Gestores Cadastrados */}
        <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <p className="font-semibold text-slate-800">Já possui conta de gestor?</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            O acesso ao painel de publicação é liberado para gestores de municípios e IGRs cadastrados pela coordenação.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Área de gestão protegida por autenticação.
          </p>
        </div>

        {/* Opção de Entrar / Login */}
        <Link
          href="/acesso"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D5C1B] px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#287524] focus:outline-none focus:ring-2 focus:ring-[#359830]/50 focus:ring-offset-2"
        >
          Login / Acesso
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Separador Visual */}
        <div className="relative my-12 w-full flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-slate-50 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Ainda não tem acesso? Solicite abaixo
          </span>
        </div>

        {/* Formulário de Inscrição e Cadastro de Gestor */}
        <div className="w-full">
          <InscricaoGestorForm />
        </div>
      </section>
    </main>
  );
}
