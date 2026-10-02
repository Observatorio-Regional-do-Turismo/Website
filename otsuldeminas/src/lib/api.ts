// Cache global para evitar refetching e processamento pesado toda vez que a função for chamada
export const globalCache: Record<string, Record<string, unknown>[]> = {};

export type DataType = 'estabelecimentos' | 'funcionarios' | 'estoque' | 'postos';

/** A API de gráficos espera o código IBGE sem o dígito verificador. */
export function getCodigoIBGEParaGraficos(codigo?: string | number | null): string | null {
  const digits = String(codigo ?? '').replace(/\D/g, '');
  if (digits.length === 7) return digits.slice(0, 6);
  return digits.length === 6 ? digits : null;
}

export const fetchJSONAndFlatten = async (url: string, type: DataType): Promise<Record<string, unknown>[]> => {
  const cacheKey = type === 'postos' && url.includes('?') ? `${type}:${url}` : type;
  if (globalCache[cacheKey]) {
    return globalCache[cacheKey]; // Retorna do cache instantaneamente (0ms)
  }
  
  try {
    let fetchUrl = url;
    // O backend exige codigo_ibge para JSON em estoque/postos, senão tem que ser CSV
    if ((type === 'estoque' || type === 'postos') && !url.includes('codigo_ibge')) {
      fetchUrl = url.includes('?') ? `${url}&export=csv` : `${url}?export=csv`;
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") || "";
    const flatData: Record<string, unknown>[] = [];

    // Lógica de CSV
    if (contentType.includes("csv") || fetchUrl.includes("export=csv")) {
      const text = await response.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length === headers.length) {
            const row: Record<string, unknown> = {};
            for (let j = 0; j < headers.length; j++) {
               row[headers[j]] = values[j];
            }
            
            // Padroniza o Mês para 2 dígitos igual no JSON
            if (row['Mês']) {
              row['Mês'] = String(row['Mês']).padStart(2, '0');
            }
            
            // Ignora linhas sem valor no Estoque/Saldo
            if (type === 'estoque' && (!row['Estoque'] || String(row['Estoque']).trim() === "")) continue;
            if (type === 'postos' && (!row['Saldo'] || String(row['Saldo']).trim() === "")) continue;

            flatData.push(row);
          }
        }
      }
      globalCache[cacheKey] = flatData;
      return flatData;
    }

    // Lógica de JSON original
    const json = await response.json();
    const dataObj = json.dados ? json.dados : json;
    
    for (const [cidade, categorias] of Object.entries(dataObj as Record<string, Record<string, unknown>>)) {
      for (const [categoria, dados] of Object.entries(categorias || {})) {
        
        if (type === 'estabelecimentos' || type === 'funcionarios') {
           const valor = String(dados).trim();
           if (!valor) continue;
           
           const row: Record<string, unknown> = { 'Município': cidade, 'Classificação': categoria };
           if (type === 'estabelecimentos') row['Estabelecimentos'] = valor;
           if (type === 'funcionarios') row['Funcionarios'] = valor;
           flatData.push(row);
           
        } else if (type === 'estoque' || type === 'postos') {
           const anosObj = dados as Record<string, Array<{ mes?: string | number; estoque?: string | number; saldo?: string | number }>>;
           for (const [ano, arrayMeses] of Object.entries(anosObj || {})) {
             if (Array.isArray(arrayMeses)) {
               for (const item of arrayMeses) {
                 const mesStr = String(item.mes).padStart(2, '0');
                 
                 if (type === 'estoque') {
                   if (item.estoque === undefined || item.estoque === null) continue;
                   const estoqueStr = String(item.estoque).trim();
                   if (estoqueStr === "") continue;
                   
                   flatData.push({
                     'Município': cidade,
                     'Classificação': categoria,
                     'Ano': ano,
                     'Mês': mesStr,
                     'Estoque': estoqueStr
                   });
                 } else if (type === 'postos') {
                   if (item.saldo === undefined || item.saldo === null) continue;
                   const saldoStr = String(item.saldo).trim();
                   if (saldoStr === "") continue;
                   
                   flatData.push({
                     'Município': cidade,
                     'Classificação': categoria,
                     'Ano': ano,
                     'Mês': mesStr,
                     'Saldo': saldoStr
                   });
                 }
               }
             }
           }
        }
      }
    }
    
    globalCache[cacheKey] = flatData;
    return flatData;
  } catch (e) {
    console.error(`Erro ao carregar ${type}:`, e);
    return [];
  }
};