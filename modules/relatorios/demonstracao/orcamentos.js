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
								table: {   
									//        1  1b   2   3   4   5   6   7   8   9  10  11  12  
									widths: [36, 43, 19, 55, 39, 35, 35, 35, 35, 20, 30, 20, 30], // TOTAL: 414
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

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let obsPedido       = model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let itensPagina     = 0;
					let vctsPedido      = carregarPagamentos(model);
					let rows            = docDefinition.content[0].table.body;

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
								colSpan: 5,
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
							{},{},{},{},
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
								text: 'Nome'  // Fontsize padrão - 10
							},
							{
								text: model['MOVIMENTOS_NOME'] + '(' + model['MOVIMENTOS_ID_PESSOAS'] + ')',
								colSpan: 6
							}, 
							{},
							{},
							{},
							{},
							{},
							{
								text: pessoaCnpj.length == 11 ? 'CPF' : 'CNPJ'
							}, 
							{
								text: utils.string.maskCnp(pessoaCnpj),
								fontSize: (pessoaCnpj.length == 11 ? 8 : 7),
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
							},
							{},							
							{}, 
							{}, 
							{},
							{
								text: impLog,
								colSpan: 4
							}, 
							{},
							{}, 							
							{},							
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
							}, 
							{}, 
							{},
							{},
							{},	
							{
								text: 'Cidade'
							}, 
							{
								text: pessoaMun + '/' + pessoaUf,
								colSpan: 6
							}, 
							{},													 							
							{},
							{},
							{},
							{}
						],
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 1
								},
								colSpan: 13,									
								border: [false, false, false, false]
							}, 
							{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
						],
						[
							{
								width: 30,
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 5
							}, 
							{}, {}, {}, {},
							{
								text: 'Qtde',
								alignment: 'center',
								fontSize: 7								
							},
							{
								colSpan: 2,								
								text: 'A Vista',
								alignment: 'center'								
							},{},
							{
								colSpan: 2,
								text: 'A Prazo',
								alignment: 'center'								
							},{},
							{
								colSpan: 2,
								text: 'Total',
								alignment: 'center'								
							}, {}
						]
					);

					for(let i in produtos){

						let qtdeProduto     = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0))
						let prcComDesconto  = ((produtos[i]['MOVIMENTOSITENS_TOTAL'] - produtos[i]['MOVIMENTOSITENS_DESCONTOS']) / produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])

						rows.push(
							[
								{							
									text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'center',
									style: {
										bold: true,
										fontSize: 8
									}											
								},
								{
									text: produtos[i]['PRODUTOS_NOME'],
									colSpan: 5,
									style: {
										bold: true,
										fontSize: 8
									}
								}, {}, {}, {}, {},
								{
									text: qtdeProduto,
									alignment: 'right',
									style: {
										fontSize: 8
									},																			
								},
								{
									colSpan: 2,
									text: utils.number.float2moeda(prcComDesconto),
									alignment: 'right',
									style: {
										fontSize: 8
									},																			
								},{},																
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']),
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
							]
						)
						itensPagina++
						if(itensPagina > 12) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 13,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}
					}  // end for

					rows.push(
						[
							{
								text: obsPedido + '\n' + vctsPedido,
								colSpan: 9,
								rowSpan: 4,
								style: {
									bold: true,
									fontSize: 10
								},
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Produtos:',
								alignment: 'right',
								style: {
									fontSize: 10,
									bold: true
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']),
								alignment: 'right',
								style: {
									fontSize: 10
								},																			
							},{}
						]
					);

					rows.push(
						[
							{
								text: '',
								colSpan: 9,
								style: {
									bold: true,
									fontSize: 10
								},
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Despesas:',
								alignment: 'right',
								style: {
									fontSize: 10,
									bold: true
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
								alignment: 'right',
								style: {
									fontSize: 10
								},																			
							},{}
						]
					);
					
					rows.push(
						[
							{
								text: '',
								colSpan: 9,
								style: {
									bold: true,
									fontSize: 8
								},
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Descontos:',
								alignment: 'right',
								style: {
									fontSize: 10,
									bold: true
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
								alignment: 'right',
								style: {
									fontSize: 10
								},																			
							},{}
						]
					);

					rows.push(
						[
							{
								text: '',
								colSpan: 9,
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Total:',
								alignment: 'right',
								style: {
									fontSize: 10,
									bold: true
								}																		
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: {
									fontSize: 10,
									bold: true							
								}																			
							},{}
						]
					);
										
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const carregarPagamentos = function(model) {
	let formas      = '';
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
