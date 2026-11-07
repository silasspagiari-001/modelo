'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where BANCOS_ID >= 0  `;
                sqlWhere += status == 0 ? `and BANCOS_STATUS = 'T' ` : status == 1 ? `and BANCOS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and BANCOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and BANCOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by BANCOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and BANCOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by BANCOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and BANCOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by BANCOS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'BANCOS',
                        chave: 'BANCOS_ID',
                        campos: [
                            'BANCOS_ID', 
                            'BANCOS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and BANCOS_ID = '${id}' `;
                    sqlOrder = ' order by BANCOS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from BANCOS  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from BANCOS  ${sqlWhere} ${sqlOrder}`;
           
            return { 
                results: await samosFB.executeSQL(sqlSearch, params), 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar bancos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async(banco, params) => {
        try {
            await samosFB.insert('BANCOS', banco, params);
            await utils.dblog(params);  
            return { results: banco };
        } catch(error) {
            const msg = 'Falha ao criar banco';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async(id, banco, params) => {
        try {
            await samosFB.update(id, 'BANCOS', banco, params);
            await utils.dblog(params);
            return { results: banco };
        } catch(error) {
            const msg = 'Falha ao alterar banco';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async(id, params) => {
        try {
            await samosFB.delete(id, 'BANCOS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar banco';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
