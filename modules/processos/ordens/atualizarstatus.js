'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const status     = data['status'];
            const reabertura = data['reabertura'];
            const log        = data['log']

            const ordem = {
                'ORDENS_ID'    : id,
                'ORDENS_STATUS': status,
                'ORDENS_REABERTURA': reabertura,
                'ORDENS_LOG': log
            };

            await samosFB.update(id, 'ORDENS', ordem, params);

            await utils.dblog(params);

            return ordem;
        } catch(error) {
            const msg = 'Falha ao atualizar status da ordem de serviço';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};