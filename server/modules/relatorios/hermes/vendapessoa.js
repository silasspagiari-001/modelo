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
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { //   NUM SER VEN NOV DTE E/S PRO NOP QTD TOT
						widths:   [30, 10, 10, 40, 40, 40, 30, 200, 20, 50],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(100),  // antes 95
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 7,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 7,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendapessoa().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let docValorVenda    = 0;
					let pessoaValorVenda = 0;
					let totalValorVenda  = 0;
					let ultimoDocumento  = 0;
					let ultimaPessoa     = 0;

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
								text: 'Relatório de Venda por Pessoa - ' + (params.tipo == 0 ? 'Analítico' : 'Sintético'),
								colSpan: 6,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								fontSize: 10,
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
								colSpan: 6,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],	
					);
					
					if(params.tipo == 0) {  // Relatório Analítico
						rows.push(
							[
								{
									text: 'Número',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Se',
									style: 'tableHeader',
									alignment: 'center'									
								},                            
								{
									text: 'Vendedor',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'Emissão',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Faturado',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Produto',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Nome Produto',
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center'
								},	
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)	
					} else {  // Relatório Sintético
						rows.push( 
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome Pessoa',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 6									
								},{},{},{},{},{},
								{
									text: 'Cidade',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'UF',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)
					}

					for(let i in res.results){

						if(params.tipo == 0) { // Relatório Analítico

							if(ultimaPessoa != res.results[i]['MOVIMENTOS_ID_PESSOAS']) {
								if(docValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL DOCUMENTO',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 9,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(docValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									docValorVenda = 0;
								}
								if(pessoaValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL PESSOA',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 9,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(pessoaValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									pessoaValorVenda = 0;
								}
								rows.push([
									{
										text: '* * * Pessoa: ' + ('00000' + res.results[i]['MOVIMENTOS_ID_PESSOAS']).slice(-5) + ' - ' + 
											res.results[i]['MOVIMENTOS_NOME'] + ' - ' +
											res.results[i]['CIDADES_NOME']    + '/'   +
											res.results[i]['CIDADES_ESTADO']  + ' * * *',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 10,
										fontSize: 9,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);	
								ultimaPessoa = res.results[i]['MOVIMENTOS_ID_PESSOAS'];
							}
	
							if(ultimoDocumento != res.results[i]['MOVIMENTOS_NUMERO']) {
								if(docValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL DOCUMENTO',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 9,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(docValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									docValorVenda = 0;
								}
								rows.push([
									{
										text: ('000000' + res.results[i]['MOVIMENTOS_NUMERO']).slice(-6),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: res.results[i]['MOVIMENTOS_SERIE'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: ('000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-3) + ' ' +
											  res.results[i]['USUARIOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false],									
										colSpan: 2
									},{},
									{
										text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['PRODUTOS_NOME'],
										alignment: 'left',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									}
								]);	
								ultimoDocumento = res.results[i]['MOVIMENTOS_NUMERO'];
							} else {
								rows.push([
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},								
									{
										text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: res.results[i]['PRODUTOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									}
								]);	
							}
							docValorVenda    += res.results[i]['MOVIMENTOSITENS_TOTAL'];
							pessoaValorVenda += res.results[i]['MOVIMENTOSITENS_TOTAL'];
							totalValorVenda  += res.results[i]['MOVIMENTOSITENS_TOTAL'];

						} else {  // Relatório Sintético

							rows.push([
								{
									text: ('000000' + res.results[i]['MOVIMENTOS_ID_PESSOAS']).slice(-6),
									alignment: 'right',
									style: 'tableExample',
//									border: [false, false, false, false]									
								},
								{
									text: res.results[i]['MOVIMENTOS_NOME'],
									alignment: 'left',
									colSpan: 6,
									style: 'tableExample',
	//								border: [false, false, false, false]									
								},{},{},{},{},{},
								{
									text: res.results[i]['CIDADES_NOME'],
									alignment: 'left',
									style: 'tableExample',
		//							border: [false, false, false, false],									
								},
								{
									text: res.results[i]['CIDADES_ESTADO'],
									alignment: 'center',
			//						border: [false, false, false, false],									
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL']),
									alignment: 'right',
				//					border: [false, false, false, false],									
									style: 'tableExample'
								}
							]);	

							totalValorVenda  += res.results[i]['MOVIMENTOS_TOTAL'];

						}
                        
					}

					if(params.tipo == 0) {  // Analítico
						rows.push([ // Totalizadores finais
							{
								text: 'TOTAL DOCUMENTO',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(docValorVenda),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);
	
						rows.push([
							{
								text: 'TOTAL PESSOA',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(pessoaValorVenda),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);	
					}

					rows.push([
						{
							text: 'TOTAL GERAL',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 9,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalValorVenda),
							alignment: 'right',
							fontSize: 7,
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
