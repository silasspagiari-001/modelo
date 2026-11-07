'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {  
            const { empresa, conteudo, inicio, final, ordem, status, tipo, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';            
            let sqlEmpresa   = empresa ? `and CHEQUES_ID_EMPRESAS   = ${empresa} `   : '';
            let sqlWhere = `where CHEQUES_ID > 0 ${sqlEmpresa}`;

            if(conteudo) {
                sqlWhere +=  ` and CHEQUES_NOME like '${conteudo}%' `;
            }

            sqlWhere += status == 0 ? `and CHEQUES_STATUS = 'A' ` : 
                        status == 1 ? `and CHEQUES_STATUS = 'B' ` : 
                        status == 2 ? `and CHEQUES_STATUS = 'R' ` : 
                        status == 3 ? `and CHEQUES_STATUS = 'D' ` : 
                        status == 4 ? `and CHEQUES_STATUS = 'C' ` : '';
        
            if(tipo && tipo == 1){
                //traz os que ainda não estão em Remessa de Cheques
                sqlWhere += ` and
                    not exists(
                        select * from REMESSASITENS
                        where REMESSASITENS_ID_CHEQUES = CHEQUES_ID
                    )`; 
            }

            if (inicio && final && inicio.length > 0 && final.length > 0) {
                if (ordem == 0) {
                    sqlWhere += ` and CHEQUES_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    sqlOrder += ` order by CHEQUES_EMISSAO `;
                } else if(ordem == 1) {
                    sqlWhere += ` and CHEQUES_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    sqlOrder += ` order by CHEQUES_VENCIMENTO `;
                } else if (ordem == 2) {
                    sqlWhere += ` and CHEQUES_DEPOSITO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    sqlOrder += ` order by CHEQUES_DEPOSITO `;
                } else if (ordem == 3) {
                    sqlWhere += ` and CHEQUES_BAIXA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    sqlOrder += ` order by CHEQUES_BAIXA `;
                } else if (ordem == 4) {
                    sqlWhere += ` and CHEQUES_REPASSE between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    sqlOrder += ` order by CHEQUES_REPASSE `;
                }
            }

            const sqlCount  = `select count(*) from CHEQUES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} CHEQUES.*, PESSOAS_NOME as NOME_REPASSECHEQUE,
                               BANCOS_NOME, CIDADES_NOME, CIDADES_ESTADO from CHEQUES
                               left outer join BANCOS on BANCOS_ID = CHEQUES_ID_BANCOS
                               left outer join PESSOAS on PESSOAS_ID = CHEQUES_ID_PESSOAS
                               left outer join CIDADES ON CIDADES_ID = CHEQUES_ID_CIDADES
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
            const db     = await samosFB.conectarBanco(params.client);
            const lastId = await samosFB.lastId(db, 'CHEQUES', 'GEN_CHEQUES_ID', 'CHEQUES_ID');
            const hoje   = moment.tz(params.timezone).format('YYYY-MM-DD')

            data['CHEQUES_ID'] = lastId;
            data['CHEQUES_EMISSAO'] = hoje;
            
            samosFB.removeForeignFields(data, 'CHEQUES');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into CHEQUES (${fields}) values (${values})`;

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
            samosFB.removeForeignFields(data, 'CHEQUES');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update CHEQUES set ${values} where CHEQUES_ID = ${id}`;

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
            const sqlSearch = `delete from CHEQUES where CHEQUES_ID = ${id}`;

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
