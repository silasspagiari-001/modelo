'use strict';

const utils   = require('../../services/samosUtils');
const samosFB = require('../../services/samosFB');
const api     = require('../../modules');

module.exports = {
    read: async params => {
        try {
            const { mascara } = params;

            const sqlSearch = `select * from APLICACOES
                               where APLICACOES_MASCARA like '${mascara}%' `;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao consultar filhos da aplicação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};