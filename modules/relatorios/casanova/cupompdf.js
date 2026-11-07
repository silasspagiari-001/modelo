'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const processosExecutaSql = require('../../processos/executasql');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

const codes = require('rescode');
codes.loadModules(['interleaved2of5'], {"includetext" : true});

//Implementado do sencha Ext.apply
function aplicarParametros(object, config)
{
	if (object && config && typeof config === 'object') {
		let i, j, k;
		for (i in config) {
			object[i] = config[i];
		}
	}
	return object;
}

module.exports = {
    read: async (params, req, data) => {
        return new Promise((resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
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

					let rows = docDefinition.content[0].table.body;

					if( params.cancelado && params.cancelado == true ){
						docDefinition['background'] = [					
							{  
								svg: `<svg><text
											transform="translate(50, 800) rotate(-50)"
											font-weight="bold"
											fill= "gray"
											style="font-size: 35px;"
										>
											Cupom CANCELADO - Por motivo de emissão indevida
										</text></svg>`
							} 
						]
					}

					let localPagamento = '';
					let campoEndereco = '';
					let campoNumero =  '';
					let campoBairro = '';
					let campoCep = '';
					let campoCpfcnpj = '';
					let campoCidade = '';
					let campoEstado = '';
					let impressos = 0;
					let base64qrcode = (await base64HttpDecode(params.base64qrcode));

					for(let i in res.results){
						let model           = res.results[i];
						let PRODUTOS = model['MOVIMENTOS_ITENS'];

						let parametrosBuscaPessoa = {
							nomeSql: 'getpessoafrommovimentos',
							parametroSql: JSON.stringify({
								busca: model['MOVIMENTOS_ID']
							})
						};
						//Copia os parametros para dentro
						parametrosBuscaPessoa = aplicarParametros(parametrosBuscaPessoa, params);

						let pessoaMovimento = (await processosExecutaSql.read(parametrosBuscaPessoa)).results[0];
						
						//Tambem pega mais alguns dados do cupom
						let noSat       = model['MOVIMENTOS_PROTOCOLO'];
						let nfeCupom    = model['MOVIMENTOS_NFE'];
						let protocolo   = model['MOVIMENTOS_PROTOCOLO'];
						
						let dataEmissao = moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY');
						let horaEmissao = model['MOVIMENTOS_HORA'];

						let nomeEmpresa     = model['EMPRESAS_NOME'];
						let cpfcnpj = utils.string.maskCnp( model['EMPRESAS_CPFCNPJ'] );
						let fantasia = model['EMPRESAS_FANTASIA'];
						let inscricaoEstadual = model['EMPRESAS_INSCRICAO'];
						let inscricaoMunicipal = '00000';
						let celularEmpresa  = model['EMPRESAS_CELULAR']; 
						let telefoneEmpresa = utils.string.maskFone( model['EMPRESAS_TELEFONE'] );
						let email = model['EMPRESAS_EMAIL'];
						let endereco = model['EMPRESAS_ENDERECO'];
						let numero = model['EMPRESAS_NUMERO'];
						let cidade = model['CIDADES_NOME'];
						let cep = utils.string.maskCep( model['PESSOAS_CEP'] );
						let bairro = model['EMPRESAS_BAIRRO'];
						let estado = model['CIDADES_ESTADO'];
						let numeroExtrato = model['MOVIMENTOS_NUMERO'];

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
						let cidadePessoa   = pessoaMovimento['CIDADES_NOME'];
						let estadoPessoa   = pessoaMovimento['CIDADES_ESTADO'];
						let rgInscricaoPessoa = model['PESSOAS_INSCRICAO'];
						let cpfcnpjPessoa = utils.string.maskCnp( model['PESSOAS_CPFCNPJ'] );

						let total = model['FINANCEIROS_ABERTO'];
						let parcelaAtual = model['FINANCEIROS_PARCELA'];
						let parcelas = model['FINANCEIROS_PARCELAS'];
						let prazo = model['PRAZOS_NOME'];
						let baixa = model['FINANCEIROS_BAIXA'];
						let descontos = model['FINANCEIROS_DESCONTOS'];
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
						
						if(impressos > 0) {
							rows.push([
								{
									text: '\n',
									fontSize: 6,
									pageBreak: 'before',
									border: [false, false, false, false],
									colSpan: 6
								},{},{},{},{},{}
							])
						} else {
							rows.push([
								{
									text: '\n',
									fontSize: 6,									
									border: [false, false, false, false],
									colSpan: 6
								},{},{},{},{},{}
							])
						}

						const arrayProdutos = [
							[
								{
									text: '#',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'código',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'mercadoria',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'qtde',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'un',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'unit R$',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: 'trib R$',
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								}
							]
						];

						let totalQuantidadeProdutos = 0;
						let totalPrecosProdutosUnidade = 0;
						let totalTributacaoProdutos = 0;
						let totalDinheiroPrecosProdutosUnidade = 0; 
						let ultimoProduto = null;
						//Adiciona os produtos dinamicamente
						for( let i = 0 ; i < PRODUTOS.length ; i++ ){
							const produtoAtual = PRODUTOS[i];

							//Se o produto mudou, zera os totais
							if( ultimoProduto != produtoAtual['MOVIMENTOSITENS_ID_PRODUTOS'] ){
								totalQuantidadeProdutos = 0;
								totalPrecosProdutosUnidade = 0;
								totalTributacaoProdutos = 0;
								totalDinheiroPrecosProdutosUnidade = 0;
								ultimoProduto = produtoAtual['MOVIMENTOSITENS_ID_PRODUTOS'];
							}

							//Aqui na hora de somar eu converto pra cents, mais depois la em baixo na hora de exibir esses totais eu desconverto
							totalQuantidadeProdutos += produtoAtual['MOVIMENTOSITENS_QUANTIDADE'];
							totalPrecosProdutosUnidade += cents(produtoAtual['MOVIMENTOSITENS_PRECO']);
							totalTributacaoProdutos += cents(produtoAtual['MOVIMENTOSITENS_IMPOSTO']);
							totalDinheiroPrecosProdutosUnidade += cents(produtoAtual['MOVIMENTOSITENS_PRECO']);

							arrayProdutos.push([
								{
									text: `${ produtoAtual['MOVIMENTOSITENS_ID_PRODUTOS'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['MOVIMENTOSITENS_ID'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['PRODUTOS_NOME'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['MOVIMENTOSITENS_QUANTIDADE'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['PRODUTOS_UNIDADE'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['MOVIMENTOSITENS_PRECO'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								},
								{
									text: `${ produtoAtual['MOVIMENTOSITENS_IMPOSTO'] }`,
									alignment: 'left',
									fontSize: 8, 
									border: [false, false, false, false]
								}
							]);
						}

						
						//Imprime os totais dos produtos
						arrayProdutos.push([
							{
								text: `TOTAIS R$`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: `${ totalQuantidadeProdutos }`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: `${ totalPrecosProdutosUnidade / 100 }`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: `${ totalTributacaoProdutos / 100 }`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							}
						]);

						//Imprime os totais de dinheiro
						arrayProdutos.push([
							{
								text: `DINHEIRO`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: `${ totalDinheiroPrecosProdutosUnidade / 100 }`,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							},
							{
								text: ``,
								alignment: 'left',
								fontSize: 8, 
								border: [false, false, false, false],
							}
						]);

						//Calcula o valor dos tributos exibidos abaixo
						let valorTributos = 0;
						let valorTributosEstaduais = 0;
						let valorTributosFederais = 0;

						//Parte de baixo
						rows.push([
							{
								table: {
									widths: [85, 85, 85, 85, 75, 75],
									heighs: [600, 600, 600, 600, 600, 600],
									body: [
										[
											{
												text: `Extrato impresso em folha sulfite:`,
												alignment: 'center',
												fontSize: 12, 
												colSpan: 6,
												border: [false, false, false, false],
												style: {
													bold: true,
													color: 'red'
												}
											},
											{},{},{},{},{}
										],
										[
											{
												text: '',
												border: [false, false, false, true],
												alignment: 'left'
											},
											{
												image: `${appRoot}/resources/images/nfe/default.png`,
												width: 65,
												alignment: 'left',
												border: [false, false, false, true]
											},
											{
												text: [
													{
														text: `\n** SEM VALIDADE FISCAL **`,
														alignment: 'left',
														fontSize: 8, 
														colSpan: 2
													},
													{
														text: `\nCREDI 7 ON LINE`,
														alignment: 'left',
														fontSize: 8, 
													},
													{
														text: `\n${endereco}`,
														alignment: 'left',
														fontSize: 8, 
													},
													{
														text: `\nCNPJ ${cpfcnpj} IE ${inscricaoEstadual} IM ${inscricaoMunicipal}`,
														alignment: 'left',
														fontSize: 8, 
													}
												],
												colSpan: 4,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, true]
											},{},{},{}
										],
										[
											{
												text: [
													{
														text: `Extrato ${numeroExtrato}`,
														alignment: 'center',
														fontSize: 8
													},
													{
														text: `\nCUPOM FISCAL ELETRONICO - SAT`,
														alignment: 'center',
														fontSize: 8 
													}
												],
												colSpan: 6,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, true],
											},{},{},{},{},{}
										],
										[
											{
												text: [
													{
														text: `\nCPF/CNPJ do consumidor: ${cpfcnpjPessoa}`,
														alignment: 'center',
														fontSize: 8 
													}
												],
												colSpan: 6,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, true],
											},{},{},{},{},{}
										],
										[	
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
																	widths: [40, 60, 150, 70, 60, 80, 60, 60],
																	style: {
																		fontSize: 8, 
																		bold: true
																	},
																	body: arrayProdutos,
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
											},{
												text: '',
												border: [false, false, false, false]
											}
										],
										[
											{
												text: [
													{
														text: '\n*Valor aproximado dos tributos (Lei Fed. 12.741/2012)',
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\nTributos: ${valorTributos} Fed/${valorTributosFederais} Est/${valorTributosEstaduais} Mun/fonte: IBPT`,
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\nCPF/CNPJ: ${cpfcnpjPessoa}`,
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\nNome: ${nomePessoa}`,
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\nEndereço: ${enderecoPessoa}`,
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\n${cepPessoa} ${bairroPessoa} ${cidadePessoa} ${estadoPessoa}`,
														alignment: 'left',
														fontSize: 8, 
														border: [false, false, false, false]
													}
												],
												colSpan: 6,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, true],
											},{},{},{},{},{}
										],
										[
											{
												text: [
													{
														text: 'ICMS A SER RECOLHIDO CONFORME LC123/2006',
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: '\nSIMPLES NACIONAL',
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: '\nCrediMAX 7.061.08',
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													}
												],
												colSpan: 6,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, true],
											},{},{},{},{},{}
										],
										[
											{
												text: [
													{
														text: `SAT No. ${noSat}`,
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\n${dataEmissao} - ${horaEmissao}`,
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													},
													{
														text: `\n${ nfeCupom }`,
														alignment: 'center',
														fontSize: 8, 
														border: [false, false, false, false]
													}
												],
												colSpan: 6,
												alignment: 'left',
												fontSize: 8, 
												border: [false, false, false, false],
											},{},{},{},{},{}
										],
										[
											/*
											(barcodes ? {
												image: 'data:image/png;base64,' + barcodes,
												width: 230,
												height: 50,
												colSpan: 6,
												border: [false, false, false, false]
											} : {
												text: '',
												colSpan: 6,
												border: [false, false, false, false]
											}),*/
											{
												text: '',
												colSpan: 6,
												border: [false, false, false, false]
											},
											{},{},{},{},{}
										],
										[
											(base64qrcode ? {
												image: base64qrcode,
												width: 128,
												height: 128,
												colSpan: 6,
												alignment: 'center',
												border: [false, false, false, false]
											} : {
												text: '',
												colSpan: 6,
												border: [false, false, false, false]
											}),
											{},{},{},{},{}
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

const getBarcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('code128', chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};

const base64HttpDecode = function(s) {
	s = s.replace(/-/g, '+');
	s = s.replace(/_/g, '/');
	while (s.length % 4) {
		s += '=';
	}

	return atob(s);
}