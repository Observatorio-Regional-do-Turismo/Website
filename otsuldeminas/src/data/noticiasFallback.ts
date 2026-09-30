import axios from "axios";

export const NOTICIAS_FALLBACK: ApiNoticia[] = [
  {
    id: 1,
    title: "Poços de Caldas lidera ocupação hoteleira no Sul de Minas com alta procura nas Thermas",
    slug: "pocos-de-caldas-lidera-ocupacao-hoteleira-thermas",
    summary: "Estância hidromineral atinge 92% de ocupação no último final de semana com turistas em busca de bem-estar, águas termais e gastronomia de altitude.",
    content: "O turismo de saúde e bem-estar impulsionou a rede hoteleira de Poços de Caldas, que registrou recorde de visitantes no último mês. As históricas Thermas Antonio Carlos e os passeios pelo Parque do Cristo foram os atrativos mais procurados por famílias e casais de São Paulo, Rio de Janeiro e do interior mineiro.",
    published_at: "2026-09-28T14:30:00Z",
    is_featured: true,
    cidade: "pocos-de-caldas",
    cidade_name: "Poços de Caldas",
    cidade_slug: "pocos-de-caldas",
    igr: "caminhos-gerais",
    igr_name: "IGR Circuito Caminhos Gerais",
    igr_slug: "caminhos-gerais",
    category: "Hotelaria & Turismo",
    author: "Observatório Sul de Minas",
    image: "/images/cidades-hero.jpg",
    tags: ["Termalismo", "Hotelaria", "Caminhos Gerais"]
  },
  {
    id: 2,
    title: "Circuito das Águas amplia roteiro termal integrando Caxambu, São Lourenço e Baependi",
    slug: "circuito-das-aguas-amplia-roteiro-termal",
    summary: "Nova rota regional conecta balneários imperiais, turismo religioso no Santuário de Nhá Chica e trilhas de cachoeiras da Mantiqueira.",
    content: "A governança do Circuito das Águas de Minas oficializou o novo roteiro integrado de bem-estar. A iniciativa permite aos turistas adquirir passaportes combinados para banhos minerais, passeios no Trem das Águas e visitação às queijarias artesanais da região.",
    published_at: "2026-09-26T09:15:00Z",
    is_featured: true,
    cidade: "caxambu",
    cidade_name: "Caxambu",
    cidade_slug: "caxambu",
    igr: "circuito-aguas",
    igr_name: "IGR Circuito das Águas de Minas",
    igr_slug: "circuito-aguas",
    category: "Regionalização",
    author: "SECULT / IGR Águas",
    image: "/images/hero-bg.png",
    tags: ["Águas Minerais", "Caxambu", "São Lourenço"]
  },
  {
    id: 3,
    title: "Polo de Malhas de Monte Sião e Jacutinga registra faturamento recorde em feiras de inverno",
    slug: "polo-malhas-monte-siao-jacutinga-faturamento-recorde",
    summary: "Festimalha e Festival Nacional do Tricô movimentaram mais de R$ 45 milhões e atraíram compradores de todo o país.",
    content: "O turismo de compras no Circuito das Malhas do Sul de Minas demonstrou forte vigor com a antecipação das coleções de meia-estação. Hotéis e pousadas de Monte Sião, Jacutinga e Inconfidentes operaram com capacidade máxima durante os eventos.",
    published_at: "2026-09-24T18:00:00Z",
    is_featured: true,
    cidade: "monte-siao",
    cidade_name: "Monte Sião",
    cidade_slug: "monte-siao",
    igr: "malhas-sul-minas",
    igr_name: "IGR Circuito das Malhas do Sul de Minas",
    igr_slug: "malhas-sul-minas",
    category: "Turismo de Compras",
    author: "Associação Comercial",
    image: "/images/selos-hero.jpg",
    tags: ["Tricô", "Compras", "Moda Mineira"]
  },
  {
    id: 4,
    title: "Andradas fortalece enoturismo com novas vinícolas de altitude e degustações na Serra",
    slug: "andradas-fortalece-enoturismo-novas-vinicolas",
    summary: "A 'Terra do Vinho' no Sul de Minas atrai enófilos com vinhos finos de inverno premiados internacionalmente e passeios na Pedra do Elefante.",
    content: "Com a técnica de dupla poda e colheita de inverno, as vinícolas de Andradas colocaram o Sul de Minas no mapa dos melhores Syrahs do Brasil. O fluxo turístico nas propriedades rurais cresceu 35% no último trimestre.",
    published_at: "2026-09-22T11:45:00Z",
    is_featured: false,
    cidade: "andradas",
    cidade_name: "Andradas",
    cidade_slug: "andradas",
    igr: "caminhos-gerais",
    igr_name: "IGR Circuito Caminhos Gerais",
    igr_slug: "caminhos-gerais",
    category: "Enoturismo & Gastronomia",
    author: "Observatório Sul de Minas",
    image: "/images/cidades-hero.jpg",
    tags: ["Vinho", "Andradas", "Gastronomia"]
  },
  {
    id: 5,
    title: "Monte Verde registra recorde de turistas em busca de ecoturismo e fondue na Mantiqueira",
    slug: "monte-verde-recorde-turistas-mantiqueira",
    summary: "Distrito de Camanducaia se consolida como refúgio de inverno e natureza, com trilhas da Pedra Redonda e pousadas intimistas lotadas.",
    content: "A vila de Monte Verde destacou-se pela gastronomia europeia mesclada ao acolhimento mineiro. As caminhadas pela mata nativa e a observação de pássaros foram as principais atividades diurnas dos visitantes.",
    published_at: "2026-09-20T16:20:00Z",
    is_featured: true,
    cidade: "camanducaia",
    cidade_name: "Camanducaia",
    cidade_slug: "camanducaia",
    igr: "serras-verdes",
    igr_name: "IGR Circuito Serras Verdes",
    igr_slug: "serras-verdes",
    category: "Ecoturismo",
    author: "Associação de Pousadas",
    image: "/images/sul_de_minas_bg.jpg",
    tags: ["Monte Verde", "Mantiqueira", "Ecoturismo"]
  },
  {
    id: 6,
    title: "Varginha e Botelhos recebem festival internacional de cafés especiais vulcânicos",
    slug: "varginha-botelhos-festival-cafes-vulcanicos",
    summary: "Produtores premiados e baristas debatem a denominação de origem dos cafés de montanha do Sul de Minas.",
    content: "O evento reuniu compradores asiáticos e europeus interessados nos microlotes de cafés de altitude da região. As fazendas históricas abriram suas portas para visitas guiadas sobre processos de fermentação e degustação às cegas.",
    published_at: "2026-09-18T10:00:00Z",
    is_featured: false,
    cidade: "varginha",
    cidade_name: "Varginha",
    cidade_slug: "varginha",
    igr: "caminhos-gerais",
    igr_name: "IGR Circuito Caminhos Gerais",
    igr_slug: "caminhos-gerais",
    category: "Agroturismo",
    author: "Rede de Produtores",
    image: "/images/selos-hero.jpg",
    tags: ["Café Especial", "Varginha", "Agroturismo"]
  },
  {
    id: 7,
    title: "São Lourenço lança novo calendário de balonismo e passeios ecológicos no Rio Verde",
    slug: "sao-lourenco-balonismo-rio-verde",
    summary: "Estância hidromineral diversifica atrativos com voos panorâmicos de balão e descidas de caiaque ao longo do vale.",
    content: "Além do consagrado Parque das Águas e do Trem da Serra, São Lourenço aposta em experiências ao ar livre na Mantiqueira, atraindo esportistas e famílias de várias regiões do país.",
    published_at: "2026-09-15T15:10:00Z",
    is_featured: false,
    cidade: "sao-lourenco",
    cidade_name: "São Lourenço",
    cidade_slug: "sao-lourenco",
    igr: "circuito-aguas",
    igr_name: "IGR Circuito das Águas de Minas",
    igr_slug: "circuito-aguas",
    category: "Aventura",
    author: "Secretaria de Turismo",
    image: "/images/hero-bg.png",
    tags: ["São Lourenço", "Balonismo", "Aventura"]
  },
  {
    id: 8,
    title: "Capitólio e Lago de Furnas anunciam reforço em turismo náutico sustentável e ecologia",
    slug: "capitolio-lago-furnas-turismo-nautico-sustentavel",
    summary: "Cânions e cachoeiras contam com novos protocolos de visitação consciente e preservação ambiental.",
    content: "As marinas e operadoras de passeios de lancha em Capitólio e cidades vizinhas adotaram novas diretrizes para garantir a segurança dos turistas e a proteção dos ecossistemas aquáticos do Mar de Minas.",
    published_at: "2026-09-12T13:40:00Z",
    is_featured: false,
    cidade: "capitolio",
    cidade_name: "Capitólio",
    cidade_slug: "capitolio",
    igr: "vale-do-rio-grande",
    igr_name: "IGR Vale do Rio Grande",
    igr_slug: "vale-do-rio-grande",
    category: "Turismo Náutico",
    author: "Associação Náutica",
    image: "/images/cidades-hero.jpg",
    tags: ["Capitólio", "Furnas", "Náutico"]
  },
  {
    id: 9,
    title: "Queijos finos de Cruzília e Alagoa conquistam medalhas em concurso mundial na França",
    slug: "queijos-finos-cruzilia-alagoa-medalhas-franca",
    summary: "Tradição queijeira do Sul de Minas ganha notoriedade global, atraindo fluxo de turismo gastronômico.",
    content: "Os queijos artesanais produzidos nas altitudes da Mantiqueira foram condecorados pelo sabor inigualável e respeito às técnicas de maturação tradicionais, impulsionando a Rota do Queijo Mineiro.",
    published_at: "2026-09-10T08:30:00Z",
    is_featured: false,
    cidade: "cruzilia",
    cidade_name: "Cruzília",
    cidade_slug: "cruzilia",
    igr: "circuito-aguas",
    igr_name: "IGR Circuito das Águas de Minas",
    igr_slug: "circuito-aguas",
    category: "Gastronomia",
    author: "Observatório Sul de Minas",
    image: "/images/sul_de_minas_bg.jpg",
    tags: ["Queijo", "Cruzília", "Gastronomia"]
  }
];

