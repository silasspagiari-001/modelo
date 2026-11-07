'use strict';

const samosFB = require('../../services/samosFirebird');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tecnico, start, limit } = params;

            const db       = await samosFB.conectarBanco(params.client);
            const limits   = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            const hoje     = moment.tz(params.timezone).format('YYYY-MM-DD');
            const sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
            
            let sqlWhere = `where ORDENSAVARIADOS_AGENDADA = '${hoje}' `;
            
            if(empresa > 0) {
                sqlWhere += ` and ORDENS_ID_EMPRESAS = ${empresa} `;
            }

            if(tecnico > 0) {
                sqlWhere += ` and (
                    (
                        ORDENS_ID_USUARIOS = '${tecnico}' and 
                        (ORDENS_ID_TECNICO = '0' or ORDENS_ID_TECNICO is null)
                    ) or (
                        ORDENS_ID_TECNICO  = '${tecnico}'
                    )
                ) `; 
            }
            
            const sqlCount  = `select 
                count(*) from ORDENS
                join ORDENSAVARIADOS on ORDENS_ID = ORDENSAVARIADOS_ID_ORDENS
                ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    distinct ORDENS_ID,
                    ORDENS_STATUS,
                    ORDENS_NUMERO,
                    ORDENS_NOME,
                    ORDENS_CELULAR,
                    ORDENS_ENDERECO,
                    ORDENS_NUMEROLC,
                    ORDENS_BAIRRO,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    ORDENS_COMPLEMENTO,
                    ORDENS_REFERENCIA,
                    ORDENS_PLANO,
                    ORDENS_PERIODO,
                    ORDENS_CONTATOS
                from ORDENS 
                join ORDENSAVARIADOS on ORDENS_ID   = ORDENSAVARIADOS_ID_ORDENS
                left join USUARIOS   on USUARIOS_ID = ORDENS_ID_USUARIOS
                left join CIDADES    on CIDADES_ID  = ORDENS_ID_CIDADES
                ${sqlWhere} ${sqlOrder} `; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({ db, results, total, resolve, reject });
                }
            });
        });
    }
};