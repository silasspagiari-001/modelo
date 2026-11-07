'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const producao = await getProducao(id, params);
            const documento = await getDocumentoRequisicao(producao['PRODUCOES_ID_EMPRESAS'], params);
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora = moment.tz(params.timezone).format('HH:mm:ss');
            
            const sql = `delete from MOVIMENTOS where
                MOVIMENTOS_ID_EMPRESAS      = '${producao['PRODUCOES_ID_EMPRESAS']}' and 
                MOVIMENTOS_ID_PESSOAS       = '${producao['PRODUCOES_ID_PESSOAS']}'  and 
                MOVIMENTOS_ID_DOCUMENTOS    = '${documento['DOCUMENTOS_ID']}'        and 
                MOVIMENTOS_CPFCNPJ          = '${producao['PESSOAS_CPFCNPJ']}'       and 
                MOVIMENTOS_ID_EMPRESAORIGEM = '${producao['PRODUCOES_ID_EMPRESAS']}' and 
                MOVIMENTOS_NUMEROORIGEM     = '${producao['PRODUCOES_NUMERO']}'      and 
                MOVIMENTOS_SERIEORIGEM      = '${producao['PRODUCOES_SERIE']}'
            `
            
            producao['PRODUCOES_STATUS']           = 'A';
            producao['PRODUCOES_FINALIZADA']       = '1899-12-30';
            producao['PRODUCOES_HORAFINALIZADA']   = '';
            producao['PRODUCOES_LOG']              = params.userLogin + ' ' + hoje + ' ' + hora;
            producao['PRODUCOES_ID_EMPRESAORIGEM'] = 0;
            producao['PRODUCOES_NUMEROORIGEM']     = 0;
            producao['PRODUCOES_SERIEORIGEM']      = '';

            await samosFB.update(id, 'PRODUCOES', producao, params);
            await samosFB.executeSQL(sql, params);

            await utils.dblog(params);
            return producao;
        } catch(error) {
            const msg = 'Falha ao finalizar produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function getProducao(id, params) {
    const queryProducao = await samosFB.executeSQL(`select 
        PRODUCOES_ID_EMPRESAS,
        PRODUCOES_ID_PESSOAS,
        PESSOAS_CPFCNPJ,
        PRODUCOES_NUMERO,
        PRODUCOES_SERIE
    from PRODUCOES 
    left outer join PESSOAS on PRODUCOES_ID_PESSOAS = PESSOAS_ID
    where PRODUCOES_ID = ${id}
    `, params);

    const producao = queryProducao[0];

    if(producao['PRODUCOES_STATUS'] == 'A') {
        throw 'Produção já aberta';
    }

    if(producao['PRODUCOES_STATUS'] == 'C') {
        throw 'Produção cancelada não pode ser reaberta';
    }

    return producao;    
}

async function getDocumentoRequisicao(empresa, params) {
    const queryDocumento = await samosFB.executeSQL(`select 
        DOCUMENTOS_ID
    from DOCUMENTOS
    where DOCUMENTOS_NOME = 'Requisições' and
        DOCUMENTOS_ID_EMPRESAS = ${empresa}
    `, params);

    return queryDocumento[0];
}