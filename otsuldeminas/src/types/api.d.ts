declare interface ApiContacts {
  id: number;
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
  image: string;
  alt_text?: string;
  caption?: string;
  order?: number;
  is_cover?: boolean;
}

declare interface ApiCidade {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  state?: number | string;
  state_name?: string;
  ibge_code?: string;
  populacao?: number | string | null;
  pib?: number | string | null;
  pib_per_capita?: number | string | null;
  idh?: number | string | null;
  idhm?: number | string | null;
  hospedagens?: number | string | null;
  leitos?: number | string | null;
  restaurantes?: number | string | null;
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

declare interface ApiPontoTuristico {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cidade: number | ApiCidade;
  cidade_name?: string;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
}

declare interface ApiEventos {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cidade: number | ApiCidade;
  cidade_name?: string;
  start_date?: string;
  end_date?: string;
  imagens?: ApiImages[];
  contatos?: ApiContacts[];
}