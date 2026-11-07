'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, numero, transporte, placa, nome, inicio, final, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa = empresa ? `and MANIFESTOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlWhere = `where MANIFESTOS_ID > 0 ${sqlEmpresa} `;

            if(numero > 0) {
                sqlWhere += ` and MANIFESTOS_NUMERO = '${numero}'`;
                sqlOrder = ` order by MANIFESTOS_NUMERO `;
            } else {
                if(transporte > 0) {
                    sqlWhere += ` and MANIFESTOS_ID_TRANSPORTES = '${transporte}' `; 
                }

                if(placa) {
                    sqlWhere += ` and MANIFESTOS_PLACA = '${placa}' `;
                }

                if(nome) {
                    sqlWhere += ` and MANIFESTOS_TRANSPNOME like '${nome}%' `;
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and MANIFESTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if(ordem == 0) {
                    sqlOrder = ` order by MANIFESTOS_EMISSAO, MANIFESTOS_ID_EMPRESAS, MANIFESTOS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by MANIFESTOS_ID_TRANSPORTES, MANIFESTOS_ID_EMPRESAS, MANIFESTOS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by MANIFESTOS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by MANIFESTOS_TRANSPNOME, MANIFESTOS_ID_EMPRESAS, MANIFESTOS_ID `;
                }

                if(status == 0) {
                    sqlWhere += ` and MANIFESTOS_STATUS = 'N' `;
                } else if(status == 1) {
                    sqlWhere += ` and MANIFESTOS_STATUS = 'E' `;
                } else if(status == 2) {
                    sqlWhere += ` and MANIFESTOS_STATUS = 'F' `;
                } else if(status == 3) {
                    sqlWhere += ` and MANIFESTOS_STATUS = 'C' `;
                }
            }
                    
            const sqlCount  = `select count(MANIFESTOS_ID) from MANIFESTOS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    MANIFESTOS_ID, 
                    MANIFESTOS_NUMERO, 
                    MANIFESTOS_SERIE,
                    MANIFESTOS_EMISSAO, 
                    MANIFESTOS_STATUS, 
                    MANIFESTOS_ID_EMPRESAS, 
                    MANIFESTOS_ID_TRANSPORTES, 
                    MANIFESTOS_TRANSPNOME,
                    MANIFESTOS_TRANSPCPFCNPJ,
                    MANIFESTOS_CPFCNPJ,
                    MANIFESTOS_TOTAL
                from MANIFESTOS 
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({ db, results, total, resolve, reject });
                }
            });
        });
    },

    readById: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const ids = id.split(',');
            let sqlWhere = ` where `;

            sqlWhere += ids.reduce((result, id) => { // MODELO
                return result += ` MANIFESTOS_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by MANIFESTOS_ID `;
            const sqlSearch = `select MANIFESTOS.*, 
                    EMPRESAS_NOME, EMPRESAS_CPFCNPJ, EMPRESAS_INSCRICAO, EMPRESAS_ENDERECO,
                    EMPRESAS_NUMERO, EMPRESAS_BAIRRO, EMPRESAS_CEP, EMPRESAS_EMAIL, 
                    EMPRESAS_TELEFONE, EMPRESAS_CELULAR, EMPRESAS_FANTASIA,
                    CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                    CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                    MANIFESTOS_TRANSPCPFCNPJ, MANIFESTOS_TRANSPNOME, 
                    CIDADES.CIDADES_IBGE as CIDADES_IBGECARREGA, 
                    CIDADES.CIDADES_NOME as CIDADES_NOMECARREGA,
                    CIDADES.CIDADES_ESTADO as CIDADES_ESTADOCARREGA, trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE
                from MANIFESTOS 
                    left join CIDADES     on CIDADES_ID     = MANIFESTOS_ID_CARREGAMENTO
                    left join EMPRESAS    on EMPRESAS_ID    = MANIFESTOS_ID_EMPRESAS                    
                    left join CIDADES     as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS.EMPRESAS_ID_CIDADES
                ${sqlWhere} ${sqlOrder}`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
                        MANIFESTOS_ITENS: `select MANIFESTOSITENS.*, CIDADES_NOME as CIDADES_NOMEITEM, CIDADES_ESTADO as CIDADES_ESTADOITEM, CIDADES_IBGE as CIDADES_IBGEITEM
                            from MANIFESTOSITENS
                            join MANIFESTOS on MANIFESTOS_ID = MANIFESTOSITENS_ID_MANIFESTOS
                            left join CIDADES on CIDADES_ID  = MANIFESTOSITENS_ID_CIDADES
                            where MANIFESTOSITENS_ID_MANIFESTOS = results['MANIFESTOS_ID'] 
                            order by MANIFESTOSITENS_ID`
                    }});
                }
            });
        });
    },
    
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'MANIFESTOS', 'GEN_MANIFESTOS_ID', 'MANIFESTOS_ID');
            const ultimoDocto = await samosFB.ultimoDocto(db, 'MANIFESTOS', data['MANIFESTOS_ID_EMPRESAS'], data['MANIFESTOS_ID_DOCUMENTOS']);
            let { numero, serie } = ultimoDocto;
            
            data['MANIFESTOS_ID']      = lastId;
            data['MANIFESTOS_NUMERO']  = numero;
            data['MANIFESTOS_SERIE']   = serie;
            data['MANIFESTOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            data['MANIFESTOS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');

            samosFB.removeForeignFields(data, 'MANIFESTOS');

            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data))).join(',').replace(/'NaN'/g, '0');
            const sqlSearch = `insert into MANIFESTOS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        MANIFESTOS_ITENS: `insert into MANIFESTOSITENS ['MANIFESTOSITENS_ID_MANIFESTOS'] values [values]`
                    }, registroPai: data});
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);

            samosFB.removeForeignFields(data, 'MANIFESTOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'').replace(/'NaN'/g, '0');;
            const sqlSearch = `update MANIFESTOS set ${values} where MANIFESTOS_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        MANIFESTOS_ITENS: `insert into MANIFESTOSITENS ['MANIFESTOSITENS_ID_MANIFESTOS'] values [values]`,
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
            const sqlSearch = `delete from MANIFESTOS where MANIFESTOS_ID = ${id}`;
            const cleanChildsSql = `execute block as
                begin
                    delete from MANIFESTOSITENS   where MANIFESTOSITENS_ID_MANIFESTOS   = ${id};
                end;`;
            
            db.query(cleanChildsSql, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir itens`, db, error, reject, cleanChildsSql);
                } else {
                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarExclusao({db, resolve, reject}, function(db, results) {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    });
                }
            });
        });
    }
};