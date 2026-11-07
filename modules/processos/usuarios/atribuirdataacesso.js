'use strict';

const samosFB = require('../../../services/samosFB');

module.exports = {
    update: async (id, data, params) => {
        try {
            const sql = `update USUARIOS set
                USUARIOS_ULTIMOLOG = 'now'
            where USUARIOS_ID = '${id}'`;

            await samosFB.executeSQL(sql, params);
            
            return {
                results: [],
                total: 0
            }
        } catch(error) {
            const msg = 'Falha ao atribuir data do último acesso';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
