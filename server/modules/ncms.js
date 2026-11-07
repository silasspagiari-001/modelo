'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { conteudo, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits  = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere  = `where NCMS_ID > 0  `;
                sqlWhere += status == 0 ? `and NCMS_STATUS = 'T' ` : status == 1 ? `and NCMS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and NCMS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and NCMS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by NCMS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and NCMS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by NCMS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and NCMS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by NCMS_ID ';  
                } else if (ordem == 3) {
                    sqlWhere += conteudo > 0 ? `and NCMS_NCM = '${conteudo}' ` : '';
                    sqlOrder = ' order by NCMS_NCM ';
                } else if(ordem == 4){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'NCMS',
                            chave: 'NCMS_ID',
                            campos: [
                                'NCMS_ID', 
                                'NCMS_NOME',
                                'NCMS_NCM'
                            ]
                        });
    
                        sqlWhere += `and NCMS_ID = '${id}' `;
                        sqlOrder = ' order by NCMS_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from NCMS  ${sqlWhere}`;
            const sqlSearch = `select ${limits} NCMS.*,
                               (NCMS_CSTPIS || '|' || left(trim(cast(NCMS_ALIQUOTAPIS as varchar(5))), 4) || '|' || NCMS_CSTCOFINS || '|' || left(trim(cast(NCMS_ALIQUOTACOFINS as varchar(5))), 4) || '|') as CSTS_ALIQUOTAS
            from NCMS  ${sqlWhere} ${sqlOrder}`;
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
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'NCMS', 'GEN_NCMS_ID', 'NCMS_ID');
            data['NCMS_ID'] = lastId;
            samosFB.removeForeignFields(data, 'NCMS');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into NCMS (${fields}) values (${values})`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    const items = JSON.stringify(filhos['NCMS_DIFAL'])
                        .replace(/\\"/ig, '"')
                        .slice(1, -1);

                    const sqlDifal = `update NCMS 
                                      set    NCMS_DIFAL = '[${items}]'
                                      where  NCMS_ID    = ${lastId}`;

                    db.query(sqlDifal, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarGravacao({db, results: data, resolve, reject});
                        }
                    });
                }
            });
        })
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            samosFB.removeForeignFields(data, 'NCMS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
            const sqlSearch = `update NCMS set ${values} where NCMS_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    const items = JSON.stringify(filhos['NCMS_DIFAL'])
                        .replace(/\\"/ig, '"')
                        .slice(1, -1);

                    const sqlDifal = `update NCMS 
                                      set    NCMS_DIFAL = '[${items}]'
                                      where  NCMS_ID    = ${id}`;

                    db.query(sqlDifal, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarGravacao({db, results: data, resolve, reject}, function() {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from NCMS where NCMS_ID = ${id}`;
            
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
