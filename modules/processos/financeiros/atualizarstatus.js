'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (titulos, params) => {
        try {
            titulos = titulos.map(data => {
                const titulo = {
                    'FINANCEIROS_ID' : data['FINANCEIROS_ID'],
                    'FINANCEIROS_LOG': `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`
                };

                if(data['FINANCEIROS_STATUS']) {
                    titulo['FINANCEIROS_STATUS'] = data['FINANCEIROS_STATUS'];
                }

                if(data['FINANCEIROS_EXPORTADO']) {
                    titulo['FINANCEIROS_EXPORTADO'] = data['FINANCEIROS_EXPORTADO'];
                }

                return titulo;
            })

            await samosFB.update('FINANCEIROS', titulos, params);

            await utils.dblog(params);
            return titulos;
        } catch(error) {
            const msg = 'Falha ao atualizar status dos titulos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};