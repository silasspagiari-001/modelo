'use strict';

const utils   = require('../../services/samosUtils');
const samosFB = require('../../services/samosFB');
const api     = require('../../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            
            let sqlWhere = `where PRODUTOS_ID > 0  `;
            let sqlOrder = '';

            if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'T')  {
                sqlWhere += ` and (PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') `;
            } else if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'G') {
                sqlWhere += ` and ((PRODUTOS_STATUS = 'T') or (PRODUTOS_STATUS = 'L') or (PRODUTOS_STATUS = 'A')) `;
            } else if (status == 'T') {
                sqlWhere += ` and PRODUTOS_STATUS <> 'F' `;
            } else if (status && params.client) {
                sqlWhere += ` and PRODUTOS_STATUS = '${status}' `;
            }    
        
            if (conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PRODUTOS_ID = ${conteudo.replace(/\./ig, '')} `;
                sqlOrder = ' order by PRODUTOS_ID ';
            } else if (conteudo && conteudo.substring(0, 1) == '+') {
                sqlWhere += `and PRODUTOS_NOME like  '${conteudo.replace(/\+/ig, '%')}%' `;
            } else if (conteudo && conteudo.substring(0, 1) == '#') {
                sqlWhere += `and PRODUTOS_BARRA like  '${conteudo.replace(/\#/ig, '%')}%' `;
            } else if (conteudo && conteudo.substring(0, 1) == '@') {
                sqlWhere += `and PRODUTOS_MARCA like '${conteudo.replace(/\@/ig, '%')}%' `;
            } else if (conteudo && conteudo.substring(0, 1) == '-') {
                sqlWhere += `and PRODUTOS_FABRICA like  '${conteudo.replace(/\-/ig, '%').toUpperCase()}%' `;
            } else {
                if (ordem == 0) {
                    sqlWhere += `and PRODUTOS_NOME like '${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_NOME ';
                } else if (ordem == 1) {
                    sqlWhere += `and PRODUTOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_NOME ';
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and PRODUTOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PRODUTOS_ID ';
                } else if (ordem == 4) {
                    sqlWhere += ` and PRODUTOS_MARCA like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_MARCA ';
                } else if (ordem == 5) {
                    sqlWhere += ` and PRODUTOS_APLICACAO like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_APLICACAO, PRODUTOS_NOME ';
                } else if (ordem == 6) {
                    sqlWhere += ` and PRODUTOS_FABRICA like '%${conteudo.toUpperCase()}%' `;
                    sqlOrder = ' order by PRODUTOS_FABRICA, PRODUTOS_NOME ';
                } else if (ordem == 7) {
                    sqlWhere += `and PRODUTOS_NOME like  '%${conteudo.replace('%', '')}%' `;
                    //Se for vista
                    if( params.tipopreco == 'vista'){
                        sqlOrder = ' order by SALDOS_PRECO, PRODUTOS_NOME ';
    
                    }else{
                        sqlOrder = ' order by SALDOS_PRAZO, PRODUTOS_NOME ';
                    }
                }
            }

            const sqlSearch = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                PRODUTOS_ID,
                PRODUTOS_NOME,
                PRODUTOS_DERIVADO,
                PRODUTOS_STATUS,
                SALDOS_PRECOMINIMO,
                SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                SALDOS_PRECO,
                SALDOS_PRAZO,
                SALDOS_CUSTO,
                SALDOS_DISPONIVEL,
                SALDOS_LOCAL,
                SALDOS_CSTLOCAL,
                SALDOS_ICMSLC,
                NCMS_ALIQUOTANACIONAL,
                NCMS_ALIQUOTAESTADUAL,
                NCMS_ALIQUOTAMUNICIPAL
            from PRODUTOS
            left outer join SALDOS on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = '${params.empresaLogada}'
            left outer join NCMS   on NCMS_ID = PRODUTOS_ID_NCMS
            ${sqlWhere} ${sqlOrder}`;
            
            const sqlCount = `select count(*) from PRODUTOS 
                             left outer join SALDOS on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = '${params.empresaLogada}'
                             ${sqlWhere}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};