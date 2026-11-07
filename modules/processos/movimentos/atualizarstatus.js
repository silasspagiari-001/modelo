'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const status = data['status'];

            const movimento = {
                'MOVIMENTOS_ID'    : id,
                'MOVIMENTOS_STATUS': status,
                'MOVIMENTOS_LOG'   : `Atualizado status VTEX: ${moment().format('DD/MM/YYYY HH:mm')}`
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);

            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar status do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};