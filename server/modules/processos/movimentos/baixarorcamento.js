'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const novoStatus = data['status'] != 'BA' ? 'BA' : '';
            
            const movimentoitem = {
                'MOVIMENTOSITENS_ID': id,
                'MOVIMENTOSITENS_CSTPIS': novoStatus
            };

            await samosFB.update(id, 'MOVIMENTOSITENS', movimentoitem, params);

            await utils.dblog(params);
            return movimentoitem;
        } catch(error) {
            const msg = 'Falha ao atualizar baixa do item';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};