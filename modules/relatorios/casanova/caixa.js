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
			api.caixa().read(params)
				.then(res => {
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					let docDefinition = {
						pageOrientation: 'portrait',
						pageSize: 'A4',               //   E   S   D   I
						pageMargins: [20, 40, 20, 35], // [40, 40, 40, 35]
						header: function(page, pages) { 
							return { 
								alignment: 'justify',
								columns: [
									{
										image: pathLogo,
										width: 100,
										height: 22,
										alignment: 'left'
									},
									{
										stack: [
											'Movimento do Caixa - ' + params.emissao + (params.status == 0 ? ' (Aberto)' : (params.status == 1 ? ' (Fechado)' : '')),
											res.results[0]['EMPRESAS_NOME']
										],
										width: '*',
										style: {
											fontSize: 11,
											alignment: 'center',
											color: 'red'
										}
									},
									{
										stack: [
											moment.tz(params.timezone).format('DD/MM/YYYY'),
											moment.tz(params.timezone).format('HH:mm:ss')
										],
										width: 100,
										style: {
											fontSize: 10,
											alignment: 'right',
											bold: true
										}
									}
								],
								margin: [40, 10]
							}
						},
						styles: {
							tableExample: {
								fontSize: 6, // 10
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6, // 10
								color: 'black'
							}
						},					
						content: [
							{columns: [{},{},{},{},{},{},{},{},{},{}]},
							{
								style: 'tableExample',
								table: {   //DH        HIS       VLR DOC ENT SAI SLD
			//						widths: [60, [    210     ], 40, 40, 40, 40, 40],  // agora tem 10 colunas
									widths: [60, 45, 45, 45, 45, 45, 40, 45, 45, 45],						
									headerRows: 1,
									body: [
										[
											{
												text: 'Data/Hora',
												style: 'tableHeader',
												alignment: 'center'									
											},
											{
												text: 'Histórico',
												style: 'tableHeader',
												alignment: 'center',
												colSpan : 4
											},{},{},{},
											{
												text: 'Valor',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Documento',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Entradas',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Saídas',
												style: 'tableHeader',
												alignment: 'center'
											},
											{
												text: 'Saldo',
												style: 'tableHeader',
												alignment: 'center'
											}                                           
										]
									]
								},
								layout: {
									fillColor: function (i) {
										return (i % 2 === 0) ? '#E3E3E3' : null;
									}
								}
							}
						],
						footer: function(page, pages) { 
							return { 
								stack: [ 
									'_'.repeat(95),
									{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},
						styles: {
							tableExample: {
								fontSize: 6, //10
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6, //10
								color: 'black'
							}
						}
					};

					let rows   = docDefinition.content[1].table.body;
					let sldAnterior      = 0,
						totLancamentos   = 0,
					    antDinheiro      = 0,
					    antCheque        = 0,
					    antCredito       = 0,
					    antDebito        = 0,
						antCreditoloja   = 0,
						antCreditopessoa = 0,
					    antAlimentacao   = 0,
						antRefeicao      = 0,
						antPresente      = 0,
						antCombustivel   = 0,
						antDuplicata     = 0,
						antBoleto        = 0,
						antOutro         = 0,
						totEntradas      = 0,
					    entDinheiro      = 0,
					    entCheque        = 0,
					    entCredito       = 0,
					    entDebito        = 0,
						entCreditoloja   = 0,
					    entCreditopessoa = 0,						
					    entAlimentacao   = 0,
						entRefeicao      = 0,
						entPresente      = 0,
						entCombustivel   = 0,
						entDuplicata     = 0,
						entBoleto        = 0,
						entOutro         = 0;

					let totSaidas        = 0,
					    saiDinheiro      = 0,
					    saiCheque        = 0,
					    saiCredito       = 0,
					    saiDebito        = 0,
						saiCreditoloja   = 0,
						saiCreditopessoa = 0,
					    saiAlimentacao   = 0,
						saiRefeicao      = 0,
						saiPresente      = 0,
						saiCombustivel   = 0,
						saiDuplicata     = 0,
						saiBoleto        = 0,
						saiOutro         = 0,
						impLinhas        = 0;						

					for(let i in res.results){
						let descriLancamento = res.results[i]['MOVIMENTOSCAIXA_ID_MOVIMENTOS'] > 0 ? (res.results[i]['DOCUMENTOS_NOME'] + ' ' + res.results[i]['MOVIMENTOS_NUMERO'] + ' - ') : '';
							descriLancamento += res.results[i]['MOVIMENTOSCAIXA_NOME'];

						let lanDinheiro      = res.results[i]['MOVIMENTOSCAIXA_DINHEIRO'],
						    lanTroco         = res.results[i]['MOVIMENTOSCAIXA_TROCO'],
							lanCheque        = res.results[i]['MOVIMENTOSCAIXA_CHEQUE'],
							lanCredito       = res.results[i]['MOVIMENTOSCAIXA_CREDITO'],
							lanDebito        = res.results[i]['MOVIMENTOSCAIXA_DEBITO'],
							lanCreditoloja   = res.results[i]['MOVIMENTOSCAIXA_CREDITOLOJA'],
							lanCreditopessoa = res.results[i]['MOVIMENTOSCAIXA_CREDITOPESSOA'],
							lanAlimentacao   = res.results[i]['MOVIMENTOSCAIXA_ALIMENTACAO'],
							lanRefeicao      = res.results[i]['MOVIMENTOSCAIXA_REFEICAO'],
							lanPresente      = res.results[i]['MOVIMENTOSCAIXA_PRESENTE'],
							lanCombustivel   = res.results[i]['MOVIMENTOSCAIXA_COMBUSTIVEL'],
							lanDuplicata     = res.results[i]['MOVIMENTOSCAIXA_DUPLICATA'],
							lanBoleto        = res.results[i]['MOVIMENTOSCAIXA_BOLETO'],
							lanOutro         = res.results[i]['MOVIMENTOSCAIXA_OUTRO'],
							lanSaldo         = res.results[i]['MOVIMENTOSCAIXA_SALDO'],
							lanTotal         = res.results[i]['MOVIMENTOSCAIXA_TOTAL'];

						rows.push([
							{
								text: moment(res.results[i]['MOVIMENTOSCAIXA_EMISSAO']).format('DD/MM/YYYY')
								 + ' ' + res.results[i]['MOVIMENTOSCAIXA_HORA'],
								style: {
									alignment: 'center'
								}									
                            },							
							{
								colSpan: 4,
								text: descriLancamento,
								style: {
									alignment: 'left'
								}									
                            },{},{},{},
							{
								text: utils.number.float2moeda(lanTotal),
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E' ? utils.number.float2moeda(lanTotal) : '',
								style: {
									alignment: 'right'
								}
							},
							{
								text: res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'S' ? utils.number.float2moeda(lanTotal) : '',
								style: {
									alignment: 'right'
								}
							},
							{
								text: utils.number.float2moeda(lanSaldo),
								style: {
									alignment: 'right'
								}
                            }
						]);

						if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'E') {
							entDinheiro      += (lanDinheiro - lanTroco);
							entCheque        += lanCheque;
							entCredito       += lanCredito;
							entDebito        += lanDebito;
							entCreditoloja   += lanCreditoloja;
							entCreditopessoa += lanCreditopessoa;
							entAlimentacao   += lanAlimentacao;
							entRefeicao      += lanRefeicao;
							entPresente      += lanPresente;
							entCombustivel   += lanCombustivel;
							entDuplicata     += lanDuplicata;
							entBoleto        += lanBoleto;
							entOutro         += lanOutro;
							totEntradas      += lanTotal;
							totLancamentos   += lanTotal;
						} else if(res.results[i]['MOVIMENTOSCAIXA_TIPO'] == 'S') {
							saiDinheiro      += (res.results[i]['MOVIMENTOSCAIXA_NOME'].match(/FECHAMENTO/) ? 0 : (lanDinheiro - lanTroco));
							saiCheque        += lanCheque;
							saiCredito       += lanCredito;
							saiDebito        += lanDebito;
							saiCreditoloja   += lanCreditoloja;
							saiCreditopessoa += lanCreditopessoa;
							saiAlimentacao   += lanAlimentacao;
							saiRefeicao      += lanRefeicao;
							saiPresente      += lanPresente;
							saiCombustivel   += lanCombustivel;
							saiDuplicata     += lanDuplicata;
							saiBoleto        += lanBoleto;
							saiOutro         += lanOutro;
							totSaidas        += lanTotal;
							totLancamentos   -= lanTotal;
						}
						
					}

					rows.push([
						{
							colSpan: 5,
							text: 'Totais do dia',
							fontSize: 8,
							style: {
								alignment: 'right'
							}									
						},{},{},{},{},
						{
							text: utils.number.float2moeda(totLancamentos),
							style: {
								alignment: 'right',
								bold: true								
							}
						},
						{
							text: '',
							style: {
								alignment: 'right'
							}
							
						},						
						{
							text: utils.number.float2moeda(totEntradas),
							style: {
								alignment: 'right',
								bold: true						
							}
						},
						{
							text: utils.number.float2moeda(totSaidas),
							style: {
								alignment: 'right',
								bold: true
							}
							
						},
						{
							text: '',
							style: {
								alignment: 'right'
							}
						}
					]);

					rows.push([
						{
							colSpan: 5,
							text: 'Detalhes do Saldo',
							fontSize: 8,
							style: {
								alignment: 'center'
							}									
						},{},{},{},{},
						{
							colSpan: 3,
							text: 'Saldo Anterior',
							fontSize: 8,							
							style: {
								alignment: 'right'
							}
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(sldAnterior),
							fontSize: 8,							
							style: {
								alignment: 'right'
							}
						},{},
					]);

					rows.push([
						{
							text: 'Totalizadores',
							style: {
								alignment: 'center'
							}
						},							
						{
							text: 'Anterior',
							style: {
								alignment: 'right'
							}							
						},
						{
							text: 'Entrada',
							style: {
								alignment: 'right'
							}							
						},
						{
							text: 'Saída',
							style: {
								alignment: 'right'
							}
						},						
						{
							text: 'Saldo',
							style: {
								alignment: 'right'
							}
						},
						{
							colSpan: 3,
							text: 'Saldo Atual',
							fontSize: 8,
							style: {
								alignment: 'right'
							}							
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(sldAnterior + totEntradas - totSaidas),
							fontSize: 8,
							style: {
								alignment: 'right'
							}
						},{}
					]);

					if ((antDinheiro + entDinheiro + saiDinheiro) != 0) {
						rows.push([
							{
								text: 'Dinheiro',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDinheiro) || '0,00',  // Anterior Dinheiro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDinheiro) || '0,00',  // Entrada Dinheiro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDinheiro) || '0,00',  // Saída Dinheiro,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antDinheiro + entDinheiro - saiDinheiro) || '0,00',  // Saldo Dinheiro,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: 'CAIXA',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: 'VISTO',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;					
					}

					if ((antCheque + entCheque + saiCheque) > 0) {
						rows.push([
							{
								text: 'Cheque',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCheque) || '0,00',  // Anterior Cheque
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCheque) || '0,00',  // Entrada Cheque
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCheque) || '0,00',  // Saída Cheque
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antCheque + entCheque - saiCheque) || '0,00',  // Saldo Cheques,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}							
						]);
						impLinhas++;
					}

					if ((antCredito + entCredito + saiCredito) > 0) {
						rows.push([
							{
								text: 'Cartão Crédito',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCredito) || '0,00',  // Anterior C. Crédito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCredito) || '0,00',  // Entrada C. Crédito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCredito) || '0,00',  // Saída C. Crédito,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antCredito + entCredito - saiCredito) || '0,00',  // Saldo C. Credito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}																						
						]);
						impLinhas++;
					}

					if ((antDebito + entDebito + saiDebito) > 0) {
						rows.push([
							{
								text: 'Cartão Débito',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDebito) || '0,00',  // Anterior C. Débito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDebito) || '0,00',  // Entrada C. Débito
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDebito) || '0,00',  // Saída C. Débito,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda(antDebito + entDebito - saiDebito) || '0,00',  // Saldo C. Debito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antCreditoloja + entCreditoloja + saiCreditoloja) > 0) {					
						rows.push([
							{
								text: 'Crédito Loja',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCreditoloja) || '0,00',  // Anterior Crédito Loja
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCreditoloja) || '0,00',  // Entrada Crédito Loja
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCreditoloja) || '0,00',  // Saída Crédito Loja,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCreditoloja + entCreditoloja - saiCreditoloja)) || '0,00',  // Saldo C. Credito,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antCreditopessoa + entCreditopessoa + saiCreditopessoa) > 0) {
						rows.push([
							{
								text: 'Crédito Pessoa',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCreditopessoa) || '0,00',  // Anterior Crédito pessoa
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCreditopessoa) || '0,00',  // Entrada Crédito Pessoa
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCreditopessoa) || '0,00',  // Saída Crédito pessoa,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCreditopessoa + entCreditopessoa - saiCreditopessoa)) || '0,00',  // Saldo Credito Pessoa,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antAlimentacao + entAlimentacao + saiAlimentacao) > 0) {					
						rows.push([
							{
								text: 'Alimentação',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antAlimentacao) || '0,00',  // Anterior C. Alimentação
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entAlimentacao) || '0,00',  // Entrada C. Alimentação
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiAlimentacao) || '0,00',  // Saída C. Alimentação,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antAlimentacao + entAlimentacao - saiAlimentacao)) || '0,00',  // Saldo C. Alimentacao,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++
					}

					if ((antRefeicao + entRefeicao + saiRefeicao) > 0) {
						rows.push([
							{
								text: 'Refeição',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antRefeicao) || '0,00',  // Anterior Refeição
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entRefeicao) || '0,00',  // Entrada Refeição
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiRefeicao) || '0,00',  // Saída Refeição,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antRefeicao + entRefeicao - saiRefeicao)) || '0,00',  // Saldo Refeição
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antPresente + entPresente + saiPresente) > 0) {
						rows.push([
							{
								text: 'Presente',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antPresente) || '0,00',  // Anterior Presente
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entPresente) || '0,00',  // Entrada Presente
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiPresente) || '0,00',  // Saída Presente
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antPresente + entPresente - saiPresente)) || '0,00',  // Saldo Presente
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antCombustivel + entCombustivel + saiCombustivel) > 0) {
						rows.push([
							{
								text: 'Combustível',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antCombustivel) || '0,00',  // Anterior Combustível
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entCombustivel) || '0,00',  // Entrada Combustível
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiCombustivel) || '0,00',  // Saída Combustível
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antCombustivel + entCombustivel - saiCombustivel)) || '0,00',  // Saldo Combustivel,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antDuplicata + entDuplicata + saiDuplicata) > 0) {					
						rows.push([
							{
								text: 'Duplicata',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antDuplicata) || '0,00',  // Anterior Duplicata
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entDuplicata) || '0,00',  // Entrada Duplicata
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiDuplicata) || '0,00',  // Saída Duplicata,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antDuplicata + entDuplicata - saiDuplicata)) || '0,00',  // Saldo Duplicata
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}
					
					if ((antBoleto + entBoleto + saiBoleto) > 0) {
						rows.push([
							{
								text: 'Boleto',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antBoleto) || '0,00',  // Anterior Boleto
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entBoleto) || '0,00',  // Entrada Boleto
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiBoleto) || '0,00',  // Saída Boleto
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antBoleto + entBoleto - saiBoleto)) || '0,00',  // Saldo Boleto
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}

					if ((antOutro + entOutro + saiOutro) > 0) {
						rows.push([
							{
								text: 'Outro',
								style: {
									alignment: 'left'
								}									
							},							
							{
								text: utils.number.float2moeda(antOutro) || '0,00',  // Anterior Outro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(entOutro) || '0,00',  // Entrada Outro
								style: {
									alignment: 'right'
								}							
							},
							{
								text: utils.number.float2moeda(saiOutro) || '0,00',  // Saída Outro,
								style: {
									alignment: 'right'
								}
							},						
							{
								text: utils.number.float2moeda((antOutro + entOutro - saiOutro)) || '0,00',  // Saldo Outro,
								style: {
									alignment: 'right'
								}
							},
							{
								colSpan: 3,
								text: impLinhas == 0 ? 'CAIXA': '',
								fontSize: 8,								
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}							
							},{},{},
							{
								colSpan: 2,
								text: impLinhas == 0 ? 'VISTO': '',
								fontSize: 8,
								border: [false, false, true, false],
								style: {
									alignment: 'left'
								}
							},{}
						]);
						impLinhas++;
					}
