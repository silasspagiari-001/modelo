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
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',					
					table: {  //[TIME/USER]  PE  NOM DIN CHE PRE CAR CRN FIN TRB SLD
//						widths: [ 1   2   3   4    5   6   7   8   9  10  11  12, 13]
						widths: [35, 14, 30, 30, 220, 44, 44, 44, 44, 44, 44, 44, 44],
						headerRows: 4,
						body: []
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
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 8
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.caixa().read(params)
				.then(async res => {
					let rows             = docDefinition.content[1].table.body;
					let totPartida       = 0,
					    totDepositoBanco = 0,
						totDepositoLoja  = 0,
						entDinheiro      = 0,
					    entCheque        = 0,
					    entChequePre     = 0,
					    entCartao        = 0,
						entCarne         = 0,
						entFinanceira    = 0,	
						entTransferencia = 0,					
						saiDinheiro      = 0,
					    saiCheque        = 0,
					    saiChequePre     = 0,
					    saiCartao        = 0,
						saiCarne         = 0,
						saiFinanceira    = 0,	
						saiTransferencia = 0,					
						impLinhas        = 0;

					const cents = utils.number.cents.bind(utils.number);						

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
	
					rows.push([
						{
							image: pathLogo,
							width: 100,
							height: 22,	
							alignment: 'left',
							border: [false, false, false, false]
						},
						{
							text: 'MOVIMENTO CAIXA',
							alignment: 'center',
							colSpan: 11,
							fontSize: 18,							
							color: 'red',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},
						{
							text: '',
							border: [false, false, false, false]
						}
					],					
					[
						{
							text: 'Empresa:',
							style: 'tableExample',
							alignment: 'right',
							colSpan: 2,
							border: [true, true, false, false]
						},{},
						{
							text: res.results[0]['EMPRESAS_NOME'],
							style: 'tableHeader',
							colSpan: 4,
							alignment: 'left',
							border: [false, true, false, false]
						},{},{},{},
						{
							text: 'Data:',
							style: 'tableExample',
							alignment: 'right',
							border: [false, true, false, false]
						},
						{
							text: params.emissao,
							style: 'tableHeader',
							alignment: 'left',
							colSpan: 6,
							border: [false, true, true, false]							
						},{},{},{},{},{}
					],
					[
						{
							text: 'Filial:',
							style: 'tableExample',
							alignment: 'right',
							colSpan: 2,
							border: [true, false, false, true]
						},{},
						{
							text: res.results[0]['EMPRESAS_FANTASIA'],
							style: 'tableHeader',
							colSpan: 4,
							alignment: 'left',
							bold: true,
							border: [false, false, false, true]
						},{},{},{},
						{
							text: 'Cidade:',
							style: 'tableExample',
							alignment: 'right',
							border: [false, false, false, true]							
						},
						{
							text: res.results[0]['CIDADES_NOME'],
							style: 'tableHeader',
							alignment: 'left',
							colSpan: 6,
							border: [false, false, true, true]
						},{},{},{},{},{}
					],
					[
						{
							text: 'Hora',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Usuário',
							style: 'tableHeader',
							alignment: 'center',
							colSpan: 2
						},{},
						{
							text: 'Número',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Descrição do Lançamento',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Dinheiro',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Cheque',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Cheque-Pré',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Cartão',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Carnê',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Financeira',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Transf./Pix',
							style: 'tableHeader',
							alignment: 'center'
						},
						{
							text: 'Saldo',
							style: 'tableHeader',
							alignment: 'center'
						}
					]);						

					for(let i in res.results){

						const model = res.results[i];

						let numPed = (cents(model['MOVIMENTOS_NUMERO']) > 0 ? ("000000" + model['MOVIMENTOS_NUMERO']).slice(-6) : '');
						let eS     = model['MOVIMENTOSCAIXA_TIPO'];

                        if((model['MOVIMENTOS_SERIE'] == 'PE' || model['MOVIMENTOS_SERIE'] == 'PV') && model['MOVIMENTOSCAIXA_TIPO'] == 'E') {
							totPartida += model['MOVIMENTOS_IMPOSTO'];
						}

						let descriLancamento = model['MOVIMENTOSCAIXA_NOME'].substring(0, 50);

						let lanDinheiro      = model['MOVIMENTOSCAIXA_DINHEIRO'],
							lanCheque        = model['MOVIMENTOSCAIXA_CHEQUE'],
							lanChequePre     = 0,
							lanCredito       = model['MOVIMENTOSCAIXA_CREDITO'],
							lanDebito        = model['MOVIMENTOSCAIXA_DEBITO'],
							lanCarne         = model['MOVIMENTOSCAIXA_DUPLICATA'],
							lanFinanceira    = model['MOVIMENTOSCAIXA_OUTRO'],
							lanTransferencia = model['MOVIMENTOSCAIXA_TRANSFERENCIAS'],							
							lanSaldo         = model['MOVIMENTOSCAIXA_SALDO'],
							lanTotal         = model['MOVIMENTOSCAIXA_TOTAL'];

						if(eS == 'E') {
							entDinheiro      += lanDinheiro;
							entCheque        += lanCheque;
							entCartao        += (lanCredito + lanDebito);
							entCarne         += lanCarne;
							entFinanceira    += lanFinanceira;
							entTransferencia += lanTransferencia;
						} else if(eS == 'S') {

							saiDinheiro      += lanDinheiro;
							saiCheque        += lanCheque;
							saiCartao        += (lanCredito + lanDebito);
							saiCarne         += lanCarne;
							saiFinanceira    += lanFinanceira;
							saiTransferencia += lanTransferencia;
						}

						let sinal = '';

						if(eS == 'S') {
							sinal = '-'
						} else {
							sinal = '';
						}

						rows.push([
							{
								text: model['MOVIMENTOSCAIXA_HORA'],
								style: 'tableExample',
								alignment: 'center',
							},	
							{
								text: model['USUARIOS_LOGIN'].substring(0, 20),
								fontSize: 7,								
								colSpan: 2
							},{},
							{
								text: numPed,
								style: 'tableExample',								
								alignment: 'center'
							},						
							{
								text: descriLancamento,
								style: 'tableExample',								
                            },
							{
								text: (lanDinheiro ? sinal : '') + utils.number.float2moeda(lanDinheiro),
								color: (eS == 'E' ? 'black' : 'red'),
								style: 'tableExample',								
								alignment: 'right'
							},
							{
								text: (lanCheque ? sinal : '') + utils.number.float2moeda(lanCheque),
								color: (eS == 'E' ? 'black' : 'red'),
								style: 'tableExample',								
								alignment: 'right'
							},
							{
								text: (lanChequePre ? sinal : '') + utils.number.float2moeda(lanChequePre),
								color: (eS == 'E' ? 'black' : 'red'),								
								style: 'tableExample',
								alignment: 'right'								
							},
							{
								text: ((lanCredito + lanDebito) ? sinal : '') + utils.number.float2moeda(lanCredito + lanDebito),
								color: (eS == 'E' ? 'black' : 'red'),
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: (lanCarne ? sinal : '') + utils.number.float2moeda(lanCarne),
								color: (eS == 'E' ? 'black' : 'red'),
								style: 'tableExample',
								alignment: 'right'
							},
							{
								text: (lanFinanceira ? sinal : '') + utils.number.float2moeda(lanFinanceira),
								color: (eS == 'E' ? 'black' : 'red'),
								style: 'tableExample',								
								alignment: 'right'
							},
							{
								text: (lanTransferencia ? sinal : '') + utils.number.float2moeda(lanTransferencia),
								color: (eS == 'E' ? 'black' : 'red'),								
								style: 'tableExample',								
								alignment: 'right'
                            },							
							{
								text: utils.number.float2moeda(lanSaldo),
								color: (lanSaldo > 0 ? 'black' : 'red'),
								style: 'tableExample',
								alignment: 'right'
							}							
						]);
/*
						if((model['MOVIMENTOSCAIXA_NOME'] ||'').match(/SANGRIA/i) || (model['MOVIMENTOSCAIXA_NOME'] ||'').match(/FECHAMENTO/i)) {
							totSangria += (lanCheque + lanDinheiro);
						}*/

						if(model['MOVIMENTOSCAIXA_EXPORTADO'] == 'X') {
							totDepositoLoja += (lanCheque + lanDinheiro);
						} else if(model['MOVIMENTOSCAIXA_EXPORTADO'] == 'Z') {
							totDepositoBanco += (lanCheque + lanDinheiro); 
						}

						impLinhas++
						
					}

					rows.push([
						{
							colSpan: 5,
							text: 'Totais Entradas',
							fontSize: 8,
							style: 'tableHeader',
							alignment: 'right',
							border: [false, false, false, false]
						},{},{},{},{},
						{
							text: utils.number.float2moeda(entDinheiro),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: utils.number.float2moeda(entCheque),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: utils.number.float2moeda(entChequePre),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]							
						},						
						{
							text: utils.number.float2moeda(entCartao),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: utils.number.float2moeda(entCarne),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]							
						},
						{
							text: utils.number.float2moeda(entFinanceira),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: utils.number.float2moeda(entTransferencia),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: '',
							border: [false, false, false, false]
						}						
					]);

					rows.push([
						{
							colSpan: 5,
							text: 'Totais Saídas',
							fontSize: 8,
							style: 'tableHeader',
							alignment: 'right',
							border: [false, false, false, false]
						},{},{},{},{},
						{
							text: (saiDinheiro ? '-' : '') + utils.number.float2moeda(saiDinheiro),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: (saiCheque ? '-' : '') + utils.number.float2moeda(saiCheque),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: (saiChequePre ? '-' : '') + utils.number.float2moeda(saiChequePre),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]							
						},						
						{
							text: (saiCartao ? '-' : '') + utils.number.float2moeda(saiCartao),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: (saiCarne ? '-' : '') + utils.number.float2moeda(saiCarne),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]							
						},
						{
							text: (saiFinanceira ? '-' : '') + utils.number.float2moeda(saiFinanceira),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: (saiTransferencia ? '-' : '') + utils.number.float2moeda(saiTransferencia),
							color: 'red',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false]
						},
						{
							text: '',
							border: [false, false, false, false]
						}						
					]);

					rows.push([
						{
							colSpan: 7,
							alignment: 'center',
							text: [
								{
									text: `Total de Registros: `,
									style: {fontSize: 10}
								},
								{
									text: impLinhas,
									style: {fontSize: 10, bold: true}
								},
								{
									text: `     Total Partida: `,
									style: {fontSize: 10}
								},
								{
									text: utils.number.float2moeda(totPartida),
									alignment: 'right',
									style: {fontSize: 10, bold: true}
								}
							],
							border: [false, false, false, false]
						},{},{},{},{},{},{},
						{
							text: '',
							colSpan: 6,
							border: [false, false, false, false]
						},{},{},{},{},{},
					]);

					rows.push([
						{
							text: ` `,
							style: {fontSize: 8},
							border: [false, false, false, false],
							colSpan: 13
						},{},{},{},{},{},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Sangria de Caixa',
							colSpan: 13,
							fontSize: 14
						},{},{},{},{},{},{},{},{},{},{},{},{}
					])

					rows.push([
						{
							colSpan: 13,
							style: {fontSize: 10, bold: true},
							border: [true, true, true, true],
							table: {  //  T   E   A   T   E   A   T   E   A   T   E   A   T   E   A 
								widths: [40,  7, 73, 40,  7, 73, 55,  7, 73, 55,  7, 73, 55,  7, 73],
								body: [
									[
										{border: [false, false, false, false], text: 'Dinheiro', alignment: 'right'},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: ''},										
										{border: [false, false, false, false], text: 'Cheque', alignment: 'right'},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: ''},										
										{border: [false, false, false, false], text: 'Cheque-Pré', alignment: 'right'},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: ''},										
										{border: [false, false, false, false], text: 'Depósito', alignment: 'right'},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: 'Conferência', alignment: 'right'},
										{border: [false, false, false, false], text: ''},
										{border: [false, false, false, false], text: ''}										

									],
									[ 
										{border: [false, false, false, false],  text: utils.number.float2moeda(totDepositoLoja), alignment: 'right'},
										{border: [false, false, false, false],  text: ''},
										{border: [false, true, false, false],   text: 'Visto Gerente', alignment: 'center', },										
										{border: [false, false, false, false],  text: '0,00', alignment: 'right' },
										{border: [false, false, false, false],  text: ''},
										{border: [false, true, false, false],   text: 'Visto Gerente', alignment: 'center'},
										{border: [false, false, false, false],  text: '0,00', alignment: 'right' },
										{border: [false, false, false, false],  text: ''},
										{border: [false, true, false, false],   text: 'Visto Gerente', alignment: 'center'},
										{border: [false, false, false, false],  text: utils.number.float2moeda(totDepositoBanco), alignment: 'right'},
										{border: [false, false, false, false],  text: ''},
										{border: [false, true, false, false],   text: 'Visto Gerente', alignment: 'center'},
										{border: [false, false, false, false],  text: 'Financeiro', alignment: 'right'},
										{border: [false, false, false, false],  text: ''},
										{border: [false, true, false, false],   text: 'Visto Financeiro', alignment: 'center'}
									]
								]
							}
						},{},{},{},{},{},{},{},{},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};