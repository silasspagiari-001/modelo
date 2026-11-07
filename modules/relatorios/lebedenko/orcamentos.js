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

					let obsPedido = (model['PESSOAS_PAGINA'] ? model['PESSOAS_PAGINA'] : '') + ' ' + (model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ') : '');

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					
					let pathFone  = `${appRoot}/resources/images/headers/telefone.png`
					let pathWhats = `${appRoot}/resources/images/headers/whatsapp.png`
					

					let linhas;
					let itensPagina     = 0;
                    let condPagto = formaPagamento(model);					

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
								colSpan: 3,
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
							},{},{},
							{
								colSpan: 7,
								table: {
									body: [
										[
											{
												text: 'Texto',
												color: 'white'
											},
											{
												text: `ORÇAMENTO`,
												alignment: 'center',
												style: {bold: true,	fontSize: 12},
											},
											{}
										],
										[ 
											{
												text: 'Texto',
												color: 'white'
											},
											{
												table: {
													body: [
														[	
															{
																image: pathFone,
																width: 13,  //10 all
																height: 13	
															},
															{
																text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
																style: {fontSize: 9, bold: true}
															},																
															{
																image: pathWhats,
																width: 13,
																height: 13	
															},
															{
																text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
																style: {fontSize: 9, bold: true}																	
															}																
														]
													]														
												},
												layout: 'noBorders'													
											},
											{ 
												text: ''
											}
										]
									]
								},
								layout: 'noBorders'
							},
							{},{},{},{},{},{},
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
								text: model['MOVIMENTOS_NOME'] + (model['PESSOAS_FANTASIA'].length > 0 ? ` (${model['PESSOAS_FANTASIA'].toUpperCase()})` : ''),
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
								text: ''
							},{
								text: '',
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
						let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
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

					for (linhas = itensPagina; linhas < 8; linhas++) {
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
								text: `${(model['USUARIOS_NOME'].split(' ')[0])}`,
								colSpan: 3,
							},{},{},{
								text: `Forma Pagamento: ${condPagto}`,
								colSpan: 6,
							},{},{},{},{},{},
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
								colSpan: 13,
							},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					)

					rows.push(
						[
							{
								text: 'CONDIÇÃO DE PAGAMENTO À VISTA\n' + 
									  'EFETIVAÇÃO DA VENDA MEDIANTE DISPONIBILIDADE DE ESTOQUE\n' +
									  'VALIDADE DO ORÇAMENTO 10 DIAS',
								colSpan: 7,
								alignment: 'center',
								border: [true, true, true, false],
								style: {
									fontSize: 8,
									bold: true
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
								text: 'a',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, false],								
								style: {fontSize: 10, color: 'white'}

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
								text: '',
								border: [true, false, false, true],
							},
							{
								text: 'Assinatura',
								colSpan: 5,
								alignment: 'center',
								border: [false, true, false, true],
								style: { fontSize: 10 }																			

							},{},{},{},{},
							{
								text: '',
								border: [false, false, true, true]
							},
							{
								text: '',
								border: [true, false, false, true]
							},
							{
								text: model['EMPRESAS_FANTASIA'],
								colSpan: 5,
								alignment: 'center',
								border: [false, true, false, true],
								style: { fontSize: 10 }
							},{},{},{},{},
							{
								text: '',
								border: [false, false, true, true]
							}

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
	let formas     = '';
	let formaPagamento = model['MOVIMENTOS_FORMASPAGAMENTO'] || [];
	
	if(formaPagamento) {
		for (let i in formaPagamento) {
			if(formaPagamento[i]['MOVIMENTOSFORMAS_DINHEIRO'] > 0) {
				formas += `DINHEIRO: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_DINHEIRO'])}/`;
			}		
			if(formaPagamento[i]['MOVIMENTOSFORMAS_CHEQUE'] > 0) {
				formas += `CHEQUE: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_CHEQUE'])}/`;
			}
			if(formaPagamento[i]['MOVIMENTOSFORMAS_CHEQUEPRE'] > 0) {
				formas += `CHEQUE-PRE: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_CHEQUEPRE'])}/`;
			}
			if((formaPagamento[i]['MOVIMENTOSFORMAS_CREDITO'] + formaPagamento[i]['MOVIMENTOSFORMAS_DEBITO']) > 0) {
				formas += `CARTAO: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_CREDITO'] + formaPagamento[i]['MOVIMENTOSFORMAS_DEBITO'])}/`;
			}
			if(formaPagamento[i]['MOVIMENTOSFORMAS_DUPLICATA'] > 0) {
				formas += `CARNÊ: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_DUPLICATA'])}/`;
			}
			if(formaPagamento[i]['MOVIMENTOSFORMAS_FINANCEIRA'] > 0) {
				formas += `FINANCEIRA: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_FINANCEIRA'])}/`;
			}
			if(formaPagamento[i]['MOVIMENTOSFORMAS_TRANSFERENCIAS'] > 0) {
				formas += `TRANSFERENCIA: ${utils.number.float2moeda(formaPagamento[i]['MOVIMENTOSFORMAS_TRANSFERENCIA'])}/`;
			}
		}	
	} else {
		formas = ' ';
	}

	return formas.substr(0, (formas.length - 1));
};