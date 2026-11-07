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
								table: { //  CD   [Descricao                      ]  UN  QD  PR  TT
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [31, 21, 31, 31, 31, 31, 31, 31, 31, 31, 20, 31, 45, 45], // TOTAL: 560
									heights: 5,
									headerRows: 6,
									body: []
								},
								style: {
									fontSize: 10
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									{ text: moment.tz(params.timezone).format('DD/MM/YYYY') + ' ' + moment.tz(params.timezone).format('HH:mm:ss') + ' - Pág: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},			
			
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					const impLog = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					let model = res.results[0];

					let financeiros = model['MOVIMENTOS_FINANCEIROSCOMPRA'] || [];

					let vencto01 = (financeiros.length > 0  ? `${moment(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto02 = (financeiros.length > 1  ? `${moment(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto03 = (financeiros.length > 2  ? `${moment(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto04 = (financeiros.length > 3  ? `${moment(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto05 = (financeiros.length > 4  ? `${moment(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto06 = (financeiros.length > 5  ? `${moment(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto07 = (financeiros.length > 6  ? `${moment(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto08 = (financeiros.length > 7  ? `${moment(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto09 = (financeiros.length > 8  ? `${moment(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto10 = (financeiros.length > 9  ? `${moment(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto11 = (financeiros.length > 10 ? `${moment(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto12 = (financeiros.length > 11 ? `${moment(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');

					let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');

					let obsPedido = model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ') : '';

					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/default.png`;
					}

					let linhas;
					let itensPagina     = 0;

					rows.push(
						[
							{
								image: pathLogo,
								fit: [100, 100],									
								colSpan: 4,
								alignment: 'center',
								margin: [0, 10, 0, 0],
								border: [false, false, false, false]
							},{},{},{},
							{
								colSpan: 6,
								text: `\nORÇAMENTO`,
								alignment: 'center',
								border: [false, false, false, false],								
								style: {bold: true,	fontSize: 18}
							},{},{},{},{},{},
							{
								colSpan: 4,
								table: {
									body: [
										[
											{
												text: 'Número: ',
												style: {bold: true},
											},
											{
												text: ('000000' + model['MOVIMENTOS_NUMERO']).slice(-6),
												alignment: 'center',
												style: {bold: true},
											}
										],
										[ 
											{
												text: 'Emissão: ',
												style: {bold: true},
											},
											{
												text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
												alignment: 'center',
												style: {bold: true}												
											}
										],
										[ 
											{
												text: 'Pgto: ',
												style: {bold: true},
											},
											{
												text: model['PRAZOS_NOME'],
												alignment: 'center',
												style: {bold: true}												
											}
										]

									]
								},
								layout: 'noBorders'
							},{},{},{}
						],
						[
							{ 
								text: 'a', 
								style: {
									color: 'white',
									fontSize: 1
								},
								colSpan: 14,									
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Fornecedor:',
								colSpan: 2,
								border: [true, true, false, false]
							},{},
							{
								text: model['EMPRESAS_NOME'],
								bold: true,
								border: [false, true, true, false],
								colSpan: 12
							},{},{},{},{},{},{},{},{},{},{},{}						
						],
						[
							{
								text: 'Endereço:',
								colSpan: 2,
								border: [true, false, false, false]
							},{},
							{
								text: model['EMPRESAS_ENDERECO'] + ' ' + model['EMPRESAS_NUMERO'],
								bold: true,
								colSpan: 7,
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: 'Bairro:',
								border: [false, false, false, false]
							},{
								text: model['EMPRESAS_BAIRRO'],
								border: [false, false, true, false],
								bold: true,
								colSpan: 4
							},{},{},{}
						],
						[
							{
								text: 'Cidade:',
								border: [true, false, false, false],
								colSpan: 2
							},{},
							{
								text: model['CIDADES_NOMEEMPRESA'],
								border: [false, false, false, false],
								bold: true,
								colSpan: 7
							},{},{},{},{},{},{},	
							{
								text: 'UF:',
								alignment: 'right',
								border: [false, false, false, false]
							}, 
							{
								text: model['CIDADES_ESTADOEMPRESA'],
								border: [false, false, false, false],
								bold: true
							},
							{
								text: (model['EMPRESAS_CPFCNPJ'].length == 11 ? "CPF:" : "CNPJ:"),
								alignment: 'right',
								border: [false, false, false, false]
							},
							{
								text: utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']),
								border: [false, false, true, false],
								bold: true,
								colSpan: 2
							},{}
						],
						[
							{
								text: 'Fone:',
								colSpan: 2,
								border: [true, false, false, true]
							},{},
							{
								text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
								bold: true,
								colSpan: 2,
								border: [false, false, false, true]
							},{},
							{
								text: 'Cel:',
								alignment: 'right',
								border: [false, false, false, true]
							},
							{
								text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
								colSpan: 3,
								bold: true,
								border: [false, false, false, true],
								alignment: 'left'
							},{},{},	
							{
								text: 'Vendedor:',
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, true]
							},{}, 
							{
								text: ('00000' + model['MOVIMENTOS_ID_USUARIOS']).slice(-5) + ' ' + model['USUARIOS_LOGIN'],
								bold: true,
								border: [false, false, true, true],
								colSpan: 4
							},{},{},{}
						], // Agora o cliente..
						[
							{ 
								text: 'a', 
								style: {
									color: 'white',
									fontSize: 1
								},
								colSpan: 14,									
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Cliente:',
								colSpan: 2,
								border: [true, true, false, false]
							},{},
							{
								text: model['MOVIMENTOS_NOME'],
								bold: true,
								border: [false, true, false, false],
								colSpan: 9
							},{},{},{},{},{},{},{},{},
							{							
								text: 'Fone:',
								alignment: 'right',
								border: [false, true, false, false]
							},
							{
								text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
								bold: true,
								colSpan: 2,
								border: [false, true, true, false]
							},{}
						],
						[
							{
								text: 'Endereço:',
								colSpan: 2,
								border: [true, false, false, false]
							},{},
							{
								text: model['PESSOAS_ENDERECO'] + ' ' + model['PESSOAS_NUMERO'],
								bold: true,
								colSpan: 7,
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: 'Bairro:',
								border: [false, false, false, false]
							},{
								text: model['PESSOAS_BAIRRO'],
								border: [false, false, true, false],
								bold: true,
								colSpan: 4
							},{},{},{}
						],
						[
							{
								text: 'Cidade:',
								border: [true, false, false, false],
								colSpan: 2
							},{},
							{
								text: model['CIDADES_NOME'],
								border: [false, false, false, false],
								bold: true,
								colSpan: 7
							},{},{},{},{},{},{},	
							{
								text: 'UF:',
								alignment: 'right',
								border: [false, false, false, false]
							}, 
							{
								text: model['CIDADES_ESTADO'],
								border: [false, false, false, false],
								bold: true
							},
							{
								text: (model['PESSOAS_CPFCNPJ'].length == 11 ? "CPF:" : "CNPJ:"),
								alignment: 'right',
								border: [false, false, false, false]
							},
							{
								text: utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
								border: [false, false, true, false],
								bold: true,
								colSpan: 2
							},{}
						],
						[
							{
								text: 'Cep:',
								colSpan: 2,
								border: [true, false, false, false]
							},{},
							{
								text: utils.string.maskCep(model['PESSOAS_CEP']),
								bold: true,
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: 'Cel:',
								alignment: 'right',
								border: [false, false, false, false]
							},
							{
								text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
								colSpan: 5,
								bold: true,
								border: [false, false, false, false],
								alignment: 'left'
							},{},{},{},{},
							{
								text: 'Insc. Est.:',
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}, 
							{
								text: model['PESSOAS_INSCRICAO'],
								bold: true,
								border: [false, false, true, false],
								colSpan: 2
							},{}
						],
						[
							{ 
								text: 'Observações:',
								colSpan: 2,
								border: [true, false, false, true]
							},{},
							{
								text: obsPedido.toUpperCase(),
								colSpan: 12,
								bold: true,
								border: [false, false, true, true]								
							},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'a', 
								style: {
									color: 'white',
									fontSize: 1
								},
								colSpan: 14,									
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Cód',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 9
							}, 
							{},{},{},{},{},{},{},{},
							{
								text: 'Un',
								alignment: 'center',
							},
							{
								text: 'Qtde',
								alignment: 'center'								
							},
							{
								text: 'Preço',
								alignment: 'center'								
							},
							{
								text: 'Total',
								alignment: 'center'								
							}
						]
					);

					for(let i in produtos){
						let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
						rows.push(
							[
								{							
									text: ('00000' + produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-5),	
									alignment: 'center',
									style: {
										bold: true
									}											
								},
								{
									text: produtos[i]['PRODUTOS_NOME'],
									colSpan: 9,
									style: {
										bold: true
									}
								},{},{},{},{},{},{},{},{},
								{
									text: produtos[i]['PRODUTOS_UNIDADE'],
									alignment: 'center',
									style: {
										bold: true
									}
								},
								{
									text: qtdeProduto,
									alignment: 'right',
									style: {
										bold: true
									}																			
								},
								{
									text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']),
									alignment: 'right',
									style: {
										bold: true
									}																			
								},
								{
									text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right',
									style: {
										bold: true
									}																			
								}
							]
						)
						itensPagina++
					}

					// PARCELAMENTO E TOTALIZADOR

                    rows.push(
                        [
                            {  
                                text: [ 
                                    {text: vencto01, fontSize: 8},
                                    {text: valor01, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},
                                    {text: vencto04, fontSize: 8},
                                    {text: valor04, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                    
                                    {text: vencto07, fontSize: 8},
                                    {text: valor07, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 7},
                                    {text: vencto10, fontSize: 8},
                                    {text: valor10, alignment: 'right', fontSize: 8},
                                ],
                                colSpan: 10,
                                border: [true, false, false, false]
                            },{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Produtos',
                                alignment: 'right',
                                style: {
                                    fontSize: 11,
                                    bold: true
                                }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']),
                                alignment: 'right',
                                style: {
                                    fontSize: 11,
                                    bold: true							
                                }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [ 
                                    {text: vencto02, fontSize: 8},
                                    {text: valor02, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                          
                                    {text: vencto05, fontSize: 8},
                                    {text: valor05, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                          
                                    {text: vencto08, fontSize: 8},
                                    {text: valor08, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                          
                                    {text: vencto11, fontSize: 8},
                                    {text: valor11, alignment: 'right', fontSize: 8},
                                ],
                                border: [true, false, false, false],
                                colSpan: 10
                            },{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Descontos',
								fontSize: 11,
                                alignment: 'right'
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
                                alignment: 'right',
                                style: { fontSize: 9 }
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [ 
                                    {text: vencto03, fontSize: 8},
                                    {text: valor03, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                    
                                    {text: vencto06, fontSize: 8},
                                    {text: valor06, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                    
                                    {text: vencto09, fontSize: 8},
                                    {text: valor09, alignment: 'right', fontSize: 8},
                                    {text: 'AA', color: 'white', fontSize: 8},                                    
                                    {text: vencto12, fontSize: 8},
                                    {text: valor12, alignment: 'right', fontSize: 8}                                        
                                ],
                                border: [true, false, false, true],                                
                                colSpan: 10
                            },{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Total',
                                alignment: 'right',
								fontSize: 11,
								bold: true
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
                                alignment: 'right',
                                style: { fontSize: 11, bold: true }																			
                            },{}
                        ]
                    );


                    rows.push(
                        [
                            {
                                text: '\nA\n',
								fontSize: 18,
								color: 'white',
                                colSpan: 14,
                                alignment: 'left',
                                border: [false, false, false, false],
                            },{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ]
                    );					

					// FIM DO PARCELAMENTO E TOTALIZADOR

					rows.push(
						[
							{
								text: '',
								colSpan: 8,
								alignment: 'center',
								border: [false, false, false, false],
								style: { fontSize: 10 }																			

							},{},{},{},{},{},{},{},
							{
								text: 'Visto do Cliente',
								colSpan: 5,
								alignment: 'center',
								border: [false, true, false, false],
								style: { fontSize: 10 }
							},{},{},{},{},
							{
								text: '',
								border: [false, false, false, false]
							}

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