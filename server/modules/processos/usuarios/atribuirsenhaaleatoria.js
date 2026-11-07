'use strict';

const samosFB = require('../../../services/samosFB');

module.exports = {
    update: async (id, data, params) => {
        try {
            const senha = new Date().getTime().toString().slice(-6);

            const sql = `update USUARIOS set
                USUARIOS_SENHA = '${senha}',
                USUARIOS_NOVASENHA = 'T'
            where USUARIOS_ID = '${id}'`;

            await samosFB.executeSQL(sql, params);

            return {
                results: senha,
                total: 0
            }
        } catch(error) {
            const msg = 'Falha ao atribuir senha aleatória';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
