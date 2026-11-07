'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    create: async (data, params) => {
        try {
            await samosFB.insert('CONTACORRENTES', data, params);
            await utils.dblog(params);  
            return { results: data };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar lançamento Contacorrentes' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};
