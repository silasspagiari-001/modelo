'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { id, empresa, numero, pessoa, inicio, final, ordem, status, start, limit} = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa = empresa ? `and REMESSAS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlWhere = `where REMESSAS_ID > 0 ${sqlEmpresa} `;

            if(id > 0) {
                sqlWhere = ` where REMESSAS_ID = ${id} `;
                sqlOrder = ` order by REMESSAS_ID `;
            } else if(numero > 0) {
                sqlWhere += ` and REMESSAS_NUMERO = ${numero} `;
                sqlOrder = ` order by REMESSAS_NUMERO `;
            } else {    
                if(pessoa > 0) {
                    sqlWhere += ` and REMESSAS_ID_PESSOAS = ${pessoa} `; 
                }

                if(status == 0) {
                    sqlWhere += ` and REMESSAS_STATUS = 'F' `;
                } else if(status == 1) {
                    sqlWhere += ` and REMESSAS_STATUS = 'T' `;
                }

                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and REMESSAS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }
                   
                if(ordem == 0) {
                    sqlOrder = ` order by REMESSAS_EMISSAO,REMESSAS_NUMERO `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by REMESSAS_NUMERO `;
                } else if (ordem == 2) {
                    sqlOrder = ` order by REMESSAS_TOTAL `;
                }      
            }
                    
            const sqlCount  = `select count(*) from REMESSAS ${sqlWhere}`;
            const sqlSearch = `select ${limits}
                REMESSAS.*,
                EMPRESAS_FANTASIA,
                PESSOAS_NOME,
                PESSOAS_CPFCNPJ        
            from REMESSAS 
            left outer join PESSOAS  on PESSOAS_ID  = REMESSAS_ID_PESSOAS
            left outer join EMPRESAS on EMPRESAS_ID = REMESSAS_ID_EMPRESAS
            ${sqlWhere} ${sqlOrder}`; 
            
            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total, resolve, reject, sqlFilhos: {
                        REMESSAS_ITENS: `select REMESSASITENS.*,
                                CHEQUES_NUMERO,
                                CHEQUES_ID_EMPRESAS,
                                CHEQUES_NOME,
                                CHEQUES_CPFCNPJ,
                                CHEQUES_ID_BANCOS,
                                CHEQUES_VALOR,
                                CHEQUES_EMISSAO,
                                CHEQUES_VENCIMENTO
                            from REMESSASITENS
                            left outer join CHEQUES on CHEQUES_ID = REMESSASITENS_ID_CHEQUES
                            where REMESSASITENS_ID_REMESSAS = results['REMESSAS_ID']
                            order by REMESSASITENS_ID`
                    }});
                }
            });
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'REMESSAS', 'GEN_REMESSAS_ID', 'REMESSAS_ID');
            const ultimoDocto = await samosFB.ultimoDocto(db, 'REMESSAS', data['REMESSAS_ID_EMPRESAS'], data['REMESSAS_ID_DOCUMENTOS']);
            let { numero, serie } = ultimoDocto;

            data['REMESSAS_ID']      = lastId;
            data['REMESSAS_NUMERO']  = numero;
            data['REMESSAS_SERIE']   = serie;
            data['REMESSAS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            data['REMESSAS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');

            samosFB.removeForeignFields(data, 'REMESSAS');
            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into REMESSAS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        REMESSAS_ITENS: `insert into REMESSASITENS ['REMESSASITENS_ID_REMESSAS'] values [values]`
                    }, registroPai: data});
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);

            samosFB.removeForeignFields(data, 'REMESSAS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
            const sqlSearch = `update REMESSAS set ${values} where REMESSAS_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        REMESSAS_ITENS: `insert into REMESSASITENS ['REMESSASITENS_ID_REMESSAS'] values [values]`,
                    }, registroPai: data}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from REMESSAS where REMESSAS_ID = ${id}`;
            const cleanChildsSql = `delete from REMESSASITENS where REMESSASITENS_ID_REMESSAS = ${id}`;
            
            db.query(cleanChildsSql, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir itens`, db, error, reject, cleanChildsSql);
                } else {
                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarExclusao({db, resolve, reject}, function() {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    }); 
                }
            });
        });
    }
};
