'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, razao, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where APLICACOES_ID > 0  `;
            let sqlOrder = '';
            let vaiTrazerTodos = params.trazerTodos || false;

            if( params.razao ){
                sqlWhere += `and APLICACOES_STATUS = '${ params.razao == 0 ? 'A' : 'S' }' `;
            }

            if( params.tipo && params.tipo > 0 ){
                sqlWhere += `and APLICACOES_TIPO = '${ params.tipo == 1 ? 'R' :
                                                       params.tipo == 2 ? 'D' :
                                                       params.tipo == 3 ? 'C' :
                                                       params.tipo == 4 ? 'U' : ''}' `;
            }

            if(conteudo && (conteudo.substring(0, 1) == '.' || parseInt(conteudo) > 0)) {
                sqlWhere += `and APLICACOES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and APLICACOES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by APLICACOES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and APLICACOES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by APLICACOES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and APLICACOES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by APLICACOES_ID ';  
                } else if (ordem == 3) {
                    sqlWhere += conteudo ? `and APLICACOES_MASCARA like '${conteudo}%' ` : '';
                    sqlOrder = ' order by APLICACOES_MASCARA ';
                } else if(ordem == 4){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'APLICACOES',
                        chave: 'APLICACOES_ID',
                        campos: [
                            'APLICACOES_ID', 
                            'APLICACOES_NOME',
                            'APLICACOES_MASCARA'
                        ]
                    }, params);

                    sqlWhere += `and APLICACOES_ID = '${id}' `;
                    sqlOrder = ' order by APLICACOES_ID '; 
                } 
            }    

            if(vaiTrazerTodos){
                //ignora o where
                sqlWhere = '';
            }

            const sqlCount  = `select count(*) from APLICACOES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from APLICACOES  ${sqlWhere} ${sqlOrder}`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async result => {
                const mascaraSplit = result['APLICACOES_MASCARA'].split('.');
                const mascaraBase = mascaraSplit.slice(0, (mascaraSplit.length-1) ).join('.');

                const sqlSuperiores = `
                   select *
                   from APLICACOES
                   where APLICACOES_MASCARA like '${mascaraBase}%' and
                         APLICACOES_STATUS = 'S' and
                         APLICACOES_MASCARA <> ''
                   order by APLICACOES_MASCARA
                `;
                const resultsSuperiores = await samosFB.executeSQL(sqlSuperiores, params);

                if( (resultsSuperiores || []).length > 0 ){
                    result['SUPERIOR_ID'] = resultsSuperiores[0]['APLICACOES_ID'];
                    result['SUPERIOR_MASCARA'] = resultsSuperiores[0]['APLICACOES_MASCARA'];
                    result['SUPERIOR_NOME'] = resultsSuperiores[0]['APLICACOES_NOME'];
                    result['SUPERIOR_RAZAO'] = resultsSuperiores[0]['APLICACOES_STATUS'];
                    result['SUPERIOR_TIPO'] = resultsSuperiores[0]['APLICACOES_TIPO'];
                }
            }))    

            return { 
                results: results, 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar aplicações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (aplicacao, params) => {
        try {
            await samosFB.insert('APLICACOES', aplicacao, params);
            await utils.dblog(params);  
            return { results: aplicacao };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar aplicação' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, aplicacao, params) => {
        try {
            await samosFB.update(id, 'APLICACOES', aplicacao, params);
            await utils.dblog(params);
            return { results: aplicacao };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar aplicação' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'APLICACOES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar aplicação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
