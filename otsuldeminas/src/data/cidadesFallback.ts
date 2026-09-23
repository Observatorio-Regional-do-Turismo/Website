import municipiosJson from "./municipios.json";

function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Cidades de referência com dados específicos conhecidos
const DADOS_CONHECIDOS: Record<string, Partial<ApiCidade>> = {
  "Poços de Caldas": {
    populacao: "163.742",
    pib: 9200000,
    idh: 0.779,
    hospedagens: 124,
    restaurantes: 450,
    munic: "Estrutura Plena",
    pnad: "71.2%",
    area_territorial: 546.6,
    densidade_demografica: 299.5,
    escolarizacao: 97.9,
    description: "Principal estância hidromineral e turística do Sul de Minas Gerais, famosa por suas termas, parques, arquitetura histórica e vibrante cena cultural.",
  },
  "Pouso Alegre": {
    populacao: "152.262",
    pib: 12800000,
    idh: 0.774,
    hospedagens: 48,
    restaurantes: 380,
    munic: "Conselho & Fundo",
    pnad: "74.8%",
    area_territorial: 543.0,
    densidade_demografica: 280.4,
    escolarizacao: 97.5,
    description: "Importante polo industrial, comercial e de serviços do Sul de Minas, com posição geográfica estratégica e forte atividade de negócios e eventos.",
  },
  "Varginha": {
    populacao: "136.467",
    pib: 7100000,
    idh: 0.778,
    hospedagens: 38,
    restaurantes: 310,
    munic: "Conselho & Fundo",
    pnad: "72.4%",
    area_territorial: 395.4,
    densidade_demografica: 345.1,
    escolarizacao: 98.1,
    description: "Conhecida internacionalmente pelo caso do ET e capital nacional do café, Varginha é um centro de inovação, negócios e turismo rural.",
  },
  "Itajubá": {
    populacao: "93.073",
    pib: 4600000,
    idh: 0.787,
    hospedagens: 29,
    restaurantes: 220,
    munic: "Conselho & Fundo",
    pnad: "69.8%",
    area_territorial: 294.8,
    densidade_demografica: 315.7,
    escolarizacao: 98.4,
    description: "Polo tecnológico, educacional e aeronáutico de Minas Gerais, cercada pela Serra da Mantiqueira com grande vocação para turismo científico e de aventura.",
  },
  "Lavras": {
    populacao: "104.761",
    pib: 3900000,
    idh: 0.782,
    hospedagens: 24,
    restaurantes: 240,
    munic: "Conselho Ativo",
    pnad: "70.5%",
    area_territorial: 564.7,
    densidade_demografica: 185.5,
    escolarizacao: 98.2,
    description: "Terra dos Ipês e das Escolas, sede de universidades de excelência e ponto de partida para circuitos históricos e naturais da região.",
  },
  "Passos": {
    populacao: "111.939",
    pib: 4200000,
    idh: 0.756,
    hospedagens: 32,
    restaurantes: 260,
    munic: "Conselho & Fundo",
    pnad: "68.9%",
    area_territorial: 1338.0,
    densidade_demografica: 83.6,
    escolarizacao: 97.1,
    description: "Porta de entrada para o Lago de Furnas e a Serra da Canastra, Passos combina confecções, agronegócio e ecoturismo exuberante.",
  },
  "Alfenas": {
    populacao: "78.966",
    pib: 3100000,
    idh: 0.761,
    hospedagens: 26,
    restaurantes: 190,
    munic: "Conselho Ativo",
    pnad: "69.1%",
    area_territorial: 850.5,
    densidade_demografica: 92.8,
    escolarizacao: 97.6,
    description: "Banhada pelo Lago de Furnas, Alfenas é polo universitário, cafeeiro e náutico de destaque na região Sul Mineira.",
  },
  "São Lourenço": {
    populacao: "44.773",
    pib: 1450000,
    idh: 0.759,
    hospedagens: 86,
    restaurantes: 180,
    munic: "Estrutura Plena",
    pnad: "73.0%",
    area_territorial: 57.2,
    densidade_demografica: 782.7,
    escolarizacao: 98.0,
    description: "Coração do Circuito das Águas, famosa internacionalmente por seu Parque das Águas minerais terapêuticas, passeios de Maria Fumaça e gastronomia.",
  },
  "Caxambu": {
    populacao: "21.045",
    pib: 620000,
    idh: 0.748,
    hospedagens: 52,
    restaurantes: 95,
    munic: "Conselho & Fundo",
    pnad: "71.5%",
    area_territorial: 100.2,
    densidade_demografica: 210.0,
    escolarizacao: 97.8,
    description: "Maior complexo hidromineral do planeta, com 12 fontes de águas gasosas e gasocarbônicas com propriedades medicinais únicas em ambiente histórico.",
  },
  "Extrema": {
    populacao: "53.482",
    pib: 11500000,
    idh: 0.732,
    hospedagens: 42,
    restaurantes: 160,
    munic: "Conselho & Fundo",
    pnad: "76.2%",
    area_territorial: 244.6,
    densidade_demografica: 218.6,
    escolarizacao: 96.9,
    description: "Portal de entrada de Minas Gerais pela Serra da Mantiqueira, com impressionante crescimento econômico, ecoturismo de montanha e rafting.",
  },
  "Monte Verde (Camanducaia)": {
    populacao: "26.097",
    pib: 890000,
    idh: 0.718,
    hospedagens: 180,
    restaurantes: 220,
    munic: "Conselho Ativo",
    pnad: "75.0%",
    area_territorial: 527.6,
    densidade_demografica: 49.5,
    escolarizacao: 96.5,
    description: "Conhecido como a Suíça Mineira, distrito charmoso nas altas altitudes da Mantiqueira com fondue, fábricas de chocolate, pousadas de luxo e trilhas.",
  },
  "Gonçalves": {
    populacao: "4.743",
    pib: 120000,
    idh: 0.725,
    hospedagens: 95,
    restaurantes: 60,
    munic: "Conselho Ativo",
    pnad: "72.0%",
    area_territorial: 187.6,
    densidade_demografica: 25.3,
    escolarizacao: 98.3,
    description: "Destino nobre de montanha, refúgio de artistas, gastronomia autoral caipira, pousadas intimistas e cachoeiras exuberantes na Mantiqueira.",
  },
  "Capitólio": {
    populacao: "10.380",
    pib: 480000,
    idh: 0.745,
    hospedagens: 65,
    restaurantes: 90,
    munic: "Conselho Ativo",
    pnad: "73.5%",
    area_territorial: 521.8,
    densidade_demografica: 19.9,
    escolarizacao: 97.4,
    description: "O Mar de Minas! Cânions monumentais, cachoeiras de águas verde-esmeralda e passeios náuticos inesquecíveis no Lago de Furnas.",
  }
};

