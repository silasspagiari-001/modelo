'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { excecao, meses, incluiHoje } = params;

            const desde = moment.tz(params.timezone).subtract(meses, 'months').format('YYYY-MM-DD');
            
            const sql = `select 
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO
            from MOVIMENTOS
            join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            where 
                MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                DOCUMENTOS_NOME like 'Nota Consumidor%' and
                MOVIMENTOS_PROTOCOLO = '' and
                MOVIMENTOS_EMISSAO >= '${desde}' 
                ${excecao ? ` and MOVIMENTOS_ID <> ${excecao} ` : ''}
                ${incluiHoje == 'T' ? '' : ` and MOVIMENTOS_EMISSAO < current_date `}`;
                
            return { 
                results: await samosFB.executeSQL(sql, params)
            };
        } catch(error) {
            const msg = 'Falha ao verificar NFC-es pendentes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
