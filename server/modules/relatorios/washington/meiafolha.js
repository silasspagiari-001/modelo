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
									heights: 5,
									dontBreakRows: true,
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

					const cents = utils.number.cents.bind(utils.number);
					const grams = utils.number.grams.bind(utils.number);
				
					const titDocumento = params.titledocumento;
					let model = res.results[0];
					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;
					let vias;
					let pathLogo;					

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/default.png`;
					}

					let linhas      = 0;
					let itensPagina = 0;

					for(let i in produtos){

						if(linhas == 0) { // Sempre que zerar linhas, vai imprimir o cabeçalho
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
										text: model['MOVIMENTOS_NOME'] + '(' + model['MOVIMENTOS_ID_PESSOAS'] + ')',
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
										text: model['PESSOAS_BAIRRO'],
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
									colSpan: 5
								},{},{},{},{},
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
									text: 'Un Vista',
									alignment: 'center',
									fontSize: 6
								},
								{	
									text: 'Un Prazo',
									alignment: 'center',
									fontSize: 6,
								},
								{
									text: 'A Vista',
									alignment: 'center',
									fontSize: 6,
									colSpan: 2
								},{},
								{	
									text: 'A Prazo',
									alignment: 'center',
									colSpan: 2,
									fontSize: 6
								},{}
							]);	
							itensPagina = 0;
						}


						let qtdeProduto  = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0));

						let precoUnitario = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
												utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
												produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))

						let precoVista = (cents(produtos[i]['TOTAL_LIQUIDO']) / grams(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) * 10;
						let totalVista = produtos[i]['TOTAL_LIQUIDO'];

						rows.push([
							{
								text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'center',
								style: {fontSize: 8, bold: true},
								border:[true, false, true, true]
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								colSpan: 5,
								style: { fontSize: 8, bold: true },
								border:[false, false, true, true]
							},{},{},{},{},
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
								text: utils.number.float2moeda(precoVista),
								alignment: 'right',
								style: { fontSize: 8, bold: true },
								border:[false, false, true, true]
							},
							{
								text: precoUnitario,
								alignment: 'right',
								style: { fontSize: 8, bold: true },
								border:[false, false, true, true]
							},
							{
								colSpan: 2,
								text: utils.number.float2moeda(totalVista),
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

						if(linhas > 14) {
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

					for (linhas = itensPagina; linhas < 15; linhas++) { // Linhas em branco pra completar o tamanho da via
						rows.push(
							[
								{
									text: 'A',
									style: {
										fontSize: 8,
										color: 'white'
									}										
								},
								{text: '', colSpan: 5},{},{},{},{},
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
								text: `Vendedor: ${model['USUARIOS_LOGIN']}` ,
								colSpan: 10,
								style: { fontSize: 10 },
								border: [true, true, false, false]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'A Prazo:',
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
							{
								text: 'Confirmação de Entrega: (Assinatura) ______________________________ Data: _________________',
								colSpan: 10,
								style: { fontSize: 10, bold: true },
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'A Vista:',
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

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};