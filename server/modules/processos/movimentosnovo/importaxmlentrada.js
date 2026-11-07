'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');
const xmlJS   = require('xml-js');
const api     = require('../../../modules');

module.exports = {
    create: async (data, params) => {
        try {
            const { xml } = data;

            const queryEmpresa = await samosFB.executeSQL(`
                select 
                    EMPRESAS_ID,
                    EMPRESAS_CPFCNPJ,
                    CIDADES_ESTADO
                from EMPRESAS 
                join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
                where EMPRESAS_ID = ${params.empresaLogada}
            `, params);

            const empresa = queryEmpresa[0];

            if (xml) {
                const jsonXML = JSON.parse(xmlJS.xml2json(xml, { compact: true }));

                require('fs').writeFileSync('xml.xml', xml);
                require('fs').writeFileSync('xml.json', JSON.stringify(jsonXML, null, 4));

                if(!jsonXML.nfeProc) {
                    throw `Não é XML de Nota de Entrada. Tipo: ${Object.keys(jsonXML)[0] || '""'}`;
                }
    
                if (jsonXML.nfeProc.NFe.infNFe.dest.CNPJ._text == empresa['EMPRESAS_CPFCNPJ']) {
                    const processoImportacao = await importaNfe(jsonXML,empresa, params);

                    if (processoImportacao.success) {
                        return  {
                            status : 'Nota importada com sucesso',
                            caminho: processoImportacao.caminho,
                            retorno: processoImportacao.retorno
                        };
                    } else {
                        return {
                            status : 'Nota já importada - verifique',
                            caminho: processoImportacao.caminho,
                            retorno: processoImportacao.retorno
                        };
                    }

                } else {
                    return  {
                        status : 'Não consegui importar a NFE - verifique se o CNPJ é correspondente',
                        caminho: '0',
                        retorno: '0'
                    };
                }

            } else {
                console.log('Dados de XML vazio: ' + xml);

                return {
                    status : 'Dados de XML vazio',
                    caminho: '0',
                    retorno: '0'
                };
            }

        } catch(error) {
            const msg = 'Falha importar XML Nota Entrada';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function importaNfe(jsonXML, empresa, params) {
    await verificaProduto999999(params); // Verifica se produto 99999 existe

    const queryMovimento = await samosFB.executeSQL(`
        select MOVIMENTOS_ID from MOVIMENTOS where 
            MOVIMENTOS_ID_EMPRESAS   = '${empresa['EMPRESAS_ID']}'                     and
            MOVIMENTOS_ID_DOCUMENTOS = '${empresa['EMPRESAS_ID']}0005'                 and
            MOVIMENTOS_CPFCNPJ       = '${jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text}' and
            MOVIMENTOS_NUMERO        = '${jsonXML.nfeProc.NFe.infNFe.ide.nNF._text}'   and
            MOVIMENTOS_SERIE         = 'NFE'
    `, params);

    if(queryMovimento[0]) {
        const movimento = queryMovimento[0];

        console.log(`xml ja importado: ${jsonXML.nfeProc.NFe.infNFe.ide.nNF._text}`);

        return {
            success: false,
            caminho: movimento['MOVIMENTOS_ID'],
            retorno: ''
        };
    }
    
    const queryPessoa = await samosFB.executeSQL(`
        select 
            PESSOAS_ID,
            PESSOAS_ID_USUARIOS,
            PESSOAS_EMAIL,
            PESSOAS_NOME,
            PESSOAS_CPFCNPJ
        from PESSOAS where 
            PESSOAS_CPFCNPJ = '${jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text}' 
        order by PESSOAS_ID
    `, params);

    const pessoa = queryPessoa[0] || await incluiPessoa(jsonXML, empresa, params);

    const movimento = {
        'MOVIMENTOS_ID_EMPRESAS'     : empresa['EMPRESAS_ID'],
        'MOVIMENTOS_ID_PESSOAS'      : pessoa['PESSOAS_ID'],
        'MOVIMENTOS_ID_USUARIOS'     : pessoa['PESSOAS_ID_USUARIOS'],
        'MOVIMENTOS_ID_OPERACOES'    : await verificaCfop(jsonXML, jsonXML.nfeProc.NFe.infNFe.det[0] || jsonXML.nfeProc.NFe.infNFe.det, empresa),//operação primeiro item
        'MOVIMENTOS_ID_PRAZOS'       : await verificaPrazos(jsonXML.nfeProc.NFe.infNFe.cobr && jsonXML.nfeProc.NFe.infNFe.cobr.dup && jsonXML.nfeProc.NFe.infNFe.cobr.dup[0] ? jsonXML.nfeProc.NFe.infNFe.cobr.dup.length : 1, params),
        'MOVIMENTOS_ID_DOCUMENTOS'   : `${empresa['EMPRESAS_ID']}0005`,
        'MOVIMENTOS_ID_APLICACOES'   : 1,
        'MOVIMENTOS_ID_CUSTOS'       : 1,
        'MOVIMENTOS_NUMERO'          : jsonXML.nfeProc.NFe.infNFe.ide.nNF._text,
        'MOVIMENTOS_SERIE'           : 'NFE',
        'MOVIMENTOS_EMISSAO'         : (jsonXML.nfeProc.NFe.infNFe.ide.dhEmi._text || '1899-12-30').slice(0, 10),
        'MOVIMENTOS_HORA'            : moment().format('HH:mm:ss'),
        'MOVIMENTOS_ENTRADASAIDA'    : moment().format('YYYY-MM-DD'),
        'MOVIMENTOS_PRODUTOS'        : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vProd._text,
        'MOVIMENTOS_PERCENTUAL'      : 0,
        'MOVIMENTOS_DESCONTOS'       : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vDesc._text,
        'MOVIMENTOS_TOTAL'           : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vNF._text,
        'MOVIMENTOS_BASEICMS'        : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vBC._text,
        'MOVIMENTOS_VALORICMS'       : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vICMS._text,
        'MOVIMENTOS_BASEST'          : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vBCST._text,
        'MOVIMENTOS_VALORST'         : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vST._text,
        'MOVIMENTOS_VALORIPI'        : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vIPI._text,
        'MOVIMENTOS_FRETE'           : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vFrete._text,
        'MOVIMENTOS_SEGURO'          : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vSeg._text,
        'MOVIMENTOS_DESPESAS'        : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vOutro._text,
        'MOVIMENTOS_NFE'             : (jsonXML.nfeProc.NFe.infNFe._attributes.Id   || '').replace(/NFe/ig, '').slice(0, 50),
        'MOVIMENTOS_PROTOCOLO'       : (jsonXML.nfeProc.protNFe.infProt.nProt._text || '').slice(0, 15),
        'MOVIMENTOS_OBSERVACOES'     : '',
        'MOVIMENTOS_STATUS'          : 'N',
        'MOVIMENTOS_LOG'             : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'MOVIMENTOS_EMAIL'           : (pessoa['PESSOAS_EMAIL'] || '').slice(0, 50),
        'MOVIMENTOS_IMPOSTO'         : 0,
        'MOVIMENTOS_NOME'            : (pessoa['PESSOAS_NOME']    || '').slice(0, 50),
        'MOVIMENTOS_CPFCNPJ'         : (pessoa['PESSOAS_CPFCNPJ'] || '').slice(0, 15),
        'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
        'MOVIMENTOS_NUMEROORIGEM'    : 0,
        'MOVIMENTOS_SERIEORIGEM'     : '',
        'MOVIMENTOS_SITUACAO'        : '0'
    }

    function sliceObs(text, array = [], indexInicial = 0) {
        array.push(text.slice(indexInicial, indexInicial + 50));
        if(text.slice(indexInicial + 50, indexInicial + 100).length > 0) {
            return sliceObs(text, array, indexInicial + 50);
        } else{
            return array;
        }
    }

    if(jsonXML.nfeProc.NFe.infNFe.infAdic) {
        if(jsonXML.nfeProc.NFe.infNFe.infAdic.infCpl) {
            movimento['MOVIMENTOS_OBSERVACOES'] = sliceObs(jsonXML.nfeProc.NFe.infNFe.infAdic.infCpl._text || '').join('|');
        } else if(jsonXML.nfeProc.NFe.infNFe.infAdic.obsCont) {
            movimento['MOVIMENTOS_OBSERVACOES'] = jsonXML.nfeProc.NFe.infNFe.infAdic.obsCont
            .map(obs =>  obs.xTexto._text.slice(0, 50))
            .join('|');
        } else {
            movimento['MOVIMENTOS_OBSERVACOES'] = '|||||||||';
        }
    }

    movimento['MOVIMENTOS_OBSERVACOES'] = movimento['MOVIMENTOS_OBSERVACOES'].replace(/[\\"]/g, '').slice(0, 512);

    try {
        await samosFB.insert('MOVIMENTOS', movimento, params);
    } catch (error) {
        console.log(error);
        throw 'Erro ao gravar nota de entrada';
    }

    const jsonXMLItens = jsonXML.nfeProc.NFe.infNFe.det[0] ? jsonXML.nfeProc.NFe.infNFe.det : [jsonXML.nfeProc.NFe.infNFe.det];

    for (let i in jsonXMLItens) {
        const jsonXMLItem = jsonXMLItens[i];
        const icmsKey = Object.keys(jsonXMLItem.imposto.ICMS)[0];
        const idProduto = await verificaProduto(movimento['MOVIMENTOS_ID_PESSOAS'], jsonXMLItem.prod.cProd._text, jsonXMLItem.prod.cEAN._text, jsonXMLItem.prod.NCM._text, params);
        let   idItemMovimento = 0;  // ID do MOVIMENTOSITENS
        let   idLoteItem = 0;       // ID do LOTES

        const item = {
            'MOVIMENTOSITENS_ID'            : (parseInt(i) + 1) * -1,
            'MOVIMENTOSITENS_ID_MOVIMENTOS' : movimento['MOVIMENTOS_ID'],
            'MOVIMENTOSITENS_ID_OPERACOES'  : await verificaCfop(jsonXML, jsonXMLItem, empresa),
            'MOVIMENTOSITENS_ID_PRODUTOS'   : idProduto,
            'MOVIMENTOSITENS_QUANTIDADE'    : jsonXMLItem.prod.qTrib._text,
            'MOVIMENTOSITENS_CUSTO'         : 0,
            'MOVIMENTOSITENS_PRECO'         : jsonXMLItem.prod.vUnTrib._text,
            'MOVIMENTOSITENS_PERCENTUAL'    : 0,
            'MOVIMENTOSITENS_DESCONTOS'     : (jsonXMLItem.prod.vDesc                                  || {})._text || 0,
            'MOVIMENTOSITENS_TOTAL'         : jsonXMLItem.prod.vProd._text,
            'MOVIMENTOSITENS_IPI'           : (((jsonXMLItem.imposto.IPI || {}).IPITrib || {}).pIPI    || {})._text || 0,
            'MOVIMENTOSITENS_VALORIPI'      : (((jsonXMLItem.imposto.IPI || {}).IPITrib || {}).vIPI    || {})._text || 0,
            'MOVIMENTOSITENS_BASEST'        : ((jsonXMLItem.imposto.ICMS[icmsKey]       || {}).vBCST   || {})._text || 0,
            'MOVIMENTOSITENS_VALORST'       : ((jsonXMLItem.imposto.ICMS[icmsKey]       || {}).vICMSST || {})._text || 0,
            'MOVIMENTOSITENS_FRETE'         : (jsonXMLItem.prod.vFrete                                 || {})._text || 0,
            'MOVIMENTOSITENS_SEGURO'        : (jsonXMLItem.prod.vSeg                                   || {})._text || 0,
            'MOVIMENTOSITENS_DESPESAS'      : (jsonXMLItem.prod.vOutro                                 || {})._text || 0,
            'MOVIMENTOSITENS_IMPOSTO'       : 0,
            'MOVIMENTOSITENS_ALIQUOTAPIS'   : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).pPIS || {})._text || 0,
            'MOVIMENTOSITENS_CSTPIS'        : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).CST  || {})._text || 0,
            'MOVIMENTOSITENS_BASEPIS'       : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).vBC  || {})._text || 0,
            'MOVIMENTOSITENS_VALORPIS'      : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).vPIS || {})._text || 0, 
            'MOVIMENTOSITENS_VALORPISST'    : ((jsonXMLItem.imposto.PISST    || {}).vPIS       || {})._text  || 0,
            'MOVIMENTOSITENS_ALIQUOTACOFINS': (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).pCOFINS || {})._text || 0,
            'MOVIMENTOSITENS_CSTCOFINS'     : (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).CST     || {})._text || 0,
            'MOVIMENTOSITENS_BASECOFINS'    : (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).vBC     || {})._text || 0,
            'MOVIMENTOSITENS_VALORCOFINS'   : (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).vCOFINS || {})._text || 0,
            'MOVIMENTOSITENS_VALORCOFINSST' : ((jsonXMLItem.imposto.COFINSST || {}).vCOFINS    || {})._text || 0,
            'MOVIMENTOSITENS_ID_EMPRESAS'   : jsonXMLItem._attributes.nItem || movimento['MOVIMENTOS_ID_EMPRESAS'], // NItem - Controle para vinculo com pedido de compra
            'MOVIMENTOSITENS_ENTREGUE'      : 0,
            'MOVIMENTOSITENS_DEPOSITO'      : 0,
            'MOVIMENTOSITENS_IMEDIATA'      : 0,
            'MOVIMENTOSITENS_DATAENTREGA'   : (jsonXML.nfeProc.NFe.infNFe.ide.dhEmi._text || '1899-12-30').slice(0,10),
            'MOVIMENTOSITENS_HORAENTREGA'   : jsonXMLItem.prod.rastro && jsonXMLItem.prod.rastro.nLote ? jsonXMLItem.prod.rastro.nLote._text.slice(0, 10) : '',
            'MOVIMENTOSITENS_HORAMONTAGEM'  : jsonXMLItem.prod.NCM._text || ''
        }

        const icms00 = jsonXMLItem.imposto.ICMS[icmsKey] || {};

        if (jsonXML.nfeProc.NFe.infNFe.emit.CRT._text == '3') {
            item['MOVIMENTOSITENS_CST'] = `${(icms00.orig || {})._text || ''}${(icms00.CST || {})._text || ''}`;
            if ((icms00.vICMS || {})._text > 0) {
                item['MOVIMENTOSITENS_ICMS']      = (icms00.pICMS || {})._text || 0;
                item['MOVIMENTOSITENS_BASEICMS']  = (icms00.vBC   || {})._text || 0;
                item['MOVIMENTOSITENS_VALORICMS'] = (icms00.vICMS || {})._text || 0;
            }
        } else {
            item['MOVIMENTOSITENS_CST'] = `${(icms00.orig || {})._text || ''}${(icms00.CSOSN || {})._text || ''}`;
            item['MOVIMENTOSITENS_ICMS']      = (icms00.pICMS || {})._text || 0;
            item['MOVIMENTOSITENS_BASEICMS']  = (icms00.vBC   || {})._text || 0;
            item['MOVIMENTOSITENS_VALORICMS'] = (icms00.vICMS || {})._text || 0;
/*            if ((icms00.vCredICMSSN || {})._text > 0) {
                item['MOVIMENTOSITENS_ICMS']      = (icms00.pCredSN || {})._text     || 0;
                item['MOVIMENTOSITENS_BASEICMS']  = jsonXMLItem.prod.vProd._text     || 0;
                item['MOVIMENTOSITENS_VALORICMS'] = (icms00.vCredICMSSN || {})._text || 0;
            }*/
        }

        try {
            const itemGravado = await samosFB.insert('MOVIMENTOSITENS', item, params);
            idItemMovimento = itemGravado['MOVIMENTOSITENS_ID'] || 0;
        } catch (error) {
            console.log(error);
            throw 'Erro ao gravar itens';
        }
        
        try {
            const relacoesItem = {
                'RELACOESITENS_ID_MOVIMENTOS': movimento['MOVIMENTOS_ID'],
                'RELACOESITENS_ID_ITENS'     : item['MOVIMENTOSITENS_ID'],
                'RELACOESITENS_NOME'         : (jsonXMLItem.prod.xProd._text || '').slice(0, 50),
                'RELACOESITENS_FABRICA'      : (jsonXMLItem.prod.cProd._text || '').slice(0, 20),
                'RELACOESITENS_BARRAS'       : (jsonXMLItem.prod.cEAN._text  || '').slice(0, 15),
                'RELACOESITENS_SIGLA'        : (jsonXMLItem.prod.uTrib._text || '').slice(0, 10),
                'RELACOESITENS_FATOR'        : 1
            };
            
            const queryRelacoes = await samosFB.executeSQL(`
                select RELACOES_SIGLA, RELACOES_FATOR from RELACOES where 
                    RELACOES_ID_PESSOAS  = ${movimento['MOVIMENTOS_ID_PESSOAS']} and
                    RELACOES_ID_PRODUTOS = ${item['MOVIMENTOSITENS_ID_PRODUTOS']}
            `, params);
    
            if(queryRelacoes[0]) {
                const relacao = queryRelacoes[0];
    
                relacoesItem['RELACOESITENS_SIGLA'] = relacao['RELACOES_SIGLA'];
                relacoesItem['RELACOESITENS_FATOR'] = relacao['RELACOES_FATOR'];
            }
    
            await samosFB.insert('RELACOESITENS', relacoesItem, params);

            if(relacoesItem['RELACOESITENS_FATOR'] > 0) {
                console.log('fator: ', relacoesItem['RELACOESITENS_FATOR'], ' Produto: ', item['MOVIMENTOSITENS_ID_PRODUTOS'])
                try {
                    await samosFB.executeSQL(`
                        update MOVIMENTOSITENS set 
                            MOVIMENTOSITENS_QUANTIDADE = ${parseInt(item['MOVIMENTOSITENS_QUANTIDADE'] * relacoesItem['RELACOESITENS_FATOR'] * 1000) / 1000},
                            MOVIMENTOSITENS_PRECO      = ${parseInt(item['MOVIMENTOSITENS_TOTAL'] / item['MOVIMENTOSITENS_QUANTIDADE'] * relacoesItem['RELACOESITENS_FATOR'] * 10000000) / 10000000}
                        where MOVIMENTOSITENS_ID = ${item['MOVIMENTOSITENS_ID']}
                    `, params);
                } catch (error) {
                    console.log(error);
                    throw 'Erro ao atualizar quantidade e preço itens';
                }
            }
        } catch (error) {
            console.log(error);
            throw 'Erro ao fazer relação dos itens';
        }

        if(jsonXMLItem.prod.rastro) {
            try {
                const lote = {
                    'LOTES_STATUS'       : 'T',
                    'LOTES_ID_EMPRESAS'  : params.empresaLogada,
                    'LOTES_ID_PRODUTOS'  : idProduto,
                    'LOTES_REFERENCIA'   : jsonXMLItem.prod.rastro.nLote._text.slice(0, 20),
                    'LOTES_NOME'         : (jsonXMLItem.prod.xProd._text || '').slice(0, 50),
                    'LOTES_LOCALIZACAO'  : '',
                    'LOTES_EMISSAO'      : moment().format('YYYY-MM-DD'),
                    'LOTES_FABRICACAO'   : jsonXMLItem.prod.rastro.dFab._text,
                    'LOTES_VALIDADE'     : jsonXMLItem.prod.rastro.dVal._text,
                    'LOTES_QUANTIDADE'   : jsonXMLItem.prod.rastro.qLote._text,
                    'LOTES_SALDO'        : jsonXMLItem.prod.rastro.qLote._text,
                };

                const loteGravado = await samosFB.insert('LOTES', lote, params);                
                idLoteItem = loteGravado['LOTES_ID'] || 0;
                
                if(idLoteItem > 0 && idItemMovimento > 0) { // Atualiza o ID do lote
                    await samosFB.executeSQL(`update MOVIMENTOSITENS set MOVIMENTOSITENS_ID_LOTES = ${idLoteItem} where MOVIMENTOSITENS_ID = ${idItemMovimento}`, params);
                }
        
            } catch (error) {
                console.log(error);
            }
        }
    }

    const dups = (!jsonXML.nfeProc.NFe.infNFe.cobr || !jsonXML.nfeProc.NFe.infNFe.cobr.dup) ? [] :
                    jsonXML.nfeProc.NFe.infNFe.cobr.dup[0] ? 
                    jsonXML.nfeProc.NFe.infNFe.cobr.dup    : 
                    [jsonXML.nfeProc.NFe.infNFe.cobr.dup];
                

    if (dups.length > 0) {
        for (let i in dups) {
            const jsonXMLFinanceiro = dups[i];

            const financeiro = {
                'FINANCEIROS_TIPO'          : 'P',
                'FINANCEIROS_STATUS'        : 'A',
                'FINANCEIROS_ID_EMPRESAS'   : empresa['EMPRESAS_ID'],
                'FINANCEIROS_ID_DOCUMENTOS' : `${empresa['EMPRESAS_ID']}0009`,
                'FINANCEIROS_ID_MOVIMENTOS' : movimento['MOVIMENTOS_ID'],
                'FINANCEIROS_ID_USUARIOS'   : movimento['MOVIMENTOS_ID_USUARIOS'],
                'FINANCEIROS_ID_PESSOAS'    : movimento['MOVIMENTOS_ID_PESSOAS'],
                'FINANCEIROS_ID_PORTADORES' : 1,
                'FINANCEIROS_ID_PRAZOS'     : movimento['MOVIMENTOS_ID_PRAZOS'],
                'FINANCEIROS_ID_APLICACOES' : 1,
                'FINANCEIROS_ID_CUSTOS'     : 1,
                'FINANCEIROS_PARCELA'       : parseInt(i) + 1,
                'FINANCEIROS_PARCELAS'      : dups.length,
                'FINANCEIROS_NOSSONUMERO'   : 0,
                'FINANCEIROS_EMISSAO'       : movimento['MOVIMENTOS_EMISSAO'],
                'FINANCEIROS_VENCIMENTO'    : jsonXMLFinanceiro.dVenc._text || '1899-12-30',
                'FINANCEIROS_PAGAMENTO'     : '1899-12-30',
                'FINANCEIROS_BAIXA'         : '1899-12-30',
                'FINANCEIROS_ORIGINAL'      : jsonXMLFinanceiro.vDup._text || 0,
                'FINANCEIROS_ABERTO'        : jsonXMLFinanceiro.vDup._text || 0,
                'FINANCEIROS_DESCONTOS'     : 0,
                'FINANCEIROS_JUROS'         : 0,
                'FINANCEIROS_TAXAS'         : 0,
                'FINANCEIROS_PAGO'          : 0,
                'FINANCEIROS_TOTAL'         : movimento['MOVIMENTOS_TOTAL'],
                'FINANCEIROS_OBSERVACOES'   : '',
                'FINANCEIROS_EXPORTADO'     : 'T',
                'FINANCEIROS_LOG'           : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
                'FINANCEIROS_NUMERO'        : movimento['MOVIMENTOS_NUMERO'],
                'FINANCEIROS_SERIE'         : movimento['MOVIMENTOS_SERIE']
            }

            try {
                await samosFB.insert('FINANCEIROS', financeiro, params);
            } catch (error) {
                console.log('Erro ao incluir financeiro');
                console.log(error);
            }
        }
    }

    return {
        success: true,
        caminho: movimento['MOVIMENTOS_ID'],
        retorno: ''
    };
}

