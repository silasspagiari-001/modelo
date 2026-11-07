'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 13 Colunas
				{
					style: 'tableExample',
					table: { //  [DTE, PED DIN TRA CHE CHP C01 C02 C03 FST FBR DUP TOT]
						widths:   [60, 20, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55],
						headerRows: 3,
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
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 9,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 9,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendatipo().read(params)
				.then(async res => {
					let rows        = docDefinition.content[1].table.body;
					let arrMaquinas = params.maquinas.split(',');
					let idMaquina01 = arrMaquinas[0] ? arrMaquinas[0] : '';
					let idMaquina02 = arrMaquinas[1] ? arrMaquinas[1] : '';
					let idMaquina03 = arrMaquinas[2] ? arrMaquinas[2] : '';

					let valorCheque       = 0;
					let valorChequePrazo  = 0;
					let valorCartao01     = 0;
					let valorCartao02     = 0;
					let valorCartao03     = 0;
					let valorFinanceira01 = 0;
					let valorFinanceira02 = 0;
					let valorTotal        = 0;
					
					let totalQuantidade    = 0;	
					let totalDinheiro      = 0;					
					let totalTransferencia = 0;
					let totalCheque        = 0;
					let totalChequePrazo   = 0;
					let totalCartao01      = 0;
					let totalCartao02      = 0;
					let totalCartao03      = 0;
					let totalFinanceira01  = 0;
					let totalFinanceira02  = 0;
					let totalDuplicata     = 0;
					let totalGeral         = 0;
	
    				let geralQuantidade = 0;	
					let geralDinheiro = 0;					
					let geralTransferencia = 0;
					let geralCheque = 0;
					let geralChequePrazo = 0;
					let geralCartao01 = 0;
					let geralCartao02 = 0;
					let geralCartao03 = 0;
					let geralFinanceira01 = 0;
					let geralFinanceira02 = 0;
					let geralDuplicata = 0;
					let geralGeral = 0;
					let resumoLojas = [];

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(		
						[
							{							
								image: pathLogo,
								width: 100,
								height: 22,	
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Relatório de Vendas por Tipo Recebimento',
								colSpan: 9,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]								
							},{}
						],
						[
							{							
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 9,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Data',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Qtde',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Dinheiro',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Transf/Pix',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Cheque Vista',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Cheque Pré',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: `${idMaquina01}`,
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: `${idMaquina02}`,
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: `${idMaquina03}`,
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Bradesco',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Santander',
								style: 'tableHeader',
								alignment: 'center'
                            },
							{
								text: 'Carnê',
								style: 'tableHeader',
								alignment: 'center'
                            },
							{
								text: 'Total',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					)

					let empAnt = '';
					let arrFans = ['',
					               'PRUDEN-CD',
								   'PRUDEN-RB',
								   'PRUDEN-CM',
								   'PRUDEN-JF',
								   'PRUDEN-DR',								   
								   'PRUDEN-AS',
								   'PRUDEN-AN',
								   'PRUDEN-ML',
								   'PRUDEN-FT'];								   								   								   								   

					for(let i in res.results){

						let model = res.results[i];
						let idEmpresa = model['MOVIMENTOS_ID_EMPRESAS'];
						let dtEmissao = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');

                        if(empAnt != idEmpresa) {
							if(totalGeral > 0) {
								rows.push([
									{
										text: 'TOTAL',
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: totalQuantidade,
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalDinheiro),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalTransferencia),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalCheque),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
										
									},
									{
										text: utils.number.float2moeda(totalChequePrazo),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalCartao01),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalCartao02),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalCartao03),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalFinanceira01),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalFinanceira02),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalDuplicata),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalGeral),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									}
								]);	
								resumoLojas.push([
									{
										text: arrFans[empAnt],
										alignment: 'left',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: totalQuantidade,
										alignment: 'right',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalDinheiro),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalTransferencia),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalCheque),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
										
									},
									{
										text: utils.number.float2moeda(totalChequePrazo),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalCartao01),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalCartao02),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalCartao03),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalFinanceira01),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalFinanceira02),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'							
									},
									{
										text: utils.number.float2moeda(totalDuplicata),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalGeral),
										alignment: 'right',
										bold: true,							
										style: 'tableExample'
									}
								]);
								totalQuantidade = 0;	
								totalDinheiro = 0;					
								totalTransferencia = 0;
								totalCheque = 0;
								totalChequePrazo = 0;
								totalCartao01 = 0;
								totalCartao02 = 0;
								totalCartao03 = 0;
								totalFinanceira01 = 0;
								totalFinanceira02 = 0;
								totalDuplicata = 0;
								totalGeral = 0;			
							}
							rows.push([
								{
									text: '* * * FILIAL: ' + arrFans[model['MOVIMENTOS_ID_EMPRESAS']] + ' * * *',
									fontSize: 14,
									alignment: 'center',
									bold: true,
									colSpan: 13
								},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Dinheiro',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Transf/Pix',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Cheque Vista',
									style: 'tableHeader',
									alignment: 'center'									
								},								
								{
									text: 'Cheque Pré',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: `${idMaquina01}`,
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: `${idMaquina02}`,
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: `${idMaquina03}`,
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Bradesco',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Santander',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Carnê',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]);

							empAnt = idEmpresa;
						}

						valorTotal = (model['MOVIMENTOS_DINHEIRO'] + model['MOVIMENTOS_CHEQUE'] +
									  model['MOVIMENTOS_CARTOES']  + model['MOVIMENTOS_DUPLICATA'] +
									  model['MOVIMENTOS_FINANCEIRA'] + model['MOVIMENTOS_TRANSFERENCIA']);

						valorChequePrazo  = await obterValoresTipos(idEmpresa, 'CH', dtEmissao,	'', '', params);
						valorCartao01     = await obterValoresTipos(idEmpresa, 'CA', dtEmissao, idMaquina01, '', params);
						valorCartao02     = await obterValoresTipos(idEmpresa, 'CA', dtEmissao, idMaquina02, '', params);
						valorCartao03     = await obterValoresTipos(idEmpresa, 'CA', dtEmissao, idMaquina03, '', params);
						valorFinanceira01 = await obterValoresTipos(idEmpresa, 'FI', dtEmissao, '', 100, params);
						valorFinanceira02 = await obterValoresTipos(idEmpresa, 'FI', dtEmissao, '', 101, params);
						valorCheque       = (model['MOVIMENTOS_CHEQUE'] - valorChequePrazo) || 0;

						rows.push([
							{
								text: dtEmissao,
								alignment: 'center',
								style: 'tableExample',
							},	
							{
								text: model['MOVIMENTOS_QUANTIDADE'],
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(model['MOVIMENTOS_DINHEIRO']),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(model['MOVIMENTOS_TRANSFERENCIA']),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(valorCheque),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorChequePrazo),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCartao01),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCartao02),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCartao03),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorFinanceira01),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorFinanceira02),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(model['MOVIMENTOS_DUPLICATA']),
								alignment: 'right',
								style: 'tableExample'
                            },							
							{
								text: utils.number.float2moeda(valorTotal),
								alignment: 'right',
								style: 'tableExample'
                            }                            
						]);

						totalQuantidade    += model['MOVIMENTOS_QUANTIDADE'];
						totalDinheiro      += model['MOVIMENTOS_DINHEIRO'];
						totalTransferencia += model['MOVIMENTOS_TRANSFERENCIA'];
						totalCheque        += valorCheque;
						totalChequePrazo   += valorChequePrazo;
						totalCartao01      += valorCartao01;
						totalCartao02      += valorCartao02;
						totalCartao03      += valorCartao03;
						totalFinanceira01  += valorFinanceira01
						totalFinanceira02  += valorFinanceira02
						totalDuplicata     += model['MOVIMENTOS_DUPLICATA'];
						totalGeral         += valorTotal;

						geralQuantidade    += model['MOVIMENTOS_QUANTIDADE'];
						geralDinheiro      += model['MOVIMENTOS_DINHEIRO'];
						geralTransferencia += model['MOVIMENTOS_TRANSFERENCIA'];
						geralCheque        += valorCheque;
						geralChequePrazo   += valorChequePrazo;
						geralCartao01      += valorCartao01;
						geralCartao02      += valorCartao02;
						geralCartao03      += valorCartao03;
						geralFinanceira01  += valorFinanceira01;
						geralFinanceira02  += valorFinanceira02;
						geralDuplicata     += model['MOVIMENTOS_DUPLICATA'];
						geralGeral         += valorTotal;
					}

					rows.push([
						{
							text: 'TOTAL',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: totalQuantidade,
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDinheiro),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalTransferencia),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalCheque),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(totalChequePrazo),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalCartao01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalCartao02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalCartao03),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalFinanceira01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalFinanceira02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
                            style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalDuplicata),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalGeral),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						}
					]);

					resumoLojas.push([
						{
							text: arrFans[empAnt],
							alignment: 'left',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: totalQuantidade,
							alignment: 'right',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDinheiro),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalTransferencia),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalCheque),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
							
						},
						{
							text: utils.number.float2moeda(totalChequePrazo),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalCartao01),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalCartao02),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalCartao03),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalFinanceira01),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalFinanceira02),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDuplicata),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalGeral),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						}
					]);

					rows.push([
						{
							text: 'GERAL',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: geralQuantidade,
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(geralDinheiro),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralTransferencia),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralCheque),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(geralChequePrazo),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralCartao01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralCartao02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralCartao03),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralFinanceira01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralFinanceira02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
                            style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralDuplicata),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralGeral),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						}
					]);

					rows.push([
						{
							text: 'a',
							color: 'white',
							colSpan: 13,
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'FILIAL',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Qtde',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Dinheiro',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Transf/Pix',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Cheque Vista',
							style: 'tableHeader',
							alignment: 'center'									
						},								
						{
							text: 'Cheque Pré',
							style: 'tableHeader',
							alignment: 'center'
						},								
						{
							text: `${idMaquina01}`,
							style: 'tableHeader',
							alignment: 'center'
						},				
						{
							text: `${idMaquina02}`,
							style: 'tableHeader',
							alignment: 'center'
						},				
						{
							text: `${idMaquina03}`,
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Bradesco',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Santander',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Carnê',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Total',
							style: 'tableHeader',
							alignment: 'center'
						}
					]);

					resumoLojas.forEach(loja => {  // Resumo por loja
						rows.push(loja);
					})

					rows.push([
						{
							text: 'GERAL',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: geralQuantidade,
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(geralDinheiro),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralTransferencia),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralCheque),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(geralChequePrazo),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralCartao01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralCartao02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralCartao03),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralFinanceira01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralFinanceira02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
                            style: 'tableExample'							
						},{
							text: utils.number.float2moeda(geralDuplicata),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(geralGeral),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const obterValoresTipos = function(empresa, tipo, inicio, convenio, financeira, params) {
    return new Promise(async (resolve, reject) => {

		let sql = '';		

		if(tipo == 'CH') {  // Cheques
			sql = `select sum(CHEQUES_VALOR) as TOTAL from CHEQUES where CHEQUES_ID_EMPRESAS = ${empresa}
			              and CHEQUES_ID_MOVIMENTOS > 0
			              and CHEQUES_EMISSAO = '${inicio.replace (/\//ig,'.')}'
						  and CHEQUES_EMISSAO <> CHEQUES_VENCIMENTO`;
		} else if(tipo == 'CA') {  // Cartões
            sql = `select sum(CARTOES_VALOR) as TOTAL from CARTOES where CARTOES_ID_EMPRESAS = ${empresa} 
			              and CARTOES_ID_MOVIMENTOS > 0
			              and CARTOES_EMISSAO = '${inicio.replace (/\//ig,'.')}' 
						  and CARTOES_CONVENIO = '${convenio}' 
						  and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))`
		} else if(tipo == 'FI') { // Financeiras
            sql = `select sum(FINANCEIROS_TOTAL) as TOTAL from FINANCEIROS where FINANCEIROS_ID_EMPRESAS = ${empresa}
			              and FINANCEIROS_TIPO = 'R' 
						  and FINANCEIROS_ID_MOVIMENTOS > 0
			              and FINANCEIROS_EMISSAO = '${inicio.replace (/\//ig,'.')}' 
						  and FINANCEIROS_ID_PESSOAS = ${financeira}`
		}

       const result = await samosFB.executeSQL(sql, params);

	   resolve(result[0]['TOTAL'] || 0);
    });
};