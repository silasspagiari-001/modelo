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
										text: res.results[0]['PROMOCOES_NOME'],
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
						content: [
							{columns: [{},{},{},{},{},{},{},{},{},{}]},
							{
								style: 'tableExample',
								layout: {
									fillColor: function (i) {
										return (i % 2 === 1 && i > 3) ? '#E3E3E3' : null;
									}
								},
								table: {
									widths: [35, 150, 45, 50, 50, 45, 30, 30, 22, 22],
									headerRows: 1,
									border: [false, false, false, false],
									body: [
										[
											{
												text: res.results[0]['EMPRESAS_NOME'],
												colSpan: 2,
												border: [false, false, false, false]				
											},{},
											{
												text: [
													'Validade promoção: ',
													{
														text: res.results[0]['PROMOCOES_EMISSAO'].split('-').reverse().join('/'),
														style: {
															bold: true
														}
													},
													'   Até ',
													{
														text: res.results[0]['PROMOCOES_VALIDADE'].split('-').reverse().join('/'),
														style: {
															bold: true
														}
													}
												],
												border: [false, false, false, false],
												colSpan: 6				
											},{},{},{},{},{},
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
												border: [false, false, false, false],				
												colSpan: 2				
											},{}                                     
										],
										[{text: 'A', style:{color:'white', fontSize: 5},border:[false, false, false, false],colSpan:10},{},{},{},{},{},{},{},{},{}],
										[
											{
												text: 'Código',
												style:{
													color: '#190B81',
													bold: true
												}
											},
											{
												text: 'Descrição do Produto',
												colSpan: 5,
												style:{ color: '#190B81',
													    bold: true }
											},{},{},{},{},
											{
												text: 'Marca',
												colSpan: 2,
												style:{ alignment: 'center',
													    color: '#190B81',
													    bold: true }
											},{},
											{
												text: 'Promoção',
												colSpan: 2,
												style:{	alignment: 'center',													
													    color: '#190B81',
													    bold: true }
											},{}
										]
									]
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									{ text: 'Página: ' + page.toString(), italics: true, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},
						styles: {
							tableExample: {
								fontSize: 10,  // 8
								margin: [0, 0, 0, 0]
							},
							tableHeader: {
								bold: true,
								fontSize: 8,  // 6
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
								style: {alignment: 'right'},
								border: [false, false, false, false]
							},
							{
								text: produto['PRODUTOS_NOME'],
								border: [false, false, false, false],
								colSpan: 5,
							},{},{},{},{},
							{
								text: produto['PRODUTOS_MARCA'],
								alignment: 'center',
								border: [false, false, false, false],
								colSpan: 2,
							},{},
							{
								text: utils.number.float2moeda(produto['PROMOCOESITENS_VALOR']),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
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