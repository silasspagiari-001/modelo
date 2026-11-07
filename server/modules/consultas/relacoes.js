'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo } = params;

            const sqlSearch = `select * from RELACOES
                where RELACOES_ID_PRODUTOS = ${conteudo}`;
                
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { 
                results: results, 
                total: results.length
            };
        } catch(error) {
            const msg = 'Falha ao consultar produto da relação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};