'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

module.exports = { 
    read: params => {
		let docDefinition = {};
		if(params.tipo == 0) { // Sintético (10 Cols.)
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
					{
						style: 'tableExample',
						table: { // COD  [VEN  ]  [MUN  ]  UF  [ TOT]  %FA REG
							widths: [30, 100, 70, 100, 55, 15, 25, 25, 25, 25],
							headerRows: 3,
							body: []
						}
					}
				],
				footer: function(page, pages) {
					return { 
						stack: [ 
							'_'.repeat(100),  // antes 95
							{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
						],
						margin: [25, 10]
					};
				},
				styles: {
					tableExample: {
						fontSize: 7,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 7,
						color: 'black'
					}
				}
			};	
		} else {  // Analítico (12 Cols.)
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},  // 12 Colunas
					{
						style: 'tableExample',
						table: { //   TIP  DOC SER COD  PES EMI PRO  DES QTD [TOT      ] 
							widths:   [13,  25, 13, 20, 130, 35, 20, 100, 30, 30, 22, 20],
							headerRows: 3,
							body: []
						}
					}
				],
				footer: function(page, pages) {
					return { 
						stack: [ 
							{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
						],
						margin: [25, 10]
					};
				},
				styles: {
					tableExample: {
						fontSize: 6,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 6,
						color: 'black'
					}
				}
			};	
		}

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendausuario().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let totalVendas = 0;

					let totalQtdDocto = 0;
					let totalVlrDocto = 0;

					let totalQtdVendedor = 0;
					let totalVlrVendedor = 0;
					let totalCusVendedor = 0;
					
					let geralQtdVendedor = 0;
					let geralVlrVendedor = 0;
					let geralCusVendedor = 0;

					let docAnt;
					let docAtu;
					let venAnt;
					let model;
					let percFat = 0;
					let reguFat = 0;

					for(let t in res.results) {
						totalVendas += cents(res.results[t]['MOVIMENTOS_VALORTOTAL']);
					}

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

					if(params.tipo == 0) { // Sintético
						rows.push(		
							[
								{							
									image: pathLogo,
									width: 100,
									height: 22,	
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Relatório de Vendas por Vendedor - Sintético',
									colSpan: 6,
									fontSize: 12,
									alignment: 'center',
									color: 'blue',
									border: [false, false, false, false]
								},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									colSpan: 2,
									fontSize: 8,
									alignment: 'right',
									border: [false, false, false, false]								
								},{}
							],
							[
								{							
									text: ' ',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Período: ' + params.inicio + ' a ' + params.final,
									colSpan: 6,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],	
						);
						
						rows.push( 
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome do Vendedor',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'Cidade',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'UF',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Total',
									style: 'tableHeader',
									colSpan: 2,
									alignment: 'center'
								},{},								
								{
									text: '% SFAT',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Regua',
									style: 'tableHeader',
									alignment: 'center'									
								}
							]
						)	
					} else { // Analítico
						rows.push(		
							[
								{							
									image: pathLogo,
									width: 100,
									height: 22,	
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Relatório de Vendas por Vendedor - Analítico',
									colSpan: 8,
									fontSize: 12,
									alignment: 'center',
									color: 'blue',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									colSpan: 2,
									fontSize: 8,
									alignment: 'right',
									border: [false, false, false, false]								
								},{}
							],
							[
								{							
									text: ' ',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Período: ' + params.inicio + ' a ' + params.final,
									colSpan: 8,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],	
						);
						
						rows.push( 
							[
								{
									text: 'TIP',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Docto',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Sér',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Cód',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Pessoa',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Emissão',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Prod',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Descrição',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{}
							]
						)	
					}

					if(params.tipo == 0) {  // Sintético
						for(let i in res.results){
							percFat = ((cents(res.results[i]['MOVIMENTOS_VALORTOTAL']) / totalVendas) * 100);
							reguFat += percFat;
	
							rows.push([
								{
									text: ('00000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-5),
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: res.results[i]['USUARIOS_NOME'],
									alignment: 'left',
									colSpan: 2,
									style: 'tableExample'
								},{},
								{
									text: res.results[i]['CIDADES_NOME'],
									alignment: 'left',
									colSpan: 2,
									style: 'tableExample'
								},{},
								{
									text: res.results[i]['CIDADES_ESTADO'],
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORTOTAL']),
									alignment: 'right',
									colSpan: 2,
									style: 'tableExample'
								},{},								
								{
									text: utils.number.float2moeda(percFat),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(reguFat),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
							
						}
	
						rows.push([
							{
								text: 'TOTAL:',
								alignment: 'right',
								bold: true,
								colSpan: 6,
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalVendas / 100),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								colSpan: 2,
								border: [false, false, false, false]							
							},{},
							{
								text: '',
								border: [false, false, false, false],
								colSpan: 2
							},{}							
						]);	
					} else {  // Analítico
						for(let i in res.results){

							model = res.results[i]; 

							docAtu = model['MOVIMENTOS_NUMERO'];

							let tipDoc = siglaDocumento(model['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4));

							if(docAnt != model['MOVIMENTOS_NUMERO']) {
								if(totalVlrDocto > 0) {
									rows.push([
										{
											text: 'Total do Documento',
											colSpan: 9,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totalQtdDocto),
											bold: true,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalVlrDocto),
											alignment: 'right',
											colSpan: 2,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{}
									]);			
								}
								totalVlrDocto = 0;
								totalQtdDocto = 0;
							}

							if(venAnt != model['MOVIMENTOS_ID_USUARIOS']) {
								if(totalVlrVendedor > 0) {
									rows.push([
										{
											text: 'Total do Vendedor',
											colSpan: 9,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totalQtdVendedor),
											bold: true,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalVlrVendedor),
											alignment: 'right',
											colSpan: 2,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{}
									]);			
								}
								rows.push([
									{
										text: '****** VENDEDOR: ' + ("00000" + model['MOVIMENTOS_ID_USUARIOS']).slice(-5) + ' ' + model['USUARIOS_NOME'] + ' ******',
										colSpan: 12,
										fontSize: 10,
										alignment: 'center',
										bold: true,
										style: 'tableExample',
										border: [false, false, false, false]											
									},{},{},{},{},{},{},{},{},{},{},{}
								]);			
								venAnt           = model['MOVIMENTOS_ID_USUARIOS'];
								totalVlrVendedor = 0;
								totalQtdVendedor = 0;
							}

							rows.push([
								{
									text: docAtu == docAnt ? '' : tipDoc,
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_ID_PESSOAS'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_NOME'].substring(0, 36),
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]
								},
								{
									text: model['PRODUTOS_NOME'].substring(0, 36),
									style: 'tableExample',
									colSpan: 2,
									border: [false, false, false, false]									
								},{},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_QUANTIDADE']),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right',
									colSpan: 2,
									style: 'tableExample',
									border: [false, false, false, false]									
								},{}
							]);	

							totalQtdDocto    += model['MOVIMENTOSITENS_QUANTIDADE'];
							totalQtdVendedor += model['MOVIMENTOSITENS_QUANTIDADE'];
							geralQtdVendedor += model['MOVIMENTOSITENS_QUANTIDADE'];

							totalVlrDocto    += model['MOVIMENTOSITENS_TOTAL'];
							totalVlrVendedor += model['MOVIMENTOSITENS_TOTAL'];
							geralVlrVendedor += model['MOVIMENTOSITENS_TOTAL'];

							if(docAnt != model['MOVIMENTOS_NUMERO']) {
								docAnt = model['MOVIMENTOS_NUMERO'];
							}
							
						}

						rows.push([
							{
								text: 'Total do Documento',
								colSpan: 9,
								bold: true,
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalQtdDocto),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalVlrDocto),
								alignment: 'right',
								colSpan: 2,
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{}
						]);

						rows.push([
							{
								text: 'Total do Vendedor',
								colSpan: 9,
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalQtdVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalVlrVendedor),
								alignment: 'right',
								colSpan: 2,
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{}
						]);

						rows.push([
							{
								text: 'Geral Vendedor',
								colSpan: 9,
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralQtdVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(geralVlrVendedor),
								alignment: 'right',
								colSpan: 2,
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{}
						]);			
						
					}

					pdfStream(docDefinition, resolve, reject);
					db.detach();					
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const siglaDocumento = function(idDocumento) {

	if(idDocumento == '0001') {	return 'ORC'; } else
	if(idDocumento == '0002') { return 'PED'; } else
	if(idDocumento == '0003') { return 'NFS'; } else
	if(idDocumento == '0004') { return 'REQ'; } else
	if(idDocumento == '0005') { return 'NFE'; } else
	if(idDocumento == '0006') { return 'CPA'; } else	
	if(idDocumento == '0007') { return 'ORD'; } else
	if(idDocumento == '0008') { return 'DUP'; } else
	if(idDocumento == '0009') { return 'DUP'; } else 
	                          { return 'NDA'}
	
};