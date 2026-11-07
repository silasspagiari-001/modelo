'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async (params) => {

        const { ids, inicio, validade } = params;

        try {           

            if((ids || []).length > 0) {
                const sql = ids.reduce((str, id) => {
                    return str += `update PROMOCOES set PROMOCOES_EMISSAO = '${inicio}', PROMOCOES_VALIDADE = '${validade}'
                                where PROMOCOES_ID = ${id};`}, '');
                                                
                const sqlUpdate = `execute block as begin ${sql} end;`;

                await samosFB.executeSQL(sqlUpdate, params);
            }
        } catch(error) {
            const msg = error.message ? 'Falha ao atualizar inicio/validade promoção' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};