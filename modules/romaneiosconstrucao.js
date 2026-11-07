'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, documento, numero, id, pessoa, inicio, final, ordem, status, start, limit} = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlDocumento = documento ? `and ROMANEIOS_ID_DOCUMENTOS = ${documento} ` : '';
            let sqlWhere = `where ROMANEIOS_ID > 0 ${sqlDocumento}`;

            if(empresa) { 
              sqlWhere += `and ROMANEIOS_ID_EMPRESAS = ${empresa} `;
            }

            if(id > 0) {
                sqlWhere += ` and ROMANEIOS_ID = ${id} `;
                sqlOrder = ` order by ROMANEIOS_ID `;
            } else if(numero > 0) {
                sqlWhere += ` and ROMANEIOS_NUMERO = ${numero} `;
                sqlOrder = ` order by ROMANEIOS_NUMERO `;
            } else {    
                if(pessoa > 0) {
                    sqlWhere += ` and ROMANEIOS_ID_PESSOAS = ${pessoa} `; 
                }
                if(status == 0) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'I' `;
                } else if(status == 1) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'J' `;
                } else if(status == 2) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;
                } else if(status == 3) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;
                }     
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }
                   
                if(ordem == 0) {
                    sqlOrder = ` order by ROMANEIOS_EMISSAO,ROMANEIOS_NUMERO `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by ROMANEIOS_ID_TRANSPORTES `;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ROMANEIOS_NUMERO `;
                }      
            }
                    
            const sqlCount  = `select count(*) from ROMANEIOS ${sqlWhere}`;
            const sqlSearch = `select ${limits}
                                    ROMANEIOS.*,
                                    EMPRESAS_FANTASIA,
                                    EMPRESAS_NOME,
                                    TRANSPORTES_NOME,
                                    PESSOAS_CPFCNPJ,
                                    PESSOAS_INSCRICAO,
                                    PESSOAS_TELEFONE,
                                    PESSOAS_CELULAR,
                                    PESSOAS_EMAIL,
                                    PESSOAS_ENDERECO,
                                    PESSOAS_NUMERO,
                                    PESSOAS_CEP,
                                    PESSOAS_BAIRRO,
                                    CIDADES_NOME,
                                    CIDADES_ESTADO,
                                    USUARIOS_NOME,
                                    DOCUMENTOS_ID,
                                    DOCUMENTOS_NOME,
                                    DOCUMENTOS_LAYOUT,
                                    MOVIMENTOS_ID_PESSOAS,
                                    MOVIMENTOS_NUMERO,                
                                    MOVIMENTOS_SERIE,                
                                    MOVIMENTOS_NOME,
                                    MOVIMENTOS_CPFCNPJ,
                                    MOVIMENTOS_EMISSAO            
                                from ROMANEIOS 
                                left join EMPRESAS on EMPRESAS_ID = ROMANEIOS_ID_EMPRESAS
                                left join TRANSPORTES on TRANSPORTES_ID = ROMANEIOS_ID_TRANSPORTES
                                left join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOS_ID_MOVIMENTOS
                                left join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
                                left join USUARIOS on USUARIOS_ID = ROMANEIOS_ID_USUARIOS                       
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

    readById: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const ids = id.split(',');
            let sqlWhere = ` where `;            

            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` ROMANEIOS_ID_EMPRESAS = ${params.empresa} and
                              ROMANEIOS_NUMERO      = ${params.numero}  and
                              ROMANEIOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` ROMANEIOS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const sqlOrder = ` order by ROMANEIOS_ID `;            

            const sqlSearch = `select ROMANEIOS.*,
                                    EMPRESAS_FANTASIA,
                                    EMPRESAS_NOME,
                                    TRANSPORTES_NOME,
                                    PESSOAS_CPFCNPJ,
                                    PESSOAS_INSCRICAO,
                                    PESSOAS_TELEFONE,
                                    PESSOAS_CELULAR,
                                    PESSOAS_EMAIL,
                                    PESSOAS_ENDERECO,
                                    PESSOAS_NUMERO,
                                    PESSOAS_CEP,
                                    PESSOAS_BAIRRO,
                                    CIDADES_NOME,
                                    CIDADES_ESTADO,
                                    USUARIOS_NOME,
                                    DOCUMENTOS_ID,
                                    DOCUMENTOS_NOME,
                                    DOCUMENTOS_LAYOUT,
                                    MOVIMENTOS_ID_PESSOAS,
                                    MOVIMENTOS_NUMERO,                
                                    MOVIMENTOS_SERIE,                
                                    MOVIMENTOS_NOME,
                                    MOVIMENTOS_CPFCNPJ,
                                    MOVIMENTOS_EMISSAO            
                                from ROMANEIOS 
                                left join EMPRESAS on EMPRESAS_ID = ROMANEIOS_ID_EMPRESAS
                                left join TRANSPORTES on TRANSPORTES_ID = ROMANEIOS_ID_TRANSPORTES
                                left join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOS_ID_MOVIMENTOS
                                left join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                left join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
                                left join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                       
                                ${sqlWhere} ${sqlOrder}`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
                        ROMANEIOS_ITENS: `select ROMANEIOSITENS.*, PRODUTOS_NOME, PRODUTOS_MARCA, PRODUTOS_APLICACAO,
                            MOVIMENTOSITENS_ID_PRODUTOS,
                            MOVIMENTOSITENS_QUANTIDADE,
                            MOVIMENTOSITENS_ENTREGUE,
                            MOVIMENTOSITENS_DEPOSITO,
                            MOVIMENTOSITENS_IMEDIATA,
                            (
                                select coalesce(sum(ROMANEIOSITENS_QUANTIDADE), 0) from ROMANEIOSITENS
                                where ROMANEIOSITENS_ID_ITEM = MOVIMENTOSITENS_ID and
                                      ROMANEIOSITENS_ID_ROMANEIOS <> results['ROMANEIOS_ID']
                            ) as MOVIMENTOSITENS_EMROMANEIO,
                            (
                                MOVIMENTOSITENS_QUANTIDADE -
                                MOVIMENTOSITENS_ENTREGUE -
                                MOVIMENTOSITENS_DEPOSITO -
                                MOVIMENTOSITENS_IMEDIATA - (
                                    select coalesce(sum(ROMANEIOSITENS_QUANTIDADE), 0) from ROMANEIOSITENS
                                    where ROMANEIOSITENS_ID_ITEM = MOVIMENTOSITENS_ID
                                )
                            ) as ITENS_ENTREGAR
                             from ROMANEIOSITENS
                            left outer join MOVIMENTOSITENS on MOVIMENTOSITENS_ID = ROMANEIOSITENS_ID_ITEM
                            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            where ROMANEIOSITENS_ID_ROMANEIOS = results['ROMANEIOS_ID']
                            order by ROMANEIOSITENS_ID`
                    }});
                }
            });
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'ROMANEIOS', 'GEN_ROMANEIOS_ID', 'ROMANEIOS_ID');
            const ultimoDocto = await samosFB.ultimoDocto(db, 'ROMANEIOS', data['ROMANEIOS_ID_EMPRESAS'], data['ROMANEIOS_ID_DOCUMENTOS']);
            let { numero, serie } = ultimoDocto;

            data['ROMANEIOS_ID']      = lastId;
            data['ROMANEIOS_NUMERO']  = numero;
            data['ROMANEIOS_SERIE']   = serie;
            data['ROMANEIOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            data['ROMANEIOS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');

            samosFB.removeForeignFields(data, 'ROMANEIOS');
            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into ROMANEIOS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        ROMANEIOS_ITENS: `insert into ROMANEIOSITENS  ['ROMANEIOSITENS_ID_ROMANEIOS']  values [values]`
                    }, registroPai: data});
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            samosFB.removeForeignFields(data, 'ROMANEIOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
            const sqlSearch = `update ROMANEIOS set ${values} where ROMANEIOS_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        ROMANEIOS_ITENS: `insert into ROMANEIOSITENS  ['ROMANEIOSITENS_ID_ROMANEIOS']  values [values]`,
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
            const sqlSearch = `delete from ROMANEIOS where ROMANEIOS_ID = ${id}`;
            const cleanChildsSql = `execute block as
                begin
                    delete from ROMANEIOSITENS  where ROMANEIOSITENS_ID_ROMANEIOS  = ${id};
                end;`;
            
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
