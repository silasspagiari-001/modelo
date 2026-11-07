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
            let sqlWhere = `where OPERADORAS_ID > 0  `;
                sqlWhere += status == 0 ? `and OPERADORAS_STATUS = 'T' ` : status == 1 ? `and OPERADORAS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and OPERADORAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and OPERADORAS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by OPERADORAS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and OPERADORAS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by OPERADORAS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and OPERADORAS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by OPERADORAS_ID ';  
                } else if(ordem == 3){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'OPERADORAS',
                            chave: 'OPERADORAS_ID',
                            campos: [
                                'OPERADORAS_ID', 
                                'OPERADORAS_NOME'
                            ]
                        });
    
                        sqlWhere += `and OPERADORAS_ID = '${id}' `;
                        sqlOrder = ' order by OPERADORAS_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from OPERADORAS  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from OPERADORAS  ${sqlWhere} ${sqlOrder}`;
            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total, resolve, reject});
                }
            });
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const lastId = await samosFB.lastId(db, 'OPERADORAS', 'GEN_OPERADORAS_ID', 'OPERADORAS_ID');
            data['OPERADORAS_ID'] = lastId;
            samosFB.removeForeignFields(data, 'OPERADORAS');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into OPERADORAS (${fields}) values (${values})`;

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
            samosFB.removeForeignFields(data, 'OPERADORAS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update OPERADORAS set ${values} where OPERADORAS_ID = ${id}`;

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
            const sqlSearch = `delete from OPERADORAS where OPERADORAS_ID = ${id}`;

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
