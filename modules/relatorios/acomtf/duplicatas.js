'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const samosFB   = require('../../../services/samosFB');

const codes = require('rescode');
codes.loadModules(['interleaved2of5'], {"includetext" : false});

const getFinanceirosById = async function(id, params){
	try {
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;

		sqlWhere += ids.reduce((result, id) => {
			return result += ` FINANCEIROS_ID = '${id}' or `
		}, '').slice(0, -3);
		
		const sqlSearch = `select 
				FINANCEIROS_ID,
				FINANCEIROS_TIPO,
				FINANCEIROS_ID_EMPRESAS,
				EMPRESAS_FANTASIA,
				EMPRESAS_TELEFONE, 
				EMPRESAS_CELULAR,
				EMPRESAS_NOME,
				EMPRESAS_EMAIL,
				EMPRESAS_INSCRICAO,
				EMPRESAS_CPFCNPJ,
				EMPRESAS_ENDERECO,
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
				CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
				CIDADESPESSOA.CIDADES_NOME as PESSOAS_CIDADES,
				CIDADESPESSOA.CIDADES_ESTADO as PESSOAS_ESTADO,
				FINANCEIROS_ID_DOCUMENTOS,
				DOCUMENTOS_COLETACARTAO,
				FINANCEIROS_ID_MOVIMENTOS,
				FINANCEIROS_ID_USUARIOS,
				USUARIOS_NOME,
				USUARIOS_EMAIL,
				USUARIOS_TELEFONE,
				USUARIOS_CELULAR,
				FINANCEIROS_ID_PESSOAS,
				PESSOAS_CPFCNPJ,
				PESSOAS_TIPO,
				PESSOAS_ID_CIDADES,
				PESSOAS_INSCRICAO,
				PESSOAS_NOME,
				PESSOAS_FANTASIA,
				PESSOAS_ENDERECO,
				PESSOAS_ENDERECOCOBRANCA,
				PESSOAS_BAIRROCOBRANCA,
				PESSOAS_CEPCOBRANCA,
				PESSOAS_NUMEROCOBRANCA,
				CIDADESCOBRANCA.CIDADES_NOME as CIDADESCOBRANCA_CIDADE_COBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADESCOBRANCA_ESTADO_COBRANCA,
				PESSOAS_NUMERO,
				PESSOAS_BAIRRO,
				PESSOAS_EMAIL,
				PESSOAS_PAGINA,
				PESSOAS_TELEFONE,
				PESSOAS_CELULAR,
				PESSOAS_CEP,
				PESSOAS_CREDITO,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				MOVIMENTOS_ID_PROPRIEDADES,
				PROPRIEDADES_CPFCNPJ,
				PROPRIEDADES_NOME,
				PROPRIEDADES_CEP,
				PROPRIEDADES_ENDERECO,
				PROPRIEDADES_NUMERO,
				PROPRIEDADES_BAIRRO,
				PROPRIEDADES_CEP,
				CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
				CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
				FINANCEIROS_ID_PORTADORES,
				PORTADORES_NOME,
				PORTADORES_ID_BANCOS,
				BANCOS_NOME,
				PORTADORES_AGENCIA,
				PORTADORES_CONTA,
				PORTADORES_CONVENIO,
				PORTADORES_CARTEIRA,
				PORTADORES_CPFCNPJ,
				PORTADORES_ENDERECO,
				PORTADORES_NUMERO,
				PORTADORES_BAIRRO,
				PORTADORES_CEP,
				PORTADORES_PROTESTO,
				PORTADORES_MORA,
				PORTADORES_MULTA,
				CIDADESPORTADOR.CIDADES_NOME as CIDADES_NOMEPORTADOR,
				CIDADESPORTADOR.CIDADES_ESTADO as CIDADES_ESTADOPORTADOR,
				FINANCEIROS_ID_PRAZOS,
				PRAZOS_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_PARCELA,
				FINANCEIROS_PARCELAS,
				FINANCEIROS_NOSSONUMERO,
				FINANCEIROS_BOLETO,
				FINANCEIROS_EMISSAO,
				FINANCEIROS_VENCIMENTO,
				FINANCEIROS_PAGAMENTO,
				FINANCEIROS_BAIXA,
				FINANCEIROS_ORIGINAL,
				FINANCEIROS_ABERTO,
				FINANCEIROS_DESCONTOS,
				FINANCEIROS_JUROS,
				FINANCEIROS_TAXAS,
				FINANCEIROS_PAGO,
				FINANCEIROS_TOTAL,
				FINANCEIROS_OBSERVACOES,
				FINANCEIROS_STATUS,
				FINANCEIROS_EXPORTADO,
				FINANCEIROS_LOG,
				FINANCEIROS_NUMERO,
				FINANCEIROS_SERIE,
				FINANCEIROS_ID_EMPRESAORIGEM,
				FINANCEIROS_NUMEROORIGEM,
				FINANCEIROS_SERIEORIGEM,
				iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO,
				(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZOCALCULADO_BOLETO
			from FINANCEIROS
				left outer join EMPRESAS                      on EMPRESAS_ID                   = FINANCEIROS_ID_EMPRESAS
				left outer join DOCUMENTOS                    on DOCUMENTOS_ID                 = FINANCEIROS_ID_DOCUMENTOS
				left outer join PRAZOS                        on PRAZOS_ID                     = FINANCEIROS_ID_PRAZOS
				left outer join PESSOAS                       on PESSOAS_ID                    = FINANCEIROS_ID_PESSOAS
				left outer join PORTADORES                    on PORTADORES_ID                 = FINANCEIROS_ID_PORTADORES
				left outer join MOVIMENTOS                    on MOVIMENTOS_ID                 = FINANCEIROS_ID_MOVIMENTOS
				left outer join PROPRIEDADES                  on PROPRIEDADES_ID               = MOVIMENTOS_ID_PROPRIEDADES
				left outer join BANCOS                        on BANCOS_ID                     = PORTADORES_ID_BANCOS
				left outer join CIDADES                       on CIDADES.CIDADES_ID            = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPESSOA      on CIDADESPESSOA.CIDADES_ID      = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPORTADOR    on CIDADESPORTADOR.CIDADES_ID    = PORTADORES_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESA     on CIDADESEMPRESA.CIDADES_ID     = EMPRESAS_ID_CIDADES
				left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES_ID_CIDADES
				left outer join CIDADES as CIDADESCOBRANCA    on CIDADESCOBRANCA.CIDADES_ID    = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
				left outer join APLICACOES                    on APLICACOES_ID                 = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                        on CUSTOS_ID                     = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                      on USUARIOS_ID                   = FINANCEIROS_ID_USUARIOS
			${sqlWhere}
			order by FINANCEIROS_ID_EMPRESAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA  `;

		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async financeiro => {
			const sqlItens = `select 
				FINANCEIROSITENS.*, 
				APLICACOES_NOME, 
				PORTADORES_NOME
			from FINANCEIROSITENS
			left outer join APLICACOES on APLICACOES_ID = FINANCEIROSITENS_ID_APLICACOES
			left outer join PORTADORES on PORTADORES_ID = FINANCEIROSITENS_ID_PORTADORES
			where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
			order by FINANCEIROSITENS_ID`;

			financeiro['FINANCEIROS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
		}));

		return { 
			results, 
			total: results.length 
		};
	} catch(error) {
		const msg = 'Falha ao buscar financeiros por id';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
} 

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',                //   E   S   D   I
 			pageMargins: [15, 0, 15, 20], // [15, 15, 15, 15]
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
			getFinanceirosById(params.ids, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;

					let localPagamento = '';
					let campoEndereco = '';
					let campoNumero =  '';
					let campoBairro = '';
					let campoCep = '';
					let campoCpfcnpj = '';
					let campoCidade = '';
					let campoEstado = '';
					let impressos = 0;
					let pathLogo = '';

					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${res.results[0]['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}

					for(let i in res.results){

						let model           = res.results[i];
						let NumeroDocumento = `${('00' + model['FINANCEIROS_ID_EMPRESAS']).slice(-2)}${('000000' + model['FINANCEIROS_NUMERO']).slice(-6)}${('000' + model['FINANCEIROS_PARCELA']).slice(-3)}${model['FINANCEIROS_SERIE']}`;
						let emiTitulo       = moment(model['FINANCEIROS_EMISSAO']    || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY');
						let vctTitulo       = moment(model['FINANCEIROS_VENCIMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');

						let nomeEmpresa     = model['EMPRESAS_NOME'];
						let cpfcnpj = utils.string.maskCnp( model['EMPRESAS_CPFCNPJ'] );
						let inscricaoEstadual = model['EMPRESAS_INSCRICAO'];
						let celularEmpresa  = model['EMPRESAS_CELULAR']; 
						let telefoneEmpresa = utils.string.maskFone( model['EMPRESAS_TELEFONE'] );
						let email = model['EMPRESAS_EMAIL'];
						let endereco = model['EMPRESAS_ENDERECO'];
						let numero = model['EMPRESAS_NUMERO'];
						let bairro = model['EMPRESAS_BAIRRO'];
						let cidade = model['CIDADES_NOME'];
						let cep = utils.string.maskCep( model['PESSOAS_CEP'] );
						let estado = model['CIDADES_ESTADO'];

						//Pessoa
						let enderecoPessoa = model['PESSOAS_ENDERECO'];
						let numeroPessoa = model['PESSOAS_NUMERO'];

						//Cidade e endereço de cobrança
						let enderecoCobrancaPessoa = model['PESSOAS_ENDERECOCOBRANCA'];
						let cidadeCobrancaPessoa = model['CIDADESCOBRANCA_CIDADE_COBRANCA'];
						let estadoCobrancaPessoa = model['CIDADESCOBRANCA_ESTADO_COBRANCA'];
						let bairroCobrancaPessoa = model['PESSOAS_BAIRROCOBRANCA'];
						let cepCobrancaPessoa = model['PESSOAS_CEPCOBRANCA'];
						let numeroCobrancaPessoa = model['PESSOAS_NUMEROCOBRANCA'];

						let cepPessoa      = utils.string.maskCep( model['PESSOAS_CEP'] );
						let nomePessoa     = model['PESSOAS_NOME'];
						let bairroPessoa   = model['PESSOAS_BAIRRO'];
						let cidadePessoa   = model['PESSOAS_CIDADES'];
						let estadoPessoa   = model['PESSOAS_ESTADO'];
						let rgInscricaoPessoa = model['PESSOAS_INSCRICAO'];
						let cpfcnpjPessoa = utils.string.maskCnp( model['PESSOAS_CPFCNPJ'] );

						let total = model['FINANCEIROS_ABERTO'];
						let parcelaAtual = model['FINANCEIROS_PARCELA'];
						let parcelas = model['FINANCEIROS_PARCELAS'];
						let numeroFinanceiro = model['FINANCEIROS_NUMERO'];
						let serieFinanceiro = model['FINANCEIROS_SERIE'];
						
						if(cents(model['MOVIMENTOS_ID_PROPRIEDADES']) > 0) {
							campoEndereco = model['PROPRIEDADES_ENDERECO'];
							campoNumero   = model['PROPRIEDADES_NUMERO'];
							campoBairro   = model['PROPRIEDADES_BAIRRO'];
							campoCep      = model['PROPRIEDADES_CEP'];
							campoCpfcnpj  = model['PROPRIEDADES_CPFCNPJ'];
							campoCidade   = model['CIDADES_NOMEPROPRIEDADE'];
							campoEstado   = model['CIDADES_ESTADOPROPRIEDADE'];
						} else {
							campoEndereco = model['PESSOAS_ENDERECO'];
							campoNumero   = model['PESSOAS_NUMERO'];
							campoBairro   = model['PESSOAS_BAIRRO'];
							campoCep      = model['PESSOAS_CEP'];
							campoCpfcnpj  = model['PESSOAS_CPFCNPJ'];
							campoCidade   = model['CIDADES_NOME'];
							campoEstado   = model['CIDADES_ESTADO'];	
						}
						
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
																width: 65,
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
																		text: `\nTelefone ${telefoneEmpresa}`,
																		alignment: 'center',
																		fontSize: 8, 
																	},
																	{
																		text: `\nWhatsapp ${celularEmpresa}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\nEmail: ${email}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\n${endereco} ${numero} - ${bairro}`,
																		alignment: 'center',
																		fontSize: 7, 
																	},
																	{
																		text: `\nCEP: ${cep} - ${cidade} - ${estado}`,
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
																		text: `\n${endereco}, ${numero} - ${bairro}`,
																		alignment: 'left',
																		fontSize: 6, 
																	},
																	{
																		text: `\nCEP: ${cep} - ${cidade} - ${estado}`,
																		alignment: 'left',
																		fontSize: 6, 
																	},
																	{
																		text: `\nINSCR. CNPJ (MF): ${cpfcnpj}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{
																		text: `\nINSCR. ESTADUAL: ${inscricaoEstadual}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{
																		text: `\nTelefone ${telefoneEmpresa}`,
																		alignment: 'left',
																		fontSize: 8, 
																	},
																	{
																		//text: `\nDATA EMISSÂO: ${emiTitulo}\n\n\n\n`
																		text: [
																			{
																				text: `\nDATA DE EMISSÂO:`,
																				alignment: 'left',
																				fontSize: 8
																			},
																			{
																				text: ` ${emiTitulo}\n`,
																				alignment: 'left',
																				fontSize: 12
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
												text: '',
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
																				text: `${numeroFinanceiro}-${serieFinanceiro} ${parcelaAtual}/${parcelas}\n`,
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
												text: '',
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
																				//text: `ENDEREÇO: ${enderecoPessoa}`,
																				text: [
																					{
																						text: `ENDEREÇO: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: String(`${enderecoPessoa}, BAIRRO: ${bairroPessoa}, NUM: ${numeroPessoa}`).slice(0, 50),
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
																				border: [false, false, false, false]
																			},
																			{
																				text: [
																					{
																						text: `CEP: `,
																						alignment: 'left',
																						fontSize: 8
																					},
																					{
																						text: `${cepPessoa}`,
																						alignment: 'left',
																						fontSize: 12
																					}
																				],
																				alignment: 'left',
																				fontSize: 12, 
																				border: [false, false, false, false]
																			},
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
																						text: String(`${enderecoCobrancaPessoa}, BAIRRO: ${bairroCobrancaPessoa}, NUM: ${numeroCobrancaPessoa}`).slice(0,50),
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
																				border: [false, false, false, false]
																			},
																			{
																				text: [
																					{
																						text: `CEP: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${cepCobrancaPessoa}`,
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
																						text: `INSC. CNPJ: `,
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
																						text: `INSC. ESTADUAL: `,
																						alignment: 'left',
																						fontSize: 8, 
																						border: [false, false, false, false]
																					},
																					{
																						text: `${rgInscricaoPessoa}`,
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
																						text: nomeEmpresa,
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
																				text: '_____/_____/_______',
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

						impressos++;

					} 
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
