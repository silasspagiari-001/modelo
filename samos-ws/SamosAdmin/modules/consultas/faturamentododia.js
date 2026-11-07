'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { empresa, movimento } = params;
            const documento = empresa.toString() + '0002';  // Sempre será pedidos

            const sql = `select sum(MOVIMENTOS_TOTAL) as FATURAMENTO from MOVIMENTOS          
                          where MOVIMENTOS_ID_EMPRESAS   = ${empresa} and
                                MOVIMENTOS_STATUS <> 'C' and
                                MOVIMENTOS_ID_DOCUMENTOS = ${documento} and
                                MOVIMENTOS_EMISSAO = '${movimento}'`;

            const results = await samosFB.executeSQL(sql, params);

            return results[0]['FATURAMENTO'] || 0;
        } catch(error) {
            const msg = 'Falha ao consultar faturamento do dia';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};