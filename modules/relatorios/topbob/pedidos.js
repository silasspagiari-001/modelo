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
						pageSize: 'A4',
						pageOrientation: 'portrait',
						pageMargins: [20, 20, 20, 35],
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
								table: { // Cod   [Descricao      ] UNI QTD KGS  PRB [PRN ]  [TOT ]
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
//									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // (anterior)
									widths: [34, 43, 19, 55, 34, 29, 19, 29, 34, 38, 20, 18, 27, 29], // TOTAL: 414
//									heights: 5,
//									dontBreakRows: true,
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
				
					const titDocumento = params.titledocumento;
					let model = res.results[0];
					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;
					let vias;
					let maxLinhas;
					let impressos;
					let pathLogo;					
					let nomePessoa = (model['PESSOAS_FANTASIA'] || '').trim().length > 0 ? model['PESSOAS_FANTASIA'] : model['MOVIMENTOS_NOME'];
					let vctsPedido  = carregarPagamentos(model);

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/default.png`;
					}

					if((produtos || []).length > 15) {
						maxLinhas = 36;
						vias = 1;
					} else {
						maxLinhas = 11;
						vias = 2;
					}

					for (impressos = 0; impressos < vias; impressos++) {

						let linhas      = 0;
						let itensPagina = 0;
	
						for(let i in produtos){

							if(linhas == 0) {
								rows.push([
									{
										text: 'A',
										color: 'white',
										fontSize: 2,
										colSpan: 14,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								])
								rows.push(
									[
										{
											image: pathLogo,
											colSpan: 2,
											fit: [95, 90],									
											alignment: 'center',
											border: [true, true, false, true]
										},{},
										{
											colSpan: 8,
											text: [
												{
													text: `${titDocumento.toUpperCase()}\n`,
													alignment: 'center',
													style: {bold: true,	fontSize: 14}
												},
												{
													text: model['EMPRESAS_NOME'] + '\n',
													alignment: 'left',
													style: {fontSize: 10}
												},
												{
													text: model['EMPRESAS_ENDERECO'] + ' ' + model['EMPRESAS_NUMERO'] + '\n',
													alignment: 'left',
													style: {fontSize: 10}
												},
												{
												text: `${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}    Fone: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}    CNPJ: ${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}`,
													alignment: 'left',
													style: {fontSize: 9}
												}
											],
											border: [false, true, true, true]
										},{},{},{},{},{},{},{},
										{ 
											colSpan: 4,									
											text: [
												{
													text: `A\n`,
													style: {color: 'white', fontSize: 6 }
												},
												{
													text: `Número:`,
													style: { bold: true, fontSize: 9 }										
												},
												{
													text: 'AAA',
													style: { color: 'white', fontSize: 10 }
												},
												{
													text: ('000000' + model['MOVIMENTOS_NUMERO'].toString()).slice(-6),
													alignment: 'right',
													style: { bold: true, fontSize: 14 }
												},
												{
													text: `\nA\n`,
													style: {color: 'white', fontSize: 7 }
												},
												{
													text: `Emissão:`,
													style: { bold: true, fontSize: 9 }										
												},
												{
													text: 'A',
													style: { color: 'white', fontSize: 9 }
												},
												{
													text: `${emiPedido}`,
													alignment: 'right',
													style: { bold: true, fontSize: 14 }										
												}
											]
										},{},{},{}
									],
									[
										{
											text: 'Nome'
										},
										{
											text: nomePessoa + ' (' + model['MOVIMENTOS_ID_PESSOAS'] + ')',
											style: {bold: true},
											colSpan: 7
										},{},{},{},{},{},{},
										{
											text: model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'CPF' : 'CNPJ'
										}, 
										{
											text: utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ']),
											fontSize: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 8 : 6),
											style: {bold: true},								
											colSpan: 2								
										},{}, 
										{
											text: 'Cel'
										},
										{
											text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
											style: {bold: true},								
											fontSize: 7,
											colSpan: 2
										},
										{}                            
									], // 14 ok
									[
										{
											text: 'Endereço'
										},
										{
											text: model['PESSOAS_ENDERECO'] + (model['PESSOAS_NUMERO'] ? ', ' + model['PESSOAS_NUMERO']: ''),
											style: {bold: true},								
											colSpan: 7
										},{},{},{},{},{},{},
										{
											text: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'RG' : 'I.E.')
										}, 
										{
											text: model['PESSOAS_INSCRICAO'],
											fontSize: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 8 : 7),								
											style: {bold: true},								
											colSpan: 2								
										},{},						
										{
											text: 'Tel'
										},
										{
											text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
											style: {bold: true},								
											colSpan: 2
										},
										{}                            
									],
									[
										{
											text: 'Bairro'
										},
										{
											text: model['PESSOAS_BAIRRO'].slice(0, 30),
											style: {bold: true},								
											colSpan: 3
										},{},{},	
										{
											text: 'Cidade'
										}, 
										{
											text: model['CIDADES_NOME'] + '/' + model['CIDADES_ESTADO'],
											style: {bold: true},								
											colSpan: 6
										},{},{},{},{},{},
										{
											text: 'CEP'
		
										},
										{
											text: utils.string.maskCep(model['PESSOAS_CEP']),
											style: {bold: true},								
											colSpan: 2
										},{}
									],
									[
										{
											text: 'Obs'
										},
										{
											text: model['MOVIMENTOS_OBSERVACOES'].split('|').join(' '),
											style: {bold: true},								
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
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{}
									]
								);
		
								rows.push([ // 14 cols
									{
										text: 'Código',
										alignment: 'center'
									},
									{
										text: 'Descrição do Produto',
										alignment: 'center',
										colSpan: 7
									},{},{},{},{},{},{},
									{
										text: 'Uni',
										alignment: 'center',
										fontSize: 6
									},						
									{	
										text: 'Qtde',
										alignment: 'center',
										fontSize: 6
									},
									{
										text: 'Unitário',
										alignment: 'center',
										fontSize: 6,
										colSpan: 2
									},{},
									{	
										text: 'Total',
										alignment: 'center',
										colSpan: 2,
										fontSize: 6
									},{}
								]);	
								itensPagina = 0;
							}
	
	
							let qtdeProduto  = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toString().replace('.',',');
	
							let precoUnitario = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
													utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
													produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))
	
							rows.push([
								{
									text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'center',
									style: {fontSize: 8, bold: true},
									border:[true, false, true, true]
								},
								{
									text: produtos[i]['PRODUTOS_NOME'],
									colSpan: 7,
									style: { fontSize: 8, bold: true },
									border:[false, false, true, true]
								},{},{},{},{},{},{},
								{
									text: produtos[i]['PRODUTOS_UNIDADE'],
									alignment: 'center',
									style: { fontSize: 8, bold: true },
									border:[false, false, true, true]
								},
								{					
									text: qtdeProduto,
									alignment: 'right',
									style: { fontSize: 8, bold: true },
									border:[false, false, true, true]
								},
								{
									colSpan: 2,								
									text: precoUnitario,
									alignment: 'right',
									style: { fontSize: 8, bold: true },
									border:[false, false, true, true]
								},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right',
									style: { fontSize: 8, bold: true },
									border:[false, false, true, true]
								},{}							
							]);
	
							linhas++;
							itensPagina++;
	
							if(linhas > maxLinhas) {
								rows.push([
									{
										text: 'A',
										color: 'white',
										colSpan: 14,
										fontSize: 2,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								])
								rows.push([
									{
										text: 'A',
										color: 'white',
										colSpan: 14,
										fontSize: 2,
										pageBreak: 'before',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								])
	
								linhas = 0; // Zera pra imprimir novamente o cabeçalho
							} 						 
						}
	
						for (linhas = itensPagina; linhas < (maxLinhas + 1); linhas++) { // Linhas em branco pra completar o tamanho da via
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
										style: { fontSize: 8, color: 'white' }
									},
									{
										text: 'A',
										style: { fontSize: 8, color: 'white' }										
									},
									{
										text: 'A',
										colSpan: 2,
										style: { fontSize: 8, color: 'white' }
									},{},
									{
										text: 'A',
										colSpan: 2,
										style: { fontSize: 8, color: 'white' }
									},{}
								]
							)
						}
	
						rows.push(
							[
								{
									text: `${vctsPedido}\nVendedor: ${model['USUARIOS_LOGIN']}` ,
									colSpan: 10,
									rowSpan: 3,
									style: { fontSize: 10 },
									border: [true, true, false, true]
								},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: 'Produtos:',
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
									style: { fontSize: 9, bold: true }
								},{}
							]
						);
						
						rows.push(
							[
								{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: 'Descontos:',
									alignment: 'right',
									style: {
										bold: true,
										fontSize: 9
									},																			
								},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
									alignment: 'right',
									style: { fontSize: 9, bold: true }
								},{}
							]
						);
	
						
						rows.push(
							[
								{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: 'Total:',
									alignment: 'right',
									style: {
										bold: true,
										fontSize: 9
									},																			
								},{},
								{
									colSpan: 2,
									text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
									alignment: 'right',
									style: { fontSize: 8, bold: true}
								},{}
							]
						);	

						console.log('vias: ', vias, ' impressos: ', impressos);

						if(vias == 2 && impressos == 0) {
							rows.push([
								{
									text: '\n' + '- '.repeat(102),
									colSpan: 14,
									fontSize: 10,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							])
						}
					} // Fim do controle de vias

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
		formas += 'Vencto: '
		for (let i in titulos) {
			formas += `${(parseInt(i)+1)}/${titulos.length} - ` +  moment(titulos[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda(titulos[i]['FINANCEIROS_ORIGINAL']) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}	
	}

	return formas;
};