"use client";

import { useEffect, useState, useId } from "react";
import {
  Building2,
  Layers,
  HeartHandshake,
  CalendarDays,
  Newspaper,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Send,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Info,
  MinusCircle,
} from "lucide-react";
import axios from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";
import { submitInscricao, TipoVinculo, ModuloGestao, InscricaoResponse } from "@/lib/inscricao-api";

// Cidades de referência do Sul de Minas caso a API esteja offline
const DEFAULT_CIDADES = [
  "Alfenas",
  "Andradas",
  "Boa Esperança",
  "Borda da Mata",
  "Brasópolis",
  "Cambuí",
  "Campanha",
  "Carmo de Minas",
  "Caxambu",
  "Conceição dos Ouros",
  "Extrema",
  "Gonçalves",
  "Guaxupé",
  "Itajubá",
  "Itanhandu",
  "Lambari",
  "Lavras",
  "Machado",
  "Monte Sião",
  "Monte Verde (Camanducaia)",
  "Ouro Fino",
  "Passos",
  "Poços de Caldas",
  "Pouso Alegre",
  "Santa Rita do Sapucaí",
  "São Lourenço",
  "Três Corações",
  "Três Pontas",
  "Varginha",
];

// IGRs de referência do Sul de Minas
const DEFAULT_IGRS = [
  "Circuito Turístico das Águas",
  "Circuito Turístico Caminhos Gerais",
  "Circuito Turístico Malhas do Sul de Minas",
  "Circuito Turístico Terras Altas da Mantiqueira",
  "Circuito Turístico Vale Verde e Quedas D'Água",
  "Circuito Turístico Nascentes do Rio Grande",
  "Circuito Turístico Montanhas Cafeeiras de Minas",
  "Circuito Turístico Serras Verdes do Sul de Minas",
];

