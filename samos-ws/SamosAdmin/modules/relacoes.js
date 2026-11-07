'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { conteudo, produto, pessoa, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where RELACOES_ID > 0  `;
                sqlWhere += produto ? `and RELACOES_ID_PRODUTOS = '${produto}' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and RELACOES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if (ordem == 2) {
                    sqlWhere += conteudo ? `and RELACOES_ID_PRODUTOS = ${conteudo} ` : '';
                    sqlOrder = ' order by RELACOES_ID_PRODUTOS '; 
                } else if (ordem == 3) {
                    sqlWhere += conteudo ? `and RELACOES_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by RELACOES_BARRAS '; 
                }
            }    

            const sqlCount  = `select count(*) from RELACOES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} RELACOES.*, PESSOAS_NOME, PRODUTOS_NOME
                from RELACOES
                left outer join PESSOAS  on RELACOES_ID_PESSOAS  = PESSOAS_ID
                left outer join PRODUTOS on RELACOES_ID_PRODUTOS = PRODUTOS_ID
                ${sqlWhere} ${sqlOrder}`;
                
            const total = await samosFB.count(sqlCount, params);
            const relacoes = await samosFB.executeSQL(sqlSearch, params);

            return { results: relacoes, total };            
            
        } catch(error) {
            const msg = 'Falha ao buscar relações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }        
    },

    readById: async (id, params) => {    // Um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');

            let sqlWhere = ` where `;
         
            sqlWhere += ids.reduce((result, id) => {
                return result += ` RELACOES_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by RELACOES_ID `;

            const sqlSearch = `select * from RELACOES ${sqlWhere} ${sqlOrder} `;
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async relacao => {
                const sqlProdutos = `select RELACOESITENS.*, PRODUTOS_NOME, SALDOS_DISPONIVEL, SALDOS_PRECO 
                                     from RELACOESITENS
                                     left outer join PRODUTOS on PRODUTOS_ID = RELACOESITENS_ID_ITENS
                                     left outer join SALDOS   on SALDOS_ID_PRODUTOS = PRODUTOS_ID and SALDOS_ID_EMPRESAS = ${params.empresaLogada}
                where RELACOESITENS_ID_MOVIMENTOS = ${relacao['RELACOES_ID']} 
                order by RELACOESITENS_ID`;

                relacao['RELACOES_ITENS'] = await samosFB.executeSQL(sqlProdutos, params);

            }));

            return { 
                results, 
                total: results.length 
            };
        } catch(error) {
            const msg = 'Falha ao buscar relacoes por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
        
    create: async (relacao, params) => {
        try {

            await samosFB.insert('RELACOES', relacao, params);

            (relacao['RELACOES_ITENS'] || []).forEach(item => {
                item['RELACOESITENS_ID_MOVIMENTOS'] = relacao['RELACOES_ID'];
            });

            try {
                if((relacao['RELACOES_ITENS'] || []).length > 0) {
                    await samosFB.insert('RELACOESITENS', relacao['RELACOES_ITENS'], params);
                }            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from RELACOES         where RELACOES_ID                  = ${relacao['RELACOES_ID']};
                        delete from RELACOESITENS    where RELACOESITENS_ID_MOVIMENTOS  = ${relacao['RELACOES_ID']};
                    end
                `, params);

                throw error;
            }

            await utils.dblog(params);    

            return { results: relacao };

        } catch(error) {
            const msg = error.message ? 'Falha ao criar relação' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, relacao, params) => {

        const itens = relacao['RELACOES_ITENS'];

        try {
            //atualiza o cabecalho
            await samosFB.update(id, 'RELACOES', relacao, params);

            if(itens) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from RELACOESITENS where RELACOESITENS_ID_MOVIMENTOS = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from RELACOESITENS where RELACOESITENS_ID_MOVIMENTOS = ${id}`, params);
            
                //atribui o id do cabecalho
                (itens || []).map(item => {
                    item['RELACOESITENS_ID_MOVIMENTOS'] = relacao['RELACOES_ID'];
                });
                
                try {
                    //grava os itens
                    if(itens.length > 0) await samosFB.insert('RELACOESITENS', relacao['RELACOES_ITENS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('RELACOESITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }

            return { results: relacao };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar relação' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {

            const sql = `execute block as
                            begin
                                delete from RELACOES          where RELACOES_ID                   = ${id};
                                delete from RELACOESITENS     where RELACOESITENS_ID_MOVIMENTOS   = ${id};
                            end;`;

            await samosFB.executeSQL(sql, params);
            await utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar relações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
   }
};