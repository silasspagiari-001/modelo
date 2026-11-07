'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { produto, empresa } = params;
            const sqlSearch = `select SALDOS_DISPONIVEL from SALDOS where
                SALDOS_ID_PRODUTOS = '${produto}' and
                SALDOS_ID_EMPRESAS = ${empresa}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar saldo produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
    