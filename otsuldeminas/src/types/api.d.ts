declare interface ApiContacts{
  id: number;
  type: string;
  type_display: string;
  value: string;
  address: string;
  latitude?: number;
  longitude?: number;
  order: number;
}

declare interface ApiImages{
  id: number;
  image: string;
  alt_text: string;
  capiton: string;
  order: number;
  is_cover: boolean;
}

declare interface ApiCidade {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: number;
  state_name: string;
  ibge_code: string;
  hospedagens: number;
  leitos: number;
  restaurantes: number;
  populacao: number;
  imagens: ApiImages[];
}

declare interface ApiPagination<T>{
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}