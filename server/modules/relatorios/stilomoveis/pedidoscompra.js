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

                    if(model['EMPRESAS_CPFCNPJ'].match(/50203915/)) { // Limpa o bairro na Movelar
						model['EMPRESAS_BAIRRO'] = '';
					}

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
                                image: pathLogo,
                                fit: [100, 100],									
                                colSpan: 3,
                                width: 80,
                                alignment: 'center',
                                margin: [0, 10, 0, 0],
                                border: [true, true, false, true]
                            },{},{},
                            {
                                colSpan: 4,
                                text: [
                                    {
                                        text: model['EMPRESAS_NOME'] + '\n',
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 8}
                                    },
                                    {
                                        text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']}\n`,
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                    {
                                        text: utils.string.maskCep(model['EMPRESAS_CEP']) + ' ' + model['CIDADES_NOMEEMPRESA'] + ' ' + model['CIDADES_ESTADOEMPRESA'] + '\n',
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                    {
                                        text: 'CNPJ: ' +  utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']) + '\nI.E.: ' + model['EMPRESAS_INSCRICAO'],
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                ],
                                border: [false, true, true, true]
                            },{},{},{},
                            {
                                colSpan: 6,
                                table: {
                                    body: [
                                        [
                                            {
                                                text: 'T', // só pra alinhamento
                                                fontSize: 5,
                                                color: 'white'
                                            },
                                            {
                                                text: `PEDIDO DE COMPRA`,
                                                alignment: 'center',
                                                style: {bold: true,	fontSize: 12}
                                            },{}
                                        ],
                                        [ 
                                            {
                                                text: 'T', // só pra alinhamento
                                                fontSize: 5,
                                                color: 'white'
                                            },
                                            {
                                                table: {
                                                    body: [
                                                        [	
                                                            {
                                                                image: pathFone,
                                                                width: 13,  //10 all
                                                                height: 13	
                                                            },
                                                            {
                                                                text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
                                                                style: {fontSize: 9, bold: true}
                                                            },																
                                                            {
                                                                image: pathWhats,
                                                                width: 13,
                                                                height: 13	
                                                            },
                                                            {
                                                                text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
                                                                style: {fontSize: 9, bold: true}																	
                                                            }
                                                        ]
                                                    ]														
                                                },
                                                layout: 'noBorders'													
                                            },{
                                                text: ''
                                            }
                                        ]
                                    ]
                                },
                                layout: 'noBorders'
                            },
                            {},{},{},{},{},
                            { 
                                colSpan: 2,									
                                text: [
                                    {
                                        text: ''
                                    },
                                    {
                                        text: `\n`,
                                        fontSize: 6,
                                        alignment: 'center'
                                    },
                                    {
                                        text: model['MOVIMENTOS_NUMERO'],
                                        alignment: 'center',
                                        style: {
                                            bold: true,
                                            fontSize: 15
                                        }
                                    },
                                    {
                                        text: `\n${emiPedido}`,
                                        alignment: 'center',
                                        style: {
                                            bold: true,
                                            fontSize: 10
                                        }										
                                    }									
                                ]
                            },{}
                        ],
                        [
                            {
                                text: 'Nome',
                                colSpan: 2
                            },{},
                            {
                                text: model['MOVIMENTOS_NOME'] + (fanPessoa.length > 0 ? ` (${fanPessoa.toUpperCase()})` : ''),
                                colSpan: 9
                            },{},{},{},{},{},{},{},{},
                            {
                                text: 'Cel',
                                alignment: 'right'
                            },
                            {
                                text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Endereço',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_ENDERECO'],
                                colSpan: 7
                            },{},{},{},{},{},{},{
                                text: 'Número',
                                alignment: 'right',
                                style: {
                                    fontSize: 7.5
                                }										
                            },{
                                text: model['PESSOAS_NUMERO'],
                                alignment: 'right'
                            },
                            {
                                text: 'Tel',
                                alignment: 'right'
                            },
                            {
                                text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Bairro',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_BAIRRO'],
                                colSpan: 6
                            },{},{},{},{},{},	
                            {
                                text: 'Cep',
                                alignment: 'right'
                            }, 
                            {
                                text: model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
                                colSpan: 2
                            },{},
                            {
                                text: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? "RG" : "Ie"),
                                alignment: 'right'
                            },{
                                text: model['PESSOAS_INSCRICAO'],
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Cidade',
                                colSpan: 2
                            },{},
                            {
                                text: model['CIDADES_NOME'],
                                colSpan: 4
                            },{},{},{},
                            {
                                text: 'UF',
                                alignment: 'right'
                            },
                            {
                                text: model['CIDADES_ESTADO'],
                                alignment: 'center'
                            },	
                            {
                                text: 'Prazo',
                                alignment: 'right'
                            },{
                                text: model['PRAZOS_NOME'].substring(0, 16),
                                colSpan: 2
                            },{},
                            {
                                text: model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'CPF' : 'CNPJ',
                                alignment: 'right'
                            }, 
                            {
                                text: utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Complemento',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_PAGINA'].toUpperCase(),
                                colSpan: 6
                            },{},{},{},{},{},
                            {
                                text: 'E-mail',
                                alignment: 'right',
                            },{
                                text: model['MOVIMENTOS_EMAIL'],
                                colSpan: 6
                            },{},{},{},{},{}
                        ],
                        [
                            { 
                                text: 'Observações:',
                                colSpan: 2
                            },{},
                            {
                                text: (obsPessoa == 'null' ? '' : obsPessoa),
                                colSpan: 13
                            },{},{},{},{},{},{},{},{},{},{},{},{}
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
                                colSpan: 6
                            }, 
                            {},{},{},{},{},
                            {
                                text: 'Cor',
                                alignment: 'center',
                                colSpan: 2,
                                fontSize: 6								
                            },{},{
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
                                    colSpan: 6,
                                    style: {
                                        fontSize: 8
                                    }
                                },{},{},{},{},{},
                                {
                                    text: produtos[i]['PRODUTOS_MARCA'],
                                    alignment: 'center',
                                    colSpan: 2,
                                    style: {
                                        fontSize: 8
                                    }
                                },{},
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
                                text: [ 
                                    {text: vencto02},
                                    {text: valor02, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto05},
                                    {text: valor05, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto08},
                                    {text: valor08, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto11},
                                    {text: valor11, alignment: 'right'},
                                ],
                                border: [false, false, false, false],
                                colSpan: 11
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'IPI' + percIpi,
                                alignment: 'right',                                
                                style: { fontSize: tamIpi }
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_VALORIPI']),
                                alignment: 'right',
                                style: { fontSize: 9 }
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [ 
                                    {text: vencto03},
                                    {text: valor03, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto06},
                                    {text: valor06, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto09},
                                    {text: valor09, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto12},
                                    {text: valor12, alignment: 'right'}                                        
                                ],
                                border: [false, false, false, false],                                
                                colSpan: 11
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Frete' + percFrete,
                                alignment: 'right',
                                style: { fontSize: tamFrete }
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']),
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: `Comprador: ${params.userName}`,
                                colSpan: 11,
                                border: [false, false, false, false]                                
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Seguro' + percSeguro,
                                alignment: 'right',                                
                                style: { fontSize: tamSeguro }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO']),
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: `Situação: ${model['MOVIMENTOS_STATUS'] == 'N' ? 'ABERTO' : 'ENTREGUE'}`,
                                colSpan: 11,
                                border: [false, false, false, false]                                
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Despesas',
                                alignment: 'right',                                
                                style: {fontSize: 8}
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
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
                                text: 'Assinatura',
                                alignment: 'center',
                                colSpan: 4,
                                border: [false, true, false, false]
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
                                text: `Observações: ${obsPedido}`,
                                border: [false, false, false, false],
                                colSpan: 15
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
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