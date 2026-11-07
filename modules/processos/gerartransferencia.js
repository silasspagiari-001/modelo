'use strict';

const samosFB = require('../../services/samosFB');
const api     = require('../');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { id } = params;
            const sqlSearch = `select MOVIMENTOS_ID, MOVIMENTOS_ID_EMPRESAS,
                                      MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NUMERO,
                                      MOVIMENTOS_SERIE, MOVIMENTOS_ID_OPERACOES
                               from MOVIMENTOS 
                               left outer join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES       
                                      where right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and OPERACOES_ACAO = 'TS' and
                                      MOVIMENTOS_ID = ${id}`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            if(results.length > 0) { // Se tiver alguma transferência de saída segue pro passo seguinte - checar se já gerou entrada.
                for(let i in results) {
                    let idEmpresa   = results[i]['MOVIMENTOS_ID_PESSOAS'];
                    let idDocumento = ((idEmpresa * 10000) + 5);
                    let idOrigem    = results[i]['MOVIMENTOS_ID'];
                    let numNfe      = results[i]['MOVIMENTOS_NUMERO'];
                    let serNfe      = results[i]['MOVIMENTOS_SERIE'];
                    let pesNfe      = results[i]['MOVIMENTOS_ID_EMPRESAS'];
                    let opeNfe      = (results[i]['MOVIMENTOS_ID_OPERACOES'] - 400000);

                    const sqlTransf = `select MOVIMENTOS_ID from MOVIMENTOS 
                                        where MOVIMENTOS_ID_EMPRESAS = ${idEmpresa} and
                                              MOVIMENTOS_ID_DOCUMENTOS = ${idDocumento} and
                                              MOVIMENTOS_NUMERO = ${numNfe} and
                                              MOVIMENTOS_SERIE = '${serNfe}' and
                                              MOVIMENTOS_ID_PESSOAS = ${pesNfe} and
                                              MOVIMENTOS_ID_OPERACOES = ${opeNfe}`;

                    const docresult = await samosFB.executeSQL(sqlTransf, params);

                    if(docresult.length == 0) {   // Se não tem a entrada correspondente da NFS de transferência

                        const queryMovimentoOrigem = await api.movimentos().readById(idOrigem, params);

                        if(!queryMovimentoOrigem.results || !queryMovimentoOrigem.results[0]) {
                            throw 'Movimento de origem não encontrado';
                        }
            
                        const movimentoOrigem = queryMovimentoOrigem.results[0];
                                   
                        const queryNovoDocumento = await api.documentos().read(Object.assign({}, params, {
                            conteudo: 'Nota Entrada',
                            empresa:  idEmpresa,
                            ordem: '0',
                            status: 2,
                            start: 0,
                            limit: 1
                        }))
            
                        if(!queryNovoDocumento.results || !queryNovoDocumento.results[0]) {
                            throw 'Documento para gerar novo movimento não encontrado';
                        }
            
                        const novoDocumento = queryNovoDocumento.results[0];
            
                        const itensAntigos = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).map(item => {
                            return Object.assign({}, item);
                        });
            
                        const formas      = resetarIds(movimentoOrigem, 'MOVIMENTOS_FORMASPAGAMENTO', 'MOVIMENTOSFORMAS_ID');
                        const transporte  = resetarIds(movimentoOrigem, 'MOVIMENTOS_ENVIO',           'MOVIMENTOSENVIO_ID');
                            
                        let itens = resetarIds(movimentoOrigem, 'MOVIMENTOS_ITENS', 'MOVIMENTOSITENS_ID')
                            .map((item, index, itens) => {
                                item['MOVIMENTOSITENS_ID_OPERACOES'] = (item['MOVIMENTOSITENS_ID_OPERACOES'] - 400000);
                                return item;
                            })
            
                        let novoMovimento = {
                            'MOVIMENTOS_ID'              : 0,
                            'MOVIMENTOS_NUMERO'          : movimentoOrigem['MOVIMENTOS_NUMERO'],
                            'MOVIMENTOS_SERIE'           : movimentoOrigem['MOVIMENTOS_SERIE'],
                            'MOVIMENTOS_CPFCNPJ'         : movimentoOrigem['EMPRESAS_CPFCNPJ'],
                            'MOVIMENTOS_SERIEORIGEM'     : movimentoOrigem['MOVIMENTOS_SERIE'],
                            'MOVIMENTOS_ID_EMPRESAS'     : movimentoOrigem['MOVIMENTOS_ID_PESSOAS'],  // Inverte pessoa/empresa
                            'MOVIMENTOS_ID_PRAZOS'       : movimentoOrigem['MOVIMENTOS_ID_PRAZOS'],
                            'MOVIMENTOS_EMISSAO'         : movimentoOrigem['MOVIMENTOS_EMISSAO'],
                            'MOVIMENTOS_ENTRADASAIDA'    : movimentoOrigem['MOVIMENTOS_ENTRADASAIDA'],
                            'MOVIMENTOS_STATUS'          : 'F',
                            'MOVIMENTOS_SITUACAO'        : '3',
                            'MOVIMENTOS_ID_USUARIOS'     : movimentoOrigem['MOVIMENTOS_ID_USUARIOS'],
                            'USUARIOS_NOME'              : movimentoOrigem['USUARIOS_NOME'],
                            'USUARIOS_LOGIN'             : params.userLogin,
                            'MOVIMENTOS_NFE'             : movimentoOrigem['MOVIMENTOS_NFE'],
                            'MOVIMENTOS_PROTOCOLO'       : movimentoOrigem['MOVIMENTOS_PROTOCOLO'],
                            'MOVIMENTOS_BASEICMS'        : movimentoOrigem['MOVIMENTOS_BASEICMS'],
                            'MOVIMENTOS_VALORICMS'       : movimentoOrigem['MOVIMENTOS_VALORICMS'],
                            'MOVIMENTOS_BASEST'          : movimentoOrigem['MOVIMENTOS_BASEST'],
                            'MOVIMENTOS_VALORST'         : movimentoOrigem['MOVIMENTOS_VALORST'],
                            'MOVIMENTOS_VALORIPI'        : movimentoOrigem['MOVIMENTOS_VALORIPI'],
                            'MOVIMENTOS_IMPOSTO'         : movimentoOrigem['MOVIMENTOS_IMPOSTO'],
                            'MOVIMENTOS_FRETE'           : movimentoOrigem['MOVIMENTOS_FRETE'],
                            'MOVIMENTOS_DESCONTOS'       : movimentoOrigem['MOVIMENTOS_DESCONTOS'],
                            'MOVIMENTOS_PERCENTUAL'      : movimentoOrigem['MOVIMENTOS_PERCENTUAL'],
                            'MOVIMENTOS_PRODUTOS'        : movimentoOrigem['MOVIMENTOS_PRODUTOS'],
                            'MOVIMENTOS_TOTAL'           : movimentoOrigem['MOVIMENTOS_TOTAL'],
                            'MOVIMENTOS_DESPESAS'        : movimentoOrigem['MOVIMENTOS_DESPESAS'],
                            'MOVIMENTOS_SEGURO'          : movimentoOrigem['MOVIMENTOS_SEGURO'],
                            'MOVIMENTOS_OBSERVACOES'     : movimentoOrigem['MOVIMENTOS_OBSERVACOES'],
                            'MOVIMENTOS_FORMASPAGAMENTO' : formas,
                            'MOVIMENTOS_ID_EMPRESAORIGEM': movimentoOrigem['MOVIMENTOS_ID_EMPRESAORIGEM'],
                            'MOVIMENTOS_NUMEROORIGEM'    : movimentoOrigem['MOVIMENTOS_NUMEROORIGEM'],
                            'MOVIMENTOS_ID_PESSOAS'      : movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],  // Inverte pessoa/empresa
                            'MOVIMENTOS_NOME'            : movimentoOrigem['EMPRESAS_NOME'],
                            'MOVIMENTOS_EMAIL'           : movimentoOrigem['EMPRESAS_EMAIL'],
                            'MOVIMENTOS_CELULAR'         : movimentoOrigem['EMPRESAS_CELULAR'],
                            'MONTAGENS_VALOR'            : movimentoOrigem['MONTAGENS_VALOR'],
                            'MOVIMENTOS_ITENS'           : itens,
                            'MOVIMENTOS_ENVIO'           : transporte,
                            'MOVIMENTOS_ID_DOCUMENTOS'   : novoDocumento['DOCUMENTOS_ID'],
                            'DOCUMENTOS_NOME'            : novoDocumento['DOCUMENTOS_NOME'],
                            'MOVIMENTOS_ID_OPERACOES'    : (movimentoOrigem['MOVIMENTOS_ID_OPERACOES'] - 400000),
                            'OPERACOES_ID_APLICACOES'    : novoDocumento['OPERACOES_ID_APLICACOES'],
                            'OPERACOES_FINANCEIRO'       : 'N',
                            'OPERACOES_UNICA'            : novoDocumento['OPERACOES_UNICA'],
                            'MOVIMENTOS_ITENSANTIGOS'    : itensAntigos
                        };       
                        
                        await api.movimentos().create(novoMovimento, params);
                        
                    }
                }
            }

            return results.length;
        } catch(error) {
            const msg = 'Falha ao gerar nota de transferência';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const resetarIds = function(model, campoLista, campoId) {
    const lista = model[campoLista] || [];
    
    return lista.map((model, index) => {
        const novoItem = Object.assign({}, model);
        novoItem[campoId] = (parseInt(index) + 1) * -1;
        return novoItem;
    });
};