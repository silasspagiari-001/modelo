'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (data, params) => {
        try {
           
            const sql = `update MOVIMENTOSITENS set 
                MOVIMENTOSITENS_HORAENTREGA = '${data['MOVIMENTOSITENS_HORAENTREGA']}',
                MOVIMENTOSITENS_HORAMONTAGEM = '${data['MOVIMENTOSITENS_HORAMONTAGEM']}'
            where 
                MOVIMENTOSITENS_ID = ${data['MOVIMENTOSITENS_ID']} `;

            await samosFB.executeSQL(sql, params);
            await utils.dblog(params);
            return data;
        } catch(error) {
            const msg = 'Falha ao gravar item pedido';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};