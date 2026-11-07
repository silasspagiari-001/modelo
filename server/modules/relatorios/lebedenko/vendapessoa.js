'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);
const samosFB   = require('../../../services/samosFirebird');



module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { 
                        dontBreakRows: true,						
						widths: params.tipo == 2 ? [30, 60, 40, 50, 50, 50, 20,  50, 60, 60] :
							                       [30, 10, 10, 40, 40, 40, 30, 200, 20, 50],
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

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendapessoa().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

                    let devolucoesItem   = [];

					let docValorVenda     = 0;
					let pessoaValorVenda  = 0;
                    let produtoValorVenda = 0;
					let totalValorVenda  = 0;

					let docQtdeVenda     = 0;
					let pessoaQtdeVenda  = 0;
					let produtoQtdeVenda = 0;
					let totalQtdeVenda   = 0;

					let ultimoDocumento  = 0;
					let ultimaPessoa     = 0;

					const db             = await samosFB.conectarBanco(params.client); 

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
							},{},
							{ 
								text: 'Relação de Vendas por Cliente - ' + (params.tipo == 0 ? 'Analítico' : params.tipo == 1 ? 'Sintético' : 'Produtos'),
								colSpan: 6,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},
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
								text: 'Período: ' + params.inicio + ' a ' + params.final + 
								(params.soinsumo == 'T' ? ' Tipo: (SOMENTE INSUMOS/VENDA)' :
								params.sovenda  == 'T' ? ' Tipo: (SOMENTE VENDA)' : ''),
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
					
					if(params.tipo == 0) {  // Relatório Analítico
						rows.push(
							[
								{
									text: 'Número',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Se',
									style: 'tableHeader',
									alignment: 'center'									
								},                            
								{
									text: 'Vendedor',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'Emissão',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Faturado',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Produto',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Nome Produto',
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center'
								},	
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)	
					} else if(params.tipo == 1) {  // Relatório Sintético
						rows.push( 
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome Pessoa',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 6									
								},{},{},{},{},{},
								{
									text: 'Cidade',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'UF',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)
					} else { // Relatório Produtos
						rows.push( 
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Fábrica',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 4									
								},{},{},{},
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Quantidade',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Valor Unitário',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)
					}

					let model, modelAnt;

					for(let i in res.results){

						model    = res.results[i];
						modelAnt = (res.results[i-1] || []);
						let qtde = 0;
						let pesoUnitario = 0;
						let precoPorKg = 0;

						if(model['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5902|6902/) && // Produto acabado
							cents(model['MOVIMENTOSITENS_TOTAL']) == 0) {
							qtde         = grams(model['MOVIMENTOSITENS_QUANTIDADE']) / 1000;
							pesoUnitario = grams(model['PRODUTOS_PESOLIQUIDO']) / 1000;
							precoPorKg   = ((cents(model['MOVIMENTOSCAIXA_DUPLICATA'])/100) / (grams(model['MOVIMENTOSENVIO_PESOLIQUIDO'])/1000));
							if(params.operacoes == 3) {  // Industrialização
								model['MOVIMENTOSITENS_QUANTIDADE'] = (qtde * pesoUnitario);
							} else {
								model['MOVIMENTOSITENS_TOTAL'] = ((qtde * pesoUnitario) * precoPorKg);
							}
						}

						if(model['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5902|6902/) &&
							model['MOVIMENTOSITENS_ID_PRODUTOS'] == 1) {  // Matéria Prima (Ureia)
							model['MOVIMENTOSITENS_QUANTIDADE'] = 0;
							model['MOVIMENTOSITENS_TOTAL'] = 0;
						}

						if(model['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5124|6124/)) { // Material Industrializacao
							if(params.operacoes == 3 ) {  // Industrialização
								model['MOVIMENTOSITENS_QUANTIDADE'] = 0;
							} else {
								model['MOVIMENTOSITENS_QUANTIDADE'] = 0;
								model['MOVIMENTOSITENS_TOTAL'] = 0;
							}	
						}				 

						if(params.tipo == 0) { // Relatório Analítico

							if(ultimaPessoa != model['MOVIMENTOS_ID_PESSOAS']) {
								if(docValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL DOCUMENTO',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 8,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},
										{
											text: docQtdeVenda,
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},
										{
											text: utils.number.float2moeda(docValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									docQtdeVenda = 0;
									docValorVenda = 0;
								}
								if(pessoaValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL PESSOA',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 8,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{
											text: pessoaQtdeVenda,
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},
										{
											text: utils.number.float2moeda(pessoaValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									pessoaQtdeVenda = 0;
									pessoaValorVenda = 0;
								}
								rows.push([
									{
										text: '* * * Pessoa: ' + ('00000' + model['MOVIMENTOS_ID_PESSOAS']).slice(-5) + ' - ' + 
											model['MOVIMENTOS_NOME'] + ' - ' +
											model['CIDADES_NOME']    + '/'   +
											model['CIDADES_ESTADO']  + ' * * *',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 10,
										fontSize: 9,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);	
								ultimaPessoa = model['MOVIMENTOS_ID_PESSOAS'];
							}
	
							if(ultimoDocumento != model['MOVIMENTOS_NUMERO']) {
								if(docValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL DOCUMENTO',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 8,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},
										{
											text: docQtdeVenda,
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},
										{
											text: utils.number.float2moeda(docValorVenda),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									docQtdeVenda = 0;
									docValorVenda = 0;
								}
								rows.push([
									{
										text: ('000000' + model['MOVIMENTOS_NUMERO']).slice(-6),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: model['MOVIMENTOS_SERIE'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: ('000' + model['MOVIMENTOS_ID_USUARIOS']).slice(-3) + ' ' +
											  model['USUARIOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false],									
										colSpan: 2
									},{},
									{
										text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: moment(model['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: model['PRODUTOS_NOME'],
										alignment: 'left',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: (parseInt(model['MOVIMENTOSITENS_QUANTIDADE']) > 0 ? model['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0) : ''),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									}
								]);	
								ultimoDocumento = model['MOVIMENTOS_NUMERO'];
							} else {
								rows.push([
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},								
									{
										text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: model['PRODUTOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: (parseInt(model['MOVIMENTOSITENS_QUANTIDADE']) > 0 ? model['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0) : ''),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									}
								]);	
							}
							docQtdeVenda     += model['MOVIMENTOSITENS_QUANTIDADE'];
							docValorVenda    += model['MOVIMENTOSITENS_TOTAL'];
							pessoaQtdeVenda  += model['MOVIMENTOSITENS_QUANTIDADE'];
							pessoaValorVenda += model['MOVIMENTOSITENS_TOTAL'];

							produtoQtdeVenda  += model['MOVIMENTOSITENS_QUANTIDADE'];
							produtoValorVenda += model['MOVIMENTOSITENS_TOTAL'];

							totalQtdeVenda   += model['MOVIMENTOSITENS_QUANTIDADE'];							
							totalValorVenda  += model['MOVIMENTOSITENS_TOTAL'];

						} else if(params.tipo == 1) {  // Relatório Sintético

							if(modelAnt['MOVIMENTOS_ID_PESSOAS'] != model['MOVIMENTOS_ID_PESSOAS']) {
								if(pessoaValorVenda > 0) {
									rows.push([
										{
											text: ('000000' + modelAnt['MOVIMENTOS_ID_PESSOAS']).slice(-6),
											alignment: 'right',
											style: 'tableExample',
										},
										{
											text: modelAnt['MOVIMENTOS_NOME'],
											alignment: 'left',
											colSpan: 6,
											style: 'tableExample',
										},{},{},{},{},{},
										{
											text: modelAnt['CIDADES_NOME'],
											alignment: 'left',
											style: 'tableExample',
										},
										{
											text: modelAnt['CIDADES_ESTADO'],
											alignment: 'center',
											style: 'tableExample'
										},
										{
											text: utils.number.float2moeda(pessoaValorVenda),
											alignment: 'right',
											style: 'tableExample'
										}
									]);		
								}
								pessoaValorVenda = 0;									
							}

							pessoaValorVenda += model['MOVIMENTOSITENS_TOTAL'];
							totalValorVenda  += model['MOVIMENTOSITENS_TOTAL'];

						} else {  // Relatório Cliente/Produto

							if(modelAnt['MOVIMENTOSITENS_ID_PRODUTOS'] != model['MOVIMENTOSITENS_ID_PRODUTOS']) {
								if(produtoValorVenda > 0 || produtoQtdeVenda > 0) {
									devolucoesItem = await obterDevolucoes(modelAnt['MOVIMENTOS_ID_PESSOAS'], modelAnt['MOVIMENTOSITENS_ID_PRODUTOS'], params.inicio, params.final, db);

									let devQuantidade = (cents(devolucoesItem['QUANTIDADE_DEVOLUCAO']) / 100);
									let devValor      = (cents(devolucoesItem['VALOR_DEVOLUCAO']) / 100);
									let qtdeLiquida   = produtoQtdeVenda - devQuantidade;
									let valorLiquido  = produtoValorVenda - devValor;
		
									rows.push([
										{
											text: ('000000' + modelAnt['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6),
											alignment: 'right',
											style: 'tableExample',
										},
										{
											text: modelAnt['PRODUTOS_FABRICA'],
											alignment: 'left',
											style: 'tableExample',
										},
										{
											text: modelAnt['PRODUTOS_NOME'],
											colSpan: 4,
											style: 'tableExample',
										},{},{},{},
										{
											text: modelAnt['PRODUTOS_UNIDADE'],
											alignment: 'left',
											style: 'tableExample',
										},
										{
											text: (parseInt(qtdeLiquida) > 0 ? qtdeLiquida : ''),
											alignment: 'right',
											style: 'tableExample'
										},
										{
											text: (parseInt(qtdeLiquida) > 0 ? utils.number.float2moeda(cents(valorLiquido) / cents(qtdeLiquida)) : ''),
											alignment: 'right',
											style: 'tableExample'
										},
										{
											text: utils.number.float2moeda(valorLiquido),
											alignment: 'right',
											style: 'tableExample'
										}
									]);			
								}
								produtoQtdeVenda = 0;
								produtoValorVenda = 0;
							}	

							if(modelAnt['MOVIMENTOS_ID_PESSOAS'] != model['MOVIMENTOS_ID_PESSOAS']) {

								if(produtoValorVenda > 0) {
									devolucoesItem = await obterDevolucoes(modelAnt['MOVIMENTOS_ID_PESSOAS'], modelAnt['MOVIMENTOSITENS_ID_PRODUTOS'], params.inicio, params.final, db);

									let devQuantidade = (cents(devolucoesItem['QUANTIDADE_DEVOLUCAO']) / 100);
									let devValor      = (cents(devolucoesItem['VALOR_DEVOLUCAO']) / 100);
									let qtdeLiquida   = produtoQtdeVenda - devQuantidade;
									let valorLiquido  = produtoValorVenda - devValor;
		
									rows.push([
										{
											text: ('000000' + modelAnt['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6),
											alignment: 'right',
											style: 'tableExample',
										},
										{
											text: modelAnt['PRODUTOS_FABRICA'],
											alignment: 'left',
											style: 'tableExample',
										},
										{
											text: modelAnt['PRODUTOS_NOME'],
											colSpan: 4,
											style: 'tableExample',
										},{},{},{},
										{
											text: modelAnt['PRODUTOS_UNIDADE'],
											alignment: 'left',
											style: 'tableExample',
										},
										{
											text: (parseInt(qtdeLiquida) > 0 ? qtdeLiquida : ''),
											alignment: 'right',
											style: 'tableExample'
										},
										{
											text: (parseInt(qtdeLiquida) > 0 ? utils.number.float2moeda(cents(valorLiquido) / cents(qtdeLiquida)) : ''),
											alignment: 'right',
											style: 'tableExample'
										},
										{
											text: utils.number.float2moeda(valorLiquido),
											alignment: 'right',
											style: 'tableExample'
										}
									]);			
								}

								if(pessoaValorVenda > 0) {
									rows.push([
										{
											text: 'TOTAL CLIENTE...',
											alignment: 'right',
											fontSize: 8,
											bold: true,							
											colSpan: 7,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},
										{
											text: pessoaQtdeVenda,
											alignment: 'right',
											fontSize: 8,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},
										{
											text: '', 
											border: [false, false, false, false]
										},
										{
											text: utils.number.float2moeda(pessoaValorVenda),
											alignment: 'right',
											fontSize: 8,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
								}

								rows.push([
									{
										text: 'A\n',
										alignment: 'right',
										fontSize: 8,
										color: 'white',														
										colSpan: 10,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},{},{},{},{},{}
								]);

								rows.push([
									{
										text: '* * * Cliente: ' + ('00000' + model['MOVIMENTOS_ID_PESSOAS']).slice(-5) + ' - ' + 
											model['PESSOAS_NOME'] + ' * * *',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 10,
										fontSize: 9,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);	

								pessoaQtdeVenda  = 0;
								pessoaValorVenda = 0;

								produtoQtdeVenda  = 0;
								produtoValorVenda = 0;								

							}

							pessoaQtdeVenda  += model['MOVIMENTOSITENS_QUANTIDADE'];
							produtoQtdeVenda += model['MOVIMENTOSITENS_QUANTIDADE'];
							totalQtdeVenda   += model['MOVIMENTOSITENS_QUANTIDADE'];

							pessoaValorVenda  += model['MOVIMENTOSITENS_TOTAL'];
							produtoValorVenda += model['MOVIMENTOSITENS_TOTAL'];
							totalValorVenda   += model['MOVIMENTOSITENS_TOTAL'];
						}
					}

					if(params.tipo == 0) {  // Analítico
						rows.push([ // Totalizadores finais
							{
								text: 'TOTAL DOCUMENTO',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 8,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},
							{
								text: docQtdeVenda,
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},
							{
								text: utils.number.float2moeda(docValorVenda),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);
	
						rows.push([
							{
								text: 'TOTAL PESSOA',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 8,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},
							{
								text: pessoaQtdeVenda,
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'														
							},
							{
								text: utils.number.float2moeda(pessoaValorVenda),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);	
					}

					if(params.tipo == 2) {  // Pessoa - Produtos

						devolucoesItem = await obterDevolucoes(model['MOVIMENTOS_ID_PESSOAS'], model['MOVIMENTOSITENS_ID_PRODUTOS'], params.inicio, params.final, db);

						let devQuantidade = (cents(devolucoesItem['QUANTIDADE_DEVOLUCAO']) / 100);
						let devValor      = (cents(devolucoesItem['VALOR_DEVOLUCAO']) / 100);
						let qtdeLiquida   = produtoQtdeVenda - devQuantidade;
						let valorLiquido  = produtoValorVenda - devValor;

						rows.push([
							{
								text: ('000000' + model['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: model['PRODUTOS_FABRICA'],
								alignment: 'left',
								style: 'tableExample',
							},
							{
								text: model['PRODUTOS_NOME'],
								colSpan: 4,
								style: 'tableExample',
							},{},{},{},
							{
								text: model['PRODUTOS_UNIDADE'],
								alignment: 'left',
								style: 'tableExample',
							},
							{
								text: (parseInt(qtdeLiquida) > 0 ? qtdeLiquida : ''),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: (parseInt(qtdeLiquida) > 0 ? utils.number.float2moeda(cents(valorLiquido) / cents(qtdeLiquida)) : ''),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorLiquido),
								alignment: 'right',
								style: 'tableExample'
							}
						]);			

						rows.push([ // Totalizadores finais
							{
								text: 'TOTAL CLIENTE...',
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: pessoaQtdeVenda,
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(pessoaValorVenda),
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);	
					}

					if(params.tipo == 0) {  // Analítico
						rows.push([
							{
								text: '',
								colSpan: 7,
								border: [false, false, false, false]
							},{},{},{},{},{},{},						
							{
								table: {
									widths:[180, 90],
									body: [
										[
											{
												text: params.operacoes == 3 ? 'Total Geral (Kgs)' : 'Total Geral (Qtde)',
												alignment: 'right',												
												bold: true,
												fontSize: 10,
												border: [false, false, false, false]												
											},
											{
												text: totalQtdeVenda,
												bold: true,
												fontSize: 10,
												alignment: 'right'
											}
										],
										[
											{
												text: 'Total Geral (R$)',
												alignment: 'right',												
												bold: true,
												fontSize: 10,
												border: [false, false, false, false]												
											},
											{
												text: utils.number.float2moeda(totalValorVenda),
												bold: true,
												fontSize: 10,
												alignment: 'right'
											}
										]
									]
								},
								border: [false, false, false, false],
								colSpan: 3						
							},{},{}
						]);																

					} else if(params.tipo == 1) {  // Sintético (Não tem totalizador de quantidade)
						
						rows.push([
							{
								text: ('000000' + model['MOVIMENTOS_ID_PESSOAS']).slice(-6),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: model['MOVIMENTOS_NOME'],
								alignment: 'left',
								colSpan: 6,
								style: 'tableExample',
							},{},{},{},{},{},
							{
								text: model['CIDADES_NOME'],
								alignment: 'left',
								style: 'tableExample',
							},
							{
								text: model['CIDADES_ESTADO'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(pessoaValorVenda),
								alignment: 'right',
								style: 'tableExample'
							}
						]);		
			

						rows.push([
							{
								text: 'TOTAL GERAL...',
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								colSpan: 8,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalValorVenda),
								alignment: 'right',
								fontSize: 8,
								colSpan: 2,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{}
						]);	
					} else {
						rows.push([
							{
								text: 'TOTAL GERAL...',
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: totalQtdeVenda,
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(totalValorVenda),
								alignment: 'right',
								fontSize: 8,
								colSpan: 2,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{}
						]);	
					}

					db.detach();

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const obterDevolucoes = function(pessoa, produto, inicio, final, db) {

    return new Promise(async (resolve, reject) => {
		
		let sql = `select sum(MOVIMENTOSITENS_QUANTIDADE) as QUANTIDADE_DEVOLUCAO,
	                      sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as VALOR_DEVOLUCAO
				   from MOVIMENTOSITENS
				   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				   join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
				   where
				          MOVIMENTOS_ID_PESSOAS =  ${pessoa} and
						  MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
						  OPERACOES_ACAO = 'DV' and
						  MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
        				  ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) `

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0] : []);
            }
        });
    });
};
