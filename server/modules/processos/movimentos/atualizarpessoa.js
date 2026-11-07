'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const novoId        = data['MOVIMENTOS_ID_PESSOAS'];
            const novoNome      = data['MOVIMENTOS_NOME'];
            const novoCpf       = data['MOVIMENTOS_CPFCNPJ'];
            const novoEmail     = data['MOVIMENTOS_EMAIL'];
            const novoCelular   = data['MOVIMENTOS_CELULAR'];
            const novoProtocolo = data['MOVIMENTOS_PROTOCOLO'];
            const movimento = {
                'MOVIMENTOS_ID': id,
                'MOVIMENTOS_ID_PESSOAS': novoId,
                'MOVIMENTOS_NOME': novoNome,
                'MOVIMENTOS_CPFCNPJ': novoCpf,
                'MOVIMENTOS_EMAIL': novoEmail,
                'MOVIMENTOS_CELULAR': novoCelular,
                'MOVIMENTOS_PROTOCOLO': novoProtocolo
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);
            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar dados da pessoa no movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};