'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-business-days');

moment.updateLocale('pt-br', {
	holidays: ['01-01', '21-04', '01-05', '07-09', '12-10', '02-11', '25-12'],  // Feriados fixos
	holidayFormat: 'DD-MM'
});

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
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
					let model = res.results[0];

					if(model['EMPRESAS_CPFCNPJ'].match(/50203915/)) { // Limpa o bairro na Movelar
						model['EMPRESAS_BAIRRO'] = '';
					}

					let semLogo = true;//model['EMPRESAS_CPFCNPJ'].match(/38167820|50203915/);

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);

					let caixa       = model['MOVIMENTOS_CAIXA'][0]       || {};
					let financeiros = model['MOVIMENTOS_FINANCEIROS'][0] || {};
					let cartoes = (model['MOVIMENTOS_CARTOES'] || []).filter(cartao => cartao['CARTOES_TIPO'] == 'C');
					let listaCartoes = alistarCartoes(cartoes);

					let obsPedido = model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ');
					let vlrEntrada = caixa['MOVIMENTOSCAIXA_DINHEIRO'] + caixa['MOVIMENTOSCAIXA_DEBITO'] + caixa['MOVIMENTOSCAIXA_ALIMENTACAO'];
                    let condPagto = formaPagamento(model);
					let qtdPrestacoesCheque = contaPrestacoes(model, 'CHE');
					let qtdPrestacoesDuplicata = contaPrestacoes(model, 'DUP');
					let qtdPrestacoesFinanceira = contaPrestacoes(model, 'FIN');

					let vlrPrestacoesCheque = valorPrestacoes(model, 'CHE');
					let vlrPrestacoesDuplicata = valorPrestacoes(model, 'DUP');
					let vlrPrestacoesFinanceira = valorPrestacoes(model, 'FIN');
					
					let vctPrimeira = venctoPrimeira(model);
					let nomeFinanceira = (caixa['MOVIMENTOSCAIXA_OUTRO'] > 0 ? financeiros['PESSOAS_NOME'] : '');

					let cepCidadeEmpresa = model['MOVIMENTOS_ID_EMPRESAS'] == 6 ? 
					    `${model['CIDADES_NOMEEMPRESA']} ${model['CIDADES_ESTADOEMPRESA']}\n` :
					    `${model['EMPRESAS_CEP'].substr(0, 5)}-${model['EMPRESAS_CEP'].substr(5, 3)} ${model['CIDADES_NOMEEMPRESA']} ${model['CIDADES_ESTADOEMPRESA']}\n`;

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];

					const dataEntrega   = moment(model['MOVIMENTOS_EMISSAO']).businessAdd(30); // Fixo 30 dias úteis após emissão
					const turnoEntrega  = 'N'; // Fixo turno noite.

					let rows            = docDefinition.content[0].table.body;
					let vias;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					for (vias = 0; vias < 2; vias++) {

						let linhas;
						let itensPagina     = 0;

						//*** com ou sem logo

						rows.push(
							semLogo ? 
							[
								{
									colSpan: 4,
									text: [
										{
											text: model['EMPRESAS_NOME'] + '\n',
											alignment: 'center',
											style: {bold: true,	fontSize: 8}
										},
										{
											text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} ${model['EMPRESAS_BAIRRO']}` + '\n',
											alignment: 'center',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: cepCidadeEmpresa, 
											alignment: 'center',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: `CNPJ: ${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}\nI.E.: ${model['EMPRESAS_INSCRICAO']}`,
											alignment: 'center',
											style: {bold: true,	fontSize: 7}
										},
									],
									border: [true, true, true, true]
								},{},{},{},
								{
									colSpan: 8,
									text: [
										{
											text: ` \n`,
											style: {fontSize: 12}
										},
										{
											text: `COMPROVANTE DE ENTREGA DOS PRODUTOS`,
											alignment: 'center',
											style: {bold: true,	fontSize: 13}
										},
										{
											text: model['EMPRESAS_TELEFONE'].length > 0 ? ('\nTelefone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE'])) : '',
											alignment: 'center',
											style: {bold: true,	fontSize: 10}											
										}
									]
								},
								{},{},{},{},{},{},{},
								{ 
									colSpan: 2,									
									text: [
										{
											text: `${siglaFilial}\n`,
											alignment: 'center',											
											style: {
												bold: true,
												fontSize: 13
											}
										},
										{
											text: `${model['MOVIMENTOS_NUMERO']}\n`,
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 15
											}
										},
										{
											text: `${emiPedido}`,
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 8
											}										
										}									
									]
								},{}
							]:[  // Com logo
								{
									image: pathLogo,
									fit: [100, 100],
									margin: [0, 10, 0, 0],																		
									colSpan: 2,
									width: 95,
									alignment: 'center',
									border: [true, true, false, true]
								},{},
								{
									colSpan: 3,
									text: [
										{
											text: model['EMPRESAS_NOME'] + '\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 8}
										},
										{
											text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} ${model['EMPRESAS_BAIRRO']}` + '\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: cepCidadeEmpresa, 
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: `CNPJ: ${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}\nI.E.: ${model['EMPRESAS_INSCRICAO']}`,
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
									],
									border: [false, true, true, true]
								},{},{},
								{
									colSpan: 7,
									text: [
										{
											text: ` \n`,
											style: {fontSize: 4}
										},
										{
											text: `ORÇAMENTO\n`,
											alignment: 'center',
											style: {bold: true,	fontSize: 14}
										},
										{
											text: ` \n`,
											style: {fontSize: 4}
										},
										{
											text: model['EMPRESAS_TELEFONE'].length > 0 ? ('Telefone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE'])) : '',
											alignment: 'center',
											style: {bold: true,	fontSize: 10}											
										}
									]
								},
								{},{},{},{},{},{},
								{ 
									colSpan: 2,									
									text: [
										{
											text: `${siglaFilial}\n`,
											alignment: 'center',											
											style: {
												bold: true,
												fontSize: 13
											}
										},
										{
											text: `${model['MOVIMENTOS_NUMERO']}\n`,
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 15
											}
										},
										{
											text: `${emiPedido}`,
											alignment: 'center',
											style: {
												bold: true,
												fontSize: 8
											}										
										}									
									]
								},{}
							],
						//*** fim do com ou sem logo */ 
							[
								{
									text: 'Nome'
								},
								{
									text: '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ' + model['MOVIMENTOS_NOME'],
									colSpan: 9
								},{},{},{},{},{},{},{},{},
								{
									text: 'Cel',
									alignment: 'right'
								},
								{
									text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
									colSpan: 3
								},
								{},{}
							], // 14 ok
							[
								{
									text: 'Endereço'
								},
								{
									text: model['PESSOAS_ENDERECO'],
									colSpan: 7
								},{},{},{},{},{},{},{
									text: 'Número',
									alignment: 'right',
									style: {
										fontSize: 7.5
									}										
								},{
									text: model['PESSOAS_NUMERO'],
									alignment: 'right'
								},
								{
									text: 'Tel',
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
									text: model['PESSOAS_BAIRRO'],
									colSpan: 6
								},{},{},{},{},{},	
								{
									text: 'Cep',
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
									text: model['CIDADES_NOME'] + '/' + model['CIDADES_ESTADO'],
									colSpan: 6
								},{},{},{},{},{},	
								{
									text: model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'CPF' : 'CNPJ',
									alignment: 'right'
								}, 
								{
									text: utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ']),
									fontSize: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 8 : 7),
									colSpan: 2
								},{},
								{
									text: '',//(vias == 0 ? 'PA' : ''),
									alignment: 'right'
								},{
									text: '',//(vias == 0 ? utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']) : ''),
									alignment: 'right',								
									colSpan: 3
								},{},{}
							],
							[
								{ 
									text: 'Obs'
								},{
									text: obsPedido,
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
							let qtdeProduto  = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
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
										text: produtos[i]['PRODUTOS_APLICACAO'],
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
						}  // end for

						for (linhas = itensPagina; linhas < 4; linhas++) {  // Aqui completamos o tamanho com linhas em branco						
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
									text:  (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : 'Vendedor'),
									style: {
										fontSize: 7
									}																			
								},
								{
									text: (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : `(${model['MOVIMENTOS_ID_USUARIOS']}) ${(model['USUARIOS_NOME'] || '').substr(0, 23)}`),
									colSpan: 3,
								},{},{},
								{
									text: 'Entrada:',
									alignment: 'left',
									border: [true, true, false, true]
								},
								{
									text: utils.number.float2moeda(vlrEntrada),
									alignment: 'left',
									bold: true,
									border: [false, true, true, true],
									colSpan: 2
								},{},
								{
									text: cartoes && cartoes.length == 1 ? `Cartão: ${cartoes[0]['CARTOES_PARCELAS']}x ${utils.number.float2moeda(cartoes[0]['CARTOES_VALOR']/cartoes[0]['CARTOES_PARCELAS'])}` : 
										  qtdPrestacoesCheque    ? `Cheque: ${qtdPrestacoesCheque}x ${vlrPrestacoesCheque}` :
										  qtdPrestacoesDuplicata ? `Carnê: ${qtdPrestacoesDuplicata}x ${vlrPrestacoesDuplicata}` :	'',
									alignment: 'left',
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
									text: (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : 'Gerente'),
									style: {
										fontSize: 7
									}																			
								},
								{
									text: (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : 'RICARDO KITAMURA'),
									colSpan: 3,
								},{},{},
								{
									text: 'Vcto 1a:',
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
									text: `Financeira: ${nomeFinanceira}` + (qtdPrestacoesFinanceira ? ` (${qtdPrestacoesFinanceira}x R$ ${vlrPrestacoesFinanceira})` : ''),
									alignment: 'left',
									colSpan: 7
								},{},{},{},{},{},{}
							]
						)

						rows.push(
							[
								{
									text: (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : 'Situação'),
									style: {
										fontSize: 7
									}																			
								},
								{
									text: (model['MOVIMENTOS_ID_EMPRESAS'] != 1 ? '' : 'APROVADO'),
									colSpan: 3,
								},{},{},
								{
									text: 'Condição:',
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
									text: 'PRODUTOS COM GARANTIA DE 90 DIAS APÓS A DATA DA COMPRA - LEI FEDERAL Nº 8.078, DE 11 DE SETEMBRO DE 1990\n' +
									      'OS PRODUTOS SÃO ENTREGUES OU RETIRADOS PELO CLIENTE, SEMPRE DESMONTADOS, A LOJA NÃO REALIZA O SERVIÇO DE MONTAGEM OU INSTALAÇÃO. ' +
										  'ESTE PEDIDO ESTÁ SUJEITO A DISPONIBILIDADE DOS PRODUTOS EM ESTOQUE.',
									colSpan: 14,
									alignment: 'center',
									border: [true, true, true, true],
									style: { fontSize: 9 }
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						)

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
										{text: (vias == 0 ? 'Via Empresa' : 'Via Cliente')},
										{text: 'a'.repeat(60),style: {color: 'white'}},
										{text: 'de acordo com a Lei Estadual 14.951 de 06 de Fevereiro de 2013.', alignment: 'right', style: {bold: true}}
									],
									colSpan: 14,
									alignment: 'left',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							// INSERINDO CAMPO PRA ASSINATURA AQUI
								[
									{
										text: `COMPROVANTE DE ENTREGA - RECEBEMOS DE ${model['EMPRESAS_NOME']}, OS PRODUTOS CONSTANTES DO PEDIDO ACIMA, EM PERFEITAS CONDIÇÕES:`,
										style: {fontSize: 7}, 
										border: [true, true, true, false],								
										colSpan: 14
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										text: 'DATA DE RECEBIMENTO\n\n',
										style: {fontSize: 6},								
										colSpan: 4,
										border: [true, true, true, false]
									},{},{},{},
									{   text: 'NOME COMPLETO DO RECEBEDOR E NÚMERO DO DOCUMENTO\n\n',
										style: {fontSize: 6},
										colSpan: 10,
										border: [true, true, true, false],
									},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										text: [
											{ text: 'AAAA', color: 'white' },
											{ text: '/' },
											{ text: 'AAAA', color: 'white' },											
											{ text: '/' },
										],
										style: {fontSize: 18},								
										colSpan: 4,
										border: [true, false, true, true]
									},{},{},{},
									{   text: '',
										style: {fontSize: 6},
										colSpan: 10,
										border: [true, false, true, true],
									},{},{},{},{},{},{},{},{},{}
								]
						)

						if(vias == 0) {  // Divisão entre vias
							rows.push(
								[
									{ 
										text: '- '.repeat(65),
										colSpan: 14,
										style: {
											fontSize: 16
										},
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
	
								]
							);
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
	
	if(caixa.length > 0) {
		for (let i in caixa) {
			if(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO'] > 0) {
				formas += 'DINHEIRO/';
			}		
			if(caixa[i]['MOVIMENTOSCAIXA_ALIMENTACAO'] > 0) {
				formas += 'TRANSFERENCIA BANCARIA/';
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

	return formas.substr(0, (formas.length - 1));
};

const contaPrestacoes = function(model, tipoPagto) {

	let prestacoes = 0;
	let caixa      = model['MOVIMENTOS_CAIXA'][0] || {};	
	let titulos    = model['MOVIMENTOS_FINANCEIROS'];
	let cheques    = model['MOVIMENTOS_CHEQUES'];
	
	if(tipoPagto === 'FIN' && caixa['MOVIMENTOSCAIXA_OUTRO'] > 0) {
		if(titulos.length > 0){
			if(titulos[0]['FINANCEIROS_ORIGINAL'] > 0) {
				prestacoes = titulos[0]['FINANCEIROS_PARCELAS'];
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
	let caixa   = model['MOVIMENTOS_CAIXA'][0] || {};		
	let titulos = model['MOVIMENTOS_FINANCEIROS'];
	let cheques = model['MOVIMENTOS_CHEQUES'];

	if(tipoPagto === 'FIN' && caixa['MOVIMENTOSCAIXA_OUTRO'] > 0) {
		if(titulos.length > 0){
			if(titulos[0]['FINANCEIROS_ORIGINAL'] > 0) {
				valores = (titulos[0]['FINANCEIROS_TOTAL'] / titulos[0]['FINANCEIROS_PARCELAS']);
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

	if(cartoes.length > 1){
		for (let i in cartoes) {
			cartoesFormatado += `${cartoes[i]['OPERADORAS_NOME']} - ${cartoes[i]['CARTOES_PARCELAS']}x ${utils.number.float2moeda(cartoes[i]['CARTOES_VALOR']/cartoes[i]['CARTOES_PARCELAS'])}\n`
		}	       
	}

	return cartoesFormatado;
};
