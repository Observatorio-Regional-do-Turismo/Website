export interface AnalyticsRecord {
  Município: string;
  Classificação: string;
  Estabelecimentos?: string | number;
  Funcionarios?: string | number;
  Ano?: string;
  Mês?: string;
  Estoque?: string | number;
  Saldo?: string | number;
  [key: string]: unknown;
}

export type DataType = 'estabelecimentos' | 'funcionarios' | 'estoque' | 'postos';

export interface CacheMetric {
  durationMs: number;
  recordCount: number;
  payloadBytes: number;
  fromCache: boolean;
}

// Cache global em memória para evitar refetching e reprocessamento entre navegações
export const globalCache: Record<string, AnalyticsRecord[]> = {};
export const lastFetchErrors: Record<string, string | null> = {};
export const cacheMetrics: Record<string, CacheMetric> = {};

// Deduplicação de requisições concorrentes e geração de cache para evitar corridas após limpeza
const inFlightRequests: Record<string, Promise<AnalyticsRecord[]> | undefined> = {};
let cacheGeneration = 0;

/** Normaliza strings removendo acentos, hífens, espaços extras e convertendo para minúsculas. */
export function normalizeText(text?: unknown): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00A0\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function normalizeNumericString(raw: unknown): string | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? String(raw) : null;
  }
  if (raw === null || raw === undefined || typeof raw === 'boolean' || typeof raw === 'object') {
    return null;
  }

  let str = String(raw).trim();
  if (!str) return null;

  str = str.replace(/[\s\u00A0]+/g, '');
  if (!str) return null;

  if (/^[+-]?\d+(?:\.\d+)?e[+-]?\d+$/i.test(str)) {
    return Number.isFinite(Number(str)) ? str : null;
  }

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    if (/^[+-]?[1-9]\d{0,2}(?:,\d{3})+$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (hasDot) {
    if (/^[+-]?[1-9]\d{0,2}(?:\.\d{3})+$/.test(str)) {
      str = str.replace(/\./g, '');
    }
  }

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(str)) {
    return null;
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? str : null;
}

/** Verifica se um valor bruto representa um número finito válido (rejeitando tokens como 'N/A', '-' ou strings vazias). */
export function isValidNumericInput(raw: unknown): boolean {
  return normalizeNumericString(raw) !== null;
}

/** Converte valores numéricos brutos (incluindo formatos pt-BR, en-US e notação científica) em número finito. */
export function parseNumericValue(raw: unknown): number {
  const normalized = normalizeNumericString(raw);
  if (normalized === null) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Padroniza nomes das Atividades Características do Turismo (ACTs) para rótulos consistentes em todo o site. */
export function normalizarClassificacaoCurta(rawClass?: unknown): string {
  const original = String(rawClass ?? '').trim();
  if (!original) return 'Outros Serviços';

  const normalized = normalizeText(original);
  if (
    normalized.includes('alojamento') ||
    normalized.includes('hospedag') ||
    normalized.includes('hotel') ||
    normalized.includes('pousada')
  ) {
    return 'Hospedagem';
  }
  if (
    normalized.includes('alimenta') ||
    normalized.includes('restaurante') ||
    /\bbar(es)?\b/.test(normalized) ||
    normalized.includes('lanchonete') ||
    normalized.includes('bebid') ||
    normalized.includes('bufe') ||
    normalized.includes('catering') ||
    normalized.includes('comida') ||
    normalized.includes('refeic')
  ) {
    return 'Alimentação';
  }
  if (
    normalized.includes('transport') ||
    normalized.includes('aluguel de automov') ||
    normalized.includes('locacao de veic')
  ) {
    return 'Transporte';
  }
  if (
    normalized.includes('agenc') ||
    normalized.includes('operador') ||
    normalized.includes('reserva')
  ) {
    return 'Agências';
  }
  if (
    normalized.includes('cultura') ||
    normalized.includes('lazer') ||
    normalized.includes('entreten') ||
    normalized.includes('museu') ||
    normalized.includes('parque') ||
    normalized.includes('patrimon') ||
    normalized.includes('teatro') ||
    normalized.includes('restauracao')
  ) {
    return 'Cultura e Lazer';
  }
  if (normalized.includes('outros') || normalized.includes('outras')) {
    return 'Outros Serviços';
  }
  if (normalized.includes('comercio')) {
    return 'Comércio e Serviços';
  }
  return original;
}

/** Retorna a URL base configurada da API de gráficos sem barra final, ou null se ausente. */
export function getGraphsApiBaseUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_GRAPHS_URL ?? '').trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

