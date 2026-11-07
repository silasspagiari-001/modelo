'use strict';

const fs        = require('fs');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');

codes.loadModules(['code128'], {"includetext" : false});
codes.loadModules(['qrcode'], {"includetext" : false});

const dividirNFEs_doisEmDois = function( arr ){
	const restoDivisaoInteira = Math.floor( arr.length % 2 ),
	      quantosCabemEmPar   = Math.abs( arr.length - restoDivisaoInteira );

	let esquerda = [], 
	      direita = [],
		  //Qual desses arrays tem mais itens apos a divisao
		  ladoTemMais = null;

	//Preenche os que dao pra dividir 
	for( let i = 0 ; i < quantosCabemEmPar ; i += 2 ){
		esquerda.push( arr[i] );
		direita.push( arr[i+1] );
	}
	//Preenche o resto que sobrar
	for( let i = quantosCabemEmPar ; i < ( quantosCabemEmPar + restoDivisaoInteira ) ; i++ ){
		esquerda.push( arr[i] );
	}

	//Por padrao o lado que tem mais vai ser o da esquerda
	ladoTemMais = esquerda;
	if( esquerda.length != direita.length ){ ladoTemMais = esquerda.length > direita.length ? esquerda : direita };

	return {
		esquerda: esquerda,
		direita : direita,
		ladoTemMais: ladoTemMais
	}
}

