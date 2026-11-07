'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { id } = params;
            const sqlSearch = `select MOVIMENTOS_ID, MOVIMENTOS_ID_EMPRESAORIGEM,
                                      MOVIMENTOS_NUMEROORIGEM, MOVIMENTOS_SERIEORIGEM
                                from MOVIMENTOS
                where MOVIMENTOS_ID = ${id}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
          