export function gerarCidadesFallback(): ApiCidade[] {
  const municipios: string[] = Array.isArray(municipiosJson) ? municipiosJson : [];

  return municipios.map((nome, index) => {
    const slug = gerarSlug(nome);
    const dadosEsp = DADOS_CONHECIDOS[nome];

    // Código sintético usado somente para identificar registros locais de fallback.
    const hash = nome.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);

    const baseCidade: ApiCidade = {
      id: index + 1,
      name: nome,
      slug: slug,
      state: 31,
      state_name: "Minas Gerais",
      ibge_code: `31${String(10000 + (hash % 89999))}`,
      description: `${nome} é um acolhedor município da Região Sul de Minas Gerais, rico em patrimônio histórico, cultura mineira, hospitalidade e atrativos naturais que impulsionam o turismo regional.`,
      imagens: [
        {
          id: index + 1,
          image: `/images/cidades/${slug}.jpg`,
          alt_text: `Foto de ${nome}`,
          is_cover: true,
        }
      ],
      contatos: [
        {
          id: index + 1,
          type: "Secretaria de Turismo",
          type_display: "Secretaria de Turismo & Cultura",
          value: "(35) 3000-0000",
          address: `Praça Central, Centro - ${nome}, MG`,
        }
      ]
    };

    if (dadosEsp) {
      const indicadores = new Set([
        "populacao", "pib", "pib_per_capita", "idh", "idhm", "hospedagens", "leitos", "restaurantes",
        "munic", "indicador_cultural_munic", "munic_cultura", "pnad", "estatistica_pnad",
        "pnad_rendimento", "pnad_ocupacao", "area_territorial", "area", "densidade_demografica",
        "densidade", "escolarizacao", "taxa_escolarizacao",
      ]);
      const dadosNaoIndicadores = Object.fromEntries(Object.entries(dadosEsp).filter(([key]) => !indicadores.has(key)));
      return {
        ...baseCidade,
        ...dadosNaoIndicadores,
      };
    }

    return baseCidade;
  });
}
