'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { tipo, aplinicial, aplfinal, porinicial, porfinal, inicio, final} = params;
            let sqlWhere = ` and CONTROLES_ID_APLICACOES between ${aplinicial} and ${aplfinal} and
                                 CONTROLES_ID_PORTADORES between ${porinicial} and ${porfinal} `;
            let sqlSearch = '';

            if (tipo == '0') { 
                sqlSearch = `select APLICACOES_ID, APLICACOES_NOME,
                sum(case when CONTROLES_TIPO = 'E' then CONTROLES_VALOR else 0 end) APLICACOES_ENTRADAS,
                sum(case when CONTROLES_TIPO = 'S' then CONTROLES_VALOR else 0 end) APLICACOES_SAIDAS from CONTROLES
                             left outer join APLICACOES on CONTROLES_ID_APLICACOES = APLICACOES_ID                
                             where CONTROLES_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                             ${sqlWhere} group by APLICACOES_ID, APLICACOES_NOME`
            } else {    // Analítico
                sqlSearch = `select CONTROLES.*, APLICACOES_NOME, PORTADORES_NOME from CONTROLES
                             left outer join APLICACOES on CONTROLES_ID_APLICACOES = APLICACOES_ID                
                             left outer join PORTADORES on CONTROLES_ID_PORTADORES = PORTADORES_ID
                             where CONTROLES_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                             ${sqlWhere} order by CONTROLES_ID_APLICACOES, CONTROLES_EMISSAO`
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar lançamentos bancos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
