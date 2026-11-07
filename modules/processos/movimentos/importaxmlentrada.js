'use strict';

const fs      = require('fs');
const mkdirp  = require('mkdirp');
const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');
const xmlJS   = require('xml-js');
const api     = require('../../../modules');
const cents   = utils.number.cents.bind(utils.number);
const path    = require('path');
const appRoot = path.dirname(require.main.filename);

module.exports = {
    create: async (data, params) => {
        try {
            const { xml } = data;

            const queryEmpresa = await samosFB.executeSQL(`
                select 
                    EMPRESAS_ID,
                    EMPRESAS_CPFCNPJ,
                    EMPRESAS_SIMPLES,
                    CIDADES_ESTADO
                from EMPRESAS 
                join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
                where EMPRESAS_ID = ${params.empresaLogada}
            `, params);

            const empresa = queryEmpresa[0];

            if (xml) {
                const jsonXML = JSON.parse(xmlJS.xml2json(xml, { compact: true }));

                if (jsonXML.nfeProc.NFe.infNFe.dest.CNPJ._text != empresa['EMPRESAS_CPFCNPJ']) {
                    throw `CNPJ do destinatário no XML não corresponde à empresa logada no sistema`;
                }        

                const chaveXML = (jsonXML.nfeProc.NFe.infNFe._attributes.Id   || 'chave');
                const ano = '20' + (jsonXML.nfeProc.NFe.infNFe._attributes.Id   || '').replace(/NFe/ig, '').slice(2, 4);
                const mes = (jsonXML.nfeProc.NFe.infNFe._attributes.Id   || '').replace(/NFe/ig, '').slice(4, 6);
                const caminhoXML = params.client ? `/public/xmlentrada/${empresa['EMPRESAS_CPFCNPJ']}/${ano}/${mes}/` : `/public/xmlentrada/${ano}/${mes}/`;
                const caminho      = `${appRoot}${caminhoXML}`;

                if (!fs.existsSync(caminho)){
                    await mkdirp(caminho);
                }

                require('fs').writeFileSync(`${caminho}/${chaveXML}.xml`, xml);
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

    const isBellar  = (params.client || '').toUpperCase().match(/BELLAR/);

    const cadastrarProdutos = process.env[params.client ? ((params.client || '').toUpperCase() + '_INSERIR_PRODUTOXML') : 'INSERIR_PRODUTOXML'] == 'TRUE' ? 'TRUE' : '';

    if(!cadastrarProdutos) {               // somente verifica se nao estiver habilitado para cadastrar - Silas
      await verificaProduto999999(params); // Verifica se produto 99999 existe
    }

    let cnpEmitente = jsonXML.nfeProc.NFe.infNFe.emit.CNPJ ? 
                      jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text :
                      jsonXML.nfeProc.NFe.infNFe.emit.CPF._text;

    const queryMovimento = await samosFB.executeSQL(`
        select MOVIMENTOS_ID from MOVIMENTOS where 
            MOVIMENTOS_ID_EMPRESAS   = '${empresa['EMPRESAS_ID']}'                     and
            MOVIMENTOS_ID_DOCUMENTOS = '${empresa['EMPRESAS_ID']}0005'                 and
            MOVIMENTOS_CPFCNPJ       = '${cnpEmitente}' and
            MOVIMENTOS_NUMERO        = '${jsonXML.nfeProc.NFe.infNFe.ide.nNF._text}'   and
            MOVIMENTOS_SERIE         = 'NFE'
    `, params);

    if(queryMovimento[0]) {
        const movimento = queryMovimento[0];

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
            PESSOAS_CPFCNPJ = '${cnpEmitente}'
        order by PESSOAS_ID
    `, params);

    const pessoa = queryPessoa[0] || await incluiPessoa(jsonXML, empresa, params);
    const operacaoXML = await verificaCfop(jsonXML, jsonXML.nfeProc.NFe.infNFe.det[0] || jsonXML.nfeProc.NFe.infNFe.det, empresa); //operação primeiro item
    const queryOperacao = await samosFB.executeSQL(`select OPERACOES_ID from OPERACOES where OPERACOES_ID = ${operacaoXML}`, params);

    const operacaoPadrao = empresa['EMPRESAS_CPFCNPJ'].slice(0, 8) == '05971492' ? // Biomart
                           '110100' : '110200';

    const operacao = queryOperacao.length > 0 ? operacaoXML : operacaoPadrao;
    const situacaoNfe = process.env[params.client ? ((params.client || '').toUpperCase() + '_ATUALIZACUSTO') : 'ATUALIZACUSTO'] == 1 ? '1' : '0';
    let descontoXML  = cents(jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vDesc._text);
    let desonicmXML  = cents(jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vICMSDeson._text);
    let obsXML = (jsonXML.nfeProc.NFe.infNFe.infAdic || {}).infCpl ?
                 jsonXML.nfeProc.NFe.infNFe.infAdic.infCpl._text : '';

    let obsGravar = dividirStringEmPipeline(utils.string.removerEspeciais(utils.string.removerAcentos(obsXML)));

    const movimento = {
        'MOVIMENTOS_ID_EMPRESAS'     : empresa['EMPRESAS_ID'],
        'MOVIMENTOS_ID_PESSOAS'      : pessoa['PESSOAS_ID'],
        'MOVIMENTOS_ID_USUARIOS'     : (params.userId || 1),
        'MOVIMENTOS_ID_OPERACOES'    : operacao,
        'MOVIMENTOS_ID_PRAZOS'       : await verificaPrazos(jsonXML.nfeProc.NFe.infNFe.cobr && jsonXML.nfeProc.NFe.infNFe.cobr.dup && jsonXML.nfeProc.NFe.infNFe.cobr.dup[0] ? jsonXML.nfeProc.NFe.infNFe.cobr.dup.length : 1, params),
        'MOVIMENTOS_ID_DOCUMENTOS'   : `${empresa['EMPRESAS_ID']}0005`,
        'MOVIMENTOS_ID_APLICACOES'   : 1,
        'MOVIMENTOS_ID_CUSTOS'       : 1,
        'MOVIMENTOS_NUMERO'          : jsonXML.nfeProc.NFe.infNFe.ide.nNF._text,
        'MOVIMENTOS_SERIE'           : 'NFE',
        'MOVIMENTOS_EMISSAO'         : (jsonXML.nfeProc.NFe.infNFe.ide.dhEmi._text || '1899-12-30').slice(0, 10),
        'MOVIMENTOS_HORA'            : moment().format('HH:mm:ss'),
        'MOVIMENTOS_ENTRADASAIDA'    : (empresa['EMPRESAS_CPFCNPJ'] == '05133494000104' ? (jsonXML.nfeProc.NFe.infNFe.ide.dhEmi._text || '1899-12-30').slice(0, 10) : moment().format('YYYY-MM-DD')),
        'MOVIMENTOS_PRODUTOS'        : jsonXML.nfeProc.NFe.infNFe.total.ICMSTot.vProd._text,
        'MOVIMENTOS_PERCENTUAL'      : 0,
        'MOVIMENTOS_DESCONTOS'       : ((descontoXML + desonicmXML) / 100) ,
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
        'MOVIMENTOS_OBSERVACOES'     : obsGravar,
        'MOVIMENTOS_STATUS'          : 'N',
        'MOVIMENTOS_LOG'             : `IMPORTADO NFE ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        'MOVIMENTOS_EMAIL'           : (pessoa['PESSOAS_EMAIL'] || '').slice(0, 50),
        'MOVIMENTOS_IMPOSTO'         : 0,
        'MOVIMENTOS_NOME'            : (pessoa['PESSOAS_NOME']    || '').slice(0, 50),
        'MOVIMENTOS_CPFCNPJ'         : (pessoa['PESSOAS_CPFCNPJ'] || '').slice(0, 15),
        'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
        'MOVIMENTOS_NUMEROORIGEM'    : 0,
        'MOVIMENTOS_SERIEORIGEM'     : '',
        'MOVIMENTOS_SITUACAO'        : situacaoNfe
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
        const produtoVerificado = await verificaProduto(movimento['MOVIMENTOS_ID_PESSOAS'], jsonXMLItem.prod.cProd._text, jsonXMLItem.prod.cEAN._text, jsonXMLItem.prod.NCM._text, params);
        let idProduto = produtoVerificado.idProduto;

        if(idProduto == 999999 && cadastrarProdutos && !produtoVerificado.conflito) { // Se não achou o produto e tá configurado pra cadastrar
            const produtoCadastrado = await incluiProduto(jsonXMLItem, params);
            if(produtoCadastrado) {
                idProduto = produtoCadastrado.PRODUTOS_ID;
            }
        }

        let   idItemMovimento = 0;  // ID do MOVIMENTOSITENS
        let   idLoteItem = 0;       // ID do LOTES
        let   idOperacaoItem = await verificaCfop(jsonXML, jsonXMLItem, empresa);
        const queryOperacaoItem = await samosFB.executeSQL(`select OPERACOES_ID from OPERACOES where OPERACOES_ID = ${idOperacaoItem}`, params);
        let   queryProduto = '';
        let   cstPisProduto = '';

        let   descontoNormal = (jsonXMLItem.prod.vDesc || {})._text || 0;
        let   descontoDesone = 0;

        let cstPis = jsonXMLItem.imposto.PIS.PISNT ? (jsonXMLItem.imposto.PIS.PISNT.CST._text || '99') :
                     ((((jsonXMLItem.imposto.PIS || {}).PISAliq    || {}).CST  || {})._text || '99');

        let cstCofins = jsonXMLItem.imposto.COFINS.COFINSNT ? (jsonXMLItem.imposto.COFINS.COFINSNT.CST._text || '99') :
                        ((((jsonXMLItem.imposto.COFINS || {}).COFINSAliq || {}).CST  || {})._text || '99');

        if(idProduto != 999999 && empresa['EMPRESAS_CPFCNPJ'].slice(0, 8) == '64607922') { // Busca o produto pra ajustar o CST PIS/COFINS Raçaforte
            queryProduto = await samosFB.executeSQL(`select PRODUTOS_ID, PRODUTOS_DESCRICAO from PRODUTOS where PRODUTOS_ID = ${idProduto}`, params);
            if((queryProduto || []).length > 0) {
                if((queryProduto[0]['PRODUTOS_DESCRICAO'] || '').slice(0, 2).match(/04|06/)) {
                    cstPis = '73';
                }
                if((queryProduto[0]['PRODUTOS_DESCRICAO'] || '').slice(0, 2) ==  '05') {
                    cstPis = '75';
                }                
            }
        }

        const item = {
            'MOVIMENTOSITENS_ID'            : (parseInt(i) + 1) * -1,
            'MOVIMENTOSITENS_ID_MOVIMENTOS' : movimento['MOVIMENTOS_ID'],
            'MOVIMENTOSITENS_ID_OPERACOES'  : (queryOperacaoItem.length > 0 ? idOperacaoItem : operacaoPadrao),
            'MOVIMENTOSITENS_ID_PRODUTOS'   : idProduto,
            'MOVIMENTOSITENS_QUANTIDADE'    : isBellar ? jsonXMLItem.prod.qCom._text : jsonXMLItem.prod.qTrib._text,
            'MOVIMENTOSITENS_CUSTO'         : 0,
            'MOVIMENTOSITENS_PRECO'         : isBellar ? jsonXMLItem.prod.vUnCom._text : jsonXMLItem.prod.vUnTrib._text,
            'MOVIMENTOSITENS_PERCENTUAL'    : 0,
            'MOVIMENTOSITENS_DESCONTOS'     : ((cents(descontoNormal) + cents(descontoDesone)) / 100),
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
            'MOVIMENTOSITENS_CSTPIS'        : cstPis,
            'MOVIMENTOSITENS_BASEPIS'       : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).vBC  || {})._text || 0,
            'MOVIMENTOSITENS_VALORPIS'      : (((jsonXMLItem.imposto.PIS     || {}).PISAliq    || {}).vPIS || {})._text || 0, 
            'MOVIMENTOSITENS_VALORPISST'    : ((jsonXMLItem.imposto.PISST    || {}).vPIS       || {})._text  || 0,
            'MOVIMENTOSITENS_ALIQUOTACOFINS': (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).pCOFINS || {})._text || 0,
            'MOVIMENTOSITENS_CSTCOFINS'     : cstCofins,
            'MOVIMENTOSITENS_BASECOFINS'    : (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).vBC     || {})._text || 0,
            'MOVIMENTOSITENS_VALORCOFINS'   : (((jsonXMLItem.imposto.COFINS  || {}).COFINSAliq || {}).vCOFINS || {})._text || 0,
            'MOVIMENTOSITENS_VALORCOFINSST' : ((jsonXMLItem.imposto.COFINSST || {}).vCOFINS    || {})._text || 0,
            'MOVIMENTOSITENS_ID_EMPRESAS'   : jsonXMLItem._attributes.nItem || movimento['MOVIMENTOS_ID_EMPRESAS'], // NItem - Controle para vinculo com pedido de compra
            'MOVIMENTOSITENS_ESCRITURACAO'  : '4',
            'MOVIMENTOSITENS_EXCECAO'       : '0',
            'MOVIMENTOSITENS_ENTREGUE'      : 0,
            'MOVIMENTOSITENS_DEPOSITO'      : 0,
            'MOVIMENTOSITENS_IMEDIATA'      : 0,
            'MOVIMENTOSITENS_DATAENTREGA'   : (jsonXML.nfeProc.NFe.infNFe.ide.dhEmi._text || '1899-12-30').slice(0,10),
            'MOVIMENTOSITENS_HORAENTREGA'   : jsonXMLItem.prod.rastro && jsonXMLItem.prod.rastro.nLote ? jsonXMLItem.prod.rastro.nLote._text.slice(0, 10) : '',
            'MOVIMENTOSITENS_HORAMONTAGEM'  : jsonXMLItem.prod.NCM._text || ''
        }


        const icms00 = jsonXMLItem.imposto.ICMS[icmsKey] || {};

        if (jsonXML.nfeProc.NFe.infNFe.emit.CRT._text == '2' || 
            jsonXML.nfeProc.NFe.infNFe.emit.CRT._text == '3') {
            item['MOVIMENTOSITENS_CST'] = `${(icms00.orig || {})._text || ''}${(icms00.CST || {})._text || '090'}`;
            if ((icms00.vICMS || {})._text > 0) {
                item['MOVIMENTOSITENS_ICMS']      = (icms00.pICMS || {})._text || 0;
                item['MOVIMENTOSITENS_BASEICMS']  = (icms00.vBC   || {})._text || 0;
                item['MOVIMENTOSITENS_VALORICMS'] = (icms00.vICMS || {})._text || 0;                
            }
            descontoDesone = (icms00.vICMSDeson || {})._text || 0;
        } else {
            item['MOVIMENTOSITENS_CST'] = `${(icms00.orig || {})._text || ''}${(icms00.CSOSN || {})._text || '0900'}`;
            item['MOVIMENTOSITENS_ICMS']      = (icms00.pICMS || {})._text || 0;
            item['MOVIMENTOSITENS_BASEICMS']  = (icms00.vBC   || {})._text || 0;
            item['MOVIMENTOSITENS_VALORICMS'] = (icms00.vICMS || {})._text || 0;
            descontoDesone = (icms00.vICMSDeson || {})._text || 0;            
        }

        // Atualização cadastral independente do CST gravado no item da nota.
        // Falhas fiscais não impedem a importação do documento.
        //await atualizarTributacaoSaldoXML(jsonXMLItem, jsonXML, empresa, idProduto, params); // BLOQUEADO POR ENQUANTO, TESTAR COM MAIS CALMA DEPOIS

        item['MOVIMENTOSITENS_DESCONTOS'] = ((cents(descontoNormal) + cents(descontoDesone))/100);
        item['MOVIMENTOSITENS_DESCONTOS'] = cents(item['MOVIMENTOSITENS_DESCONTOS']) > 0 ? (cents(item['MOVIMENTOSITENS_DESCONTOS'])/100) : 0;

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
                'RELACOESITENS_ID_ITENS'     : idItemMovimento,
                'RELACOESITENS_NOME'         : (jsonXMLItem.prod.xProd._text || '').slice(0, 50),
                'RELACOESITENS_FABRICA'      : (jsonXMLItem.prod.cProd._text || '').slice(0, 20),
                'RELACOESITENS_BARRAS'       : (jsonXMLItem.prod.cEAN._text  || '').slice(0, 15),
                'RELACOESITENS_SIGLA'        : isBellar ? (jsonXMLItem.prod.uCom._text || '').slice(0, 10) : (jsonXMLItem.prod.uTrib._text || '').slice(0, 10),
                'RELACOESITENS_FATOR'        : 1
            };
            
            const queryRelacoes = await samosFB.executeSQL(`
                select RELACOES_SIGLA, RELACOES_FATOR from RELACOES where 
                    RELACOES_ID_PESSOAS  = ${movimento['MOVIMENTOS_ID_PESSOAS']} and
                    RELACOES_ID_PRODUTOS = ${item['MOVIMENTOSITENS_ID_PRODUTOS']}
            `, params);
    
            if(idProduto != 999999 && queryRelacoes[0]) {
                const relacao = queryRelacoes[0];
    
                relacoesItem['RELACOESITENS_SIGLA'] = relacao['RELACOES_SIGLA'];
                relacoesItem['RELACOESITENS_FATOR'] = relacao['RELACOES_FATOR'];
            }
    
            await samosFB.insert('RELACOESITENS', relacoesItem, params);

            if(relacoesItem['RELACOESITENS_FATOR'] > 0) {
                try {
                    let qtdeConvertida = parseFloat(item['MOVIMENTOSITENS_QUANTIDADE'] * relacoesItem['RELACOESITENS_FATOR'] * 1000) / 1000;
                    let precoConvertido = (parseFloat(item['MOVIMENTOSITENS_TOTAL']) / qtdeConvertida);

                    await samosFB.executeSQL(`
                        update MOVIMENTOSITENS set 
                            MOVIMENTOSITENS_QUANTIDADE = ${qtdeConvertida},
                            MOVIMENTOSITENS_PRECO      = ${precoConvertido}
                        where MOVIMENTOSITENS_ID = ${idItemMovimento}
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
                    'LOTES_LOCALIZACAO'  : (empresa['EMPRESAS_CPFCNPJ'] == '00123727000166' ? 'ISENTO' : ''),
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
                'FINANCEIROS_EMISSAO'       : empresa['EMPRESAS_CPFCNPJ'] == '64607922000144' ? movimento['MOVIMENTOS_ENTRADASAIDA'] : movimento['MOVIMENTOS_EMISSAO'],
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

// Regras operacionais aprovadas: XML como referência para retirada de ST.
// Conversões não explicitadas permanecem pendentes de conferência manual.
async function atualizarTributacaoSaldoXML(xmlItem, xmlNota, empresa, idProduto, params) {
    if (!idProduto || Number(idProduto) === 999999) return;

    const texto = (obj) => String(obj?._text ?? '').trim();
    const ufEmpresa = String(empresa. CIDADES_ESTADO || '').trim().toUpperCase();
    const ufFornecedor = texto(xmlNota.nfeProc.NFe.infNFe.emit.enderEmit.UF).toUpperCase();
    if (!ufEmpresa || !ufFornecedor) return;

    const campo = ufEmpresa === ufFornecedor ? 'SALDOS_CSTLOCAL' : 'SALDOS_CSTOUTROS';
    const simples = ['T', '0', 'A', 'B'].includes(String(empresa.EMPRESAS_SIMPLES ?? '').trim().toUpperCase());
    const icms = xmlItem.imposto?.ICMS || {};
    const grupo = icms[Object.keys(icms)[0]] || {};
    const origem = texto(grupo.orig);
    const cst = texto(grupo.CST);
    const csosn = texto(grupo.CSOSN);
    const recebido = origem && (cst || csosn) ? origem + (cst || csosn) : '';
    if (!/^[0-8]$/.test(origem) || !(cst || csosn)) return;

    try {
        const rows = await samosFB.executeSQL(`
            SELECT SALDOS_CSTLOCAL, SALDOS_CSTOUTROS,
                   SALDOS_ICMSLC, SALDOS_ICMS01, SALDOS_ICMS02
            FROM SALDOS
            WHERE SALDOS_ID_EMPRESAS = ${Number(empresa.EMPRESAS_ID)}
              AND SALDOS_ID_PRODUTOS = ${Number(idProduto)}
        `, params);
        if (!rows?.length) return;
        const saldo = rows[0];
        const atual = String(saldo[campo] ?? '').trim();
        let novo = null;
        let transicaoST = false;
        const anteriorST = simples ? atual.slice(1) === '500' : atual.slice(1) === '60';

        // Mesma família de código: usar o XML, inclusive ST -> sem ST.
        if (simples && csosn && /^\d{3}$/.test(csosn)) novo = origem + csosn;
        else if (!simples && cst && /^\d{2}$/.test(cst)) novo = origem + cst;
        // Conversões deliberadamente limitadas aos exemplos acordados.
        else if (simples && cst === '60') novo = origem + '500';
        else if (!simples && csosn === '500') novo = origem + '60';
        else if (simples && cst === '00' && anteriorST) novo = origem + '102';
        else if (!simples && csosn === '102' && anteriorST) novo = origem + '00';

        if (!novo) {
            if (atual !== recebido) await notificarDivergenciaFiscal(
                `Produto ${idProduto} NF ${texto(xmlNota.nfeProc.NFe.infNFe.ide.nNF)}: ${campo}=${atual || '(vazio)'}, XML=${recebido}; conversão não definida.`, params);
            return;
        }
        if (novo === atual) return;
        transicaoST = anteriorST && !(simples ? novo.slice(1) === '500' : novo.slice(1) === '60');
        const alteracoes = [`${campo} = '${novo}'`];
        if (transicaoST && !simples) {
            // Padrões operacionais: não substituir alíquotas existentes.
            if (Number(saldo.SALDOS_ICMS01 || 0) === 0) alteracoes.push('SALDOS_ICMS01 = 7');
            if (Number(saldo.SALDOS_ICMS02 || 0) === 0) alteracoes.push('SALDOS_ICMS02 = 12');
        }
        await samosFB.executeSQL(`UPDATE SALDOS SET ${alteracoes.join(', ')}
            WHERE SALDOS_ID_EMPRESAS = ${Number(empresa.EMPRESAS_ID)}
              AND SALDOS_ID_PRODUTOS = ${Number(idProduto)}`, params);
        console.log(`[XML ICMS] Empresa ${empresa.EMPRESAS_ID}, produto ${idProduto}, ${campo}: ${atual} -> ${novo}; XML ${recebido}`);
        if (transicaoST && !simples && Number(saldo.SALDOS_ICMSLC || 0) === 0) {
            await notificarDivergenciaFiscal(`Produto ${idProduto}: saiu da ST, mas SALDOS_ICMSLC está zerado. Conferir alíquota interna e exceções.`, params);
        }
    } catch (erro) {
        console.error('[XML ICMS] Falha ao atualizar SALDOS:', erro);
    }
}

async function notificarDivergenciaFiscal(mensagem, params) {
    try {
        const usuarios = [...new Set([1, params.userId].filter(Boolean))];
        const agora = moment();
        const registros = usuarios.map(id => ({
            NOTIFICACAO_STATUS: 'L', NOTIFICACAO_TODOS: 'F',
            NOTIFICACAO_ID_USUARIOS: params.userId || 1,
            NOTIFICACAO_ID_DESTINO: id, NOTIFICACAO_NOME: 'CST/CSOSN XML',
            NOTIFICACAO_DATACRIACAO: agora.format('YYYY-MM-DD'),
            NOTIFICACAO_HORACRIACAO: agora.format('HH:mm'),
            NOTIFICACAO_DATAAVISAR: agora.format('YYYY-MM-DD'),
            NOTIFICACAO_HORAAVISAR: agora.format('HH:mm'),
            NOTIFICACAO_DATALEITURA: '30.12.1899',
            NOTIFICACAO_HORALEITURA: '', NOTIFICACAO_MENSAGEM: mensagem,
            NOTIFICACAO_SMS: 'F'
        }));
        await api.notificacao().lote.create(registros, params);
    } catch (erro) {
        console.error('[XML ICMS] Falha na notificação:', erro);
    }
}

async function incluiPessoa(jsonXML, empresa, params) {
    const cidadesId = await achaCidades(jsonXML.nfeProc.NFe.infNFe.emit.enderEmit.cMun._text, params);
    const nomeFantasia = jsonXML.nfeProc.NFe.infNFe.emit.xFant ? 
                         jsonXML.nfeProc.NFe.infNFe.emit.xFant._text : '';

    let cnpEmitente = jsonXML.nfeProc.NFe.infNFe.emit.CNPJ ? 
                      jsonXML.nfeProc.NFe.infNFe.emit.CNPJ._text :
                      jsonXML.nfeProc.NFe.infNFe.emit.CPF._text;
   
    const pessoa = {
        'PESSOAS_STATUS'            : 'T',
        'PESSOAS_TIPO'              : 'B',
        'PESSOAS_CPFCNPJ'           : cnpEmitente,
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

async function incluiProduto(jsonXMLItem, params) {
    
    let ncmid = 0;
    const queryNcm = await samosFB.executeSQL(`
        select NCMS_ID from NCMS where 
            NCMS_NCM  = '${jsonXMLItem.prod.NCM._text}'`, params);

    if(queryNcm[0]) {
        ncmid = queryNcm[0]['NCMS_ID'];
    } else {
        ncmid = 1;
     }

    const produto = {
        'PRODUTOS_STATUS'           : 'T',
        'PRODUTOS_NOME'             : (jsonXMLItem.prod.xProd._text || '').slice(0, 100),
        'PRODUTOS_ID_GRUPOS'        : 2,
        'PRODUTOS_ID_PESSOAS'       : 1,
        'PRODUTOS_ID_NCMS'          : ncmid,
        'PRODUTOS_ID_MONTAGENS'     : 1,
        'PRODUTOS_INVENTARIO'       : 'T',
        'PRODUTOS_LISTAPRECO'       : 'T',
        'PRODUTOS_DERIVADO'         : 'F',
        'PRODUTOS_EMBALAGEM'        : 1
    }

    try {
        const produtoInserido = await samosFB.insert('PRODUTOS', produto, params);
        if(produtoInserido) {
            const saldo = {
                'SALDOS_ID_EMPRESAS' : params.empresaLogada,
                'SALDOS_ID_PRODUTOS' : produtoInserido.PRODUTOS_ID,
                'SALDOS_ESCRITURACAO': '2',
                'SALDOS_CUSTO'       : 1,
                'SALDOS_PRECO'       : 0.01,
                'SALDOS_CSTSUBST'    : '000',
                'SALDOS_CSTLOCAL'    : '000',
                'SALDOS_CSTOUTROS'   : '000'
            };
            await samosFB.insert('SALDOS', saldo, params);
        }
        return produtoInserido;        
    } catch (error) {
        console.log('Erro ao incluir produto');
        console.log(error);
        throw 'Erro ao incluir produto';
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
    const isBiomart = empresa['EMPRESAS_CPFCNPJ'].slice(0, 8) == '05971492';

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
            if(isBiomart) {
                idOperacao = 110100 ;
            } else {
                idOperacao = 110200 ;
            }
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
            if(isBiomart) {
                idOperacao = 210100;
            } else {
                idOperacao = 210200;
            }
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

        console.log('criando produto 999999');

        try {
            await samosFB.insert('PRODUTOS', produto999999, params);
        } catch (error) {
            console.log('Erro ao incluir produto 999999');
            console.log(error);
        }
    }
}

async function verificaProduto(idPessoa, idProdutoXML, fabricaXML, ncmXML, params) {
    // O cProd do XML e a chave exata da relacao para este fornecedor.
    // Nao usar LIKE: cProd "17" tambem corresponde indevidamente a "171".
    // Nao pesquisar cEAN em RELACOES_FABRICA: codigo de barras nao e cProd.
    const codigoFornecedor = String(idProdutoXML ?? '').trim();
    const fornecedor = Number(idPessoa);

    if (!codigoFornecedor || codigoFornecedor.length > 20 || !Number.isSafeInteger(fornecedor) || fornecedor <= 0) {
        console.warn('[XML RELACOES] Codigo/fornecedor invalido; item sem associacao automatica');
        return { idProduto: 999999, conflito: false };
    }

    const queryRelacoes = await samosFB.executeSQL(`
        SELECT RELACOES_ID, RELACOES_ID_PRODUTOS
        FROM RELACOES
        WHERE RELACOES_ID_PESSOAS = ?
          AND TRIM(RELACOES_FABRICA) = ?
        ORDER BY RELACOES_ID
    `, [fornecedor, codigoFornecedor], params);

    if (!queryRelacoes.length) return { idProduto: 999999, conflito: false };

    const produtos = [...new Set(queryRelacoes.map(r => Number(r.RELACOES_ID_PRODUTOS)))];
    if (produtos.length !== 1 || !Number.isSafeInteger(produtos[0]) || produtos[0] <= 0) {
        console.warn(`[XML RELACOES] Relacoes conflitantes para fornecedor ${fornecedor}, cProd ${codigoFornecedor}. Item mantido como 999999 para associacao manual.`);
        await verificaProduto999999(params);
        return { idProduto: 999999, conflito: true };
    }

    const idProduto = produtos[0];
    // Divergencia de NCM e apenas informativa; nao altera a associacao.
    try {
        const queryNCM = await samosFB.executeSQL(`
            SELECT NCMS_NCM FROM NCMS
            JOIN PRODUTOS ON NCMS_ID = PRODUTOS_ID_NCMS
            WHERE PRODUTOS_ID = ?
        `, [idProduto], params);
        if (queryNCM[0] && String(queryNCM[0].NCMS_NCM).trim() !== String(ncmXML ?? '').trim()) {
            await criarNotificacao(`Produto ${idProduto} com NCM diferente do XML. NCM Cadastrado: ${queryNCM[0].NCMS_NCM} | NCM XML: ${ncmXML}`, params);
        }
    } catch (error) {
        console.error('[XML RELACOES] Falha ao conferir NCM:', error);
    }

    return { idProduto, conflito: false };
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

function dividirStringEmPipeline(str) {
    const maxTotalLength = 512;
    const maxChunkSize = 49;
    let resultado = '';
    let totalLength = 0;
  
    for (let i = 0; i < str.length && totalLength < maxTotalLength; i += maxChunkSize) {
      const chunk = str.substring(i, i + maxChunkSize);
      if (totalLength + chunk.length > maxTotalLength) {
        break; // Para não ultrapassar o limite de 512 caracteres
      }
      resultado += chunk + '|'; // Adiciona o pipeline
      totalLength += chunk.length + 1; // Conta o tamanho do chunk mais o pipe
    }
  
    // Remove o último pipe
    if (resultado.endsWith('|')) {
      resultado = resultado.slice(0, -1);
    }
  
    return resultado;
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
    
//    await api.notificacao().lote.create(notificacoes, params); BLOQUEADO TEMPORARIAMENTE
}

async function atualizaNcmProduto(idProduto, ncmXML, params) {

    try {
        let idNCM = 0;
        const queryNCM = await samosFB.executeSQL(`
            select NCMS_ID, NCMS_NCM from NCMS where
                NCMS_NCM = '${ncmXML}'`, params);
    
        if(queryNCM[0]) {
            idNCM = queryNCM[0]['NCMS_ID'];
        }

        console.log('atualizando NCM: ', `update PRODUTOS set PRODUTOS_ID_NCMS = ${idNCM} where PRODUTOS_ID = ${idProduto}`);
    
        if(idNCM > 0) {
            await samosFB.executeSQL(`update PRODUTOS set PRODUTOS_ID_NCMS = ${idNCM} 
                                       where PRODUTOS_ID = ${idProduto}`, params);

        }        
    } catch (error) {
        console.log('Erro ao verificar produto');
        console.log(error);
    }
}


