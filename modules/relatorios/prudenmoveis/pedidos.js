'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFirebird');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
					let model = res.results[0];
					const motivoCan = model['MOVIMENTOS_STATUS'] == 'C' ? `PEDIDO CANCELADO` : '';
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 25, 20, 20], //  [20, 30, 20, 25]
						background: [
							motivoCan ? // translate(50, 800)
							{  
								svg: `<svg><text transform="translate(50, 800) rotate(-55)"
											font-weight="bold"
											fill= "gray"
											style="font-size: 35px;"
										>* * * ${motivoCan} * * * ${motivoCan} * * *</text></svg>`
							} : null
						],									
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
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

					const impLog = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					let diaOrigem = '';
					const isDevolucao = model['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012';					

					const db  = await samosFB.conectarBanco(params.client);		

					if(isDevolucao && model['MOVIMENTOS_NUMEROORIGEM'] > 0) {
						diaOrigem = await pesquisarDataOrigem(model['MOVIMENTOS_ID_EMPRESAORIGEM'], model['MOVIMENTOS_NUMEROORIGEM'], model['MOVIMENTOS_SERIEORIGEM'], db);                        
					}

					if(model['PESSOAS_NOME'].trim() != model['MOVIMENTOS_NOME'].trim() ||
		   			   model['PESSOAS_CELULAR'].trim() != model['MOVIMENTOS_CELULAR'].trim()
					 ) {
						atualizarDadosPessoa(model['MOVIMENTOS_ID'], 
						                     model['PESSOAS_NOME'],
											 model['PESSOAS_CELULAR'], db);
						model['MOVIMENTOS_NOME'] = model['PESSOAS_NOME'];
						model['MOVIMENTOS_CELULAR'] = model['PESSOAS_CELULAR'];
					}

					db.detach();

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);
					let fanPessoa = (siglaFilial != 'FT' && model['PESSOAS_FANTASIA'] ? model['PESSOAS_FANTASIA'] : '');

					let caixa = model['MOVIMENTOS_CAIXA'][0] || {};
					let formaOrcada = model['MOVIMENTOS_FORMASPAGAMENTO'][0] || {};
					let financeiros = model['MOVIMENTOS_FINANCEIROS'][0];
					let cartoes = model['MOVIMENTOS_CARTOES'] || [];
					let listaCartoes = alistarCartoes(cartoes);
					let produtos        = model['MOVIMENTOS_ITENS'].sort((a, b) => {
						if (a['TOTAL_LIQUIDO'] < b['TOTAL_LIQUIDO']) {
							return 1;
						  }
						  if (a['TOTAL_LIQUIDO'] > b['TOTAL_LIQUIDO']) {
							return -1;
						  }
						  return 0;
					});
		
					let foraDeLinha = produtos.some(produto => produto['PRODUTOS_STATUS'] == 'L');
					let isRetirado  = (model['ROMANEIOS_MOVEIS'] || []).some(romaneio => romaneio['ROMANEIOS_STATUS'] == 'R');
					let isAbatido   = (model['MOVIMENTOS_NFE'] || '') == 'ABA';

					let obsPedido = (model['PESSOAS_PAGINA'] ? model['PESSOAS_PAGINA'] : '') + ' ' +
					                (model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ') : '');

					let vlrEntrada = (caixa['MOVIMENTOSCAIXA_DINHEIRO'] + caixa['MOVIMENTOSCAIXA_TRANSFERENCIAS']);
                    let condPagto = formaPagamento(model);

					let vlrFrete = utils.number.float2moeda(model['MOVIMENTOS_FRETE']);

					let qtdPrestacoesCheque = contaPrestacoes(model, 'CHE');
					let qtdPrestacoesDuplicata = contaPrestacoes(model, 'DUP');
					let qtdPrestacoesFinanceira = formaOrcada['MOVIMENTOSFORMAS_PRCFINANCEIRA'];

					let vlrPrestacoesCheque = valorPrestacoes(model, 'CHE');
					let vlrPrestacoesDuplicata = valorPrestacoes(model, 'DUP');
					let vlrPrestacoesFinanceira = formaOrcada['MOVIMENTOSFORMAS_VLRFINANCEIRA'];
					let vlrTotalFinanceira      = (parseInt(qtdPrestacoesFinanceira) * cents(vlrPrestacoesFinanceira)) / 100;
					
					let vctPrimeira = venctoPrimeira(model);
					let nomeFinanceira = (caixa['MOVIMENTOSCAIXA_OUTRO'] > 0 ? financeiros['PESSOAS_NOME'] || [] : '');

					let descriFinanceira = `Financeira: ${nomeFinanceira} (${qtdPrestacoesFinanceira} x R$ ${utils.number.float2moeda(vlrPrestacoesFinanceira)} = R$ ${utils.number.float2moeda(vlrTotalFinanceira)})`
					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					const dataEntrega   = moment(produtos[0]['MOVIMENTOSITENS_DATAENTREGA']);
					const turnoEntrega  = produtos[0]['MOVIMENTOSITENS_HORAENTREGA'];
					const nomeDocumento = isDevolucao ? 'DEVOLUÇÃO DE VENDA' : 'PEDIDO DE VENDA';
					let rows            = docDefinition.content[0].table.body;
					let vias;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					let pathFone  = `${appRoot}/resources/images/headers/telefone.png`
					let pathWhats = `${appRoot}/resources/images/headers/whatsapp.png`
					let pathFace  = `${appRoot}/resources/images/headers/facebook.png`
					let pathInsta = `${appRoot}/resources/images/headers/instagram.png`

					let enderecoInsta = '';
					let enderecoFace  = '';

					if(siglaFilial.match(/CM|AN|ML/)) {
						enderecoInsta = '@prudenmoveis'
						enderecoFace = '@prudenmoveis'
					} else {
						enderecoInsta = '@moveisedular'
						enderecoFace = '@edularmoveis'
					}

					for (vias = 0; vias < 2; vias++) {

						let linhas;
						let itensPagina     = 0;

						rows.push(
							[
								{
									image: pathLogo,
									fit: [100, 100],									
									colSpan: 2,
									width: 80,
									alignment: 'center',
									margin: [0, 10, 0, 0],
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
											text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']}\n`,
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: utils.string.maskCep(model['EMPRESAS_CEP']) + ' ' + model['CIDADES_NOMEEMPRESA'] + ' ' + model['CIDADES_ESTADOEMPRESA'] + '\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: 'CNPJ: ' +  utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']) + '\nI.E.: ' + model['EMPRESAS_INSCRICAO'],
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
									],
									border: [false, true, true, true]
								},{},{},{},
								{
									colSpan: 6,
									table: {
										body: [
											[ // 5 colunas por linha
											    {
													text: 'a',   // Pra alinhamento
													color: 'white', 
													fontSize: 9
												},
												{
													text: nomeDocumento,
													colSpan: 4,
													alignment: 'center',
													style: {bold: true,	fontSize: 9}
												},{},{},{},
											],
											[ 
												{
													text: 'a',   // Pra alinhamento
													color: 'white', 
													fontSize: 9
												},
												{
													image: pathFone,
													width: 9,  // after 13 all
													height: 9	
												},
												{
													text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
													style: {fontSize: 9, bold: true} // after 9
												},																
												{
													image: pathWhats,
													width: 9, // after 13 all
													height: 9	
												},
												{
													text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
													style: {fontSize: 9, bold: true}																	
												}
											],
											[
												{
													text: 'a',   // Pra alinhamento
													color: 'white', 
													fontSize: 9
												},
												{
													image: pathFace,
													width: 9,  //10 all
													height: 9	
												},
												{
													text: enderecoFace,
													style: {fontSize: 9, bold: true}
												},																
												{
													image: pathInsta,
													width: 9,
													height: 9	
												},
												{
													text: enderecoInsta,
													style: {fontSize: 9, bold: true}																	
												}
											]
										]
									},
									layout: 'noBorders'
								},
								{},{},{},{},{},
								{ 
									colSpan: 2,									
									text: [
										{
											text: ''
										},
										{
											text: `\n`,
											fontSize: 6,
											alignment: 'center'
										},
										{
											text: model['MOVIMENTOS_NUMERO'],
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 15
											}
										},
										{
											text: `\n${emiPedido}`,
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
									text: model['MOVIMENTOS_NOME'].toUpperCase() + (fanPessoa.length > 0 ? ` (${fanPessoa.toUpperCase()})` : '') + ' (' + model['MOVIMENTOS_ID_PESSOAS'] + ')',
									colSpan: 9
								},{},{},{},{},{},{},{},{},
								{
									text: 'Cel:',
									alignment: 'right'
								},
								{
									text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
									colSpan: 3
								},
								{},{}
							],
							[
								{
									text: 'Endereço'
								},
								{
									text: model['PESSOAS_ENDERECO'].toUpperCase(),
									colSpan: 7
								},{},{},{},{},{},{},{
									text: 'Número:',
									alignment: 'right',
									style: {
										fontSize: 7.5
									}										
								},{
									text: model['PESSOAS_NUMERO'],
									alignment: 'right'
								},
								{
									text: 'Tel:',
									alignment: 'right'
								},
								{
									text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
									colSpan: 3
								},{},{}
							],
							[
								{
									text: 'Bairro'
								},
								{
									text: model['PESSOAS_BAIRRO'].toUpperCase(),
									colSpan: 6
								},{},{},{},{},{},	
								{
									text: 'Cep:',
									alignment: 'right'
								}, 
								{
									text: model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
									colSpan: 2
								},{},
								{
									text: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? "RG" : "Ie"),
									alignment: 'right'
								},{
									text: model['PESSOAS_INSCRICAO'],
									colSpan: 3
								},{},{}
							],
							[
								{
									text: 'Cidade'
								},
								{
									text: model['CIDADES_NOME'],
									colSpan: 4
								},{},{},{},
								{
									text: 'UF:',
									alignment: 'right'
								},
								{
									text: model['CIDADES_ESTADO'],
									alignment: 'center'
								},	
								{
									text: model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:',
									alignment: 'right'
								}, 
								{
									text: utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ']),
									fontSize: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 8 : 7),
									colSpan: 2
								},{},
								{
									text: (vias == 0 ? 'PA:' : ''),
									alignment: 'right'
								},{
									text: (vias == 0 ? utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']) : ''),
									alignment: 'right',								
									colSpan: 3
								},{},{}
							],
							[
								{ 
									text: 'Obs:'
								},{
									text: (obsPedido == 'null' ? '' : obsPedido.toUpperCase()),
									colSpan: 13
								},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{ 
									text: '\n', 
									style: {
										fontSize: 1
									},
									colSpan: 14,									
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{
									text: 'Código',
									alignment: 'center'
								},
								{
									text: 'Descrição do Produto',
									alignment: 'center',
									colSpan: 7
								}, 
								{},{},{},{},{},{},
								{
									text: 'Cor',
									alignment: 'center',
									colSpan: 2,
									fontSize: 6								
								},{},
								{
									colSpan: 2,
									text: 'Quantidade',
									alignment: 'center'								
								},{},
								{
									colSpan: 2,
									text: 'Total',
									alignment: 'center'								
								},{}
							]
						);

						for(let i in produtos){
							let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
							if(i == 0 && vias == 0 && cents(model['MOVIMENTOS_FRETE']) > 0) {
								produtos[i]['MOVIMENTOSITENS_TOTAL'] = (produtos[i]['MOVIMENTOSITENS_TOTAL'] + model['MOVIMENTOS_FRETE'])
							}
							rows.push(
								[
									{							
										text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	
										alignment: 'center',
										style: {
											fontSize: 8
										}											
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 7,
										style: {
											fontSize: 8
										}
									},{},{},{},{},{},{},
									{
										text: produtos[i]['PRODUTOS_MARCA'],
										alignment: 'center',
										colSpan: 2,
										style: {
											fontSize: 8
										}
									},{},
									{
										colSpan: 2,
										text: qtdeProduto,
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda((produtos[i]['MOVIMENTOSITENS_TOTAL'] - produtos[i]['MOVIMENTOSITENS_DESCONTOS'])),
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{}
								]
							)
							itensPagina++
						}

						for (linhas = itensPagina; linhas < 4; linhas++) {
							rows.push(
								[
									{
										text: 'A',
										style: {
											fontSize: 8,
											color: 'white'
										}										
									},
									{text: '', colSpan: 7},{},{},{},{},{},{},
									{
										text: 'A',
										colSpan: 2,
										style: {
											fontSize: 8,
											color: 'white'
										}										
									},{},
									{
										text: 'A',
										colSpan: 2,
										style: {
											fontSize: 8,
											color: 'white'
										}
									},{},
									{
										text: 'A',
										colSpan: 2,
										style: {
											fontSize: 8,
											color: 'white'											
										}
									},{}
								]
							)
						}
						rows.push(
							[
								{
									text: 'Vendedor',
									style: {
										fontSize: 7
									}																			
								},
								{
									text: `${(model['USUARIOS_LOGIN'].split(' ')[0])}`,
									colSpan: 3,
								},{},{},
								{
									text: isDevolucao ? '' : 'Entrada:',
									alignment: 'left',
									border: [true, true, false, true]
								},
								{
									text: vlrEntrada > 0 ? utils.number.float2moeda(vlrEntrada) : isDevolucao ? '' : '0,00',
									alignment: 'left',
									bold: true,
									border: [false, true, true, true],
									colSpan: 2
								},{},
								{
									text: qtdPrestacoesCheque    ? `Cheque: ${qtdPrestacoesCheque}x ${vlrPrestacoesCheque}` :
								          qtdPrestacoesDuplicata ? `Carnê: ${qtdPrestacoesDuplicata}x ${vlrPrestacoesDuplicata}` : '',
									alignment: 'center',
									style: {
										fontSize: 9
									},
									border: [true, true, false, true],								
									colSpan: 3
								},{},{},
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
						)

						rows.push(
							[
								{
									text: 'Gerente',
									style: {
										fontSize: 7
									}																			
								},
								{
									text: model['EMPRESAS_MUNICIPAL'],
									colSpan: 3,
								},{},{},
								{
									text: isDevolucao ? '' : 'Vcto 1a:',
									alignment: 'left',
									border: [true, true, false, true]
								},
								{
									text: vctPrimeira,
									alignment: 'left',
									bold: true,
									border: [false, true, true, true],
									colSpan: 2
								},{},
								{
									text: (vlrPrestacoesFinanceira && descriFinanceira.length <= 40 ? descriFinanceira : ''),
									alignment: 'left',
									colSpan: 7
								},{},{},{},{},{},{}
							]
						)

						rows.push(
							[
								{
									text: 'Situação',
									style: {
										fontSize: 7
									}																			
								},
								{
									text: 'SUJEITO A APROVAÇÃO',
									colSpan: 3,
								},{},{},
								{
									text: isDevolucao ? 'Forma:' : 'Condição:',
									alignment: 'left',
									border: [true, true, false, true]
								},
								{
									text: condPagto,
									alignment: 'left',
									bold: true,
									border: [false, true, true, true],
									colSpan: 9
								},{},{},{},{},{},{},{},{}
							]
						)

						rows.push(
							[
								{
									text: isDevolucao ? 
									      'SOLICITEI A DEVOLUÇÃO DO MEU PEDIDO DE VENDA\n' + 
										  'AUTORIZO A RETIRADA DOS PRODUTOS EM MINHA RESIDÊNCIA\n' +
										  'POR SER A EXPRESSÃO DA VERDADE FIRMO E ASSINO A PRESENTE DEVOLUÇÃO'									
									    : 'PRODUTOS COM GARANTIA DE 90 DIAS LEI FEDERAL Nº 8.078/1990\n' + 
										  'PRODUTOS DE SHOWROOM CONFERIDOS E APROVADOS PELO CLIENTE\n' +
										  'CONFIRA MEDIDAS E CORES DOS PRODUTOS, NÃO REALIZAMOS TROCAS\n' + 
										(isAbatido ? 'CIENTE DE QUE EU SOLICITEI O ABATIMENTO DO SERVIÇO DE MONTAGEM\n' : '\n') +
										(isRetirado ? 'RETIREI E CONFERI OS PRODUTOS CONSTANTES DO PEDIDO DE VENDA ACIMA\n' : '\n'),
									colSpan: 7,
									alignment: 'center',
									border: [true, true, true, false],
									style: {
										fontSize: 8,
										bold: true
									}																			

								},{},{},{},{},{},{},
								{
									text: [
										{
											text: listaCartoes,
										},
										{
											text: vlrPrestacoesFinanceira && descriFinanceira.length > 40 ? descriFinanceira : ''
										},
										{
											text: (foraDeLinha && !isDevolucao ? '\nPRODUTO DE SHOWROOM APROVADO PELO CLIENTE': '')
										},
										{
											text: isDevolucao ? ('\nPEDIDO DE VENDA: ' + model['MOVIMENTOS_NUMEROORIGEM'] + ' DE ' + moment(diaOrigem).format('DD/MM/YYYY')) :
												   caixa['MOVIMENTOSCAIXA_CREDITOPESSOA'] > 0 ? '\nCRÉDITO POR DEVOLUÇÃO UTILIZADO: ' + utils.number.float2moeda(caixa['MOVIMENTOSCAIXA_CREDITOPESSOA']) : '',
											bold: true
										}
									],
									colSpan: 7,
									alignment: 'left',
									border: [true, false, true, false]
								},{},{},{},{},{},{}

							]
						)

						rows.push(
							[
								{
									text: '__________________________________________________\nAssinatura',
									colSpan: 7,
									alignment: 'center',
									border: [true, false, true, true],								
									style: { fontSize: 10 }

								},{},{},{},{},{},{},
								{
									text: '',
									colSpan: 7,
									alignment: 'left',
									border: [true, false, true, true]
								},{},{},{},{},{},{}

							]
						)

						rows.push(
							[
								{
									text: [
										{
											text: 'Impresso por: '
										},
										{
											text: impLog,
											style: { fontSize: 8, bold: true }
										}
									],
									colSpan: 10,
									alignment: 'left',
									border: [false, false, false, false],
								},{},{},{},{},{},{},{},{},{},{
									text: (vias == 0 ? 'Via Empresa' : 'Via Cliente'),
									colSpan: 4,
									alignment: 'right',
									border: [false, true, false, false]
								},{},{},{}

							]
						)

						if(isDevolucao) {
							rows.push(
								[
									{
										text: '\n\n',
										colSpan: 14,
										alignment: 'left',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							)
						} else {
							rows.push(
								[
									{
										text: [
											{text: 'Entrega dos produtos em: '	},
											{text: dataEntrega.isSameOrBefore('1900-01-01') ? '' : dataEntrega.format('DD/MM/YYYY'), style: {fontSize: 8, bold: true}},
											{text: (turnoEntrega == 'M' ? '  ( X )' : '  (   )'), style: {bold: true}},
											{text: ' I - Turno da manhã'},
											{text: 'a'.repeat(19),style: {color: 'white'}},										
											{text: (turnoEntrega == 'T' ? '( X )' : '(   )'), style: {bold: true}},
											{text: ' II - Turno da tarde'},
											{text: 'a'.repeat(18),style: {color: 'white'}},										
											{text: (turnoEntrega == 'N' ? '( X )' : '(   )'), style: {bold: true}},
											{text: ' III - Turno da Noite\n'},
											{text: 'a'.repeat(20),style: {color: 'white'}},
											{text: ' compreende o periodo entre 7h e 11h          '},
											{text: ' compreende o periodo entre 12h e 18h         '},
											{text: ' compreende o periodo entre 19h e 23h\n'},
											{text: 'de acordo com a Lei Estadual 14.951 de 06 de Fevereiro de 2013.', alignment: 'right', style: {bold: true}}
										],
										colSpan: 14,
										alignment: 'left',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							)	
						}

						if(vias == 0) {
							if(produtos.length > 4) {
								rows.push(
									[
										{ 
											text: '',
											pageBreak: 'after',
											colSpan: 14,
											style: {fontSize: 1, color: 'white'},
											border: [false, false, false, false]
										},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]
								);
							} else {
								rows.push(
									[
										{ 
											text: '- '.repeat(64) + '\n',
											colSpan: 14,
											style: {fontSize: 16},
											border: [false, false, false, false]
										},{},{},{},{},{},{},{},{},{},{},{},{},{}
		
									]
								);
							}
						}
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const formaPagamento = function(model) {
	let formas = '';
	let caixa  = model['MOVIMENTOS_CAIXA'] || [];
	let isDevolucao = model['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012';
	
	if(isDevolucao) {
       if(model['MOVIMENTOS_SITUACAO'] == 0) { formas = 'ABATIMENTO PARCELAS CARNÊ '; } else
	   if(model['MOVIMENTOS_SITUACAO'] == 1) { formas = 'CRÉDITO CLIENTE '; } else
	   if(model['MOVIMENTOS_SITUACAO'] == 2) { formas = 'SANGRIA CAIXA '; }
	} else {
		if(caixa) {
			for (let i in caixa) {
				if(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO']||[] > 0) {
					formas += 'DINHEIRO/';
				}		
				if(caixa[i]['MOVIMENTOSCAIXA_TRANSFERENCIAS']||[] > 0) {
					formas += 'TRANSFERÊNCIA/PIX/';
				}		
				if(caixa[i]['MOVIMENTOSCAIXA_CHEQUE'] > 0) {
					formas += 'CHEQUE/';
				}
				if((caixa[i]['MOVIMENTOSCAIXA_CREDITO'] + caixa[i]['MOVIMENTOSCAIXA_DEBITO']) > 0) {
					formas += 'CARTAO/';
				}
				if(caixa[i]['MOVIMENTOSCAIXA_OUTRO'] > 0) {
					formas += 'FINANCEIRA/';
				}
			}	
		} else {
			formas = ' ';
		}	
	}

	return formas.substr(0, (formas.length - 1));
};

const contaPrestacoes = function(model, tipoPagto) {
	let prestacoes = 0;
	let caixa      = model['MOVIMENTOS_CAIXA'][0] || [];	
	let titulos    = model['MOVIMENTOS_FINANCEIROS'];
	let cheques    = model['MOVIMENTOS_CHEQUES'];
	let cartoes    = model['MOVIMENTOS_CARTOES'];
	
    if(tipoPagto === 'CAR') {
		if(cartoes) {
			for (let i in cartoes) {
				if(cartoes[i]['CARTOES_VALOR'] > 0 && cartoes[i]['CARTOES_TIPO'] == 'C') {
					if(cartoes[i]['CARTOES_PARCELAS'] > prestacoes) {
						prestacoes = cartoes[i]['CARTOES_PARCELAS'];
					}					  
				}		
			}	
		}	
	}

	if(tipoPagto === 'DUP' && caixa['MOVIMENTOSCAIXA_DUPLICATA'] > 0) {
		if(titulos.length > 0){
			if(titulos[0]['FINANCEIROS_ORIGINAL'] > 0) {
				prestacoes = titulos[0]['FINANCEIROS_PARCELAS'];
			}		
		}	
	}

    if(tipoPagto === 'CHE') {
		if(cheques) {
			for (let i in cheques) {
				if(cheques[i]['CHEQUES_VALOR'] > 0) {
					prestacoes++;
				}		
			}	
		}	
	}

	return prestacoes;
};

const valorPrestacoes = function(model, tipoPagto) {
	let valores = 0;
	let caixa   = model['MOVIMENTOS_CAIXA'][0] || [];		
	let titulos = model['MOVIMENTOS_FINANCEIROS'];
	let cheques = model['MOVIMENTOS_CHEQUES'];
	let cartoes = model['MOVIMENTOS_CARTOES'];

    if(tipoPagto === 'CAR') {
		if(cartoes){
			for (let i in cartoes) {
				if(cartoes[i]['CARTOES_VALOR'] > 0 && cartoes[i]['CARTOES_TIPO'] == 'C') {
					valores += (cartoes[i]['CARTOES_VALOR'] / cartoes[i]['CARTOES_PARCELAS']);
				}		
			}	
		}	
	}	

	if(tipoPagto === 'DUP' && caixa['MOVIMENTOSCAIXA_DUPLICATA'] > 0) {
		if(titulos.length > 0){
			if(titulos[0]['FINANCEIROS_ORIGINAL'] > 0) {
				valores = (titulos[0]['FINANCEIROS_TOTAL'] / titulos[0]['FINANCEIROS_PARCELAS']);
			}
		}	
	}

    if(tipoPagto === 'CHE') {
		if(cheques){
			for (let i in cheques) {
				if(cheques[i]['CHEQUES_VALOR'] > 0) {
					valores = cheques[i]['CHEQUES_VALOR'];
				}		
			}	
		}	
	}	
	
	return utils.number.float2moeda(valores);
};

const venctoPrimeira = function(model) {
	let vencto          = '';
	let venctoFormatado = '';
	let caixa           = model['MOVIMENTOS_CAIXA'][0];
	let titulos         = model['MOVIMENTOS_FINANCEIROS'];
	let cheques         = model['MOVIMENTOS_CHEQUES'];
	let cartoes         = model['MOVIMENTOS_CARTOES'];

	if(titulos.length > 0){
		if(titulos[0]['FINANCEIROS_ORIGINAL'] > 0) {
			vencto = titulos[0]['FINANCEIROS_VENCIMENTO'];
		}			
	}

	if(caixa && cheques.length > 0) {
		if(caixa['MOVIMENTOSCAIXA_CHEQUE'] > 0 && cheques[0]['CHEQUES_VALOR'] > 0) {
			vencto = cheques[0]['CHEQUES_VENCIMENTO'];
		}
	}

	if(cartoes.length > 0){
		for (let i in cartoes) {
			if(cartoes[i]['CARTOES_VALOR'] > 0) {
				vencto = 'NA FATURA'
			}		
		}	
	}

	if(vencto == 'NA FATURA') {
		venctoFormatado = vencto;
	} else {
		if(vencto) {
			venctoFormatado = moment(vencto).format('DD/MM/YYYY'); 
		}
	}
	
	return venctoFormatado;
};

const alistarCartoes = function(cartoes) {

    let cartoesFormatado = '';

	if(cartoes.length > 0){
		for (let i in cartoes) {
			cartoesFormatado += `${cartoes[i]['OPERADORAS_NOME']} Aut: ${cartoes[i]['CARTOES_AUTORIZACAO']} Parc: ${cartoes[i]['CARTOES_PARCELAS']}x ${utils.number.float2moeda(cartoes[i]['CARTOES_VALOR']/cartoes[i]['CARTOES_PARCELAS'])}\n`
		}	       
	}

	return cartoesFormatado;
};

const atualizarDadosPessoa = function(movimento, nome, celular, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `update MOVIMENTOS set MOVIMENTOS_NOME = '${nome}',
		                                 MOVIMENTOS_CELULAR = '${celular}'
				   where MOVIMENTOS_ID = ${movimento}`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const pesquisarDataOrigem = function(empresa, numero, serie, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `select MOVIMENTOS_EMISSAO as EMISSAO_ORIGEM from MOVIMENTOS
				   where MOVIMENTOS_ID_EMPRESAS = ${empresa} and 
				         MOVIMENTOS_NUMERO = ${numero} and
						 MOVIMENTOS_SERIE = '${serie}'`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0]['EMISSAO_ORIGEM']);
            }
        });
    });
};