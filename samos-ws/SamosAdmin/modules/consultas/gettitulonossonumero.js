'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    create: async (data, params) => {
        try {

            if (!Array.isArray(data.listann) || data.listann.length === 0) {
                return [];
            }
            
            const sql = `select FINANCEIROS_ID,
                                FINANCEIROS_ID_MOVIMENTOS,
                                FINANCEIROS_NOSSONUMERO,
                                FINANCEIROS_NUMERO,
                                FINANCEIROS_SERIE,
                                FINANCEIROS_PARCELA,
                                FINANCEIROS_EMISSAO,
                                FINANCEIROS_VENCIMENTO,
                                FINANCEIROS_PAGAMENTO,
                                FINANCEIROS_ORIGINAL,
                                FINANCEIROS_ABERTO,
                                FINANCEIROS_JUROS,
                                FINANCEIROS_DESCONTOS,
                                FINANCEIROS_PAGO,
                                FINANCEIROS_EXPORTADO,
                                FINANCEIROS_OBSERVACOES,
                                FINANCEIROS_ID_PESSOAS,
                                PESSOAS_NOME
                          from FINANCEIROS
                          join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                          where FINANCEIROS_TIPO = 'R' and
                                FINANCEIROS_NOSSONUMERO in(${data.listann.join(',')})
                          order by FINANCEIROS_NOSSONUMERO`;

            const results = await samosFB.executeSQL(sql, params);

            return results;
        } catch(error) {
            const msg = 'Falha ao consultar titulo por Nosso número';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};