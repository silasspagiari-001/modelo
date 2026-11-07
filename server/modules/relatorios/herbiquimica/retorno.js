'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    create: async (listaModels, params) => {
        const { idPortador } = params;
		let modelPortador = [];

		let totalEntradas = 0;
		let totalLiquidacao = 0;
		let totalTaxas = 0;
		let totalJuros = 0;

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
	
			modelPortador = queryPortador.results[0];
		}

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		const docDefinition = {
			pageOrientation: 'landscape',
			margin: 0,
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
								'Relação de títulos - retorno do banco',
								{
									text: ' Banco: '    + modelPortador['BANCOS_NOME'] +
										  ' Agência: '  + modelPortador['PORTADORES_AGENCIA'] +
										  ' Conta: '    + modelPortador['PORTADORES_CONTA'] +
										  ' Convênio: ' + modelPortador['PORTADORES_CONVENIO'] +
										  ' Carteira: ' + modelPortador['PORTADORES_CARTEIRA'],
									style: 'subheader'
								},
							],
							width: '*',
							style: {
								fontSize: 16,
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
					]
				},
				{
					style: 'tabelaExemplo',
					table: {
						widths: [30, 20, 30, 30, '*', 'auto', 50, 50, 40, 30, 30, 30, 40, 'auto'],
						headerRows: 1,						
						body: [
                            [
                                {
                                    text: 'N.º',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Par',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'N.Numero',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Pessoa',
									style: 'cabecalhoTabela'									
                                }, {
                                    text: 'Nome',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Emissão',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'Vcto',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'Pgto',
                                    style: 'cabecalhoTabela'
								}, {
                                    text: 'Original',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Desc',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Taxas',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Juros',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Valor Pg',
                                    style: 'cabecalhoTabela'
                                }, {
									text: 'Ocor.',
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
					fontSize: 8,
					bold: true,
					color: 'black'
				},
				tabelaExemplo: {
					margin: [0, 10, 0, 0],
					border: 0.5,
					fontSize: 9 
				},
				cabecalhoTabela: {
					bold: true,
					fontSize: 10,
					color: 'black',
					alignment: 'center'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			try {
				const linhas = docDefinition.content[1].table.body;
				
                for(let i in listaModels){

                   linhas.push([
                        {
                            text: listaModels[i]['FINANCEIROS_NUMERO'],
                            style: {
                                alignment: 'right'
                            }
                        },
						{
                            text: listaModels[i]['FINANCEIROS_PARCELA'],
                            style: {
                                alignment: 'right'
                            }
						},
						{
                            text: listaModels[i]['FINANCEIROS_NOSSONUMERO'],
                            style: {
                                alignment: 'right'
                            }
						},						
						{
                            text: listaModels[i]['FINANCEIROS_ID_PESSOAS'],
                            style: {
                                alignment: 'right'
                            }
						}, 
						listaModels[i]['PESSOAS_NOME'],
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
							text: listaModels[i]['FINANCEIROS_OBSERVACOES'].substring(0, 2) == '06' ?
							      listaModels[i]['FINANCEIROS_PAGAMENTO'].split('-').reverse().join('/') : '',
                            style: {
                                alignment: 'center'
                            }
						},
						{
                            text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_ORIGINAL']),
                            style: {
                                alignment: 'right'
                            }
						},
						{
							text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_DESCONTOS']),
                            style: {
								alignment: 'right'
							}
						},
						{
							text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_TAXAS']),
                            style: {
								alignment: 'right'
							}
						},
						{
							text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_JUROS']),
                            style: {
								alignment: 'right'
							}
						},
						{
							text: listaModels[i]['FINANCEIROS_OBSERVACOES'].substring(0, 2) == '06' ?
						      	  utils.number.float2moeda(listaModels[i]['FINANCEIROS_PAGO']) : '',
                            style: {
								alignment: 'right'
							}
						},
						{
                            text: listaModels[i]['FINANCEIROS_OBSERVACOES']
						}
					]);

					if(listaModels[i]['FINANCEIROS_OBSERVACOES'].substring(0, 2) == '02') { // Entrada confirmada
						totalEntradas += cents(listaModels[i]['FINANCEIROS_ORIGINAL']);
					} else {
						if(listaModels[i]['FINANCEIROS_OBSERVACOES'].substring(0, 2) == '06') { // Liquidação
							totalLiquidacao += cents(listaModels[i]['FINANCEIROS_PAGO']);
						}
					}

					console.log('pago: ', listaModels[i]['FINANCEIROS_PAGO'], ' obs: ', listaModels[i]['FINANCEIROS_OBSERVACOES']);

					totalTaxas += cents(listaModels[i]['FINANCEIROS_TAXAS']);
					totalJuros += cents(listaModels[i]['FINANCEIROS_JUROS']);

                }

				console.log('Total pago: ', totalLiquidacao);

				linhas.push([
					{
						colSpan: 11,
						text: 'TOTAL ENTRADAS',
						style: {
							alignment: 'right'
						}
					},{},{},{},{},{},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalEntradas / 100),
						style: {
							alignment: 'right',
							bold: true
						}
					},{},{}
				]);

				linhas.push([
					{
						colSpan: 11,
						text: 'TOTAL TAXAS',
						style: {
							alignment: 'right'
						}
					},{},{},{},{},{},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalTaxas / 100),
						style: {
							alignment: 'right',
							bold: true
						}
					},{},{}
				]);

				linhas.push([
					{
						colSpan: 11,
						text: 'TOTAL JUROS',
						style: {
							alignment: 'right'
						}
					},{},{},{},{},{},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalJuros / 100),
						style: {
							alignment: 'right',
							bold: true
						}
					},{},{}
				]);

				linhas.push([
					{
						colSpan: 11,
						text: 'TOTAL LIQUIDACAO',
						style: {
							alignment: 'right'
						}
					},{},{},{},{},{},{},{},{},{},{},
					{
						colSpan: 2,
						text: utils.number.float2moeda(totalLiquidacao / 100),
						style: {
							alignment: 'right',
							bold: true
						}
					},{},{}
				]);

				pdfStream(docDefinition, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }
};
