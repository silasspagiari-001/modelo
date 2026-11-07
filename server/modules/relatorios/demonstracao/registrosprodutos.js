'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    create: (data, params) => { 
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 40, 15, 35],  // E S D I 
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {
						widths:  ['*', '*', '*', '*', '*', 50, 50, 50],
						headerRows: 2,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(103),
						{ text: 'Page: ' + page.toString() + ' of ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
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
			api.livroicms().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const cents = utils.number.cents.bind(utils.number);					

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
								text: 'Report Tax for Products',
								colSpan: 3,
								bold: true,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('MM/DD/YYYY'),
								colSpan: 3,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]								
							},{},{}
						],
						[
							{							
								text: params.empresanome.split('+').join(' '),
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Period: ' + params.mes + '/' + params.ano,
								colSpan: 3,
								fontSize: 12,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('hh:mm A'),
								colSpan: 3,
								alignment: 'right',
								border: [false, false, false, false]
							},{},{}
						]
					);

                    let valorContabilPorCidade = 0;
                    let valorContabilPorEstado = 0;
                    let valorContabilGeral     = 0;
                    let valorIcmsPorCidade     = 0;
                    let valorIcmsPorEstado     = 0;
                    let valorIcmsGeral         = 0;

					for(let i in res.results){
						if(i == 0) {
							rows.push([
								{
									text: 'Description',
									style: 'tableHeader',
									colSpan: 5,
									alignment: 'center'									
								},{},{},{},{},
								{
									text: 'Sales',
									style: 'tableHeader',
									alignment: 'center'
								},																				
								{
									text: '% Tax Rate',
									style: 'tableHeader',
									alignment: 'center'
								},																												
								{
									text: 'Tax',
									style: 'tableHeader',
									alignment: 'center'									
								}
							]);
						}

                        const valorContabil = cents(res.results[i]['MOVIMENTOSITENS_TOTAL']);
                        const valorIcms     = cents(res.results[i]['MOVIMENTOSITENS_VALORICMS']);
                        const aliquota      = ((data['aliquotas'] || []).find(aliquota => aliquota['ALIQUOTAS_ESTADO'] == res.results[i]['CIDADES_ESTADO']) || {})['ALIQUOTAS_PERCENTUAL'];

                        valorContabilPorCidade += valorContabil;
                        valorContabilPorEstado += valorContabil;
                        valorContabilGeral     += valorContabil;
                        valorIcmsPorCidade     += valorIcms;
                        valorIcmsPorEstado     += valorIcms;
                        valorIcmsGeral         += valorIcms;

						rows.push([
                            {
                                text: res.results[i]['PRODUTOS_NOME'],
                                colSpan: 5,
                                alignment: 'left',
                                style: 'tableExample',
                            },{},{},{},{},							
                            {
                                text: utils.number.float2moeda(valorContabil / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(aliquota || 0),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(valorIcms / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            }		
                        ]);

						if(!res.results[parseInt(i) + 1] || (res.results[parseInt(i) + 1] && res.results[i]['CIDADES_NOME'] != res.results[parseInt(i) + 1]['CIDADES_NOME'])) {
							rows.push([
								{
									text: `Total City (${res.results[i]['CIDADES_NOME']}, ${res.results[i]['CIDADES_ESTADO']})`,
									colSpan: 5,
                                    bold: true,
									alignment: 'right',
									style: 'tableExample',
                                    border: [false, false, false, false]
								},{},{},{},{},
								{
									text: utils.number.float2moeda(valorContabilPorCidade / 100),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(aliquota || 0),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorIcmsPorCidade / 100),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								}
							]);

                            valorContabilPorCidade = 0;
                            valorIcmsPorCidade     = 0;
                        }

						if(!res.results[parseInt(i) + 1] || (res.results[parseInt(i) + 1] && res.results[i]['CIDADES_ESTADO'] != res.results[parseInt(i) + 1]['CIDADES_ESTADO'])) {
							rows.push([
								{
									text: `Total State (${res.results[i]['CIDADES_ESTADO']})`,
									colSpan: 5,
                                    bold: true,
									alignment: 'right',
									style: 'tableExample',
                                    border: [false, false, false, false]
								},{},{},{},{},
								{
									text: utils.number.float2moeda(valorContabilPorEstado / 100),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(aliquota || 0),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorIcmsPorEstado / 100),
									alignment: 'right',
                                    bold: true,
									style: 'tableExample'
								}
							]);

                            rows.push([
								{
									text: 'RC',
									color: 'white',
									colSpan: 8,
									style: 'tableExample',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{}
							]);

                            valorContabilPorEstado = 0;
                            valorIcmsPorEstado     = 0;

							if(res.results[parseInt(i) + 1]) {
								rows.push([
									{
										text: 'Description',
										style: 'tableHeader',
										colSpan: 5,
										alignment: 'center'									
									},{},{},{},{},
									{
										text: 'Sales',
										style: 'tableHeader',
										alignment: 'center'
									},																				
									{
										text: '% Tax Rate',
										style: 'tableHeader',
										alignment: 'center'
									},																												
									{
										text: 'Tax',
										style: 'tableHeader',
										alignment: 'center'									
									}
								]);
							}
                        }
                    }

					rows.push([
						{
							text: `General`,
							colSpan: 5,
							bold: true,
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},
						{
							text: utils.number.float2moeda(valorContabilGeral / 100),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(0),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(valorIcmsGeral / 100),
							alignment: 'right',
							bold: true,
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