'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { excecao, meses, incluiHoje } = params;

            //excecao   : o id da nota de serviço que está na tela, que não entra na verificacao
            //meses     : numero de meses para trás a verificar
            //incluiHoje: se T, verifica notas pendentes de hoje tambem

            const desde = moment.tz(params.timezone).subtract(meses, 'months').format('YYYY-MM-DD');
            
            const sql = `select 
                ORDENS_NUMERO,
                ORDENS_SERIE,
                ORDENS_EMISSAO
            from ORDENS
            join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
            where 
                ORDENS_ID_EMPRESAS = ${params.empresaLogada} and
                ORDENS_ID_DOCUMENTOS = ${params.empresaLogada}0016 and
                ORDENS_PROTOCOLO = '' and
                ORDENS_EMISSAO >= '${desde}' 
                ${excecao ? ` and ORDENS_ID <> ${excecao} ` : ''}
                ${incluiHoje == 'T' ? '' : ` and ORDENS_EMISSAO < current_date `}`;
                
            return { 
                results: await samosFB.executeSQL(sql, params)
            };
        } catch(error) {
            const msg = 'Falha ao verificar NFs pendentes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
