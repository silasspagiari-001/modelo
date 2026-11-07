'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { parcelas } = params;
            const array = new Array(parseInt(parcelas)).fill(0);
            const parcelamento = array.map((dias, index) => {
                return (index + 1) * 30;
            }).join('#');

            const sqlSearch = `select PRAZOS_ID, PRAZOS_NOME from PRAZOS
                where PRAZOS_PARCELAS     = ${parcelas} and
                      PRAZOS_PARCELAMENTO = '${parcelamento}' `;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar id do prazo';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
          