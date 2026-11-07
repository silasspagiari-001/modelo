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
            let sqlWhere = `where OPERACOES_ID > 0  `;
                sqlWhere += status == 0 ? `and OPERACOES_STATUS = 'T' ` : status == 1 ? `and OPERACOES_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and OPERACOES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and OPERACOES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by OPERACOES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and OPERACOES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by OPERACOES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and OPERACOES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by OPERACOES_ID ';  
                } else if(ordem == 3){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'OPERACOES',
                            chave: 'OPERACOES_ID',
                            campos: [
                                'OPERACOES_ID',                                
                                'OPERACOES_NOME'
                            ]
                        });
    
                        sqlWhere += `and OPERACOES_ID = '${id}' `;
                        sqlOrder = ' order by OPERACOES_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from OPERACOES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} OPERACOES.*, APLICACOES_NOME, CUSTOS_NOME, PRAZOS_NOME
                         from OPERACOES
                         left outer join APLICACOES on APLICACOES_ID = OPERACOES_ID_APLICACOES
                         left outer join CUSTOS     on CUSTOS_ID     = OPERACOES_ID_CUSTOS
                         left outer join PRAZOS     on PRAZOS_ID     = OPERACOES_ID_PRAZOS
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
            data['OPERACOES_ID'] = data['OPERACOES_ID'] || await samosFB.lastId(db, 'OPERACOES', 'GEN_OPERACOES_ID', 'OPERACOES_ID');
            samosFB.removeForeignFields(data, 'OPERACOES');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into OPERACOES (${fields}) values (${values})`;

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
            samosFB.removeForeignFields(data, 'OPERACOES');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update OPERACOES set ${values} where OPERACOES_ID = ${id}`;

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
            const sqlSearch = `delete from OPERACOES where OPERACOES_ID = ${id}`;

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