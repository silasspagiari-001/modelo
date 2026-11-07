'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, produtoinicial, produtofinal, grupoinicial, grupofinal, inicio, final } = params;

            let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
            let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
            let whereEmpresa = (empresa ? `MOVIMENTOS_ID_EMPRESAS = ${empresa} and ` : '');
            let sqlOrder = ' order by MOVIMENTOS_EMISSAO, PRODUTOS_NOME';
            let sqlAcao = params.tipo == '0' ? ` OPERACOES_ACAO = 'VN' and ` :
                          params.tipo == '1' ? ` OPERACOES_ACAO = 'CN' and ` : '';

            let sqlSearch = `select 
                MOVIMENTOSITENS_ID_PRODUTOS, 
                PRODUTOS_NOME, 
                PRODUTOS_UNIDADE,
                PRODUTOS_PESOLIQUIDO,
                MOVIMENTOS_ID_DOCUMENTOS,
                MOVIMENTOS_EMISSAO, 
                MOVIMENTOS_ENTRADASAIDA,
                MOVIMENTOSITENS_ID_OPERACOES, 
                OPERACOES_NOME, 
                OPERACOES_ESTOQUE, 
                OPERACOES_ACAO,
                PESSOAS_NOME, 
                MOVIMENTOS_NUMERO, 
                MOVIMENTOS_SERIE, 
                MOVIMENTOSITENS_QUANTIDADE, 
                MOVIMENTOSITENS_PRECO,
                MOVIMENTOSITENS_TOTAL,
                MOVIMENTOSITENS_IPI,
                cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2))
            from MOVIMENTOSITENS
            left outer join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
            left outer join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
            left outer join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
            left outer join PESSOAS    on PESSOAS_ID         = MOVIMENTOS_ID_PESSOAS
            where MOVIMENTOS_EMISSAO  between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                ${whereEmpresa}
                MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} and 
                PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} and 
                ((MOVIMENTOS_STATUS <> 'C') and 
                 (MOVIMENTOS_STATUS <> 'D') and
                 (MOVIMENTOS_STATUS <> 'R')) and
                ${sqlAcao} 
                OPERACOES_ESTOQUE <> 'N' ${sqlOrder}`;
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar movimento produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
  