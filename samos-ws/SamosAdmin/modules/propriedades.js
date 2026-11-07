'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where PROPRIEDADES_ID > 0  `;
                sqlWhere += status == 0 ? `and PROPRIEDADES_STATUS = 'T' ` : status == 1 ? `and PROPRIEDADES_STATUS = 'F' ` : '';

            let sqlSearch = '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PROPRIEDADES_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and PROPRIEDADES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by PROPRIEDADES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and PROPRIEDADES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PROPRIEDADES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and PROPRIEDADES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PROPRIEDADES_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'PROPRIEDADES',
                        chave: 'PROPRIEDADES_ID',
                        campos: [
                            'PROPRIEDADES_ID', 
                            'PROPRIEDADES_NOME'
                        ]
                    }, params);

                    sqlWhere += `and PROPRIEDADES_ID = '${id}' `;
                    sqlOrder = ' order by PROPRIEDADES_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from PROPRIEDADES  ${sqlWhere}`;

            sqlSearch = `select ${limits} PROPRIEDADES.*,
                         CIDADES_NOME, 
                         CIDADES_IBGE,
                         CIDADES_ESTADO
                         from PROPRIEDADES
                         join CIDADES on CIDADES_ID = PROPRIEDADES_ID_CIDADES            
            ${sqlWhere} ${sqlOrder}`;

            return { 
                results: await samosFB.executeSQL(sqlSearch, params), 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar propriedades';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select * from PROPRIEDADES where PROPRIEDADES_ID = '${id}'`;
            const results = await samosFB.executeSQL(sql, params);
            
            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar propriedade por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (propriedade, params) => {
        try {
            await samosFB.insert('PROPRIEDADES', propriedade, params);
            await utils.dblog(params);  
            return { results: propriedade };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar propriedade' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, propriedade, params) => {
        try {
            await samosFB.update(id, 'PROPRIEDADES', propriedade, params);
            await utils.dblog(params);
            return { results: propriedade };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar propriedade' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'PROPRIEDADES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar propriedade';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