async function incluiPessoa(jsonXML, empresa, params) {
    const cidadesId = await achaCidades(jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.cMun._text, params);
    const nomeFantasia = jsonXML.nfeProc.NFe.infNFe.emit.xFant ? 
                         jsonXML.nfeProc.NFe.infNFe.emit.xFant._text : '';
    const pessoa = {
        'PESSOAS_STATUS'            : 'T',
        'PESSOAS_TIPO'              : 'C',
        'PESSOAS_CPFCNPJ'           : jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text,
        'PESSOAS_INSCRICAO'         : jsonXML.nfeProc.NFe.infNFe.emit.IE._text,
        'PESSOAS_CADASTRO'          : moment().format('YYYY-MM-DD'),
        'PESSOAS_NASCIMENTO'        : moment().format('YYYY-MM-DD'),
        'PESSOAS_VALIDADE'          : moment().add(1, 'year').format('YYYY-MM-DD'),
        'PESSOAS_NOME'              : (jsonXML.nfeProc.NFe.infNFe.emit.xNome._text             || '').slice(0, 50),
        'PESSOAS_FANTASIA'          : nomeFantasia.slice(0, 50),
        'PESSOAS_CEP'               : jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.CEP._text      || '',
        'PESSOAS_ENDERECO'          : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xLgr._text    || '').slice(0, 50),
        'PESSOAS_NUMERO'            : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.nro._text     || '').slice(0, 10),
        'PESSOAS_BAIRRO'            : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xBairro._text || '').slice(0, 10),
        'PESSOAS_EMAIL'             : '',
        'PESSOAS_PAGINA'            : '',
        'PESSOAS_ID_CIDADES'        : cidadesId,
        'PESSOAS_ID_PAISES'         : 31,
        'PESSOAS_ID_EMPRESAS'       : empresa['EMPRESAS_ID'],
        'PESSOAS_TELEFONE'          : '',
        'PESSOAS_CELULAR'           : '',
        'PESSOAS_ID_USUARIOS'       : 1,
        'PESSOAS_CEPCOBRANCA'       : jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.CEP._text      || '',
        'PESSOAS_ENDERECOCOBRANCA'  : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xLgr._text    || '').slice(0, 50),
        'PESSOAS_NUMEROCOBRANCA'    : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.nro._text     || '').slice(0, 10),
        'PESSOAS_BAIRROCOBRANCA'    : (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.xBairro._text || '').slice(0, 10),
        'PESSOAS_ID_CIDADESCOBRANCA': cidadesId,
        'PESSOAS_TELEFONECOBRANCA'  : '',
        'PESSOAS_CELULARCOBRANCA'   : '',
        'PESSOAS_CATEGORIA'         : '1',
        'PESSOAS_CREDITO'           : 0,
        'PESSOAS_INCLUSAO'          : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'PESSOAS_LOG'               : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'PESSOAS_OBSERVACOES'       : ''
    }

    try {
        await samosFB.insert('PESSOAS', pessoa, params);
        return pessoa;        
    } catch (error) {
        console.log('Erro ao incluir fornecedor');
        console.log(error);
        throw 'Erro ao incluir fornecedor';
    }
}

