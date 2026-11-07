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
        const { idPortador } = params;
		let modelPortador = [];
		let totalTitulos = 0;

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
								'Relação de títulos a enviar ao banco',
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
						widths: [60, 30, 20, 35, '*', 'auto', 17, 45, 50, 50, 50, 80],
                        body: [
                            [
                                {
                                    text: 'N.º',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Série',
									style: 'cabecalhoTabela'
                                }, {									
                                    text: 'Par',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Pessoa',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'Nome',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Cidade',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'UF',
                                    style: 'cabecalhoTabela'
                                },  {
                                    text: 'CEP',
									style: 'cabecalhoTabela'
                                }, {
                                    text: 'N. Número',
                                    style: 'cabecalhoTabela'									
								}, {
                                    text: 'Emissão',
                                    style: 'cabecalhoTabela'
                                }, {									
                                    text: 'Vcto',
                                    style: 'cabecalhoTabela'
                                }, {
                                    text: 'Valor',
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
                    const cepArray = (listaModels[i]['PESSOAS_CEP'] || '').split('');
                    cepArray.splice(5,0,'-');
					const cepMascarado = cepArray.join('');

                   linhas.push([
                        {
                            text: listaModels[i]['FINANCEIROS_NUMERO'],
                            style: {
                                alignment: 'right'
                            }
						},
                        {
                            text: listaModels[i]['FINANCEIROS_SERIE'],
                            style: {
                                alignment: 'center'
                            }
                        },						
						{
                            text: listaModels[i]['FINANCEIROS_PARCELA'],
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
						listaModels[i]['CIDADES_NOME'],
						{
                            text: listaModels[i]['CIDADES_ESTADO'],
                            style: {
                                alignment: 'center'
                            }
						},
						{
                            text: cepMascarado,
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
							text: utils.number.float2moeda(listaModels[i]['FINANCEIROS_ABERTO']),
                            style: {
								alignment: 'right'
							}
						}
					]);

					totalTitulos += listaModels[i]['FINANCEIROS_ABERTO'];

                }

				linhas.push([
					{
						colSpan: 11,
						text: 'VALOR TOTAL REMESSA',
						style: {
							alignment: 'right'
						}
					},{},{},{},{},{},{},{},{},{},{},
					{
						text: utils.number.float2moeda(totalTitulos),
						style: {
							alignment: 'right',
							bold: true
						}
					}
				]);

				pdfStream(docDefinition, resolve, reject);
            } catch (error) {
				reject(error);
				console.log(error);
            }
        });
    }
};
