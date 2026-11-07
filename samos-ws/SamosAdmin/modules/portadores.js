'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { conteudo, ordem, status, start, limit, empresa } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sqlWhere   = `where PORTADORES_ID > 0  `;
                sqlWhere   += status == 0 ? `and PORTADORES_STATUS = 'T' ` : status == 1 ? `and PORTADORES_STATUS = 'F' ` : '';
                sqlWhere   += empresa ? `and PORTADORES_ID_EMPRESAS = ${empresa} ` : '';
                let sqlOrder   = '';
            
            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PORTADORES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and PORTADORES_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by PORTADORES_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and PORTADORES_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PORTADORES_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += `and PORTADORES_FANTASIA like '%${conteudo}%' `;
                    sqlOrder = ' order by PORTADORES_FANTASIA ';  
                } else if (ordem == 3) {
                    sqlWhere += `and PORTADORES_CPFCNPJ like '%${conteudo}%' `;
                    sqlOrder = ' order by PORTADORES_CPFCNPJ ';  
                } else if (ordem == 4) {
                    sqlWhere += conteudo > 0 ? `and PORTADORES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PORTADORES_ID ';  
                } else if(ordem == 5){
                    try {
                        const id = await samosFB.buscaMultipla({
                            db, conteudo,
                            tabela: 'PORTADORES',
                            chave: 'PORTADORES_ID',
                            campos: [
                                'PORTADORES_ID', 
                                'PORTADORES_NOME', 
                                'PORTADORES_CPFCNPJ'
                            ]
                        });
    
                        sqlWhere += `and PORTADORES_ID = '${id}' `;
                        sqlOrder = ' order by PORTADORES_ID '; 
                    } catch (e) {
                        reject(e);
                    }
                }
            }    

            const sqlCount  = `select count(*) from PORTADORES ${sqlWhere} `
            const sqlSearch = `select ${limits} PORTADORES.*,
                         CIDADES_NOME,
                         CIDADES_ESTADO,
                         CIDADES_IBGE,
                         BANCOS_NOME,
                         (BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
                         EMPRESAS_NOME, 
                         EMPRESAS_FANTASIA from PORTADORES
                         left outer join EMPRESAS on EMPRESAS_ID = PORTADORES_ID_EMPRESAS
                         left outer join CIDADES on CIDADES_ID = PORTADORES_ID_CIDADES
                         left outer join BANCOS on BANCOS_ID = PORTADORES_ID_BANCOS
                         ${sqlWhere} ${sqlOrder}`;
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
            const lastId = await samosFB.lastId(db, 'PORTADORES', 'GEN_PORTADORES_ID', 'PORTADORES_ID');
            data['PORTADORES_ID'] = lastId;
            samosFB.removeForeignFields(data, 'PORTADORES');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into PORTADORES (${fields}) values (${values})`;
            
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
            samosFB.removeForeignFields(data, 'PORTADORES');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
            const sqlSearch = `update PORTADORES set ${values} where PORTADORES_ID = ${id}`;
            
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
            const sqlSearch = `delete from PORTADORES where PORTADORES_ID = ${id}`;
            
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
