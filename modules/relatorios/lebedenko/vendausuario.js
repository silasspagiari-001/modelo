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
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [25, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},  // 8 Colunas
				{
					style: 'tableExample',
					table: { //   COD  VEN QDV VLP MDV PRM COM  PMM
						widths:   [50, 250, 70, 80, 70, 80, 70, 40],
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
					fontSize: 12,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendausuario().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalQdeVendas   = 0;
					let totalPartida     = 0;
					let totalPrecoMinimo = 0;
                    let totalComissao    = 0;
					
					let geralQdeVendas   = 0;
					let geralPartida     = 0;
					let geralPrecoMinimo = 0;
                    let geralComissao    = 0;

					let ultimaEmpresa    = 0;

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
								alignment: 'left',
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
								alignment: 'left',
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
                                text: 'Vendedor',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Qde Vendas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Vlr Partida',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },					
                            {
                                text: 'Méd Vendas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Preço Mínimo',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Comissão',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },					
                            {
                                text: 'PMM %',
                                style: 'tableHeader',
                                alignment: 'center'									
                            }
                        ]
                    )

					for(let i in res.results){

						if(res.results[i]['USUARIOS_ID_EMPRESAS'] != ultimaEmpresa) {
							if(totalQdeVendas > 0) {
								rows.push([
									{ 
										text: 'TOTAL EMPRESA', 
										alignment: 'right',
										bold: true,
										colSpan: 2 
									},
									{},
									{
										text: totalQdeVendas,
										alignment: 'right',
										bold: true,
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPartida),										
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPartida/totalQdeVendas),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPrecoMinimo),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalComissao),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPartida) * 100)),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									}
								]);	
		
							};

							rows.push([
								{ 
									text: `EMPRESA: ${res.results[i]['USUARIOS_ID_EMPRESAS']} - ${res.results[i]['EMPRESAS_FANTASIA']} `, 
									alignment: 'center',
									colSpan: 8,
									fontSize: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{}
							]);	

							ultimaEmpresa    = res.results[i]['USUARIOS_ID_EMPRESAS'];
							totalQdeVendas   = 0;
							totalPartida     = 0;
							totalPrecoMinimo = 0;
							totalComissao    = 0;
						}

						let mediaVendas = (res.results[i]['MOVIMENTOS_VALORPARTIDA'] / res.results[i]['MOVIMENTOS_QTDEVENDAS']);
                        let valorPmm = (((res.results[i]['MOVIMENTOS_VALORPARTIDA'] - res.results[i]['MOVIMENTOS_PRECOMINIMO']) / res.results[i]['MOVIMENTOS_VALORPARTIDA']) * 100);

                        rows.push([
                            {
                                text: ('000000' + res.results[i]['USUARIOS_ID']).slice(-6),
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
								text: res.results[i]['USUARIOS_NOME'],
								fontSize: res.results[i]['USUARIOS_NOME'].length > 35 ? 8 : 12,
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOS_QTDEVENDAS'],
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORPARTIDA']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(mediaVendas),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_PRECOMINIMO']),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAO']),
                                alignment: 'right',
                                style: 'tableExample'
							},							
                            {
                                text: utils.number.float2moeda(valorPmm),
                                alignment: 'right',
                                style: 'tableExample'
							}
                        ]);	

						totalQdeVendas   += res.results[i]['MOVIMENTOS_QTDEVENDAS'];
						totalPartida     += res.results[i]['MOVIMENTOS_VALORPARTIDA'];
						totalPrecoMinimo += res.results[i]['MOVIMENTOS_PRECOMINIMO'];
						totalComissao    += res.results[i]['MOVIMENTOS_COMISSAO'];

						geralQdeVendas   += res.results[i]['MOVIMENTOS_QTDEVENDAS'];
						geralPartida     += res.results[i]['MOVIMENTOS_VALORPARTIDA'];
						geralPrecoMinimo += res.results[i]['MOVIMENTOS_PRECOMINIMO'];
						geralComissao    += res.results[i]['MOVIMENTOS_COMISSAO'];

					}

					rows.push([
						{ 
							text: 'TOTAL EMPRESA:', 
							alignment: 'right',
							bold: true,
							colSpan: 2 
						},
						{},
						{
							text: totalQdeVendas,
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPartida),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPartida/totalQdeVendas),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPrecoMinimo),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalComissao),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPartida) * 100)),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						}
					]);	

					rows.push([
						{ 
							text: 'TOTAL GERAL:', 
							alignment: 'right',
							bold: true,
							colSpan: 2 
						},
						{},
						{
							text: geralQdeVendas,
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPartida),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPartida / geralQdeVendas),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPrecoMinimo),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralComissao),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda((((geralPartida - geralPrecoMinimo) / geralPartida) * 100)), // PMM
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
