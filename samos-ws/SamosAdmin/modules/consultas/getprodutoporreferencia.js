'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { referencia } = params;

            const sqlSearch = `select
                PRODUTOS_ID,
                SALDOS_DISPONIVEL,
                SALDOS_CSTLOCAL,
                SALDOS_CSTOUTROS
            from PRODUTOS
            join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and SALDOS_ID_EMPRESAS = ${params.empresaLogada}
            where PRODUTOS_REFERENCIA = '${referencia}'
            order by PRODUTOS_REFERENCIA, SALDOS_DISPONIVEL desc`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return results[0] ? results[0] : null;
        } catch(error) {
            const msg = 'Falha obter produto por referência';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};