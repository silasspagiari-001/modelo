'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const samosFB   = require('../../../services/samosFirebird');

const getResumoIcms = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, mes, ate, ano} = params;

		const db = await samosFB.conectarBanco(params.client);
		const ultimoDiaMes = moment(`${ano}-${ate}-01`, 'YYYY-MM-DD').endOf('month').format('DD');

		let sqlDocumento = ` and (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5) or MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3)) `;
		   
		const sqlSearch = `select 
			CIDADES_ESTADO, 
			MOVIMENTOSITENS_ID_OPERACOES, 
			MOVIMENTOSITENS_ICMS,
			sum(
				MOVIMENTOSITENS_TOTAL + 
				MOVIMENTOSITENS_FRETE +
				MOVIMENTOSITENS_SEGURO + 
				MOVIMENTOSITENS_DESPESAS +
				MOVIMENTOSITENS_VALORIPI
			) as MOVIMENTOS_TOTAL,
			sum(MOVIMENTOSITENS_BASEICMS) as MOVIMENTOS_BASEICMS,
			sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS
		from MOVIMENTOSITENS
		join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
		join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
		join CIDADES    on CIDADES_ID = PESSOAS_ID_CIDADES
		where MOVIMENTOS_ID > 0 and 
			  MOVIMENTOS_ID_EMPRESAS = ${empresa} ${sqlDocumento} and 
			  (
				MOVIMENTOS_STATUS <> 'C' and 
				MOVIMENTOS_STATUS <> 'D' and
				MOVIMENTOS_STATUS <> 'R' and
				MOVIMENTOS_STATUS <> 'V'
			  ) and 
			  MOVIMENTOS_ENTRADASAIDA between '01.${mes}.${ano}' and '${ultimoDiaMes}.${ate}.${ano}' 
		group by CIDADES_ESTADO, MOVIMENTOSITENS_ID_OPERACOES, MOVIMENTOSITENS_ICMS
		order by MOVIMENTOSITENS_ID_OPERACOES, CIDADES_ESTADO`;

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
    create: (data, params) => { 
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 40, 15, 35],  // E S D I 
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //[B]  UF CFO ICM VLN BIC VIC ISE OUT  [B]
						widths:  [50, 15, 25, 30, 60, 60, 60, 60, 60, 50],  // 10 Cols.
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(103),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [15, 10]  // 10, 10
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
			getResumoIcms(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
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
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Resumo de ICMS Entrada/Saida',
								colSpan: 8,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 8,
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: '',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Referência: ' + params.mes + '/' + params.ano,
								colSpan: 8,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						],												
						[
							{
								text: 'a',
								style: 'tableHeader',
								color: 'white',
								border: [false, false, false, false]
							},
							{
								text: 'UF',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'CFOP',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: '% ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Contábil',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Base do ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor do ICMS',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Isento',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Outras',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'a',
								style: 'tableHeader',
								color: 'white',
								border: [false, false, false, false]
							}
						]
					);


					let entContabil  = 0;
					let entBaseIcms  = 0;
					let entValorIcms = 0;
					let entIsento    = 0;
					let entOutras    = 0;					

					let saiContabil  = 0;
					let saiBaseIcms  = 0;
					let saiValorIcms = 0;
					let saiIsento    = 0;
					let saiOutras    = 0;


					for(let i in res.results){
						rows.push([
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
							{
								text: res.results[i]['CIDADES_ESTADO'],
								alignment: 'center',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: (res.results[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100000).toFixed(3),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_ICMS']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEICMS']),
								alignment: 'right',
								bold: true,									
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORICMS']),
								alignment: 'right',
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(0), // Isentas
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL'] - res.results[i]['MOVIMENTOS_BASEICMS']), // Outras
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]								
							}
						]);

						if((cents(res.results[i]['MOVIMENTOSITENS_ID_OPERACOES']) / 100) > 500000) {
	
							saiContabil  += cents(res.results[i]['MOVIMENTOS_TOTAL']);
							saiBaseIcms  += cents(res.results[i]['MOVIMENTOS_BASEICMS']);
							saiValorIcms += cents(res.results[i]['MOVIMENTOS_VALORICMS']);
							saiIsento    += 0;
							saiOutras    += cents(res.results[i]['MOVIMENTOS_TOTAL'] - res.results[i]['MOVIMENTOS_BASEICMS']);
		
						} else {
							entContabil  += cents(res.results[i]['MOVIMENTOS_TOTAL']);
							entBaseIcms  += cents(res.results[i]['MOVIMENTOS_BASEICMS']);
							entValorIcms += cents(res.results[i]['MOVIMENTOS_VALORICMS']);
							entIsento    += 0;
							entOutras    += cents(res.results[i]['MOVIMENTOS_TOTAL'] - res.results[i]['MOVIMENTOS_BASEICMS']);
						}
					}	

					// TOTALIZADORES

					rows.push([
						{
							text: 'A',
							color: 'white',
							fontSize: 10,
							colSpan: 10,
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{}
					])

					rows.push([
						{
							text: 'TOTAL ENTRADAS',
							style: 'tableExample',
							alignment: 'right',
							border: [false, false, false, false],
							colSpan: 4								
						},{},{},{},
						{
							text: utils.number.float2moeda(entContabil / 100),
							alignment: 'right',
							bold: true,									
							style: 'tableExample'
						},							
						{
							text: utils.number.float2moeda(entBaseIcms / 100),
							alignment: 'right',
							bold: true,									
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(entValorIcms / 100),
							alignment: 'right',
							style: 'tableExample'
						},							
						{
							text: utils.number.float2moeda(0), // Isentas
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(entOutras / 100), // Outras
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]								
						}
					]);

					rows.push([
						{
							text: 'TOTAL SAIDAS',
							style: 'tableExample',
							alignment: 'right',
							border: [false, false, false, false],
							colSpan: 4								
						},{},{},{},
						{
							text: utils.number.float2moeda(saiContabil / 100),
							alignment: 'right',
							bold: true,									
							style: 'tableExample'
						},							
						{
							text: utils.number.float2moeda(saiBaseIcms / 100),
							alignment: 'right',
							bold: true,									
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(saiValorIcms / 100),
							alignment: 'right',
							style: 'tableExample'
						},							
						{
							text: utils.number.float2moeda(0), // Isentas
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(saiOutras / 100), // Outras
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]								
						}
					]);

					rows.push([
						{
							text: 'DIFERENÇA DO ICMS NO MÊS',
							style: 'tableExample',
							alignment: 'right',
							border: [false, false, false, false],
							colSpan: 6								
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda((saiValorIcms - entValorIcms) / 100),
							alignment: 'right',
							style: 'tableExample'
						},							
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]
						},
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]								
						},
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]					
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