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
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						header: function(page, pages) { 
							return {
								columns: [
									{
										text: ' Página: ' + page.toString() + ' de ' + pages.toString(),
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
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
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
								
					const titDocumento = params.titledocumento;
					let model = res.results[0];
					let obsPedido = '';
					let nomeAssinatura = '';
					let strObsPedido = model['MOVIMENTOS_OBSERVACOES'].split('|').join(' ');

					if(strObsPedido.substr(0, 30).match(/\*/)) {
						nomeAssinatura = strObsPedido.split('*')[0];
						obsPedido = strObsPedido.split('*')[1];
					} else {
						obsPedido = strObsPedido;
					}

					const emiPedido     = moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let transporte      = model['MOVIMENTOS_ENVIO'][0] || [];					
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
								colSpan: 3,
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
							},{},{},
							{
								colSpan: 7,
								table: {
									widths: ['*', '*', '*'],									
									body: [
										[
											{
												text: `A`,  // Pra alinhamento vertical
												color: 'white',
												colSpan: 3,
												style: {fontSize: 8}
											},{},{}
										],
										[
											{
												text: `${titDocumento.toUpperCase()}`,
												alignment: 'center',
												colSpan: 3,
												style: {bold: true,	fontSize: 12}
											},{},{}
										],
										[ 
											{
												text: `Vendedor: ${model['USUARIOS_NOME']}`,
												alignment: 'left',
												style: {fontSize: 7}
											},
											{
												text: `Usuário:\n${params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`,
												alignment: 'right',
												colSpan: 2,
												style: {fontSize: 7}												
											},
											{}
										]
									]
								},
								layout: 'noBorders'
							},
							{},{},{},{},{},{},
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
								colSpan: 4
							},{},{},{},
							{
								text: model['MOVIMENTOS_EMAIL'],
								style: {bold: true},								
								colSpan: 5
							},{},{},{},{}
						],
						[
							{
								text: 'Transp.'
							},
							{
								text: transporte['MOVIMENTOSENVIO_NOME'] || '',
								style: {bold: true},								
								colSpan: 8
							},{},{},{},{},{},{},{},
							{
								text: 'Frete por conta: ',
								colSpan: 3
							},{},{},
							{
								text: transporte['MOVIMENTOSENVIO_MODO'] == 'F' ? 'Destinatário' :
						              transporte['MOVIMENTOSENVIO_MODO'] == 'C' ? 'Emitente' :
									  transporte['MOVIMENTOSENVIO_MODO'] == 'T' ? 'Terceiros' :
									  transporte['MOVIMENTOSENVIO_MODO'] == 'S' ? 'Sem Frete' :
									  transporte['MOVIMENTOSENVIO_MODO'] == 'D' ? 'Sem Frete' : '',
								style: {bold: true},									  
								colSpan: 2
							},{}
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
						]);


						

					rows.push([ // 14 cols
						{
							text: 'Código',
							alignment: 'center'
						},
						{
							text: 'Descrição do Produto',
							alignment: 'center',
							colSpan: 8
						},{},{},{},{},{},{},{},
						{	
							text: 'Qtde',
							alignment: 'center',
							fontSize: 6
						},
						{	
							text: 'Preço',
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{},
						{	
							text: 'Total',
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{}
					]);

					for(let i in produtos){
						let qtdeProduto  = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0));

						let precoUnitario        = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
											       utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
											       produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))

						rows.push([
							{
								text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'center',
								style: {fontSize: 8, bold: true}
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								colSpan: 8,
								style: { fontSize: 8, bold: true }
							},{},{},{},{},{},{},{},
							{					
								text: qtdeProduto,
								alignment: 'right',
								style: { fontSize: 8, bold: true }
							},
							{
								colSpan: 2,
								text: precoUnitario,
								alignment: 'right',
								style: { fontSize: 8, bold: true },
							},{},								
							{
								colSpan: 2,
								text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
								alignment: 'right',
								style: { fontSize: 8, bold: true },
							},{}							
						]);

						itensPagina++
						if(itensPagina > 39) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 14,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}
					}  // end for

					rows.push(
						[
							{
								text: obsPedido + '\n' + vctsPedido,
								colSpan: 10,
								rowSpan: 5,
								style: {
									fontSize: 10
								},
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Produtos',
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
								style: {
									fontSize: 9
								},																			
							},{}
						]
					);
					
					rows.push(
						[
							{
								text: '',
								colSpan: 10,
								style: {
									fontSize: 8
								},
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Desconto',
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
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
								text: 'Frete/Sedex',
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
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
								text: 'Despesa',
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
								alignment: 'right',
								style: {
									fontSize: 8
								},																			
							},{}
						]
					);

					rows.push(
						[
							{
								text: '',
								colSpan: 10,
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Total',
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true
								}																		
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true							
								}																			
							},{}
						]
					);

					if(nomeAssinatura) {
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]
						);
						rows.push(
							[
								{
									text: '',
									border: [false, false, false, false]
								},
								{
									text: nomeAssinatura,
									colSpan: 4,
									alignment: 'center',
									border: [false, true, false, false]
								},{},{},{},
								{
									text: '',
									colSpan: 9,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}
							]
						);
					}

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
		formas += 'Vencimentos: \n'
		for (let i in titulos) {
			formas += `${(parseInt(i)+1)}/${titulos.length} - ` +  moment(titulos[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda(titulos[i]['FINANCEIROS_ORIGINAL']) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}	
	} else {
        let parcelas      = model['PRAZOS_PARCELAS'];
        let parcelamento  = model['PRAZOS_PARCELAMENTO'] ? model['PRAZOS_PARCELAMENTO'].split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
		formas += 'Vencimentos: \n'

		for(let i in parcelamento) {

			const dtEmissao = moment(model['MOVIMENTOS_EMISSAO']).format('YYYY-MM-DD');
			const prazoDias = parcelamento[i];
			const dtVencto  = moment(dtEmissao).add(prazoDias, 'days').format('YYYY-MM-DD');

			formas += `${(parseInt(i)+1)}/${parcelamento.length} - ` +  moment(dtVencto).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda((model['MOVIMENTOS_TOTAL'] / parseInt(parcelas))) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}


	}

	return formas;
};