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
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [40, 40, 40, 35],
			header: function(page, pages) { 
				return { 
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 100,
							height: 22,
						},
						{
							text: 'Estoque de Produtos',
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
					margin: [40, 10]
				}
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
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CD BAR NOM  UNI MAR  GRP SLD
						widths: [40, 75, 300, 20, 75, 120, 70],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Cód Barras',
									style: 'tableHeader',
									alignment: 'center'									
                                },                                
								{
									text: 'Nome',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },                                
                                {
									text: 'Marca',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Grupo',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
                                }                                
							]
						]
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
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0 // 0.5
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.produtos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){
						rows.push([
							{
								text: res.results[i]['PRODUTOS_ID'],
								alignment: 'right',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['PRODUTOS_BARRA'],
								alignment: 'left',
								style: 'tableExample'
                            },
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
                                text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample'
                            },
                            {   
								text: res.results[i]['PRODUTOS_MARCA'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
								text: res.results[i]['GRUPOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
								text: res.results[i]['PRODUTOS_PESOBRUTO'],
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
