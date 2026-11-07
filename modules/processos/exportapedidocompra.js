'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const api     = require('../');
const moment  = require('moment-timezone');
const cents   = utils.number.cents.bind(utils.number);
const grams   = utils.number.grams.bind(utils.number);

module.exports = {
    create: async (data, params) => {
        try {
            const { idPedido, idNota } = params;
            const nomeNovoDocumento = 'Pedidos Compra';

            const movimentoOrigem = await api.movimentos().readById(idPedido, params)
                .then(res => {
                    if(!res.results || !res.results[0]){
                        throw 'Pedido de Compra não encontrado';
                    } else {
                        return res.results[0];
                    }
                });

            if(movimentoOrigem['MOVIMENTOS_STATUS'] == 'F') {
                throw 'Pedido de compra já recebido - Verificar';                  
            }

            delete params.empresa;
            delete params.numero;
            delete params.serie;

            const notaOrigem = await api.movimentos().readById(idNota, params)
                .then(res => {
                    if(!res.results || !res.results[0]){
                        throw 'Nota de Entrada não encontrada'
                    } else {
                        return res.results[0];
                    }
                });

            const vinculados = await checarVinculos(idNota, movimentoOrigem['MOVIMENTOS_ID'], params);

            if(!vinculados && vinculados.length == 0){     
                throw 'Nota divergente do pedido - Verificar'
            }    

            const temVinculo = (vinculados || []).every(item => {
                const idProdutoVinculado  = item['ITENS_ID_PRODUTOS'];
                return idProdutoVinculado > 0;
            });

            const temRecebido = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).some(item => {
                const qtdProdutoRecebido  = item['MOVIMENTOSITENS_ENTREGUE'];
                return qtdProdutoRecebido > 0;
            });

            if(!temVinculo){     
                throw 'Não foi possível vincular todos os itens - verifique'
            }    

            if(!temRecebido){     
                throw 'Pedido de Compra não tem itens recebidos - verifique'
            }    
            
            const empNfe = notaOrigem['MOVIMENTOS_ID_EMPRESAS'];
            const numeroNfe = notaOrigem['MOVIMENTOS_NUMERO'];
            const serieNfe = notaOrigem['MOVIMENTOS_SERIE'];
            const recepNfe = notaOrigem['MOVIMENTOS_ENTRADASAIDA'];

            const statusNfe = ((notaOrigem['EMPRESAS_CPFCNPJ'].substring(0, 8) != '04395395' &&
                                notaOrigem['EMPRESAS_CPFCNPJ'].substring(0, 8) != '45118377') ? 'G' : 'H');

            await removerItensNota(idNota, params)
            await adicionarItensNota(idNota, vinculados, params)
            await atualizarStatusPedido(movimentoOrigem['MOVIMENTOS_ID'], empNfe, numeroNfe, serieNfe, recepNfe, params)
            await atualizarCustoItens(notaOrigem['MOVIMENTOS_SITUACAO'], vinculados, params)
            await atualizarStatusNfEntrada(idNota, statusNfe, params);

            const idEmpresa = movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'];

            const novoDocumento = await api.documentos().read({
                conteudo: nomeNovoDocumento,
                empresa:  idEmpresa,
                ordem: '0',
                status: 2,
                start: 0,
                limit: 1,
                client: params.client
            }).then(res => {
                if(!res.results || !res.results[0]){
                    throw 'Documento não encontrado'
                } else {
                    return res.results[0];
                }
            });

            const itensAntigos = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).map(item => {
                return Object.assign({}, item);
            })

            let itens = resetarIds(movimentoOrigem, 'MOVIMENTOS_ITENS', 'MOVIMENTOSITENS_ID')
                .map(item => {
                    item['MOVIMENTOSITENS_ID_OPERACOES'] = novoDocumento['DOCUMENTOS_ID_OPERACOES'];
                    item['MOVIMENTOSITENS_QUANTIDADE'] = (item['MOVIMENTOSITENS_QUANTIDADE'] - item['MOVIMENTOSITENS_ENTREGUE']);
                    item['MOVIMENTOSITENS_ENTREGUE'] = 0;
                    return item;
                });

            // Deixa só os itens restante pro novo pedido de compra
            const itensRestantes = (itens || []).filter(restante => {
                return grams(restante['MOVIMENTOSITENS_QUANTIDADE']) > 0;
            });

            if(itensRestantes.length == 0) {
                return {
                    results: [],
                    total: 0
                }
            }

            //Somente se tiver itens restantes gera um novo pedido de compra
            if(itensRestantes.length > 0) {
                itens = itensRestantes;    
            
                let novoTotalProdutos = 0;
                let novoTotalIpi = 0;
                let novoTotalFrete = 0;
                let novoTotalSeguro = 0;
                let novoTotalDepesas = 0; 
                let novoTotalPedido = 0;                    

                for(let l in itens) {
                    itens[l]['MOVIMENTOSITENS_TOTAL']    = (itens[l]['MOVIMENTOSITENS_QUANTIDADE'] * cents(itens[l]['MOVIMENTOSITENS_PRECO'])) / 100;
                    itens[l]['MOVIMENTOSITENS_VALORIPI'] = ((itens[l]['MOVIMENTOSITENS_TOTAL'] / 100) * itens[l]['MOVIMENTOSITENS_IPI']).toFixed(2);
                    itens[l]['MOVIMENTOSITENS_FRETE']    = ((itens[l]['MOVIMENTOSITENS_TOTAL'] / 100) * itens[l]['MOVIMENTOSITENS_ALIQUOTAPIS']).toFixed(2);
                    itens[l]['MOVIMENTOSITENS_SEGURO']   = ((itens[l]['MOVIMENTOSITENS_TOTAL'] / 100) * itens[l]['MOVIMENTOSITENS_ALIQUOTACOFINS']).toFixed(2);
                    itens[l]['MOVIMENTOSITENS_DESPESAS'] = 0;

                    novoTotalProdutos += cents(itens[l]['MOVIMENTOSITENS_TOTAL']);
                    novoTotalIpi      += cents(itens[l]['MOVIMENTOSITENS_VALORIPI']);
                    novoTotalFrete    += cents(itens[l]['MOVIMENTOSITENS_FRETE']);
                    novoTotalSeguro   += cents(itens[l]['MOVIMENTOSITENS_SEGURO']);
                    novoTotalDepesas  += cents(itens[l]['MOVIMENTOSITENS_DESPESAS']);
                    novoTotalPedido   += (cents(itens[l]['MOVIMENTOSITENS_TOTAL']) +
                                         cents(itens[l]['MOVIMENTOSITENS_VALORIPI']) +
                                         cents(itens[l]['MOVIMENTOSITENS_FRETE']) +
                                         cents(itens[l]['MOVIMENTOSITENS_SEGURO']) +
                                         cents(itens[l]['MOVIMENTOSITENS_DESPESAS']));
                }

                let novoMovimento = {
                    'MOVIMENTOS_ID'              : 0,
                    'MOVIMENTOS_CPFCNPJ'         : movimentoOrigem['MOVIMENTOS_CPFCNPJ'],
                    'MOVIMENTOS_SERIEORIGEM'     : movimentoOrigem['MOVIMENTOS_SERIE'],
                    'MOVIMENTOS_ID_EMPRESAS'     : movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'MOVIMENTOS_ID_PRAZOS'       : movimentoOrigem['MOVIMENTOS_ID_PRAZOS'],
                    'MOVIMENTOS_ENTRADASAIDA'    : moment.tz(params.timezone).format('YYYY-MM-DD'),
                    'MOVIMENTOS_STATUS'          : movimentoOrigem['DOCUMENTOS_NOME'].match(/Transfer/) ? 'F' : 'N',
                    'MOVIMENTOS_SITUACAO'        : movimentoOrigem['DOCUMENTOS_NOME'].match(/Transfer/) ? 'A' : 'P',
                    'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                    'USUARIOS_NOME'              : params.userLogin,
                    'USUARIOS_LOGIN'             : params.userLogin,
                    'MOVIMENTOS_NFE'             : '',
                    'MOVIMENTOS_PROTOCOLO'       : '',
                    'MOVIMENTOS_BASEICMS'        : 0,
                    'MOVIMENTOS_VALORICMS'       : 0,
                    'MOVIMENTOS_BASEST'          : (nomeNovoDocumento == 'Pedidos' ? movimentoOrigem['MOVIMENTOS_BASEST'] : 0),
                    'MOVIMENTOS_VALORST'         : 0,
                    'MOVIMENTOS_VALORIPI'        : novoTotalIpi / 100,
                    'MOVIMENTOS_IMPOSTO'         : movimentoOrigem['MOVIMENTOS_IMPOSTO'],
                    'MOVIMENTOS_FRETE'           : novoTotalFrete / 100,
                    'MOVIMENTOS_DESCONTOS'       : movimentoOrigem['MOVIMENTOS_DESCONTOS'],
                    'MOVIMENTOS_PERCENTUAL'      : movimentoOrigem['MOVIMENTOS_PERCENTUAL'],
                    'MOVIMENTOS_PRODUTOS'        : novoTotalProdutos / 100,
                    'MOVIMENTOS_SEGURO'          : novoTotalSeguro / 100,
                    'MOVIMENTOS_DESPESAS'        : novoTotalDepesas / 100,
                    'MOVIMENTOS_TOTAL'           : novoTotalPedido / 100,
                    'MOVIMENTOS_OBSERVACOES'     : movimentoOrigem['MOVIMENTOS_OBSERVACOES'],
                    'MOVIMENTOS_FORMASPAGAMENTO' : [],
                    'MOVIMENTOS_ID_EMPRESAORIGEM': movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'MOVIMENTOS_NUMEROORIGEM'    : movimentoOrigem['MOVIMENTOS_NUMERO'],
                    'MOVIMENTOS_ID_PESSOAS'      : movimentoOrigem['MOVIMENTOS_ID_PESSOAS'],
                    'MOVIMENTOS_NOME'            : movimentoOrigem['MOVIMENTOS_NOME'],
                    'MOVIMENTOS_EMAIL'           : movimentoOrigem['MOVIMENTOS_EMAIL'],
                    'MONTAGENS_VALOR'            : movimentoOrigem['MONTAGENS_VALOR'],
                    'MOVIMENTOS_ITENS'           : itens,
                    'MOVIMENTOS_ENVIO'           : [],
                    'MOVIMENTOS_ID_DOCUMENTOS'   : novoDocumento['DOCUMENTOS_ID'],
                    'DOCUMENTOS_NOME'            : novoDocumento['DOCUMENTOS_NOME'],
                    'MOVIMENTOS_ID_OPERACOES'    : novoDocumento['DOCUMENTOS_ID_OPERACOES'],
                    'OPERACOES_ID_APLICACOES'    : novoDocumento['OPERACOES_ID_APLICACOES'],
                    'OPERACOES_FINANCEIRO'       : novoDocumento['OPERACOES_FINANCEIRO'],
                    'OPERACOES_UNICA'            : novoDocumento['OPERACOES_UNICA'],
                    'MOVIMENTOS_ITENSANTIGOS'    : itensAntigos
                };

                const movimentoSalvo = await api.movimentos().create(novoMovimento, params);
                const movimentoCompleto = await api.movimentos().readById(movimentoSalvo.results['MOVIMENTOS_ID'], params);
                
                if(!movimentoCompleto.results || !movimentoCompleto.results[0]){
                    throw 'Movimento não encontrado';
                } else {
                    await atualizarOriginal(novoMovimento, movimentoOrigem, params);

                    return {
                        results: movimentoCompleto.results,
                        total: 1
                    }
                }
            }               
        } catch(error) {
            const msg = error.message ? 'Falha ao exportar pedido de compra' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

function resetarIds(model, campoLista, campoId) {
    const lista = model[campoLista] || [];
    
    return lista.map((model, index) => {
        const novoItem = Object.assign({}, model);
        novoItem[campoId] = (parseInt(index) + 1) * -1;
        return novoItem;
    });
};

async function atualizarOriginal(novo, original, params) {
    original['MOVIMENTOS_ENTRADASAIDA']     = moment.tz(params.timezone).format('YYYY-MM-DD');
    original['MOVIMENTOS_ID_EMPRESAORIGEM'] = novo['MOVIMENTOS_ID_EMPRESAS'];
    original['MOVIMENTOS_NUMEROORIGEM']     = novo['MOVIMENTOS_NUMERO'];
    original['MOVIMENTOS_SERIEORIGEM']      = novo['MOVIMENTOS_SERIE'];
    original['MOVIMENTOS_STATUS']           = 'F';
   
    return await api.movimentos().update(original['MOVIMENTOS_ID'], original, params);
};

async function checarVinculos(nfEntrada, idPedido, params) {
    const sqlSearch = `select MOVIMENTOSITENS.MOVIMENTOSITENS_ID_MOVIMENTOS,
                              MOVIMENTOSITENS.MOVIMENTOSITENS_ID_EMPRESAS,
                              ITENSPEDIDO.MOVIMENTOSITENS_ID_PRODUTOS             as ITENS_ID_PRODUTOS,
                              ITENSPEDIDO.MOVIMENTOSITENS_ENTREGUE                as ITENS_QUANTIDADE,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_ID_OPERACOES)   as ITENS_OPERACOES,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_EXCECAO)        as ITENS_EXCECAO,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_ESCRITURACAO)   as ITENS_ESCRITURACAO,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_BASEICMS)       as ITENS_BASEICMS,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_ICMS)           as ITENS_ICMS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORICMS)      as ITENS_VALORICMS,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_IPI)            as ITENS_IPI,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORIPI)       as ITENS_VALORIPI,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_BASEST)         as ITENS_BASEST,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORST)        as ITENS_VALORST,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_FRETE)          as ITENS_FRETE,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_SEGURO)         as ITENS_SEGURO,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_DESPESAS)       as ITENS_DESPESAS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_IMPOSTO)        as ITENS_IMPOSTO,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_CST)            as ITENS_CST,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_ALIQUOTAPIS)    as ITENS_ALIQUOTAPIS,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_CSTPIS)         as ITENS_CSTPIS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_BASEPIS)        as ITENS_BASEPIS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORPIS)       as ITENS_VALORPIS,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_ALIQUOTACOFINS) as ITENS_ALIQUOTACOFINS,
                              max(MOVIMENTOSITENS.MOVIMENTOSITENS_CSTCOFINS)      as ITENS_CSTCOFINS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_BASECOFINS)     as ITENS_BASECOFINS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORCOFINS)    as ITENS_VALORCOFINS,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORPISST)     as ITENS_VALORPISST,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_VALORCOFINSST)  as ITENS_VALORCOFINSST,
                              sum(MOVIMENTOSITENS.MOVIMENTOSITENS_TOTAL)          as ITENS_TOTAL

                          from MOVIMENTOSITENS

                          left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS.MOVIMENTOSITENS_ID_MOVIMENTOS
                          left outer join MOVIMENTOSITENS as ITENSPEDIDO on ITENSPEDIDO.MOVIMENTOSITENS_ID_MOVIMENTOS = ${idPedido}
                                                      and ITENSPEDIDO.MOVIMENTOSITENS_ID_EMPRESAS = MOVIMENTOSITENS.MOVIMENTOSITENS_ID_EMPRESAS
                          where MOVIMENTOSITENS.MOVIMENTOSITENS_ID_MOVIMENTOS = ${nfEntrada}
                          group by MOVIMENTOSITENS.MOVIMENTOSITENS_ID_MOVIMENTOS, 
                                   MOVIMENTOSITENS.MOVIMENTOSITENS_ID_EMPRESAS, 
                                   ITENSPEDIDO.MOVIMENTOSITENS_ID_PRODUTOS, 
                                   ITENSPEDIDO.MOVIMENTOSITENS_ENTREGUE`;

    return await samosFB.executeSQL(sqlSearch, params);
};

async function removerItensNota(nfEntrada, params) {
    const sql = `delete from MOVIMENTOSITENS where MOVIMENTOSITENS_ID_MOVIMENTOS = ${nfEntrada}`;
    return await samosFB.executeSQL(sql, params)
};

async function adicionarItensNota(nfEntrada, itens, params) {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

    let itensGravar = [];
    let idSequencia = 0;

    for(let i in itens){
        let item = itens[i];

        let idOperacao     = item['ITENS_OPERACOES'];
        let idExcecao      = item['ITENS_EXCECAO'];
        let idEscrituracao = '4'; 
        let vlrBaseICMS    = item['ITENS_BASEICMS'];
        let aliqICMS       = item['ITENS_ICMS'];
        let vlrICMS        = item['ITENS_VALORICMS'];
        let aliqIPI        = item['ITENS_IPI'];
        let vlrIPI         = item['ITENS_VALORIPI'];
        let vlrBaseSt      = item['ITENS_BASEST'];
        let vlrSt          = item['ITENS_VALORST'];
        let vlrFrete       = item['ITENS_FRETE'];
        let vlrSeguro      = item['ITENS_SEGURO'];
        let vlrDespesas    = item['ITENS_DESPESAS'];
        let vlrImposto     = item['ITENS_IMPOSTO'];
        let idCst          = item['ITENS_CST'];
        let aliqPIS        = item['ITENS_ALIQUOTAPIS'];
        let idCstPis       = item['ITENS_CSTPIS'];
        let vlrBasePis     = item['ITENS_BASEPIS'];
        let vlrPis         = item['ITENS_VALORPIS'];
        let aliqCofins     = item['ITENS_ALIQUOTACOFINS'];
        let idCstCofins    = item['ITENS_CSTCOFINS'];
        let vlrBaseCofins  = item['ITENS_BASECOFINS'];
        let vlrCofins      = item['ITENS_VALORCOFINS'];
        let vlrPisSt       = item['ITENS_VALORPISST'];
        let vlrCofinsSt    = item['ITENS_VALORCOFINSST'];
        let idProduto      = item['ITENS_ID_PRODUTOS'];
        let totalItem      = item['ITENS_TOTAL'];
        let qtdeProduto    = item['ITENS_QUANTIDADE'];
        let precoProduto   = (totalItem / qtdeProduto);
        idSequencia        = idSequencia + 1;

        itensGravar.push({
            'MOVIMENTOSITENS_ID_MOVIMENTOS' : nfEntrada,
            'MOVIMENTOSITENS_ID_OPERACOES'  : idOperacao,
            'MOVIMENTOSITENS_ID_PRODUTOS'   : idProduto, 
            'MOVIMENTOSITENS_QUANTIDADE'    : qtdeProduto,
            'MOVIMENTOSITENS_PRECO'         : precoProduto,
            'MOVIMENTOSITENS_CUSTO'         : precoProduto,
            'MOVIMENTOSITENS_PERCENTUAL'    : 0,
            'MOVIMENTOSITENS_DESCONTOS'     : 0,
            'MOVIMENTOSITENS_TOTAL'         : totalItem,
            'MOVIMENTOSITENS_ICMS'          : aliqICMS,
            'MOVIMENTOSITENS_EXCECAO'       : idExcecao,
            'MOVIMENTOSITENS_ESCRITURACAO'  : idEscrituracao,
            'MOVIMENTOSITENS_BASEICMS'      : vlrBaseICMS,
            'MOVIMENTOSITENS_VALORICMS'     : vlrICMS,
            'MOVIMENTOSITENS_IPI'           : aliqIPI,
            'MOVIMENTOSITENS_VALORIPI'      : vlrIPI,
            'MOVIMENTOSITENS_BASEST'        : vlrBaseSt,
            'MOVIMENTOSITENS_VALORST'       : vlrSt,
            'MOVIMENTOSITENS_FRETE'         : vlrFrete,
            'MOVIMENTOSITENS_SEGURO'        : vlrSeguro,
            'MOVIMENTOSITENS_DESPESAS'      : vlrDespesas,
            'MOVIMENTOSITENS_IMPOSTO'       : vlrImposto,
            'MOVIMENTOSITENS_CST'           : idCst,
            'MOVIMENTOSITENS_ID_EMPRESAS'   : idSequencia,
            'MOVIMENTOSITENS_ENTREGUE'      : 0,
            'MOVIMENTOSITENS_DEPOSITO'      : 0,
            'MOVIMENTOSITENS_IMEDIATA'      : 0,
            'MOVIMENTOSITENS_DATAENTREGA'   : hoje,
            'MOVIMENTOSITENS_HORAENTREGA'   : 'N',
            'MOVIMENTOSITENS_DATAMONTAGEM'  : hoje,
            'MOVIMENTOSITENS_HORAMONTAGEM'  : 'N',
            'MOVIMENTOSITENS_ALIQUOTAPIS'   : aliqPIS,
            'MOVIMENTOSITENS_CSTPIS'        : idCstPis,
            'MOVIMENTOSITENS_BASEPIS'       : vlrBasePis,
            'MOVIMENTOSITENS_VALORPIS'      : vlrPis,
            'MOVIMENTOSITENS_ALIQUOTACOFINS': aliqCofins,
            'MOVIMENTOSITENS_CSTCOFINS'     : idCstCofins,
            'MOVIMENTOSITENS_BASECOFINS'    : vlrBaseCofins,
            'MOVIMENTOSITENS_VALORCOFINS'   : vlrCofins,
            'MOVIMENTOSITENS_VALORPISST'    : vlrPisSt,
            'MOVIMENTOSITENS_VALORCOFINSST' : vlrCofinsSt
        });
    }

    try {
        if(itensGravar.length > 0) {
            await samosFB.insert('MOVIMENTOSITENS',  itensGravar, params);
        }
    } catch (error) {
        const msg = error.message ? 'Falha ao criar novos itens' : error;
        console.log(msg);
        console.log(error);
        throw { msg, error };
    }    
};

async function atualizarCustoItens(atualizar, itens, params) {
    let sqlListItens = '';

    for(let i in itens){
        let item = itens[i];

        let vlrIPI         = item['ITENS_VALORIPI'];
        let vlrSt          = item['ITENS_VALORST'];
        let vlrFrete       = item['ITENS_FRETE'];
        let vlrSeguro      = item['ITENS_SEGURO'];
        let vlrDespesas    = item['ITENS_DESPESAS'];
        let idProduto      = item['ITENS_ID_PRODUTOS'];
        let totalItem      = item['ITENS_TOTAL'];
        let qtdeProduto    = item['ITENS_QUANTIDADE'];
        let custoProduto   = ((totalItem + vlrIPI + vlrSt + vlrFrete + vlrSeguro + vlrDespesas) / qtdeProduto);

        sqlListItens += `update SALDOS set 
            SALDOS_CUSTO = ${custoProduto}, 
            SALDOS_PRECO = round((${custoProduto} + (${custoProduto} * (SALDOS_MARGEM / 100))), 0)
        where
        SALDOS_ID_PRODUTOS = ${idProduto} and
        SALDOS_CUSTO < ${custoProduto};`;
    }

    const executeBlock = `execute block as begin ${sqlListItens} end;`;

    if(atualizar == 0 || atualizar == 2) {
       return await samosFB.executeSQL(executeBlock, params);
    }          
};

async function atualizarStatusPedido(pedido, empresa, numero, serie, recepcao, params) {
    const sql = `update MOVIMENTOS set 
        MOVIMENTOS_STATUS = 'F',
        MOVIMENTOS_ID_EMPRESAORIGEM = ${empresa},
        MOVIMENTOS_NUMEROORIGEM = ${numero},
        MOVIMENTOS_SERIEORIGEM = '${serie}',
        MOVIMENTOS_ENTRADASAIDA = '${recepcao}'
    where MOVIMENTOS_ID = ${pedido}`;

    return await samosFB.executeSQL(sql, params);
};

async function atualizarStatusNfEntrada(nfEntrada, status, params) {
    const sql = `update MOVIMENTOS set 
        MOVIMENTOS_STATUS = '${status}' 
    where MOVIMENTOS_ID = ${nfEntrada}`;

    return await samosFB.executeSQL(sql, params);
};