'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    update: async (id, data, params) => {
        try {           

            const sqlCaixa = `update CONTACORRENTES set CONTACORRENTES_STATUS = '${data.status}'
                                              where CONTACORRENTES_ID_EMPRESAS = ${data.empresa} 
                                                and CONTACORRENTES_ID_PESSOAS = ${data.conta}
                                                and CONTACORRENTES_EMISSAO = '${data.emissao}'`;
                                              
            await samosFB.executeSQL(sqlCaixa, params);
        } catch(error) {
            const msg = error.message ? 'Falha ao atualizar status do caixa' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};