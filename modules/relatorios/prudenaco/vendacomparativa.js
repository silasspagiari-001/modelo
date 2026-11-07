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
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{ columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 17 Colunas
				{
					style: 'tableExample',
					table: { // COD NOM VEN ANO JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ TOT
						widths: [24, 75, 50, 18, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 50],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function (page, pages) {
				return {
					stack: [
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right' }
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

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendacomparativa().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalMes01 = 0, totalMes02 = 0, totalMes03 = 0,
						totalMes04 = 0, totalMes05 = 0, totalMes06 = 0,
						totalMes07 = 0, totalMes08 = 0, totalMes09 = 0,
						totalMes10 = 0, totalMes11 = 0, totalMes12 = 0,
						totalValorVenda = 0;

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
								width: 100,
								height: 22,
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							}, {},
							{
								text: 'Relatório de Venda por Pessoa - Comparativa',
								colSpan: 13,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]
							}, {}
						],
						[
							{
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							}, {},
							{
								text: 'Período: ' + params.inicio + ' a ' + params.final + 
								(params.cidade > 0 && res.results.length > 0 ? ' - Município: ' + res.results[0]['CIDADES_NOME'] + '/' + res.results[0]['CIDADES_ESTADO'] : ''),
								colSpan: 13,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							}, {}
						],
					);

					rows.push(
						[
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
								text: 'Vendedor',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Ano',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Janeiro',
								style: 'tableHeader',
								alignment: 'center',
							},
							{
								text: 'Fevereiro',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Março',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Abril',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Maio',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Junho',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Julho',
								style: 'tableHeader',
								alignment: 'center',
							},
							{
								text: 'Agosto',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Setembro',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Outubro',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Novembro',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Dezembro',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Total',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					);

					for (let i in res.results) {

						rows.push([
							{
								text: res.results[i]['MOVIMENTOS_ID_PESSOAS'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: (res.results[i]['PESSOAS_FANTASIA'] || res.results[i]['PESSOAS_NOME']).substring(0, 18),
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: (res.results[i]['USUARIOS_NOME'] || '').substring(0, 12),
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: res.results[i]['MOVIMENTOS_ANO'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES01']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES02']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES03']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES04']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES05']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES06']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES07']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES08']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES09']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES10']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES11']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MES12']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTALPESSOA']),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

						totalMes01 += res.results[i]['MOVIMENTOS_MES01'];
						totalMes02 += res.results[i]['MOVIMENTOS_MES02'];
						totalMes03 += res.results[i]['MOVIMENTOS_MES03'];
						totalMes04 += res.results[i]['MOVIMENTOS_MES04'];
						totalMes05 += res.results[i]['MOVIMENTOS_MES05'];
						totalMes06 += res.results[i]['MOVIMENTOS_MES06'];
						totalMes07 += res.results[i]['MOVIMENTOS_MES07'];
						totalMes08 += res.results[i]['MOVIMENTOS_MES08'];
						totalMes09 += res.results[i]['MOVIMENTOS_MES09'];
						totalMes10 += res.results[i]['MOVIMENTOS_MES10'];
						totalMes11 += res.results[i]['MOVIMENTOS_MES11'];
						totalMes12 += res.results[i]['MOVIMENTOS_MES12'];
						totalValorVenda += res.results[i]['MOVIMENTOS_TOTALPESSOA'];

					}
					rows.push([
						{
							text: 'TOTAL GERAL',
							alignment: 'right',
							fontSize: 7,
							bold: true,
							colSpan: 4,
							style: 'tableExample'
						},{},{},{},
						{
							text: utils.number.float2moeda(totalMes01),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes02),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes03),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes04),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes05),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes06),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes07),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes08),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes09),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes10),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes11),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalMes12),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalValorVenda),
							alignment: 'right',
							fontSize: 7,
							bold: true,
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
