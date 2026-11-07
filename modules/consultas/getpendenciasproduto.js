'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { produto } = params;
            
            const sql = `select sum(MOVIMENTOSITENS_QUANTIDADE) as QTDE_PENDENTE
                          from MOVIMENTOSITENS
                          join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                           where MOVIMENTOS_STATUS <> 'C' and
                                 right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and
                                 MOVIMENTOSITENS_ID_OPERACOES = 600000 and
                                 MOVIMENTOSITENS_ID_PRODUTOS = ${produto}`;

            const results = await samosFB.executeSQL(sql, params);

            return results[0]['QTDE_PENDENTE'] || 0;
        } catch(error) {
            const msg = 'Falha ao consultar pendencias do produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};