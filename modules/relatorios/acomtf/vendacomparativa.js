'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getVendaComparativa = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, inicio, final, pessoainicial, pessoafinal, grupoinicial, grupofinal, ordem, cidade} = params;
		const db = await samosFB.conectarBanco(params.client);

		let parPessoainicial = (pessoainicial > 0 ? pessoainicial : 1);
		let parPessoafinal  = (pessoafinal > 0 ? pessoafinal : 999999);
		let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
		let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

		let sqlWhere = '';
		let sqlSearch = '';
		let sqlOrder = '';

		if(ordem == 0) {
			sqlOrder = `order by PESSOAS_NOME`
		} else {
			sqlOrder = `order by sum(MOVIMENTOSITENS_TOTAL) descending`
		}

		sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} `;
		sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(cidade > 0) {
			sqlWhere += ` and PESSOAS_ID_CIDADES = ${cidade} `;
		}

		sqlSearch = `SELECT MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME, PESSOAS_FANTASIA, CIDADES_NOME, CIDADES_ESTADO, USUARIOS_NOME, extract(year from MOVIMENTOS_EMISSAO) as MOVIMENTOS_ANO,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 1
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES01,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 2
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES02,
								sum(case when extract(month from MOVIMENTOS_EMISSAO) = 3
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES03,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 4
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES04,
								sum(case when extract(month from MOVIMENTOS_EMISSAO) = 5
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES05,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 6
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES06,
								sum(case when extract(month from MOVIMENTOS_EMISSAO) = 7
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES07,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 8
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES08,
								sum(case when extract(month from MOVIMENTOS_EMISSAO) = 9
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES09,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 10
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES10,
								sum(case when extract(month from MOVIMENTOS_EMISSAO) = 11
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES11,
						sum(case when extract(month from MOVIMENTOS_EMISSAO) = 12
								then (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) else 0 end) MOVIMENTOS_MES12,
						sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_TOTALPESSOA
					FROM MOVIMENTOSITENS
					left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
					left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
					left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
					left outer join USUARIOS on USUARIOS_ID = PESSOAS_ID_USUARIOS
					left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
					where ((MOVIMENTOS_STATUS <> 'C') and 
						   (MOVIMENTOS_STATUS <> 'D') and
						   (MOVIMENTOS_STATUS <> 'R') and
						   (MOVIMENTOS_STATUS <> 'V')) and
					MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and                                                
					MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
					${sqlWhere}
					group by PESSOAS_NOME, MOVIMENTOS_ID_PESSOAS, PESSOAS_FANTASIA, CIDADES_NOME, CIDADES_ESTADO, USUARIOS_NOME, MOVIMENTOS_ANO
					${sqlOrder}`
				  
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
			}
		});
	});
}

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
			getVendaComparativa(params)
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
