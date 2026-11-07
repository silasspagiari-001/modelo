'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where CIDADES_ID > 0  `;
                sqlWhere += status == 0 ? `and CIDADES_STATUS <> 'F' ` : 
                            status == 3 ? `and CIDADES_STATUS = 'P' ` :
                            status == 1 ? `and CIDADES_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and CIDADES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and CIDADES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by CIDADES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and CIDADES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by CIDADES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and CIDADES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by CIDADES_ID ';  
                } else if (ordem == 3) {
                    sqlWhere += `and CIDADES_IBGE = '${conteudo}' `;
                    sqlOrder = ' order by CIDADES_IBGE ';  
                } else if(ordem == 4){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'CIDADES',
                        chave: 'CIDADES_ID',
                        campos: [
                            'CIDADES_ID', 
                            'CIDADES_NOME',
                            'CIDADES_IBGE'
                        ]
                    }, params);

                    sqlWhere += `and CIDADES_ID = '${id}' `;
                    sqlOrder = ' order by CIDADES_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from CIDADES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from CIDADES  ${sqlWhere} ${sqlOrder}`;
            
            return { 
                results: await samosFB.executeSQL(sqlSearch, params), 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar cidades';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (cidade, params) => {
        try {
            await samosFB.insert('CIDADES', cidade, params);
            await utils.dblog(params);  
            return { results: cidade };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar cidade' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, cidade, params) => {
        try {
            await samosFB.update(id, 'CIDADES', cidade, params);
            await utils.dblog(params);
            return { results: cidade };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar cidade' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'CIDADES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar cidade';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
