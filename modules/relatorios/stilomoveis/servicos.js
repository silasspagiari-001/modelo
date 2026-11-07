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
			pageMargins: [20, 40, 20, 35],  // [40, 40, 40, 35],
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
							text: 'Relatório de Serviços',
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
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					alignment: 'center',
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD STA NOM PRC
						widths: [35, 40, 350, 90],
						headerRows: 1,
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader'
								}, 
								{
									text: 'Status',
									alignment: 'center',
									style: 'tableHeader'
                                },
								{
									text: 'Descrição',
									style: 'tableHeader'
								},                                
								{
									text: 'Preço',
									alignment: 'center',
									style: 'tableHeader'
								},
							]
						]
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
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
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
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.servicos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						rows.push([
							{   text: res.results[i]['SERVICOS_ID'], alignment: 'right'},
							{	text: res.results[i]['SERVICOS_STATUS'] == 'T' ? 'Ativo' : 'Inativo'},
                            {   text: res.results[i]['SERVICOS_NOME']},
							{	text: utils.number.float2moeda(res.results[i]['SERVICOS_PRECO']), alignment: 'right'}
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
