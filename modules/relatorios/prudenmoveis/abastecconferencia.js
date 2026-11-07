'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25],
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   A   Q   U   T  C
									//        1   2   3   4   5   6   7   8   9  10  11 // 11 colunas
									//      [40, 10, 50, 50, 50, 50, 60, 20, 25, 50, 60], // TOTAL: 465
									widths: [40, 10, 45, 45, 45, 45, 45, 20, 50, 60, 60], // TOTAL: 465
									heights: 5,
									headerRows: 6,
									body: []
								},
								style: {
									fontSize: 9
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},     						
						styles: {
							tableReport: {
								margin: [20, 30, 20, 25],
							}
						}
					};
							
					let model = res.results[0];

					let obsPedido = (model['PESSOAS_PAGINA'] ? model['PESSOAS_PAGINA'] : '') + ' ' + (model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ') : '');

					const dataEmissao   = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;

					let itensPagina = 0;
					let somaItens   = 0;
					let somaQtdes   = 0;
					let somaVols    = 0;

					rows.push(
						[
							{
								colSpan: 11,
                                text: (model['OPERACOES_NOME'].match(/ABASTECIMENTO/) ? `PEDIDO DE ${model['OPERACOES_NOME']}` : model['OPERACOES_NOME']),
								alignment: 'center',
                                fontSize: 14,
                                decoration: 'underline',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 11,
								text: 'A',
								color: 'white',
                                fontSize: 8,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{}
                        ],						
						[
							{
								text: 'Empresa: ',
								colSpan: 2,
								border: [true, true, false, false]
							},{},
							{
                                text: model['EMPRESAS_FANTASIA'],
								fontSize: 11,
								bold: true,
								colSpan: 7,
								border: [false, true, false, false]
							},{},{},{},{},{},{},
							{
								text: 'Emissão:',
								alignment: 'right',
								border: [false, true, false, false]
							},
							{
								text: `${dataEmissao}`,
								fontSize: 11,
								alignment: 'right',
								bold: true,
								border: [false, true, true, false]								
							}
						],
						[
							{
								colSpan: 11,
								text: 'a',
								color: 'white',
                                fontSize: 1,
                                border: [true, false, true, false]
                            },{},{},{},{},{},{},{},{},{},{}
                        ],												
						[
							{
								text: 'Fornecedor:',
								colSpan: 2,
								border: [true, false, false, true]								
							},{},
							{
                                text: `${model['MOVIMENTOS_NOME']} (${model['MOVIMENTOS_ID_PESSOAS']})`,
								fontSize: 11,
								bold: true,
								colSpan: 7,
								border: [false, false, false, true]
							},{},{},{},{},{},{},
							{
								text: 'Número:',
								alignment: 'right',
								border: [false, false, false, true]								
							},
							{
								text: [
									{
										text: `${('000000' + model['MOVIMENTOS_NUMERO']).slice(-6)} `,
										fontSize: 10,
										bold: true,
										alignment: 'right'
									},
									{
										text:  `${model['MOVIMENTOS_SERIE']}`,
										fontSize: 10,
										bold: true,										
										alignment: 'right'
									}
								],
								bold: true,
								border: [false, false, true, true]								
							}
						],						
						[
							{
								text: 'Cód',
								alignment: 'center',
								bold: true,
								border: [false, false, false, true]
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 4,
								bold: true,								
								border: [false, false, false, true]								
							}, 
							{},{},{},
							{
								text: 'Cor',
								alignment: 'center',
								bold: true,								
								border: [false, false, false, true]																
							},
							{
								text: 'Tipo',
								alignment: 'center',
								bold: true,								
								border: [false, false, false, true]																
							},
							{
								text: 'Qtde',
								alignment: 'right',
								bold: true,								
								border: [false, false, false, true]														
							},
							{
								text: 'Volumes',
								alignment: 'right',
								bold: true,								
								border: [false, false, false, true]								
							},
							{
								text: 'Total Volumes',
								alignment: 'right',
								bold: true,								
								border: [false, false, false, true]															
							},
							{
								text: 'Conferente',
								alignment: 'center',
								bold: true,								
								border: [false, false, false, true]															
							}
						]
					);

					for(let i in produtos){
						let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
						let nomeProduto = produtos[i]['PRODUTOS_NOME'];
						let totVolumes = ((cents(produtos[i]['MOVIMENTOSITENS_QUANTIDADE']) * cents(produtos[i]['PRODUTOS_EMBALAGEM'])) / 10000).toFixed(0);
						rows.push(
							[
								{							
									text: `${('000000' + produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6)}`,
									alignment: 'center',
									border: [false, false, false, false]
								},
								{
									text: nomeProduto,
									fontSize: (nomeProduto.length > 50 ? 8 : 9),
									colSpan: 4,
									border: [false, false, false, false]									
								},{},{},{},
								{
									text: produtos[i]['PRODUTOS_MARCA'],
									alignment: 'center',
									border: [false, false, false, false]									
								},
								{
									text: (produtos[i]['MOVIMENTOSITENS_EXCECAO'] == 'P' ? 'PV' : 'LJ'),
									alignment: 'center',
									border: [false, false, false, false]									
								},
								{
									text: qtdeProduto,
									alignment: 'right',
									border: [false, false, false, false]									
								},								
								{
									text: (cents(produtos[i]['PRODUTOS_EMBALAGEM']) / 100).toFixed(0),
									alignment: 'right',
									border: [false, false, false, false]									
								},
								{
									text: totVolumes,
									alignment: 'right',
									border: [false, false, false, false]									
								},
								{
									text: '_________',
									alignment: 'center',
									border: [false, false, false, false]									
								}
							]
						);
						somaItens ++;
						somaQtdes += produtos[i]['MOVIMENTOSITENS_QUANTIDADE'];
						somaVols  += cents(totVolumes);
						itensPagina++
                        if(itensPagina > 40) {
							itensPagina = 1;
							rows.push([
								{
									colSpan: 11,
									pageBreak: 'after',
									text: 'a',
									color: 'white',
									fontSize: 1,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{}
							]);											
						}
					}

					rows.push(
						[
							{
								text: 'Qtde Itens: ',
								alignment: 'left',
								colSpan: 2,
								border: [true, true, false, false],								
							},{},
							{
								text: somaItens,
								bold: true,
								border: [false, true, false, false]
							},
							{
								text: 'Qtde Produtos: ',
								alignment: 'right',
								colSpan: 2,
								border: [false, true, false, false]
							},{},
							{
								text: somaQtdes,
								bold: true,
								border: [false, true, false, false]
							},	
							{
								text: '',
								colSpan: 2,
								border: [false, true, false, false]
							},{},
							{
								text: 'TOTAL:', 
								alignment: 'right',
								bold: true,
								border: [false, true, false, false]
							},
							{
								text: somaVols / 100,
								alignment: 'right',
								bold: true
							},
							{
								text: '',
								border: [false, true, true, false]								
							}
						]
					)

					rows.push(
						[
							{
								text: 'Observações:\n',
								colSpan: 11,
								alignment: 'left',
								border: [true, false, true, false],								
							},{},{},{},{},{},{},{},{},{},
						]
					)

					rows.push(
						[
							{
								text: 'Data Recebimento: ________________________',
								colSpan: 5,
								border: [true, false, false, false]
							},{},{},{},{},
							{
								text: 'Visto Recebedor: ________________________________________',
								colSpan: 6,
								border: [false, false, true, false]
							},{},{},{},{},{}
						],
						[
							{
								colSpan: 11,
								text: 'a',
								color: 'white',
                                fontSize: 1,
                                border: [true, false, true, true]
                            },{},{},{},{},{},{},{},{},{},{}
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