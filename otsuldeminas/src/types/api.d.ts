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
  description: string;
  state: number;
  state_name: string;
  ibge_code: string;
  hospedagens: number | null;
  leitos?: number | null;
  restaurantes: number | null;
  populacao: number | string | null;
  pib: number | string | null;
  imagens: ApiImages[];
  contatos: ApiContacts[];
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
  imagens: ApiImages[];
  contatos: ApiContacts[];
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
  imagens: ApiImages[];
  contatos: ApiContacts[];
}