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
            let sqlWhere = `where CUSTOS_ID > 0  `;
                sqlWhere += status == 0 ? `and CUSTOS_STATUS = 'T' ` : status == 1 ? `and CUSTOS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and CUSTOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and CUSTOS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by CUSTOS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and CUSTOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by CUSTOS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and CUSTOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by CUSTOS_ID ';  
                } else if (ordem == 3) {
                    sqlWhere += `and CUSTOS_MASCARA like '${conteudo}%' `;
                    sqlOrder = ' order by CUSTOS_MASCARA ';
                } else if(ordem == 4){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'CUSTOS',
                            chave: 'CUSTOS_ID',
                            campos: [
                                'CUSTOS_ID', 
                                'CUSTOS_NOME',
                                'CUSTOS_MASCARA'
                            ]
                        });
    
                        sqlWhere += `and CUSTOS_ID = '${id}' `;
                        sqlOrder = ' order by CUSTOS_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from CUSTOS  ${sqlWhere}`;
            const sqlSearch = `select ${limits} * from CUSTOS  ${sqlWhere} ${sqlOrder}`;
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
            const lastId = await samosFB.lastId(db, 'CUSTOS', 'GEN_CUSTOS_ID', 'CUSTOS_ID');
            data['CUSTOS_ID'] = lastId;
            samosFB.removeForeignFields(data, 'CUSTOS');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into CUSTOS (${fields}) values (${values})`;

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
            samosFB.removeForeignFields(data, 'CUSTOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update CUSTOS set ${values} where CUSTOS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({ db, results: data, resolve, reject }, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from CUSTOS where CUSTOS_ID = ${id}`;

            db.query(sqlSearch, (error) => {
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
