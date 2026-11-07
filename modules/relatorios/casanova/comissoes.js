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
		if(params.tipo == 0) { // Sintético
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{}]},
					{
						style: 'tableExample',
						table: {   // EMP  V  NOM  BV  CV  BP  CP  BD  CD  TOT
							widths:   [15, 15, 90, 50, 50, 50, 50, 50, 50, 50],  // 10 Cols.
							headerRows: 3,
							body: []
						},
						layout: {
							fillColor: function (i) {
								return (i % 2 === 0) ? '#E3E3E3' : null;
							}
						}
					}
				],
				footer: function(page, pages) {
					return { 
						stack: [ 
							'_'.repeat(95),
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
		} else {    // Analítico
			docDefinition = {
				pageOrientation: 'landscape',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]}, // 17 Cols
					{
						style: 'tableExample',  // BV - Base Vista, CV - Comissão Vista, DV - Devoluções
						table: {   // EMP TIP NUM SER DTE PRO DES QTD %CV  BV  CV  %CV BP  CP  BD  CD TOT
							widths:  [12, 12, 20, 15, 35, 25, 145, 40, 25, 42, 42, 30, 42, 42, 42, 42, 42],  // 17 Cols.
							headerRows: 3,
							body: []
						},
						layout: {
							fillColor: function (i) {
								return (i % 2 === 0) ? '#E3E3E3' : null;
							}
						}
					}
				],
				footer: function(page, pages) {
					return { 
						stack: [ 
							'_'.repeat(140),
							{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
						],
						margin: [25, 10]
					};
				},
				styles: {
					tableExample: {
						fontSize: 6,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 6,
						color: 'black'
					}
				}
			};
		}

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.comissoes().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let venBaseVista = 0;
					let venComissaoVista = 0;
					let venBasePrazo = 0;
					let venComissaoPrazo = 0;
					let venBaseDevolucoes = 0;
					let venComissaoDevolucoes = 0;
					let venLiquido = 0;

					let totalBaseVista = 0;
					let totalComissaoVista = 0;
					let totalBasePrazo = 0;
					let totalComissaoPrazo = 0;
					let totalBaseDevolucoes = 0;
					let totalComissaoDevolucoes = 0;
					let totalLiquido = 0;

					let valorComLiquida = 0;
					let ultimoVendedor = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					if (params.tipo == 0) { // Sintético
							rows.push(		
								[
									{							
										image: pathLogo,
										width: 80,
										colSpan: 2,
										fontSize: 10,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'Relatório de Comissões - Sintético',
										colSpan: 6,
										fontSize: 10,
										alignment: 'center',
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
									},{},
								],												
								[
									{
										text: '',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: '',
										style: 'tableHeader',
										alignment: 'center'									
									},							
									{
										text: '',
										style: 'tableHeader'
									},
									{
										colSpan: 2,
										text: 'A Vista',   // Base/Comissão a vista
										style: 'tableHeader',
										alignment: 'center'									
									},{},
									{
										colSpan: 2,
										text: 'A Prazo',   // Base/Comissão a prazo
										style: 'tableHeader',
										alignment: 'center'									
									},{},
									{
										colSpan: 2,										
										text: 'Devoluções', // Base/Comissão Devoluções
										style: 'tableHeader',
										alignment: 'center'
									},{},																			
									{
										text: '',           // Coluna do total liquido da devolução abaixo
										style: 'tableHeader',
										alignment: 'center'
									}																								
								],
								[
									{
										text: 'Ven',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Emp',
										style: 'tableHeader',
										alignment: 'center'									
									},
									
									{
										text: 'Nome do Vendedor',
										style: 'tableHeader'
									},
									{
										text: 'Base',   // Base a vista
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Comissão', // Comissão a vista
										style: 'tableHeader',
										alignment: 'center'									
									},								
									{
										text: 'Base',  // Base a prazo
										style: 'tableHeader',
										alignment: 'center'
									},								
									{
										text: 'Comissão',  // Comissão a prazo
										style: 'tableHeader',
										alignment: 'center'
									},				
									{
										text: 'Base',  // Base Devolução
										style: 'tableHeader',
										alignment: 'center'
									},								
									{
										text: 'Comissão',  // Comissão Devolução
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

							for(let i in res.results){

								valorComLiquida = (res.results[i]['MOVIMENTOS_COMISSAOVISTA'] +
												res.results[i]['MOVIMENTOS_COMISSAOPRAZO'] -
												res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO']);
											
								rows.push([
									{
										text: res.results[i]['MOVIMENTOS_ID_USUARIOS'],
										alignment: 'right',
										style: 'tableExample',
									},							
									{
										text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
										alignment: 'right',
										style: 'tableExample',
									},														
									{
										text: res.results[i]['USUARIOS_NOME'],
										alignment: 'left',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEVISTA']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAOVISTA']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEPRAZO']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAOPRAZO']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(valorComLiquida),
										alignment: 'right',
										style: 'tableExample'
									},
								]);

								totalBaseVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
								totalComissaoVista += res.results[i]['MOVIMENTOS_COMISSAOVISTA'];
								totalBasePrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
								totalComissaoPrazo += res.results[i]['MOVIMENTOS_COMISSAOPRAZO'];
								totalBaseDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']
								totalComissaoDevolucoes += res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO'];
								totalLiquido += valorComLiquida;
							}

							rows.push([
								{
									text: 'TOTAIS',
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(totalBaseVista),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								},{
									text: utils.number.float2moeda(totalComissaoVista),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
									
								},{
									text: utils.number.float2moeda(totalBasePrazo),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'							
								},{
									text: utils.number.float2moeda(totalComissaoPrazo),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
									
								},{
									text: utils.number.float2moeda(totalBaseDevolucoes),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'							
								},{
									text: utils.number.float2moeda(totalComissaoDevolucoes),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'								
								},{
									text: utils.number.float2moeda(totalLiquido),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'							
								}
							]);
					} else { // Analítico (17 Colunas)
						rows.push(		
							[
								{							
									image: pathLogo,
									width: 80,
									colSpan: 2,
									fontSize: 10,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Relatório de Comissões - Analítico',
									colSpan: 13,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},
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
									text: '',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Período: ' + params.inicio + ' a ' + params.final,
									colSpan: 13,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],												
							[
								{
									text: 'Emp',  // Col 01
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Tip',  // Col 02
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Nº',  // Col 03
									style: 'tableHeader'
								},
								{
									text: 'Série',  // Col 04
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Emissão',  // Col 05
									style: 'tableHeader',
									alignment: 'center'									
								},								
								{
									text: 'Produto',  // Col 06
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Descrição',  // Col 07
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Qtde',  // Col 08
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '% Com V',  // Col 09
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'BaseVista',  // Col 10
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'ComVista',  // Col 11
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '% Com P',  // Col 12
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'BasePrazo',  // Col 13
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'ComPrazo',  // Col 14
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'BaseDevolu',  // Col 15
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'ComDevolu',  // Col 16
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Total',  // Col 17
									style: 'tableHeader',
									alignment: 'center'
								}								
								
							],
						)

						for(let i in res.results){

							if(ultimoVendedor !== res.results[i]['MOVIMENTOS_ID_USUARIOS']) { 
								if(ultimoVendedor > 0) {
									rows.push([
										{
											text: 'Total Vendedor',
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											colSpan: 9,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(venBaseVista),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
										},{
											text: utils.number.float2moeda(venComissaoVista),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'											
										},{
											text: '',  // % Comissão prazo
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'											
										},{											
											text: utils.number.float2moeda(venBasePrazo),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},{
											text: utils.number.float2moeda(venComissaoPrazo),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
											
										},{
											text: utils.number.float2moeda(venDevolucoes),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},{
											text: utils.number.float2moeda(venDevolucoes),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
										},{
											text: utils.number.float2moeda(venLiquido),
											alignment: 'right',
											fontSize: 6,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);												
								}
								ultimoVendedor = res.results[i]['MOVIMENTOS_ID_USUARIOS'];								
								venBaseVista = 0;
								venComissaoVista = 0;
								venBasePrazo = 0;
								venComissaoPrazo = 0;
								venBaseDevolucoes = 0;
								venComissaoDevolucoes = 0;
								venLiquido = 0;											
								rows.push([
									{
										text: 'Vendedor: ' +
											  res.results[i]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + 
											  res.results[i]['USUARIOS_NOME'],
										alignment: 'center',
										fontSize: 10,
										bold: true,							
										colSpan: 17,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]);
							}

							valorComLiquida = (res.results[i]['MOVIMENTOS_COMISSAOVISTA'] +
											res.results[i]['MOVIMENTOS_COMISSAOPRAZO'] -
											res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO']);
										
							rows.push([
								{
									text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'left',
									style: 'tableExample'
								},
								{
									text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'right',
									style: 'tableExample',
								},								
								{
									text: res.results[i]['PRODUTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_QUANTIDADE']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: res.results[i]['MOVIMENTOS_BASEVISTA'] > 0 ? utils.number.float2moeda(res.results[i]['SALDOS_COMISSAO']) : '',
									alignment: 'right',
									style: 'tableExample'
								},								
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEVISTA']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAOVISTA']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: res.results[i]['MOVIMENTOS_BASEPRAZO'] > 0 ? utils.number.float2moeda(res.results[i]['SALDOS_COMISSAOPRAZO']) : '',
									alignment: 'right',
									style: 'tableExample'
								},																
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEPRAZO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAOPRAZO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO']),
									alignment: 'right',
									style: 'tableExample'
								},								
								{
									text: utils.number.float2moeda(valorComLiquida),
									alignment: 'right',
									style: 'tableExample'
								}
							]);

							venBaseVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
							venComissaoVista += res.results[i]['MOVIMENTOS_COMISSAOVISTA'];
							venBasePrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
							venComissaoPrazo += res.results[i]['MOVIMENTOS_COMISSAOPRAZO'];
							venBaseDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO'];
							venComissaoDevolucoes += res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO'];
							venLiquido += valorComLiquida;

							totalBaseVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
							totalComissaoVista += res.results[i]['MOVIMENTOS_COMISSAOVISTA'];
							totalBasePrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
							totalComissaoPrazo += res.results[i]['MOVIMENTOS_COMISSAOPRAZO'];
							totalBaseDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO'];
							totalComissaoDevolucoes += res.results[i]['MOVIMENTOS_COMISSAODEVOLUCAO'];
							totalLiquido += valorComLiquida;
						}

						rows.push([
							{
								text: 'Total Vendedor',
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(venBaseVista),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: utils.number.float2moeda(venComissaoVista),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
								
							},{
								text: '',  // % Comissão prazo
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'								
							},{								
								text: utils.number.float2moeda(venBasePrazo),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(venComissaoPrazo),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
								
							},{
								text: utils.number.float2moeda(venBaseDevolucoes),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(venComissaoDevolucoes),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{								
								text: utils.number.float2moeda(venLiquido),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);

						rows.push([
							{
								text: 'Total Geral',
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalBaseVista),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: utils.number.float2moeda(totalComissaoVista),
								alignment: 'right',
								fontSize: 6,
								bold: true,
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: '',  // % Comissão prazo
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'								
							},{								
								text: utils.number.float2moeda(totalBasePrazo),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(totalComissaoPrazo),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
								
							},{
								text: utils.number.float2moeda(totalBaseDevolucoes),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(totalComissaoDevolucoes),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{								
								text: utils.number.float2moeda(totalLiquido),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);						
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};