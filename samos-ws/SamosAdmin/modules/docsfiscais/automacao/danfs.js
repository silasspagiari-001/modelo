'use strict';

const fs        = require('fs');
const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const moment    = require('moment-timezone');

module.exports = {
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			api.notaservicos().readById(id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 20],
						background: [
							{  
								svg: `<svg><text
											transform="translate(18, 400) rotate(-90)"
											font-weight="bold"
											fill= "gray"
											style="font-size: 20px;"
										>
											ESPELHO DA NFS-E - SEM VALOR FISCAL
										</text></svg>`
							} 
						],									
						content: [
							{
								style: 'tableReport',  //                                        30  30  36
								         //  26  26  24  24  24                             
								table: { //   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16 Colunas 
									widths: [29, 29, 25, 24, 24, 28, 28, 22, 22, 22, 22, 22, 30, 34, 22, 29],
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
                    						
					let model       = res.results[0];
					const emiNFS    = moment(model['ORDENS_EMISSAO']);
					let servicos    = model['ORDENS_SERVICOSITENS'];
					let rows        = docDefinition.content[0].table.body;
					let pagina      = 1;				
					let paginas     = Math.round(servicos.length / 15) + ((servicos.length % 15) > 0 ? 1: 0);
					let linhas;
					let itensPagina = 0;
					let pathLogo;
					let pathBrasao;

					rows.push(
						[
							{ 
								text: 'NFS-e COMPOSTA POR 1 PÁGINA(S)',
								fontSize: 8,
								colSpan: 16,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					)								


					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
						pathBrasao = utils.client.getImagePath(`logos/nfe/bra${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
						pathBrasao = `${appRoot}/resources/images/nfe/bradefault.png`;
					}
						
					for(let i in servicos){
						if(itensPagina > 12 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
							if(itensPagina > 0) {                  // Se já imprimiu alguma página fecha o rodapé
                                rows.push(
									[
										{ 
											text: '',
											colSpan: 16,									
											border: [true, false, true, true]
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									],
	
								)								
								pagina++;
							}
							itensPagina = 0; // Zera o contador de itens							
							rows.push(
								[
									{
										image: `${pathBrasao}`,
										fit: [60, 60],
										colSpan: 2,
										width: 50,
										alignment: 'center',
										border: [true, true, false, false]
									},{},
									{
										colSpan: 8,
										text: `Prefeitura Municipal de ${model['CIDADES_NOMEEMPRESA'].slice(0, 1)}${model['CIDADES_NOMEEMPRESA'].slice(1, 30).toLowerCase()}\n\nDepartamento de Arrecadação e Tributação\n\nNOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e`,
										bold: true, 
										fontSize: 10,
										alignment: 'center',
										border: [false, true, false, false]
									},{},{},{},{},{},{},{},
									{
										colSpan: 2,
										border: [false, true, true, false],
										alignment: 'center',
										bold: true,
										table: {
											body: [[`NF-Se\nESPELHO\nSEM VALOR FISCAL`]],
										}
									},{},
									{
										text: [
											{ text: `lb\n`, style: {color: 'white', fontSize: 2}},
											{ 
												text: `Número da NFS-e\n`,
												style: {
													fontSize: 8,
													bold: true
												}
											},
											{ text: `lb\n`, style: {color: 'white', fontSize: 2}},
											{
												text: `${model['ORDENS_NUMERO']}`,
												style: {
													fontSize: 10,
													bold: true
												}
											},
											{ text: `lb\n`, style: {color: 'white', fontSize: 2}},											
											{
												text: `Código de Verificação de Autenticidade\n`,
												fontSize: 8
											},
											{
												text: `${model['ORDENS_PROTOCOLO']}\n`,
												fontSize: 9,
												bold: true
											},
											{ text: `lb\n`, style: {color: 'white', fontSize: 2}},
											{
												text: `Data e Hora de Emissão da NFS-e\n`,
												fontSize: 8
											},
											{
												text: `${emiNFS.format('DD/MM/YYYY')} às ${model['ORDENS_HORAEMISSAO']}\n`,
												fontSize: 9,
												bold: true
											},
											{ text: `lb\n`, style: {color: 'white', fontSize: 2}},											
											{
												text: `Chave de Acesso\n`,
												italics: true,
												fontSize: 8
											},
											{
												text: `${model['ORDENS_NFE']}\n\n\n`,
												fontSize: 7
											},
											{
												text: 'Para certificação da autenticidade acesse\nhttp://online.martinopolis.sp.gov.br:8081/issweb, menu consultas e informe os dados desta NFS-e.',
												fontSize: 7,
												bold: true
											}
										],
										alignment: 'center',
										colSpan: 4,
										rowSpan: 5,
										border: [false, true, true, true]
									},{},{},{},
								],								
								[
									{ 
										text: 'Informações Fiscais',
										style: {
											fontSize: 10,
											fillColor: '#E3E3E3',													
											bold: true
										},
										colSpan: 12,									
										border: [true, false, true, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},
									{},{},{},{} // 4 colunas sobrepostas pelo rowSpan do bloco à direita
								],
								[
									{ 
										text: [
											{
												text: 'Exigibilidade do ISS\n',
												fontSize: 6
											},
											{
												text: 'Exigível\n',
												bold: true,
												fontSize: 8
											}
										],
										border: [true, false, false, false],
										colSpan: 2
									},{},
									{
										text: 'Número do Processo',
										fontSize: 6,
										border: [false, false, false, false],
										colSpan: 3
									},{},{},
									{
										text: [
											{
												text: 'Município de Incidência do ISS\n',
												fontSize: 6		
											},
											{
												text: `${model['CIDADES_NOMEINCIDENCIA']}/${model['CIDADES_ESTADOINCIDENCIA']}`,
												fontSize: 7.5,
												bold: true												
											}
										],
										colSpan: 3,
										border: [false, false, false, false],
									},{},{},
									{
										text: [
											{
												text: 'Local da Prestação\n',
												fontSize: 6		
											},
											{
												text: `${model['CIDADES_NOMEPRESTACAO']}/${model['CIDADES_ESTADOPRESTACAO']}`,
												fontSize: 7.5,
												bold: true
											}
										],
										colSpan: 4,
										border: [false, false, true, false],
									},{},{},{},
									{},{},{},{} // 4 colunas sobrepostas pelo rowSpan do bloco à direita
								],
								[
									{ 
										text: [
											{
												text: 'Número do RPS\n',
												fontSize: 6
											},
											{
												text: 'A\n',
												color: 'white',
												fontSize: 10
											}
										],
										border: [true, true, false, false],
										colSpan: 2
									},{},
									{
										text: 'Série do RPS',
										fontSize: 6,
										border: [false, true, false, false],
										colSpan: 2
									},{},
									{
										text: 'Tipo do RPS',
										fontSize: 6,
										border: [false, true, false, false],
										colSpan: 2
									},{},
									{
										text: [
											{
												text: 'Data do RPS',
												fontSize: 6		
											}
										],
										colSpan: 2,
										border: [false, true, false, false],
									},{},
									{
										text: [
											{
												text: 'Competência\n',
												fontSize: 6		
											},
											{
												text: emiNFS.format('DD/MM/YYYY'),
												style: {
													fontSize: 8,
													bold: true
												}
											}
										],
										colSpan: 4,
										alignment: 'center',
										border: [false, true, true, false],
									},{},{},{},
									{},{},{},{} // 4 colunas sobrepostas pelo rowSpan do bloco à direita
								],	
								[
									{ 
										text: [
											{
												text: 'Optante Simples Nacional\n',
												fontSize: 6
											},
											{
												text: '2 - Não',
												bold: true,
												fontSize: 7.5
											}
										],
										border: [true, true, false, true],
										colSpan: 3
									},{},{},
									{
										text: [
											{
												text: 'Incentivo Fiscal\n',
												fontSize: 6
											},
											{
												text: '1 - Sim',
												bold: true,
												fontSize: 7.5
											}
										],
										fontSize: 6,
										border: [false, true, false, true],
										colSpan: 3
									},{},{},
									{
										text: [
											{
												text: 'Regime Especial Tributação\n',
												fontSize: 6
											},
											{
												text: 'Não Possui',
												bold: true,
												fontSize: 7.5
											}
										],
										border: [false, true, false, true],
										colSpan: 3
									},{},{},
									{
										text: [
											{
												text: [
													{
														text: 'Tipo ISS\n',
														fontSize: 6
													},
													{
														text: '03 - Sobre Faturamento',
														bold: true,
														fontSize: 7.5
													}
												]
											}
										],
										colSpan: 3,
										border: [false, true, true, true]
									},{},{},
									{},{},{},{} // 4 colunas sobrepostas pelo rowSpan do bloco à direita
								],																
								[
									{
										colSpan: 16,
										text: '',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: 'PRESTADOR DE SERVIÇOS',
										style: {
											fontSize: 9,
											fillColor: '#E3E3E3',													
											bold: true
										},
										border: [true, true, true, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										image: `${pathLogo}`,
										fit: [60, 60],
										colSpan: 2,
										rowSpan: 3,
										width: 50,
										alignment: 'center',
										border: [true, false, true, true]
									},{},
									{
										colSpan: 3,
										text: [
											{ 
												text: 'CPF/CNPJ\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']) || ' '}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]
									},{},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'RG/Inscrição Estadual\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_INSCRICAO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Inscrição Municipal\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_MUNICIPAL']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Cadastro\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `000017813`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 5,
										text: [
											{ 
												text: 'Nome/Razão Social\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_NOME']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, false]										
									},{},{},{},{}
								],
								[
									{},{}, // Span do logo
									{
										colSpan: 7,
										text: [
											{ 
												text: 'Logradouro\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_ENDERECO']}, ${model['EMPRESAS_NUMERO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]
									},{},{},{},{},{},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Complemento\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: ``,
												style: {fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 5,
										text: [
											{ 
												text: 'Bairro\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_BAIRRO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, false]										
									},{},{},{},{}
								],
								[
									{},{}, // Span do logo
									{
										colSpan: 2,
										text: [
											{ 
												text: 'CEP\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskCep(model['EMPRESAS_CEP'])}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, true]
									},{},
									{
										colSpan: 4,
										text: [
											{ 
												text: 'Cidade\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, true]
									},{},{},{},
									{
										colSpan: 3,
										text: [
											{ 
												text: 'Telefone\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}`,
												style: {fontSize: 8}
											}
										],
										border: [false, false, false, true]
									},{},{},
									{
										colSpan: 5,
										text: [
											{ 
												text: 'E-mail\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['EMPRESAS_EMAIL']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, true]
									},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: '',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: 'TOMADOR DE SERVIÇOS',
										style: {
											fontSize: 9,
											fillColor: '#E3E3E3',													
											bold: true
										},
										border: [true, true, true, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 3,
										text: [
											{ 
												text: 'CPF/CNPJ/Documento\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ']) || ' '}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [true, false, false, false]
									},{},{},
									{
										colSpan: 3,
										text: [
											{ 
												text: 'RG/Inscrição. Estadual\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['PESSOAS_INSCRICAO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Inscrição Municipal\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: '',//`${model['PESSOAS_IBGE']}`, // VER DEPOIS QUE CAMPO USAR NO LUGAR
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 8,
										text: [
											{ 
												text: 'Nome/Razão Social\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['PESSOAS_NOME']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, false]										
									},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 9,
										text: [
											{ 
												text: 'Logradouro\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['PESSOAS_ENDERECO']}, ${model['PESSOAS_NUMERO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [true, false, false, false]
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Complemento\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: ``,
												style: {fontSize: 8}
											}
										],
										border: [false, false, false, false]										
									},{},
									{
										colSpan: 5,
										text: [
											{ 
												text: 'Bairro\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['PESSOAS_BAIRRO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, false]										
									},{},{},{},{}
								],
								[
									{
										colSpan: 2,
										text: [
											{ 
												text: 'CEP\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskCep(model['PESSOAS_CEP'])}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [true, false, false, true]
									},{},
									{
										colSpan: 4,
										text: [
											{ 
												text: 'Cidade/País\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['CIDADES_NOME']} - ${model['CIDADES_ESTADO']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, false, true]
									},{},{},{},
									{
										colSpan: 2,
										text: [
											{ 
												text: 'Cód IBGE\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['CIDADES_IBGE']}`,
												style: {fontSize: 8, bold: true}
											}
										],
										border: [false, false, false, true]
									},{},
									{
										colSpan: 3,
										text: [
											{ 
												text: 'Telefone\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${utils.string.maskFone(model['PESSOAS_TELEFONE'])}`,
												style: {fontSize: 8, bold: true}
											}
										],
										border: [false, false, false, true]
									},{},{},
									{
										colSpan: 5,
										text: [
											{ 
												text: 'E-mail\n',
												style: {
													fontSize: 6
												}
											},
											{
												text: `${model['PESSOAS_EMAIL']}`,
												style: {bold: true,	fontSize: 8}
											}
										],
										border: [false, false, true, true]
									},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: '',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 16,
										text: 'DESCRIÇÃO DOS SERVIÇOS',
										style: {
											fontSize: 8,
											fillColor: '#E3E3E3',													
											bold: true
										},
										border: [true, true, true, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										text: 'Qtde',
										alignment: 'right',
										fontSize: 7,
										bold: true,
										border: [true, false, false, true]
									},
									{
										text: 'Un. Medida',
										alignment: 'center',										
										fontSize: 7,	
										bold: true,									
										colSpan: 2,
										border: [false, false, false, true]
									},{},
									{
										text: 'Descrição',
										fontSize: 7,	
										bold: true,																													
										colSpan: 9,
										border: [false, false, false, true]										
									},{},{},{},{},{},{},{},{},
									{
										text: 'Vlr Unitário',
										fontSize: 7,
										bold: true,
										alignment: 'right',
										colSpan: 2,
										border: [false, false, false, true]										
									},{},
									{
										text: 'Total',
										fontSize: 7,
										bold: true,
										alignment: 'right',
										colSpan: 2,
										border: [false, false, true, true]
									},{}
								]

							);
						}

						rows.push(
							[
								{
									text: servicos[i]['ORDENSSERVICOS_QUANTIDADE'],
									alignment: 'right',
									fontSize: 7,
									bold: true,
									border: [true, false, false, false]
								},
								{
									text: 'UN',
									alignment: 'center',
									fontSize: 7,
									colSpan: 2,
									bold: true,
									border: [false, false, false, false]
								},{},
								{
									text: servicos[i]['ORDENSSERVICOS_DESCRITIVO'].toUpperCase(),
									fontSize: 7,	
									bold: true,																													
									colSpan: 10,
									border: [false, false, false, false]										
								},{},{},{},{},{},{},{},{},{},
								{
									text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_PRECO']),
									fontSize: 7,
									bold: true,
									alignment: 'right',
									border: [false, false, false, false]										
								},
								{
									text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_TOTAL']),
									fontSize: 7,
									bold: true,
									alignment: 'right',
									colSpan: 2,
									border: [false, false, true, false]
								},{}
							]
						)
						itensPagina++
					}

					for (linhas = itensPagina; linhas < 7; linhas++) {  // Aqui completamos a grid com linhas em branco
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
					}
					
					rows.push( // fecha o rodapé
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
						]
					);

					rows.push(
						[
							{
								colSpan: 16,
								text: '',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: 'Imposto Sobre Serviços de Qualquer Natureza - ISS',
								style: {
									fontSize: 8,
									fillColor: '#E3E3E3',													
									bold: true
								},
								border: [true, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: [
									{
										text: 'LC 116/2003:',
										fontSize: 7
									},
									{
										text: 'aa',
										color: 'white',
										fontSize: 7
									},
									{
										text: `${model['ORDENS_CODIGOSERVICO']}\n`,
										bold: true,
										fontSize: 7
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${nomeServico(model['ORDENS_CODIGOSERVICO'], params).slice(8, 115)}`,
										bold: true,
										fontSize: 7
									}

								],
								colSpan: 10,
								alignment: 'left',
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{},
							{
								text: [
									{
										text: 'Alíquota\n',
										alignment: 'right',								
										fontSize: 7,
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${utils.number.float2moeda(model['ORDENS_ALIQUOTAISS'])}%`,
										alignment: 'right',
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: [
									{
										text: 'Atividade Município\n',
										alignment: 'right',
										fontSize: 7		
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${('000000' + (model['ORDENS_CODIGOSERVICO'] || '').split('.')[0]).slice(-6)}${('0000000' + (model['ORDENS_CODIGOSERVICO'] || '').split('.')[1]).slice(-7)}`,
										alignment: 'right',
										fontSize: 7,								
										bold: true		
									}
								],
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: [
									{
										text: 'Código CNAE\n',
										alignment: 'right',								
										fontSize: 7
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: model['ORDENS_TRIBUTACAO'],
										alignment: 'right',	
										bold: true,							
										fontSize: 7
									}
								],
								colSpan: 2,
								border: [false, false, true, false]
							},{},
						],
						[
							{
								text: [
									{
										text: 'Valor Total dos Serviços\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${utils.number.float2moeda(model['ORDENS_SERVICOS'])}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [true, true, false, true]
							},{},
							{								
								text: [
									{
										text: 'Desconto Incondicionado\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${(utils.number.float2moeda(model['ORDENS_DESCONTOS']) || '0,00')}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 3,
								alignment: 'right',
								border: [false, true, false, true]								
							},{},{},
							{
								text: [
									{
										text: 'Deduções Base Cálculo\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ 0,00`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 3,
								alignment: 'right',
								border: [false, true, false, true]
							},{},{},
							{
								text: [
									{
										text: 'Base de Cálculo\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${utils.number.float2moeda(model['ORDENS_SERVICOS'])}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: 'Total do ISS\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${utils.number.float2moeda(model['ORDENS_VALORISS'])}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: 'ISS Retido\n',
										alignment: 'center',
										fontSize: 6,
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${(model['ORDENS_ISSRETIDO'] == 'R' ? '1 - Sim' : '2 - Não')}`,
										alignment: 'center',
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: 'Desconto Condicionado\n',
										alignment: 'right',
										fontSize: 5	
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ 0,00`,
										alignment: 'center',
										fontSize: 7,								
										bold: true		
									}
								],
								colSpan: 2,
								border: [false, true, true, true]
							},{}
						],
						[
							{
								colSpan: 16,
								text: '',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: 'Retenções de Impostos',
								style: {
									fontSize: 8,
									fillColor: '#E3E3E3',													
									bold: true
								},
								border: [true, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: [
									{
										text: 'PIS\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${(utils.number.float2moeda(model['ORDENS_VALORPIS']) || '0,00')}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [true, true, false, true]
							},{},
							{								
								text: [
									{
										text: 'COFINS\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${(utils.number.float2moeda(model['ORDENS_VALORCOFINS']) || '0,00')}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 3,
								alignment: 'right',
								border: [false, true, false, true]								
							},{},{},
							{
								text: [
									{
										text: 'INSS',
										fontSize: 6
									},
									{
										text: 'aaaa',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${utils.number.float2moeda(model['ORDENS_ALIQUOTAINSS'])} %\n`,
										bold: true,
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${utils.number.float2moeda(model['ORDENS_VALORINSS'])}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 3,
								alignment: 'right',
								border: [false, true, false, true]
							},{},{},
							{
								text: [
									{
										text: 'IRRF\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ ${(utils.number.float2moeda(model['ORDENS_VALORIRRF']) || '0,00')}`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: 'CSLL\n',
										fontSize: 6
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `R$ 0,00`,
										bold: true,
										fontSize: 7
									}
								],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: 'Outras Retenções\n',
										alignment: 'center',
										fontSize: 6,
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: `${(utils.number.float2moeda(model['ORDENS_VALORRETENCOES']) || '0,00')}`,
										alignment: 'center',
										bold: true,
										fontSize: 8
									}
								],
								colSpan: 2,
								border: [false, true, false, true]
							},{},
							{
								text: [
									{
										text: '', // espaço livre
										alignment: 'right',
										fontSize: 6	
									},
									{
										text: 'aa\n',
										color: 'white',
										fontSize: 2
									},
									{
										text: ``,
										alignment: 'center',
										fontSize: 7,								
										bold: true		
									}
								],
								colSpan: 2,
								border: [false, true, true, true]
							},{}
						],
						[
							{
								text: `Valor Líquido da NFs-e: R$ ${utils.number.float2moeda(model['ORDENS_TOTAL'])}`,
								colSpan: 16,
								bold: true,
								alignment: 'left',
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
						]						
					);

					rows.push(
						[
							{
								colSpan: 16,
								text: '',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: 'Informações Complementares',
								style: {
									fontSize: 8,
									fillColor: '#E3E3E3',													
									bold: true
								},
								border: [true, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: model['ORDENS_OBSERVACOES'].replaceAll('|', '\n'),
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: ' - -'.repeat(65),
								fontSize: 8,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								colSpan: 16,
								text: [
									{
										text: 'RECEBI(EMOS) DE '
									},
									{
										text: model['EMPRESAS_NOME'],
										bold: true
									},
									{
										text: ' O SERVIÇO CONSTANTE DA NFS-e DE NÚMERO '
									},
									{
										text: model['ORDENS_NUMERO'],
										bold: true
									}, 
									{
										text: ' E CÓDIGO DE VERIFICAÇÃO '
									},
									{
										text: model['ORDENS_PROTOCOLO'],
										bold: true
									}
								],
								fontSize: 7, 
								alignment: 'center',
								border: [true, true, true, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Data\n\n________/_________/___________',
								colSpan: 4,
								bold: true,
								alignment: 'center',
								border: [true, false, false, true]								
							},{},{},{},
							{
								text: 'CPF/RG\n\n________________________________________',
								colSpan: 5,
								bold: true,
								alignment: 'center',
								border: [false, false, false, true]
							},{},{},{},{},
							{
								text: 'Assinatura\n\n__________________________________________________________',
								colSpan: 7,
								bold: true,
								alignment: 'center',
								border: [false, false, true, true]
							},{},{},{},{},{},{}
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

const nomeServico = function(codServico, params) {
	const servicos = params.tabelaservicos;
	const servicoFeito = servicos.filter(servico => {
		return servico[0] == codServico;
	})

	return (servicoFeito[0][1] || '');
}