function normalizarTexto(txt?: string | null): string {
  if (!txt) return "";
  return txt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca notícias da API ou retorna dados locais de fallback
 */
export async function fetchNoticias(): Promise<ApiNoticia[]> {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) return NOTICIAS_FALLBACK;

  const cleanUrl = rawUrl.trim().replace(/\/$/, "");

  try {
    const res = await axios.get<ApiPagination<ApiNoticia> | ApiNoticia[]>(`${cleanUrl}/noticias/`, { timeout: 8000 });
    if (Array.isArray(res.data)) {
      return res.data.length > 0 ? res.data : NOTICIAS_FALLBACK;
    } else if (res.data && Array.isArray((res.data as ApiPagination<ApiNoticia>).results)) {
      const results = (res.data as ApiPagination<ApiNoticia>).results;
      return results.length > 0 ? results : NOTICIAS_FALLBACK;
    }
    return NOTICIAS_FALLBACK;
  } catch {
    return NOTICIAS_FALLBACK;
  }
}

/**
 * Retorna as notícias em destaque ordenadas por data decrescente
 */
export function getNoticiasDestaque(noticias: ApiNoticia[] = NOTICIAS_FALLBACK): ApiNoticia[] {
  return [...noticias]
    .filter((n) => n.is_featured)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
}

