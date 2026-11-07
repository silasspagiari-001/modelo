'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    readById: async (idProduto, params) => {
        try {
            const sqlSearch = `select
                LOTES_ID,
                LOTES_FABRICACAO,
                LOTES_REFERENCIA,
                LOTES_VALIDADE
            from LOTES
            where LOTES_ID_PRODUTOS = '${idProduto}'
              and LOTES_STATUS = 'T'
            order by LOTES_VALIDADE ASC`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return results[0];
        } catch(error) {
            const msg = 'Falha obter produto por referência';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};