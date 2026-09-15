/**
 * Integração direta com a API IBGE Agregados (SIDRA) e API de Localidades do IBGE.
 */

// Cache em memória para consultas repetidas
const IBGE_CACHE: {
  municipiosMG?: Array<{ id: number; nome: string; norm: string }>;
  dadosPorCidade: Record<string, IBGEDataCidade>;
} = {
  dadosPorCidade: {}
};

export interface IBGEDataCidade {
  ibgeId: number | null;
  populacao: string | null;
  populacaoFormatada: string;
  pibMilReais: string | null;
  pibFormatado: string;
  anoPib?: string;
  anoPopulacao?: string;
}

// Normalização para busca de município sem acento e em caixa baixa
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Obtém a lista de municípios de Minas Gerais (código UF 31)
 */
export async function getMunicipiosMG(): Promise<Array<{ id: number; nome: string; norm: string }>> {
  if (IBGE_CACHE.municipiosMG && IBGE_CACHE.municipiosMG.length > 0) {
    return IBGE_CACHE.municipiosMG;
  }

  try {
    const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios");
    if (!res.ok) return [];
    
    const data: Array<{ id: string | number; nome: string }> = await res.json();
    const list = data.map((m) => ({
      id: Number(m.id),
      nome: m.nome,
      norm: normalizarNome(m.nome)
    }));
    
    IBGE_CACHE.municipiosMG = list;
    return list;
  } catch (err) {
    console.error("Erro ao buscar municípios do IBGE:", err);
    return [];
  }
}

/**
 * Localiza o código IBGE de um município pelo nome
 */
export async function getCodigoIBGEMunicipio(nomeCidade: string): Promise<number | null> {
  const norm = normalizarNome(nomeCidade);
  const municipios = await getMunicipiosMG();
  
  const match = municipios.find(m => m.norm === norm);
  if (match) return match.id;

  // Busca aproximada caso haja pequena variação
  const partialMatch = municipios.find(m => m.norm.includes(norm) || norm.includes(m.norm));
  return partialMatch ? partialMatch.id : null;
}

/**
 * Formata o valor do PIB (que a API do IBGE retorna em Mil Reais) para notação em Bilhões / Milhões
 */
export function formatarPIB(valorMilReais: number | string | null | undefined): string {
  if (!valorMilReais) return "N/D";
  const valor = Number(String(valorMilReais).replace(/[^\d.-]/g, ""));
  if (isNaN(valor) || valor === 0) return "N/D";

  // O IBGE Agregado 5938 informa a variável 37 em Milhares de Reais (ex: 10068568 = R$ 10.068.568.000)
  const valorTotalReais = valor * 1000;

  if (valorTotalReais >= 1_000_000_000) {
    const bi = valorTotalReais / 1_000_000_000;
    return `R$ ${bi.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bi`;
  }
  if (valorTotalReais >= 1_000_000) {
    const mi = valorTotalReais / 1_000_000;
    return `R$ ${mi.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
  }
  return `R$ ${valorTotalReais.toLocaleString("pt-BR")}`;
}

/**
 * Formata o número da População residente (Censo IBGE)
 */
export function formatarPopulacao(pop: number | string | null | undefined): string {
  if (!pop) return "N/D";
  const num = Number(String(pop).replace(/[^\d]/g, ""));
  if (isNaN(num) || num === 0) return String(pop);
  return `${num.toLocaleString("pt-BR")} hab.`;
}

/**
 * Coleta os dados de População e PIB diretamente dos Agregados do IBGE (SIDRA)
 */
export async function fetchDadosIBGECidade(nomeCidade: string): Promise<IBGEDataCidade> {
  const normKey = normalizarNome(nomeCidade);
  
  if (IBGE_CACHE.dadosPorCidade[normKey]) {
    return IBGE_CACHE.dadosPorCidade[normKey];
  }

  const ibgeId = await getCodigoIBGEMunicipio(nomeCidade);

  if (!ibgeId) {
    const fallbackData: IBGEDataCidade = {
      ibgeId: null,
      populacao: null,
      populacaoFormatada: "N/D",
      pibMilReais: null,
      pibFormatado: "N/D"
    };
    return fallbackData;
  }

  try {
    // 1. População: Agregado 4714 (Censo 2022), Variável 93 (População residente)
    // 2. PIB: Agregado 5938 (Produto Interno Bruto), Variável 37 (PIB a preços correntes em Mil R$)
    const [popResponse, pibResponse] = await Promise.all([
      fetch(
        `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[${ibgeId}]`
      ).then(r => (r.ok ? r.json() : [])).catch(() => []),
      fetch(
        `https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/-1/variaveis/37?localidades=N6[${ibgeId}]`
      ).then(r => (r.ok ? r.json() : [])).catch(() => [])
    ]);

    // Extrair população
    let popVal: string | null = null;
    let anoPop: string = "2022";
    if (popResponse && popResponse[0]?.resultados?.[0]?.series?.[0]?.serie) {
      const serie = popResponse[0].resultados[0].series[0].serie;
      const chaves = Object.keys(serie);
      if (chaves.length > 0) {
        anoPop = chaves[chaves.length - 1];
        popVal = serie[anoPop];
      }
    }

    // Extrair PIB
    let pibVal: string | null = null;
    let anoPib: string = "2023";
    if (pibResponse && pibResponse[0]?.resultados?.[0]?.series?.[0]?.serie) {
      const serie = pibResponse[0].resultados[0].series[0].serie;
      const chaves = Object.keys(serie);
      if (chaves.length > 0) {
        anoPib = chaves[chaves.length - 1];
        pibVal = serie[anoPib];
      }
    }

    const result: IBGEDataCidade = {
      ibgeId,
      populacao: popVal,
      populacaoFormatada: formatarPopulacao(popVal),
      pibMilReais: pibVal,
      pibFormatado: formatarPIB(pibVal),
      anoPib,
      anoPopulacao: anoPop
    };

    IBGE_CACHE.dadosPorCidade[normKey] = result;
    return result;
  } catch (err) {
    console.error(`Erro ao consultar API IBGE para ${nomeCidade}:`, err);
    return {
      ibgeId,
      populacao: null,
      populacaoFormatada: "N/D",
      pibMilReais: null,
      pibFormatado: "N/D"
    };
  }
}
