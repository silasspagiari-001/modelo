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
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{}]}, // 9 Cols
					{
                        style: 'tableExample',                       
// Emp Número Ser Emissão    Pessoa                                                  A Vista      A Prazo    Devolução        Total
// 999 999999 XXX 99/99/9999 AAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDDEEEEEEEEEE #,###,###.## #,###,###.## #,###,###.## #,###,###.##
						table: {   // EMP NUM SER EMI PES  VIS PRZ DEV TOT
							widths:  [12,  20, 15, 50, 160, 50, 50, 50, 50],  // 9 Cols.
							headerRows: 3,
							body: []
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
							'_'.repeat(95),
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

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.faturamento().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let valorLiquido = 0;
					let totalVista = 0;
					let totalPrazo = 0;
					let totalDevolucoes = 0;
					let totalLiquido = 0;

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
								width: 80,
								fontSize: 8,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Relatório de Vendas no período',
								colSpan: 7,
								fontSize: 10,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 8,
								alignment: 'right',
								border: [false, false, false, false]								
							}
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
								colSpan: 5,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						]
					);	
					if (params.tipo == 0) { // Sintético	
						rows.push(																	
							[
								{
									text: 'Lj',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Ven',
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									colSpan: 3,
									text: 'Nome',
									style: 'tableHeader'
								},{},{},
								{
									text: 'A Vista',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'A Prazo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Devoluções',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)
					} else {  // Analítico
						rows.push(																	
							[
								{
									text: 'Lj',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Número',
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Ser',
									style: 'tableHeader'
								},
								{
									text: 'Emissão',   // Data de emissão
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Pessoa',   // Pessoa
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'A Vista',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'A Prazo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Devoluções',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)
					}

					for(let i in res.results){

						valorLiquido = (res.results[i]['MOVIMENTOS_BASEVISTA'] +
						                res.results[i]['MOVIMENTOS_BASEPRAZO'] -
						                res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']);
			
						if (params.tipo == 0) { // Sintético
							rows.push([
								{
									text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOS_ID_USUARIOS'],
									alignment: 'right',
									style: 'tableExample',
								},														
								{
									colSpan: 3,
									text: res.results[i]['USUARIOS_NOME'],
									alignment: 'left',
									style: 'tableExample'
								},
								{},{},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEVISTA']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEPRAZO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorLiquido),
									alignment: 'right',
									style: 'tableExample'
								}
							]);
						} else {  // Analítico
							rows.push([
								{
									text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
								},														
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'left',
									style: 'tableExample'
								},
								{
									text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'left',
									style: 'tableExample'
								},	
								{
									text: res.results[i]['MOVIMENTOS_NOME'],
									alignment: 'left',
									style: 'tableExample'
								},																	
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEVISTA']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEPRAZO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorLiquido),
									alignment: 'right',
									style: 'tableExample'
								},
							]);	
						}

						venVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
						venPrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
						venDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']
						venLiquido += valorLiquido;


						totalVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
						totalPrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
						totalDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']
						totalLiquido += valorLiquido;
					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},
						{
							text: utils.number.float2moeda(totalVista),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalPrazo),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalDevolucoes),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalLiquido),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);
                            					
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
