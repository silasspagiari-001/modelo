'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, documento, pessoa, numero, serie } = params;
            const sqlSearch = `select MOVIMENTOS_ID from MOVIMENTOS
                where MOVIMENTOS_ID_EMPRESAS   = ${empresa}   and
                      MOVIMENTOS_ID_DOCUMENTOS = ${documento} and
                      MOVIMENTOS_ID_PESSOAS    = ${pessoa}    and
                      MOVIMENTOS_NUMERO        = ${numero}    and
                      MOVIMENTOS_SERIE         = '${serie}'`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar se movimento existe';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
          