async function achaCidades(ibge, params){
    try {
        const queryCidades = await samosFB.executeSQL(`select * from CIDADES where CIDADES_IBGE = ${ibge}`, params)
        
        if(queryCidades[0]) {
            return queryCidades[0]['CIDADES_ID'];
        }
    } catch (error) {
        console.log('Erro ao achar cidade');
        console.log(error);
    }

    return 6011;
}

async function verificaCfop(jsonXML, jsonXMLItem, empresa) {
    const cfop = jsonXMLItem.prod.CFOP._text;

    let idOperacao;

    if (jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.UF._text == empresa['CIDADES_ESTADO']) {
        if (cfop.slice(0, 1) == '5') {
            idOperacao = '1' + cfop.slice(1,4) + '00' == '140500' ? '140300' : '1' + cfop.slice(1,4) + '00';
            
        } else {
            if (cfop.slice(0, 1) == '7') {
                idOperacao = '3' + cfop.slice(1,4) + '00';
            } else {
                idOperacao = cfop + '00';
            }
        }

        if (idOperacao == 110100 || idOperacao == 110500) {
            idOperacao = 110200 ;
        }

        if (idOperacao == 140100) {
            idOperacao = 140300 ;
        }

    } else {
        if (cfop.slice(0, 1) == '6') {
            idOperacao = '2' + cfop.slice(1,4) + '00' == '240400' ? '240300' : '2' + cfop.slice(1,4) + '00';

        } else {
            if (cfop.slice(0, 1) == '7') {
                idOperacao = '3' + cfop.slice(1,4) + '00';
            } else {
                idOperacao = cfop + '00';
            }
        }
        if (idOperacao == 210100 || idOperacao == 210500) {
            idOperacao = 210200;
        }
    }

    return idOperacao;
}

