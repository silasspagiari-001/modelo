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
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}
		
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [28, 50, 28, 40],
			header: function(page, pages) { 
				return { 
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 80,
							height: 25,
						},
						{
							text: 'REMESSA DE CHEQUES',
							width: '*',
							style: {
								fontSize: 16,
								alignment: 'center',
                                color: 'red'
							}
						},
						{
							stack: [
								moment.tz(params.timezone).format('DD/MM/YYYY'),
								moment.tz(params.timezone).format('HH:mm:ss')
							],
							width: 100,
							style: {
								fontSize: 10,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [40, 15]
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: { 
						widths: [42, '*', 90, 20, 50, 50, 50],
						headerRows: 1,
						body: []
					},
					layout: {
						fillColor: function (i, comp) {
							return (
								i % 2 === 0 && 
								i > 2 && 
								i != comp.table.body.length - 1 && 
								i != comp.table.body.length - 2
							) ? 
							'#E3E3E3' : 
							null;
						}
					}
				}
			],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						'_'.repeat(100),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 10,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					alignment: 'center',
					color: 'darkblue'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.remessascheques().read(params)
				.then(res => {
                    const rows = docDefinition.content[1].table.body;
					const remessa = res.results[0];
					const cheques = (remessa['REMESSAS_ITENS'] || []);
					const total = cheques.reduce((soma, cheque) => {
						return soma += parseInt((cheque['CHEQUES_VALOR'] * (Math.pow(10, 2))).toFixed(2));
					}, 0) / 100;

                    if(remessa) {
                        rows.push([
                            {
                                text: 'Empresa:',
                                border: [true, true, false, false]
                            },							
                            {   
                                text: remessa['EMPRESAS_FANTASIA'],
                                border: [false, true, false, false],
                                colSpan: 4
                            },{},{},{},
                            {
								text: [
									{
										text: 'Emissão: '
									},
									{
										text: (remessa['REMESSAS_EMISSAO'] || '').split('-').reverse( ).join('/'),
										bold: true,
										border: [false, true, false, false]
									}
								],
								alignment: 'right',
                                colSpan: 2,
                                border: [false, true, true, false]
                            },{}
                        ]);

                        rows.push([
                            {
                                text: '',
                                colSpan: 5,
                                border: [true, false, false, true]
                            },{},{},{},{},
                            {
								text: [
									{
										text: 'Número: '
									},
									{
										text: ("000000" + remessa['REMESSAS_NUMERO']).slice(-6) + ' ' + remessa['REMESSAS_SERIE'],
										bold: true
									}
								],
								alignment: 'right',
                                colSpan: 2,
                                border: [false, false, true, true]
                            },{}
                        ]);

                        rows.push([
                            {
								text: 'A',
								color: 'white',
                                colSpan: 7,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{}
                        ]);

                        rows.push([
                            {
                                text: 'Número',
								style: 'tableHeader',
								border: [false, false, false, true]
                            },
                            {
                                text: 'Nome do Emitente',
                                style: 'tableHeader',
								border: [false, false, false, true]
                            }, 
                            {
                                text: 'CPF/CNPJ',
                                style: 'tableHeader',
								border: [false, false, false, true]
                            }, 
                            {
								text: 'Bco',
                                style: 'tableHeader',
								border: [false, false, false, true]
                            },
                            {
                                text: 'Emissão',
								style: 'tableHeader',
								border: [false, false, false, true]
                            },	
                            {
                                text: 'Bom Para',
                                style: 'tableHeader',
								border: [false, false, false, true]
                            },
                            {
                                text: 'Vlr Pago',
                                style: 'tableHeader',
								border: [false, false, false, true]
                            }
                        ]);

                        cheques.forEach(cheque => {
                            rows.push([
                                {
                                    text: cheque['CHEQUES_NUMERO'],
									fontSize: 9,
									alignment: 'center',
									border: [false, false, false, false]
								},
                                {   
                                    text: cheque['CHEQUES_NOME'],
									fontSize: 9,
									border: [false, false, false, false]
                                },
                                { 
                                    text: utils.string.maskCnp(cheque['CHEQUES_CPFCNPJ']),
									fontSize: 9,
									alignment: 'right',
									border: [false, false, false, false]
                                },
                                {
									text: ("000" + cheque['CHEQUES_ID_BANCOS']).slice(-3),
									alignment: 'center',
									fontSize: 9,
									border: [false, false, false, false]
                                },
                                {
                                    text: (cheque['CHEQUES_EMISSAO'] || '').split('-').reverse( ).join('/'),
									alignment: 'center',
									fontSize: 9,
									border: [false, false, false, false]
                                },
                                {
                                    text: (cheque['CHEQUES_VENCIMENTO'] || '').split('-').reverse( ).join('/'),
									alignment: 'center',
									fontSize: 9,
									border: [false, false, false, false]
                                },
                                {
                                    text: utils.number.float2moeda(cheque['CHEQUES_VALOR']),
									alignment: 'right',
									fontSize: 9,
									border: [false, false, false, false]
                                }
                            ]);
						});

                        rows.push([
                            {
								text: 'A',
								color: 'white',
                                colSpan: 7,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{}
                        ]);
						
						rows.push([
							{
								text: 'Registros: ' + cheques.length,
								alignment: 'right',
								bold: true,
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Totais:      ',
								colSpan: 4,
								alignment: 'right',
								bold: true,
								border: [false, false, false, false]
							},{},{},{},
							{
								text: utils.number.float2moeda(total),
								alignment: 'right',
								bold: true,
								border: [false, true, false, false]
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
