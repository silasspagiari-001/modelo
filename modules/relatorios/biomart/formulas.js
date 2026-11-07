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
			pageMargins: [20, 20, 20, 25],
			content: [
				{
					style: 'tableReport',
					table: { // PRO [NOME  ]  QTD  VLR  TOT  PER
						widths: [30, 50, 240,  50,  50,  50,  25],
						body: []
					}
				}
			],
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.ordensproducaoformulas().readById(params.idproduto, params)
				.then(res => {
					let rows = docDefinition.content[0].table.body;
					let model = res.results[0];
					let produtos = model['PRODUCOESFORMULAS_ITENS'];

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
								colSpan: 2,
								width: 100,
								border: [true, true, false, true]
							},{},
							{
								text: 'FÓRMULAS',
								colSpan: 3,									
								alignment: 'center',
								border: [false, true, false, true],								
								style: {
									bold: true,
									fontSize: 16
								}
							},{},{},
							{
								text: '',
								border: [false, true, true, true],
								colSpan: 2								
							},{}
						],
						[
							{
								text: `Produto: ${model['PRODUTOS_NOME']}   Descrição: ${model['PRODUCOESFORMULAS_NOME']}`,
								fontSize: 10,
								bold: true,
								colSpan: 7
							},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'COMPOSIÇÃO:', 
								colSpan: 7,		
								alignment: 'center',
                                fontSize: 12,
								bold: true,
							},{},{},{},{},{},{}
						],
						[
							{
								text: 'Produto',
								style: 'tableHeader',
							},
							{
								text: 'Nome do Produto',
								style: 'tableHeader',
								colSpan: 2,									
							},{}, 
							{
								text: 'Qtde',
								style: 'tableHeader'
							},
							{
								text: 'Valor',
								style: 'tableHeader'
							},
							{
								text: 'Total',
								style: 'tableHeader',
							},
							{
								text: '% Perc',
								style: 'tableHeader',
							}							
						]
					);

					for(let i in produtos){
						rows.push([
							{
								text: produtos[i]['FORMULASITENS_ID_PRODUTOS'],
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								style: 'tableExample',
								colSpan: 2
							},{}, 
							{
								text: produtos[i]['FORMULASITENS_QUANTIDADE'].toFixed(3).replace('.', ','),
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: produtos[i]['FORMULASITENS_CUSTO'].toFixed(3).replace('.', ','),
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: produtos[i]['VALOR_TOTAL'].toFixed(3).replace('.', ','),
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: produtos[i]['FORMULASITENS_PERCENTUAL'] == 'F' ? 'Não' : '',
								style: 'tableExample',
								alignment: 'center'
							}							
						]);
					}

					rows.push(
						[
							{ 
								text: '\n', // O total vai aqui
								colSpan: 7,									
								border: [false, false, false, false]
							},{},{},{},{},{},{}
						]
					);
					
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};