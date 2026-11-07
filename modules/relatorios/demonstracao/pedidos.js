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
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						header: function(page, pages) { 
							return {
								columns: [
									{
										text: 'Página: ' + page.toString() + ' de ' + pages.toString(),
										width: '*',
										style: {
											fontSize: 8,
											alignment: 'right'
										}
									}
								],
								margin: [25, 10]
							}
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
						},									
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
//									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414									
									widths: [34, 35, 27, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
									headerRows: 6,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
								
					const impLog = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					const impDiasVencido = params.diasvctorodape;
					const titDocumento = params.titledocumento;
					let model = res.results[0];

					let pessoaCnpj = '';
					let pessoaIe = '';
					let pessoaEnd = '';
					let pessoaNum = '';
					let pessoaBai = '';
					let pessoaCep = '';
					let pessoaMun = '';
					let pessoaUf = '';
					let pessoaFon = '';
					let pessoaCel = '';
		
					if(model['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
						pessoaCnpj = model['PROPRIEDADES_CPFCNPJ'];
						pessoaIe   = model['PROPRIEDADES_INSCRICAO'];
						pessoaEnd  = model['PROPRIEDADES_ENDERECO'];
						pessoaNum  = model['PROPRIEDADES_NUMERO'];;
						pessoaBai  = model['PROPRIEDADES_BAIRRO'];
						pessoaCep  = model['PROPRIEDADES_CEP'];
						pessoaMun  = model['CIDADES_NOMEPROPRIEDADE'];
						pessoaUf   = model['CIDADES_ESTADOPROPRIEDADE'];
						pessoaFon  = model['PROPRIEDADES_TELEFONE'];
						pessoaCel  = model['PROPRIEDADES_CELULAR'];
					} else {
						pessoaCnpj = model['PESSOAS_CPFCNPJ'];
						pessoaIe   = model['PESSOAS_INSCRICAO'];
						pessoaEnd  = model['PESSOAS_ENDERECO'];
						pessoaNum  = model['PESSOAS_NUMERO'];;
						pessoaBai  = model['PESSOAS_BAIRRO'];
						pessoaCep  = model['PESSOAS_CEP'];
						pessoaMun  = model['CIDADES_NOME'];
						pessoaUf   = model['CIDADES_ESTADO'];
						pessoaFon  = model['PESSOAS_TELEFONE'];
						pessoaCel  = model['PESSOAS_CELULAR'];
					}		

					let obsPedido = '';
					let nomeAssinatura = '';
					let strObsPedido = model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ');

					if(strObsPedido.substr(0, 30).match(/\*/)) {
						nomeAssinatura = strObsPedido.split('*')[0];
						obsPedido = strObsPedido.split('*')[1];
					} else {
						obsPedido = strObsPedido;
					}

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let itensPagina     = 0;
					let somaImediatas   = 0;
					let somaEntregar    = 0;
					let vctsPedido      = carregarPagamentos(model);
					let rows            = docDefinition.content[0].table.body;
					let isDevolucao     = model['DOCUMENTOS_NOME'].toUpperCase().match(/DEVOLU/) ? true : false;
					
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/default.png`;
					}
					
					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 80,
								alignment: 'left',
								border: [true, true, false, true]
							},{},
							{
								colSpan: 4,
								text: [
									{
										text: model['EMPRESAS_NOME'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: model['EMPRESAS_EMAIL'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: model['EMPRESAS_PAGINA'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: utils.string.maskFone(model['EMPRESAS_TELEFONE']) + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 12}
									}
								],
								border: [false, true, true, true]
							},{},{},{},
							{
								colSpan: 6,
								text: [
									{
										text: `\n${titDocumento.toUpperCase()}`,
										alignment: 'center',
										style: {bold: true,	fontSize: 14}

									},
									{
										text: '\nVendedor:\n' + model['USUARIOS_NOME'],
										alignment: 'left',
										style: {bold: true,	fontSize: 8}

									}
								]
							},
							{},{},{},{},{},
							{ 
								colSpan: 2,									
								text: [
									{
										text: ''
									},
									{
										text: `Nº `,
										fontSize: 10, //16
										alignment: 'center'
									},
									{
										text: model['MOVIMENTOS_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10 //16
										}
									},
									{
										text: `\n\nEmissão: ${emiPedido}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10
										}										
									}									
								]
							},{}
						],
						[
							{
								text: 'Nome'
							},
							{
								text: model['MOVIMENTOS_NOME'] + '(' + model['MOVIMENTOS_ID_PESSOAS'] + ')',
								colSpan: 7
							},{},{},{},{},{},{},
							{
								text: pessoaCnpj.length == 11 ? 'CPF' : 'CNPJ'
							}, 
							{
								text: utils.string.maskCnp(pessoaCnpj),
								fontSize: (pessoaCnpj.length == 11 ? 8 : 6),
								colSpan: 2								
							},							
							{}, 
							{
								text: 'Cel'
							},
							{
								text: utils.string.maskFone(pessoaCel),
								fontSize: 7,
								colSpan: 2
							},
							{}                            
						], // 12 ok
						[
							{
								text: 'Endereço'
							},
							{
								text: pessoaEnd + (pessoaNum ? ', ' + pessoaNum : ''),
								colSpan: 5
							},{},{},{},{},
							{
								text: impLog,
								colSpan: 5
							},{},{},{},{},						
							{
								text: 'Tel'
							},
							{
								text: utils.string.maskFone(pessoaFon),
								colSpan: 2
							},
							{}                            
						],
						[
							{
								text: 'Bairro'
							},
							{
								text: pessoaBai,
								colSpan: 5
							},{},{},{},{},	
							{
								text: 'Cidade'
							}, 
							{
								text: pessoaMun + '/' + pessoaUf,
								colSpan: 7
							},{},{},{},{},{},{}
						],
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 1
								},
								colSpan: 14,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);

					let colLoja = false;
					let colDeposito = false;
					let colImediata = false;
					let colEntregar = false;
					let spanCols = 4;

					for(let i in produtos) {  // Varredura para determinar quais colunas imprimir
						let qtdeProduto          = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0));
						let qtdeEntregueLoja     = ((produtos[i]['MOVIMENTOSITENS_ENTREGUE'] - parseInt(produtos[i]['MOVIMENTOSITENS_ENTREGUE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_ENTREGUE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_ENTREGUE'].toFixed(0));
						let qtdeEntregueDeposito = ((produtos[i]['MOVIMENTOSITENS_DEPOSITO'] - parseInt(produtos[i]['MOVIMENTOSITENS_DEPOSITO'])) != 0 ? produtos[i]['MOVIMENTOSITENS_DEPOSITO'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_DEPOSITO'].toFixed(0));
						let qtdeImediata         = ((produtos[i]['MOVIMENTOSITENS_IMEDIATA'] - parseInt(produtos[i]['MOVIMENTOSITENS_IMEDIATA'])) != 0 ? produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(0));
						let qtdeCalculo          = (produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - produtos[i]['MOVIMENTOSITENS_ENTREGUE'] - produtos[i]['MOVIMENTOSITENS_DEPOSITO'] - produtos[i]['MOVIMENTOSITENS_IMEDIATA']);
						let qtdeEntregar         = (qtdeCalculo - parseInt(qtdeCalculo) != 0 ? qtdeCalculo.toFixed(3).replace('.',',') : qtdeCalculo.toFixed(0));

						qtdeEntregueLoja = qtdeEntregueLoja == '0' ? '' : qtdeEntregueLoja;
						qtdeEntregueDeposito = qtdeEntregueDeposito == '0' ? '' : qtdeEntregueDeposito;
						qtdeImediata = qtdeImediata == '0' ? '' : qtdeImediata;
						qtdeEntregar = qtdeEntregar == '0' ? '' : qtdeEntregar;

						if(isDevolucao) {
							qtdeEntregueLoja = qtdeProduto;
							qtdeEntregueDeposito = '';
							qtdeImediata = '';
							qtdeEntregar = '';
						}

						if(qtdeEntregueLoja){colLoja = true;};
						if(qtdeEntregueDeposito){colDeposito = true;};
						if(qtdeImediata){colImediata = true;};
						if(qtdeEntregar){colEntregar = true;};

					}

					if(colLoja){spanCols--;}
					if(colDeposito){spanCols--;}
					if(colImediata){spanCols--;}
					if(colEntregar){spanCols--;}

					let colsPedido = [];											

					colsPedido.push({
						text: 'Código',
						alignment: 'center'
					},
					{
						text: 'Descrição do Produto',
						alignment: 'center',
						colSpan: (4 + spanCols)
					},{},{},{});
					if(!colLoja) {colsPedido.push({});};
					if(!colDeposito) {colsPedido.push({});};
					if(!colImediata) {colsPedido.push({});};
					if(!colEntregar) {colsPedido.push({});};						
					colsPedido.push({	
								text: isDevolucao ? 'Devolvido' : 'Comprado',
								alignment: 'center',
								fontSize: 6
							});

					if(colLoja)     {colsPedido.push({text: 'Loja', alignment: 'center'})};
					if(colDeposito) {colsPedido.push({text: 'Depósito', alignment: 'center', fontSize: 6})};
					if(colImediata) {colsPedido.push({text: 'Imediato', alignment: 'center', fontSize: 6})};
					if(colEntregar) {colsPedido.push({text: 'Entregar', alignment: 'center', fontSize: 6})};

					colsPedido.push({
						text: 'Preço',
						colSpan: 2,								
						alignment: 'center'},{},
					{
						colSpan: 2,
						text: 'Total',
						alignment: 'center'								
					}, {});

					rows.push(colsPedido);				

					for(let i in produtos){
						let qtdeProduto  = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0));
						let qtdeEntregueLoja = ((produtos[i]['MOVIMENTOSITENS_ENTREGUE']   - parseInt(produtos[i]['MOVIMENTOSITENS_ENTREGUE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_ENTREGUE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_ENTREGUE'].toFixed(0));
						let qtdeEntregueDeposito = ((produtos[i]['MOVIMENTOSITENS_DEPOSITO']   - parseInt(produtos[i]['MOVIMENTOSITENS_DEPOSITO'])) != 0 ? produtos[i]['MOVIMENTOSITENS_DEPOSITO'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_DEPOSITO'].toFixed(0));
						let qtdeImediata = ((produtos[i]['MOVIMENTOSITENS_IMEDIATA']   - parseInt(produtos[i]['MOVIMENTOSITENS_IMEDIATA'])) != 0 ? produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(0));
						let qtdeCalculo = (produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - produtos[i]['MOVIMENTOSITENS_ENTREGUE'] - produtos[i]['MOVIMENTOSITENS_DEPOSITO'] - produtos[i]['MOVIMENTOSITENS_IMEDIATA']);
						let qtdeEntregar = (qtdeCalculo - parseInt(qtdeCalculo) != 0 ? qtdeCalculo.toFixed(3).replace('.',',') : qtdeCalculo.toFixed(0));

						let precoUnitario        = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
											       utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
											       produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))

						qtdeEntregueLoja = qtdeEntregueLoja == '0' ? '' : qtdeEntregueLoja;
						qtdeEntregueDeposito = qtdeEntregueDeposito == '0' ? '' : qtdeEntregueDeposito;
						qtdeImediata = qtdeImediata == '0' ? '' : qtdeImediata;
						qtdeEntregar = qtdeEntregar == '0' ? '' : qtdeEntregar;

						if(isDevolucao) {
							qtdeEntregueLoja = qtdeProduto;
							qtdeEntregueDeposito = '';
							qtdeImediata = '';
							qtdeEntregar = '';
						}

						let metrosMadeira = calcularMetragemMadeiras(produtos[i]);

						let colsPedido = [];						

						colsPedido.push({
							text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
							alignment: 'center',
							style: {fontSize: 8}
						},
						{
							text: produtos[i]['PRODUTOS_NOME'] + (metrosMadeira ? ' (' + metrosMadeira.toFixed(4) + ')' : ''),
							colSpan: (4 + spanCols),
							style: {
								fontSize: 8
							}
						},{},{},{});
						if(!colLoja) {colsPedido.push({});};
						if(!colDeposito) {colsPedido.push({});};
						if(!colImediata) {colsPedido.push({});};
						if(!colEntregar) {colsPedido.push({});};						
						colsPedido.push({					
							text: qtdeProduto,
							alignment: 'right',
							style: {
								fontSize: 8
							}																		
						});

						if(colLoja) {
							colsPedido.push({
								text: qtdeEntregueLoja,
								alignment: 'right',
								style: {
									fontSize: 8
								}
							});
						}

						if(colDeposito) {
							colsPedido.push({
								text: qtdeEntregueDeposito,
								alignment: 'right',
								style: {
									fontSize: 8
								}
							});								
						}

						if(colImediata) {
							colsPedido.push({
								text: qtdeImediata,
								alignment: 'right',
								style: {
									fontSize: 8
								}
							});								
						}

						if(colEntregar) {
							colsPedido.push({
								text: qtdeEntregar,
								alignment: 'right',
								style: {
									fontSize: 8
								}
							});								
						}

						colsPedido.push(
							{
								colSpan: 2,
								text: precoUnitario,
								alignment: 'right',
								style: {
									fontSize: 8
								},
							},{},								
							{
								colSpan: 2,
								text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{}							
						);
						rows.push(colsPedido);
						somaImediatas += (produtos[i]['MOVIMENTOSITENS_IMEDIATA'] || 0);
						somaEntregar  += (produtos[i]['ITENS_ENTREGAR'] || 0);
						itensPagina++
						if(itensPagina > 12) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 14,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}
					}  // end for

					rows.push(
						[
							{
								text: obsPedido + '\n' + vctsPedido,
								colSpan: 10,
								rowSpan: 4,
								style: {
									fontSize: 10
								},
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Produtos',
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']),
								alignment: 'right',
								style: {
									fontSize: 9
								},																			
							},{}
						]
					);

					rows.push(
						[
							{
								text: '',
								colSpan: 10,
								style: {
									fontSize: 10
								},
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Despesa',
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{}
						]
					);
					
					rows.push(
						[
							{
								text: '',
								colSpan: 10,
								style: {
									fontSize: 8
								},
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Desconto',
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{}
						]
					);

					rows.push(
						[
							{
								text: '',
								colSpan: 10,
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Total',
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true
								}																		
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true							
								}																			
							},{}
						]
					);

					if(nomeAssinatura) {
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									border: [false, false, false, false]
								},
								{
									text: nomeAssinatura,
									colSpan: 4,
									alignment: 'center',
									border: [false, true, false, false]
								},{},{},{},
								{
									text: '',
									colSpan: 9,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}
							]
						);
					}

					if(impDiasVencido == 'true' && model['MOVIMENTOS_ID_PESSOAS'] != model['DOCUMENTOS_ID_PESSOAS']) {
						const dAtraso = await obterDiasAtraso(model['MOVIMENTOS_ID_PESSOAS'], params);
						if(dAtraso && dAtraso <= -5) {
							rows.push(
								[
									{
										text: `Consta(m) Título(s) vencido(s) a ${Math.abs(dAtraso)} dias`,
										colSpan: 14,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);	
						}	
					}

					if((somaEntregar + somaImediatas) > 0 && !isDevolucao) {
						rows.push(
							[
								{
									text: `O prazo máximo para entrega de mercadoria é de 30 dias. Decorrido o prazo, o material será imediatamente entregue ou os valores pagos estarão sujeitos a alteração.`,
									fontSize: 10,
									bold: true,									
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
					}

					if(somaImediatas > 0 && !isDevolucao) {  // Se tiver algum item de imediatas... Imprime o comprovante.
						docDefinition.header = [];
						docDefinition.content[0].table.headerRows = 0;
						itensPagina = 0;

						rows.push( // Aqui fecho o rodapé de cada página
							[
								{
									pageBreak: 'after',
									colSpan: 14,
									text: '',
									fontSize: 1,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]						
						);									

						rows.push([ // Cabeçalho						
							{
								image: pathLogo, 
								colSpan: 3,
								width: 100,
								fit: [75, 75],
								alignment: 'center'
							},{},{},
							{
								colSpan: 11,
								text: [
									{
										text: 'Comprovante de Retirada/Entrega de Produtos\n',
										fontSize: 14, 
										alignment: 'center'		
									},
									{
										text: model['EMPRESAS_NOME'] + '\n',
										fontSize: 10,
										alignment: 'center'
									},
									{
										text: 'Vendedor: \n' + model['USUARIOS_NOME'],
										fontSize: 10,
										alignment: 'left'
									}
									
								]
							},{},{},{},{},{},{},{},{},{},{}
						]);

						rows.push([						
							{
								text: 'Cliente:',
								border: [true, true, true, true]
							},
							{
								text: '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ' + model['MOVIMENTOS_NOME'],
								colSpan: 8,
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},
							{
								text: 'CEP:',
								border: [true, true, true, true]
							},
							{
								text: utils.string.maskCep(pessoaCep),
								colSpan: 4,
								border: [true, true, true, true]
							},{},{},{}                            
						],
						[
							{
								text: 'Endereço:',
								fontSize: 7
							},
							{
								text: model['PESSOAS_ENDERECO'] + (model['PESSOAS_NUMERO'] ? ', ' + model['PESSOAS_NUMERO']: ''),
								colSpan: 8
							},{},{},{},{},{},{},{},
							{
								text: 'Tel:'
							},
							{
								text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
								colSpan: 4
							},{},{},{}                            
						],
						[
							{
								text: 'Bairro:'
							},
							{
								text: model['PESSOAS_BAIRRO'],
								colSpan: 5
							},{},{},{},{},
							{
								text: 'Cel:'
							}, 
							{
								text: utils.string.maskFone(pessoaCel),
								colSpan: 2								
							},{},
							{
								text: pessoaCnpj.length == 11 ? 'RG:' : 'Ies:'
							},
							{
								text: pessoaIe,
								colSpan: 4
							},{},{},{}
						],
						[
							{
								text: 'Cidade:'
							},
							{
								text: model['CIDADES_NOME'],
								colSpan: 6
							},{},{},{},{},{},
							{
								text: 'UF:'
							}, 
							{
								text: model['CIDADES_ESTADO'],
							}, 
							{
								text: model['PESSOAS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:',
								style: {fontSize: 8}
							}, 
							{
								text: utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
								colSpan: 4							
							},{},{},{}
						],
						[
							{
								text: 'Obs:'
							},
							{
								text: obsPedido,
								colSpan: 13
							},{},{},{},{},{},{},{},{},{},{},{},{}
						],								
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 1
								},
								colSpan: 14,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 6							
							}, 
							{},{},{},{},{},
							{
								text: 'Marca',
								alignment: 'center',								
								colSpan: 2
							},{},
							{
								text: 'Qtde',
								alignment: 'center',
								colSpan: 2								
							},{},
							{
								text: 'Obs',
								alignment: 'center',
								colSpan: 3
							},{},{}
						]
						);  // Fim do cabeçalho

						for(let i in produtos){

						let qtde = ((produtos[i]['MOVIMENTOSITENS_IMEDIATA'] - parseInt(produtos[i]['MOVIMENTOSITENS_IMEDIATA'])) != 0 ? produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_IMEDIATA'].toFixed(0));

						qtde = qtde == '0' ? '' : qtde;

						if(qtde) {
							rows.push(
								[
									{							
										text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 6.5 
										}											
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 6,
										style: {
											bold: true,
											fontSize: 8
										}
									},{},{},{},{},{},
									{
										text: produtos[i]['PRODUTOS_MARCA'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 6.5
										},										
										colSpan: 2
									}, {},
									{
										text: qtde,
										alignment: 'right',
										style: {
											fontSize: 8
										},
										colSpan: 2																											
									},{},
									{
										text: ' ',
										colSpan: 3
									},{},{}
								]
							)

							itensPagina++
							if(itensPagina > 12) {
								itensPagina = 0;
								rows.push( // Aqui fecho o rodapé de cada página
									[
										{
											colSpan: 14,
											text: 'Continua...',
											pageBreak: 'after',
											border: [false, false, false, false]
										},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]						
								);									
							}

						}						
						}

						rows.push( // Finaliza com o último rodapé
							[
								{
									text: `O prazo máximo para entrega de mercadoria é de 30 dias. Decorrido o prazo, o material será imediatamente entregue ou os valores pagos estarão sujeitos a alteração.`,
									fontSize: 10,
									bold: true,									
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[  
								{ 
									text: [
										{								
											text: `Retirada/Entrega referente à venda: ${model['MOVIMENTOS_NUMERO']} ${model['MOVIMENTOS_SERIE']} `,
											fontSize: 8
										},
										{
											text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
											bold: true,
											decoration: 'underline'
										},
										{
											text: ` Impresso por: ${impLog.split(' ')[0]} ${impLog.split(' ')[1]} ${impLog.split(' ')[2]}`,
										}

									],
									colSpan: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									text: '',
									border: [false, false, false, false]
								}
							]
						);

						rows.push(
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 12
								},
								colSpan: 14,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{}
						],	
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 12
								},
								colSpan: 14,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{}
						],							
						[  
							{
								text: 'Entregador:',
								alignment: 'left',
								colSpan: 4,
								border: [false, true, false, false]
							},{},{},{},
							{
								text: '',
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.string.firstUpper(model['MOVIMENTOS_NOME']) + ' ou\nrepresentante autorizado',
								style: {bold: true},
								alignment: 'center',
								colSpan: 8,
								border: [false, true, false, false],
							},{},{},{},{},{},{},{}
						]);
					} // Fim do se tiver imediatas

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const carregarPagamentos = function(model) {
	let formas     = '';
	let financeiros = model['MOVIMENTOS_FINANCEIROS'] || [];
	let titulos     = financeiros.filter(titulo => {
		return titulo['FINANCEIROS_ID_PESSOAS'] == model['MOVIMENTOS_ID_PESSOAS'];
	});
	let cheques     = model['MOVIMENTOS_CHEQUES'];
	let caixa       = model['MOVIMENTOS_CAIXA'];
	let isDevolucao = model['DOCUMENTOS_NOME'].toUpperCase().match(/DEVOLU/) ? true : false;

    if(model['MOVIMENTOS_NUMEROORIGEM']) {
		formas += 'Ref: ' + model['MOVIMENTOS_NUMEROORIGEM'] + ' ' + model['MOVIMENTOS_SERIEORIGEM'] + ' ';
	}

	if(isDevolucao) {
		if(model['MOVIMENTOS_SITUACAO'] === '0') {
			formas += ' (Abatimento no financeiro) ';
		} else {
			if(model['MOVIMENTOS_SITUACAO'] === '1') {
				formas += ' (Gerado crédito para cliente) ';
			} else {
				formas += ' (Retirada valor do caixa) ';
			}
		}
	}
	

	for (let i in caixa) {
		if(caixa[i]['MOVIMENTOSCAIXA_CREDITOPESSOA'] > 0 && !isDevolucao) {
			formas += 'Abatimento no Crédito Cliente: R$ ' + utils.number.float2moeda(caixa[i]['MOVIMENTOSCAIXA_CREDITOPESSOA']) + ' ';
		}		
		if(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO'] > 0) {
			formas += 'Dinheiro: R$ ' + utils.number.float2moeda(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO']) + ' ';
		}
		if(caixa[i]['MOVIMENTOSCAIXA_CREDITO'] > 0) {
			formas += 'Cartão Crédito: ' + utils.number.float2moeda(caixa[i]['MOVIMENTOSCAIXA_CREDITO']) + ' ';
		}
		if(caixa[i]['MOVIMENTOSCAIXA_DEBITO'] > 0) {
			formas += 'Cartão Débito: ' + utils.number.float2moeda(caixa[i]['MOVIMENTOSCAIXA_DEBITO']) + ' ';
		}		
	}

	if (cheques.length > 0) {
		formas += 'Cheque(s): '
		for (let i in cheques) {
			formas += 'Vcto: ' + moment(cheques[i]['CHEQUES_VENCIMENTO']).format('DD/MM/YYYY') + ' ';
			formas += ' R$ ' + utils.number.float2moeda(cheques[i]['CHEQUES_VALOR']) + ' ';
		}
		formas += '\n'
	}

	if (titulos.length > 0) {
		formas += 'Duplicata: '
		for (let i in titulos) {
			formas += 'Vcto: ' + moment(titulos[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') + ' ';
			formas += ' R$ ' + utils.number.float2moeda(titulos[i]['FINANCEIROS_ORIGINAL']) + ' ';
		}	
	}

	return formas;
};

const calcularMetragemMadeiras = function(item) {  // Calcula o valor em M3 das madeiras

	if(item['PRODUTOS_APLICACAO'].length == 0) {
		return 0;
	}

	let totalmetros = 0;
	let dimensoes   = item['PRODUTOS_APLICACAO'].split("|");

	if(dimensoes.length < 3){
		return 0;
	}

	let medida0 = dimensoes[0].replace(",", ".");
	let medida1 = dimensoes[1].replace(",", ".");
	let medida2 = dimensoes[2].replace(",", ".");

	let altura = parseFloat(medida0.split("=")[1]);
	let largura = parseFloat(medida1.split("=")[1]);
	let comprimento = parseFloat(medida2.split("=")[1]);
	
	if(altura && largura && comprimento) {
      totalmetros = ((altura * largura * comprimento) * item['MOVIMENTOSITENS_QUANTIDADE']);
	} else {
		totalmetros = 0;
	}

	return totalmetros;

};

const obterDiasAtraso = function(pessoa, params) {
    return new Promise(async (resolve, reject) => {
		const db = await samosFB.conectarBanco(params.client);

        const sql = `select min(datediff(day from current_date to FINANCEIROS_VENCIMENTO)) from FINANCEIROS
			   where FINANCEIROS_ID_PESSOAS = ${pessoa} 
			   and datediff(day from current_date to FINANCEIROS_VENCIMENTO) > -1825
			   and FINANCEIROS_STATUS = 'A' 
			   and FINANCEIROS_TIPO = 'R' group by FINANCEIROS_ID_PESSOAS`;

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
				if(results.length > 0) {
					resolve(results[0]['MIN'])
				} else {
					resolve(0)
				}
            }
			db.detach();
        });
    });
};