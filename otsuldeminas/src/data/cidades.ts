export interface CidadeAtrativo {
  nome: string;
  categoria: string;
  nota: number;
}

export interface CidadeEvento {
  data: string;
  titulo: string;
  local: string;
  tipo: string;
}

export interface DadoMensalCidade {
  mes: string;
  visitantes: number;
  ocupacao: number;
}

export interface TipoEventoItem {
  name: string;
  value: number;
  color: string;
}

export interface Cidade {
  id: string;
  nome: string;
  imagem?: string;
  slug: string;
  destaque?: boolean;
  tags: string[];
  descricao: string;
  populacao: string;
  hospedagens: number;
  leitos: string;
  restaurantes: number;
  atrativos: CidadeAtrativo[];
  eventos: CidadeEvento[];
  dadosMensais: DadoMensalCidade[];
  tiposEvento: TipoEventoItem[];
}

// Helper para gerar slug amigável
export function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Dados detalhados pré-configurados para cidades de destaque
const CIDADES_DETALHADAS_BASE: Record<string, Partial<Cidade>> = {
  "Varginha": {
    imagem: "/images/cidades/varginha.jpg",
    tags: ["Capital do Café", "Gastronomia", "Comércio Regional"],
    descricao: "Conhecida mundialmente pelo famoso caso do ET, Varginha é também a capital do café do Sul de Minas, com forte vocação gastronômica e comercial.",
    populacao: "140.000 hab.",
    hospedagens: 38,
    leitos: "1.840",
    restaurantes: 210,
    atrativos: [
      { nome: "Memorial ET de Varginha", categoria: "Museu", nota: 4.8 },
      { nome: "Fazenda Lagoa do Sol", categoria: "Turismo Rural", nota: 4.6 },
      { nome: "Museu do Café", categoria: "Museu", nota: 4.7 },
    ],
    eventos: [
      { data: "05 set", titulo: "Festival do Café de Varginha", local: "Parque Municipal", tipo: "Festival" },
      { data: "20 set", titulo: "Feira de Turismo Sul de Minas", local: "Centro de Convenções", tipo: "Feira" },
      { data: "12 out", titulo: "Semana do Turismo Rural", local: "Fazendas Históricas", tipo: "Evento Cultural" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 4800, ocupacao: 72 },
      { mes: "Fev", visitantes: 4500, ocupacao: 68 },
      { mes: "Mar", visitantes: 5500, ocupacao: 76 },
      { mes: "Abr", visitantes: 5800, ocupacao: 79 },
      { mes: "Mai", visitantes: 6100, ocupacao: 82 },
      { mes: "Jun", visitantes: 6400, ocupacao: 85 },
      { mes: "Jul", visitantes: 6800, ocupacao: 84 },
      { mes: "Ago", visitantes: 6500, ocupacao: 80 },
      { mes: "Set", visitantes: 5900, ocupacao: 82 },
      { mes: "Out", visitantes: 6100, ocupacao: 78 },
      { mes: "Nov", visitantes: 5600, ocupacao: 75 },
      { mes: "Dez", visitantes: 5200, ocupacao: 73 },
    ],
    tiposEvento: [
      { name: "Gastronômico", value: 12, color: "#359830" },
      { name: "Cultural", value: 8, color: "#5BAF56" },
      { name: "Rural", value: 6, color: "#C90C0F" },
      { name: "Corporativo", value: 14, color: "#F4A261" },
    ],
  },
  "Poços de Caldas": {
    imagem: "/images/cidades/pocos_de_caldas.jpg",
    tags: ["Águas Termais", "Turismo Cultural", "Ecoturismo"],
    descricao: "Famosa por suas fontes hidrotermais, arquitetura histórica e rica vida cultural, Poços de Caldas é um dos destinos turísticos mais tradicionais de Minas Gerais.",
    populacao: "170.000 hab.",
    hospedagens: 124,
    leitos: "9.800",
    restaurantes: 450,
    atrativos: [
      { nome: "Parque José Affonso Junqueira & Termas", categoria: "Termalismo", nota: 4.9 },
      { nome: "Cristo Redentor & Teleférico", categoria: "Mirante", nota: 4.8 },
      { nome: "Recanto Japonês", categoria: "Natureza", nota: 4.7 },
    ],
    eventos: [
      { data: "10 set", titulo: "Festival de Jazz & Blues", local: "Praça dos Macacos", tipo: "Festival" },
      { data: "25 set", titulo: "Encontro Nacional de Autos Antigos", local: "Espaço Cultural da Urca", tipo: "Exposição" },
      { data: "15 out", titulo: "Flipoços - Festival Literário", local: "Espaço Cultural", tipo: "Cultural" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 14200, ocupacao: 88 },
      { mes: "Fev", visitantes: 12500, ocupacao: 80 },
      { mes: "Mar", visitantes: 11000, ocupacao: 74 },
      { mes: "Abr", visitantes: 13800, ocupacao: 85 },
      { mes: "Mai", visitantes: 14500, ocupacao: 87 },
      { mes: "Jun", visitantes: 16800, ocupacao: 92 },
      { mes: "Jul", visitantes: 19500, ocupacao: 96 },
      { mes: "Ago", visitantes: 15200, ocupacao: 86 },
      { mes: "Set", visitantes: 13900, ocupacao: 83 },
      { mes: "Out", visitantes: 14600, ocupacao: 85 },
      { mes: "Nov", visitantes: 13200, ocupacao: 79 },
      { mes: "Dez", visitantes: 15800, ocupacao: 90 },
    ],
    tiposEvento: [
      { name: "Cultural", value: 24, color: "#359830" },
      { name: "Gastronômico", value: 18, color: "#5BAF56" },
      { name: "Termalismo & Saúde", value: 14, color: "#287524" },
      { name: "Corporativo", value: 16, color: "#F4A261" },
    ],
  },
  "São Lourenço": {
    imagem: "/images/cidades/sao_lourenco.jpg",
    tags: ["Circuito das Águas", "Maria Fumaça", "Bem-estar"],
    descricao: "Integrante renomada do Circuito das Águas, São Lourenço destaca-se pelo Parque das Águas com fontes terapêuticas e passeios no histórico trem a vapor.",
    populacao: "46.000 hab.",
    hospedagens: 86,
    leitos: "6.200",
    restaurantes: 180,
    atrativos: [
      { nome: "Parque das Águas", categoria: "Parque Termal", nota: 4.9 },
      { nome: "Trem das Águas (Maria Fumaça)", categoria: "Histórico", nota: 4.8 },
      { nome: "Rota do Café Especial", categoria: "Turismo Rural", nota: 4.7 },
    ],
    eventos: [
      { data: "18 set", titulo: "Festival Gastronômico das Águas", local: "Calçadão Central", tipo: "Gastronomia" },
      { data: "02 out", titulo: "Passeio Noturno de Maria Fumaça", local: "Estação Ferroviária", tipo: "Passeio" },
      { data: "22 out", titulo: "Encontro de Voo Livre", local: "Mirante da Cidade", tipo: "Esporte" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 8900, ocupacao: 82 },
      { mes: "Fev", visitantes: 7800, ocupacao: 75 },
      { mes: "Mar", visitantes: 7200, ocupacao: 70 },
      { mes: "Abr", visitantes: 8600, ocupacao: 81 },
      { mes: "Mai", visitantes: 9100, ocupacao: 84 },
      { mes: "Jun", visitantes: 10400, ocupacao: 89 },
      { mes: "Jul", visitantes: 11800, ocupacao: 93 },
      { mes: "Ago", visitantes: 9600, ocupacao: 83 },
      { mes: "Set", visitantes: 8700, ocupacao: 79 },
      { mes: "Out", visitantes: 9200, ocupacao: 82 },
      { mes: "Nov", visitantes: 8400, ocupacao: 76 },
      { mes: "Dez", visitantes: 9900, ocupacao: 86 },
    ],
    tiposEvento: [
      { name: "Gastronômico", value: 14, color: "#359830" },
      { name: "Cultural", value: 10, color: "#5BAF56" },
      { name: "Termalismo", value: 8, color: "#287524" },
      { name: "Ecoturismo", value: 7, color: "#F4A261" },
    ],
  },
  "Caxambu": {
    imagem: "/images/cidades/caxambu.jpg",
    tags: ["Complexo Hidromineral", "História Imperial", "Ecoturismo"],
    descricao: "Caxambu abriga o maior complexo hidromineral do planeta com 12 fontes de águas minerais gasosas e gasocarbônicas com propriedades medicinais únicas.",
    populacao: "22.000 hab.",
    hospedagens: 52,
    leitos: "3.400",
    restaurantes: 95,
    atrativos: [
      { nome: "Parque das Águas de Caxambu", categoria: "Parque Hidromineral", nota: 4.9 },
      { nome: "Teleférico & Morro de Caxambu", categoria: "Mirante", nota: 4.7 },
      { nome: "Igreja Santa Isabel da Hungria", categoria: "Histórico", nota: 4.6 },
    ],
    eventos: [
      { data: "12 set", titulo: "Festival das Águas Minerais", local: "Parque das Águas", tipo: "Festival" },
      { data: "28 set", titulo: "Feira de Artesanato e Quitutes", local: "Praça 16 de Setembro", tipo: "Feira" },
      { data: "19 out", titulo: "Circuito Mantiqueira de Ciclismo", local: "Entorno da Serra", tipo: "Esporte" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 5400, ocupacao: 76 },
      { mes: "Fev", visitantes: 4900, ocupacao: 71 },
      { mes: "Mar", visitantes: 4600, ocupacao: 68 },
      { mes: "Abr", visitantes: 5600, ocupacao: 78 },
      { mes: "Mai", visitantes: 5900, ocupacao: 80 },
      { mes: "Jun", visitantes: 6700, ocupacao: 86 },
      { mes: "Jul", visitantes: 7800, ocupacao: 90 },
      { mes: "Ago", visitantes: 6200, ocupacao: 81 },
      { mes: "Set", visitantes: 5700, ocupacao: 77 },
      { mes: "Out", visitantes: 5900, ocupacao: 79 },
      { mes: "Nov", visitantes: 5200, ocupacao: 73 },
      { mes: "Dez", visitantes: 6400, ocupacao: 83 },
    ],
    tiposEvento: [
      { name: "Cultural", value: 11, color: "#359830" },
      { name: "Termalismo", value: 9, color: "#5BAF56" },
      { name: "Gastronômico", value: 8, color: "#287524" },
      { name: "Esportivo", value: 5, color: "#F4A261" },
    ],
  },
  "Cambuquira": {
    imagem: "/images/cidades/cambuquira.jpg",
    tags: ["Águas Minerais", "Parque das Águas", "Serra do Marimbondo"],
    descricao: "Encravada no Circuito das Águas, Cambuquira é famosa pela pureza de suas fontes minerais e pelo mirante natural da Serra do Marimbondo.",
    populacao: "13.000 hab.",
    hospedagens: 24,
    leitos: "1.250",
    restaurantes: 45,
    atrativos: [
      { nome: "Parque das Águas de Cambuquira", categoria: "Parque Termal", nota: 4.7 },
      { nome: "Pico do Piripau (Voo Livre)", categoria: "Mirante / Aventura", nota: 4.8 },
      { nome: "Cascata do Marimbondo", categoria: "Ecoturismo", nota: 4.6 },
    ],
    eventos: [
      { data: "08 set", titulo: "Campeonato Sul-Mineiro de Parapente", local: "Pico do Piripau", tipo: "Esporte" },
      { data: "26 set", titulo: "Encontro de Seresta e Choro", local: "Largo do Cassino", tipo: "Cultural" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 2600, ocupacao: 68 },
      { mes: "Fev", visitantes: 2400, ocupacao: 64 },
      { mes: "Mar", visitantes: 2300, ocupacao: 62 },
      { mes: "Abr", visitantes: 2800, ocupacao: 71 },
      { mes: "Mai", visitantes: 3100, ocupacao: 75 },
      { mes: "Jun", visitantes: 3600, ocupacao: 80 },
      { mes: "Jul", visitantes: 4100, ocupacao: 86 },
      { mes: "Ago", visitantes: 3300, ocupacao: 76 },
      { mes: "Set", visitantes: 3000, ocupacao: 72 },
      { mes: "Out", visitantes: 3200, ocupacao: 74 },
      { mes: "Nov", visitantes: 2700, ocupacao: 67 },
      { mes: "Dez", visitantes: 3400, ocupacao: 78 },
    ],
    tiposEvento: [
      { name: "Ecoturismo & Voo", value: 8, color: "#359830" },
      { name: "Cultural", value: 6, color: "#5BAF56" },
      { name: "Gastronômico", value: 5, color: "#287524" },
      { name: "Termal", value: 4, color: "#F4A261" },
    ],
  },
  "Lambari": {
    imagem: "/images/cidades/lambari.jpg",
    tags: ["Circuito das Águas", "Cassino Histórico", "Lago Guanabara"],
    descricao: "Pólo turístico clássico do Circuito das Águas com o imponente Palácio do Cassino e belas paisagens no entorno do Lago Guanabara.",
    populacao: "21.000 hab.",
    hospedagens: 36,
    leitos: "2.100",
    restaurantes: 82,
    atrativos: [
      { nome: "Parque das Águas de Lambari", categoria: "Termalismo", nota: 4.8 },
      { nome: "Palácio do Cassino do Lago", categoria: "Histórico", nota: 4.9 },
      { nome: "Parque Estadual Nova Baden", categoria: "Ecoturismo", nota: 4.7 },
    ],
    eventos: [
      { data: "14 set", titulo: "Festival de Inverno & Serestas", local: "Entorno do Lago", tipo: "Cultural" },
      { data: "30 set", titulo: "Passeio Ciclístico Volta do Lago", local: "Lago Guanabara", tipo: "Esporte" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 4100, ocupacao: 74 },
      { mes: "Fev", visitantes: 3700, ocupacao: 69 },
      { mes: "Mar", visitantes: 3500, ocupacao: 66 },
      { mes: "Abr", visitantes: 4300, ocupacao: 76 },
      { mes: "Mai", visitantes: 4700, ocupacao: 79 },
      { mes: "Jun", visitantes: 5400, ocupacao: 84 },
      { mes: "Jul", visitantes: 6200, ocupacao: 89 },
      { mes: "Ago", visitantes: 4900, ocupacao: 80 },
      { mes: "Set", visitantes: 4500, ocupacao: 77 },
      { mes: "Out", visitantes: 4800, ocupacao: 79 },
      { mes: "Nov", visitantes: 4200, ocupacao: 72 },
      { mes: "Dez", visitantes: 5000, ocupacao: 81 },
    ],
    tiposEvento: [
      { name: "Cultural", value: 10, color: "#359830" },
      { name: "Gastronômico", value: 7, color: "#5BAF56" },
      { name: "Ecoturismo", value: 6, color: "#287524" },
      { name: "Esportivo", value: 5, color: "#F4A261" },
    ],
  },
  "Baependi": {
    imagem: "/images/cidades/baependi.jpg",
    tags: ["Turismo Religioso", "Nhá Chica", "Cachoeiras e Ecoturismo"],
    descricao: "Centro de grande devoção à Beata Nhá Chica e portal de entrada para deslumbrantes cachoeiras da Serra da Mantiqueira.",
    populacao: "19.000 hab.",
    hospedagens: 28,
    leitos: "1.450",
    restaurantes: 60,
    atrativos: [
      { nome: "Santuário de Nossa Senhora da Conceição (Nhá Chica)", categoria: "Religioso", nota: 5.0 },
      { nome: "Cachoeira do Caldeirão & Itaúna", categoria: "Ecoturismo", nota: 4.8 },
      { nome: "Parque Estadual da Serra do Papagaio", categoria: "Natureza", nota: 4.9 },
    ],
    eventos: [
      { data: "07 set", titulo: "Romaria e Celebração à Nhá Chica", local: "Santuário Central", tipo: "Religioso" },
      { data: "21 set", titulo: "Trilha Ecológica da Serra do Papagaio", local: "Parque Estadual", tipo: "Ecoturismo" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 3800, ocupacao: 71 },
      { mes: "Fev", visitantes: 3400, ocupacao: 67 },
      { mes: "Mar", visitantes: 3200, ocupacao: 65 },
      { mes: "Abr", visitantes: 4100, ocupacao: 76 },
      { mes: "Mai", visitantes: 5200, ocupacao: 88 },
      { mes: "Jun", visitantes: 4800, ocupacao: 80 },
      { mes: "Jul", visitantes: 5500, ocupacao: 85 },
      { mes: "Ago", visitantes: 4600, ocupacao: 78 },
      { mes: "Set", visitantes: 4300, ocupacao: 75 },
      { mes: "Out", visitantes: 4500, ocupacao: 77 },
      { mes: "Nov", visitantes: 3900, ocupacao: 70 },
      { mes: "Dez", visitantes: 4700, ocupacao: 79 },
    ],
    tiposEvento: [
      { name: "Religioso", value: 12, color: "#359830" },
      { name: "Ecoturismo", value: 8, color: "#5BAF56" },
      { name: "Cultural", value: 6, color: "#287524" },
      { name: "Gastronômico", value: 4, color: "#F4A261" },
    ],
  },
  "Aiuruoca": {
    imagem: "/images/cidades/aiuruoca.jpg",
    tags: ["Pico do Papagaio", "Cachoeiras", "Turismo Rural e Zen"],
    descricao: "Destino lendário de ecoturismo e refúgio natural nas alturas da Serra da Mantiqueira, com centenas de quedas d'água cristalinas.",
    populacao: "6.500 hab.",
    hospedagens: 35,
    leitos: "1.100",
    restaurantes: 42,
    atrativos: [
      { nome: "Pico do Papagaio (2.105m)", categoria: "Montanhismo", nota: 4.9 },
      { nome: "Vale dos Garcias & Cachoeira dos Garcias", categoria: "Cachoeiras", nota: 4.9 },
      { nome: "Vale do Matutu", categoria: "Santuário Ecológico", nota: 5.0 },
    ],
    eventos: [
      { data: "11 set", titulo: "Travessia das Cachoeiras do Matutu", local: "Vale do Matutu", tipo: "Ecoturismo" },
      { data: "24 out", titulo: "Festival de Queijos Artesanais da Mantiqueira", local: "Praça Monsenhor Nagel", tipo: "Gastronomia" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 3200, ocupacao: 79 },
      { mes: "Fev", visitantes: 2900, ocupacao: 73 },
      { mes: "Mar", visitantes: 2700, ocupacao: 70 },
      { mes: "Abr", visitantes: 3400, ocupacao: 82 },
      { mes: "Mai", visitantes: 3800, ocupacao: 86 },
      { mes: "Jun", visitantes: 4200, ocupacao: 90 },
      { mes: "Jul", visitantes: 4900, ocupacao: 95 },
      { mes: "Ago", visitantes: 3900, ocupacao: 84 },
      { mes: "Set", visitantes: 3600, ocupacao: 81 },
      { mes: "Out", visitantes: 3700, ocupacao: 83 },
      { mes: "Nov", visitantes: 3300, ocupacao: 76 },
      { mes: "Dez", visitantes: 4100, ocupacao: 88 },
    ],
    tiposEvento: [
      { name: "Ecoturismo", value: 14, color: "#359830" },
      { name: "Gastronômico", value: 7, color: "#5BAF56" },
      { name: "Cultural", value: 5, color: "#287524" },
      { name: "Esportivo", value: 6, color: "#F4A261" },
    ],
  },
};

