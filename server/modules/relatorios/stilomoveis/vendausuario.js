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
				{columns: [{},{},{},{},{},{},{},{}]},  // 8 Colunas
				{
					style: 'tableExample',
					table: { //   COD  VEN QDV VLP MDV CUS COM  PMM
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

					let totalQdeVendas = 0;
					let totalPartida   = 0;
					let totalMedVendas = 0;
                    let totalComissao  = 0;
                    let totalPmm       = 0;
					let ultimaEmpresa  = 0;

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
                                text: 'Custo',
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

						if(res.results[i]['MOVIMENTOS_ID_EMPRESAS'] != ultimaEmpresa) {
							if(totalQdeVendas > 0) {
								rows.push([
									{ text: '', colSpan: 2 },
									{},
									{
										text: utils.number.float2moeda(totalQdeVendas),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPartida),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalMedVendas),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalComissao),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPmm),
										alignment: 'right',
										style: 'tableExample'
									}
								]);	
		
							};
							ultimaEmpresa = res.results[i]['MOVIMENTOS_ID_EMPRESAS'];
							totalQdeVendas  = 0;
							totalPartida = 0;
							totalMedVendas  = 0;
							totalCusto      = 0;
							totalComissao   = 0;
							totalPmm        = 0;
						}

                        rows.push([
                            {
                                text: ('000000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-6),
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['USUARIOS_NOME'],
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOS_QTDVENDAS'],
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_PARTIDA']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MEDIAVENDAS']),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CUSTO']),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAO']),
                                alignment: 'right',
                                style: 'tableExample'
							},							
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_PMM']),
                                alignment: 'right',
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
