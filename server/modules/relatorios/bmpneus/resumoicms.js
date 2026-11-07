'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    create: (data, params) => { 
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 40, 15, 35],  // E S D I 
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //[B]  UF CFO ICM VLN BIC VIC ISE OUT  [B]
						widths:  [50, 15, 25, 30, 60, 60, 60, 60, 60, 50],  // 10 Cols.
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(103),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [15, 10]  // 10, 10
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
			api.resumoicms().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
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
								width: 80,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Resumo de ICMS Entrada/Saida',
								colSpan: 8,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 8,
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: '',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Referência: ' + params.mes + '/' + params.ano,
								colSpan: 8,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						],												
						[
							{
								text: 'a',
								style: 'tableHeader',
								color: 'white',
								border: [false, false, false, false]
							},
							{
								text: 'UF',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'CFOP',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: '% ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Contábil',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Base do ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor do ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Isento',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Outras',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'a',
								style: 'tableHeader',
								color: 'white',
								border: [false, false, false, false]
							}
						]
					);

					for(let i in res.results){
						rows.push([
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
							{
								text: res.results[i]['CIDADES_ESTADO'],
								alignment: 'center',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: (res.results[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100000).toFixed(3),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_ICMS']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEICMS']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORICMS']),
								alignment: 'right',
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(0), // Isentas
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL'] - res.results[i]['MOVIMENTOS_BASEICMS']), // Outras
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]								
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