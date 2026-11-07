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
            let sqlWhere = `where PROFISSOES_ID > 0  `;
                sqlWhere += status == 0 ? `and PROFISSOES_STATUS = 'T' ` : status == 1 ? `and PROFISSOES_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PROFISSOES_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and PROFISSOES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by PROFISSOES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and PROFISSOES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PROFISSOES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and PROFISSOES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PROFISSOES_ID ';  
                } else if(ordem == 3){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'PROFISSOES',
                            chave: 'PROFISSOES_ID',
                            campos: [
                                'PROFISSOES_ID', 
                                'PROFISSOES_NOME'
                            ]
                        });
    
                        sqlWhere += `and PROFISSOES_ID = '${id}' `;
                        sqlOrder = ' order by PROFISSOES_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from PROFISSOES  ${sqlWhere}`
            const sqlSearch = `select ${limits} * from PROFISSOES  ${sqlWhere} ${sqlOrder}`;
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
            const lastId = await samosFB.lastId(db, 'PROFISSOES', 'GEN_PROFISSOES_ID', 'PROFISSOES_ID');
            data['PROFISSOES_ID'] = lastId;
            samosFB.removeForeignFields(data, 'PROFISSOES');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into PROFISSOES (${fields}) values (${values})`;

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
            samosFB.removeForeignFields(data, 'PROFISSOES');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update PROFISSOES set ${values} where PROFISSOES_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, rejec, sqlSearch);
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
            const sqlSearch = `delete from PROFISSOES where PROFISSOES_ID = ${id}`;

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
