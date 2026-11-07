'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { 
                empresa, 
                numero, 
                pessoa, 
                montador, 
                inicio, 
                final, 
                ordem, 
                status, 
                start, 
                limit
            } = params;

            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';

            let sqlEmpresa = empresa ? `and ORDENS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} `;
                
            if((numero || '').match(/,/) && numero.split(',').length > 0) {
                const numeros = numero.split(',');

                sqlWhere += ' and (';
                sqlWhere += numeros.reduce((str, num) => {
                    return `${str} ORDENS_NUMERO = ${num} or `;
                }, '').slice(0, -3);
                sqlWhere += ') ';

                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else if(numero > 0) {
                sqlWhere += ` and ORDENS_NUMERO = ${numero}`;
                sqlOrder = ` order by ORDENS_NUMERO `;    
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and ORDENS_ID_PESSOAS = '${pessoa}' `; 
                }
                
                if(montador > 0) {
                    sqlWhere += ` and ORDENS_ID_USUARIOS  = '${montador}' `;
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else {
                    sqlOrder = ` order by ORDENS_EMISSAO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                }

                if (status != 'T') {
                    sqlWhere += ` and ORDENS_STATUS = '${status}' `;
                }
                
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID,
                    ORDENS_ID_EMPRESAS,
                    EMPRESAS_CNAE,
                    ORDENS_ID_USUARIOS,
                    PESSOASMONTADOR.PESSOAS_NOME as MONTADORES_NOME,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    ORDENS_NOME,
                    ORDENS_REFERENCIA,
                    ORDENS_TOTAL,
                    CIDADES_NOME,
                    CIDADES_ESTADO
                from ORDENS 
                    left join EMPRESAS on EMPRESAS_ID = ORDENS_ID_EMPRESAS
                    left join PESSOAS as PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                    left join PESSOAS as PESSOASMONTADOR on PESSOASMONTADOR.PESSOAS_ID = ORDENS_ID_USUARIOS
                ${sqlWhere} ${sqlOrder} `; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    let resultadosOrdenadosPorDistancia;

                    if(ordem == 3) {
                        const geoUsuario = (geousuario || '').split(',');

                        const resultadosComDistancia = results.map(ordem => {
                            const geoOrdem   = (ordem['ORDENS_GEOLOCALIZACAO'] || '').split(',');
    
                            ordem['DISTANCIA'] = convertLatitudeLongitudeEmMetros(
                                {lat: geoOrdem[1],   lng: geoOrdem[0]  },
                                {lat: geoUsuario[0], lng: geoUsuario[1]}
                            );
    
                            return ordem;
                        });
    
                        resultadosOrdenadosPorDistancia = resultadosComDistancia.sort((osA, osB) => {
                            return osA['DISTANCIA'] - osB['DISTANCIA'];
                        });
                    } else {
                        resultadosOrdenadosPorDistancia = results;
                    }

                    samosFB.processarLeitura({ db, results: resultadosOrdenadosPorDistancia, total, resolve, reject });
                }
            });
        });
    },

    readById: (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const ids = id.toString().split(',');
            let sqlWhere = ` where `;
         
            sqlWhere += ids.reduce((result, id) => {
                return result += ` ORDENS_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by ORDENS_ID `;

            const sqlSearch = `
                select ORDENS.*,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_MUNICIPAL,
                    EMPRESAS_CPFCNPJ, 
                    EMPRESAS_INSCRICAO,
                    EMPRESAS_TELEFONE,
                    EMPRESAS_CELULAR,
                    EMPRESAS_NOME,
                    EMPRESAS_ENDERECO, 
                    EMPRESAS_NUMERO,
                    EMPRESAS_BAIRRO,
                    EMPRESAS_CEP,
                    CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                    CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                    EMPRESAS_CNAE,
                    PESSOAS.PESSOAS_FANTASIA,
                    PESSOAS.PESSOAS_NOME,
                    PESSOAS.PESSOAS_TIPO,
                    PESSOAS.PESSOAS_ENDERECO,
                    PESSOAS.PESSOAS_NUMERO,
                    PESSOAS.PESSOAS_BAIRRO,
                    PESSOAS.PESSOAS_CEP,                    
                    PESSOAS.PESSOAS_CPFCNPJ,
                    PESSOAS.PESSOAS_INSCRICAO,
                    PESSOAS.PESSOAS_TELEFONE,
                    PESSOAS.PESSOAS_EMAIL,
                    PESSOAS.PESSOAS_CELULAR,
                    PESSOAS.PESSOAS_PAGINA,
                    PESSOASMONTADOR.PESSOAS_NOME as MONTADORES_NOME,
                    PESSOASMONTADOR.PESSOAS_TIPO as MONTADORES_TIPO,
                    PESSOASMONTADOR.PESSOAS_CPFCNPJ as MONTADORES_CPFCNPJ,
                    PESSOASMONTADOR.PESSOAS_INSCRICAO as MONTADORES_INSCRICAO,                    
                    PESSOASMONTADOR.PESSOAS_ENDERECO as MONTADORES_ENDERECO,
                    PESSOASMONTADOR.PESSOAS_NUMERO as MONTADORES_NUMERO,
                    PESSOASMONTADOR.PESSOAS_BAIRRO as MONTADORES_BAIRRO,
                    PESSOASMONTADOR.PESSOAS_CEP as MONTADORES_CEP,
                    CIDADESMONTADOR.CIDADES_NOME as CIDADES_NOMEMONTADOR,
                    CIDADESMONTADOR.CIDADES_ESTADO as CIDADES_ESTADOMONTADOR,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    DOCUMENTOS_LAYOUT,
                    DOCUMENTOS_ID_APLICACOES,
                    APLICACOES_NOME
                from ORDENS 
                    left join PESSOAS    on PESSOAS_ID = ORDENS_ID_PESSOAS
                    left join PESSOAS    as PESSOASMONTADOR on PESSOASMONTADOR.PESSOAS_ID = ORDENS_ID_USUARIOS
                    left join EMPRESAS   on EMPRESAS_ID = ORDENS_ID_EMPRESAS
                    left join CIDADES    on CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
                    left join CIDADES    as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES
                    left join CIDADES    as CIDADESMONTADOR on CIDADESMONTADOR.CIDADES_ID = PESSOASMONTADOR.PESSOAS_ID_CIDADES
                    left join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
                    left join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
                ${sqlWhere} ${sqlOrder} `; 

                db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
                        ORDENS_PRODUTOSITENS: `select 
                                ORDENSPRODUTOS.*, PRODUTOS_NOME, PRODUTOS_MARCA, SALDOS_PRECO
                            from ORDENSPRODUTOS
                                join PRODUTOS on PRODUTOS_ID = ORDENSPRODUTOS_ID_PRODUTOS
                                join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                                join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = results['ORDENS_ID_EMPRESAS']
                            where ORDENSPRODUTOS_ID_ORDENS = results['ORDENS_ID'] 
                            order by ORDENSPRODUTOS_ID`,
                        ORDENS_SERVICOSITENS: `select 
                                ORDENSSERVICOS.*, SERVICOS_NOME, SERVICOS_PRECO
                            from ORDENSSERVICOS
                                join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                            where ORDENSSERVICOS_ID_ORDENS = results['ORDENS_ID'] 
                            order by ORDENSSERVICOS_ID`
                    }});
                }
            });
        });
    },
    
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'ORDENS', 'GEN_ORDENS_ID', 'ORDENS_ID');
            const ultimoDocto = await samosFB.ultimoDocto(db, 'ORDENS', data['ORDENS_ID_EMPRESAS'], data['ORDENS_ID_DOCUMENTOS']);  

            let { numero, serie } = ultimoDocto;

            data['ORDENS_ID']          = lastId;
            data['ORDENS_NUMERO']      = numero;
            data['ORDENS_SERIE']       = serie;
            data['ORDENS_EMISSAO']     = moment.tz(params.timezone).format('YYYY-MM-DD');
            data['ORDENS_LOG']         = data['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
            
            samosFB.removeForeignFields(data, 'ORDENS');

            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data))).join(',').replace(/'NaN'/g, '0');
            const sqlSearch = `insert into ORDENS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        ORDENS_PRODUTOSITENS: `insert into ORDENSPRODUTOS  ['ORDENSPRODUTOS_ID_ORDENS']  values [values]`,
                        ORDENS_SERVICOSITENS: `insert into ORDENSSERVICOS  ['ORDENSSERVICOS_ID_ORDENS']  values [values]`
                    }, registroPai: data});
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            
            data['ORDENS_LOG'] = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')

            samosFB.removeForeignFields(data, 'ORDENS');

            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'').replace(/'NaN'/g, '0');;
            const sqlSearch = `update ORDENS set ${values} where ORDENS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        ORDENS_PRODUTOSITENS: `insert into ORDENSPRODUTOS  ['ORDENSPRODUTOS_ID_ORDENS']  values [values]`,
                        ORDENS_SERVICOSITENS: `insert into ORDENSSERVICOS  ['ORDENSSERVICOS_ID_ORDENS']  values [values]`
                    }, registroPai: data}, async function(db, results) {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from ORDENS where ORDENS_ID = ${id}`;
            const cleanChildsSql = `execute block as
                begin
                    delete from ORDENSPRODUTOS  where ORDENSPRODUTOS_ID_ORDENS  = ${id};
                    delete from ORDENSSERVICOS  where ORDENSSERVICOS_ID_ORDENS  = ${id};
                end;`;
            
            try{
                console.log(
                    'EXCLUSAO ORDEM: ' + 
                    params.log + ' ' + 
                    'Usuario: ' + params.userId + ' - ' + 
                    moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                );
            } catch(e){
                console.log(e)
                console.log('EXCLUSAO ORDEM: ' + id)
            }
            
            db.query(cleanChildsSql, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir itens`, db, error, reject, cleanChildsSql);
                } else {
                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarExclusao({db, resolve, reject}, async function(db, results) {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    });
                }
            });
        });
    }
};