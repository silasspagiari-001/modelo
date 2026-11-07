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
				{columns: [{},{},{},{},{},{}]},  // 6 Colunas
				{
					style: 'tableExample',
					table: { //  [DTE, HIS DOC ENT SAI SLD]  // 6 Cols
						widths: (params.tipo == '0' ? [40,  230, 55, 55, 55, 60] : [50, 50, 60, 40, 255, 50]),
						headerRows: 3,
						body: []
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

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.controlebancos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalEntradas = 0;
					let totalSaidas = 0;
					let totalCheques = 0;
					let geralCheques = 0;
					let vctoAnterior;
					let desStatus = (params.status == 0 ? 'Conciliados' : (params.status == 1 ? 'Não Conciliados' : 'Todos'));

					let cabRelatorio = '';

					if(params.tipo == '0') {  // Extrato
						cabRelatorio = (res.results.length > 0 ? `Extrato Bancário\nAgência: ${res.results[0]['PORTADORES_AGENCIA']} Conta: ${res.results[0]['PORTADORES_CONTA']} \nNome: ${res.results[0]['PORTADORES_NOME']}` : 'Extrato Bancário');
					} else {
						cabRelatorio = (res.results.length > 0 ? `Relatório de Cheques Emitidos\nAgência: ${res.results[0]['PORTADORES_AGENCIA']} Conta: ${res.results[0]['PORTADORES_CONTA']} Status: ${desStatus}\nNome: ${res.results[0]['PORTADORES_NOME']}` : 'Relatório de Cheques Emitidos');
					}

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
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: cabRelatorio,
								colSpan: 4,
								fontSize: 10,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: ' ',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 4,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						]										
					);

					if(params.tipo == '0')  { // Extrato
						rows.push(											
							[
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Histórico',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Documento',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Entradas',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Saídas',
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
								}
							]						
						)
					} else {   // Relatório de cheques
						rows.push(											
							[
								{
									text: 'Emissao',
									alignment: 'center'
								},
								{
									text: 'Vencimento',
									alignment: 'center'
								},
								{
									text: 'Compensado',
									alignment: 'center'
								},								
								{
									text: 'Nro Cheque',
									alignment: 'center'
								},								
								{
									text: 'Histórico',
									alignment: 'center'
								},				
								{
									text: 'Valor',
									alignment: 'center'
								}
							]						
						)
					}

					for(let i in res.results){

						if(params.tipo == '0') {  // Extrato
							rows.push([
								{
									text: moment(res.results[i]['CONTROLES_VENCIMENTO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['CONTROLES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['CONTROLES_DOCUMENTO'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: (res.results[i]['CONTROLES_TIPO'] == 'E' ? utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']) : ''),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: (res.results[i]['CONTROLES_TIPO'] == 'S' ? utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']) : ''),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(res.results[i]['VALORSALDO_CONTROLES']),
									alignment: 'right',
									style: 'tableExample',
								}
							]);
						} else {
							if(res.results[i]['CONTROLES_DOCUMENTO'].substring(0, 2).toUpperCase() == 'CH') {
								rows.push([
									{
										text: moment(res.results[i]['CONTROLES_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},							
									{
										text: moment(res.results[i]['CONTROLES_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},
									{
										text: moment(res.results[i]['CONTROLES_COMPENSADO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' :  moment(res.results[i]['CONTROLES_COMPENSADO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},
									{
										text: res.results[i]['CONTROLES_DOCUMENTO'],
										alignment: 'left'
									},
									{
										text: res.results[i]['CONTROLES_NOME'],
										alignment: 'left'
									},
									{
										text: utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']),
										alignment: 'right'
									}
								]);	
								totalCheques += res.results[i]['CONTROLES_VALOR'];
								geralCheques += res.results[i]['CONTROLES_VALOR'];			
							}
						}

                        totalEntradas   += (res.results[i]['CONTROLES_TIPO'] == 'E' ? res.results[i]['CONTROLES_VALOR'] : 0);
						totalSaidas     += (res.results[i]['CONTROLES_TIPO'] == 'S' ? res.results[i]['CONTROLES_VALOR'] : 0);

					}

					if(params.tipo == '0') {  // Totalizador extrato
						rows.push([
							{
								text: 'TOTAIS',
								colSpan: 3,
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},
							{
								text: utils.number.float2moeda(totalEntradas),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(totalSaidas),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: '',
								border: [false, false, false, false],
							}
						]);	
					} else {   // Totalizador Cheques
						rows.push([
							{
								text: 'TOTAL GERAL',
								colSpan: 5,
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},
							{
								text: utils.number.float2moeda(geralCheques),
								alignment: 'right',
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
