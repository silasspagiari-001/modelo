'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getEntregas = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, pessoa, inicio, final, status, ramo } = params;
		const db = await samosFB.conectarBanco(params.client);
		let sqlWhere = '';
		let sqlSearch = '';

		if(ramo == 'moveis') {
			if(status == 0) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;  // Entregar
			} else if(status == 1) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;  // Executado
			} else if(status == 2) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'F' `;   // Faturado
			}    
		} else {  // construção
			if(status == 0) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'J' `;  // Imediata Entregue
			} else if(status == 1) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'I' `;  // Imediata a entregar
			} else if(status == 2) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;   // Normal Entregue
			} else if(status == 3) {
				sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;   // Normal a entregar
			}    
		}

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(pessoa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = ${pessoa} `;
		}

		if(ramo == 'moveis') {  // Somente romaneios de entrega
			sqlSearch = `select ROMANEIOSITENS_ID, ROMANEIOSITENS_ID_MOVIMENTOS, MOVIMENTOS_IMPOSTO, PESSOAS_ID, PESSOAS_FORMULA, ROMANEIOS_EMISSAO, ROMANEIOS_NUMERO, ROMANEIOS_FRETE, ROMANEIOS_TOTAL, ROMANEIOS_SERIE, ROMANEIOS_ID_EMPRESAS, ROMANEIOS_LOCAL, ROMANEIOSITENS_ID_ITEM, DOCUMENTOS_NOME
						from ROMANEIOSITENS
							left outer join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOSITENS_ID_MOVIMENTOS
							left outer join ROMANEIOS on ROMANEIOS_ID = ROMANEIOSITENS_ID_ROMANEIOS
							left outer join PESSOAS on PESSOAS_ID = ROMANEIOS_ID_PESSOAS                                
							left outer join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
			where ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
			  and right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0010'
			  and ROMANEIOS_STATUS <> 'R'
			${sqlWhere}
			order by MOVIMENTOS_ID_PESSOAS, ROMANEIOS_EMISSAO`
		} else {
			sqlSearch = `select ROMANEIOS_ID_EMPRESAS, ROMANEIOS_NUMERO, ROMANEIOS_SERIE, ROMANEIOS_EMISSAO, MOVIMENTOS_ID_USUARIOS, USUARIOS_LOGIN,
						MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO,
						MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_NOME, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME,
						PRODUTOS_UNIDADE, ROMANEIOSITENS.*
						from ROMANEIOS
							left outer join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOS_ID_MOVIMENTOS
							left outer join ROMANEIOSITENS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
							left outer join MOVIMENTOSITENS on MOVIMENTOSITENS_ID = ROMANEIOSITENS_ID_ITEM
							left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
							left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
			where ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
			${sqlWhere}
			order by MOVIMENTOS_ID_PESSOAS, ROMANEIOS_EMISSAO`
		}                

		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 40, 20, 35],
			header: function(page, pages) { 
				return { 
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 70,
							height: 30,
						},
						{   stack: [
								'Relatório de Romaneios',
								'Periodo: ' + params.inicio + ' a ' + params.final
							],
							width: '*',
							style: {
								fontSize: 12,
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
								fontSize: 8,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [25, 10]
				}
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					alignment: 'center',
					fontSize: 8,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Rom Ser Dte Qtd Uni Cod  Des Ped Ser Ven
						widths:  [12, 30, 12, 35, 25, 15, 25, 200, 25, 12, 60],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Loja',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Romaneio',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Ser',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Entrega',
									style: 'tableHeader',
									alignment: 'center'									
                                },								
								{
									text: 'Quant',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Uni',
									style: 'tableHeader'
                                },
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center'
                                },								
								{
									text: 'Pedido',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Ser',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Vendedor',
									style: 'tableHeader',
									alignment: 'center'									
                                }
								
							]
						]
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(110),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [25, 10]  // 40. 10
				};
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
			}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;			
			getEntregas(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimaPessoa = 0;
					for(let i in res.results){
						if(res.results[i]['MOVIMENTOS_ID_PESSOAS'] != ultimaPessoa) {
							rows.push([
								{
									text: 'Cliente: ' + res.results[i]['MOVIMENTOS_ID_PESSOAS'] + ' ' +
									                    res.results[i]['MOVIMENTOS_NOME'],
									colSpan: 11,
									alignment: 'left',
									fontSize: 10,
									bold: true,
									fillColor: '#E3E3E3'
								},{},{},{},{},{},{},{},{},{},{}
							]);
							ultimaPessoa = res.results[i]['MOVIMENTOS_ID_PESSOAS'];
						}

						let qtdeProduto = ((res.results[i]['ROMANEIOSITENS_QUANTIDADE'] - parseInt(res.results[i]['ROMANEIOSITENS_QUANTIDADE'])) != 0 ? res.results[i]['ROMANEIOSITENS_QUANTIDADE'].toFixed(3).replace('.',',') : res.results[i]['ROMANEIOSITENS_QUANTIDADE'].toFixed(0));

						rows.push([
							{
								text: res.results[i]['ROMANEIOS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},				
							{
								text: res.results[i]['ROMANEIOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['ROMANEIOS_SERIE'],
								alignment: 'center',
								style: 'tableExample'
							},				
							{
								text: moment(res.results[i]['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
                            },
							{
								text: qtdeProduto,
								alignment: 'right',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'right',
								style: 'tableExample'
							},					
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
							},					
							{
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample'
							},				
							{
								text: res.results[i]['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample'
							},				
							{
								text: res.results[i]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + res.results[i]['USUARIOS_LOGIN'],
								alignment: 'left',
								style: 'tableExample'
                            }
						]);
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
