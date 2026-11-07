'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (romaneios, params) => {
        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const log  = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;

            romaneios.forEach(romaneio => {
                romaneio['ROMANEIOS_SAIDA']  = hoje;
                romaneio['ROMANEIOS_LOG']    = log;
                romaneio['ROMANEIOS_STATUS'] = 'F';
            });

            await samosFB.update('ROMANEIOS', romaneios, params);
            await utils.dblog(params);
            return romaneios;
        } catch(error) {
            const msg = 'Falha ao faturar romaneios moveis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};