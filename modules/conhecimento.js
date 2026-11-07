'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, numero, pessoa, inicio, final, ordem, status, start, limit } = params;
            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa = empresa ? `and CONHECIMENTOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlWhere = `where CONHECIMENTOS_ID > 0 ${sqlEmpresa} `;

            if(numero > 0) {
                sqlWhere += ` and CONHECIMENTOS_NUMERO = '${numero}'`;
                sqlOrder = ` order by CONHECIMENTOS_NUMERO `;
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and CONHECIMENTOS_ID_PESSOAS = '${pessoa}' `; 
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and CONHECIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if(ordem == 0) {
                    sqlOrder = ` order by CONHECIMENTOS_EMISSAO, CONHECIMENTOS_ID_EMPRESAS, CONHECIMENTOS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by CONHECIMENTOS_ID_PESSOAS, CONHECIMENTOS_ID_EMPRESAS, CONHECIMENTOS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by CONHECIMENTOS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by PESSOAS_NOME, CONHECIMENTOS_ID_EMPRESAS, CONHECIMENTOS_ID `;
                }

                if(status == 0) {
                    sqlWhere += ` and CONHECIMENTOS_STATUS = 'N' `; 
                } else if(status == 1) {
                    sqlWhere += ` and CONHECIMENTOS_STATUS = 'F' `; 
                }
            }
                    
            const sqlCount  = `select count(CONHECIMENTOS_ID) from CONHECIMENTOS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    CONHECIMENTOS_ID, 
                    CONHECIMENTOS_NUMERO, 
                    CONHECIMENTOS_SERIE, 
                    CONHECIMENTOS_STATUS,
                    CONHECIMENTOS_EMISSAO, 
                    CONHECIMENTOS_ID_EMPRESAS, 
                    CONHECIMENTOS_ID_PESSOAS, 
                    PESSOAS_NOME,
                    PESSOAS_CPFCNPJ,
                    CONHECIMENTOS_SERVICOS
                from CONHECIMENTOS 
                left join PESSOAS on PESSOAS_ID = CONHECIMENTOS_ID_PESSOAS
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

            sqlWhere += ids.reduce((result, id) => {
                return result += ` CONHECIMENTOS_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by CONHECIMENTOS_ID `;
            const sqlSearch = `select CONHECIMENTOS.*, 
                    PESSOAS.PESSOAS_NOME                as PESSOAS_NOME, 
                    PESSOAS.PESSOAS_CPFCNPJ             as PESSOAS_CPFCNPJ,  
                    PESSOAS.PESSOAS_INSCRICAO           as PESSOAS_INSCRICAO,  
                    PESSOAS.PESSOAS_ENDERECO            as PESSOAS_ENDERECO,     
                    PESSOAS.PESSOAS_TELEFONE            as PESSOAS_TELEFONE,  
                    PESSOAS.PESSOAS_CEP                 as PESSOAS_CEP, 
                    DESTINATARIOS.PESSOAS_NOME          as DESTINATARIO_NOME, 
                    DESTINATARIOS.PESSOAS_TELEFONE      as DESTINATARIO_TELEFONE, 
                    DESTINATARIOS.PESSOAS_CPFCNPJ       as DESTINATARIO_CPFCNPJ, 
                    DESTINATARIOS.PESSOAS_INSCRICAO     as DESTINATARIO_INSCRICAO, 
                    DESTINATARIOS.PESSOAS_ENDERECO      as DESTINATARIO_ENDERECO, 
                    DESTINATARIOS.PESSOAS_CEP           as DESTINATARIO_CEP, 
                    EXPEDIDORES.PESSOAS_NOME            as EXPEDIDOR_NOME,    
                    EXPEDIDORES.PESSOAS_CPFCNPJ         as EXPEDIDOR_CPFCNPJ,    
                    EXPEDIDORES.PESSOAS_INSCRICAO       as EXPEDIDOR_INSCRICAO,    
                    EXPEDIDORES.PESSOAS_ENDERECO        as EXPEDIDOR_ENDERECO,  
                    EXPEDIDORES.PESSOAS_CEP             as EXPEDIDOR_CEP,      
                    EXPEDIDORES.PESSOAS_TELEFONE        as EXPEDIDOR_TELEFONE,
                    RECEBEDORES.PESSOAS_NOME            as RECEBEDOR_NOME, 
                    RECEBEDORES.PESSOAS_CPFCNPJ         as RECEBEDOR_CPFCNPJ, 
                    RECEBEDORES.PESSOAS_INSCRICAO       as RECEBEDOR_INSCRICAO, 
                    RECEBEDORES.PESSOAS_ENDERECO        as RECEBEDOR_ENDERECO, 
                    RECEBEDORES.PESSOAS_TELEFONE        as RECEBEDOR_TELEFONE,    
                    RECEBEDORES.PESSOAS_CEP             as RECEBEDOR_CEP,    
                    TOMADORES.PESSOAS_NOME              as TOMADOR_NOME,  
                    TOMADORES.PESSOAS_CPFCNPJ           as TOMADOR_CPFCNPJ,  
                    TOMADORES.PESSOAS_INSCRICAO         as TOMADOR_INSCRICAO,
                    TOMADORES.PESSOAS_ENDERECO          as TOMADOR_ENDERECO,
                    TOMADORES.PESSOAS_TELEFONE          as TOMADOR_TELEFONE,
                    TOMADORES.PESSOAS_CEPCOBRANCA       as TOMADOR_CEP,
                    CIDADESPESSOAS.CIDADES_NOME         as PESSOAS_CIDADE,    
                    CIDADESPESSOAS.CIDADES_ESTADO       as PESSOAS_UF,  
                    CIDADESDESTINATARIOS.CIDADES_NOME   as DESTINATARIO_CIDADE,
                    CIDADESDESTINATARIOS.CIDADES_ESTADO as DESTINATARIO_UF,
                    CIDADESEXPEDIDORES.CIDADES_NOME     as EXPEDIDOR_CIDADE,
                    CIDADESEXPEDIDORES.CIDADES_ESTADO   as EXPEDIDOR_UF,
                    CIDADESRECEBEDORES.CIDADES_NOME     as RECEBEDOR_CIDADE,
                    CIDADESRECEBEDORES.CIDADES_ESTADO   as RECEBEDOR_UF,
                    CIDADESTOMADORES.CIDADES_NOME       as TOMADOR_CIDADE,
                    CIDADESTOMADORES.CIDADES_ESTADO     as TOMADOR_UF,
                    CIDADESORIGEM.CIDADES_IBGE          as ORIGEM_IBGE,
                    CIDADESORIGEM.CIDADES_NOME          as ORIGEM_NOME,
                    CIDADESORIGEM.CIDADES_ESTADO        as ORIGEM_UF,
                    CIDADESDESTINO.CIDADES_IBGE         as DESTINO_IBGE,
                    CIDADESDESTINO.CIDADES_NOME         as DESTINO_NOME,
                    CIDADESDESTINO.CIDADES_ESTADO       as DESTINO_UF,
                    EMPRESAS_AMBIENTE,
                    EMPRESAS_INSCRICAO,
                    EMPRESAS_CPFCNPJ,
                    EMPRESAS_TELEFONE,
                    EMPRESAS_NOME,
                    OPERACOES_ID,
                    OPERACOES_NOME, 
                    PRAZOS_NOME
                from CONHECIMENTOS 

                left outer join PESSOAS                      on PESSOAS.PESSOAS_ID              = CONHECIMENTOS.CONHECIMENTOS_ID_PESSOAS
                left outer join CIDADES CIDADESPESSOAS       on CIDADESPESSOAS.CIDADES_ID       = PESSOAS.PESSOAS_ID_CIDADES
                left outer join PESSOAS DESTINATARIOS        on DESTINATARIOS.PESSOAS_ID        = CONHECIMENTOS.CONHECIMENTOS_ID_DESTINATARIO
                left outer join CIDADES CIDADESDESTINATARIOS on CIDADESDESTINATARIOS.CIDADES_ID = DESTINATARIOS.PESSOAS_ID_CIDADES
                left outer join PESSOAS EXPEDIDORES          on EXPEDIDORES.PESSOAS_ID          = CONHECIMENTOS.CONHECIMENTOS_ID_EXPEDIDOR
                left outer join CIDADES CIDADESEXPEDIDORES   on CIDADESEXPEDIDORES.CIDADES_ID   = EXPEDIDORES.PESSOAS_ID_CIDADES
                left outer join PESSOAS RECEBEDORES          on RECEBEDORES.PESSOAS_ID          = CONHECIMENTOS.CONHECIMENTOS_ID_RECEBEDOR
                left outer join CIDADES CIDADESRECEBEDORES   on CIDADESRECEBEDORES.CIDADES_ID   = RECEBEDORES.PESSOAS_ID_CIDADES
                left outer join PESSOAS TOMADORES            on TOMADORES.PESSOAS_ID            = CONHECIMENTOS.CONHECIMENTOS_ID_TOMADOR
                left outer join CIDADES CIDADESTOMADORES     on CIDADESTOMADORES.CIDADES_ID     = TOMADORES.PESSOAS_ID_CIDADES
                left outer join CIDADES CIDADESORIGEM        on CIDADESORIGEM.CIDADES_ID        = CONHECIMENTOS.CONHECIMENTOS_ID_ORIGEM
                left outer join CIDADES CIDADESDESTINO       on CIDADESDESTINO.CIDADES_ID       = CONHECIMENTOS.CONHECIMENTOS_ID_DESTINO
                left outer join EMPRESAS                     on EMPRESAS_ID                     = CONHECIMENTOS_ID_EMPRESAS
                left outer join OPERACOES                    on OPERACOES_ID                    = CONHECIMENTOS_ID_OPERACOES
                left outer join PRAZOS                       on PRAZOS_ID                       = CONHECIMENTOS_ID_PRAZOS
                

                ${sqlWhere} ${sqlOrder}`; 
                
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
                        CONHECIMENTOS_ITENS: `select CONHECIMENTOSITENS.*
                            from CONHECIMENTOSITENS
                            join CONHECIMENTOS on CONHECIMENTOS_ID = CONHECIMENTOSITENS_ID_CONHECTO
                            where CONHECIMENTOSITENS_ID_CONHECTO = results['CONHECIMENTOS_ID'] 
                            order by CONHECIMENTOSITENS_ID`
                    }});
                }
            });
        });
    },
    
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'CONHECIMENTOS', 'GEN_CONHECIMENTOS_ID', 'CONHECIMENTOS_ID');
            const ultimoDocto = await samosFB.ultimoDocto(db, 'CONHECIMENTOS', data['CONHECIMENTOS_ID_EMPRESAS'], data['CONHECIMENTOS_ID_DOCUMENTOS']);
            let { numero, serie } = ultimoDocto;
            
            data['CONHECIMENTOS_ID']      = lastId;
            data['CONHECIMENTOS_NUMERO']  = numero;
            data['CONHECIMENTOS_SERIE']   = serie;
            data['CONHECIMENTOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            data['CONHECIMENTOS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');

            samosFB.removeForeignFields(data, 'CONHECIMENTOS');

            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data))).join(',').replace(/'NaN'/g, '0');
            const sqlSearch = `insert into CONHECIMENTOS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        CONHECIMENTOS_ITENS: `insert into CONHECIMENTOSITENS ['CONHECIMENTOSITENS_ID_CONHECTO'] values [values]`
                    }, registroPai: data});
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db  = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);

            samosFB.removeForeignFields(data, 'CONHECIMENTOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'').replace(/'NaN'/g, '0');;
            const sqlSearch = `update CONHECIMENTOS set ${values} where CONHECIMENTOS_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        CONHECIMENTOS_ITENS: `insert into CONHECIMENTOSITENS ['CONHECIMENTOSITENS_ID_CONHECTO'] values [values]`,
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
            const sqlSearch = `delete from CONHECIMENTOS where CONHECIMENTOS_ID = ${id}`;
            const cleanChildsSql = `execute block as
                begin
                    delete from CONHECIMENTOSITENS where CONHECIMENTOSITENS_ID_CONHECTO = ${id};
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