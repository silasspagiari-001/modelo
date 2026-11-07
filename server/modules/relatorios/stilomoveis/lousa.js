'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const grams     = utils.number.grams.bind(utils.number);

module.exports = {
    create: async (lousa, params) => {
		const hoje = moment.tz(params.timezone).format('DD/MM/YYYY');
		const docDefinition = {
			pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [15, 20, 10, 10],
			content: [
				{
					style: 'tabelaExemplo',
					table: {
//						widths: [35, 200,            60, 70, 70, 70],
						widths: [35, 36, 36, 36, 95, 60, 60, 60, 60], // 9 Cols
						headerRows: 1,						
						body: [
                            [
                                {
                                    text: 'Código',
									style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Produto',
									style: 'cabecalhoTabela',
									colSpan: 4
                                },{},{},{},
								{
                                    text: 'Quantidade',
									style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Parcelado',
									style: 'cabecalhoTabela'									
                                }, 
								{
                                    text: 'À Vista',
                                    style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Promoção',
                                    style: 'cabecalhoTabela'
                                }
							]
						]
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
					border: 0.5,
					fontSize: 9 
				},
				cabecalhoTabela: {
					bold: true,
					fontSize: 10,
					color: 'black',
                    fillColor: '#E3E3E3',
					alignment: 'center'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			try {
				const linhas = docDefinition.content[0].table.body;
				const listaModels = lousa.produtos;

				let somaParcelado = 0;
				let somaVista     = 0;
				let somaPromocao  = 0;
				
                for(let i in listaModels){

                   linhas.push([
                        {
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: listaModels[i]['PRODUTOS_ID'] },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
                            style: {
                                alignment: 'right'
                            }
                        },
						{
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: listaModels[i]['DESCRICAO'] },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
							colSpan: 4
						},{},{},{},
						{
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: utils.number.inteiroComSeparador(listaModels[i]['QUANTIDADE']) },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
                            style: { alignment: 'right' }
						},						
						{
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: utils.number.inteiroComSeparador(grams(listaModels[i]['PARCELADO'])) },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
							style: { alignment: 'right' }
						},						
						{
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: utils.number.inteiroComSeparador(grams(listaModels[i]['AVISTA'])) },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
                            style: { alignment: 'right' }
						}, 
						{
                            text: [
								{ text: 'a\n', color: 'white', fontSize: 3 },
								{ text: grams(listaModels[i]['PROMOCAO']) > 0 ? utils.number.inteiroComSeparador(grams(listaModels[i]['PROMOCAO'])) : '' },
								{ text: '\na', color: 'white', fontSize: 3 }
							],
                            style: { alignment: 'right' }
						}
					]);

					somaParcelado += grams(listaModels[i]['PARCELADO']);
					somaVista     += grams(listaModels[i]['AVISTA']);
					somaPromocao  += grams(listaModels[i]['PROMOCAO']);	
                }

				linhas.push([
					{
						text: [
							{ text: `Data:`},							
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: `${hoje}`, bold: true},														
							{ text: '\na', color: 'white', fontSize: 3 }
						],
						colSpan: 2
					},{},
					{
						text: [
							{ text: `Vendedor(a):`},							
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: `${lousa.usuario}`, bold: true},
							{ text: '\na', color: 'white', fontSize: 3 }
						],						
						colSpan: 2
					},{},
					{
						text: [
							{ text: `WhatsApp:`},
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: `${utils.string.maskFone(lousa.celular)}`, bold: true},
							{ text: '\na', color: 'white', fontSize: 3 }
						]
					},
					{
						text: [
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: 'Totais', bold: true },
							{ text: '\na', color: 'white', fontSize: 3 }
						],
						style: { alignment: 'right'	}						
					},
					{
						text: [
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: utils.number.inteiroComSeparador(somaParcelado), bold: true },
							{ text: '\na', color: 'white', fontSize: 3 }
						],
						style: { alignment: 'right'	}
					},						
					{
						text: [
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: utils.number.inteiroComSeparador(somaVista), bold: true },
							{ text: '\na', color: 'white', fontSize: 3 }
						],
						style: { alignment: 'right' }
					}, 
					{
						text: [
							{ text: '\na\n', color: 'white', fontSize: 3 },
							{ text: utils.number.inteiroComSeparador(somaPromocao), bold: true },
							{ text: '\na', color: 'white', fontSize: 3 }
						],
						style: { alignment: 'right' }
					}
				]);		
				
				pdfStream(docDefinition, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }
};
