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
							text: 'Relatório de Grupos',
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
			content: [   //CD ST NM MK MM CO DV DG DS DD
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD ST  NOM]
						widths: [30, 30, 220, 60, 60, 60, 60, 60, 65, 60],
						headerRows: 1,
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader'
								}, 
								{
									text: 'Status',
									style: 'tableHeader'
                                },
								{
									text: 'Nome',
									style: 'tableHeader'
								},
								{
									text: '% MarkUp',
									style: 'tableHeader'
								},
								{
									text: '% Margem Mín',
									style: 'tableHeader'
								},
								{
									text: '% Comissão',
									style: 'tableHeader'
								},
								{
									text: '% Dsc Vendedor',
									style: 'tableHeader'
								},
								{
									text: '% Dsc Gerente',
									style: 'tableHeader'
								},
								{
									text: '% Dsc Supervisor',
									style: 'tableHeader'
								},
								{
									text: '% Dsc Diretor',
									style: 'tableHeader'
								}
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
			}
		};

        return new Promise(async (resolve, reject) => {
			api.grupos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					console.log('params: ', params);
					for(let i in res.results){
						let model = res.results[i];
						rows.push([
							{   text: model['GRUPOS_ID'], alignment: 'right'},
							{	text: model['GRUPOS_STATUS'] == 'T' ? 'Ativo' : 'Inativo'},
                            {   text: model['GRUPOS_NOME']},
                            {   text: utils.number.float2moeda(model['PERCENTUAL_MARGEM']), alignment: 'right'},
							{   text: utils.number.float2moeda(model['PERCENTUAL_MARGEMMINIMA']), alignment: 'right'},
							{   text: utils.number.float2moeda(model['PERCENTUAL_COMISSAO']), alignment: 'right'},
							{   text: utils.number.float2moeda(params.descven), alignment: 'right'},
							{   text: utils.number.float2moeda(params.descger), alignment: 'right'},
							{   text: utils.number.float2moeda(params.descsup), alignment: 'right'},
							{   text: utils.number.float2moeda(params.descdir), alignment: 'right'}
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
