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
						widths: [50, 50, '*','*', '*', 140, 60],
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
			api.movimentos().readById(params.idRequisicao, params)
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
								text: 'ACERTO DE ESTOQUE',
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
										text: 'Req. N.º\n\n', 
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
								text: `Data ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`,
								colSpan: 2
							},
							{}
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
								colSpan: 4,									
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{},
							{
								text: 'Operação',
								style: {
									bold: true
								}
							},
							{
								text: 'Qtde',
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
								colSpan: 4
							}, 
							{}, 
							{},
							{},
							{
								text: produtos[i]['OPERACOES_NOME'],
								alignment: 'right'
							},
							{
								text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
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
								colSpan: 7,
								style: {
									bold: true
								}
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
								text: `${model['MOVIMENTOS_OBSERVACOES'] || ''}\n${model['MOVIMENTOS_LOG']}`,
								border: [true, false, true, true],							
								colSpan: 7,
								rowSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
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