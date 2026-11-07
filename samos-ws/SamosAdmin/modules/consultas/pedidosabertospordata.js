'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { emissao, empresa } = params;
            let sqlEmissao = '';
            let sqlFiltro = '';
            
            if (params.client.toUpperCase() == 'PRUDENMOVEIS' ||
                params.client.toUpperCase() == 'EDULAR' ) {
               sqlFiltro = ` ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0) or (MOVIMENTOS_SITUACAO = 'P')) `
            } else {
               sqlFiltro = ` ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0)) and
                               MOVIMENTOS_STATUS = 'N'`;
            }

            if (emissao && emissao.length > 0) {
                sqlEmissao += ` MOVIMENTOS_EMISSAO = '${emissao.replace (/\//ig,'.')}' and `;
            }
            
            const sqlEmpresa = empresa ? ` MOVIMENTOS_ID_EMPRESAS = '${empresa}' and ` : '';
            const sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO
                from MOVIMENTOS 
                    left outer join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    left outer join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                where MOVIMENTOS_ID > 0 and 
                      DOCUMENTOS_NOME = 'Pedidos' and 
                      ${sqlEmissao} ${sqlEmpresa} ${sqlFiltro}
                order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar pedidos abertos por data';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
