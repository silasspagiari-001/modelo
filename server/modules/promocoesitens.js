'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    update: async (id, promocaoitem, params) => {
        try {
            await samosFB.update(id, 'PROMOCOESITENS', promocaoitem, params);
            await utils.dblog(params);    
            return { results: promocaoitem };
        } catch(error) {
            const msg = 'Falha ao alterar item da promoção';
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    }
};