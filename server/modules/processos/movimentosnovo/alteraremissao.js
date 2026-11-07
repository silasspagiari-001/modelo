'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const novaEmissao = data['MOVIMENTOS_EMISSAO'];
            
            const movimento = {
                'MOVIMENTOS_ID': id,
                'MOVIMENTOS_EMISSAO': novaEmissao
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);
            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar emissão do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};