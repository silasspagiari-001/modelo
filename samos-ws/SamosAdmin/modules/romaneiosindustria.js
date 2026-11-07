'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {

        console.log('Params: ', params);

        try {
            const { empresa, usuario, numero, id, pessoa, inicio, final, ordem, status, start, limit } = params;
            
            let sqlOrder      = '';
            let sqlEmpresa    = empresa && empresa > 0 ? ` and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
            let sqlUsuario    = usuario && usuario > 0 ? ` and MOVIMENTOS_ID_USUARIOS   = ${usuario}   ` : '';
            let sqlWhere      = ` where MOVIMENTOS_ID > 0 ${sqlEmpresa} `;

            if(id > 0) {
                sqlWhere += ` and MOVIMENTOS_ID = ${id} `;
                sqlOrder = ` order by MOVIMENTOS_ID `;
            } else if(numero > 0) {
                sqlWhere += ` and MOVIMENTOS_NUMERO = ${numero} `;
                sqlOrder = ` order by MOVIMENTOS_NUMERO `;
            } else {    
                if(pessoa && pessoa > 0) {
                    sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = ${pessoa} `; 
                }

                sqlWhere += ` and MOVIMENTOS_STATUS = 'F' and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' `;

                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }
                    
                if(ordem == 0) {
                    sqlOrder = ` order by MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NUMERO`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;
                }      
            }
                  
            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''}
                MOVIMENTOS_ID,
                MOVIMENTOS_ID_EMPRESAS,
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE, 
                MOVIMENTOS_EMISSAO,
                MOVIMENTOS_NOME,
                MOVIMENTOS_CPFCNPJ,
                MOVIMENTOS_TOTAL,
                EMPRESAS_FANTASIA,
                EMPRESAS_NOME,               
                PESSOAS_NOME,
                CIDADES_NOME,
                CIDADES_ESTADO
            from MOVIMENTOS
            left join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
            left join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
            left join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                       
            ${sqlWhere} ${sqlEmpresa} ${sqlUsuario}
            ${sqlOrder}`; 

            const sqlCount  = `select count(*) from MOVIMENTOS ${sqlWhere}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sql, params);

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar movimentos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
}
