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
			pageMargins: [20, 40, 20, 35],
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
							text: [
								{
									text: 'Relatório diário de Movimentos de Produtos\n',
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								},
								{
									text: `Periodo: ${moment(params.inicio).format('DD/MM/YYYY')} até ${moment(params.final).format('DD/MM/YYYY')} - Grupo: ${params.grupoinicial} a ${params.grupofinal} - Produto: ${params.produtoinicial} a ${params.produtofinal}`,
									width: '*',
									style: {
										fontSize: 8,
										alignment: 'center',
										color: 'blue'
									}
								},								
							]							
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
					margin: [20, 10]
				}
			},
			styles: {
				tableExample: {
					fontSize: 9,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 9,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //  1   2   3   4   5   6
						widths: [250, 40, 20, 50, 75, 75],
						headerRows: 1,
						body: [
							[
								{
									text: 'Produto',
									style: 'tableHeader',
									alignment: 'center'									
                                },								
								{
									text: 'NF',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Sér',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Pessoa',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{}
							]
						]
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(92),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 9,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.diarioprodutos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimoProduto = 0;
					let ultimaData = '';
					for(let i in res.results){

						const model = res.results[i];

						if(ultimaData != moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')) {
							ultimaData = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
							rows.push([
								{
									text: '* * * Data: ' + ultimaData + ' * * *',
									fontSize: 12,
									colSpan: 6,
									alignment: 'center',
									border: [false, true, false, false],
									style: 'tableExample'							

								},
							]);
						}

						rows.push([
							{
								text: (ultimoProduto != model['MOVIMENTOSITENS_ID_PRODUTOS']) ? (model['MOVIMENTOSITENS_ID_PRODUTOS'] + ' - ' + (res.results[i]['PRODUTOS_NOME']) || '').slice(0, 60) : '',
								border: [false, false, false, false],
								style: 'tableExample'							
							},
                            {
								text: model['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
							},
                            {
								text: model['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: model['MOVIMENTOSITENS_QUANTIDADE'],
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},							
							{
								text: (model['PESSOAS_NOME']||'').slice(0, 35),
								border: [false, false, false, false],
								colSpan: 2,
								alignment: 'left',
								style: 'tableExample'
							},{}
						]);

						ultimoProduto = model['MOVIMENTOSITENS_ID_PRODUTOS'];
					}

					rows.push([
						{
							text: '',
							fontSize: 12,
							colSpan: 6,
							alignment: 'center',
							border: [false, true, false, false],
							style: 'tableExample'
						},
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
