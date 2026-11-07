'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 20],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Tip Num Ser CFO Ori Ser  Dte Pes PRZ VLN
						widths:  [20, 27, 18, 25, 27, 18, 40, 160, 60, 60],  // 10 Cols.
						headerRows: 3,
						dontBreakRows: true,
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
					margin: [40, 10]  // 10, 10
				};
			},
			styles: {
				tableExample: {
					fontSize: 7,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 7,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.relmovimentos().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let totalMovimentos = 0;
					let pathLogo;
					const db = await samosFB.conectarBanco(params.client);

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(		
						[
							{							
								image: pathLogo,
								width: 80,
								colSpan: 2,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: res.results[0] ? 'Relatório de ' + (params.operacao == '1' ? 'Vendas' : res.results[0]['DOCUMENTOS_NOME']) + ' no Período' : 'Relatório',
								colSpan: 6,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],
						[
							{							
								text: res.results[0] ? res.results[0]['EMPRESAS_FANTASIA'] : '',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 6,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Tipo',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'Sér',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'Cfop',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Origem',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Sér',
								style: 'tableHeader',
								alignment: 'center'
							},	
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'
							},	
							{
								text: 'Pessoa',
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: 'Prazo',
								style: 'tableHeader',
								alignment: 'center'
							},																				
							{
								text: 'Valor Total',
								style: 'tableHeader',
								alignment: 'center'
							},																												
						]
					)

					for(let i in res.results){

						let model = res.results[i];
						let valorFinDocumento = await obterValorFinanceiro(model['MOVIMENTOS_ID'], db);

						if(model['MOVIMENTOS_STATUS'] != 'C' && model['MOVIMENTOS_STATUS'] != 'D' && model['MOVIMENTOS_STATUS'] != 'R') { // Cancelada/Denegada/Recusada

							if(params.iddocumento ==  3){ // Se for Nota Eletrônica
								if(params.operacao == 1) {     // Vendas
								if(model['OPERACOES_ACAO'] != 'VN') {
									continue;
								}
								} else if(params.operacao == 2) {  // Transferências
									if(model['OPERACOES_ACAO'].slice(0, 1) != 'T') {
										continue;
									}
								} else if(params.operacao == 3){  // Devoluções
									if(model['OPERACOES_ACAO'].slice(0, 1) != 'D') {
										continue;
									} 
								}
							}
	
							rows.push([
								{
									text: siglaTipo(model['MOVIMENTOS_ID_DOCUMENTOS']),
									alignment: 'center',
									style: 'tableExample',
								},							
								{
									text: model['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: model['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: model['MOVIMENTOS_ID_OPERACOES'].toString().slice(0, 4),
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: model['MOVIMENTOS_NUMEROORIGEM'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: model['MOVIMENTOS_SERIEORIGEM'],
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: model['MOVIMENTOS_NOME'],
									alignment: 'left',
									style: 'tableExample'
								},
								{
									text: model['PRAZOS_NOME'],
									alignment: 'left',
									style: 'tableExample'
								},							
								{
									text: (valorFinDocumento > 0 ? utils.number.float2moeda(valorFinDocumento) : utils.number.float2moeda(model['MOVIMENTOS_TOTAL'])),
									alignment: 'right',
									style: 'tableExample'
								}							
							]);

							totalMovimentos += (valorFinDocumento > 0 ? cents(valorFinDocumento) : cents(model['MOVIMENTOS_TOTAL']));
						}
					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 9,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalMovimentos / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						}							
					]);

					pdfStream(docDefinition, resolve, reject);
					db.detach();
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const siglaTipo = function(iddocumento) {

	if(iddocumento.toString().slice(-4) == '0001') {
		return 'ORC';
	} else
	if(iddocumento.toString().slice(-4) == '0002') {
		return 'PED';
	} else
	if(iddocumento.toString().slice(-4) == '0003') {
		return 'NFS';
	} else
	if(iddocumento.toString().slice(-4) == '0004') {
		return 'REQ';
	} else
	if(iddocumento.toString().slice(-4) == '0005') {
		return 'NFE';
	} else
	if(iddocumento.toString().slice(-4) == '0006') {
		return 'CPA';
	} else
	if(iddocumento.toString().slice(-4) == '0007') {
		return 'CFE';	
	} else
	if(iddocumento.toString().slice(-4) == '0012') {
		return 'DEV';	
	} else {
		return 'NDA';
	}

 }

 const obterValorFinanceiro = function(idmovimento, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `select sum(FINANCEIROS_ORIGINAL) as ORIGINAL from FINANCEIROS
				   where FINANCEIROS_ID_MOVIMENTOS = ${idmovimento}`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0]['ORIGINAL'] || 0);
            }
        });
    });
};
