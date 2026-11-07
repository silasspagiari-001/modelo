'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

const MesExtenso = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


const codes = require('rescode');
codes.loadModules(['interleaved2of5'], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',                //   E   S   D   I
 			pageMargins: [15, 10, 15, 20], // [15, 15, 15, 15]
			content: [
				{
					style: 'tableReport',
					table: {   
						widths: [ 85, 85, 85, 85, 85, 85 ],
						body: []
					},
					style: {
						fontSize: 8
					}
				}
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0]
				}
			}
		};

        return new Promise((resolve, reject) => {
			api.financeiros().readById(params.ids, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;

					let impressos = 0;
					let pathLogo = '';

					try {
						pathLogo = utils.client.getImagePath(`logos/duplicata/${res.results[0]['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/duplicata/default.png`;
					}

					for(let i in res.results){


						if(i > 0) {
							continue;
						}

						let model             = res.results[i];						
						let emiTitulo         = moment(model['FINANCEIROS_EMISSAO']    || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY');
						let vctTitulo         = moment(model['FINANCEIROS_VENCIMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
						let nomeEmpresa       = model['EMPRESAS_NOME'];
						let cnpjEmpresa       = utils.string.maskCnp( model['EMPRESAS_CPFCNPJ'] );
						let ieEmpresa         = model['EMPRESAS_INSCRICAO'];
						let celularEmpresa    = utils.string.maskFone(model['EMPRESAS_CELULAR']); 
						let telefoneEmpresa   = utils.string.maskFone(model['EMPRESAS_TELEFONE']);
						let emailEmpresa      = model['EMPRESAS_EMAIL'];
						let enderecoEmpresa   = model['EMPRESAS_ENDERECO'];
						let numeroEmpresa     = model['EMPRESAS_NUMERO']; 
						let bairroEmpresa     = model['EMPRESAS_BAIRRO'];
						let cidadeEmpresa     = model['CIDADES_NOMEEMPRESA'];
						let estadoEmpresa     = model['CIDADES_ESTADOEMPRESA'];
						let cepEmpresa        = utils.string.maskCep( model['EMPRESAS_CEP'] );

						let diaEmissao = moment(model['FINANCEIROS_EMISSAO']).format('DD');
						let mesEmissao = MesExtenso[(parseInt(moment(model['FINANCEIROS_EMISSAO']).format('MM')) - 1)];
                        let anoEmissao = moment(model['FINANCEIROS_EMISSAO']).format('YYYY');

						//Pessoa
						let nomePessoa     = model['PESSOAS_NOME'];
						let enderecoPessoa = model['PESSOAS_ENDERECO'];
						let numeroPessoa   = model['PESSOAS_NUMERO'];
						let cidadePessoa   = model['CIDADES_NOME'];						
						let estadoPessoa   = model['CIDADES_ESTADO'];

						//Cidade e endereço de cobrança
						let enderecoCobrancaPessoa = model['PESSOAS_ENDERECOCOBRANCA'];
						let cidadeCobrancaPessoa = model['CIDADESCOBRANCA_CIDADE_COBRANCA'];
						let estadoCobrancaPessoa = model['CIDADESCOBRANCA_ESTADO_COBRANCA'];
						let numeroCobrancaPessoa = model['PESSOAS_NUMEROCOBRANCA'];

						let iePessoa = (model['PESSOAS_INSCRICAO'] || model['PESSOAS_TELEFONECOBRANCA']);
						let cpfcnpjPessoa = utils.string.maskCnp( model['PESSOAS_CPFCNPJ'] );

						let total = model['FINANCEIROS_TOTAL'];
						let numeroFinanceiro = model['FINANCEIROS_NUMERO'];
												
						let financeiros = res.results;

						let vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');						
						let vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
						let vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
	
						let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['FINANCEIROS_ORIGINAL']) : '');
						let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['FINANCEIROS_ORIGINAL']) : '');
						let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['FINANCEIROS_ORIGINAL']) : '');
						let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['FINANCEIROS_ORIGINAL']) : '');
						let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['FINANCEIROS_ORIGINAL']) : '');
						let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['FINANCEIROS_ORIGINAL']) : '');
						let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['FINANCEIROS_ORIGINAL']) : '');
						let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['FINANCEIROS_ORIGINAL']) : '');
						let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['FINANCEIROS_ORIGINAL']) : '');
						let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['FINANCEIROS_ORIGINAL']) : '');
						let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['FINANCEIROS_ORIGINAL']) : '');
						let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['FINANCEIROS_ORIGINAL']) : '');
							
						if(impressos > 1) {
							rows.push([
								{
									text: '\n',
									fontSize: 6,
									pageBreak: 'before',
									border: [false, false, false, false],
									colSpan: 6
								},{},{},{},{},{}
							])
							impressos = 0;
						} else {
							rows.push([
								{
									text: (parseInt(i) > 0 ? '- '.repeat(100) : ''),
									fontSize: 10,									
									border: [false, false, false, false],
									colSpan: 6
								},{},{},{},{},{}
							])
						}

						//Cabeçalho
						rows.push([
							{
								table: {
									widths: [255, 255],
									heighs: [94, 94],
									body: [
										[	
											{
												table: {
													widths: [84, 160],
													heighs: [94, 94],
													style: {
														fontSize: 10, 
														bold: true
													},
													body: [
														[	
															{
																image: pathLogo,
																width: 80, //65
																height: 40,
																alignment: 'center',
																border: [true, true, true, true]
															},
															{
																text: [
																	{
																		text: `${nomeEmpresa}`,
																		alignment: 'center',
																		fontSize: 8, 
																	},
																	{
																		text: `\nFone ${telefoneEmpresa}`,
																		alignment: 'center',
																		fontSize: 8, 
																	},
																	{
																		text: `\nWhatsapp ${celularEmpresa}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\nEmail: ${emailEmpresa}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\n${enderecoEmpresa} ${numeroEmpresa} - ${bairroEmpresa}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\nCEP: ${cepEmpresa} - ${cidadeEmpresa} - ${estadoEmpresa}`,
																		alignment: 'center',
																		fontSize: 7, 
																	}
																],
																style: {
																	fontSize: 12, 
																	bold: true
																},
																height: 94,
																alignment: 'left',
																style: {fontSize: 12, bold: true},
																border: [true, true, true, true]
															}
														]
													]														
												},
												layout: 'tabletreport',												
												border: [false, false, false, false]
											},
											{
												table: {
													widths: [130, 130],
													heighs: [210, 210],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																text: [
																	{
																		text: `${nomeEmpresa}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{
																		text: `\n${enderecoEmpresa}, ${numeroEmpresa} - ${bairroEmpresa}`,
																		alignment: 'left',
																		fontSize: 6, 
																	},
																	{
																		text: `\nCEP: ${cepEmpresa} - ${cidadeEmpresa} - ${estadoEmpresa}`,
																		alignment: 'left',
																		fontSize: 6, 
																	},
																	{
																		text: `\nCNPJ: ${cnpjEmpresa}     INSCR. ESTADUAL: ${ieEmpresa}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{
																		text: `\nFone: ${telefoneEmpresa}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{																		
																		text: [
																			{
																				text: `\nDATA DE EMISSÂO:`,
																				alignment: 'left',
																				fontSize: 8
																			},
																			{
																				text: ` ${emiTitulo}\n`,
																				alignment: 'left',
																				fontSize: 10
																			}
																		],
																		alignment: 'left',
																		fontSize: 8
																	}
																],
																alignment: 'left',
																height: 210,
																style: {
																	fontSize: 12, 
																	bold: true
																},
																border: [true, true, true, true],
																colSpan: 2
															},{}
														]
													]														
												},
												layout: 'tabletreport',												
												border: [false, false, false, false]
											}
										]
									]														
								},
								layout: 'tabletreport',												
								colSpan: 6,
								border: [true, true, true, true]
							},{},{},{},{},{}
						]);

						//Parte de baixo
						rows.push([
							{
								table: {
									widths: [85, 85, 85, 85, 75, 75],
									heighs: [600, 600, 600, 600, 600, 600],
									body: [
										//1 LINHA
										[	
											{
												text: ``,
												border: [true, true, true, false]
											},
											{
												table: {
													widths: [170, 170],
													heighs: [100, 100],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																table: {
																	widths: [90, 75],
																	heighs: [100, 100],
																	style: {
																		fontSize: 12, 
																		bold: true
																	},
																	body: [
																		[
																			{
																				text: 'Valor',
																				alignment: 'center',
																				fontSize: 8, 
																			},
																			{
																				text: 'N DE ORDEM',
																				alignment: 'center',
																				fontSize: 8, 
																			}
																		],
																		[
																			{
																				text: `R$ ${ utils.number.float2moeda(total) }\n`,
																				alignment: 'center',
																				fontSize: 10, 
																			},
																			{
																				text: `${numeroFinanceiro}\n`,
																				alignment: 'center',
																				fontSize: 10, 
																			}
																		]
																	],
																	layout: 'tabletreport',											
																	border: [false, false, false, false]
																}
															}
														]
													]														
												},
												layout: 'noBorders',	
												colSpan: 2,											
												border: [false, false, false, false]
											},{},
											//VENCIMENTO
											{
												table: {
													widths: [35, 35],
													heighs: [120, 120],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																text: [
																	{
																		text: 'VENCIMENTO\n',
																		fontSize: 8,
																		bold: false
																	},
																	`${vctTitulo}\n`
																],
																width: 120,
																alignment: 'center',
																fontSize: 13,
																colSpan: 2,
																border: [true, true, true, true]
															},{}
														]
													]														
												},
												layout: 'tabletreport',												
												border: [false, false, false, false]
											},
											//PARA USO INSTITUICAO FINANCEIRA
											{
												table: {
													widths: [75, 75],
													heighs: [100, 100],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																text: [
																	{
																		text: 'PARA USO DA INSTITUIÇÂO FINANCEIRA',
																		fontSize: 8,
																		bold: false
																	},
																	'\n\n\n'
																],
																alignment: 'center',
																fontSize: 8,
																colSpan: 2,
																border: [true, true, true, true]
															},{}
														]
													]														
												},
												layout: 'tabletreport',	
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											}
										],
										//2 LINHA
										[	
											{
												text: `Vencimento     Valor R$\n${vencto01}     ${valor01}\n${vencto02}     ${valor02}\n${vencto03}     ${valor03}\n${vencto04}     ${valor04}\n${vencto05}     ${valor05}\n${vencto06}     ${valor06}\n${vencto07}     ${valor07}\n${vencto08}     ${valor08}\n${vencto09}     ${valor09}\n${vencto10}     ${valor10}\n${vencto11}     ${valor11}\n${vencto12}     ${valor12}`,
												border: [true, false, true, false]
											},
											{
												table: {
													widths: [170, 170],
													heighs: [100, 100],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																table: {
																	widths: [180, 180, 180],
																	heighs: [100, 100, 100],
																	style: {
																		fontSize: 12, 
																		bold: true
																	},
																	body: [
																		[
																			{
																				text: [
																					{
																						text: `SACADO: `,
																						alignment: 'left',
																						fontSize: 8
																					},
																					{
																						text: `${nomePessoa}`,
																						alignment: 'left',
																						fontSize: 12
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 3,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: [
																					{
																						text: `ENDEREÇO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${enderecoPessoa}, ${numeroPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 2,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: [
																					{
																						text: `MUNICIPIO: `,
																						alignment: 'left',
																						fontSize: 8
																					},
																					{
																						text: `${cidadePessoa}`,
																						alignment: 'left',
																						fontSize: 12
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 2,
																				border: [false, false, false, false]
																			},{},
																			{
																				text: [
																					{
																						text: `ESTADO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${estadoPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: [
																					{
																						text: `END.DE PGTO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${enderecoCobrancaPessoa}, ${numeroCobrancaPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 2,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: [
																					{
																						text: `PÇA.DE PGTO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},	
																					{
																						text: `${cidadeCobrancaPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 2,
																				border: [false, false, false, false]
																			},{},
																			{
																				text: [
																					{
																						text: `ESTADO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${estadoCobrancaPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: [
																					{
																						text: `CPF/CNPJ: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${cpfcnpjPessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				border: [false, false, false, false]
																			},
																			{
																				text: [
																					{
																						text: `RG/I.E.: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${iePessoa}`,
																						alignment: 'left',
																						fontSize: 12, 
																						border: [false, false, false, false]
																					}	
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				colSpan: 2,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				alignment: 'left',
																				fontSize: 8, 
																				border: [false, false, false, false]
																			}
																		]
																	],
																	layout: 'noBorders',											
																	border: [true, true, true, true]
																}
															}
														]
													]														
												},
												layout: 'noBorders',	
												colSpan: 4,											
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											}
										],
										//3 LINHA
										[	
											{
												text: '',
												height: 1,
												border: [true, false, true, false]
											},
											{
												table: {
													widths: [170, 170],
													heighs: [200, 200],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																table: {
																	widths: [90, 335],
																	heighs: [200, 200],
																	style: {
																		fontSize: 12, 
																		bold: true
																	},
																	body: [
																		[
																			{
																				text: 'VALOR POR EXTENSO',
																				alignment: 'center',
																				fontSize: 8
																			},
																			{
																				text: `R$ ${ utils.number.float2moeda(total) } (${utils.number.ValorPorExtenso(total) })\n`,
																				alignment: 'center',
																				fontSize: 10
																			}
																		]
																	],
																	layout: 'tabletreport',											
																	border: [false, false, false, false]
																}
															}
														]
													]														
												},
												layout: 'noBorders',	
												colSpan: 5,											
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											}
										],
										//4 LINHA
										[	
											{
												text: '',
												height: 1,
												border: [true, false, true, true]
											},
											{
												table: {
													widths: [200, 200],
													heighs: [200, 200],
													style: {
														fontSize: 12, 
														bold: true
													},
													body: [
														[	
															{
																table: {
																	widths: [420, 10],
																	heighs: [200, 200],
																	style: {
																		fontSize: 12, 
																		bold: true
																	},
																	body: [
																		[
																			{
																				text: [
																					{
																						text: 'RECONHEÇO(EMOS) A EXATIDÃO DESTA DUPLICATA DE VENDA MERCANTIL, NA IMPORTÂNCIA ACIMA QUE PAGAREI(EMOS) À ',
																						fontSize: 8,
																						border: [false, false, false, false]
																					},
																					{
																						text: model['EMPRESAS_NOME'],
																						fontSize: 8,
																						bold: true,
																						border: [false, false, false, false]
																					},
																					{
																						text: '.,OU À SUA ORDEM NA PRAÇA E VENCIMENTOS INDICADOS.',
																						fontSize: 8,
																						border: [false, false, false, false]
																					}
																				],
																				alignment: 'center',
																				fontSize: 8,
																				colSpan: 2,
																				border: [false, false, false, false]
																			},{}
																		]
																	],
																	layout: 'tabletreport',											
																	border: [false, false, false, false]
																}
															}
														],
														[	
															{
																table: {
																	widths: [1, 100, 1, 343, 25],
																	heighs: [100, 100],
																	style: {
																		fontSize: 12, 
																		bold: true
																	},
																	body: [
																		[
																			{
																				text: '',
																				border: [false, false, false, false]
																			},
																			{
																				text: moment().format('DD/MM/YYYY'),
																				alignment: 'center',
																				fontSize: 11,
																				bold: true,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				border: [false, false, false, false]
																			},
																			{
																				text: '________________________________________________________________',
																				alignment: 'center',
																				fontSize: 10,
																				bold: true,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				border: [false, false, false, false]
																			}
																		],
																		[
																			{
																				text: '',
																				border: [false, false, false, false]
																			},
																			{
																				text: 'DATA DO ACEITE',
																				alignment: 'center',
																				fontSize: 8,
																				bold: true,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				border: [false, false, false, false]
																			},
																			{
																				text: 'ASSINATURA DO SACADO',
																				alignment: 'center',
																				fontSize: 8,
																				bold: true,
																				border: [false, false, false, false]
																			},
																			{
																				text: '',
																				border: [false, false, false, false]
																			}
																		]
																	],
																	height: 100,
																	layout: 'tabletreport',											
																	border: [false, false, false, false]
																}
															}
														]
													]														
												},
												layout: 'noBorders',	
												colSpan: 5,											
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											},{
												text: '',
												border: [false, false, false, false]
											}
										]
									]														
								},
								layout: 'tabletreport',												
								colSpan: 6,
								border: [true, true, true, true]
							},{},{},{},{},{}
						]);

						rows.push([
							{
								text: 'a\n',
								color: 'white',
								fontSize: 18,
								colSpan: 6,
								border: [false, false, false, false]
							},{},{},{},{},{}
						])


						rows.push([
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{},
							{
								text: 'ASSINATURA DO EMITENTE',
								fontSize: 10,
								colSpan: 3,
								alignment: 'center',
								border: [false, true, false, false]
							},{},{}
						])

						rows.push([
							{
								text: '\nCONTRATO DE COMPRA E VENDA COM RESERVA DE DOMÍNIO',
								fontSize: 10,
								bold: true,
								colSpan: 6,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '1º) A presente venda foi combinada entre VENDEDORA e COMPRADOR(A), com Cláusula de RESERVA DE DOMÍNIO  aqui expressamente instituída, e por força dessa mesma Cláusula, fica reservado à VENDEDORA a propriedade dos bens estipulados na Nota Fiscal até que seja liquidada a última parcela de pagamento, convencionado na Duplicata acima, no corpo deste contrato.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '2º) Deixando o Comprador(a) de pagar no dia do respectivo vencimento qualquer das prestações aqui convencionadas, consideram-se vencidas todas as demais prestações, ficando o Comprador(a) desde logo qualificado em mora. A Vendedora, nesse caso, poderá independente de qualquer aviso ou interpelação judicial, ter por rescindido de pleno direito o presente contrato, e exigir a restituição "incontinente" do(s) objeto(s) condicionalmente adquirido(s), sendo facultada a Vendedora:\n(a) Optar pela cobrança em forma de execução das prestações vencidas na forma do Artigo 1070 do Código do Processo Civil;\n(b) Requerer a apreensão e o depósito judicial da coisa vendida, com a consequente reintegração imediata da sua posse como dispõe o Artigo 1071 do Código do Processo Civil.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '3º) O Comprador(a) declara para todos os efeitos, que o(s) objeto(s) por ele(a) adquirido(s) se encontra(am) em perfeito estado de funcionamento e que assim deve(em) conservá-lo(s) até o final deste contrato.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '4º) Por força do presente instrumento e do pacto de reserva de domínio, o(a) Comprador(a) aceita e se constitui fiel depositário do(s) objetos(s) ora havidos, obrigando-se a não alienar, penhorar, ceder, ou de qualquer forma transferir ou onerar o(s) objeto(s) vendido(s) e ainda conservá-lo(s) em perfeito estado de funcionamento ficando ciente de que se dispor do(s) bem(ns) ou sua má conservação, incorrerá o(a) Comprador(a) nas penas do Artigo 168 1º inciso 1 do Código Penal Brasileiro.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '5º) Em caso de falência ou morte do(a) Comprador(a), as obrigações deste contrato, transferem-se à massa falida ou aos herdeiros e sucessores do adquirente, contra os quais a Vendedora pode exercer todos os direitos neste instrumento mencionado, exceto a parte final da Cláusula 4º.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '6º) O(A) Comprador(a) se obriga ainda, verificada a rescisão deste contrato por sua culpa, a não reclamar em seu benefício, as quantias que já tiverem pagas, e arcar com todas as despesas a que der causa, tudo de conformidade com o que dispõe o Artigo 1070 e seguinte do Código do Processo Civil.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '7º) O(A) Comprador(a) incorrerá na multa de 10% sobre o valor total do débito, no caso de ser a Vendedora ou seu Cessionário, obrigado a recorrer aos meios judiciais para assegurar os direitos decorrentes deste contrato sem prejuízo da integral execução deste.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])

						rows.push([
							{
								text: '8º) As partes elegem como foro para dirimir qualquer questão oriunda deste contrato, o da Comarca de PRESIDENTE PRUDENTE - SP, com exclusão de todo e qualquer outro, por mais privilegiado que seja.\nE por estarem VENDEDORA e COMPRADOR(A) de pleno acordo com o disposto neste contrato, assinam em uma (1) só via na presença de duas testemunhas abaixo assinadas e de conformidade com a lei em vigor.',
								fontSize: 7,
								bold: true,
								colSpan: 6,
								alignment: 'justify',
								border: [false, false, false, false]
							},{},{},{},{},{}
						])


						rows.push([
							{
								text: 'TESTEMUNHAS',
								fontSize: 8,
								bold: true,
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},
							{
								text: `${cidadeEmpresa},  ${estadoEmpresa},  ${diaEmissao} de ${mesEmissao} de ${anoEmissao}\n\n\n\n`,
								fontSize: 8,
								bold: true,
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{}
						])

						rows.push([
									{
										table: {
											widths: [245, 20, 250],
											body: [
												[
													{
														text: '',
														border: [false, true, false, false]
													},
													{
														text: '',
														border: [false, false, false, false]
													},
													{
														text: 'VENDEDOR(A)\n\n\n\n',
													    fontSize: 8,
														bold: true,
														border: [false, true, false, false]
													}
												],
												[
													{
														text: '',
														border: [false, true, false, false]
													},
													{
														text: '',
														border: [false, false, false, false]
													},
													{
														text: 'COMPRADOR(A)',
														fontSize: 8,
														bold: true,
														border: [false, true, false, false]
													}
												]
											],
											height: 100,
											layout: 'tabletreport',											
											border: [false, false, false, false]
										},
										border: [false, false, false, false],
										colSpan: 6
									},{},{},{},{},{}
								])


					} 
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