/** A API de gráficos espera o código IBGE com 6 dígitos (sem o dígito verificador). */
export function getCodigoIBGEParaGraficos(codigo?: string | number | null): string | null {
  const digits = String(codigo ?? '')
    .trim()
    .replace(/[.,]0+$/, '')
    .replace(/\D/g, '');
  if (digits.length === 7) return digits.slice(0, 6);
  return digits.length === 6 ? digits : null;
}

/** Parser de linha CSV compatível com campos entre aspas e delimitador configurável (RFC 4180). */
export function parseCSVLine(line: string, delimiter = ','): string[] {
  const cleanLine = line.replace(/^\uFEFF/, '');
  if (cleanLine === '') return [];

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < cleanLine.length; i++) {
    const ch = cleanLine[i];
    if (ch === '"') {
      if (inQuotes && cleanLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeYear(raw: unknown): string | null {
  const trimmed = String(raw ?? '').trim();
  return /^\d{4}$/.test(trimmed) ? trimmed : null;
}

function normalizeMonth(raw: unknown): string | null {
  const trimmed = String(raw ?? '').trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  const num = Number.parseInt(trimmed, 10);
  if (num < 1 || num > 12) return null;
  return String(num).padStart(2, '0');
}

function splitCSVRecords(text: string): { records: string[]; hasUnclosedQuote: boolean } {
  const records: string[] = [];
  const len = text.length;
  let start = 0;
  let inQuotes = false;

  for (let i = 0; i < len; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 34) {
      if (inQuotes && i + 1 < len && text.charCodeAt(i + 1) === 34) {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (ch === 10 || ch === 13)) {
      const rec = text.slice(start, i);
      if (rec.trim().length > 0) {
        records.push(rec);
      }
      if (ch === 13 && i + 1 < len && text.charCodeAt(i + 1) === 10) {
        i++;
      }
      start = i + 1;
    }
  }

  if (inQuotes) {
    return { records, hasUnclosedQuote: true };
  }

  if (start < len) {
    const lastRec = text.slice(start);
    if (lastRec.trim().length > 0) {
      records.push(lastRec);
    }
  }

  return { records, hasUnclosedQuote: false };
}

function detectCSVDelimiter(headerLine: string): string {
  let inQuotes = false;
  let hasComma = false;
  let hasSemicolon = false;

  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (ch === ',') hasComma = true;
      else if (ch === ';') hasSemicolon = true;
    }
  }

  return !hasComma && hasSemicolon ? ';' : ',';
}

function findHeaderIndex(headers: string[], exactNames: string[], partialNames: string[]): number {
  const normalizedHeaders = headers.map((h) => normalizeText(h));
  for (const exact of exactNames) {
    const idx = normalizedHeaders.findIndex((h) => h === exact);
    if (idx >= 0) return idx;
  }
  for (const partial of partialNames) {
    const idx = normalizedHeaders.findIndex((h) => h.includes(partial));
    if (idx >= 0) return idx;
  }
  return -1;
}

function resolveFetchUrl(url: string, type: DataType): string {
  // O backend exige codigo_ibge para JSON em estoque/postos; na visão regional, utiliza-se CSV compacto
  if (
    (type === 'estoque' || type === 'postos') &&
    !url.includes('codigo_ibge') &&
    !/[?&]export=csv(?:&|$)/i.test(url)
  ) {
    return url.includes('?') ? `${url}&export=csv` : `${url}?export=csv`;
  }
  return url;
}

/** Constrói a chave determinística usada no cache e no rastreamento de erros. */
export function buildCacheKey(url: string, type: DataType): string {
  const fetchUrl = resolveFetchUrl(url, type);
  return url.includes('?') ? `${type}:${fetchUrl}` : type;
}

/** Retorna se determinada chave de dados já se encontra disponível no cache em memória. */
export function hasCachedData(type: DataType, url?: string): boolean {
  const key = url ? buildCacheKey(url, type) : type;
  return Boolean(globalCache[key] && globalCache[key].length > 0);
}

/** Retorna as métricas de tempo e volume da última consulta para determinado tipo ou URL. */
export function getCacheMetric(type: DataType, url?: string): CacheMetric | null {
  const key = url ? buildCacheKey(url, type) : type;
  return cacheMetrics[key] ?? null;
}

/** Retorna se a última requisição para determinado tipo de dado (ou URL específica) falhou na rede/HTTP. */
export function hasFetchError(type: DataType, url?: string): boolean {
  if (url) {
    return Boolean(lastFetchErrors[buildCacheKey(url, type)]);
  }
  return Boolean(lastFetchErrors[type]);
}

/** Limpa o cache em memória de forma global ou seletiva por tipo/URL (útil em retentativas após erro). */
export function clearAnalyticsCache(type?: DataType, url?: string): void {
  cacheGeneration++;
  if (type) {
    const key = url ? buildCacheKey(url, type) : type;
    delete globalCache[key];
    delete lastFetchErrors[key];
    delete cacheMetrics[key];
    delete inFlightRequests[key];
    if (!url) {
      delete lastFetchErrors[type];
    }
    return;
  }
  Object.keys(globalCache).forEach((k) => delete globalCache[k]);
  Object.keys(lastFetchErrors).forEach((k) => delete lastFetchErrors[k]);
  Object.keys(cacheMetrics).forEach((k) => delete cacheMetrics[k]);
  Object.keys(inFlightRequests).forEach((k) => delete inFlightRequests[k]);
}

export const fetchJSONAndFlatten = async (url: string, type: DataType): Promise<AnalyticsRecord[]> => {
  const fetchUrl = resolveFetchUrl(url, type);
  const cacheKey = buildCacheKey(url, type);
  const isRegional = cacheKey === type;
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (globalCache[cacheKey]) {
    lastFetchErrors[cacheKey] = null;
    if (isRegional) {
      lastFetchErrors[type] = null;
    }
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    cacheMetrics[cacheKey] = {
      durationMs: Number(elapsed.toFixed(2)),
      recordCount: globalCache[cacheKey].length,
      payloadBytes: cacheMetrics[cacheKey]?.payloadBytes ?? 0,
      fromCache: true,
    };
    return globalCache[cacheKey];
  }

  // Reaproveita o cache completo de 'postos' já baixado no Dashboard quando o modal consulta uma cidade
  if (type === 'postos' && url.includes('codigo_ibge') && globalCache['postos'] && globalCache['postos'].length > 0) {
    lastFetchErrors[cacheKey] = null;
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    cacheMetrics[cacheKey] = {
      durationMs: Number(elapsed.toFixed(2)),
      recordCount: globalCache['postos'].length,
      payloadBytes: cacheMetrics['postos']?.payloadBytes ?? 0,
      fromCache: true,
    };
    return globalCache['postos'];
  }

  if (inFlightRequests[cacheKey]) {
    return inFlightRequests[cacheKey]!;
  }

  const requestGeneration = cacheGeneration;
  const setFetchError = (errMsg: string | null) => {
    if (requestGeneration !== cacheGeneration) return;
    lastFetchErrors[cacheKey] = errMsg;
    if (isRegional) {
      lastFetchErrors[type] = errMsg;
    }
  };

  const executeRequest = async (): Promise<AnalyticsRecord[]> => {
    try {
      setFetchError(null);

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        setFetchError(`HTTP ${response.status} ao consultar ${type}`);
        return [];
      }

      const rawText = await response.text();
      const payloadBytes = new TextEncoder().encode(rawText).length;
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const cleanText = rawText.replace(/^\uFEFF/, '');
      const trimmed = cleanText.trim();
      const trimmedLower = trimmed.toLowerCase();

      // Rejeita páginas HTML retornadas com HTTP 200 (ex.: fallback de proxy ou erro de servidor)
      if (
        contentType.includes('text/html') ||
        trimmedLower.startsWith('<!doctype') ||
        trimmedLower.startsWith('<html')
      ) {
        setFetchError(`Resposta HTML inesperada ao consultar ${type}`);
        return [];
      }

      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      const isJsonResponse = contentType.includes('json') || (!contentType.includes('csv') && looksLikeJson);
      const isCsvResponse =
        !isJsonResponse &&
        (contentType.includes('csv') || (/[?&]export=csv(?:&|$)/i.test(fetchUrl) && !looksLikeJson));

      const flatData: AnalyticsRecord[] = [];

      if (isCsvResponse) {
        if (trimmed.length > 0) {
          const { records, hasUnclosedQuote } = splitCSVRecords(cleanText);
          if (hasUnclosedQuote) {
            console.warn(`Registro CSV com aspas não fechadas ignorado em ${type}`);
          }

          if (records.length > 0) {
            const delimiter = detectCSVDelimiter(records[0]);
            const headers = parseCSVLine(records[0], delimiter);

            const munIdx = findHeaderIndex(headers, ['municipio', 'municipios', 'cidade', 'cidades'], ['munic', 'cidade']);
            const classIdx = findHeaderIndex(headers, ['classificacao', 'categoria', 'setor'], ['classifica', 'categori', 'setor']);
            const anoIdx = findHeaderIndex(headers, ['ano'], []);
            const mesIdx = findHeaderIndex(headers, ['mes'], []);
            const estIdx = findHeaderIndex(headers, ['estabelecimentos', 'estabelecimento'], ['estab']);
            const funcIdx = findHeaderIndex(headers, ['funcionarios', 'funcionario'], ['func']);
            const estoqueIdx = findHeaderIndex(headers, ['estoque', 'estoque acumulado'], ['estoque']);
            const saldoIdx = findHeaderIndex(headers, ['saldo', 'saldo de postos'], ['saldo']);

            const expectedMetricIdx =
              type === 'estoque'
                ? estoqueIdx
                : type === 'postos'
                  ? saldoIdx
                  : type === 'estabelecimentos'
                    ? estIdx
                    : funcIdx;
            const missingTemporalCols = (type === 'estoque' || type === 'postos') && (anoIdx < 0 || mesIdx < 0);

            if (munIdx < 0 || expectedMetricIdx < 0 || missingTemporalCols) {
              setFetchError(`Cabeçalho CSV inválido ao consultar ${type}`);
              return [];
            }

            for (let i = 1; i < records.length; i++) {
              const values = parseCSVLine(records[i], delimiter);
              if (values.length !== headers.length) {
                console.warn(`Linha CSV malformada ignorada em ${type} (linha ${i + 1})`);
                continue;
              }

              const municipio = values[munIdx].trim();
              const classificacao = (classIdx >= 0 ? values[classIdx] : '').trim() || 'Outros Serviços';
              if (!municipio) continue;

              const ano = anoIdx >= 0 ? normalizeYear(values[anoIdx]) : null;
              const mes = mesIdx >= 0 ? normalizeMonth(values[mesIdx]) : null;

              if (type === 'estoque') {
                const estoqueVal = values[estoqueIdx].trim();
                if (!isValidNumericInput(estoqueVal) || !ano || !mes) continue;
                flatData.push({
                  Município: municipio,
                  Classificação: classificacao,
                  Ano: ano,
                  Mês: mes,
                  Estoque: estoqueVal,
                });
              } else if (type === 'postos') {
                const saldoVal = values[saldoIdx].trim();
                if (!isValidNumericInput(saldoVal) || !ano || !mes) continue;
                flatData.push({
                  Município: municipio,
                  Classificação: classificacao,
                  Ano: ano,
                  Mês: mes,
                  Saldo: saldoVal,
                });
              } else if (type === 'estabelecimentos') {
                const estVal = values[estIdx].trim();
                if (!isValidNumericInput(estVal)) continue;
                flatData.push({
                  Município: municipio,
                  Classificação: classificacao,
                  Estabelecimentos: estVal,
                });
              } else if (type === 'funcionarios') {
                const funcVal = values[funcIdx].trim();
                if (!isValidNumericInput(funcVal)) continue;
                flatData.push({
                  Município: municipio,
                  Classificação: classificacao,
                  Funcionarios: funcVal,
                });
              }
            }
          } else if (hasUnclosedQuote) {
            setFetchError(`CSV malformado (aspas não fechadas) ao consultar ${type}`);
            return [];
          }
        }
      } else {
        // Processamento JSON aninhado
        const json: unknown = JSON.parse(trimmed);
        if (!isPlainObject(json)) {
          setFetchError(`Estrutura JSON inválida ao consultar ${type}`);
          return [];
        }

        const rawDataObj = Object.prototype.hasOwnProperty.call(json, 'dados') ? json.dados : json;
        if (!isPlainObject(rawDataObj)) {
          setFetchError(`Estrutura de dados JSON inválida ao consultar ${type}`);
          return [];
        }

        for (const [rawCidade, categorias] of Object.entries(rawDataObj)) {
          const cidade = rawCidade.trim();
          if (!cidade || !isPlainObject(categorias)) continue;

          for (const [rawCategoria, dados] of Object.entries(categorias)) {
            if (dados === null || dados === undefined) continue;
            const categoria = rawCategoria.trim() || 'Outros Serviços';

            if (type === 'estabelecimentos' || type === 'funcionarios') {
              if (typeof dados === 'object') continue;
              const valor = String(dados).trim();
              if (!isValidNumericInput(valor)) continue;

              const row: AnalyticsRecord = { Município: cidade, Classificação: categoria };
              if (type === 'estabelecimentos') row.Estabelecimentos = valor;
              if (type === 'funcionarios') row.Funcionarios = valor;
              flatData.push(row);
            } else if (type === 'estoque' || type === 'postos') {
              if (!isPlainObject(dados)) continue;

              for (const [rawAno, arrayMeses] of Object.entries(dados)) {
                const ano = normalizeYear(rawAno);
                if (!ano || !Array.isArray(arrayMeses)) continue;

                for (const item of arrayMeses) {
                  if (!isPlainObject(item)) continue;
                  const mesStr = normalizeMonth(item.mes);
                  if (!mesStr) continue;

                  if (type === 'estoque') {
                    if (item.estoque === undefined || item.estoque === null || typeof item.estoque === 'object') {
                      continue;
                    }
                    const estoqueStr = String(item.estoque).trim();
                    if (!isValidNumericInput(estoqueStr)) continue;
                    flatData.push({
                      Município: cidade,
                      Classificação: categoria,
                      Ano: ano,
                      Mês: mesStr,
                      Estoque: estoqueStr,
                    });
                  } else if (type === 'postos') {
                    if (item.saldo === undefined || item.saldo === null || typeof item.saldo === 'object') {
                      continue;
                    }
                    const saldoStr = String(item.saldo).trim();
                    if (!isValidNumericInput(saldoStr)) continue;
                    flatData.push({
                      Município: cidade,
                      Classificação: categoria,
                      Ano: ano,
                      Mês: mesStr,
                      Saldo: saldoStr,
                    });
                  }
                }
              }
            }
          }
        }
      }

      if (requestGeneration === cacheGeneration) {
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
        if (flatData.length > 0) {
          globalCache[cacheKey] = flatData;
        }
        cacheMetrics[cacheKey] = {
          durationMs: Number(elapsed.toFixed(2)),
          recordCount: flatData.length,
          payloadBytes,
          fromCache: false,
        };
      }

      return flatData;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : `Erro ao carregar ${type}`;
      setFetchError(errMsg);
      console.warn(`Erro ao carregar ${type}:`, e);
      return [];
    }
  };

  const requestPromise: Promise<AnalyticsRecord[]> = Promise.resolve()
    .then(executeRequest)
    .finally(() => {
      if (inFlightRequests[cacheKey] === requestPromise) {
        delete inFlightRequests[cacheKey];
      }
    });

  inFlightRequests[cacheKey] = requestPromise;
  return requestPromise;
};
