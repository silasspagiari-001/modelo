'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { pessoa } = params;

            const sqlSearch = `select sum(FINANCEIROS_ABERTO) as ABERTOPESSOA
                               from FINANCEIROS 
                               where FINANCEIROS_ID_PESSOAS = ${pessoa} 
                                 and FINANCEIROS_TIPO = 'R' 
                                 and FINANCEIROS_STATUS = 'A' `;

            const results = (await samosFB.executeSQL(sqlSearch, params));
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar créditos por pessoa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
