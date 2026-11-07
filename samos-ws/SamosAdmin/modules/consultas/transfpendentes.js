'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { excecao, meses, incluiHoje } = params;

            //excecao   : o id da transferência que está na tela, que não entra na verificacao
            //meses     : numero de meses para trás a verificar
            //incluiHoje: se T, verifica transferencias pendentes de hoje tambem

            const desde = moment.tz(params.timezone).subtract(meses, 'months').format('YYYY-MM-DD');
            
            const sql = `select 
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO
            from MOVIMENTOS
            join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            where 
                MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                MOVIMENTOS_ID_OPERACOES = 710000 and
                MOVIMENTOS_EMISSAO >= '${desde}' 
                ${excecao ? ` and MOVIMENTOS_ID <> ${excecao} ` : ''}
                ${incluiHoje == 'T' ? '' : ` and MOVIMENTOS_EMISSAO < current_date `}`;
                
            return { 
                results: await samosFB.executeSQL(sql, params)
            };
        } catch(error) {
            const msg = 'Falha ao verificar Transferências pendentes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
