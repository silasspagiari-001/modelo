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
			api.ordensmoveis().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
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
					
					let model = res.results[0];

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);
					let fanPessoa = (siglaFilial != 'FT' && model['PESSOAS_FANTASIA'] ? model['PESSOAS_FANTASIA'] : '');

					let obsOrdem =  (model['ORDENS_OBSERVACOES'] ? model['ORDENS_OBSERVACOES'].split('|').join(' ') : '\n\n\n\n');

					const emiOrdem     = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['ORDENS_PRODUTOSITENS'] || [];
					let servicos        = model['ORDENS_SERVICOSITENS'] || [];
					let rows            = docDefinition.content[0].table.body;
					let cnpMontador     = (model['MONTADORES_CPFCNPJ']||[]).length == 11 ? 'F' : 'J';

					rows.push(
						[
							{
								colSpan: 4,
								text: [
									{
										text: model['MONTADORES_NOME'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: `${model['MONTADORES_ENDERECO']} ${model['MONTADORES_NUMERO']} - ${model['MONTADORES_BAIRRO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: utils.string.maskCep(model['MONTADORES_CEP']) + ' ' + model['CIDADES_NOMEMONTADOR'] + ' ' + model['CIDADES_ESTADOMONTADOR'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: (cnpMontador == 'F' ? 'CPF: ': 'CNPJ: ') + utils.string.maskCnp(model['MONTADORES_CPFCNPJ']) + (cnpMontador == 'F' ? '\nRG: ': '\nI.E.: ') + model['MONTADORES_INSCRICAO'],
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
								],
								border: [true, true, true, true]
							},{},{},{},
							{
								colSpan: 6,
								text: [	
									{
										text: 'a\n',
										color: 'white',
										fontSize: 10
									},							
									{									
										text: 'Ordem de Serviço',
										fontSize: 15,
										alignment: 'center'
									}
								]
							},{},{},{},{},{},
							{
								colSpan: 2,
								text: [
									{
										text: `\n`,
										fontSize: 8,
										alignment: 'center'
									},
									{
										text: `${siglaFilial}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 25
										}										
									}									
								]
							},{},
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
										text: model['ORDENS_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 15
										}
									},
									{
										text: `\n${emiOrdem}`,
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
								text: 'Nome:'
							},
							{
								text: model['ORDENS_NOME'] + (fanPessoa.length > 0 ? ` (${fanPessoa.toUpperCase()})` : ''),
								colSpan: 9
							},{},{},{},{},{},{},{},{},
							{
								text: 'Cel:',
								alignment: 'right'
							},
							{
								text: utils.string.maskFone(model['PESSOAS_CELULAR']),
								colSpan: 3
							},
							{},{}
						],
						[
							{
								text: 'Endereço:',
								fontSize: 7.5
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
								text: 'Bairro:'
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
								text: (model['ORDENS_CPFCNPJ'].length == 11 ? "RG:" : "I.E.:"),
								alignment: 'right'
							},{
								text: model['PESSOAS_INSCRICAO'],
								colSpan: 3
							},{},{}
						],
						[
							{
								text: 'Cidade:'
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
								text: model['ORDENS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:',
								alignment: 'right'
							}, 
							{
								text: utils.string.maskCnp(model['ORDENS_CPFCNPJ']),
								fontSize: (model['ORDENS_CPFCNPJ'].length == 11 ? 8 : 7),
								colSpan: 2
							},{},
							{
								text: '',
							},{
								text: '',
								colSpan: 3
							},{},{}
						],
						[
							{ 
								text: 'Obs:'
							},{
								text: (model['PESSOAS_PAGINA'] ? model['PESSOAS_PAGINA'] : ''),
								colSpan: 13
							},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);


					if(produtos.length > 0) {
						rows.push(
							[
								{ 
									text: 'a\n', 
									color: 'white',
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
							let qtdeProduto = produtos[i]['ORDENSPRODUTOS_QUANTIDADE'].toFixed(0);
							rows.push(
								[
									{							
										text: produtos[i]['ORDENSPRODUTOS_ID_PRODUTOS'],	
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
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_TOTAL']),
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{}
								]
							);
						}		
					}

					if(servicos.length > 0) {
						rows.push(
							[
								{ 
									text: 'a\n', 
									color: 'white',
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
									text: 'Descrição do Serviço',
									alignment: 'center',
									colSpan: 9
								}, 
								{},{},{},{},{},{},{},{},
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

						for(let i in servicos){
							let qtdeServico = servicos[i]['ORDENSSERVICOS_QUANTIDADE'].toFixed(0);
							rows.push(
								[
									{							
										text: servicos[i]['ORDENSSERVICOS_ID_SERVICOS'],
										alignment: 'center',
										style: {
											fontSize: 8
										}											
									},
									{
										text: servicos[i]['SERVICOS_NOME'],
										colSpan: 9,
										style: {
											fontSize: 8
										}
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 2,
										text: qtdeServico,
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_TOTAL']),
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{}
								]
							);
						}		
					}
					
					rows.push(
						[
							{
								text: '',
								colSpan: 8
							},{},{},{},{},{},{},{},							
							{
								text: 'TOTAL:',
								bold: true,
								colSpan: 2,
								alignment: 'right'
							},{},
							{
								colSpan: 2,
								text: (produtos.length + servicos.length),
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true
								}																		
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['ORDENS_TOTAL']),
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
								text: '',
								colSpan: 7,
								alignment: 'center',
								border: [true, true, true, false],
								style: {
									fontSize: 8,
									bold: true
								}																			

							},{},{},{},{},{},{},
							{
								text: obsOrdem,
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, false]
							},{},{},{},{},{},{}

						]
					)

					rows.push(
						[
							{
								text: '__________________________________________________',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, false],								
								style: {
									fontSize: 10
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
								text: 'Assinatura',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, true],								
								style: { fontSize: 10 }

							},{},{},{},{},{},{},
							{
								text: '',
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, true]
							},{},{},{},{},{},{}

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
