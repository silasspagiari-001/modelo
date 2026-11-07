'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 11 Colunas
				{
					style: 'tableExample',
					table: { //  CD  [NOME ] COR CPR SLD VDA MDI MME CPA CUS
						widths: [35, 90,160,  80, 50, 50, 50, 50, 50, 50, 50],
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
			api.compras().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let pessoaAnt;	
					let totalComprado = 0;		
					let pessoaComprado = 0;

					let totalSaldo = 0;		
					let pessoaSaldo = 0;

					let totalVenda = 0;		
					let pessoaVenda = 0;

					let totalQtdeComprar = 0;		
					let pessoaQtdeComprar = 0;

					let totalCustoComprar = 0;		
					let pessoaCustoComprar = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const cents = utils.number.cents.bind(utils.number);					
					const db = await samosFB.conectarBanco(params.client); 

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
								text: `Relatório para Compras - para ${params.meses} ${((params.meses && params.meses > 1) ? 'Meses' : 'Mês')}` ,
								colSpan: 7,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
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
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: `Vendas: ${params.inicio} a ${params.final} (${res.results[0]['PRODUTOS_PERIODO']} dias)`,
								colSpan: 7,
								fontSize: 12,
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
								text: 'Código',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Nome Produto',
								colSpan: 2,
								style: 'tableHeader',
								alignment: 'center'									
							},{},
							{
								text: 'Cor',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Comprado',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Saldo CD',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Venda Total',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Méd Diária',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Méd Mensal',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Comprar',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Custo',
								style: 'tableHeader',
								alignment: 'center'
							}							

						]						
					)

					for(let i in res.results){

                        let QtdeMeses = (params.meses && params.meses > 0) ? params.meses : 1;
						let codigoProduto = res.results[i]['PRODUTOS_ID'];
						let saldoAtual = cents(res.results[i]['SALDOS_DISPONIVEL']) / 100;
						let periodo = res.results[i]['PRODUTOS_PERIODO'];
						let comprado = await obterCompradoPeriodo(codigoProduto, params.inicio, params.final, db);
						let vendas = await obterVendasPeriodo(codigoProduto, params.inicio, params.final, db);
						let mediaDiaria = (vendas > 0 && periodo > 0 ? (vendas/periodo) : 0);
						let mediaMensal = (mediaDiaria > 0 ? (mediaDiaria * 30) : 0);

						let qtdeComprar = (mediaMensal > 0 && (Math.round(mediaMensal * QtdeMeses)) > 0) ?
										  (Math.round(mediaMensal * QtdeMeses)) : 0;

						qtdeComprar = qtdeComprar - saldoAtual - comprado;
						
						qtdeComprar = (qtdeComprar  < 0) ? 0 : qtdeComprar;

						let custoComprar = (parseInt(qtdeComprar.toFixed(0)) * res.results[i]['SALDOS_CUSTO']);

						if(qtdeComprar >= 1 || params.tipo == 1) {
                            if(pessoaAnt !== res.results[i]['PRODUTOS_ID_PESSOAS']) {
                                if(pessoaCustoComprar > 0) {
									rows.push([
										{
											text: 'Totais Fornecedor: ',
											colSpan: 4,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										},{},{},{},
										{
											text: pessoaComprado,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										},
										{
											text: pessoaSaldo, // Totalizador saldos (qtde)
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										},
										{
											text: pessoaVenda, // Totalizador vendas (qtde)
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										},
										{
											text: '', // coluna média diária	
											border: [false, false, false, false]																					
										},
										{
											text: '', // coluna média mensal
											border: [false, false, false, false]
										},
										{
											text: pessoaQtdeComprar,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										},
										{
											text: utils.number.float2moeda(pessoaCustoComprar),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false],											
											fontSize: 10,
											bold: true
										}
									]);	
								}							
								rows.push([
									{
										text: '### Fornecedor: ' + ("000000" + res.results[i]['PRODUTOS_ID_PESSOAS']).slice(-6) + ' - ' + res.results[i]['PESSOAS_NOME'],
										colSpan: 11,
										alignment: 'left',
										style: 'tableExample',
										fontSize: 10,
										bold: true
									},{},{},{},{},{},{},{},{},{},{}
								]);
								pessoaAnt = res.results[i]['PRODUTOS_ID_PESSOAS'];
								pessoaComprado = 0;
								pessoaSaldo = 0;
								pessoaVenda = 0;
								pessoaQtdeComprar = 0;
								pessoaCustoComprar = 0;
							}
							rows.push([
								{
									text: codigoProduto,
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['PRODUTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
									colSpan: 2
								},{},
								{
									text: res.results[i]['PRODUTOS_MARCA'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: comprado.toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: saldoAtual.toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: vendas.toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(mediaDiaria),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(mediaMensal),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: qtdeComprar.toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(custoComprar),
									alignment: 'right',
									style: 'tableExample'
								}

							]);

							totalComprado += comprado;		
							pessoaComprado += comprado;
		
							totalSaldo += saldoAtual;
							pessoaSaldo += saldoAtual;
		
							totalVenda += vendas;
							pessoaVenda += vendas;
		
							totalQtdeComprar += qtdeComprar;
							pessoaQtdeComprar += qtdeComprar;
		
							pessoaCustoComprar += custoComprar;
							totalCustoComprar += custoComprar;
						}
					}

					if(pessoaCustoComprar > 0) {
						rows.push([
							{
								text: 'Totais Fornecedor: ',
								colSpan: 4,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},{},{},{},
							{
								text: pessoaComprado,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: pessoaSaldo, // Totalizador saldos (qtde)
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: pessoaVenda, // Totalizador vendas (qtde)
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: '', // coluna média diária
								border: [false, false, false, false]								
							},
							{
								text: '', // coluna média mensal
								border: [false, false, false, false]								
							},
							{
								text: pessoaQtdeComprar,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: utils.number.float2moeda(pessoaCustoComprar),
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],
								bold: true
							}
						]);	
					}

					if(totalCustoComprar > 0) {
						rows.push([
							{
								text: 'Total Geral: ',
								colSpan: 4,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},{},{},{},
							{
								text: totalComprado,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: totalSaldo, // Totalizador saldos (qtde)
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: totalVenda, // Totalizador vendas (qtde)
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: '', // coluna média diária	
								border: [false, false, false, false]
							},
							{
								text: '', // coluna média mensal
								border: [false, false, false, false]								
							},
							{
								text: totalQtdeComprar,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							},
							{
								text: utils.number.float2moeda(totalCustoComprar),
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,
								border: [false, false, false, false],								
								bold: true
							}
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

const obterVendasPeriodo = function(produto, inicio, final, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `execute block returns ( VENDAS numeric(12,2) ) as
								declare variable EMISSAO date;		
								declare variable QUANTIDADE numeric(12,3);
								begin
									VENDAS = 0;
									for
										select MOVIMENTOS_EMISSAO,
											   MOVIMENTOSITENS_QUANTIDADE
										from MOVIMENTOSITENS
										join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
										join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
										where   MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
												MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
												((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
												right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002'
										order by MOVIMENTOS_EMISSAO
										into
										    :EMISSAO,
											:QUANTIDADE
									do
										begin
											VENDAS = VENDAS + :QUANTIDADE;
										end
								suspend;
								end;`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0]['VENDAS'] : 0);
            }
        });
    });
};

const obterCompradoPeriodo = function(produto, inicio, final, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `execute block returns ( COMPRADO numeric(12,2) ) as
								declare variable EMISSAO date;		
								declare variable QUANTIDADE numeric(12,3);
								begin
									COMPRADO = 0;
									for
										select MOVIMENTOS_EMISSAO,
											   MOVIMENTOSITENS_QUANTIDADE
										from MOVIMENTOSITENS
										join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
										where   MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
												MOVIMENTOS_EMISSAO <= '${final.replace (/\//ig,'.')}' and
												right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0006' and
												MOVIMENTOS_STATUS = 'N'
										order by MOVIMENTOS_EMISSAO
										into
										    :EMISSAO,
											:QUANTIDADE
									do
										begin
											COMPRADO = COMPRADO + :QUANTIDADE;
										end
								suspend;
								end;`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0]['COMPRADO'] : 0);
            }
        });
    });
};