'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Seq Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        0   1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 15 Colunas
									widths: [17, 30, 43, 19, 55, 31, 21, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
                                    heights: 5,
                                    headerRows: 9,
									body: []
								},
								style: {
									fontSize: 8
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
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					const impLog = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					let model = res.results[0];

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);
                    let fanPessoa = (siglaFilial != 'FT' && model['PESSOAS_FANTASIA'] ? model['PESSOAS_FANTASIA'] : '');
                    const percentuaisValue = model['MOVIMENTOS_NFE'] || ''; // % Frete, Seguro, IPI                    

                    let percFrete  = (percentuaisValue || '').split('|')[0];
                    let percSeguro = (percentuaisValue || '').split('|')[1];
                    let percIpi    = (percentuaisValue || '').split('|')[2];                    

                    percIpi    = percIpi ? ' (' + percIpi + '%)' : '';
                    percFrete  = percFrete ? ' (' + percFrete + '%)' : '';
                    percSeguro = percSeguro ? ' (' + percSeguro + '%)' : '';

					let financeiros = model['MOVIMENTOS_FINANCEIROSCOMPRA'] || [];

					let vencto01 = (financeiros.length > 0  ? `${moment(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto02 = (financeiros.length > 1  ? `${moment(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto03 = (financeiros.length > 2  ? `${moment(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto04 = (financeiros.length > 3  ? `${moment(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto05 = (financeiros.length > 4  ? `${moment(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto06 = (financeiros.length > 5  ? `${moment(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto07 = (financeiros.length > 6  ? `${moment(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto08 = (financeiros.length > 7  ? `${moment(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto09 = (financeiros.length > 8  ? `${moment(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto10 = (financeiros.length > 9  ? `${moment(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto11 = (financeiros.length > 10 ? `${moment(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto12 = (financeiros.length > 11 ? `${moment(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');

					let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');

                    let obsPedido = (model['MOVIMENTOS_OBSERVACOES'].split('|')[0] + ' ' + 
                                    model['MOVIMENTOS_OBSERVACOES'].split('|')[1] + ' ' + 
                                    model['MOVIMENTOS_OBSERVACOES'].split('|')[2]).toUpperCase();
                    let obsPessoa = model['PESSOAS_OBSERVACOES'].toUpperCase();

					const emiPedido     =  moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
                    
					let pathFone  = `${appRoot}/resources/images/headers/telefone.png`
					let pathWhats = `${appRoot}/resources/images/headers/whatsapp.png`

                    let tamIpi = percIpi - parseInt(percIpi) != 0 ? 7 : 8;
                    let tamFrete = percFrete - parseInt(percFrete) != 0 ? 7 : 8;
                    let tamSeguro = percSeguro - parseInt(percSeguro) != 0 ? 7 : 8;

                    rows.push(
                        [
                            {
                                colSpan: 12,
                                text: [
                                    {
                                        text: model['EMPRESAS_NOME'] + '\n',
                                        alignment: 'left',
                                        style: {bold: true}
                                    },
                                    {
                                        text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']} - CEP: ${utils.string.maskCep(model['EMPRESAS_CEP'])}, ${ model['CIDADES_NOMEEMPRESA'] } ${model['CIDADES_ESTADOEMPRESA']}\n`,
                                        alignment: 'left',
                                        style: {bold: false}
                                    },
                                    {
                                        text: 'CNPJ:         ' +  utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']),
                                        alignment: 'left',
                                        style: {bold: false}
                                    },
                                    {
                                        text: '\nI.E:' + ' '.repeat(14) + model['EMPRESAS_INSCRICAO'],
                                        alignment: 'left',
                                        style: {bold: false}
                                    },
                                    {
                                        text: `\nTelefone:   ${ utils.string.maskFone(model['EMPRESAS_TELEFONE']) }`,
                                        alignment: 'left',
                                        style: {bold: false}
                                    },
                                    //Dei espaços só pra alinhar melhor
                                    {
                                        text: `\nCelular:      ${ utils.string.maskFone(model['EMPRESAS_CELULAR']) }`,
                                        alignment: 'left',
                                        style: {bold: false}
                                    }
                                ],
                                alignment: 'left',
                                border: [false, false, false, false],
                                style: {
                                    fontSize: 8
                                }
                            },{},{},{},{},{},{},{},{},{},{},{},
                            {
                                image: pathLogo,
                                fit: [120, 120],									
                                colSpan: 3,
                                width: 80,
                                alignment: 'left',
                                margin: [0, 10, 0, 0],
                                border: [false, false, false, false]
                            },{},{}
                        ],
// Adicionado
    [
        {
            colSpan: 15,
            text: [
                {
                    text: 'Fornecedor: ' + model['PESSOAS_NOME'] + '\n',
                    alignment: 'left',
                    style: {bold: true}
                },
                {
                    text: `Endereço: ${model['PESSOAS_ENDERECO']} ${model['PESSOAS_NUMERO']} - ${model['PESSOAS_BAIRRO']} - CEP: ${utils.string.maskCep(model['PESSOAS_CEP'])}, ${ model['CIDADES_NOME'] } ${model['CIDADES_ESTADO']}\n`,
                    alignment: 'left',
                    style: {bold: false}
                },
                {
                    text: 'CNPJ:         ' +  utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
                    alignment: 'left',
                    style: {bold: false}
                },
                {
                    text: '\nI.E:' + ' '.repeat(14) + model['PESSOAS_INSCRICAO'],
                    alignment: 'left',
                    style: {bold: false}
                },
                {
                    text: `\nTelefone:   ${ utils.string.maskFone(model['PESSOAS_TELEFONE']) }`,
                    alignment: 'left',
                    style: {bold: false}
                },
                //Dei espaços só pra alinhar melhor
                {
                    text: `\nCelular:      ${ utils.string.maskFone(model['PESSOAS_CELULAR']) }`,
                    alignment: 'left',
                    style: {bold: false}
                }
            ],
            alignment: 'left',
            border: [false, false, false, false],
            style: {
                fontSize: 8
            }
        },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
    ],

// fim da adiçao

                        [
                            { 
                                text: `PEDIDO DE COMPRA`,
                                alignment: 'center',
                                colSpan: 15,
                                style: {
                                    bold: true,
                                    fontSize: 13
                                },
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            { 
                                text: `Solicitação N: ${ ('0000000' + model['MOVIMENTOS_NUMERO']).slice(-6) }`,
                                alignment: 'center',
                                colSpan: 15,
                                style: {
                                    bold: true,
                                    color: '#FFFFFF',
                                    fillColor: '#2b2727',
                                    fontSize: 12,
                                    borderColor: 'black'
                                }
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {
                                text: [
                                    {
                                        text: `Data de Emissão: `,
                                        style: {
                                            bold: true
                                        }
                                    },
                                    {
                                        text: `${emiPedido}`
                                    }
                                ],
                                alignment: 'left',
                                colSpan: 15,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {
                                text: [
                                    {
                                        text: '', //`Cond. Pagamento: `,
                                        style: {
                                            bold: true
                                        }
                                    },{
                                        text: ''//`${ model['PRAZOS_NOME'] }`
                                    }
                                ],
                                alignment: 'left',
                                colSpan: 15,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            { 
                                text: '\n', 
                                style: {
                                    fontSize: 1
                                },
                                colSpan: 15,									
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {
                                text: 'Seq',
                                alignment: 'center'
                            },
                            {
                                text: 'Código',
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Produto',
                                alignment: 'center',
                                colSpan: 8
                            }, 
                            {},{},{},{},{},
                            {},{},{
                                text: 'Qtde',
                                alignment: 'center'
                            },
                            {
                                colSpan: 2,
                                text: 'Preço',
                                alignment: 'center'								
                            },{},
                            {
                                colSpan: 2,
                                text: 'Total',
                                alignment: 'center'								
                            },{}
                        ]
                    );

                    for(let i in produtos){
                        let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
                        rows.push(
                            [
                                {
                                    text: ('000' + produtos[i]['MOVIMENTOSITENS_ID_EMPRESAS']).slice(-3),
                                    alignment: 'center',
                                    style: {
                                        fontSize: 8
                                    }											
                                },
                                {							
                                    text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	
                                    alignment: 'center',
                                    style: {
                                        fontSize: 8
                                    }											
                                },
                                {
                                    text: produtos[i]['PRODUTOS_NOME'],
                                    colSpan: 8,
                                    style: {
                                        fontSize: 8
                                    }
                                },{},{},{},{},{},
                                {},{},
                                {
                                    text: qtdeProduto,
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },
                                {
                                    colSpan: 2,
                                    text: utils.number.float2moeda((produtos[i]['MOVIMENTOSITENS_PRECO'])),
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },{},
                                {
                                    colSpan: 2,
                                    text: utils.number.float2moeda((produtos[i]['MOVIMENTOSITENS_TOTAL'] - produtos[i]['MOVIMENTOSITENS_DESCONTOS'])),
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },{}
                            ]
                        )

                    };

                    rows.push(
                        [
                            {  
                                text: [ 
                                    {text: vencto01},
                                    {text: valor01, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},
                                    {text: vencto04},
                                    {text: valor04, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto07},
                                    {text: valor07, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto10},
                                    {text: valor10, alignment: 'right'},
                                ],
                                colSpan: 11,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Produtos',
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true
                                }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']),
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true							
                                }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: '', //`Situação: ${model['MOVIMENTOS_STATUS'] == 'N' ? 'ABERTO' : 'ENTREGUE'}`,
                                colSpan: 11,
                                border: [false, false, false, false]                                
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: '',
                                alignment: 'right',                                
                                style: {fontSize: 8}
                            },{},
                            {
                                colSpan: 2,
                                text: '',
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [
                                    {
                                        text: 'Impresso por: '
                                    },
                                    {
                                        text: impLog,
                                        style: { fontSize: 8, bold: true }
                                    }
                                ],
                                colSpan: 5,
                                alignment: 'left',
                                border: [false, false, false, false],
                            },{},{},{},{},
                            { text: '', border: [false, false, false, false]},
                            {
                                text: '',
                                colSpan: 4,
                                border: [false, false, false, false]
                            },{},{},{},
                            { text: '', border: [false, false, false, false]},                            
                            {
                                colSpan: 2,
                                text: 'Total',
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true
                                }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true							
                                }																			
                            },{}
                        ]
                    );
                    rows.push(
                        [
                            {
                                text: '',
                                colSpan: 15,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {
                                text: 'Observações',
                                colSpan: 2
                            },{},
                            {
                                text: `${obsPedido}`,
                                colSpan: 13
                            },{},{},{},{},{},{},{},{},{},{},{},{}
                        ]
                    );
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};