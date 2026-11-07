'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const codes     = require('rescode');


codes.loadModules(["ean2", "ean5", "ean8", "ean13"]);

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
								table: { // Cod   [CDB] REF   [Descri ]   C   L  UN   I   E[Preço][Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14  15// 15 Colunas
									widths: [34, 33, 14, 35, 35, 39, 29, 29, 29, 20, 29, 20, 18, 27, 29], // TOTAL: 414
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
					let vctsPedido      = carregarPagamentos(model);
					let rows            = docDefinition.content[0].table.body;
					let pathLogo;					

					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}

					let linhas;
					let itensPagina     = 0;

					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 60,
								alignment: 'center',
								border: [true, true, false, true]
							},{},
							{
								colSpan: 4,
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
										text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
										alignment: 'left',
										style: {bold: true,	fontSize: 12}
									}
								],
								border: [false, true, true, true]
							},{},{},{},
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
										fontSize: 10,
										alignment: 'center'
									},
									{
										text: model['MOVIMENTOS_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10
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
								colSpan: 8
							},{},{},{},{},{},{},{},
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
						], // 15 ok
						[
							{
								text: 'Endereço'
							},
							{
								text: model['PESSOAS_ENDERECO'] + (model['PESSOAS_NUMERO'] ? ', ' + model['PESSOAS_NUMERO']: ''),
								style: {bold: true},								
								colSpan: 8
							},{},{},{},{},{},{},{},
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
								colSpan: 4
							},{},{},{},	
							{
								text: 'Cidade'
							}, 
							{
								text: model['CIDADES_NOME'] + '/' + model['CIDADES_ESTADO'],
								style: {bold: true},								
								colSpan: 6
							},{},{},{},{},{},
							{
								text: 'Cep'
							},
							{
								text: utils.string.maskCep(model['PESSOAS_CEP']),
								style: {bold: true},								
								colSpan: 2
							},{}
						],
						[
							{
								text: 'Transporte',
								fontSize: 7
							},
							{
								text: transporte['MOVIMENTOSENVIO_NOME'],
								style: {bold: true},
								fontSize: 7,								
								colSpan: 4
							},{},{},{},
							{
								text: 'Qtde',
								fontSize: 6			
							},
							{
								text: transporte['MOVIMENTOSENVIO_QUANTIDADE'],
								fontSize: 6,
								alignment: 'right'
							},
							{
								text: 'Espécie',
								fontSize: 6			
							},
							{
								text: transporte['MOVIMENTOSENVIO_ESPECIE'],			
								fontSize: 6
							},
							{
								text: 'Vols',
								fontSize: 6
							},
							{
								text: transporte['MOVIMENTOSENVIO_VOLUMES'],			
								fontSize: 6
							},
							{
								text: 'Liquido',
								fontSize: 6
							},
							{
								text: (cents(transporte['MOVIMENTOSENVIO_PESOLIQUIDO']) / 100).toFixed(2),
								alignment: 'right',
								fontSize: 6			
							},
							{
								text: 'Bruto',
								fontSize: 6
							},
							{
								text: (cents(transporte['MOVIMENTOSENVIO_PESOBRUTO']) / 100).toFixed(2),
								alignment: 'right',
								fontSize: 6
							}
						],
						[
							{
								text: 'Prazo',
								fontSize: 7
							},
							{
								text: vctsPedido,
								style: {bold: true},
								fontSize: 7,								
								colSpan: 14
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{ 
								text: '\n', 
								style: {
									fontSize: 1
								},
								colSpan: 15,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);

					rows.push([ // 14 cols
						{
							text: 'Código',   // 1
							alignment: 'center'
						},
						{
							text: 'Barras', // 2 e 3
							alignment: 'center',
							colSpan: 2
						},{},
						{
							text: 'Descrição do Produto', // 4 a 9
							alignment: 'center',
							colSpan: 5
						},{},{},{},{},
						{
							text: 'Local', // 9
							alignment: 'center',
							fontSize: 6
						},
						{
							text: 'Uni', // 10
							alignment: 'center',
							fontSize: 6
						},						
						{	
							text: 'Qtde', // 11
							alignment: 'center',
							fontSize: 6
						},
						{	
							text: 'Preço', // 12 e 13
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{},
						{	
							text: 'Total', // 14 e 15
							alignment: 'center',
							colSpan: 2,
							fontSize: 6
						},{}
					]);

					for(let i in produtos){

						let barraProduto  = utils.string.onlyNumbers(produtos[i]['PRODUTOS_BARRA']);
						let codProduto =    produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'].toString();
						let codBarProduto = isBarraGerada(codProduto, barraProduto) ? await getBarCode(barraProduto) : '';


						let localProduto  = (produtos[i]['SALDOS_LOCAL'] ? ' Local: ' + produtos[i]['SALDOS_LOCAL'] : '');
						let loteProduto   = (produtos[i]['LOTES_ID'] > 0 
						                  ? ' Lote: ' + produtos[i]['LOTES_REFERENCIA'] + 
						                    ' Fab: ' + moment(produtos[i]['LOTES_FABRICACAO']).format('DD/MM/YYYY') + 
						                    ' Val: ' + moment(produtos[i]['LOTES_VALIDADE']).format('DD/MM/YYYY')  
					                      : ''); 


						let qtdeProduto  = ((produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] - parseInt(produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])) != 0 ? produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0));

						let precoUnitario        = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
												utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
												produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))

						rows.push([
							{
								text: `${produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS']}\n${produtos[i]['PRODUTOS_REFERENCIA']}`,
								alignment: 'center',
								style: {fontSize: 8, bold: true}
							},
							codBarProduto ? {
								image: 'data:image/png;base64,' + codBarProduto,
								width: 55,   //30
								height: 20,  //30
								alignment: 'center',
								colSpan: 2
							} : { text: '\n\n', color: 'white', colSpan: 2},	
							{},	
							{
								text: produtos[i]['PRODUTOS_NOME'] + 
								((localProduto + loteProduto) ? `\n${localProduto} ${loteProduto}` : ''),
								colSpan: 5,
								style: { fontSize: 7, bold: true }
							},{},{},{},{},
							{
								text: produtos[i]['SALDOS_LOCAL'],
								alignment: 'center',
								style: { fontSize: 7, bold: true }
							},
							{
								text: produtos[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: { fontSize: 8, bold: true }
							},
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
					} 

					for (linhas = itensPagina; linhas < 22; linhas++) { // Linhas em branco pra completar o tamanho da via
						rows.push(
							[
								{
									text: 'A\na\n',
									style: {
										fontSize: 8,
										color: 'white'
									}										
								},
								{text: '', colSpan: 2},{},
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
								text: obsPedido,
								colSpan: 11,
								rowSpan: 5,
								style: {
									fontSize: 10
								},
								border: [true, true, true, true]
							},{},{},{},{},{},{},{},{},{},{},
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
								colSpan: 11,
								style: {
									fontSize: 8
								},
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},{},
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
								colSpan: 11,
								style: {
									fontSize: 10
								},
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Frete',
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
								colSpan: 11,
								style: {
									fontSize: 10
								},
								border: [true, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},
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
								colSpan: 11,
								border: [true, false, false, true]
							},{},{},{},{},{},{},{},{},{},{},
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
	let prazos = model['MOVIMENTOS_FINANCEIROSCOMPRA'] || [];
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
		formas += 'Vencimentos: '
		for (let i in titulos) {
			formas += `${(parseInt(i)+1)}/${titulos.length} - ` +  moment(titulos[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda(titulos[i]['FINANCEIROS_ORIGINAL']) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}	
	}

	if (prazos.length > 0) {
		formas += 'Vencimentos: '
		for (let i in prazos) {
			formas += `${(parseInt(i)+1)}/${prazos.length} - ` +  moment(prazos[i]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY');
			formas += ' ' + utils.number.float2moeda(prazos[i]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) + '  ';
			formas += (((parseInt(i)+1) % 3) == 0 ? '\n' : '');
		}	
	}

	return formas;
};

const isBarraGerada = function(produto, barra) {
	let stringGeradas = '789' + ('000000000' + produto).slice(-9);
    console.log('gerada: ', stringGeradas, (barra.substring(0, 12) == stringGeradas))
	return (barra.substring(0, 12) == stringGeradas);

};

const getBarCode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create("ean13", chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};