async function verificaProduto999999(params) {
    const queryProduto999999 = await samosFB.executeSQL(`select * from  PRODUTOS where PRODUTOS_ID = 999999`, params);
    
    if(!queryProduto999999[0]) {
        const produto999999 = {
            'PRODUTOS_ID'           : 999999,
            'PRODUTOS_STATUS'       : 'F',
            'PRODUTOS_BARRA'        : '',
            'PRODUTOS_FABRICA'      : '',
            'PRODUTOS_MARCA'        : '',
            'PRODUTOS_APLICACAO'    : '',
            'PRODUTOS_UNIDADE'      : 'PC',
            'PRODUTOS_NOME'         : '',
            'PRODUTOS_DESCRICAO'    : '',
            'PRODUTOS_ID_GRUPOS'    : 0,
            'PRODUTOS_ID_PESSOAS'   : 0,
            'PRODUTOS_INVENTARIO'   : '',
            'PRODUTOS_LISTAPRECO'   : '',
            'PRODUTOS_PESOLIQUIDO'  : 0,
            'PRODUTOS_PESOBRUTO'    : 0,
            'PRODUTOS_ID_NCMS'      : 1,
            'PRODUTOS_DERIVADO'     : 'F',
            'PRODUTOS_ID_MONTAGENS' : 0
        }

        try {
            await samosFB.insert('PRODUTOS', produto999999, params);
        } catch (error) {
            console.log('Erro ao incluir produto 999999');
            console.log(error);
        }
    }
}

