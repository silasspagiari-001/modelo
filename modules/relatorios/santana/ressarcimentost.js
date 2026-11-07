'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: {
                    width: 595.28,
                    height: 1850
                  },
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 27 Cols
                    {
                        style: 'tableExample',
                        table: { //    1   2    3   4   5   6   7   8   9  1x  11  12  13  14  15  16  17  18  19  2x  21  22  23  24  25  26  27
                            widths:  [35, 45, 210, 50, 42, 42, 42, 50, 25, 42, 45, 60, 45, 50, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60],
                            headerRows: 0,
                            body: []
                        },
                        layout: {
                            fillColor: function (i) {
                                return (i % 2 === 0) ? '#F0F0F0' : null;
                            }
                        }
                    }
                ],
                footer: function(page, pages) {
                    return { 
                        stack: [ 
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [15, 10]  // 10, 10
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 8,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 8,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;
            const cents = utils.number.cents.bind(utils.number);					

            let ultimoProduto = 0;
            let ultimoDocumento = 0;
            let numOrdem = 0;
            let numItem  = 0;
            let isEntrada;
            let saldoProduto = 0;
            let valorUnitarioSaldo = '';
            let valorTotalSaldo = '';
            let valorRessarcimento = '';
            let valorComplemento = '';
            let valorCredito = '';
            let soma11 = 0;
            let soma12 = 0;
            let soma13 = 0;
            let soma15 = 0;
            let soma16 = 0;
            let soma17 = 0;
            let soma18 = 0;
            let soma19 = 0;
            let soma20 = 0;
            let soma21 = 0;
            let soma25 = 0;
            let soma26 = 0;
            let soma27 = 0;

            for(let i in dados){

                if(ultimoDocumento != dados[i]['MOVIMENTOS_NUMERO']) {
                    ultimoDocumento = dados[i]['MOVIMENTOS_NUMERO']
                    numItem = 0;
                }

                numOrdem ++
                const seqItemDocumento = await getItemDocumento(db, dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'], dados[i]['MOVIMENTOS_ID']);
                numItem = seqItemDocumento[0]['MOVIMENTOSITENS_SEQUENCIA']; 

                if(ultimoProduto != dados[i]['MOVIMENTOSITENS_ID_PRODUTOS']) { 
                    if(ultimoProduto > 0) {
                        // Totalizadores vão aqui
                        rows.push(
                            [
                                {							
                                    text: '',  // (1)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (2)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (3)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (4)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (5)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (6)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (7)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (8)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (9)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (10)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: soma11,  // (11)
                                    bold: true,
                                    alignment: 'center'
                                },
                                {
                                    text: utils.number.float2moeda(soma12),  // (12)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: soma13,  // (13)
                                    bold: true,
                                    alignment: 'center'
                                },
                                {
                                    text: '',  // (14)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: utils.number.float2moeda(soma15),  // (15)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma16),  // (16)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma17),  // (17)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma18),  // (18)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma19),  // (19)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma20),  // (20)
                                    bold: true,
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(soma21),  // (21)
                                    bold: true,
                                    alignment: 'center'
                                },
                                {
                                    text: '', // (22)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (23)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (24)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '', // (25)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (26)
                                    border: [false, false, false, false]
                                },
                                {
                                    text: '',  // (27)
                                    border: [false, false, false, false]
                                }
                            ]    
                        );
                        // Fim dos totalizadores
                        rows.push([{pageBreak: 'after', text: '', colSpan: 27, border: [false, false, false, false]},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}])
                    }
                    // Inicio do cabeçalho de cada produto
                    rows.push(		
                        [
                            {							
                                text: 'Ficha 3',
                                colSpan: 27,
                                bold: true,
                                fontSize: 10,
                                alignment: 'center',
                                border: [false, false, false, false],
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {							
                                text: [
                                    {
                                        text: 'CONTROLE DE ESTOQUE - MERCADORIAS ENQUADRADAS NA SUBSTITUIÇÃO TRIBUTÁRIA\n',
                                        bold: true,
                                        decoration: 'underline',
                                        fontSize: 10,
                                        alignment: 'center'
                                    },
                                    {
                                        text: '(MÉTODO DE AVALIAÇÃO: VALOR MÉDIO PONDERADO MÓVEL)',
                                        bold: true,
                                        fontSize: 6,
                                        alignment: 'center'
                                    }
                                ],                        
                                colSpan: 27,
                                border: [false, false, false, false],
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],	
                        [
                            {							
                                text: 'Contribuinte: ' + dados[i]['EMPRESAS_NOME'],
                                colSpan: 15,
                                border: [true, true, false, false],
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{},
                            {
                                text: 'Inscrição Estadual: ',
                                alignment: 'right',
                                colSpan: 2,
                                border: [false, true, false, false],
                            },{},
                            {
                                text: dados[i]['EMPRESAS_INSCRICAO'],
                                alignment: 'left',
                                colSpan: 10,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {							
                                text: 'MÊS E ANO DE REFERENCIA: ' + moment(params.final).format('MM/YYYY'),
                                colSpan: 10,
                                border: [true, true, false, false],
                            },{},{},{},{},{},{},{},{},{},
                            {
                                text: 'MERCADORIA: ' + dados[i]['PRODUTOS_NOME'],
                                alignment: 'left',
                                colSpan: 6,
                                border: [false, true, false, false],
                            },{},{},{},{},{},
                            {
                                text: 'UNIDADE: ' + dados[i]['PRODUTOS_UNIDADE'],
                                alignment: 'left',
                                colSpan: 4,
                                border: [false, true, false, false],
                            },{},{},{},
                            {
                                text: 'ALIQUOTA: ',
                                alignment: 'left',
                                colSpan: 7,
                                border: [false, true, false, false],
                            },{},{},{},{},{},{}
                        ],
                        [
                            {							
                                text: 'DADOS GERAIS',
                                bold: true,
                                alignment: 'center',
                                colSpan: 10,
                                border: [true, true, false, false],
                            },{},{},{},{},{},{},{},{},{},
                            {
                                text: 'ENTRADAS',
                                bold: true,
                                alignment: 'center',
                                colSpan: 2
                            },{},
                            {
                                text: 'SAIDAS',
                                bold: true,
                                alignment: 'center',
                                colSpan: 9
                            },{},{},{},{},{},{},{},{},
                            {
                                text: 'SALDO',
                                bold: true,
                                alignment: 'center',
                                colSpan: 3
                            },{},{},
                            {
                                text: 'Apuração',
                                bold: true,
                                alignment: 'center',
                                colSpan: 3
                            },{},{}
                        ], 
                        [
                            {							
                                text: '\n\n\n\n\n\nNúmero\nde Ordem',  // (1)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nData',  // (2)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nChave do Documento\nFiscal Eletrônico',  // (3)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nNúmero de\nSérie de\nFabricação\ndo ECF',  // (4)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nTipo do\nDocumento',  // (5)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nSérie do\nDocumento',  // (6)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nNúmero do\nDocumento',  // (7)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nCódigo do\nRemetente ou\nDestinatário',  // (8)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nCFOP',  // (9)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nNúmero do\nItem no\nDocumento',  // (10)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nQuantidade',  // (11)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nValor Total do\nICMS Suportado\nna Retenção ou\nAntecipação por\nST',  // (12)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nQuantidade',  // (13)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\nValor Total do ICMS Suportado na Retenção ou Antecipação por Substituição Tributária\n(apurado pela média ponderada móvel)',  // (14 a 19)
                                colSpan: 6,
                                bold: true,
                                alignment: 'center'
                            },{},{},{},{},{},
                            {
                                text: '\nValor de Confronto',  // (20 e 21)
                                colSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },{},
                            {
                                text: '\n\n\n\n\n\nQuantidade', // (22)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: 'Valor Total do ICMS Suportado na\nRetenção ou Antecipação por\nSubstituição Tributária (média ponderada móvel)',  // (23 e 24)
                                colSpan: 2,
                                bold: true,
                                alignment: 'center'
                            },{},
                            {
                                text: '\n\n\n\n\n\nValor do\nRessarcimento', // (25)
                                rowSpan: 2,                        
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nValor do\nComplemento',  // (26)
                                rowSpan: 2,                        
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\n\n\n\nICMS - Crédito\nda Operação\nPrópria\n(artigo 271 do\nRICMS)',  // (27)
                                rowSpan: 2,
                                bold: true,
                                alignment: 'center'
                            }
                        ],
                        [
                            {							
                                text: ''  // (1) Linha Em branco - spanned na linha acima
                            },
                            {
                                text: '',  // (2)
                            },
                            {
                                text: '',  // (3)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (4)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (5)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (6)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (7)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (8)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (9)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (10)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (11)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (12)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (13)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\nValor\nUnitário do\nICMS\nSuportado',  // (14)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\nSaída a\nConsumidor\nou Usuário\nFinal - Código Enquadramento Legal = 1',  // (15)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\nFato Gerador\nNão Realizado -\nCódigo\nEnquadramento\nLegal = 2',  // (16)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\nSaída ou Saída\nSubsequente\nCom Isenção ou\nNão Incidência - \nCódigo\nEnquadramento\nLegal = 3',  // (17)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\nSaída para Outro\nEstado - Código\nEnquadramento\nLegal = 4',  // (18)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\nSaída para\nComercialização\nsubsequente (Demais Saídas) -\nCódigo\nEnquadramento\nLegal = 0',  // (19)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: 'ICMS Efetivo\nNa Saída: a\nConsumidor\nou Usuário\nFinal ou no\ncaso de Saída\nSubsequente\ncom Isenção\nou Não\nIncidência',  // (20)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\nICMS Efetivo da\nEntrada, nas\ndemais Hipóteses',  // (21)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '', // (22) Spanned
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\nValor Unitário do\nSaldo',  // (23)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '\n\n\nValor Total do\nSaldo',  // (24)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '', // (25) Spanned
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (26) Spanned
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '',  // (27) Spanned
                                bold: true,
                                alignment: 'center'
                            }
                        ],                
                        [
                            {							
                                text: '(1)',  // (1)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(2)',  // (2)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(3)',  // (3)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(4)',  // (4)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(5)',  // (5)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(6)',  // (6)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(7)',  // (7)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(8)',  // (8)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(9)',  // (9)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(10)',  // (10)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(11)',  // (11)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(12)',  // (12)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(13)',  // (13)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(14)',  // (14)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(15)',  // (15)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(16)',  // (16)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(17)',  // (17)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(18)',  // (18)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(19)',  // (19)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(20)',  // (20)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(21)',  // (21)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(22)', // (22)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(23)=(24)/(22)',  // (23)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(24)',  // (24)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(25)', // (25)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(26)',  // (26)
                                bold: true,
                                alignment: 'center'
                            },
                            {
                                text: '(27)',  // (27)
                                bold: true,
                                alignment: 'center'
                            }
                        ]              
                    ); // Fim do cabeçalho                    

                    ultimoProduto = dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'];
                    let saldoAnterior = await obterSaldoAnterior(ultimoProduto, db, params);
                    if(saldoAnterior.length > 0) {
                        saldoProduto = saldoAnterior[0]['ENTRADAS'] - saldoAnterior[0]['SAIDAS'];
                    } else {
                        saldoProduto = 0
                    }

                    soma11 = 0;
                    soma12 = 0;
                    soma13 = 0;
                    soma15 = 0;
                    soma16 = 0;
                    soma17 = 0;
                    soma18 = 0;
                    soma19 = 0;
                    soma20 = 0;
                    soma21 = 0;
                    soma25 = 0;
                    soma26 = 0;
                    soma27 = 0;
                }

                isEntrada = parseInt(dados[i]['MOVIMENTOSITENS_ID_OPERACOES']) < 500000;

                if(isEntrada) {
                    saldoProduto += dados[i]['MOVIMENTOSITENS_QUANTIDADE'];
                } else {
                    saldoProduto -= dados[i]['MOVIMENTOSITENS_QUANTIDADE'];
                }
                
                rows.push([
                    {
                        text: ('0000' + numOrdem.toString()).slice(-4), // 1
                        alignment: 'center'
                    },
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),  // 2
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]                        
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NFE'], // 3
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]                        
                    },
                    {
                        text: '', // ECF  4
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]                        
                    },
                    {
                        text: 'NF-e',  // Tipo de documento (5)
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]                        
                    },
                    {
                        text: '1',  // Série do documento (6)
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]                        
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'], // Número da nota (7)
                        alignment: 'center'
                    },
                    {
                        text: dados[i]['MOVIMENTOS_ID_PESSOAS'], // Código do remetente/Destinatário (8)
                        alignment: 'center'
                    },
                    {
                        text: (Math.trunc(parseInt(dados[i]['MOVIMENTOSITENS_ID_OPERACOES']) / 100)),  // CFOP (9)
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },							
                    {
                        text: ('000' + numItem.toString()).slice(-3), // Numero do item no documento (10)
                        alignment: 'center'
                    },                    
                    {
                        text: isEntrada ? dados[i]['MOVIMENTOSITENS_QUANTIDADE'] : '', // Qtde Entrada (11)
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },						
                    {
                        text: isEntrada ? utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_VALORST']) : '', // Valor St Entrada (12)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },						
                    {
                        text: isEntrada ? '' : dados[i]['MOVIMENTOSITENS_QUANTIDADE'], // Qtde Saida (13)
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: isEntrada ? '' : utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_VALORST']), // Valor St Saida (14)
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(0),  // (15)
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(0),  // (16)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },						
                    {
                        text: utils.number.float2moeda(0),  // (17)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: utils.number.float2moeda(0),  // (18)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },                    
                    {
                        text: utils.number.float2moeda(0),  // (19)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },                    
                    {
                        text: utils.number.float2moeda(0),  // (20)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },                    
                    {
                        text: utils.number.float2moeda(0),  // (21)
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: saldoProduto,  // (22) Saldo (qtde)
                        alignment: 'center',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },                   
                    {
                        text: valorUnitarioSaldo,  // (23) Valor unitário do saldo
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: valorTotalSaldo,  // (24) Valor total do Saldo
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: valorRessarcimento,  // (25) 
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: valorComplemento,  // (26) 
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    },
                    {
                        text: valorCredito,  // (27) 
                        alignment: 'right',
                        style: 'tableExample',
                        border: [true, true, true, true]
                    }

                ]);

                soma11 += isEntrada ? dados[i]['MOVIMENTOSITENS_QUANTIDADE'] : 0;
                soma12 += isEntrada ? dados[i]['MOVIMENTOSITENS_VALORST'] : 0;
                soma13 += isEntrada ? 0 : dados[i]['MOVIMENTOSITENS_QUANTIDADE'];
                soma15 += 0;
                soma16 += 0;
                soma17 += 0;
                soma18 += 0;
                soma19 += 0;
                soma20 += 0;
                soma21 += 0;
                soma25 += valorRessarcimento;
                soma26 += valorComplemento;
                soma27 += valorCredito;    

            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { inicio, final, empresaLogada } = params;

    return new Promise(async (resolve, reject) => {
		let sql = `
                execute block returns (
                    EMPRESAS_NOME                  varchar(50),
                    EMPRESAS_INSCRICAO             varchar(15),
                    MOVIMENTOSITENS_ID_PRODUTOS    integer,
                    MOVIMENTOSITENS_ID_OPERACOES   integer,
                    OPERACOES_NOME                 varchar(50),
                    MOVIMENTOSITENS_QUANTIDADE     numeric(12,3),
                    MOVIMENTOSITENS_TOTAL          numeric(12,2),
                    MOVIMENTOSITENS_VALORST        numeric(12,2),
                    MOVIMENTOS_EMISSAO             DATE,
                    MOVIMENTOS_NFE                 varchar(50),
                    MOVIMENTOS_ID                  integer,
                    MOVIMENTOS_NUMERO              integer,
                    MOVIMENTOS_ID_PESSOAS          integer,
                    PESSOAS_NOME                   varchar(50),
                    PESSOAS_CPFCNPJ                varchar(15),
                    MOVIMENTOSITENS_ID             integer,
                    PRODUTOS_NOME                  varchar(100),
                    PRODUTOS_UNIDADE               varchar(3),
                    NCMS_NCM                       varchar(10)
            ) as
            begin
            for
                select
                        EMPRESAS_NOME,
                        EMPRESAS_INSCRICAO,
                        MOVIMENTOSITENS_ID_PRODUTOS,
                        MOVIMENTOSITENS_ID_OPERACOES,
                        OPERACOES_NOME,
                        MOVIMENTOSITENS_QUANTIDADE,
                        MOVIMENTOSITENS_TOTAL,
                        MOVIMENTOSITENS_VALORST,
                        MOVIMENTOS_EMISSAO,
                        MOVIMENTOS_NFE,
                        MOVIMENTOS_ID,
                        MOVIMENTOS_NUMERO,
                        MOVIMENTOS_ID_PESSOAS,
                        PESSOAS_NOME,
                        PESSOAS_CPFCNPJ,
                        MOVIMENTOSITENS_ID,
                        PRODUTOS_NOME,
                        PRODUTOS_UNIDADE,
                        NCMS_NCM
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join EMPRESAS on EMPRESAS_ID     = MOVIMENTOS_ID_EMPRESAS
                join PESSOAS on PESSOAS_ID       = MOVIMENTOS_ID_PESSOAS
                join PRODUTOS on PRODUTOS_ID     = MOVIMENTOSITENS_ID_PRODUTOS
                join OPERACOES on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                join NCMS on NCMS_ID             = PRODUTOS_ID_NCMS
                where MOVIMENTOS_ID_EMPRESAS = 1 and ((MOVIMENTOS_ID_DOCUMENTOS = 10003 and
                    MOVIMENTOS_EMISSAO      between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}') or (MOVIMENTOS_ID_DOCUMENTOS = 10005 and
                    MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}')) and
                    (not MOVIMENTOS_STATUS in('C','D'))
                order by MOVIMENTOSITENS_ID_PRODUTOS,MOVIMENTOS_EMISSAO,MOVIMENTOSITENS_ID
                into
                :EMPRESAS_NOME,
                :EMPRESAS_INSCRICAO,
                :MOVIMENTOSITENS_ID_PRODUTOS,
                :MOVIMENTOSITENS_ID_OPERACOES,
                :OPERACOES_NOME,
                :MOVIMENTOSITENS_QUANTIDADE,
                :MOVIMENTOSITENS_TOTAL,
                :MOVIMENTOSITENS_VALORST,
                :MOVIMENTOS_EMISSAO,
                :MOVIMENTOS_NFE,
                :MOVIMENTOS_ID,
                :MOVIMENTOS_NUMERO,
                :MOVIMENTOS_ID_PESSOAS,
                :PESSOAS_NOME,
                :PESSOAS_CPFCNPJ,
                :MOVIMENTOSITENS_ID,
                :PRODUTOS_NOME,
                :PRODUTOS_UNIDADE,
                :NCMS_NCM
            do
                begin
                    suspend;            
                end                        
            end`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const obterSaldoAnterior = function(idproduto, db, params) {

    const { inicio, final, empresaLogada } = params;

    const dataLimite = moment(inicio).subtract(1, 'days').format('DD.MM.YYYY');

    return new Promise(async (resolve, reject) => {
		let sql = `select sum(case when OPERACOES_ESTOQUE = 'C'then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) ENTRADAS,
                          sum(case when OPERACOES_ESTOQUE = 'D'then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) SAIDAS
                   from MOVIMENTOSITENS       
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                   join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                   where MOVIMENTOS_ID_EMPRESAS = 1 
                   and MOVIMENTOSITENS_ID_PRODUTOS = ${idproduto}
                   and ((MOVIMENTOS_ID_DOCUMENTOS = 10003 and
                    MOVIMENTOS_EMISSAO      between '01.01.2023' and '${dataLimite}') or (MOVIMENTOS_ID_DOCUMENTOS = 10005 and
                    MOVIMENTOS_ENTRADASAIDA between '01.01.2023' and '${dataLimite}')) and
                    (not MOVIMENTOS_STATUS in('C','D')) group by MOVIMENTOSITENS_ID_PRODUTOS`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const getItemDocumento = function(db, idproduto, idmovimento) {

    return new Promise(async (resolve, reject) => {
		let sql = `execute block returns (MOVIMENTOSITENS_SEQUENCIA integer)
                        as
                        declare variable V_ID        integer;
                        declare variable V_PRODUTO   integer;
                        declare variable V_ITENS     integer;
                        
                        begin
                        V_ITENS = 0;
                        for
                            select
                                MOVIMENTOSITENS_ID_PRODUTOS,
                                MOVIMENTOSITENS_ID
                            from MOVIMENTOSITENS
                            where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idmovimento}
                            order by  MOVIMENTOSITENS_ID
                            into
                            :V_PRODUTO,
                            :V_ID
                        do
                            begin
                            V_ITENS = V_ITENS + 1;
                            if (V_PRODUTO = ${idproduto}) then
                                MOVIMENTOSITENS_SEQUENCIA = V_ITENS;
                            end
                        
                        suspend;
                        
                        end`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};