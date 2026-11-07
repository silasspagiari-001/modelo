'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (caixas, params) => {
        try {
            const hoje    = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora    = moment.tz(params.timezone).format('HH:mm:ss');

            caixas.forEach(caixa => {
                caixa['MOVIMENTOSCAIXA_EMISSAO'] = hoje;
                caixa['MOVIMENTOSCAIXA_HORA']    = hora;
            });
            
            await samosFB.insert('MOVIMENTOSCAIXA', caixas, params);
            await utils.dblog(params);
            return caixas;
        } catch(error) {
            const msg = 'Falha ao inserir caixas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};