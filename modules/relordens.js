'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, numero, pessoa, inicio, final, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa       = empresa       ? `and ORDENS_ID_EMPRESAS   = '${empresa}'       ` : '';
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} `;

            if(numero > 0) {
                sqlWhere += ` and ORDENS_NUMERO = '${numero}'`;
                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and ORDENS_ID_PESSOAS = '${pessoa}' `; 
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 3) { // Data de Faturamento
                        sqlWhere += ` and ORDENS_REABERTURA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else {
                      sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by ORDENS_REABERTURA, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                }  

                if(status != 'T') {
                    sqlWhere += ` and ORDENS_STATUS = '${status}' `;
                }
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID, 
                    ORDENS_ID_EMPRESAS, 
                    ORDENS_ID_PESSOAS,
                    ORDENS_IDSKY, 
                    PRODUTOS_NOME,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_REFERENCIA,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    ORDENS_REABERTURA,
                    USUARIOS_LOGIN,
                    ORDENS_NOME,
                    ORDENS_CPFCNPJ,
                    EMPRESAS_FANTASIA,
                    ORDENS_TOTAL
                from ORDENS 
                    left join USUARIOS        on USUARIOS_ID   = ORDENS_ID_USUARIOS
                    left outer join PRODUTOS  on PRODUTOS_ID   = ORDENS_IDSKY
                    join EMPRESAS             on EMPRESAS_ID   = ORDENS_ID_EMPRESAS
                    left join OPERACOES       on OPERACOES_ID  = ORDENS_ID_OPERACOES
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total, resolve, reject});
                }
            });
        });
    }
};