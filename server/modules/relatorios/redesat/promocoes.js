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
        return new Promise(async (resolve, reject) => {
			api.promocoes().readById(params.id, params)
				.then(res => {
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					let docDefinition = {
						pageOrientation: 'portrait',
						pageSize: 'A4',
						pageMargins: [10, 60, 20, 35],  //[20, 60, 20, 35], 
						fontSize: 6,
						header: function(page, pages) { 
							return { 
								alignment: 'justify',
								columns: [
									{
										image: pathLogo,
										width: 100,
										height: 22,
										alignment: 'left'
									},
									{
										text: 'PROMOÇÕES',
										width: '*',
										style: {
											fontSize: 11,
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
								margin: [15, 25]
							}
						},
						content: [   // 1  2  3  4  5  6  7  8  9 10 
							{columns: [{},{},{},{},{},{},{},{},{},{}]},
							{
								style: 'tableExample',
								layout: {
									fillColor: function (i) {
										return (i % 2 === 1 && i > 3) ? '#E3E3E3' : null;
									}
								},
								table: {
									widths: [35, 45, 135, 45, 40, 40, 45, 30, 30, 40],
									headerRows: 1,
									border: [false, false, false, false],
									body: [
										[
											{
												text: 'Empresa:',
												border: [true, true, false, false]				
											},
											{
												text: res.results[0]['EMPRESAS_NOME'],
												style: {
													bold: true
												},
												border: [false, true, false, false],
												colSpan: 3				
											},{},{},
											{
												text: [
													'Validade: ',
													{
														text: res.results[0]['PROMOCOES_EMISSAO'].split('-').reverse().join('/'),
														style: {
															bold: true
														}
													},
													'   Até: ',
													{
														text: res.results[0]['PROMOCOES_VALIDADE'].split('-').reverse().join('/'),
														style: {
															bold: true
														}
													}
												],
												border: [false, true, false, false],
												colSpan: 4				
											},{},{},{},
											{
												text: [
													'Número: ',
													{
														text: res.results[0]['PROMOCOES_ID'],
														style: {
															bold: true
														}
													}
												],
												alignment: 'right',
												border: [false, true, true, false],				
												colSpan: 2				
											},{}                                     
										],
										[
											{
												text: 'Filial:',
												border: [true, false, false, true]				
											},
											{
												text: res.results[0]['EMPRESAS_FANTASIA'],
												style: {
													bold: true
												},
												colSpan: 3,
												border: [false, false, false, true]				
											},{},{},
											{
												text: [
													'Cidade: ',
													{
														text: res.results[0]['CIDADES_NOME'],
														style: {
															bold: true
														}
													}
												],
												colSpan: 3,
												border: [false, false, false, true]				
											},{},{},
											{
												text: res.results[0]['PROMOCOES_NOME'],
												style: {
													bold: true
												},
												alignment: 'right',
												border: [false, false, true, true],				
												colSpan: 3				
											},{},{}
										],
										[{text: 'A', style:{color:'white', fontSize: 5},border:[false, false, false, false],colSpan:10},{},{},{},{},{},{},{},{},{}],
										[
											{
												text: 'Código',
												border: [false, false, false, true],
												style:{
													color: '#190B81',
													bold: true
												}
											},
											{
												text: 'Cód Fábrica',
												border: [false, false, false, true],
												style:{
													color: '#190B81',
													bold: true
												}
											},
											{
												text: 'Descrição do Produto',
												border: [false, false, false, true],
												colSpan: 6,
												style:{
													color: '#190B81',
													bold: true
												}
											},{},{},{},{},{},
											{
												text: 'Preço',
												border: [false, false, false, true],
												style:{
													alignment: 'right',													
													color: '#190B81',
													bold: true
												}
											},
											{
												text: 'Promoção',
												border: [false, false, false, true],
												alignment: 'right',
												style:{
													color: '#190B81',
													bold: true
												}
											}
										]
									]
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									'_'.repeat(95),
									{ text: 'Página: ' + page.toString(), italics: true, alignment: 'right'}
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
								fontSize: 6,
								color: 'black'
							}
						}
					};

					let rows   = docDefinition.content[1].table.body;					

					for(let i in res.results[0]['PROMOCOES_ITENS']){
						const produto = res.results[0]['PROMOCOES_ITENS'][i];

						rows.push([
							{
								text: produto['PROMOCOESITENS_ID_PRODUTOS'],
								style: {fontSize: 8, alignment: 'right'},
								border: [false, false, false, false]
							},
							{
								text: produto['PRODUTOS_FABRICA'],
								border: [false, false, false, false]
							},
							{
								text: produto['PRODUTOS_NOME'],
								border: [false, false, false, false],
								colSpan: 6
							},{},{},{},{},{},
							{
								text: utils.number.float2moeda(produto['SALDOS_PRECO']),
								alignment: 'right',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(produto['PROMOCOESITENS_VALOR']),
								alignment: 'right',
								border: [false, false, false, false]
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