// Ordem prioritária baseada no mockup visual fornecido
const ORDEM_INICIAL = [
  "Varginha",
  "Poços de Caldas",
  "São Lourenço",
  "Caxambu",
  "Cambuquira",
  "Lambari",
  "Baependi",
  "Aiuruoca",
];

// Gerador de dados padrão consistentes para qualquer município
function gerarDadosPadrao(nome: string, slug: string): Cidade {
  const hash = nome.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hosp = 12 + (hash % 30);
  const leitosCalc = (hosp * 45 + (hash % 100)).toLocaleString("pt-BR");
  const rest = 25 + (hash % 70);
  const pop = (15000 + (hash * 137) % 65000).toLocaleString("pt-BR") + " hab.";

  return {
    id: slug,
    nome,
    imagem: `/images/cidades/${slug}.jpg`,
    slug,
    destaque: false,
    tags: ["Turismo Regional", "Cultura & Tradição", "Sul de Minas"],
    descricao: `${nome} é um acolhedor município do Sul de Minas Gerais, rico em tradições culturais, hospitalidade mineira, paisagens naturais e forte potencial para o desenvolvimento do turismo regional.`,
    populacao: pop,
    hospedagens: hosp,
    leitos: leitosCalc,
    restaurantes: rest,
    atrativos: [
      { nome: `Centro Histórico de ${nome}`, categoria: "Patrimônio Cultural", nota: 4.7 },
      { nome: "Igreja Matriz & Praça Central", categoria: "Histórico", nota: 4.6 },
      { nome: "Mirante Municipal da Serra", categoria: "Natureza", nota: 4.5 },
    ],
    eventos: [
      { data: "15 set", titulo: `Festa Tradicional de ${nome}`, local: "Praça da Matriz", tipo: "Festa Típica" },
      { data: "08 out", titulo: "Feira de Produtores Locais", local: "Espaço de Eventos", tipo: "Gastronomia" },
    ],
    dadosMensais: [
      { mes: "Jan", visitantes: 1800 + (hash % 800), ocupacao: 65 + (hash % 15) },
      { mes: "Fev", visitantes: 1600 + (hash % 700), ocupacao: 60 + (hash % 15) },
      { mes: "Mar", visitantes: 1500 + (hash % 600), ocupacao: 58 + (hash % 15) },
      { mes: "Abr", visitantes: 2100 + (hash % 800), ocupacao: 70 + (hash % 15) },
      { mes: "Mai", visitantes: 2400 + (hash % 900), ocupacao: 74 + (hash % 15) },
      { mes: "Jun", visitantes: 2900 + (hash % 1100), ocupacao: 80 + (hash % 15) },
      { mes: "Jul", visitantes: 3500 + (hash % 1300), ocupacao: 86 + (hash % 12) },
      { mes: "Ago", visitantes: 2600 + (hash % 900), ocupacao: 75 + (hash % 15) },
      { mes: "Set", visitantes: 2300 + (hash % 800), ocupacao: 72 + (hash % 15) },
      { mes: "Out", visitantes: 2500 + (hash % 850), ocupacao: 74 + (hash % 15) },
      { mes: "Nov", visitantes: 2000 + (hash % 700), ocupacao: 66 + (hash % 15) },
      { mes: "Dez", visitantes: 2700 + (hash % 1000), ocupacao: 78 + (hash % 15) },
    ],
    tiposEvento: [
      { name: "Gastronômico", value: 8 + (hash % 6), color: "#359830" },
      { name: "Cultural", value: 6 + (hash % 5), color: "#5BAF56" },
      { name: "Rural", value: 4 + (hash % 4), color: "#C90C0F" },
      { name: "Corporativo", value: 5 + (hash % 6), color: "#F4A261" },
    ],
  };
}

// Montagem do catálogo contendo apenas as cidades de destaque
export const CIDADES: Cidade[] = (() => {
  const cidadesMapeadas: Cidade[] = [];

  ORDEM_INICIAL.forEach((nome) => {
    const slug = gerarSlug(nome);
    const detalhes = CIDADES_DETALHADAS_BASE[nome] || {};
    const base = gerarDadosPadrao(nome, slug);

    cidadesMapeadas.push({
      ...base,
      ...detalhes,
      id: slug,
      nome,
      slug,
      destaque: true,
    });
  });

  return cidadesMapeadas;
})();
