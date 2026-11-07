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
                tecnico, 
                geousuario, 
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
                
                if(tecnico > 0) {
                    sqlWhere += ` and (
                        (
                            ORDENS_ID_USUARIOS = '${tecnico}' and 
                            (ORDENS_ID_TECNICO = '0' or ORDENS_ID_TECNICO is null)
                        ) or (
                            ORDENS_ID_TECNICO  = '${tecnico}'
                        )
                    ) `; 
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

                if(status == 'A') {
                    sqlWhere += ` and ORDENS_STATUS      = '2' 
                                  and ORDENS_AGENDAMENTO = 'F' 
                                  and ORDENS_ID_USUARIOS = '1' `; 
                } else if(status != '10') {
                    sqlWhere += ` and ORDENS_STATUS = '${status}' `; 
                }
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    ORDENS_ID,
                    ORDENS_ID_EMPRESAS,
                    ORDENS_ID_USUARIOS,
                    ORDENS_ID_ORDENSROTAS,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    USUARIOS_LOGIN,
                    USUARIOS_NOME,
                    ORDENS_NOME,
                    ORDENS_CELULAR,
                    ORDENS_CONTATOS,
                    ORDENS_ENDERECO,
                    ORDENS_NUMEROLC,
                    ORDENS_BAIRRO,
                    ORDENS_REFERENCIA,
                    ORDENS_COMPLEMENTO,
                    ORDENS_PLANO,
                    ORDENS_PERIODO,
                    ORDENS_GEOLOCALIZACAO,
                    CIDADES_NOME,
                    CIDADES_ESTADO
                from ORDENS 
                    left join USUARIOS on USUARIOS_ID = ORDENS_ID_USUARIOS
                    left join CIDADES  on CIDADES_ID  = ORDENS_ID_CIDADES
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
                select
                    ORDENS.*,
                    ORDENSROTAS_NOME,
                    substring(ORDENS_HORAEMISSAO  from 1 for 5) as ORDENS_HORAEMISSAO,
                    USUARIOS.USUARIOS_NOME,
                    TECNICOS.USUARIOS_NOME as TECNICO_NOME,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    DOCUMENTOS_LAYOUT
                from ORDENS 
                    left join USUARIOS          on USUARIOS_ID          = ORDENS_ID_USUARIOS
                    left join USUARIOS TECNICOS on TECNICOS.USUARIOS_ID = ORDENS_ID_TECNICO
                    left join ORDENSROTAS       on ORDENSROTAS_ID       = ORDENS_ID_ORDENSROTAS
                    left join CIDADES           on CIDADES_ID           = ORDENS_ID_CIDADES
                    left join DOCUMENTOS        on DOCUMENTOS_ID        = ORDENS_ID_DOCUMENTOS
                ${sqlWhere} ${sqlOrder} `; 

                db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
                        ORDENS_ATIVOS: `select * from ORDENSATIVOS
                            where ORDENSATIVOS_ID_ORDENS = results['ORDENS_ID'] 
                            order by ORDENSATIVOS_ID`,
                        ORDENS_AVARIADOS: `select 
                                ORDENSAVARIADOS.*,
                                iif(ORDENSAVARIADOS_AGENDADA <= '1900-01-01', null, ORDENSAVARIADOS_AGENDADA) as ORDENSAVARIADOS_AGENDADA,
                                iif(ORDENSAVARIADOS_CRIACAO  <= '1900-01-01', null, ORDENSAVARIADOS_CRIACAO)  as ORDENSAVARIADOS_CRIACAO,
                                iif(ORDENSAVARIADOS_EXECUCAO <= '1900-01-01', null, ORDENSAVARIADOS_EXECUCAO) as ORDENSAVARIADOS_EXECUCAO,
                                iif(ORDENSAVARIADOS_LIMITE   <= '1900-01-01', null, ORDENSAVARIADOS_LIMITE)   as ORDENSAVARIADOS_LIMITE,
                                iif(ORDENSAVARIADOS_LOCACAO  <= '1900-01-01', null, ORDENSAVARIADOS_LOCACAO)  as ORDENSAVARIADOS_LOCACAO,
                                substring(ORDENSAVARIADOS_HORAAGENDADA from 1 for 5) as ORDENSAVARIADOS_HORAAGENDADA,
                                substring(ORDENSAVARIADOS_HORACRIACAO  from 1 for 5) as ORDENSAVARIADOS_HORACRIACAO,
                                substring(ORDENSAVARIADOS_HORAEXECUCAO from 1 for 5) as ORDENSAVARIADOS_HORAEXECUCAO,
                                substring(ORDENSAVARIADOS_HORALIMITE   from 1 for 5) as ORDENSAVARIADOS_HORALIMITE,
                                substring(ORDENSAVARIADOS_HORALOCACAO  from 1 for 5) as ORDENSAVARIADOS_HORALOCACAO
                            from ORDENSAVARIADOS
                            where ORDENSAVARIADOS_ID_ORDENS = results['ORDENS_ID'] 
                            order by ORDENSAVARIADOS_ID_ORDENS, ORDENSAVARIADOS_REFERENCIA `,
                        ORDENS_PRODUTOSITENS: `select 
                                ORDENSPRODUTOS.*, PRODUTOS_NOME, SALDOS_PRECO
                            from ORDENSPRODUTOS
                                join PRODUTOS on PRODUTOS_ID = ORDENSPRODUTOS_ID_PRODUTOS
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
            data['ORDENS_HORAEMISSAO'] = moment.tz(params.timezone).format('HH:mm:ss');
            data['ORDENS_LOG']         = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
            
            samosFB.removeForeignFields(data, 'ORDENS');

            const fields    = Object.keys(data).join(',');
            const values    = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data))).join(',').replace(/'NaN'/g, '0');
            const sqlSearch = `insert into ORDENS (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        ORDENS_ATIVOS:        `insert into ORDENSATIVOS    ['ORDENSATIVOS_ID_ORDENS']    values [values]`,
                        ORDENS_AVARIADOS:     `insert into ORDENSAVARIADOS ['ORDENSAVARIADOS_ID_ORDENS'] values [values]`,
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
            
            data['ORDENS_LOG'] = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');

            samosFB.removeForeignFields(data, 'ORDENS');

            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'').replace(/'NaN'/g, '0');;
            const sqlSearch = `update ORDENS set ${values} where ORDENS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: id, resolve, reject, sqlFilhos: {
                        ORDENS_ATIVOS:        `insert into ORDENSATIVOS    ['ORDENSATIVOS_ID_ORDENS']    values [values]`,
                        ORDENS_AVARIADOS:     `insert into ORDENSAVARIADOS ['ORDENSAVARIADOS_ID_ORDENS'] values [values]`,
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
                    delete from ORDENSATIVOS    where ORDENSATIVOS_ID_ORDENS    = ${id};
                    delete from ORDENSAVARIADOS where ORDENSAVARIADOS_ID_ORDENS = ${id};
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

const convertLatitudeLongitudeEmMetros = function(position1, position2) {
    const deg2rad = deg => deg * (Math.PI / 180);
    const R = 6371;
    const dLat = deg2rad(position2.lat - position1.lat);
    const dLng = deg2rad(position2.lng - position1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(deg2rad(position1.lat))
            * Math.cos(deg2rad(position1.lat))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return ((R * c * 1000).toFixed());
}