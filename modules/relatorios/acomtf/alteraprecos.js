'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    create: async (listaModels, params) => {

		console.log('params: ', params);

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
								'Relação de Alteração de Preços',
								{
									text: ' Grupo: ' + listaModels[0]['PRODUTOS_ID_GRUPOS'] +
										  ' - '   + listaModels[0]['GRUPOS_NOME'],
									style: 'subheader'
								},
							],
							width: '*',
							style: {
								fontSize: 12,
								alignment: 'center',
								color: 'blue'
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
						widths: [30, 245, 16, 40, 40, 40, 40, 40],
                        body: [
                            [
                                {
                                    text: 'Cód',
									style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Nome',
									style: 'cabecalhoTabela'
                                }, 
								{									
                                    text: 'Uni',
									style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Margem',
									style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Preço',
                                    style: 'cabecalhoTabela'
                                }, 
								{
                                    text: 'Margem Min',
                                    style: 'cabecalhoTabela'
                                },  
								{
                                    text: 'Preço Min',
                                    style: 'cabecalhoTabela'
                                },  
								{
                                    text: 'Comissão',
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
					margin: [0, 10, 0, 0],
					border: 0.5,
					fontSize: 8 
				},
				cabecalhoTabela: {
					bold: true,
					fontSize: 6,
					color: 'black',
					alignment: 'center'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			try {
				const linhas = docDefinition.content[1].table.body;
				
                for(let i in listaModels){

				   const model = listaModels[i];

                   linhas.push([
                        {
                            text: model['PRODUTOS_ID'],
                            style: {
                                alignment: 'right'
                            }
						},
                        {
                            text: `${model['PRODUTOS_NOME']} ${model['PRODUTOS_MARCA']}`
                        },						
						{
                            text: model['PRODUTOS_UNIDADE'],
                            style: {
                                alignment: 'center'
                            }
						},
						{
                            text: (model['NOVO_MARGEM'] > 0 ? utils.number.float2moeda(model['NOVO_MARGEM']) : ''),
                            style: {
                                alignment: 'right'
                            }
						}, 
						{
                            text: (model['NOVO_PRECO'] > 0 ? utils.number.float2moeda(model['NOVO_PRECO']) : ''),
                            style: {
                                alignment: 'right'
                            }
						}, 						
						{
                            text: (model['NOVO_MARGEMMINIMA'] > 0 ? utils.number.float2moeda(model['NOVO_MARGEMMINIMA']) : ''),
                            style: {
                                alignment: 'right'
                            }
						}, 
						{
                            text: (model['NOVO_PRECOMINIMO'] > 0 ? utils.number.float2moeda(model['NOVO_PRECOMINIMO']) : ''),
                            style: {
                                alignment: 'right'
                            }
						}, 						
						{
                            text: (model['NOVO_COMISSAO'] > 0 ? utils.number.float2moeda(model['NOVO_COMISSAO']) : ''),
                            style: {
                                alignment: 'right'
                            }
						}
					]);

                }

				pdfStream(docDefinition, resolve, reject);
            } catch (e) {
				reject(e);
				console.log(e);
            }
        });
    }
};