async function verificaProduto(idPessoa, idProdutoXML, fabricaXML, ncmXML, params) {
    let idProduto = 999999;

    try {
        const queryRelacoesProduto = await samosFB.executeSQL(`
            select RELACOES_ID_PRODUTOS from RELACOES where
                RELACOES_ID_PESSOAS = ${idPessoa} and
                RELACOES_FABRICA LIKE '%${(idProdutoXML || '').slice(0, 20)}%'
        `, params);
    
        if(queryRelacoesProduto[0]) {
            idProduto = queryRelacoesProduto[0]['RELACOES_ID_PRODUTOS'];
        }
    
        const queryRelacoesFabrica = await samosFB.executeSQL(`
            select RELACOES_ID_PRODUTOS from RELACOES where
                RELACOES_ID_PESSOAS = ${idPessoa} and
                RELACOES_FABRICA LIKE '%${(fabricaXML || '').slice(0, 15)}%'
        `, params);
    
        if(queryRelacoesFabrica[0]) {
            idProduto = queryRelacoesFabrica[0]['RELACOES_ID_PRODUTOS'];
        }
        
    } catch (error) {
        console.log('Erro ao verificar produto');
        console.log(error);
    }

    if(idProduto != 999999) {
        try {
            const queryNCM = await samosFB.executeSQL(`
                select NCMS_NCM from NCMS 
                join  PRODUTOS on NCMS_ID = PRODUTOS_ID_NCMS
                where PRODUTOS_ID = ${idProduto}
            `, params);
    
            if(queryNCM[0] && queryNCM[0]['NCMS_NCM'] != ncmXML) {
                criarNotificacao(`Produto ${idProduto} com NCM diferente do XML. NCM Cadastrado: ${queryNCM[0]['NCMS_NCM']} | NCM XML: ${ncmXML} `, params);
            }
        } catch (error) {
            console.log(error);//loga o erro mas não para a importação
        }
    }

    return idProduto;//se chegar aqui é pq não encontrou relação
}

