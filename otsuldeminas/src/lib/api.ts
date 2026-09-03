// Cache global para evitar refetching e processamento pesado toda vez que a função for chamada
export const globalCache: Record<string, any[]> = {};

export type DataType = 'estabelecimentos' | 'funcionarios' | 'estoque' | 'postos';

export const fetchJSONAndFlatten = async (url: string, type: DataType) => {
  if (globalCache[type]) {
    return globalCache[type]; // Retorna do cache instantaneamente (0ms)
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const json = await response.json();
    const flatData: any[] = [];
    
    const dataObj = json.dados ? json.dados : json;
    
    for (const [cidade, categorias] of Object.entries(dataObj)) {
      for (const [categoria, dados] of Object.entries(categorias as any)) {
        
        if (type === 'estabelecimentos' || type === 'funcionarios') {
           // dados é diretamente o valor numérico
           const valor = String(dados).trim();
           if (!valor) continue;
           
           const row: any = { 'Município': cidade, 'Classificação': categoria };
           if (type === 'estabelecimentos') row['Estabelecimentos'] = valor;
           if (type === 'funcionarios') row['Funcionarios'] = valor;
           flatData.push(row);
           
        } else if (type === 'estoque' || type === 'postos') {
           // dados é um objeto de anos com arrays de meses
           for (const [ano, arrayMeses] of Object.entries(dados as any)) {
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
    
    // Salva os dados no cache para usos futuros
    globalCache[type] = flatData;
    
    return flatData;
  } catch (e) {
    console.error(`Erro ao carregar ${type}:`, e);
    return [];
  }
};
