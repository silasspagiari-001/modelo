'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const novoVendedor = data['MOVIMENTOS_ID_USUARIOS'];

            if(novoVendedor == 0) {
                throw 'Vendedor Inválido';
            }

            const movimento = {
                'MOVIMENTOS_ID': id,
                'MOVIMENTOS_ID_USUARIOS': novoVendedor
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);
            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar vendedor do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};