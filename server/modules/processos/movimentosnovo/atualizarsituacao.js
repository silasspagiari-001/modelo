'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    update: async (id, data, params) => {
        try {
            const situacao = data['situacao'];
            const status = data['status'];

            const movimento = {
                'MOVIMENTOS_ID'      : id,
                'MOVIMENTOS_STATUS'  : status,
                'MOVIMENTOS_SITUACAO': situacao
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);

            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar situacao do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};