'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where SERVICOS_ID > 0  `;
                sqlWhere += status == 0 ? `and SERVICOS_STATUS = 'T' ` : status == 1 ? `and SERVICOS_STATUS = 'F' ` : '';

            let sqlSearch = '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and SERVICOS_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and SERVICOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by SERVICOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and SERVICOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by SERVICOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and SERVICOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by SERVICOS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'SERVICOS',
                        chave: 'SERVICOS_ID',
                        campos: [
                            'SERVICOS_ID', 
                            'SERVICOS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and SERVICOS_ID = '${id}' `;
                    sqlOrder = ' order by SERVICOS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from SERVICOS  ${sqlWhere}`;

            sqlSearch = `select ${limits} * from SERVICOS  ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);
                        
            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar servicos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (servico, params) => {

        try {
            await samosFB.insert('SERVICOS', servico, params);
            await utils.dblog(params); 
            
            return { results: servico };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar servico' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, servico, params) => {

        const cents = utils.number.cents.bind(utils.number);

        try {
            await samosFB.update(id, 'SERVICOS', servico, params);
            await utils.dblog(params);
            return { results: servico };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar serviço' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'SERVICOS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao excluir serviço';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};