export function InscricaoGestorForm() {
  const formHeadingId = useId();

  // Estados dos campos de contato e perfil
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [orgao, setOrgao] = useState("");
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>("cidade");
  const [selectedCidade, setSelectedCidade] = useState("");
  const [outraCidade, setOutraCidade] = useState("");
  const [selectedIgr, setSelectedIgr] = useState("");
  const [outraIgr, setOutraIgr] = useState("");
  const [modulos, setModulos] = useState<ModuloGestao[]>(["eventos", "noticias"]);

  // Estados das credenciais de acesso (Login e Senha)
  const [usarMesmoEmail, setUsarMesmoEmail] = useState(true);
  const [emailCadastroCustom, setEmailCadastroCustom] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Informações extras e declaração
  const [justificativa, setJustificativa] = useState("");
  const [declaracaoVeracidade, setDeclaracaoVeracidade] = useState(false);

  // Estados de dados auxiliares (cidades e IGRs da API)
  const [cidadesList, setCidadesList] = useState<string[]>(DEFAULT_CIDADES);
  const [igrsList, setIgrsList] = useState<string[]>(DEFAULT_IGRS);

  // Estados de envio e feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<InscricaoResponse | null>(null);
  const [protocolCopied, setProtocolCopied] = useState(false);

  // Carregar listas da API em paralelo
  useEffect(() => {
    let active = true;

    async function carregarEntidades() {
      try {
        const baseUrl = getWebsiteApiBaseUrl();
        const [cidadesRes, igrsRes] = await Promise.all([
          axios.get(`${baseUrl}/cidades/`, { timeout: 8000 }).catch(() => null),
          axios.get(`${baseUrl}/igrs/`, { timeout: 8000 }).catch(() => null),
        ]);

        if (!active) return;

        if (cidadesRes?.data) {
          const rawCidades = Array.isArray(cidadesRes.data)
            ? cidadesRes.data
            : cidadesRes.data.results || [];
          const nomes = rawCidades
            .map((c: { name?: string }) => c.name?.trim())
            .filter((n?: string): n is string => Boolean(n));
          if (nomes.length > 0) {
            const unique = Array.from(new Set([...nomes, ...DEFAULT_CIDADES])).sort((a, b) =>
              a.localeCompare(b, "pt-BR")
            );
            setCidadesList(unique);
          }
        }

        if (igrsRes?.data) {
          const rawIgrs = Array.isArray(igrsRes.data) ? igrsRes.data : igrsRes.data.results || [];
          const nomes = rawIgrs
            .map((i: { name?: string }) => i.name?.trim())
            .filter((n?: string): n is string => Boolean(n));
          if (nomes.length > 0) {
            const unique = Array.from(new Set([...nomes, ...DEFAULT_IGRS])).sort((a, b) =>
              a.localeCompare(b, "pt-BR")
            );
            setIgrsList(unique);
          }
        }
      } catch {
        // Usa as listas padrão de fallback
      }
    }

    carregarEntidades();
    return () => {
      active = false;
    };
  }, []);

  // Alternar módulos selecionados (permite desmarcar ambos!)
  const toggleModulo = (mod: ModuloGestao) => {
    setModulos((prev) => {
      if (prev.includes(mod)) {
        return prev.filter((m) => m !== mod);
      }
      return [...prev, mod];
    });
  };

  // Selecionar nenhum módulo
  const selectNenhumModulo = () => {
    setModulos([]);
  };

  // Selecionar ambos os módulos
  const selectAmbosModulos = () => {
    setModulos(["eventos", "noticias"]);
  };

  // Máscara de telefone simples
  const handleTelefoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      setTelefone(digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim());
    } else {
      setTelefone(digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim());
    }
  };

  // Email efetivo de login
  const finalEmailCadastro = usarMesmoEmail ? email.trim() : emailCadastroCustom.trim();

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações locais dos campos obrigatórios
    if (!nome.trim() || !email.trim() || !telefone.trim() || !cargo.trim()) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios de contato.");
      return;
    }

    // Validação de credenciais de login e senha
    if (!finalEmailCadastro) {
      setErrorMsg("Por favor, defina o e-mail de login para o cadastro.");
      return;
    }

    if (!senha) {
      setErrorMsg("Por favor, defina a senha desejada para seu acesso de cadastro.");
      return;
    }

    if (senha.length < 6) {
      setErrorMsg("A senha cadastrada deve possuir no mínimo 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMsg("A confirmação da senha não coincide com a senha digitada.");
      return;
    }

    if (!declaracaoVeracidade) {
      setErrorMsg("É necessário marcar o termo de declaração de veracidade das informações.");
      return;
    }

    const finalCidadeNome =
      tipoVinculo === "cidade" || tipoVinculo === "ambas"
        ? selectedCidade === "outro"
          ? outraCidade.trim()
          : selectedCidade
        : undefined;

    const finalIgrNome =
      tipoVinculo === "igr" || tipoVinculo === "ambas"
        ? selectedIgr === "outro"
          ? outraIgr.trim()
          : selectedIgr
        : undefined;

    if ((tipoVinculo === "cidade" || tipoVinculo === "ambas") && !finalCidadeNome) {
      setErrorMsg("Por favor, selecione ou informe o município ao qual você pertence.");
      return;
    }

    if ((tipoVinculo === "igr" || tipoVinculo === "ambas") && !finalIgrNome) {
      setErrorMsg("Por favor, selecione ou informe a IGR à qual você pertence.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitInscricao({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cargo: cargo.trim(),
        orgao: orgao.trim() || "Não informado",
        tipoVinculo,
        cidadeNome: finalCidadeNome,
        igrNome: finalIgrNome,
        modulos,
        emailCadastro: finalEmailCadastro,
        senha,
        justificativa: justificativa.trim() || undefined,
      });

      setSuccessResponse(response);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao enviar a solicitação. Tente novamente mais tarde."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Copiar protocolo para área de transferência
  const handleCopyProtocol = () => {
    if (successResponse?.protocolo && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(successResponse.protocolo);
      setProtocolCopied(true);
      setTimeout(() => setProtocolCopied(false), 2000);
    }
  };

  // Resetar para novo envio
  const handleReset = () => {
    setNome("");
    setEmail("");
    setTelefone("");
    setCargo("");
    setOrgao("");
    setSelectedCidade("");
    setOutraCidade("");
    setSelectedIgr("");
    setOutraIgr("");
    setModulos(["eventos", "noticias"]);
    setUsarMesmoEmail(true);
    setEmailCadastroCustom("");
    setSenha("");
    setConfirmarSenha("");
    setJustificativa("");
    setDeclaracaoVeracidade(false);
    setSuccessResponse(null);
    setErrorMsg(null);
  };

  // Tela de Sucesso após envio
  if (successResponse) {
    return (
      <div className="w-full rounded-3xl border-2 border-emerald-400/80 bg-white p-6 sm:p-10 shadow-2xl shadow-emerald-900/10 text-left animate-in zoom-in-95 duration-200 ring-4 ring-emerald-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-[#1D5C1B] shrink-0">
              <CheckCircle2 className="h-7 w-7 text-[#359830]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#359830]">
                Solicitação Recebida
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Inscrição Enviada para Aprovação!
              </h2>
            </div>
          </div>

          {successResponse.protocolo && (
            <div className="flex items-center gap-2 bg-[#EAF4E9] border border-[#359830]/30 rounded-xl px-3.5 py-2 self-start sm:self-auto">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">
                  Protocolo
                </span>
                <span className="font-mono text-sm font-black text-[#1D5C1B]">
                  {successResponse.protocolo}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyProtocol}
                className="p-1.5 text-[#359830] hover:text-[#1D5C1B] rounded-lg hover:bg-emerald-200/50 transition-colors"
                title="Copiar protocolo"
              >
                {protocolCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="py-6 space-y-4 text-slate-600 text-sm leading-relaxed">
          <p className="font-medium text-slate-800 text-base">
            Obrigado, <strong className="text-[#1D5C1B]">{nome}</strong>! Sua solicitação de cadastro de gestor foi registrada.
          </p>
          <p>
            {successResponse.message}
          </p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Solicitante:
              </span>
              <span className="font-semibold text-slate-800">{nome} ({cargo})</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                E-mail de Login Cadastrado:
              </span>
              <span className="font-semibold text-slate-800">{finalEmailCadastro}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Vínculo Institucional:
              </span>
              <span className="font-semibold text-[#1D5C1B] capitalize">
                {tipoVinculo === "ambas" ? "Cidade e IGR" : tipoVinculo}
                {(selectedCidade || outraCidade) && ` • ${selectedCidade === "outro" ? outraCidade : selectedCidade}`}
                {(selectedIgr || outraIgr) && ` • ${selectedIgr === "outro" ? outraIgr : selectedIgr}`}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Módulos Solicitados:
              </span>
              <span className="font-semibold text-slate-800">
                {modulos.length > 0
                  ? modulos.map((m) => (m === "eventos" ? "Eventos" : "Notícias")).join(" e ")
                  : "Nenhum (Acesso institucional / consulta de indicadores)"}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 text-xs flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-[#359830] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1D5C1B]">Ativação das suas credenciais:</p>
              <p className="mt-0.5">
                Assim que a moderação aceitar a solicitação, sua conta será liberada com o e-mail{" "}
                <strong>{finalEmailCadastro}</strong> e a senha escolhida. Você receberá a confirmação por e-mail.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Enviar outra solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl border-2 border-emerald-500/25 bg-white shadow-xl shadow-emerald-950/5 ring-1 ring-emerald-500/10 p-6 sm:p-10 text-left overflow-hidden">
      {/* Faixa decorativa superior suave */}
      <div className="h-2 w-full bg-gradient-to-r from-[#1D5C1B] via-[#359830] to-[#5BAF56] rounded-t-3xl -mt-6 sm:-mt-10 -mx-6 sm:-mx-10 mb-8" />

      {/* Cabeçalho do Formulário */}
      <div className="border-b border-slate-100 pb-6 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4E9] text-[#1D5C1B] text-xs font-bold uppercase tracking-wider mb-3 border border-[#359830]/30 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#359830]" />
          Solicitação de Cadastro de Gestor
        </div>
        <h2 id={formHeadingId} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Formulário de Inscrição & Acesso
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Preencha os dados abaixo para solicitar credenciais de acesso ao painel de gestão do Observatório.
          Você pode definir suas permissões desejadas e criar seu login e senha.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-3 shadow-xs"
        >
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Atenção</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" aria-labelledby={formHeadingId}>
        
        {/* SEÇÃO 1: TIPO DE VÍNCULO (Cidade, IGR, Ambas) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              1. Vínculo Institucional <span className="text-[#C90C0F]">*</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">Passo 1 de 4</span>
          </div>
          <p className="text-xs text-slate-500">
            Especifique se você representa uma cidade, uma IGR regional ou ambas as entidades:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opção: Cidade */}
            <button
              type="button"
              onClick={() => setTipoVinculo("cidade")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                tipoVinculo === "cidade"
                  ? "border-[#359830] bg-white ring-2 ring-[#359830]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tipoVinculo === "cidade"
                      ? "bg-[#359830] text-white shadow-sm"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    tipoVinculo === "cidade" ? "border-[#359830]" : "border-slate-300"
                  }`}
                >
                  {tipoVinculo === "cidade" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#359830]" />
                  )}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">Cidade / Município</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Prefeitura ou Secretaria Municipal de Turismo.
                </span>
              </div>
            </button>

            {/* Opção: IGR */}
            <button
              type="button"
              onClick={() => setTipoVinculo("igr")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                tipoVinculo === "igr"
                  ? "border-[#359830] bg-white ring-2 ring-[#359830]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tipoVinculo === "igr" ? "bg-[#359830] text-white shadow-sm" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    tipoVinculo === "igr" ? "border-[#359830]" : "border-slate-300"
                  }`}
                >
                  {tipoVinculo === "igr" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#359830]" />
                  )}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">IGR (Instância Regional)</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Circuito turístico ou governança regional.
                </span>
              </div>
            </button>

            {/* Opção: Ambas */}
            <button
              type="button"
              onClick={() => setTipoVinculo("ambas")}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                tipoVinculo === "ambas"
                  ? "border-[#359830] bg-white ring-2 ring-[#359830]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tipoVinculo === "ambas" ? "bg-[#359830] text-white shadow-sm" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    tipoVinculo === "ambas" ? "border-[#359830]" : "border-slate-300"
                  }`}
                >
                  {tipoVinculo === "ambas" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#359830]" />
                  )}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">Ambas (Cidade & IGR)</span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Atuação conjunta em município e IGR regional.
                </span>
              </div>
            </button>
          </div>

          {/* Seletores dinâmicos de Município e IGR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {(tipoVinculo === "cidade" || tipoVinculo === "ambas") && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Município Vinculado <span className="text-[#C90C0F]">*</span>
                </label>
                <select
                  value={selectedCidade}
                  onChange={(e) => setSelectedCidade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                  required
                >
                  <option value="">Selecione o município...</option>
                  {cidadesList.map((cid) => (
                    <option key={cid} value={cid}>
                      {cid}
                    </option>
                  ))}
                  <option value="outro">Outro município (especificar abaixo)...</option>
                </select>

                {selectedCidade === "outro" && (
                  <input
                    type="text"
                    placeholder="Digite o nome do seu município..."
                    value={outraCidade}
                    onChange={(e) => setOutraCidade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 mt-2"
                    required
                  />
                )}
              </div>
            )}

            {(tipoVinculo === "igr" || tipoVinculo === "ambas") && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  IGR Vinculada <span className="text-[#C90C0F]">*</span>
                </label>
                <select
                  value={selectedIgr}
                  onChange={(e) => setSelectedIgr(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                  required
                >
                  <option value="">Selecione a IGR / Circuito...</option>
                  {igrsList.map((igr) => (
                    <option key={igr} value={igr}>
                      {igr}
                    </option>
                  ))}
                  <option value="outro">Outra IGR (especificar abaixo)...</option>
                </select>

                {selectedIgr === "outro" && (
                  <input
                    type="text"
                    placeholder="Digite o nome da IGR / Circuito..."
                    value={outraIgr}
                    onChange={(e) => setOutraIgr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 mt-2"
                    required
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 2: ÁREAS DE ATUAÇÃO / PERMISSÕES (Eventos, Notícias, ou Nenhum) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              2. Áreas de Gestão e Publicação <span className="text-xs font-normal text-slate-500">(Opcional)</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">Passo 2 de 4</span>
          </div>
          <p className="text-xs text-slate-500">
            Selecione quais áreas você deseja publicar. Você pode marcar Eventos, Notícias, ambas ou <strong>nenhuma das duas</strong> (para acesso institucional geral/indicadores):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Módulo: Eventos */}
            <div
              onClick={() => toggleModulo("eventos")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                modulos.includes("eventos")
                  ? "border-[#359830] bg-white ring-2 ring-[#359830]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white opacity-80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modulos.includes("eventos")
                    ? "bg-[#359830] text-white shadow-sm"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Gestão de Eventos</span>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      modulos.includes("eventos")
                        ? "bg-[#359830] border-[#359830] text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {modulos.includes("eventos") && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastrar e publicar na agenda turística e calendário oficial de festividades da região.
                </p>
              </div>
            </div>

            {/* Módulo: Notícias */}
            <div
              onClick={() => toggleModulo("noticias")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                modulos.includes("noticias")
                  ? "border-[#359830] bg-white ring-2 ring-[#359830]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white opacity-80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modulos.includes("noticias")
                    ? "bg-[#359830] text-white shadow-sm"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Newspaper className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Gestão de Notícias</span>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      modulos.includes("noticias")
                        ? "bg-[#359830] border-[#359830] text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {modulos.includes("noticias") && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Publicar matérias informativas, editais, comunicados e matérias do turismo regional.
                </p>
              </div>
            </div>
          </div>

          {/* Atalhos rápidos e indicação caso nenhum seja selecionado */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAmbosModulos}
                className="text-[#1D5C1B] hover:underline font-semibold"
              >
                Selecionar ambos
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={selectNenhumModulo}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                Não selecionar nenhum
              </button>
            </div>

            {modulos.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-medium">
                <MinusCircle className="h-3.5 w-3.5 text-slate-500" />
                Nenhum módulo selecionado (Apenas Acesso Institucional)
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                {modulos.length} {modulos.length === 1 ? "módulo selecionado" : "módulos selecionados"}
              </span>
            )}
          </div>
        </div>

        {/* SEÇÃO 3: DADOS DO SOLICITANTE / GESTOR */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              3. Dados do Solicitante / Contato <span className="text-[#C90C0F]">*</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-400">Passo 3 de 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional ou Oficial <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ex: turismo@municipio.mg.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp de Contato <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="(35) 99999-9999"
                  value={telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo ou Função <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="ex: Secretário de Turismo, Assessor, Diretor..."
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Órgão / Secretaria / Entidade Representada
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ex: Secretaria Municipal de Turismo e Cultura"
                  value={orgao}
                  onChange={(e) => setOrgao(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ÁREA DE E-MAIL E SENHA DE CADASTRO */}
        <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/30 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#359830] text-white flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
              <label className="block text-sm font-bold text-slate-900">
                4. Credenciais de Acesso (Login e Senha Desejada) <span className="text-[#C90C0F]">*</span>
              </label>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Passo 4 de 4</span>
          </div>

          <p className="text-xs text-slate-600">
            Defina o e-mail de login e a senha que serão ativados assim que a coordenação aceitar sua solicitação.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* E-mail de login */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  E-mail de Login do Cadastro <span className="text-[#C90C0F]">*</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usarMesmoEmail}
                    onChange={(e) => setUsarMesmoEmail(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#359830] focus:ring-[#359830]"
                  />
                  <span>Usar o mesmo e-mail de contato</span>
                </label>
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={usarMesmoEmail}
                  placeholder={usarMesmoEmail ? email || "Preencha o e-mail no passo anterior..." : "Digite o e-mail que usará para entrar..."}
                  value={usarMesmoEmail ? email : emailCadastroCustom}
                  onChange={(e) => setEmailCadastroCustom(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs ${
                    usarMesmoEmail
                      ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                />
              </div>
            </div>

            {/* Senha Desejada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha Desejada <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Mínimo de 6 caracteres..."
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Senha <span className="text-[#C90C0F]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirmarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Repita a senha desejada..."
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 shadow-xs ${
                    confirmarSenha && senha !== confirmarSenha
                      ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 bg-white text-slate-800 focus:border-[#359830] focus:ring-[#359830]/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showConfirmarSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {confirmarSenha && (
                <p className="mt-1 text-[11px]">
                  {senha === confirmarSenha ? (
                    <span className="text-[#359830] font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> As senhas coincidem
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> As senhas não coincidem
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <Info className="h-3.5 w-3.5 text-[#359830] shrink-0" />
            <span>Guarde estas credenciais. Elas serão habilitadas assim que a equipe aprovar sua solicitação.</span>
          </p>
        </div>

        {/* JUSTIFICATIVA / INFORMAÇÕES EXTRAS */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Informações Complementares ou Justificativa (Opcional)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Descreva brevemente o objetivo do acesso ou anexe informações que auxiliem na validação do seu perfil..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-[#359830] focus:outline-none focus:ring-2 focus:ring-[#359830]/30 shadow-xs resize-y"
            />
          </div>
        </div>

        {/* DECLARAÇÃO DE VERACIDADE */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={declaracaoVeracidade}
              onChange={(e) => setDeclaracaoVeracidade(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#359830] focus:ring-[#359830]"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Declaro que represento oficialmente a entidade informada e solicito o cadastro de gestor
              para avaliação da equipe do Observatório de Turismo. Estou ciente de que as credenciais
              serão liberadas após validação dos dados.
            </span>
          </label>
        </div>

        {/* BOTÃO DE SUBMISSÃO */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1D5C1B] hover:bg-[#287524] px-9 py-3.5 font-bold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#359830]/50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Enviando solicitação...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Enviar Inscrição para Aprovação</span>
              </>
            )}
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            * O envio deste formulário é submetido à moderação da equipe para aceitação e ativação das credenciais informadas.
          </p>
        </div>
      </form>
    </div>
  );
}
