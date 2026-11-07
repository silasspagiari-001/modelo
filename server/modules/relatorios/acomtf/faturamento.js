'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getFaturamento = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, tipo, inicio, final} = params;
		const db = await samosFB.conectarBanco(params.client);
		let sqlWhere = '';
		let sqlSearch = '';

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if (tipo == '0') {  // Relatório Sintético
			sqlSearch = `SELECT MOVIMENTOS_ID_EMPRESAS, EMPRESAS_NOME,
											sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
													and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA = 0
													THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
																												
											sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
													and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA <> 0
													THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
									
											sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
													and MOVIMENTOS_STATUS <> 'C'
													THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO
									FROM MOVIMENTOSITENS                                        
									left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
									left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
									left outer join MOVIMENTOSCAIXA ON MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
									where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
									${sqlWhere}
									GROUP BY MOVIMENTOS_ID_EMPRESAS, EMPRESAS_NOME
									`
		} else {    // Analítico
			sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
			MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOS_NOME,
				  sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
						  and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA = 0
						  THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
									  
				  sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
						  and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA <> 0
						  THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
		  
				  sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
						  and MOVIMENTOS_STATUS <> 'C'
						  THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO
						  
		  FROM MOVIMENTOSITENS                                    
		  left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
		  left outer join MOVIMENTOSCAIXA ON MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
		  where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
			and (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)))
		  ${sqlWhere}                
		  GROUP BY MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,
				   MOVIMENTOS_EMISSAO, MOVIMENTOS_NOME`
		}

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
		if(params.tipo == 0) { // Sintético
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{}]},
					{
						style: 'tableExample',
						table: {   // EMP  [NOM  ]  BV  BP  BD  TOT
							widths:   [15, 60, 200, 50, 50, 50, 50],  // 7 Cols.
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
		} else {    // Analítico
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{},{}]}, // 11 Cols
					{
						style: 'tableExample',  // BV - Base Vista, CV - Comissão Vista, DV - Devoluções
						table: {   // EMP TIP NUM SER DTE PES NOM  BV  BP  BD TOT
							widths:  [12, 12, 20, 15, 35, 25, 180, 42, 42, 42, 42],  // 11 Cols.
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
							'_'.repeat(140),
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
			getFaturamento(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalBaseVista = 0;
					let totalBasePrazo = 0;
					let totalBaseDevolucoes = 0;
					let totalLiquido = 0;

                    let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					if (params.tipo == 0) { // Sintético
							rows.push(		
								[
									{							
										image: pathLogo,
										width: 80,
										colSpan: 2,
										fontSize: 10,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'Relatório de Faturamento no período - Sintético',
										colSpan: 3,
										fontSize: 10,
										alignment: 'center',
										border: [false, false, false, false]
									},{},{},
									{
										text: moment.tz(params.timezone).format('DD/MM/YYYY'),
										colSpan: 2,
										fontSize: 10,
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
										colSpan: 3,
										alignment: 'center',
										border: [false, false, false, false]
									},{},{},
									{
										text: moment.tz(params.timezone).format('HH:mm:ss'),
										colSpan: 2,
										alignment: 'right',
										border: [false, false, false, false]
									},{},
								],																				
								[
									{
										text: 'Emp',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Nome da Empresa',
										style: 'tableHeader',
										colSpan: 2
									},{},									
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

							let valorLiquido = 0;

							for(let i in res.results){

								valorLiquido = (res.results[i]['MOVIMENTOS_BASEVISTA'] + res.results[i]['MOVIMENTOS_BASEPRAZO'] - res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']);

								rows.push([
									{
										text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
										alignment: 'right',
										style: 'tableExample',
									},														
									{
										text: res.results[i]['EMPRESAS_NOME'],
										alignment: 'left',
										colSpan: 2,
										style: 'tableExample'
									},{},
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

								totalBaseVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
								totalBasePrazo += res.results[i]['MOVIMENTOS_BASEPRAZO'];
                                totalBaseDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO'];
								totalLiquido += valorLiquido;
							}

							rows.push([
								{
									text: 'TOTAIS',
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(totalBaseVista),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								},{
									text: utils.number.float2moeda(totalBasePrazo),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'							
								},{
									text: utils.number.float2moeda(totalBaseDevolucoes),
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
					} else { // Analítico (11 Colunas)
						rows.push(		
							[
								{							
									image: pathLogo,
									width: 80,
									colSpan: 2,
									fontSize: 10,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Relatório de Faturamento no Período - Analítico',
									colSpan: 7,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									colSpan: 2,
									fontSize: 10,
									alignment: 'right',
									border: [false, false, false, false]								
								},{}
							],
							[
								{							
									text: '',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Período: ' + params.inicio + ' a ' + params.final,
									colSpan: 7,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],												
							[
								{
									text: 'Emp',  // Col 01
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Tip',  // Col 02
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Nº',  // Col 03
									style: 'tableHeader'
								},
								{
									text: 'Série',  // Col 04
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Emissão',  // Col 05
									style: 'tableHeader',
									alignment: 'center'									
								},								
								{
									text: 'Pessoa',  // Col 06
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome',  // Col 07
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'A Vista',  // Col 08
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'A Prazo',  // Col 09
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Devoluções',  // Col 10
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',  // Col 11
									style: 'tableHeader',
									alignment: 'center'
								}								
								
							],
						)

                        let valorLiquido = 0;

						for(let i in res.results){
                                        
                            valorLiquido = (res.results[i]['MOVIMENTOS_BASEVISTA'] + res.results[i]['MOVIMENTOS_BASEPRAZO'] - res.results[i]['MOVIMENTOS_BASEDEVOLUCAO']);

							rows.push([
								{
									text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'left',
									style: 'tableExample'
								},
								{
									text: res.results[i]['MOVIMENTOS_ID_PESSOAS'],
									alignment: 'right',
									style: 'tableExample',
								},								
								{
									text: res.results[i]['MOVIMENTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
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
								}
							]);

							totalBaseVista += res.results[i]['MOVIMENTOS_BASEVISTA'];
							totalBasePrazo += res.results[i]['MOVIMENTOS_BASEPRAZO']
							totalBaseDevolucoes += res.results[i]['MOVIMENTOS_BASEDEVOLUCAO'];
							totalLiquido += valorLiquido;
						}

						rows.push([
							{
								text: 'Total Geral',
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalBaseVista),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{								
								text: utils.number.float2moeda(totalBasePrazo),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(totalBaseDevolucoes),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{								
								text: utils.number.float2moeda(totalLiquido),
								alignment: 'right',
								fontSize: 6,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
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
