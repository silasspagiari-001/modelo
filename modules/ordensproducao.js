'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { empresa, numero, produto, lote, pessoa, inicio, final, ordem, status, start, limit} = params; 
            
            let sqlWhere = ` where PRODUCOES_ID > 0 `;
            let sqlOrder = '';

            if(empresa) {
                sqlWhere += ` and PRODUCOES_ID_EMPRESAS = ${empresa} `;
            }

            if(numero > 0) {
                sqlWhere += ` and PRODUCOES_NUMERO = ${numero} `;
                sqlOrder += ` order by PRODUCOES_NUMERO, PRODUCOES_ID_EMPRESAS `;

            } else {
                if(produto) {
                    sqlWhere += ` and PRODUCOES_ID_PRODUTOS = ${produto} `;
                }
    
                if(lote) {
                    sqlWhere += ` and PRODUCOES_ID_LOTES = '${lote}' `;
                }
    
                if(pessoa) {
                    sqlWhere += ` and PRODUCOES_ID_PESSOAS = '${pessoa}' `;
                }
    
                if(status == 0) {
                    sqlWhere += ` and PRODUCOES_STATUS = 'A' `;  
                } else if (status == 1) {
                    sqlWhere += ` and PRODUCOES_STATUS = 'F' `;
                } else if (status == 2) {
                    sqlWhere += ` and PRODUCOES_STATUS = 'C' `;
                }
    
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if(ordem == 1){
                        sqlWhere += ` and PRODUCOES_INICIO     between '${inicio}' and '${final}' `;
                    } else if(ordem == 2){
                        sqlWhere += ` and PRODUCOES_FINALIZADA between '${inicio}' and '${final}' `;
                    } else {
                        sqlWhere += ` and PRODUCOES_INCLUSAO   between '${inicio}' and '${final}' `;
                    }
                }
            
                if(ordem == 0) {
                    sqlOrder = ' order by PRODUCOES_INCLUSAO ';
                } else if(ordem == 1) {
                    sqlOrder = ' order by PRODUCOES_INICIO ';
                } else if(ordem == 2) {
                    sqlOrder = ' order by PRODUCOES_FINALIZADA ';
                } else if(ordem == 3) {
                    sqlOrder = ' order by PRODUCOES_ID_PRODUTOS ';
                } else if(ordem == 4) {
                    sqlOrder = ' order by PRODUCOES_ID_LOTES ';
                } else if(ordem == 5) {
                    sqlOrder = ' order by PRODUCOES_ID_PESSOAS ';
                } else if(ordem == 6) {
                    sqlOrder = ' order by PRODUCOES_NUMERO ';
                }
            }

            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                PRODUCOES.*,
                PRODUTOS_NOME,
                PRODUTOS_UNIDADE,
                LOTES_NOME,
                PESSOAS_NOME
            from PRODUCOES
            left outer join PESSOAS  on PESSOAS_ID        = PRODUCOES_ID_PESSOAS
            left outer join PRODUTOS on PRODUTOS_ID       = PRODUCOES_ID_PRODUTOS
            left outer join LOTES    on LOTES_ID          = PRODUCOES_ID_LOTES
            ${sqlWhere} ${sqlOrder}`;

            const sqlCount = `select count(*) from PRODUCOES  ${sqlWhere} `;

            return { 
                results: await samosFB.executeSQL(sql, params), 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar ordens de produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select 
                PRODUCOES.*,
                PRODUTOS_NOME,
                PRODUTOS_UNIDADE,
                PRODUTOS_EMBALAGEM,
                PRODUTOS_DESCRICAO,
                LOTES_ID,
                LOTES_REFERENCIA,
                PESSOAS_NOME,
                PESSOAS_ENDERECO,
                CIDADES_NOME,
                CIDADES_ESTADO,
                USUARIOS_LOGIN
            from PRODUCOES
            left outer join PESSOAS  on PESSOAS_ID  = PRODUCOES_ID_PESSOAS
            left outer join CIDADES  on CIDADES_ID  = PESSOAS_ID_CIDADES
            left outer join USUARIOS on USUARIOS_ID = PRODUCOES_ID_USUARIOS
            left outer join PRODUTOS on PRODUTOS_ID = PRODUCOES_ID_PRODUTOS
            left outer join LOTES    on LOTES_ID    = PRODUCOES_ID_LOTES
            where PRODUCOES_ID = '${id}'
            order by PRODUCOES_ID`;

            const producao = (await samosFB.executeSQL(sql, params))[0];

            producao['VALOR_TOTAL'] = 0;
            
            const sqlItens = `select 
                PRODUCOESITENS_ID,
                PRODUCOESITENS_ID_PRODUCOES,
                PRODUCOESITENS_ID_PRODUTOS,
                PRODUCOESITENS_QUANTIDADE,
                PRODUCOESITENS_CUSTO,
                PRODUTOS_NOME,
                PRODUTOS_UNIDADE,
                PRODUCOESITENS_QUANTIDADE * PRODUCOESITENS_CUSTO as VALOR_TOTAL
            from PRODUCOESITENS
            left outer join PRODUTOS on PRODUTOS_ID = PRODUCOESITENS_ID_PRODUTOS
            left outer join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = ${producao['PRODUCOES_ID_EMPRESAS']}
            where PRODUCOESITENS_ID_PRODUCOES = ${producao['PRODUCOES_ID']} 
            order by PRODUCOESITENS_ID `;

            const itens = await samosFB.executeSQL(sqlItens, params);
            const queryFormula = await api['ordensproducaoformulas']().readById(producao['PRODUCOES_ID_PRODUTOS'], params);
            const qtdeCabecalho = utils.number.grams(producao['PRODUCOES_QUANTIDADE']);
            const embalagemCabecalho = utils.number.grams(producao['PRODUTOS_EMBALAGEM']);
            const multiploCabecalho = utils.number.grams((producao['PRODUTOS_DESCRICAO'] || '').split('|')[2] || 1)
            
            producao['MULTIPLOS_PRODUTOS'] = multiploCabecalho;
            
            await Promise.all(itens.map(async itemProducao => {
                try {
                    const formula = queryFormula.results[0]['PRODUCOESFORMULAS_ITENS'].find(itemFormula => {
                        return itemFormula['FORMULASITENS_ID_PRODUTOS'] == itemProducao['PRODUCOESITENS_ID_PRODUTOS'];
                    });

                    const percentual = formula['FORMULASITENS_PERCENTUAL'] == 'T';
                    const multiploItem = utils.number.grams((formula['PRODUTOS_DESCRICAO'] || '').split('|')[2] || 1)
                    const qtdeOriginal = utils.number.grams(formula['FORMULASITENS_QUANTIDADE']);
                    const qtde = percentual ? 
                                Math.round(qtdeOriginal * qtdeCabecalho / 100 / 1000) / 1000 : 
                                qtdeOriginal / embalagemCabecalho / (multiploCabecalho / multiploItem);

                    itemProducao['FORMULASITENS_QUANTIDADE'] = qtde;
                    itemProducao['FORMULASITENS_PERCENTUAL'] = percentual;
                    itemProducao['FORMULASITENS_CUSTO']      = formula['FORMULASITENS_CUSTO'];

                    if(itemProducao['FORMULASITENS_PERCENTUAL'] == 'T') {
                        itemProducao['PRODUCOESITENS_CUSTO'] = 0;
                        itemProducao['VALOR_TOTAL']          = 0;
                    }
                } catch(e) {
                    itemProducao['FORMULASITENS_QUANTIDADE'] = 0;
                    itemProducao['FORMULASITENS_PERCENTUAL'] = 'F';
                    itemProducao['FORMULASITENS_CUSTO']      = 0;
                }

                producao['VALOR_TOTAL'] += itemProducao['VALOR_TOTAL'];
            }));

            producao['PRODUCOES_ITENS'] = itens;

            return { results: [ producao ] };
        } catch(error) {
            const msg = 'Falha ao buscar ordens de produção por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (ordemproducao, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('PRODUCOES', ordemproducao, params);

            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            
            ordemproducao['PRODUCOES_NUMERO']   = numero;
            ordemproducao['PRODUCOES_SERIE']    = serie;
            ordemproducao['PRODUCOES_INCLUSAO'] = hoje;

            await samosFB.insert('PRODUCOES', ordemproducao, params);

            (ordemproducao['PRODUCOES_ITENS'] || []).forEach(item => {
                item['PRODUCOESITENS_ID_PRODUCOES'] = ordemproducao['PRODUCOES_ID'];
            });
            
            try {
                await samosFB.insert('PRODUCOESITENS', ordemproducao['PRODUCOES_ITENS'], params);
            } catch(error) {
                //se der erro ao inserir itens tenta apagar o cabecalho
                await samosFB.executeSQL(`delete from PRODUCOES where PRODUCOES_ID = ${ordemproducao['PRODUCOES_ID']} `, params);
                throw error;
            }

            return { results: ordemproducao };
        } catch(error) {
            const msg = 'Falha ao criar ordem de produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, ordemproducao, params) => {
        const itens = ordemproducao['PRODUCOES_ITENS'] || [];

        try {
            //atualiza o cabecalho
            await samosFB.update(id, 'PRODUCOES', ordemproducao, params);

            //se vierem itens...
            if(itens.length > 0) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from PRODUCOESITENS where PRODUCOESITENS_ID_PRODUCOES = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from PRODUCOESITENS where PRODUCOESITENS_ID_PRODUCOES = ${id}`, params);
            
                //atribui o id do cabecalho
                itens.map(item => item['PRODUCOESITENS_ID_PRODUCOES'] = ordemproducao['PRODUCOES_ID']);
                
                try {
                    //grava os itens
                    await samosFB.insert('PRODUCOESITENS', ordemproducao['PRODUCOES_ITENS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('PRODUCOESITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }

            await utils.dblog(params);    

            return { results: ordemproducao };
        } catch(error) {
            const msg = 'Falha ao alterar a ordem de producao';
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {

            const ordemProducao = await samosFB.executeSQL(`select PRODUCOES_ID_EMPRESAORIGEM,
                                                                   PRODUCOES_NUMEROORIGEM,
                                                                   PRODUCOES_SERIEORIGEM,
                                                                   PRODUCOES_ID_PESSOAS 
                                                            from PRODUCOES where PRODUCOES_ID = ${id}`, params);

            if(ordemProducao[0]['PRODUCOES_NUMEROORIGEM'] > 0) {
                const empRequisicao = ordemProducao[0]['PRODUCOES_ID_EMPRESAORIGEM'];
                const numRequisicao = ordemProducao[0]['PRODUCOES_NUMEROORIGEM'];
                const serRequisicao = ordemProducao[0]['PRODUCOES_SERIEORIGEM'];
                const pesRequisicao = ordemProducao[0]['PRODUCOES_ID_PESSOAS'];
                const reqVinculada = await samosFB.executeSQL(`select MOVIMENTOS_ID from MOVIMENTOS where MOVIMENTOS_ID_EMPRESAS = ${empRequisicao}
                                                                                                      and MOVIMENTOS_NUMERO      = ${numRequisicao}
                                                                                                      and MOVIMENTOS_SERIE       = '${serRequisicao}'
                                                                                                      and MOVIMENTOS_ID_PESSOAS  = ${pesRequisicao}`, params);
                if(reqVinculada.length > 0) { // Se localizar a requisição vinculada à produção, a exclui
                    const idMovimentoRemover = reqVinculada[0]['MOVIMENTOS_ID'];
                    await samosFB.delete(idMovimentoRemover, 'MOVIMENTOS', params);
                    await samosFB.delete(idMovimentoRemover, 'MOVIMENTOSITENS', 'MOVIMENTOS', params);
                }
            }

            // Fim da localização e remoção

            await samosFB.delete(id, 'PRODUCOES', params);
            await samosFB.delete(id, 'PRODUCOESITENS', 'PRODUCOES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar ordem de produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