module.exports = {
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			api.conhecimento().readById(id, params)
				.then(async res => {
					console.log(res);

					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [10, 5, 5, 5],
						background: [
						],									
						content: [
							{
								style: 'tableReport',
								table: { // Colunas (16x26)
									     // [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
									widths: [26, 26, 26, 26, 26, 26, 26, 20, 22, 22, 22, 22, 45, 35, 40, 16],
									body: []
								},
								style: {
									fontSize: 5
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0]
							}
						}
                    };
                    						
					let model       = res.results[0];
					const ITENS = model['CONHECIMENTOS_ITENS'];
					const nomeEmpresa = model['EMPRESAS_NOME'];
					const emiMan    = moment(model['CONHECIMENTOS_EMISSAO']);
					const situacaoTributaria = model['CONHECIMENTOS_BASEICMS'] > 0 ? '00 - Tributação normal' : '40 - ISENTO DO ICMS';
					const tipoCTE       = model['CONHECIMENTOS_TIPOCTE'] == 'N' ? 'NORMAL' : model['CONHECIMENTOS_TIPOCTE'] == 'C' ? 'COMPLEMENTO DE VALORES' : model['CONHECIMENTOS_TIPOCTE'] == 'S' ? 'SUBSTITUIÇÃO' : model['CONHECIMENTOS_TIPOCTE'];
					const tipoServico   = model['CONHECIMENTOS_TIPOSERVICO'] == 'N' ? 'NORMAL' : model['CONHECIMENTOS_TIPOSERVICO'] == 'S' ? 'SUB CONTRATAÇÂO' : model['CONHECIMENTOS_TIPOSERVICO'] == 'R' ? 'REDESPACHO' : model['CONHECIMENTOS_TIPOSERVICO'] == 'I' ? 'INTERMEDIÀRIO' : model['CONHECIMENTOS_TIPOSERVICO'];
					let notas       = model['CONHECIMENTOS_ITENS'];
					let rows        = docDefinition.content[0].table.body;
					const barcodes  = await getBarcode(model['CONHECIMENTOS_NFE']);
                    const qrcodes   = await getQrcode(model['CONHECIMENTOS_NFE']);
					let pagina      = 1;				
					let paginas     = Math.round(notas.length / 15) + ((notas.length % 15) > 0 ? 1: 0);
					let linhas;
					let itensPagina = 0;
					let pathLogo;
					
					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}
						
					for(let i in notas){
						if(itensPagina > 12 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
							if(itensPagina > 0) {                  // Se já imprimiu alguma página fecha o rodapé
                                rows.push(
									[
										{ 
											text: ' ',
											style: {
												fontSize: 0.5
											},
											colSpan: 16,									
											border: [true, false, true, true]
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									],
	
								)								
								pagina++;
							}
							itensPagina = 0; // Zera o contador de itens		
							
							//Monta os conhecimentos_itens
							const DOCUMENTOS_ORIGINAIS = {
								colSpan: 16,
								table: {
									widths: [250, 300],
									heighs: [80, 80],
									style: {
										fontSize: 12, 
										bold: true
									},
									body: [
										
									]
								},
								layout: 'tabletreport',											
								border: [true, true, true, true]
							};

							DOCUMENTOS_ORIGINAIS.table.body.push([
								{ 
									text: [
										{
											text: 'TP DOC.\t\t\t\t',
											alignment: 'left',
											style: {
												fontSize: 5
											}
										},
										{
											text: 'CHAVE DO DF-e',
											alignment: 'left',
											style: {
												fontSize: 5
											}
										}
									],
									alignment: 'left',
									style: {
										fontSize: 5
									},
									border: [false, false, false, false]
								},
								{ 
									text: [
										{
											text: 'TP DOC.\t\t\t\t\t\t\t',
											alignment: 'left',
											style: {
												fontSize: 5
											}
										},
										{
											text: 'CHAVE DO DF-e',
											alignment: 'left',
											style: {
												fontSize: 5
											}
										}
									],
									alignment: 'left',
									style: {
										fontSize: 5
									},
									border: [true, false, false, false]
								}
							]);

							//Divide os itens em dois em dois, para colocar nos 2 lados da folha(direita e esquerda)
							const ITENS_DIVIDIDOS = dividirNFEs_doisEmDois( ITENS ),
							      ITENS_ESQUERDA  = ITENS_DIVIDIDOS.esquerda,
								  ITENS_DIREITA   = ITENS_DIVIDIDOS.direita,
								  //Pega o lado que possui mais itens
								  ITENS_LADO_QUE_TEM_MAIS = ITENS_DIVIDIDOS.ladoTemMais;


							for( let ci = 0 ; ci < ITENS_LADO_QUE_TEM_MAIS.length ; ci++ ){
								const itemEsquerda = ITENS_ESQUERDA[ci] ? ITENS_ESQUERDA[ci]['CONHECIMENTOSITENS_NFE'] : '',
								      itemDireita  = ITENS_DIREITA [ci] ? ITENS_DIREITA [ci]['CONHECIMENTOSITENS_NFE'] : '';

								DOCUMENTOS_ORIGINAIS.table.body.push([
									{ 
										text: [
											{
												text: itemEsquerda != '' ? `NF-E\t\t\t\t\t\t` : '',
												alignment: 'left',
												style: {
													fontSize: 5
												}
											},
											{
												text: `${ itemEsquerda }`,
												alignment: 'left',
												style: {
													fontSize: 5
												}
											}
										],
										alignment: 'left',
										style: {
											fontSize: 5
										},
										border: [false, false, false, false]
									},
									{ 
										text: [
											{
												text: itemDireita != '' ? `NF-E\t\t\t\t\t\t` : '',
												alignment: 'left',
												style: {
													fontSize: 5
												}
											},
											{
												text: itemDireita,
												alignment: 'left',
												style: {
													fontSize: 5
												}
											}
										],
										alignment: 'left',
										style: {
											fontSize: 5
										},
										border: [true, false, false, false]
									}
								]);
							};

							rows.push(
								[
									{ 
										text: '\n',
										style: {
											fontSize: 1
										},
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: [
											{ 
												text: 'DECLARO QUE RECEBI OS VOLUMES DESTE CONHECIMENTO EM PERFEITO ESTADO PELO QUE DOU POR CUMPRIDO O PRESENTE CONTRATO DE TRANSPORTE.\n',
												alignment: 'center',
												style: {
													fontSize: 7
												}
											}
										]
									},{},{},
	
								],
								[
									{
										colSpan: 4,	
										table: {
											widths: [26, 26, 26, 26],
											heighs: [210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[	
													{
														text: 'NOME',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, false, false],
														colSpan: 4
													},{},{},{}
												],
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, true],
														colSpan: 4
													},{},{},{}
												],
												[	
													{
														text: 'RG',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, false, false],
														colSpan: 4
													},{},{},{}
												],
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, true],
														colSpan: 4
													},{},{},{}
												]
											]														
										},
										layout: 'tabletreport',											
										border: [true, false, false, true]
									},{},{},{},
									{
										colSpan: 6,	
										table: {
											widths: [24, 24, 24, 24, 23, 22],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, false, false],
														colSpan: 6
													},{},{},{},{},{}
												],
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false],
														colSpan: 6
													},{},{},{},{},{}
												],
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false],
														colSpan: 6
													},{},{},{},{},{}
												],
												[	
													{
														text: 'ASSINATURA/CARIMBO',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, true],
														colSpan: 6
													},{},{},{},{},{}
												]
											]														
										},
										layout: 'tabletreport',											
										border: [false, false, false, true]
									},{},{},{},{},{},
									{
										colSpan: 3,	
										table: {
											widths: [30, 30, 30],
											heighs: [210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[	
													{
														text: 'CHEGADA DATA/HORA',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, false, false],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: '_____/_____/________  ____:____',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: 'SAIDA DATA/HORA',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: '_____/_____/________  ____:____',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, true],
														colSpan: 3
													},{},{}
												]
											]														
										},
										layout: 'tabletreport',											
										border: [false, false, false, true]
									},{},{},
									{
										colSpan: 3,	
										table: {
											widths: [29, 29, 23],
											heighs: [210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[	
													{
														text: 'CT-E',
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, true, false],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: `N: ${ model['CONHECIMENTOS_NUMERO'] }`,
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, true, true],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: '\t',
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, true, true, false],
														colSpan: 3
													},{},{}
												],
												[	
													{
														text: `SERIE: ${ model['CONHECIMENTOS_SERIE'] }`,
														alignment: 'left',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, true, true],
														colSpan: 3
													},{},{}
												]
											]														
										},
										layout: 'tabletreport',											
										border: [false, false, true, true]
									},{},{}
									
								],
								[
									{ 
										text: '\n',
										style: {
											fontSize: 1
										},
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									/*
									{
										colSpan: 6,
										text: [
											
											{ 
												text: `${nomeEmpresa}\n\n`,
												alignment: 'center',
												style: {
													fontSize: 5
												}
											},
											
										]
									}*/
									{
										colSpan: 6,
										table: {
											widths: [70, 120],
											heighs: [210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{
														text: `${nomeEmpresa}\n\n`,
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: true
														},
														colSpan: 2,
														border: [false, false, false, false]
													},{}
												],
												[	
													{
														image: `${pathLogo}`,
														alignment: 'center',
														width: 70,
														height: 105,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [false, false, false, false]
													},
													{
														text: [
															{
																text: `${ model['PESSOAS_ENDERECO'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															},
															{
																text: `PERIMETRO URBANO\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['PESSOAS_CEP'] ) } - ${ model['ORIGEM_NOME'] } - ${ model['ORIGEM_UF'] } \n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															},
															{
																text: `CNPJ: ${ utils.string.maskCnp( model['EMPRESAS_CPFCNPJ'] ) } \n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['EMPRESAS_INSCRICAO'] } \n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															},
															{
																text: `TELEFONE: ${ utils.string.maskFone( model['EMPRESAS_TELEFONE'] ) } \n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																},
																colSpan: 2,
																border: [false, false, false, false]
															}
														],
														alignment: 'center',
														height: 210,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [false, false, false, false]
													}
												]
											]														
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},{},{},{},{},{},
									/*
									{
										colSpan: 6,
										text: [
											{ 
												text: 'DACTE\n',
												alignment: 'center',
												style: {
													fontSize: 5
												}
											},
											{
												text: `Documento Auxiliar do Conhecimento de Transporte Eletrônico\n`,
												alignment: 'center',
												style: {bold: true,	fontSize: 5}
											}
										]
									}*/
									{
										colSpan: 7,
										table: {
											widths: [25, 25, 42, 26, 70],
											heighs: [210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: 'DACTE\n',
														alignment: 'center',
														style: {
															fontSize: 5
														},
														colSpan: 5
													},
													{},{},{},{}
												],
												[
													{
														text: `Documento Auxiliar do Conhecimento de Transporte Eletrônico\n`,
														alignment: 'center',
														style: {bold: true,	fontSize: 5},
														colSpan: 5
													},
													{},{},{},{}
												],
												[
													{ 
														text: [
															{ 
																text: 'MODELO\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{ 
																text: `57\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 5,
																	bold: true
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: false
														}
													},
													{ 
														text: [
															{ 
																text: 'SÈRIE\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{ 
																text: `${ model['CONHECIMENTOS_SERIE'] }\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 5,
																	bold: true
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: false
														}
													},
													{ 
														text: [
															{ 
																text: 'NÙMERO\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{ 
																text: `${ model['CONHECIMENTOS_NUMERO'] }\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 5,
																	bold: true
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: false
														}
													},
													{ 
														text: [
															{ 
																text: 'FOLHA\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{ 
																text: `${pagina}/${paginas}\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 5,
																	bold: true
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: false
														}
													},
													{ 
														text: [
															{ 
																text: 'DATA HORA EMISSÂO\n',
																alignment: 'center',
																style: {
																	fontSize: 6
																}
															},
															{ 
																text: `${ model['CONHECIMENTOS_EMISSAO'] } ${ model['CONHECIMENTOS_HORA'] }\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 6,
																	bold: true
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: false
														}
													}
												],
												[
													barcodes ? {
														image: 'data:image/png;base64,' + barcodes,
														width: 230,
														height: 50,
														alignment: 'center',
														colSpan: 5													
												    } : {
														text: 'Sem código de barra',
														alignment: 'center',
														colSpan: 5
													},{},{},{},{}
												],
												[
													{ 
														text: [
															{
																text: 'CHAVE DE ACESSO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['CONHECIMENTOS_NFE'] }`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														colSpan: 5
													},{},{},{},{}
												]
											]
										}
									},{},{},{},{},{},{},
									/*
									{
										colSpan: 3,
										text: [
											{ 
												text: 'MODAL RODOVIÁRIO\n\n',
												alignment: 'center',
												style: {
													fontSize: 5
												}
											},
											{
												text: [
													{
														image: `${pathLogo}`,
														alignment: 'center',
														width: 230,
														height: 50,
														style: {
															fontSize: 5,
															bold: true
														},
														border: [false, false, false, false]
													}
												],
												alignment: 'center',
												style: {bold: true,	fontSize: 12}
											}
										]
									}*/
									{ 
										colSpan: 3,
										widths: [76,76,76,76,76,76,76,76,76,90],
										border: [true, true, true, true],
										table: {
											body: [
												[
													{ 
														text: 'MODAL',
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: true
														},
														colSpan: 10,
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
														text: 'RODOVIÁRIO\n',
														alignment: 'center',
														style: {
															fontSize: 5,
															bold: true
														},
														colSpan: 10,
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
														text: 'INSC. SUFRAMA DO DESTINATÁRIO\n\n\n',
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														colSpan: 10,
														border: [true, true, true, true]
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
													qrcodes ? {
														image: 'data:image/png;base64,' + qrcodes,
														width: 70,
														height: 70,
														alignment: 'center',
														colSpan: 10
													} : {
														width: 70,
														height: 70,
														text: 'SemQr',
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
										alignment: 'center'
									},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [25, 25, 25, 25, 25, 25, 110, 110, 110],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'TIPO DO CT-E\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ tipoCTE }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
													{ 
														text: [
															{
																text: 'TIPO DO SERVIÇO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ tipoServico }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
													{ 
														text: [
															{
																text: 'Consulta de autenticidade no portal nacional do CT-e, no site da Sefaz\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'Autorizadora, ou em http://www.cte.fazenda.gov.br/portal\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
												]
											]
										}
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [25, 25, 25, 25, 25, 25, 110, 110, 110],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'INDICADOR DO CT-E GLOBALIZADO\n\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'NÃO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
													{ 
														text: [
															{
																text: 'INFORMAÇÕES DO CT-E GLOBALIZADO\n\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
													{ 
														text: [
															{
																text: 'PROTOCOLO DE AUTORIZAÇÃO DE USO\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['CONHECIMENTOS_PROTOCOLO'] } \n`,
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 3
													},{},{},
												]
											]
										}
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [25, 25, 25, 25, 25, 25, 110, 110, 110],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'CFOP - NATUREZA DA OPERAÇÃO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['OPERACOES_ID'] } - ${ model['OPERACOES_NOME'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														colSpan: 9,
														border: [false, false, false, false]
													},
													{text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]},
												    {text: '', border: [false, false, false, false]},
													{text: '', border: [false, false, false, false]}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [250, 250],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'ORIGEM DA PRESTAÇÃO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['ORIGEM_NOME'] } - ${ model['ORIGEM_UF'] } - ${ model['ORIGEM_IBGE'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: 'DESTINO DA PRESTAÇÃO\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['DESTINO_NOME'] } - ${ model['DESTINO_UF'] } - ${ model['DESTINO_IBGE'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [250, 250],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: `REMETENTE: ${ model['PESSOAS_NOME'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `ENDEREÇO: ${ model['PESSOAS_ENDERECO'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `MUNICÍPIO:  ${ model['PESSOAS_CIDADE'] } -  ${ model['PESSOAS_UF'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['PESSOAS_CEP'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CPFCNPJ: ${ utils.string.maskCnp( model['PESSOAS_CPFCNPJ'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['PESSOAS_INSCRICAO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'PAÍS: Brasil\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `FONE: ${ utils.string.maskFone( model['PESSOAS_TELEFONE'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `DESTINATÁRIO: ${ model['DESTINATARIO_NOME'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `ENDEREÇO: ${ model['DESTINATARIO_ENDERECO'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `MUNICÍPIO: ${ model['DESTINATARIO_CIDADE'] } - ${ model['DESTINATARIO_UF'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['DESTINATARIO_CEP'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CPFCNPJ: ${ utils.string.maskCnp( model['DESTINATARIO_CPFCNPJ'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['DESTINATARIO_INSCRICAO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'PAÍS: Brasil\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `FONE: ${ utils.string.maskFone( model['DESTINATARIO_TELEFONE'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [250, 250],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: `EXPEDIDOR: ${ model['EXPEDIDOR_NOME'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `ENDEREÇO: ${ model['EXPEDIDOR_ENDERECO'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `MUNICÍPIO: ${ model['EXPEDIDOR_CIDADE'] } - ${ model['EXPEDIDOR_UF'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['EXPEDIDOR_CEP'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CPFCNPJ: ${ utils.string.maskCnp( model['EXPEDIDOR_CPFCNPJ'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['EXPEDIDOR_INSCRICAO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'PAÍS: Brasil\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `FONE: ${ utils.string.maskFone( model['EXPEDIDOR_TELEFONE'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `RECEBEDOR: ${ model['RECEBEDOR_NOME'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `ENDEREÇO: ${ model['RECEBEDOR_ENDERECO'] } \n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `MUNICÍPIO: ${ model['RECEBEDOR_CIDADE'] } - ${ model['RECEBEDOR_UF'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['RECEBEDOR_CEP'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CPFCNPJ: ${ utils.string.maskCnp( model['RECEBEDOR_CPFCNPJ'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['RECEBEDOR_INSCRICAO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'PAÍS: Brasil\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `FONE: ${ utils.string.maskFone( model['RECEBEDOR_TELEFONE'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [250, 250],
											heighs: [210, 210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: `TOMADOR DO SERVIÇO: ${ model['TOMADOR_NOME'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `ENDEREÇO: ${ model['TOMADOR_ENDERECO'] }\n\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CPFCNPJ: ${ utils.string.maskCnp( model['TOMADOR_CPFCNPJ'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `INSCRIÇÂO ESTADUAL: ${ model['TOMADOR_INSCRICAO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `MUNICÍPIO: ${ model['TOMADOR_CIDADE'] } - ${ model['TOMADOR_UF'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `CEP: ${ utils.string.maskCep( model['TOMADOR_CEP'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'PAÍS: Brasil\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `FONE: ${ utils.string.maskFone( model['TOMADOR_TELEFONE'] ) }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [200, 200, 200],
											heighs: [210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'PRODUTO PREDOMINANTE\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `${ model['CONHECIMENTOS_PRODUTO'] }\n`,
																alignment: 'left',
																style: {
																	fontSize: 5,
																	bold: true
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: 'OUTRAS CARACTERÍSTICAS DA CARGA\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'VALOR TOTAL MERCADORIA\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: `\t\tR$: ${ utils.number.float2moeda( model['CONHECIMENTOS_MERCADORIA'] ) }\n`,
																alignment: 'center',
																style: {
																	fontSize: 6,
																	bold: true
																}
															}
														],
														style: {
															fontSize: 6
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [100, 100, 100, 100, 100],
											heighs: [210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'PESO BRUTO (Kg)\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: 'PES BASE CALC (Kg)\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'PESO AFERIDO (Kg)\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'CUBAGEM (M3)\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'QTDE. VOLUMES (Unid)\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'COMPONENTES DO VALOR DA PRESTAÇÃO DE SERVIÇO',
										style: {
											fontSize: 5,
											bold: true
										},
										alignment: 'center',
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [100, 100, 100, 100, 114],
											heighs: [210, 210, 210, 210, 210],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'NOME',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'VALOR',
																alignment: 'right',
																style: {
																	fontSize: 5
																}
															}
														],
														style: {
															fontSize: 5
														},
														border: [true, true, true, true]
													},
													{ 
														text: [
															{
																text: 'NOME',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'VALOR',
																alignment: 'right',
																style: {
																	fontSize: 5
																}
															}
														],
														style: {
															fontSize: 5
														},
														border: [true, true, true, true]
													},
													{ 
														text: [
															{
																text: 'NOME',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'VALOR',
																alignment: 'right',
																style: {
																	fontSize: 5
																}
															}
														],
														style: {
															fontSize: 5
														},
														border: [true, true, true, true]
													},
													{ 
														text: [
															{
																text: 'NOME',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\t\t\t\t\t\t\t\t\t\t\t\t\t\t',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'VALOR',
																alignment: 'right',
																style: {
																	fontSize: 5
																}
															}
														],
														style: {
															fontSize: 5
														},
														border: [true, true, true, true]
													},
													{ 
														text: [
															{
																text: [
																	{
																		text: 'VALOR TOTAL DO SERVIÇO\n',
																		alignment: 'left'
																	},
																	{
																		text: `R$: ${ utils.number.float2moeda( model['CONHECIMENTOS_SERVICOS'] ) }`,
																		alignment: 'right',
																		style: {
																			fontSize: 6,
																			bold: true
																		}
																	}
																],
																alignment: 'left',
																style: {
																	fontSize: 6
																}
															},
															{
																text: '\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: [
																	{
																		text: 'VALOR A RECEBER\n',
																		alignment: 'left'
																	},
																	{
																		text: `R$: ${ utils.number.float2moeda( model['CONHECIMENTOS_SERVICOS'] ) }`,
																		alignment: 'right',
																		style: {
																			fontSize: 6,
																			bold: true
																		}
																	}
																],
																alignment: 'left',
																style: {
																	fontSize: 6
																}
															}
														],
														style: {
															fontSize: 6
														},
														border: [true, true, true, true]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'INFORMAÇÕES RELATIVAS AO IMPOSTO',
										style: {
											fontSize: 5,
											bold: true
										},
										alignment: 'center',
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [140, 90, 90, 90, 90],
											heighs: [80, 80, 80, 80, 80],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'SITUAÇÃO TRIBUTÁRIA',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: 'BASE DE CÁLCULO',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'ALÍQ. ICMS',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: 'VALOR ICMS',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: '% RED.BC.CALC',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												],
												[
													{ 
														text: [
															{
																text: `${situacaoTributaria}`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `${ model['CONHECIMENTOS_BASEICMS'] }`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: `${ model['CONHECIMENTOS_ALIQUOTAICMS'] }`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: `${ model['CONHECIMENTOS_VALORICMS'] }`,
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: '',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5,
															bold: true
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'DOCUMENTOS ORIGINAIS',
										style: {
											fontSize: 5,
											bold: true
										},
										alignment: 'center',
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									DOCUMENTOS_ORIGINAIS,
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'OBSERVAÇÔES',
										style: {
											fontSize: 5,
											bold: true
										},
										alignment: 'center',
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [100, 100, 100, 100, 100],
											heighs: [80, 80, 80, 80, 80],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'DADOS ESPECÍFICOS DO MODAL RODOVIÁRIO',
										style: {
											fontSize: 5,
											bold: true
										},
										alignment: 'center',
										colSpan: 16,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [100, 130, 200],
											heighs: [80, 80, 80, 80, 80],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'RNTRC DA EMPRESA\n\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: 'XXXXXXXXX',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: 'DATA PREVISTA DE ENTREGA\n\n',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															},
															{
																text: '',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													},
													{ 
														text: [
															{
																text: '\nESTE CONHECIMENTO DE TRANSPORTE ATENDE À LEGISLAÇÃO DE TRANSPORTE RODOVIÁRIO EM VIGOR',
																alignment: 'left',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'left',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										table: {
											widths: [300, 200],
											heighs: [80, 80],
											style: {
												fontSize: 12, 
												bold: true
											},
											body: [
												[
													{ 
														text: [
															{
																text: 'USO EXCLUSIVO DO EMISSOR DO CT-E',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `RESERVADO AO FISCO`,
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												],
												[
													{ 
														text: [
															{
																text: '\n\n\n',
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [false, false, false, false]
													},
													{ 
														text: [
															{
																text: `\n\n\n`,
																alignment: 'center',
																style: {
																	fontSize: 5
																}
															}
														],
														alignment: 'center',
														style: {
															fontSize: 5
														},
														border: [true, false, false, false]
													}
												]
											]
										},
										layout: 'tabletreport',											
										border: [true, true, true, true]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										text: 'Sistema Samos - www.samos.com.br',
										colSpan: 16,
										alignment: 'right',
										style: {
											fontSize: 5
										},
										layout: 'noborders',											
										border: [false, false, false, false]
									},
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);
						}
						/*
						rows.push(
							[
								{
									colSpan: 16,
									text: notas[i]['CONHECIMENTOSITENS_NFE'], style: {fontSize: 12},
									border: [true, false, true, false]
								},
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						)*/
						itensPagina++
					}

					/*
					for (linhas = itensPagina; linhas < 12; linhas++) {  // Aqui completamos a grid com linhas em branco
						rows.push(
							[
								{
									colSpan: 16,
									text: ' ',
									style: {fontSize: 12},
									border: [true, false, true, false]
								},
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						)						
					}*/
					
					rows.push( // fecha o rodapé
						[
							{ 
								text: ' ',
								style: {
									fontSize: 0.5
								},
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
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