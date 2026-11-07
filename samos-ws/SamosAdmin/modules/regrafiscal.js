'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { conteudo, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where REGRAFISCAL_ID > 0  `;
                sqlWhere += status == 0 ? `and REGRAFISCAL_STATUS = 'T' ` : status == 1 ? `and REGRAFISCAL_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and REGRAFISCAL_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and REGRAFISCAL_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by REGRAFISCAL_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and REGRAFISCAL_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by REGRAFISCAL_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and REGRAFISCAL_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by REGRAFISCAL_ID ';  
                } else if(ordem == 3){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'REGRAFISCAL',
                            chave: 'REGRAFISCAL_ID',
                            campos: [
                                'REGRAFISCAL_ID',                                
                                'REGRAFISCAL_NOME'
                            ]
                        });
    
                        sqlWhere += `and REGRAFISCAL_ID = '${id}' `;
                        sqlOrder = ' order by REGRAFISCAL_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from REGRAFISCAL  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from REGRAFISCAL
                         ${sqlWhere} ${sqlOrder}`;
            const total = await samosFB.count(db, sqlCount);
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total, resolve, reject});
                }
            })
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            data['REGRAFISCAL_ID'] = data['REGRAFISCAL_ID'] || await samosFB.lastId(db, 'REGRAFISCAL', 'GEN_REGRAFISCAL_ID', 'REGRAFISCAL_ID');
            samosFB.removeForeignFields(data, 'REGRAFISCAL');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into REGRAFISCAL (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject});
                }
            });
        })
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            samosFB.removeForeignFields(data, 'REGRAFISCAL');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update REGRAFISCAL set ${values} where REGRAFISCAL_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from REGRAFISCAL where REGRAFISCAL_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarExclusao({db, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    }
};