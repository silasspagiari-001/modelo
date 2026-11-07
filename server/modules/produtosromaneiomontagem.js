'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const id = params.id;
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `
                        select
                            MOVIMENTOSITENS_ID,
                            MOVIMENTOSITENS_ID_MOVIMENTOS,
                            MOVIMENTOSITENS_ID_PRODUTOS,
                            PRODUTOS_NOME, 
                            PRODUTOS_MARCA,
                            MOVIMENTOSITENS_QUANTIDADE,
                            MOVIMENTOSITENS_HORAMONTAGEM,
                            right(EMPRESAS_FANTASIA, 2) as EMPRESAS_SIGLA                            
                        from MOVIMENTOSITENS
                            left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOSITENS_ID_EMPRESAS
                        where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id} and MOVIMENTOSITENS_CSTPIS <> 'ML'
                        order by
                            MOVIMENTOSITENS_ID`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    },

    lote: {
        update: (dataList, params) => {
            return new Promise(async (resolve, reject) => {
                const db = await samosFB.conectarBanco(params.client);
        
                const sqlList = dataList.map((data, parentIndex) => {
                    const id = data['MOVIMENTOSITENS_ID'];
                    samosFB.removeForeignFields(data, 'MOVIMENTOSITENS');                    
                    const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
    
                    return `update MOVIMENTOSITENS set ${values} where MOVIMENTOSITENS_ID = ${id};`;
                })
                .reduce((result, sql) => {
                    return `${result} ${sql} `;
                }, '');

                const executeBlock = `execute block as begin ${sqlList} end;`;

                // muda o status de todos pra montagem normal
                const idMovimento = dataList[0]['MOVIMENTOSITENS_ID_MOVIMENTOS'];

                const sqlMovimento = `update MOVIMENTOSITENS set MOVIMENTOSITENS_CSTPIS = '0'
                                   where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idMovimento}`
                
                db.query(sqlMovimento, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Não consegui atualizar produtos`, db, error, reject, sqlMovimento);
                    } else {
                        db.query(executeBlock, (error, results) => {
                            if (error) {
                                samosFB.enviarRespostaErro(`Falha ao alterar lote`, db, error, reject, executeBlock);
                            } else {
                                samosFB.processarGravacao({db, results: dataList, resolve, reject}, function() {
                                    api['processos/gerarlog']().create(params);
                                });
                            }
                        });
                    }
                });
            });
        }    
    }

};