// Soma dos Totalizadores

					rows.push([
						{
							text: 'TOTAL',
							style: {
								bold: true,
								alignment: 'left'
							}									
						},							
						{
							text: utils.number.float2moeda((antDinheiro  + antCheque        + antCredito  + antDebito   +
								                          antCreditoloja + antCreditopessoa + antAlimentacao + antRefeicao + antPresente +
								                          antCombustivel + antDuplicata   + antBoleto   + antOutro)) || '0,00',  // Anterior
							style: {
								alignment: 'right'
							}							
						},
						{
							text: utils.number.float2moeda((entDinheiro  + entCheque        + entCredito     + entDebito   +
							                              entCreditoloja + entCreditopessoa + entAlimentacao + entRefeicao + entPresente +
								                          entCombustivel + entDuplicata     + entBoleto      + entOutro)) || '0,00',  // Entradas

							style: {
								alignment: 'right'
							}							
						},
						{
							text: utils.number.float2moeda((saiDinheiro  + saiCheque        + saiCredito  + saiDebito   +
								                          saiCreditoloja + saiCreditopessoa + saiAlimentacao + saiRefeicao + saiPresente +
								                          saiCombustivel + saiDuplicata     + saiBoleto   + saiOutro)) || '0,00', // Saidas
							style: {
								alignment: 'right'
							}
						},						
						{
							text: utils.number.float2moeda(((antDinheiro  + antCheque        + antCredito  + antDebito +
							                               antCreditoloja + antCreditopessoa + antAlimentacao + antRefeicao + antPresente +
								                           antCombustivel + antDuplicata     + antBoleto   + antOutro)	+
								                          (entDinheiro    + entCheque        + entCredito  + entDebito   +
                                						   entCreditoloja + entCreditopessoa + entAlimentacao + entRefeicao + entPresente +
								                           entCombustivel + entDuplicata     + entBoleto   + entOutro)   -
								                          (saiDinheiro    + saiCheque        + saiCredito  + saiDebito   +
					                             	       saiCreditoloja + saiCreditopessoa + saiAlimentacao + saiRefeicao + saiPresente +
								                           saiCombustivel + saiDuplicata     + saiBoleto   + saiOutro))) || '0,00', // Saldo
								                          
							style: {
								alignment: 'right'
							}
						},
						{
							colSpan: 3,
							text: impLinhas == 0 ? 'CAIXA': '',
							fontSize: 8,								
							border: [false, false, true, true],
							style: {
								alignment: 'left'
							}							
						},{},{},
						{
							colSpan: 2,
							text: impLinhas == 0 ? 'VISTO': '',
							fontSize: 8,
							border: [false, false, true, true],
							style: {
								alignment: 'left'
							}
						},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};