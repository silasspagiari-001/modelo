'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird'); 

const obterDados = function(db, params) {
    return new Promise(async (resolve, reject) => {

        const {remessa} = params;
		const splitPathRemessa = remessa.split('/');
		const nomeRemessa = splitPathRemessa[ splitPathRemessa.length-1 ];
		
		const sql = `
				select PESSOAS_NOME,
					CIDADES_NOME,
					CIDADES_ESTADO,
					PESSOAS_CEP,
					FINANCEIROS_NUMERO,
					FINANCEIROS_SERIE,
					FINANCEIROS_PARCELA,
					FINANCEIROS_ID_PESSOAS,
					FINANCEIROS_NOSSONUMERO,
					FINANCEIROS_EMISSAO,
					FINANCEIROS_VENCIMENTO,
					FINANCEIROS_ABERTO,
					FINANCEIROS_LOG,
					BANCOS_NOME,
					PORTADORES_AGENCIA,
					PORTADORES_CONTA,
					PORTADORES_CONVENIO,
					PORTADORES_CARTEIRA
				from FINANCEIROS
				join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
				join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
				join BANCOS on BANCOS_ID = PORTADORES_ID_BANCOS
				join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADESCOBRANCA
				where FINANCEIROS_LOG = '${ nomeRemessa }'
			`

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

module.exports = {
    read: async (params) => {
		let totalTitulos = 0;

		const db = await samosFB.conectarBanco(params.client); 
		let dadosRemessas = await obterDados(db, params);

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
								'Relação de títulos a enviar ao banco(Reimpressão)',
								{
									text: dadosRemessas.length > 0 ? 
										     ' Banco: '    + dadosRemessas[0]['BANCOS_NOME'] +
										     ' Agência: '  + dadosRemessas[0]['PORTADORES_AGENCIA'] +
										     ' Conta: '    + dadosRemessas[0]['PORTADORES_CONTA'] +
										     ' Convênio: ' + dadosRemessas[0]['PORTADORES_CONVENIO'] +
										     ' Carteira: ' + dadosRemessas[0]['PORTADORES_CARTEIRA'] : 'Nada a imprimir',
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
				
                for(let i in dadosRemessas){
                    const cepArray = (dadosRemessas[i]['PESSOAS_CEP'] || '').split('');
                    cepArray.splice(5,0,'-');
					const cepMascarado = cepArray.join('');

                   linhas.push([
                        {
                            text: dadosRemessas[i]['FINANCEIROS_NUMERO'],
                            style: {
                                alignment: 'right'
                            }
						},
                        {
                            text: dadosRemessas[i]['FINANCEIROS_SERIE'],
                            style: {
                                alignment: 'center'
                            }
                        },						
						{
                            text: dadosRemessas[i]['FINANCEIROS_PARCELA'],
                            style: {
                                alignment: 'right'
                            }
						},
						{
                            text: dadosRemessas[i]['FINANCEIROS_ID_PESSOAS'],
                            style: {
                                alignment: 'right'
                            }
						}, 
						dadosRemessas[i]['PESSOAS_NOME'],
						dadosRemessas[i]['CIDADES_NOME'],
						{
                            text: dadosRemessas[i]['CIDADES_ESTADO'],
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
                            text: dadosRemessas[i]['FINANCEIROS_NOSSONUMERO'],
                            style: {
                                alignment: 'right'
                            }
						},
						{
                            text: moment(dadosRemessas[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
                            style: {
                                alignment: 'center'
                            }
						},
						{
                            text: moment(dadosRemessas[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
                            style: {
                                alignment: 'center'
                            }
						},
						{
							text: utils.number.float2moeda(dadosRemessas[i]['FINANCEIROS_ABERTO']),
                            style: {
								alignment: 'right'
							}
						}
					]);

					totalTitulos += dadosRemessas[i]['FINANCEIROS_ABERTO'];

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
