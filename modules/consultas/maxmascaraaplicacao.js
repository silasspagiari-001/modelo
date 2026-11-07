'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { conteudo } = params;

            const sql = `
            select max(APLICACOES_MASCARA) as ULTIMO
            from APLICACOES
            where APLICACOES_MASCARA like '${conteudo}%';`;

            const results = await samosFB.executeSQL(sql, params);

            return {
                results: results,
                total: 1
            };
                
        } catch(error) {
            const msg = 'Falha ao consultar mascara aplicacao livre';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};