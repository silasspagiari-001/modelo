'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getPortadores = async function(params){
	return new Promise(async (resolve, reject) => {
		const { conteudo, ordem, status, start, limit, empresa } = params;
		const db = await samosFB.conectarBanco(params.client);
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

		let sqlWhere   = `where PORTADORES_ID > 0  `;
			sqlWhere   += status == 0 ? `and PORTADORES_STATUS = 'T' ` : status == 1 ? `and PORTADORES_STATUS = 'F' ` : '';
			sqlWhere   += empresa ? `and PORTADORES_ID_EMPRESAS = ${empresa} ` : '';
			let sqlOrder   = '';
		
		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and PORTADORES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
		} else {            
			if(ordem == 0) {
				sqlWhere += `and PORTADORES_NOME like '${conteudo}%' `; 
				sqlOrder = ' order by PORTADORES_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and PORTADORES_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by PORTADORES_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += `and PORTADORES_FANTASIA like '%${conteudo}%' `;
				sqlOrder = ' order by PORTADORES_FANTASIA ';  
			} else if (ordem == 3) {
				sqlWhere += `and PORTADORES_CPFCNPJ like '%${conteudo}%' `;
				sqlOrder = ' order by PORTADORES_CPFCNPJ ';  
			} else if (ordem == 4) {
				sqlWhere += conteudo > 0 ? `and PORTADORES_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by PORTADORES_ID ';  
			} else if(ordem == 5){
				try {
					const id = await samosFB.buscaMultipla({
						db, conteudo,
						tabela: 'PORTADORES',
						chave: 'PORTADORES_ID',
						campos: [
							'PORTADORES_ID', 
							'PORTADORES_NOME', 
							'PORTADORES_CPFCNPJ'
						]
					});

					sqlWhere += `and PORTADORES_ID = '${id}' `;
					sqlOrder = ' order by PORTADORES_ID '; 
				} catch (e) {
					reject(e);
				}
			}
		}    

		const sqlCount  = `select count(*) from PORTADORES ${sqlWhere} `
		const sqlSearch = `select ${limits} PORTADORES.*,
					 CIDADES_NOME,
					 CIDADES_ESTADO,
					 CIDADES_IBGE,
					 BANCOS_NOME,
					 (BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
					 EMPRESAS_NOME, 
					 EMPRESAS_FANTASIA from PORTADORES
					 left outer join EMPRESAS on EMPRESAS_ID = PORTADORES_ID_EMPRESAS
					 left outer join CIDADES on CIDADES_ID = PORTADORES_ID_CIDADES
					 left outer join BANCOS on BANCOS_ID = PORTADORES_ID_BANCOS
					 ${sqlWhere} ${sqlOrder}`;
		const total = await samosFB.count(db, sqlCount);
		
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total, resolve, reject});
			}
		});
	});
}

module.exports = {
    create: async (listaModels, params) => {
        const { idPortador } = params;
		let modelPortador = [];

		const cents = utils.number.cents.bind(utils.number);		

		let totalEntradas = 0;
		let totalLiquidacao = 0;
		let totalTaxas = 0;
		let totalJuros = 0;

		if(idPortador){
			const queryPortador = await getPortadores({
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

					totalTaxas += cents(listaModels[i]['FINANCEIROS_TAXAS']);
					totalJuros += cents(listaModels[i]['FINANCEIROS_JUROS']);

                }

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
