'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, usuario} = params;

            let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
            let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

            let sqlWhere = '';
            let sqlSearch = '';

            sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
            sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(usuario && usuario > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${usuario} `;
            }

            sqlSearch = `SELECT GRUPOS_ID, GRUPOS_NOME, PRODUTOS_ID, PRODUTOS_NOME, SALDOS_DISPONIVEL,
                    sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_VENDIDO,
                    sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_VALORCUSTO,
                    sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_VALORVENDA,
                    sum(MOVIMENTOSITENS_FRETE) as MOVIMENTOS_VALORFRETE,                                                        
                    sum(MOVIMENTOSITENS_DESPESAS) as MOVIMENTOS_VALORDESPESAS
            FROM MOVIMENTOSITENS                                    
            left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
            left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
            where ((MOVIMENTOS_STATUS <> 'C') and 
                   (MOVIMENTOS_STATUS <> 'D') and
                   (MOVIMENTOS_STATUS <> 'R')) and
            MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and
            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
            ${sqlWhere}
            GROUP BY GRUPOS_ID, GRUPOS_NOME, PRODUTOS_NOME, PRODUTOS_ID, PRODUTOS_FABRICA, SALDOS_DISPONIVEL`
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar lucratividade';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
