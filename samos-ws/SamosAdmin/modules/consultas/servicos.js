'use strict';

const utils   = require('../../services/samosUtils');
const samosFB = require('../../services/samosFB');
const api     = require('../../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            
            let sqlWhere = `where SERVICOS_ID > 0  `;
            let sqlOrder = '';

            if (status == 'T') {
                sqlWhere += ` and SERVICOS_STATUS <> 'F' `;
            } else if (status && params.client) {
                sqlWhere += ` and SERVICOS_STATUS = '${status}' `;
            }    
        
            if (conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and SERVICOS_ID = ${conteudo.replace(/\./ig, '')} `;
                sqlOrder = ' order by SERVICOS_ID ';
            } else if (conteudo && conteudo.substring(0, 1) == '+') {
                sqlWhere += `and SERVICOS_NOME like  '${conteudo.replace(/\+/ig, '%')}%' `;
            } else {
                if (ordem == 0) {
                    sqlWhere += `and SERVICOS_NOME like '${conteudo}%' `;
                    sqlOrder = ' order by SERVICOS_NOME ';
                } else if (ordem == 1) {
                    sqlWhere += `and SERVICOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by SERVICOS_NOME ';
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and SERVICOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by SERVICOS_ID ';
                } else if (ordem == 7) {
                    sqlWhere += `and SERVICOS_NOME like  '%${conteudo.replace('%', '')}%' `;
                    sqlOrder = ' order by SERVICOS_NOME ';    
                }
            }

            const sqlSearch = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                SERVICOS_ID,
                SERVICOS_NOME,
                SERVICOS_STATUS,
                SERVICOS_PRECO
            from SERVICOS
            ${sqlWhere} ${sqlOrder}`;
            
            const sqlCount = `select count(*) from SERVICOS ${sqlWhere}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar serviços';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};