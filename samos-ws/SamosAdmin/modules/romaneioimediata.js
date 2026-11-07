'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const moment  = require('moment-timezone');

module.exports = {
    create: (dataList, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const empresa = dataList.empresa;
            const movimento = dataList.movimento;
            const numerorom = dataList.numero;
            const serierom = dataList.serie;
            const dataemissao = moment.tz(params.timezone).format('YYYY-MM-DD');
            const horaemissao = moment.tz(params.timezone).format('HH:mm:ss');
            const usuario = dataList.usuario;
            const logromaneio = dataList.log;
            const obsromaneio = dataList.observacoes;
            const pessoaRomaneio = dataList.pessoa;
            const itensRomaneio = dataList.itens;
            const iddocumento = await obterIdDocumento(empresa, "Romaneio Entrega", db);

            const sqlLimpaImediatas = `execute block as
                begin
                    delete from ROMANEIOS where ROMANEIOS_ID_EMPRESAS = ${empresa} and ROMANEIOS_NUMERO = ${numerorom}
                                            and ROMANEIOS_SERIE = '${serierom}';
                    delete from ROMANEIOSITENS where ROMANEIOSITENS_ID_MOVIMENTOS = '${movimento}' and ROMANEIOSITENS_STATUS = 'I';
                end;`;

            db.query(sqlLimpaImediatas, async (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao limpar romaneio de imediata`, db, error, reject, sqlLimpaImediatas);
                } else {
                    const lastId = await samosFB.lastId(db, 'ROMANEIOS', 'GEN_ROMANEIOS_ID', 'ROMANEIOS_ID');
                    const sqlRomaneiosMestre = `insert into ROMANEIOS (ROMANEIOS_ID, ROMANEIOS_ID_EMPRESAS, ROMANEIOS_ID_MOVIMENTOS,
                                                                ROMANEIOS_ID_TRANSPORTES, ROMANEIOS_ID_OPERACOES, ROMANEIOS_ID_USUARIOS,
                                                                ROMANEIOS_ID_DOCUMENTOS, ROMANEIOS_NUMERO,
                                                                ROMANEIOS_SERIE, ROMANEIOS_EMISSAO, ROMANEIOS_HORA, ROMANEIOS_ID_PESSOAS,
                                                                ROMANEIOS_LOG, ROMANEIOS_STATUS, ROMANEIOS_CONTADOR,
                                                                ROMANEIOS_FRETE, ROMANEIOS_SEGURO, ROMANEIOS_DESPESAS,
                                                                ROMANEIOS_TOTAL, ROMANEIOS_OBSERVACOES) values 
                                                                (${lastId}, ${empresa}, ${movimento},
                                                                1, 910000, ${usuario}, ${iddocumento}, ${numerorom},
                                                                '${serierom}', '${dataemissao}', '${horaemissao}', ${pessoaRomaneio},
                                                                '${logromaneio}', 'I', 0, 0, 0, 0, 0, '${obsromaneio}')`;

                    let sqlRomaneiosItens = `execute block as begin `;
                    let totalImediata = 0;

                    for(let i in itensRomaneio){
                        let idMovimento = itensRomaneio[i]['MOVIMENTOSITENS_ID_MOVIMENTOS'];
                        let idItem      = itensRomaneio[i]['MOVIMENTOSITENS_ID'];
                        let imediata    = itensRomaneio[i]['MOVIMENTOSITENS_IMEDIATA'];

                        if(imediata > 0) { // Entrega Imediata
                            totalImediata++;
                            sqlRomaneiosItens += `update or insert into ROMANEIOSITENS (ROMANEIOSITENS_ID,
                                                    ROMANEIOSITENS_ID_ROMANEIOS,
                                                    ROMANEIOSITENS_ID_MOVIMENTOS,
                                                    ROMANEIOSITENS_ID_ITEM,
                                                    ROMANEIOSITENS_QUANTIDADE,
                                                    ROMANEIOSITENS_STATUS) values 
                                                    (gen_id(GEN_ROMANEIOSITENS_ID, 1),
                                                    ${lastId},                    
                                                    ${idMovimento},
                                                    ${idItem},
                                                    ${imediata}, 
                                                    'I') matching (ROMANEIOSITENS_ID_ITEM, ROMANEIOSITENS_STATUS); `;
                        }
                    }

                    sqlRomaneiosItens += `end`;

                    if(totalImediata > 0) {
                        db.query(sqlRomaneiosMestre, (error, results) => {
                            if (error) {
                                samosFB.enviarRespostaErro(`Falha ao gerar Romaneio de imediatas`, db, error, reject, sqlRomaneiosMestre);
                            } else {
                                db.query(sqlRomaneiosItens, (error, results) => {
                                    if (error) {
                                        samosFB.enviarRespostaErro(`Falha ao gerar Romaneio de imediatas`, db, error, reject, sqlRomaneiosMestre);
                                    } else {
                                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                                    }
                                });
                            }
                        });
                    } else {
                        samosFB.enviarRespostaSucesso(db, [], 0, resolve);
                    }
                }
            });
        });
    }
};

const obterIdDocumento = function(empresa, nomedocumento, db) {
    return new Promise(async (resolve, reject) => {
        let sql = `select DOCUMENTOS_ID from DOCUMENTOS where
                          DOCUMENTOS_ID_EMPRESAS = ${empresa} and
                          DOCUMENTOS_NOME like '${nomedocumento}%' `;

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0]['DOCUMENTOS_ID'] || 0);
            }
        });
    });
};
