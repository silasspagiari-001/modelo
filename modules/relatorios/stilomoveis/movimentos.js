'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

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

					let caixa       = model['MOVIMENTOS_CAIXA'][0]       || {};
					let financeiros = model['MOVIMENTOS_FINANCEIROS'][0] || {};
			
					let obsPedido = model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ');
					let vlrEntrada = caixa['MOVIMENTOSCAIXA_DINHEIRO'] + caixa['MOVIMENTOSCAIXA_DEBITO'];
                    let condPagto = formaPagamento(model);
					let qtdPrestacoesCartao = contaPrestacoes(model, 'CAR');
					let qtdPrestacoesCheque = contaPrestacoes(model, 'CHE');
					let qtdPrestacoesDuplicata = contaPrestacoes(model, 'DUP');
					let qtdPrestacoesFinanceira = contaPrestacoes(model, 'FIN');

					let vlrPrestacoesCartao = valorPrestacoes(model, 'CAR');
					let vlrPrestacoesCheque = valorPrestacoes(model, 'CHE');
					let vlrPrestacoesDuplicata = valorPrestacoes(model, 'DUP');
					let vlrPrestacoesFinanceira = valorPrestacoes(model, 'FIN');
					
					let vctPrimeira = venctoPrimeira(model);
					let nomeFinanceira = (caixa['MOVIMENTOSCAIXA_OUTRO'] > 0 ? financeiros['PESSOAS_NOME'] : '');

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;
					let vias;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					let linhas;
					let itensPagina = 0;

					rows.push(
						[
							{
								image: pathLogo,
								fit: [100, 100],									
								colSpan: 2,
								width: 80,
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
										text: 'RUA DOUTOR JOSE FOZ 636 CENTRO' + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: '19010-041 PRESIDENTE PRUDENTE SP' + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: 'CNPJ: 02.704.798/0001-88\nI.E.: 562.165.452.113',
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
										text: `a\n`,
										alignment: 'center',
										style: {color: 'white', fontSize: 8}
									},
									{
										text: `${model['DOCUMENTOS_NOME'].replace("ões", "ão")}\n`,
										alignment: 'center',
										style: {bold: true,	fontSize: 14}
									},
									{
										text: 'Telefone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE']),
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
										text: ''
									},
									{
										text: `Nº\n`,
										fontSize: 10, //16
										alignment: 'center'
									},
									{
										text: model['MOVIMENTOS_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 15 //10
										}
									},
									{
										text: `\n${emiPedido}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 8
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
								text: '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ' + model['MOVIMENTOS_NOME'],
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
						], // 14 ok
						[
							{
								text: 'Endereço'
							},
							{
								text: model['PESSOAS_ENDERECO'],
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
								text: model['PESSOAS_BAIRRO'],
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
								text: model['CIDADES_NOME'] + '/' + model['CIDADES_ESTADO'],
								colSpan: 6
							},{},{},{},{},{},	
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
					}  // end for

					for (linhas = itensPagina; linhas < 30; linhas++) {  // antes era 5... Aqui completamos o tamanho com linhas em branco						
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
								text: `(${model['MOVIMENTOS_ID_USUARIOS']}) ${(model['USUARIOS_NOME'] || '').substr(0, 23)}`,
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
								text: qtdPrestacoesCartao    ? `Cartão: ${qtdPrestacoesCartao}x ${vlrPrestacoesCartao}` : 
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
								text: 'Gerente',
								style: {
									fontSize: 7
								}																			
							},
							{
								text: 'RICARDO KITAMURA',
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
								text: 'Situação',
								style: {
									fontSize: 7
								}																			
							},
							{
								text: 'APROVADO',
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
								text: '\n' + 
									  '\n',
								colSpan: 7,
								alignment: 'center',
								border: [true, true, true, false],
								style: {
									fontSize: 10,
									italics: true,
									decoration: 'underline'
								}																			

							},{},{},{},{},{},{},
							{
								text: '', 
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, false]
							},{},{},{},{},{},{}

						]
					)

					rows.push(
						[
							{
								text: '__________________________________________________',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, false],								
								style: {
									fontSize: 10,
									italics: true
								}																			

							},{},{},{},{},{},{},
							{
								text: '',
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, false]								
							},{},{},{},{},{},{}

						]
					)

					rows.push(
						[
							{
								text: 'Assinatura',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, true],								
								style: {
									fontSize: 10,
									italics: true
								}																			

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
										style: {
											fontSize: 8,
											bold: true
										}																			
		
									}
								],
								colSpan: 10,
								alignment: 'left',
								border: [false, false, false, false],
							},{},{},{},{},{},{},{},{},{},{
								text: '',
								colSpan: 4,
								alignment: 'right',
								border: [false, true, false, false]
							},{},{},{}

						]
					)

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
