'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getDemonstrativo = async function(params){
	return new Promise(async (resolve, reject) => {
		const { tipo, empresa, aplicacao, inicio, final} = params;
		const db = await samosFB.conectarBanco(params.client);
		let sqlWhere = '';
		let sqlSearch = '';
		let sqlAplicacao = ''

		if(params.log.toUpperCase().match(/MOVEIS/)) {
			sqlAplicacao = ' and substring(APLICACOES_MASCARA from 1 for 1) > 4';
		}

		if(empresa > 0) {
			sqlWhere += ` and FINANCEIROS_ID_EMPRESAS = ${empresa} `;
		}

		if(aplicacao > 0) {
			sqlWhere += ` and FINANCEIROS_ID_APLICACOES = ${aplicacao} `;
		}

		sqlSearch = `execute block returns (
							APLICACOES_ID integer, APLICACOES_MASCARA varchar(13),
							APLICACOES_NOME varchar(50), FINANCEIROS_TOTALORIGINAL numeric(14,2)
						)
						as
						begin
							for
								select APLICACOES_ID, APLICACOES_MASCARA,
									APLICACOES_NOME from APLICACOES
								where APLICACOES_TIPO = 'D' ${sqlAplicacao}
								order by APLICACOES_MASCARA, APLICACOES_ID
								into :APLICACOES_ID,
									:APLICACOES_MASCARA,
									:APLICACOES_NOME
							do
								begin
									FINANCEIROS_TOTALORIGINAL = 0;
									select sum(FINANCEIROS_ORIGINAL) from FINANCEIROS
									join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
									where FINANCEIROS_ID_APLICACOES = :APLICACOES_ID and
										FINANCEIROS_PAGAMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
										${sqlWhere}
									into
										:FINANCEIROS_TOTALORIGINAL;
									if (FINANCEIROS_TOTALORIGINAL > 0) then  suspend;
								end
						end;`

		db.query(sqlSearch, async (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {

				const somaVendas   = results.length ? await obterSomaDemonstrativo('V', params, db) : 0;
				const somaFretes   = results.length ? await obterSomaDemonstrativo('F', params, db) : 0;
				const somaCustoVda = results.length ? await obterSomaDemonstrativo('C', params, db) : 0;

				results = results.map(result => {
					result['FINANCEIROS_GERAL_VENDAS'] = somaVendas;
					result['FINANCEIROS_GERAL_FRETES']   = somaFretes;
					result['FINANCEIROS_GERAL_CUSTOS']   = somaCustoVda;
					return result;
				});

				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
		let	docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{}]},
					{
						style: 'tableExample',
						table: {   // APL  MASC NOM   VLR  % Vendas
							widths:   [30,  35, 300,  70, 70],  // 5 Cols. (520)
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
							'_'.repeat(100),
							{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
						],
						margin: [25, 10]
					};
				},
				styles: {
					tableExample: {
						fontSize: 9,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 9,
						color: 'black'
					}
				}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			getDemonstrativo(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totContas = 0;
					let totValor = 0;
					let resultadoBruto = (res.results[0]['FINANCEIROS_GERAL_VENDAS'] -
										  res.results[0]['FINANCEIROS_GERAL_FRETES'] -
										  res.results[0]['FINANCEIROS_GERAL_CUSTOS']);

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
								width: 60,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Demonstrativo de Resultados por Pagamento' + (params.tipo == 0 ? ' - Analítico': ' - Sintético'),
								colSpan: 3,
								fontSize: 12,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 9,
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: ' ',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final + ' - Empresa: ' + (params.empresa > 0 ? params.empresa.toString() + ' ' + (params.tipo == 0 && res.results[0] ? res.results[0]['EMPRESAS_NOME'] : '') : 'Todas'),
								colSpan: 3,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						]
					);
					
                    rows.push(
                        [
                            {
                                text: 'Vendas',
                                style: 'tableHeader',
								alignment: 'left',
								colSpan: 4									
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(res.results[0]['FINANCEIROS_GERAL_VENDAS']),
                                style: 'tableHeader',
                                alignment: 'right'
                            }
                        ]
                    );					
					
                    rows.push(
                        [
                            {
                                text: 'Custo dos Produtos Vendidos',
                                style: 'tableHeader',
								alignment: 'left',
								colSpan: 4									
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(res.results[0]['FINANCEIROS_GERAL_CUSTOS']),
                                style: 'tableHeader',
                                alignment: 'right'
                            }
                        ]
                    );					

                    rows.push(
                        [
                            {
                                text: 'Resultado Bruto',
                                style: 'tableHeader',
								alignment: 'left',
								colSpan: 4
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(resultadoBruto),
                                style: 'tableHeader',
                                alignment: 'right'
                            }
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: 'Código',
                                style: 'tableHeader',
                                alignment: 'center'									
							},
                            {
                                text: 'Máscara',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },							
                            {
                                text: 'Descrição da despesa',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },							
                            {
                                text: 'Valor',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% Vendas',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
					);
					
					let grupoAnt = '';
					let contaMask = '';
					let contaAnt = 0
					let totalGrupo = 0;
					let nomeGrupo = '';
					let percentualItem = 0;

					for(let i in res.results){

						contaMask = (res.results[i]['APLICACOES_MASCARA'] || '').slice(0, 3);
		  
						if(params.tipo == 1) {  // Sintético

							if(grupoAnt != contaMask) {
								if(totalGrupo > 0) {
									percentualItem = ((totalGrupo / res.results[i]['FINANCEIROS_GERAL_VENDAS']) * 100);
									rows.push([
										{
											text: contaAnt,
											alignment: 'right',
											style: 'tableExample',
										},
										{
											text: grupoAnt,
											alignment: 'right',
											style: 'tableExample',
										},							
										{
											text: nomeGrupo,
											alignment: 'left',
											style: 'tableExample',
										},														
										{
											text: utils.number.float2moeda(totalGrupo),
											alignment: 'right',
											style: 'tableExample'
										},
										{
											text: utils.number.float2moeda(percentualItem),
											alignment: 'right',
											style: 'tableExample'
										}
									]);
									totalGrupo = 0;
								}
							}
							contaAnt = res.results[i]['APLICACOES_ID'];
							grupoAnt = contaMask;
							nomeGrupo = res.results[i]['APLICACOES_NOME'];
						} else {   // Analítico

							percentualItem = ((res.results[i]['FINANCEIROS_TOTALORIGINAL'] / res.results[i]['FINANCEIROS_GERAL_VENDAS']) * 100)

							rows.push([
								{
									text: res.results[i]['APLICACOES_ID'],
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['APLICACOES_MASCARA'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['APLICACOES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},														
								{
									text: utils.number.float2moeda(res.results[i]['FINANCEIROS_TOTALORIGINAL']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(percentualItem),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
						}

						totContas ++
						totalGrupo += res.results[i]['FINANCEIROS_TOTALORIGINAL'];
						totValor += res.results[i]['FINANCEIROS_TOTALORIGINAL'];
					}
					

					if(params.tipo == 1) { // último grupo do sintético
						percentualItem = ((totalGrupo / res.results[0]['FINANCEIROS_GERAL_VENDAS']) * 100);
						rows.push([
							{
								text: contaAnt,
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: grupoAnt,
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: nomeGrupo,
								alignment: 'left',
								style: 'tableExample',
							},														
							{
								text: utils.number.float2moeda(totalGrupo),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(percentualItem),
								alignment: 'right',
								style: 'tableExample'
							}
						]);
					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 9,
							bold: true,							
							colSpan: 2,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: totContas,
							alignment: 'left',
							fontSize: 9,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totValor),
							alignment: 'right',
							fontSize: 9,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(((totValor / res.results[0]['FINANCEIROS_GERAL_VENDAS']) * 100)),
							alignment: 'right',
							fontSize: 9,
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
