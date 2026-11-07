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
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [30, 30, 30, 30],
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 10,
                    table: {
						widths: [80, 425],
						body: []
					}
				} 
			],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			}
		};

        return new Promise((resolve, reject) => {
			api.romaneiosmoveis().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
                    const romaneio = res.results[0];
                    const pedidos = romaneio['ROMANEIOS_ITENS'];
                    const primeiroItem = pedidos && pedidos[0] ? pedidos[0] : {};
                    const tipo = (romaneio['DOCUMENTOS_NOME'] || '').slice(9, Infinity).toUpperCase();
                    const dataEntrega  = primeiroItem['MOVIMENTOSITENS_DATAENTREGA']  && primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].toString  ? primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].split('-').reverse().join('/')  : '';
                    const dataMontagem = primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'] && primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'].toString ? primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM'].split('-').reverse().join('/') : '';

                    rows.push([
                        {
                            text: 'ORDEM DE SERVIÇO EXECUTADO\n',
                            fontSize: 22, 
                            border: [true, true, true, false],
                            bold: true,
                            colSpan: 2,
                            alignment: 'center'
                        },{}
                    ]);
                
                    rows.push([
                        {
                            text: 'A',
                            color: 'white',
                            fontSize: 2,
                            colSpan: 2,
                            border: [true, false, true, false],
                            bold: true
                        },{}
                    ]);

                    rows.push([
                        {
                            text: 'PRESTADOR: ',
                            border: [true, false, false, false]
                        },
                        {
                            text: romaneio['PESSOAS_NOME'],
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'TIPO: ',
                            border: [true, false, false, false]
                        },
                        {
                            text: tipo,
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'DATA: ',
                            border: [true, false, false, false]
                        },
                        {
                            text: tipo == 'ENTREGA' ? dataEntrega : dataMontagem,
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'N° ORDEM',
                            border: [true, false, false, false]
                        },
                        {
                            text: romaneio['ROMANEIOS_NUMERO'],
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'VLR SERVIÇOS: ',
                            border: [true, false, false, false]
                        },
                        {
                            text: utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'VLR ROMANEIO: ',
                            border: [true, false, false, false]
                        },
                        {
                            text: utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
                            bold: true,
                            border: [false, false, true, false]
                        }
                    ]);

                    rows.push([
                        {
                            text: '\n\n____________________________________________',
                            alignment: 'center',
                            border: [true, false, true, false],
                            colSpan: 2
                        },{}
                    ]);

                    rows.push([
                        {
                            text: 'Assinatura do Prestador',
                            border: [true, false, true, true],
                            alignment: 'center',
                            colSpan: 2
                        },{}
                    ]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};