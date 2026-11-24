declare interface ApiContacts {
  id: number;
  object_id?: number;
  content_type?: number;
  type: string;
  type_display?: string;
  label?: string;
  value?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  order?: number;
}

declare interface ApiImages {
  id: number;
  content_type?: number;
  object_id?: number;
  image: string;
  alt_text?: string;
  caption?: string;
  order?: number;
  is_cover?: boolean;
}

declare interface ApiCidadeInformation {
  id?: number;
  populacao?: number | string | null;
  populacao_estimada?: number | string | null;
  pib?: number | string | null;
  pib_per_capta?: number | string | null;
  vab_servicos?: number | string | null;
  idh?: number | string | null;
  idhm?: number | string | null;
  hospedagens?: number | string | null;
  leitos?: number | string | null;
  restaurantes?: number | string | null;
  unidades_cultura_lazer?: number | string | null;
  empresas_atuantes?: number | string | null;
  pessoal_ocupado?: number | string | null;
  pessoal_assalariado?: number | string | null;
  salario_medio_mensal?: number | string | null;
  munic?: number | string | null;
  indicador_cultural_munic?: number | string | null;
  munic_cultura?: number | string | null;
  pnad?: number | string | null;
  estatistica_pnad?: number | string | null;
  pnad_rendimento?: number | string | null;
  pnad_ocupacao?: number | string | null;
  area_territorial?: number | string | null;
  area?: number | string | null;
  densidade_demografica?: number | string | null;
  densidade?: number | string | null;
  escolarizacao?: number | string | null;
  taxa_escolarizacao?: number | string | null;
  updated_at?: string | null;
}

declare interface ApiCidade {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  ibge_code?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  state?: number | string;
  state_name?: string;
  igr?: number | string | null;
  igr_ids?: number[];
  igr_name?: string | null;
  igrs?: { id: number; name: string; slug: string }[];
  information?: ApiCidadeInformation | null;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
  [key: string]: unknown;
}

declare interface ApiPagination<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

declare interface ApiEstado {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  abbreviation: string;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
}

declare interface ApiPontoTuristico {
  id: number;
  name: string;
  slug: string;
  category?: string;
  is_featured?: boolean;
  popularity?: number;
  description?: string;
  cidade: number | string;
  cidade_name?: string;
  cidade_slug?: string;
  cidade_state_name?: string;
  igr_id?: number | null;
  igr_ids?: number[];
  igr_name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
}

declare interface ApiEventos {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cidade: number | string;
  cidade_name?: string;
  cidade_slug?: string;
  cidade_state_name?: string;
  cidade_populacao?: number | null;
  cidade_latitude?: number | string | null;
  cidade_longitude?: number | string | null;
  is_featured?: boolean;
  popularity?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  start_date?: string;
  end_date?: string;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
}

declare interface ApiEstabelecimentoGeo {
  id: number;
  cnpj_completo?: string | null;
  nome: string;
  categoria: string;
  endereco?: string;
  telefone?: string;
  cidade: number | string;
  cidade_name?: string;
  cidade_slug?: string;
  cidade_state_name?: string;
  igr_id?: number | null;
  igr_ids?: number[];
  igr_name?: string | null;
  latitude: number | string;
  longitude: number | string;
}

declare interface ApiMapaCidade {
  id: number;
  name: string;
  slug: string;
  ibge_code?: string | null;
  state_name?: string | null;
  state_abbreviation?: string | null;
  igr_ids?: number[];
  igr_name?: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image?: string | null;
  populacao?: number | null;
  pib?: number | null;
  hospedagens?: number;
  restaurantes?: number;
  pontos_count: number;
  eventos_count: number;
}

declare interface ApiMapaOverview {
  cidades: ApiMapaCidade[];
  pontos_turisticos: ApiPontoTuristico[];
  eventos: ApiEventos[];
  estabelecimentos: ApiEstabelecimentoGeo[];
}

declare interface ApiIGR {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
  [key: string]: unknown;
}

declare interface ApiNoticia {
  id: number | string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  published_at: string;
  is_featured: boolean;
  cidade?: number | string | null;
  cidade_name?: string | null;
  cidade_slug?: string | null;
  igr?: number | string | null;
  igr_name?: string | null;
  igr_slug?: string | null;
  category?: string | null;
  author?: string | null;
  image?: string | null;
  imagens?: ApiImages[];
  tags?: string[];
  source_url?: string | null;
  [key: string]: unknown;
}
