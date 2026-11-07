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

const getVendasPessoa = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, quebra, sovenda, soinsumo, documento, inicio, final, pesinicio, pesfinal, grpinicio, grpfinal, proinicio, profinal} = params;
		const db = await samosFB.conectarBanco(params.client);

		let parPessoainicial  = (pesinicio > 0 ? pesinicio : 1);
		let parPessoafinal    = (pesfinal  > 0 ? pesfinal  : 999999);
		let parGrupoinicial   = (grpinicio > 0 ? grpinicio : 1);
		let parGrupofinal     = (grpfinal  > 0 ? grpfinal  : 999999);
		let parProdutoinicial = (proinicio > 0 ? proinicio : 1);
		let parProdutofinal   = (profinal  > 0 ? profinal  : 999999);

		let sqlWhere = '';
		let sqlSearch = '';

		sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} `;
		sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    
		sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;

		if(empresa > 0) {
		   sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}
	  
		if(params.empresacnpj == '05971492000186') {  // Biomart
			if(sovenda.toUpperCase().match(/T/)) { sqlWhere += ` and OPERACOES_ACAO = 'VN' `; };
			if(soinsumo.toUpperCase().match(/T/)) {
				sqlWhere += `  and OPERACOES_ACAO = 'VN'
							   and ((left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5101') or
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6101') or
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6122') or
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '6922') or                                           
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5124') or
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5922') or
								   (left(rpad(MOVIMENTOSITENS_ID_OPERACOES, 6), 4) = '5122')) `;
			}
		}

		if(params.estado && params.estado.toUpperCase() != 'TODOS') {
			sqlWhere += ` and CIDADES_ESTADO = '${params.estado}' `;
		}


		const sqlDocumento = documento == 0 ? '0002' :  // Pedido
							 documento == 1 ? '0003' :  // Nota
							 documento == 2 ? '0004' :  // Requisição
							 documento == 3 ? '0011' :  // Cupom Fiscal
							 documento == 4 ? '0001' :  // Orçamento
							 '';

		if(params.tipo == 0) {
			sqlSearch = `select MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 
								MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
								MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMEROORIGEM, MOVIMENTOS_SERIEORIGEM, 
								MOVIMENTOS_TOTAL, MOVIMENTOS_FRETE, MOVIMENTOS_DESPESAS, MOVIMENTOSITENS_ID_PRODUTOS, 
								PRODUTOS_NOME, MOVIMENTOSITENS_QUANTIDADE, 
								(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
						FROM MOVIMENTOSITENS
						left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
						left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
						left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
						left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
						left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
						where ((MOVIMENTOS_STATUS <> 'C') and 
							   (MOVIMENTOS_STATUS <> 'D') and
							   (MOVIMENTOS_STATUS <> 'R') and
							   (MOVIMENTOS_STATUS <> 'V')) and
						right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and
						MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
						${sqlWhere}
						ORDER BY MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
		} else if(params.tipo == 1) {
			sqlSearch = `SELECT MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME, CIDADES_NOME, CIDADES_ESTADO,
						sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as PESSOAS_TOTAL
						FROM MOVIMENTOSITENS
						left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
						left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
						left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
						left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES                                
						where ((MOVIMENTOS_STATUS <> 'C') and 
							   (MOVIMENTOS_STATUS <> 'D') and
							   (MOVIMENTOS_STATUS <> 'R') and
							   (MOVIMENTOS_STATUS <> 'V')) and
						right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and                                                
						MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
						${sqlWhere}
						group by PESSOAS_NOME, MOVIMENTOS_ID_PESSOAS, CIDADES_NOME, CIDADES_ESTADO
						order by PESSOAS_TOTAL descending`
		} else { // Produto
			sqlSearch = `SELECT MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME, 
								MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_FABRICA,
						sum(MOVIMENTOSITENS_QUANTIDADE) as PRODUTOS_QUANTIDADE,
						sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as PRODUTOS_TOTAL
						FROM MOVIMENTOSITENS
						left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
						left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
						left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
						left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES                                
						where ((MOVIMENTOS_STATUS <> 'C') and 
							   (MOVIMENTOS_STATUS <> 'D') and
							   (MOVIMENTOS_STATUS <> 'R') and
							   (MOVIMENTOS_STATUS <> 'V')) and
						right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '${sqlDocumento}' and                                                
						MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
						${sqlWhere}
						group by MOVIMENTOS_ID_PESSOAS, 
								 PESSOAS_NOME, 
								 MOVIMENTOSITENS_ID_PRODUTOS,
								 PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_FABRICA
						order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOSITENS_ID_PRODUTOS`
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
			getVendasPessoa(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

                    let devolucoesItem   = [];

					let docValorVenda    = 0;
					let pessoaValorVenda = 0;
					let totalValorVenda  = 0;

					let docQtdeVenda     = 0;
					let pessoaQtdeVenda  = 0;
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

					for(let i in res.results){

						if(params.tipo == 0) { // Relatório Analítico

							if(ultimaPessoa != res.results[i]['MOVIMENTOS_ID_PESSOAS']) {
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
										text: '* * * Pessoa: ' + ('00000' + res.results[i]['MOVIMENTOS_ID_PESSOAS']).slice(-5) + ' - ' + 
											res.results[i]['MOVIMENTOS_NOME'] + ' - ' +
											res.results[i]['CIDADES_NOME']    + '/'   +
											res.results[i]['CIDADES_ESTADO']  + ' * * *',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 10,
										fontSize: 9,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);	
								ultimaPessoa = res.results[i]['MOVIMENTOS_ID_PESSOAS'];
							}
	
							if(ultimoDocumento != res.results[i]['MOVIMENTOS_NUMERO']) {
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
										text: ('000000' + res.results[i]['MOVIMENTOS_NUMERO']).slice(-6),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: res.results[i]['MOVIMENTOS_SERIE'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]									
									},
									{
										text: ('000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-3) + ' ' +
											  res.results[i]['USUARIOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false],									
										colSpan: 2
									},{},
									{
										text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
										alignment: 'center',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['PRODUTOS_NOME'],
										alignment: 'left',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										border: [false, false, false, false],									
										style: 'tableExample'
									}
								]);	
								ultimoDocumento = res.results[i]['MOVIMENTOS_NUMERO'];
							} else {
								rows.push([
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},
									{text: '', 	border: [false, false, false, false]},								
									{
										text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: res.results[i]['PRODUTOS_NOME'],
										alignment: 'left',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									},
									{
										text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_TOTAL']),
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]
									}
								]);	
							}
							docQtdeVenda     += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
							docValorVenda    += res.results[i]['MOVIMENTOSITENS_TOTAL'];
							pessoaQtdeVenda  += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
							pessoaValorVenda += res.results[i]['MOVIMENTOSITENS_TOTAL'];
							totalQtdeVenda   += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
							totalValorVenda  += res.results[i]['MOVIMENTOSITENS_TOTAL'];

						} else if(params.tipo == 1) {  // Relatório Sintético

							rows.push([
								{
									text: ('000000' + res.results[i]['MOVIMENTOS_ID_PESSOAS']).slice(-6),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['PESSOAS_NOME'],
									alignment: 'left',
									colSpan: 6,
									style: 'tableExample',
								},{},{},{},{},{},
								{
									text: res.results[i]['CIDADES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['CIDADES_ESTADO'],
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['PESSOAS_TOTAL']),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	

							totalQtdeVenda   += 
							totalValorVenda  += res.results[i]['PESSOAS_TOTAL'];

						} else {  // Relatório Cliente/Produto

							if(ultimaPessoa != res.results[i]['MOVIMENTOS_ID_PESSOAS']) {
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
									pessoaQtdeVenda  = 0;
									pessoaValorVenda = 0;
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
										text: '* * * Cliente: ' + ('00000' + res.results[i]['MOVIMENTOS_ID_PESSOAS']).slice(-5) + ' - ' + 
											res.results[i]['PESSOAS_NOME'] + ' * * *',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 10,
										fontSize: 9,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);	
								ultimaPessoa = res.results[i]['MOVIMENTOS_ID_PESSOAS'];
							}

							devolucoesItem = await obterDevolucoes(res.results[i]['MOVIMENTOS_ID_PESSOAS'], res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'], params.inicio, params.final, db);

                            let devQuantidade = (cents(devolucoesItem['QUANTIDADE_DEVOLUCAO']) / 100);
							let devValor      = (cents(devolucoesItem['VALOR_DEVOLUCAO']) / 100);
							let qtdeLiquida   = res.results[i]['PRODUTOS_QUANTIDADE'] - devQuantidade;
							let valorLiquido  = res.results[i]['PRODUTOS_TOTAL'] - devValor;

							rows.push([
								{
									text: ('000000' + res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['PRODUTOS_FABRICA'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['PRODUTOS_NOME'],
									colSpan: 4,
									style: 'tableExample',
								},{},{},{},
								{
									text: res.results[i]['PRODUTOS_UNIDADE'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: qtdeLiquida,
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(cents(valorLiquido) / cents(qtdeLiquida)),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorLiquido),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	

							pessoaQtdeVenda  += qtdeLiquida;
							totalQtdeVenda   += qtdeLiquida;

							pessoaValorVenda  += valorLiquido;
							totalValorVenda  += valorLiquido;
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
								text: 'TOTAL GERAL...',
								alignment: 'right',
								fontSize: 8,
								bold: true,							
								colSpan: 8,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},
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
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);	
					} else if(params.tipo == 1) {  // Sintético (Não tem totalizador de quantidade)
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
