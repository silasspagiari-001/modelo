'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const novaDescricao = data['PRODUTOS_DESCRICAO'];
            
            const produto = {
                'PRODUTOS_ID': id,
                'PRODUTOS_DESCRICAO': novaDescricao
            };

            console.log('produt no update: ', produto);

            await samosFB.update(id, 'PRODUTOS', produto, params);

            await utils.dblog(params);
            return produto;
        } catch(error) {
            const msg = 'Falha ao atualizar descrição do produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};