async function verificaPrazos(nParcelas, params) {
    let idPrazos = 2;

    try {
        const queryPrazos = await samosFB.executeSQL(`
            select 
                PRAZOS_ID,
                PRAZOS_PARCELAS
            from PRAZOS 
            order by PRAZOS_ID`, params);
    
        if(queryPrazos[0]) {
            const prazoSelecionado = queryPrazos.find(prazo => {
                return prazo['PRAZOS_ID'] > 9 && prazo['PRAZOS_PARCELAS'] == nParcelas;
            });
    
            idPrazos = prazoSelecionado ? prazoSelecionado['PRAZOS_ID'] : idPrazos;
        }
    } catch (error) {
        console.log('Erro ao verificar prazos');
        console.log(error);
    }
    
    return idPrazos;
}

async function criarNotificacao (msg, params) {
    const usuariosNotificar = [1, params.userId];
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const hora = moment.tz(params.timezone).format('HH:mm');

    const notificacoes = usuariosNotificar.map(usuarioId => {
        return {
            'NOTIFICACAO_STATUS'      : 'N',
            'NOTIFICACAO_TODOS'       : 'F',
            'NOTIFICACAO_ID_USUARIOS' : params.userId,
            'NOTIFICACAO_ID_DESTINO'  : usuarioId,
            'NOTIFICACAO_NOME'        : 'NCM NFE',
            'NOTIFICACAO_DATACRIACAO' : hoje,
            'NOTIFICACAO_HORACRIACAO' : hora,
            'NOTIFICACAO_DATAAVISAR'  : hoje,
            'NOTIFICACAO_HORAAVISAR'  : hora,
            'NOTIFICACAO_DATALEITURA' : '30.12.1899',
            'NOTIFICACAO_HORALEITURA' : '',
            'NOTIFICACAO_MENSAGEM'    : msg,
            'NOTIFICACAO_SMS'         : 'F'
        }
    })
    
    await api.notificacao().lote.create(notificacoes, params);
}