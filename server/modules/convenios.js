'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where CONVENIOS_ID > 0  `;
                sqlWhere += status == 0 ? `and CONVENIOS_STATUS = 'T' ` : status == 1 ? `and CONVENIOS_STATUS = 'F' ` : '';

            let sqlSearch = '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and CONVENIOS_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and CONVENIOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by CONVENIOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and CONVENIOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by CONVENIOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and CONVENIOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by CONVENIOS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'CONVENIOS',
                        chave: 'CONVENIOS_ID',
                        campos: [
                            'CONVENIOS_ID', 
                            'CONVENIOS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and CONVENIOS_ID = '${id}' `;
                    sqlOrder = ' order by CONVENIOS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from CONVENIOS  ${sqlWhere}`;

            sqlSearch = `select ${limits} * from CONVENIOS  ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);
            
            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar convênios';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (convenio, params) => {

        try {
            await samosFB.insert('CONVENIOS', convenio, params);
            await utils.dblog(params); 
            
            return { results: convenio };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar convênio' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, convenio, params) => {

        const cents = utils.number.cents.bind(utils.number);

        try {
            await samosFB.update(id, 'CONVENIOS', convenio, params);
            await utils.dblog(params);
            return { results: convenio };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar convênio' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'CONVENIOS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar convênio';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};