/**
 * Retorna as notícias separadas em Destaque e Comuns para uma cidade específica
 */
export function getNoticiasPorCidade(
  cidadeNomeOuId: string | number,
  noticias: ApiNoticia[] = NOTICIAS_FALLBACK
): { destaque: ApiNoticia[]; comuns: ApiNoticia[]; total: number } {
  const normTarget = normalizarTexto(String(cidadeNomeOuId));

  const filtradas = noticias.filter((n) => {
    const nomeNorm = normalizarTexto(n.cidade_name);
    const slugNorm = normalizarTexto(n.cidade_slug || String(n.cidade));
    const titleNorm = normalizarTexto(n.title);
    const summaryNorm = normalizarTexto(n.summary);

    return (
      nomeNorm === normTarget ||
      slugNorm === normTarget ||
      nomeNorm.includes(normTarget) ||
      normTarget.includes(nomeNorm) ||
      titleNorm.includes(normTarget) ||
      summaryNorm.includes(normTarget)
    );
  });

  const ordenadas = filtradas.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const destaque = ordenadas.filter((n) => n.is_featured);
  const comuns = ordenadas.filter((n) => !n.is_featured);

  return { destaque, comuns, total: ordenadas.length };
}

/**
 * Retorna as notícias separadas em Destaque e Comuns para uma IGR específica
 */
export function getNoticiasPorIGR(
  igrNomeOuSlug: string | number,
  noticias: ApiNoticia[] = NOTICIAS_FALLBACK
): { destaque: ApiNoticia[]; comuns: ApiNoticia[]; total: number } {
  const normTarget = normalizarTexto(String(igrNomeOuSlug));

  const filtradas = noticias.filter((n) => {
    const igrNameNorm = normalizarTexto(n.igr_name);
    const igrSlugNorm = normalizarTexto(n.igr_slug || String(n.igr));
    const titleNorm = normalizarTexto(n.title);
    const summaryNorm = normalizarTexto(n.summary);

    return (
      igrNameNorm === normTarget ||
      igrSlugNorm === normTarget ||
      igrNameNorm.includes(normTarget) ||
      normTarget.includes(igrNameNorm) ||
      titleNorm.includes(normTarget) ||
      summaryNorm.includes(normTarget)
    );
  });

  const ordenadas = filtradas.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const destaque = ordenadas.filter((n) => n.is_featured);
  const comuns = ordenadas.filter((n) => !n.is_featured);

  return { destaque, comuns, total: ordenadas.length };
}
