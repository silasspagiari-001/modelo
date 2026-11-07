'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const cents     = utils.number.cents.bind(utils.number);

const moment    = require('moment-timezone');

module.exports = {
    create: async (listaModels, params) => {

        const { idPortador } = params;

		let qtdeRegistrados = 0;
		let totalRegistrados = 0;
		let qtdeLiquidacao = 0;
		let totalLiquidacao = 0;
		let totalJuros = 0;
		let totalDescontos = 0;

		if(idPortador){
			const queryPortador = await api.portadores().read({
				conteudo: `.${idPortador}`,
				ordem: 0,
				status: 2,
				page: 1,
				start: 0,
				limit: 1,
				client: params.client
			});
	
		}

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		const docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 40, 20, 35],
			content: [
				{
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 100,
							height: 22,
						},
						{
							stack: [
								'Listagem do arquivo de retorno',
								{
									text: 'Retorno do dia: ' + params.inicio.replaceAll('.', '/'),
									style: 'subheader'
								},
							],
							width: '*',
							style: {
								fontSize: 16,
								alignment: 'center'
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
					]
				},
				{
					style: 'tabelaExemplo',
					table: { // 9 Cols
						widths: [40, 40, 40, 40, 32, 170, 40, 40, 40],
						headerRows: 1,						
						body: [
                            [
                                {
                                    text: 'Título',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Emissão',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Vencto',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Pagto',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Nosso Nº',
									style: 'cabecalhoTabela'									
                                }, {
                                    text: 'Cliente',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Original',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'Pago',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'Código',
                                    style: 'cabecalhoTabela'
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
			styles: {
				subheader: {
					fontSize: 10,
					bold: true,
					color: 'black'
				},
				tabelaExemplo: {
					margin: [0, 10, 0, 0],
					border: 0.5,
					fontSize: 7 
				},
				cabecalhoTabela: {
					bold: true,
					fontSize: 7,
					color: 'black',
					alignment: 'center'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			try {
				const linhas = docDefinition.content[1].table.body;
				
                for(let i in listaModels){

					if(cents(listaModels[i]['FINANCEIROS_PAGO']) > 0) {  // Só imprime os pagos
						linhas.push([
							{
								text: listaModels[i]['FINANCEIROS_NUMERO'] + "/" + utils.number.strZero(listaModels[i]['FINANCEIROS_PARCELA'], 2),
								style: {
									alignment: 'right'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_EMISSAO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_VENCIMENTO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_PAGAMENTO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_NOSSONUMERO'],
								style: {
									alignment: 'right'
								}
							}, 
							{
								text: listaModels[i]['FINANCEIROS_ID_PESSOAS'] + ' - ' + listaModels[i]['PESSOAS_NOME'].slice(0, 35)
							},
							{
								text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_ORIGINAL']),
								style: {
									alignment: 'right'
								}
							},
							{
								text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_PAGO']),
								style: {
									alignment: 'right'
								}
							},
							{
								text: (listaModels[i]['FINANCEIROS_CODIGO'] + '-' + listaModels[i]['FINANCEIROS_ESTADO']).slice(0, 12),
							}
						]);							
					}


					if(cents(listaModels[i]['FINANCEIROS_PAGO']) > 0) { // Liquidação
						qtdeLiquidacao ++;
						totalLiquidacao += cents(listaModels[i]['FINANCEIROS_PAGO']);
					} else {
						qtdeRegistrados ++;
						totalRegistrados += cents(listaModels[i]['FINANCEIROS_ORIGINAL']);
					}

					if(cents(listaModels[i]['FINANCEIROS_PAGO']) > cents(listaModels[i]['FINANCEIROS_ORIGINAL'])) {
						totalJuros += (cents(listaModels[i]['FINANCEIROS_PAGO']) - cents(listaModels[i]['FINANCEIROS_ORIGINAL']));
					}

					if(cents(listaModels[i]['FINANCEIROS_PAGO']) < cents(listaModels[i]['FINANCEIROS_ORIGINAL']) && cents(listaModels[i]['FINANCEIROS_PAGO']) > 0) {
						totalDescontos += (cents(listaModels[i]['FINANCEIROS_ORIGINAL']) - cents(listaModels[i]['FINANCEIROS_PAGO']));
					}

                }

				linhas.push([
					{
						colSpan: 6,
						text: `TOTAL DE TITULOS REGISTRADOS NO BANCO: (${qtdeRegistrados})`,
						style: {
							alignment: 'right'
						},
						border: [false, false, false, false]
					},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalRegistrados / 100),
						style: {
							alignment: 'right',
							bold: true
						},
						border: [false, false, false, false]
					},{},{
						text: '',
						border: [false, false, false, false]
					}
				]);

				linhas.push([
					{
						colSpan: 6,
						text: `TOTAL DE TITULOS RETORNADOS DO BANCO: (${qtdeLiquidacao})`,
						style: {
							alignment: 'right'
						},
						border: [false, false, false, false]
					},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda((totalLiquidacao - totalJuros) / 100),
						style: {
							alignment: 'right',
							bold: true
						},
						border: [false, false, false, false]
					},{},
					{
						text: '',
						border: [false, false, false, false]
					}
				]);

				linhas.push([
					{
						colSpan: 6,
						text: `TOTAL DE JUROS RECEBIDOS:`,
						style: {
							alignment: 'right'
						},
						border: [false, false, false, false]
					},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalJuros / 100),
						style: {
							alignment: 'right',
							bold: true
						},
						border: [false, false, false, false]
					},{},
					{
						text: '',
						border: [false, false, false, false]
					}
				]);

				linhas.push([
					{
						colSpan: 6,
						text: `TOTAL DE DESCONTOS CONCEDIDOS:`,
						style: {
							alignment: 'right'
						},
						border: [false, false, false, false]
					},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalDescontos / 100),
						style: {
							alignment: 'right',
							bold: true
						},
						border: [false, false, false, false]
					},{},{
						text: '',
						border: [false, false, false, false]
					}
				]);

				linhas.push([
					{
						colSpan: 6,
						text: 'TOTAL RECEBIDO COM JUROS',
						style: {
							alignment: 'right'
						},
						border: [false, false, false, false]
					},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda((totalLiquidacao)/100),
						style: {
							alignment: 'right',
							bold: true
						},
						border: [false, false, false, false]
					},{},
					{
						text: '',
						border: [false, false, false, false]
					}
				]);

				// agora imprimo qualquer retorno fora do normal.

				for(let i in listaModels){

					if((!listaModels[i]['FINANCEIROS_CODIGO'] || '').match(/2|6/)) {  // Os que não sejam pagos ou registrados
						linhas.push([
							{
								text: listaModels[i]['FINANCEIROS_NUMERO'] + "/" + utils.number.strZero(listaModels[i]['FINANCEIROS_PARCELA'], 2),
								style: {
									alignment: 'right'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_EMISSAO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_VENCIMENTO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_PAGAMENTO'].split('-').reverse().join('/'),
								style: {
									alignment: 'center'
								}
							},
							{
								text: listaModels[i]['FINANCEIROS_NOSSONUMERO'],
								style: {
									alignment: 'right'
								}
							}, 
							{
								text: listaModels[i]['FINANCEIROS_ID_PESSOAS'] + ' - ' + listaModels[i]['PESSOAS_NOME'].slice(0, 40)
							},
							{
								text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_ORIGINAL']),
								style: {
									alignment: 'right'
								}
							},
							{
								text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_PAGO']),
								style: {
									alignment: 'right'
								}
							},
							{
								text: (listaModels[i]['FINANCEIROS_CODIGO'] + '-' + listaModels[i]['FINANCEIROS_ESTADO']).slice(0, 12),
							}
						]);							
					}


					if(cents(listaModels[i]['FINANCEIROS_PAGO']) > 0) { // Liquidação
						qtdeLiquidacao ++;
						totalLiquidacao += cents(listaModels[i]['FINANCEIROS_PAGO']);
					} else {
						qtdeRegistrados ++;
						totalRegistrados += cents(listaModels[i]['FINANCEIROS_ORIGINAL']);
					}

					if(cents(listaModels[i]['FINANCEIROS_PAGO']) > cents(listaModels[i]['FINANCEIROS_ORIGINAL'])) {
						totalJuros += (cents(listaModels[i]['FINANCEIROS_PAGO']) - cents(listaModels[i]['FINANCEIROS_ORIGINAL']));
					}

					if(cents(listaModels[i]['FINANCEIROS_PAGO']) < cents(listaModels[i]['FINANCEIROS_ORIGINAL']) && cents(listaModels[i]['FINANCEIROS_PAGO']) > 0) {
						totalDescontos += (cents(listaModels[i]['FINANCEIROS_ORIGINAL']) - cents(listaModels[i]['FINANCEIROS_PAGO']));
					}

                }

				// fim do novo bloco

				pdfStream(docDefinition, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }
};
