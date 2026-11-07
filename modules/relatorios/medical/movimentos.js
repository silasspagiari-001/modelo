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
			content: [
				{
					style: 'tableReport',
					table: {
						widths: [50, 50, '*','*', 40, 50, 70],
						body: []
					}
				}
			],
			styles: {
				tableReport: {
					margin: [10, 10, 10, 10],
					border: 0.5
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(res => {
					let rows = docDefinition.content[0].table.body;
					let model = res.results[0];
					let produtos = model['MOVIMENTOS_ITENS'];

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 100
							}, 
							{},
							{
								text: '\n' + model['DOCUMENTOS_NOME'].toUpperCase(),
								colSpan: 3,									
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 16
								}
							}, 
							{}, 
							{},
							{
								colSpan: 2,									
								text: [
									{
										text: 'N.º\n\n', 
										fontSize: 10, 
										alignment: 'center'
									},
									{
										text: model['MOVIMENTOS_NUMERO'],  
										fontSize: 20, 
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 16
										}
									}
								]
							}, 
							{}
						],
						[
							{
								text: 'Nome'
							},
							{
								text: model['MOVIMENTOS_NOME'],
								colSpan: 4
							}, 
							{}, 
							{}, 
							{},
							{
								text: 'Data'
							},
							{
								text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')
							}
						],
						[
							{ 
								text: '\n', 
								colSpan: 7,									
								border: [false, false, false, false]
							}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}
						],
						[
							{
								text: 'Código',
								style: {
									bold: true
								}
							},
							{
								text: 'Descrição',
								colSpan: 3,									
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{
								text: 'Qtde',
								style: {
									bold: true
								}
							},
							{
								text: 'Preço',
								style: {
									bold: true
								}
							},
							{
								text: 'Total',
								style: {
									bold: true
								}
							}
						]
					);

					for(let i in produtos){
						rows.push([
							{
								text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'right'
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								colSpan: 3
							}, 
							{}, 
							{},
							{
								text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
								alignment: 'right'
							},
							{
								text: produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).replace('.',','),
								alignment: 'right'
							},
							{
								text: (produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] * produtos[i]['MOVIMENTOSITENS_PRECO']).toFixed(2).replace('.',','),
								alignment: 'right'
							}
						]);
					}

					rows.push(
						[
							{ 
								text: '\n', 
								colSpan: 7,									
								border: [false, false, false, false]
							}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}
						],
						[
							{
								text: 'Observações',
								fontSize: 10,							
								border: [true, true, true, false],							
								colSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Frete',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_FRETE'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{
								text: model['MOVIMENTOS_OBSERVACOES'] || '',
								border: [true, false, true, true],							
								colSpan: 5,
								rowSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Despesas',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_DESPESAS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Seguro',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_SEGURO'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Descontos',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_DESCONTOS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Produtos',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_PRODUTOS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Total',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_TOTAL'].toFixed(2).replace('.',','),
								alignment: 'right',							
								style: {
									bold: true
								}
							}
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