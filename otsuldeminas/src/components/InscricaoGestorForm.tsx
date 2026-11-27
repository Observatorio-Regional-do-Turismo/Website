"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Building,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  FileUp,
  HeartHandshake,
  Info,
  KeyRound,
  Layers,
  LoaderCircle,
  Mail,
  MinusCircle,
  Newspaper,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import axios from "axios";
import { getWebsiteApiBaseUrl } from "@/lib/website-api";
import { InscricaoResponse, ModuloGestao, submitInscricao, TipoVinculo } from "@/lib/inscricao-api";

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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function InscricaoGestorForm() {
  const formHeadingId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const [usernameSugerido, setUsernameSugerido] = useState("");
  const [usarMesmoEmail, setUsarMesmoEmail] = useState(true);
  const [emailCadastroCustom, setEmailCadastroCustom] = useState("");

  const [documento, setDocumento] = useState<File | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [declaracaoVeracidade, setDeclaracaoVeracidade] = useState(false);

  const [cidadesList, setCidadesList] = useState<string[]>(DEFAULT_CIDADES);
  const [igrsList, setIgrsList] = useState<string[]>(DEFAULT_IGRS);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<InscricaoResponse | null>(null);
  const [protocolCopied, setProtocolCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function carregarEntidades() {
      try {
        const baseUrl = getWebsiteApiBaseUrl();
        const [cidadesRes, igrsRes] = await Promise.all([
          axios.get(`${baseUrl}/cidades/?page_size=200`, { timeout: 8000 }).catch(() => null),
          axios.get(`${baseUrl}/igrs/?page_size=200`, { timeout: 8000 }).catch(() => null),
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
              a.localeCompare(b, "pt-BR"),
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
              a.localeCompare(b, "pt-BR"),
            );
            setIgrsList(unique);
          }
        }
      } catch {
        // Fallback padrão
      }
    }

    carregarEntidades();
    return () => {
      active = false;
    };
  }, []);

  const toggleModulo = (modulo: ModuloGestao) => {
    setModulos((prev) =>
      prev.includes(modulo) ? prev.filter((item) => item !== modulo) : [...prev, modulo],
    );
  };

  const finalEmailCadastro = usarMesmoEmail ? email.trim() : emailCadastroCustom.trim();

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setDocumento(null);
      return;
    }
    const lowerName = file.name.toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!validExt) {
      setErrorMsg("Formato inválido. Anexe um arquivo PDF, PNG, JPG ou WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("O documento comprobatório excede o limite de 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setErrorMsg(null);
    setDocumento(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !email.trim() || !telefone.trim() || !cargo.trim()) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios de identificação.");
      return;
    }

    if (!usarMesmoEmail && !emailCadastroCustom.trim()) {
      setErrorMsg("Informe o e-mail para recebimento das credenciais ou use o mesmo de contato.");
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

    if (!documento) {
      setErrorMsg(
        "Anexe o documento comprobatório (PDF ou imagem) que atesta sua representação institucional.",
      );
      return;
    }

    if (!declaracaoVeracidade) {
      setErrorMsg("Confirme a declaração de veracidade das informações enviadas.");
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
        usernameSugerido: usernameSugerido.trim() || undefined,
        emailCadastro: finalEmailCadastro,
        justificativa: justificativa.trim() || undefined,
        documentoComprobatorio: documento,
      });

      setSuccessResponse(response);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao enviar a solicitação. Tente novamente mais tarde.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyProtocol = () => {
    if (successResponse?.protocolo && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(successResponse.protocolo);
      setProtocolCopied(true);
      setTimeout(() => setProtocolCopied(false), 2000);
    }
  };

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
    setUsernameSugerido("");
    setUsarMesmoEmail(true);
    setEmailCadastroCustom("");
    setDocumento(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setJustificativa("");
    setDeclaracaoVeracidade(false);
    setSuccessResponse(null);
    setErrorMsg(null);
  };

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
                className="p-1.5 text-[#359830] hover:text-[#1D5C1B] rounded-lg hover:bg-emerald-200/50 transition-colors cursor-pointer"
                title="Copiar protocolo"
              >
                {protocolCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="py-6 space-y-4 text-slate-600 text-sm leading-relaxed">
          <p className="font-medium text-slate-800 text-base">
            Obrigado, <strong className="text-[#1D5C1B]">{nome}</strong>! Sua solicitação e o
            documento comprobatório foram registrados com sucesso.
          </p>
          <p>{successResponse.message}</p>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Solicitante:
              </span>
              <span className="font-semibold text-slate-800">
                {nome} ({cargo})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                E-mail para Recebimento das Credenciais:
              </span>
              <span className="font-semibold text-slate-800">{finalEmailCadastro}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Vínculo Institucional:
              </span>
              <span className="font-semibold text-[#1D5C1B] capitalize">
                {tipoVinculo === "ambas" ? "Cidade e IGR" : tipoVinculo}
                {(selectedCidade || outraCidade) &&
                  ` • ${selectedCidade === "outro" ? outraCidade : selectedCidade}`}
                {(selectedIgr || outraIgr) &&
                  ` • ${selectedIgr === "outro" ? outraIgr : selectedIgr}`}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block">
                Documento Anexado:
              </span>
              <span className="font-semibold text-slate-800">{documento?.name || "Enviado"}</span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 text-xs flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-[#359830] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1D5C1B]">Próximos passos:</p>
              <p className="mt-0.5">
                Nossa coordenação analisará os dados e o documento comprobatório. Assim que sua
                solicitação for aprovada, você receberá no e-mail{" "}
                <strong>{finalEmailCadastro}</strong> o seu usuário, senha inicial e um tutorial
                passo a passo para acessar o Portal de Gestão.
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
      <div className="h-2 w-full bg-gradient-to-r from-[#1D5C1B] via-[#359830] to-[#5BAF56] rounded-t-3xl -mt-6 sm:-mt-10 -mx-6 sm:-mx-10 mb-8" />

      <div className="border-b border-slate-100 pb-6 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4E9] text-[#1D5C1B] text-xs font-bold uppercase tracking-wider mb-3 border border-[#359830]/30 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#359830]" />
          Solicitação de Cadastro de Gestor
        </div>
        <h2
          id={formHeadingId}
          className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
        >
          Formulário de Inscrição & Acesso
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Preencha os dados abaixo e anexe um documento oficial comprovando sua representação
          institucional. Após validação da coordenação, suas credenciais e o tutorial de acesso
          serão enviados para o e-mail informado.
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
        {/* SEÇÃO 1: VÍNCULO */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <label className="block text-sm font-bold text-slate-900">
            1. Vínculo Institucional <span className="text-[#C90C0F]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                {
                  id: "cidade",
                  label: "Município",
                  desc: "Prefeitura / Secretaria Municipal",
                  icon: Building2,
                },
                {
                  id: "igr",
                  label: "IGR / Circuito",
                  desc: "Instância de Governança Regional",
                  icon: Layers,
                },
                {
                  id: "ambas",
                  label: "Município e IGR",
                  desc: "Atuação integrada nas duas esferas",
                  icon: HeartHandshake,
                },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const selected = tipoVinculo === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTipoVinculo(opt.id)}
                  className={`flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                    selected
                      ? "border-[#359830] bg-[#EAF4E9]/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${selected ? "text-[#1D5C1B]" : "text-slate-400"}`} />
                  <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {(tipoVinculo === "cidade" || tipoVinculo === "ambas") && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Município <span className="text-[#C90C0F]">*</span>
                </label>
                <select
                  value={selectedCidade}
                  onChange={(e) => setSelectedCidade(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                >
                  <option value="">Selecione o município...</option>
                  {cidadesList.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                  <option value="outro">Outro município (digitar)</option>
                </select>
                {selectedCidade === "outro" && (
                  <input
                    type="text"
                    placeholder="Informe o nome do município"
                    value={outraCidade}
                    onChange={(e) => setOutraCidade(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#359830]"
                  />
                )}
              </div>
            )}

            {(tipoVinculo === "igr" || tipoVinculo === "ambas") && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  IGR / Circuito Turístico <span className="text-[#C90C0F]">*</span>
                </label>
                <select
                  value={selectedIgr}
                  onChange={(e) => setSelectedIgr(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-[#359830] focus:ring-2 focus:ring-[#359830]/20"
                >
                  <option value="">Selecione a IGR...</option>
                  {igrsList.map((igr) => (
                    <option key={igr} value={igr}>
                      {igr}
                    </option>
                  ))}
                  <option value="outro">Outra IGR (digitar)</option>
                </select>
                {selectedIgr === "outro" && (
                  <input
                    type="text"
                    placeholder="Informe o nome da IGR"
                    value={outraIgr}
                    onChange={(e) => setOutraIgr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#359830]"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 2: DADOS DO SOLICITANTE */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-4">
          <p className="text-sm font-bold text-slate-900">
            2. Identificação do Representante <span className="text-[#C90C0F]">*</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700">
              Nome completo <span className="text-[#C90C0F]">*</span>
              <div className="relative mt-1.5">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  placeholder="Ex.: Maria Aparecida Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              E-mail institucional / contato <span className="text-[#C90C0F]">*</span>
              <div className="relative mt-1.5">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  placeholder="nome@prefeitura.mg.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Telefone / WhatsApp <span className="text-[#C90C0F]">*</span>
              <div className="relative mt-1.5">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="tel"
                  placeholder="(35) 99999-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Cargo / Função <span className="text-[#C90C0F]">*</span>
              <div className="relative mt-1.5">
                <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="text"
                  placeholder="Ex.: Secretário(a) / Diretor(a) de Turismo"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>

            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              Órgão / Secretaria / Entidade
              <div className="relative mt-1.5">
                <Building className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex.: Secretaria Municipal de Turismo e Cultura"
                  value={orgao}
                  onChange={(e) => setOrgao(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>
          </div>
        </div>

        {/* SEÇÃO 3: DOCUMENTO COMPROBATÓRIO (OBRIGATÓRIO) */}
        <div className="rounded-2xl border-2 border-dashed border-[#359830]/40 bg-[#F4FCF4] p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-[#1D5C1B] flex items-center justify-center shrink-0">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                3. Documento Comprobatório de Representação{" "}
                <span className="text-[#C90C0F]">*</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Anexe um documento oficial (como <strong>PDF</strong> de portaria de nomeação,
                ofício institucional, termo de posse ou declaração assinada) que comprove que você
                representa o município ou IGR informado. Formatos aceitos: PDF, PNG, JPG ou WEBP
                (máx. 10 MB).
              </p>
            </div>
          </div>

          {documento ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <FileCheck2 className="h-6 w-6 text-[#359830] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{documento.name}</p>
                  <p className="text-xs text-slate-500">{formatBytes(documento.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocumento(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Remover
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-6 text-center cursor-pointer hover:border-[#359830] hover:bg-emerald-50/30 transition-colors">
              <FileUp className="h-7 w-7 text-[#359830]" />
              <span className="text-sm font-bold text-[#1D5C1B]">
                Clique para selecionar o documento comprobatório (PDF ou imagem)
              </span>
              <span className="text-xs text-slate-500">
                Máximo de 10 MB • Arquivo restrito à análise da coordenação
              </span>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          )}
        </div>

        {/* SEÇÃO 4: MÓDULOS E PREFERÊNCIAS DE LOGIN */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-sm font-bold text-slate-900">
              4. Módulos Desejados e Dados para Credenciais
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              A senha inicial segura será definida pela coordenação no momento da aprovação e
              enviada diretamente ao seu e-mail cadastrado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  id: "eventos",
                  label: "Eventos & Agenda",
                  desc: "Publicação de festividades, feiras e calendário turístico",
                  icon: CalendarDays,
                },
                {
                  id: "noticias",
                  label: "Notícias & Comunicados",
                  desc: "Publicação de matérias, fotos e novidades do destino",
                  icon: Newspaper,
                },
              ] as const
            ).map((mod) => {
              const Icon = mod.icon;
              const active = modulos.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModulo(mod.id)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all cursor-pointer ${
                    active
                      ? "border-[#359830] bg-[#EAF4E9]/70"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mt-0.5 shrink-0 ${active ? "text-[#1D5C1B]" : "text-slate-400"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{mod.label}</p>
                    <p className="text-xs text-slate-500">{mod.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {modulos.length === 0 && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <MinusCircle className="h-3.5 w-3.5" />
              Nenhum módulo selecionado (solicitação apenas de acesso institucional).
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700">
              Nome de usuário (login) desejado (opcional)
              <div className="relative mt-1.5">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Ex.: turismo.pocos"
                  value={usernameSugerido}
                  onChange={(e) => setUsernameSugerido(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-mono font-normal outline-none focus:border-[#359830]"
                />
              </div>
            </label>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={usarMesmoEmail}
                  onChange={(e) => setUsarMesmoEmail(e.target.checked)}
                  className="h-4 w-4 accent-[#1D5C1B]"
                />
                Receber credenciais no mesmo e-mail de contato
              </label>
              {!usarMesmoEmail && (
                <input
                  required
                  type="email"
                  placeholder="E-mail alternativo para receber login e senha"
                  value={emailCadastroCustom}
                  onChange={(e) => setEmailCadastroCustom(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#359830]"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#1D5C1B] shrink-0 mt-0.5" />
            <p>
              Por segurança, nenhuma senha é trafegada ou armazenada em texto puro neste formulário.
              Ao aprovar sua solicitação, a coordenação criará sua conta com senha criptografada e
              enviará as credenciais com o tutorial de acesso para o seu e-mail.
            </p>
          </div>
        </div>

        {/* SEÇÃO 5: JUSTIFICATIVA E DECLARAÇÃO */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            5. Justificativa / Observações adicionais (opcional)
            <textarea
              rows={3}
              placeholder="Conte brevemente como pretende utilizar o portal de gestão ou adicione observações sobre o documento anexado..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#359830]"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={declaracaoVeracidade}
              onChange={(e) => setDeclaracaoVeracidade(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1D5C1B]"
            />
            <span>
              Declaro que as informações preenchidas e o documento comprobatório anexado são
              verdadeiros e que possuo autorização institucional para atuar como gestor(a) do
              município ou IGR informado.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D5C1B] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#287524] disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Enviando solicitação e documento...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Solicitação de Credenciais
            </>
          )}
        </button>
      </form>
    </div>
  );
}
