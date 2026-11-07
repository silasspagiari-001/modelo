'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (data, params) => {
        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            
            const sql = `update MOVIMENTOS set 
                MOVIMENTOS_STATUS           = 'F',
                MOVIMENTOS_ENTRADASAIDA     = '${hoje}',
                MOVIMENTOS_ID_EMPRESAORIGEM = '${data['MOVIMENTOS_ID_EMPRESAORIGEM']}',
                MOVIMENTOS_NUMEROORIGEM     = '${data['MOVIMENTOS_NUMEROORIGEM']}',
                MOVIMENTOS_SERIEORIGEM      = '${data['MOVIMENTOS_SERIEORIGEM']}'
            where 
                MOVIMENTOS_ID_EMPRESAS = '${data['MOVIMENTOS_ID_EMPRESAS']}' and
                MOVIMENTOS_NUMERO      = '${data['MOVIMENTOS_NUMERO']}'     and
                MOVIMENTOS_SERIE       = '${data['MOVIMENTOS_SERIE']}'
            `;

            await samosFB.executeSQL(sql, params);
            await utils.dblog(params);
            return data;
        } catch(error) {
            const msg = 'Falha ao faturar pedido de compra';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};