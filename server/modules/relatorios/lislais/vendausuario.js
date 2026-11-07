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
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},  // 8 Colunas
				{
					style: 'tableExample',
					table: { //   COD  [VEN  ] MUN  UF TOT %FA REG
						widths:   [30, 150, 55, 55, 55, 55, 55, 30],
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
			api.vendausuario().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let totalVendas = 0;
					let percFat = 0;
					let reguFat = 0;

					for(let t in res.results) {
						totalVendas += cents(res.results[t]['MOVIMENTOS_VALORTOTAL']);
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
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Relatório de Vendas por Vendedor',
								colSpan: 4,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
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
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
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
					);
					
                    rows.push( 
                        [
                            {
                                text: 'Código',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Nome do Vendedor',
                                style: 'tableHeader',
                                alignment: 'center',
								colSpan: 2
                            },{},
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
                                text: 'Total',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% SFAT',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Regua',
                                style: 'tableHeader',
                                alignment: 'center'									
                            }
                        ]
                    )

					for(let i in res.results){

				        percFat = ((cents(res.results[i]['MOVIMENTOS_VALORTOTAL']) / totalVendas) * 100);
						reguFat += percFat;

                        rows.push([
                            {
                                text: ('00000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-5),
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['USUARIOS_NOME'],
                                alignment: 'left',
								colSpan: 2,
                                style: 'tableExample',
                            },{},
                            {
                                text: res.results[i]['CIDADES_NOME'],
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['CIDADES_ESTADO'],
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORTOTAL']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(percFat),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(reguFat),
                                alignment: 'right',
                                style: 'tableExample'
							}
                        ]);	
                        
					}

					rows.push([
						{
							text: 'TOTAIS:',
							alignment: 'right',
							colSpan: 5,
							border: [false, false, false, false]
						},{},{},{},{},
						{
							text: utils.number.float2moeda(totalVendas / 100),
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false]							
						},
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]							
						},
						{
							text: '',
							style: 'tableExample',
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
