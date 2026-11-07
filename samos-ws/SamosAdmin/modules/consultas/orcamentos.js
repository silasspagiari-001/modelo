'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, produto, inicio, final } = params;

            let  whereEmpresas = `MOVIMENTOS_ID_EMPRESAS = ${empresa} and 
                                  MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and 
                                  MOVIMENTOS_EMISSAO between '${inicio.replace(/\//ig,'.')}' and '${final.replace(/\//ig,'.')}' and `; 
            let sqlFiltro = ` and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0001' `

            const sqlSearch = `select MOVIMENTOSITENS_ID, 
                                      MOVIMENTOSITENS_ID_PRODUTOS,
                                      MOVIMENTOS_NOME,
                                      MOVIMENTOSITENS_QUANTIDADE,
                                      MOVIMENTOSITENS_CSTPIS,
                                      MOVIMENTOS_ID_EMPRESAS,
                                      MOVIMENTOS_EMISSAO,
                                      MOVIMENTOS_NUMERO,
                                      MOVIMENTOS_SERIE,
                                      MOVIMENTOSITENS_QUANTIDADE
                               from MOVIMENTOSITENS
                               left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                               where ${whereEmpresas}
                                ((MOVIMENTOS_STATUS <> 'C') and 
                                (MOVIMENTOS_STATUS <> 'R') and
                                (MOVIMENTOS_STATUS <> 'D')) ${sqlFiltro}
                    order by MOVIMENTOS_EMISSAO`;


            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar kardex';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
