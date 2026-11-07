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
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [25, 30, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Num Ser Pes  Nom Dte Fat  PAc Tot Sit
						widths:  [25, 17, 25, 250, 40, 40, 250, 50, 17],  // 9 Cols.
						headerRows: 2,
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
					margin: [40, 10]  // 10, 10
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
			api.relordens().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let totalOrdens = 0;

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
								colSpan: 3,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},
							{ 
								text: 'Relatório de Ordens de Serviço', 
								colSpan: 4,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
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
								text: res.results[0] ? res.results[0]['EMPRESAS_FANTASIA'] : '',
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 4,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'N°',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Série',
								style: 'tableHeader'
							},
							{
								text: 'Cliente',
								style: 'tableHeader'
							},
							{
								text: 'Nome',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Faturamento',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Produto Acabado',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor Total',
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: 'Sit',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					)

					for(let i in res.results){

						rows.push([
							{
								text: res.results[i]['ORDENS_REFERENCIA'],
								alignment: 'left',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['ORDENS_SERIE'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: ("000000" + res.results[i]['ORDENS_ID_PESSOAS']).slice(-6),
								alignment: 'center',
								style: 'tableExample'
                            },		
							{
								text: res.results[i]['ORDENS_NOME'],
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['ORDENS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['ORDENS_REABERTURA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['ORDENS_REABERTURA']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
                            },							
							{
								text: ("000000" + res.results[i]['ORDENS_IDSKY']).slice(-6) + ' ' + res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['ORDENS_TOTAL']),
								alignment: 'right',
								style: 'tableExample'
							},
                            {
                                text: (res.results[i]['ORDENS_STATUS'] == 'N' ? 'Abe' : (res.results[i]['ORDENS_STATUS'] == 'E' ? 'Fec' : 'Fat')),
								alignment: 'center',
								style: 'tableExample'
							},
						]);

                        totalOrdens += res.results[i]['ORDENS_TOTAL'];

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 7,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalOrdens),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: '',
							border: [false, false, false, false]							
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
