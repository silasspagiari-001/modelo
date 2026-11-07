'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
		let docDefinition = {};
		if(params.tipo == 0) { // Sintético
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{}]},
					{
						style: 'tableExample',
						table: {   // COD  [DESC] VLR  
							widths:   [45, 30, 330, 120],  // 4 Cols.
							headerRows: 3,
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
						fontSize: 10,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 10,
						color: 'black'
					}
				}
			};
		} else {    // Analítico
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{}]}, // 8 Cols
					{
						style: 'tableExample',
						table: {   // DTE E/S DES       ] DOC BCO VLR
							widths:  [40, 40, 200, 30, 15, 60, 25, 60],  // 8 Cols.
							headerRows: 3,
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
		}

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.relbancos().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let model;

                    let ultimaAplicacao = 0;
					let totalAplicacao = 0;

                    let geralAplicacao = 0;
					let geralReceita = 0;
					let geralDespesa = 0;

					const db = await samosFB.conectarBanco(params.client); 

					let saldoAnterior = await obterSaldoAnterior(params, db);

					db.detach();
				
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					if (params.tipo == 0) { // Sintético
							rows.push(		
								[
									{							
										image: pathLogo,
										width: 80,
										colSpan: 2,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'POSIÇÃO FINANCEIRA BANCOS - SINTÉTICA',
										fontSize: 10,
										alignment: 'center',
										border: [false, false, false, false]
									},
									{
										text: moment.tz(params.timezone).format('DD/MM/YYYY'),
										fontSize: 10,
										alignment: 'right',
										border: [false, false, false, false]								
									}
								],
								[
									{							
										text: ' ',
										colSpan: 2,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'Período: ' + params.inicio + ' a ' + params.final,
										alignment: 'center',
										border: [false, false, false, false]
									},
									{
										text: moment.tz(params.timezone).format('HH:mm:ss'),
										alignment: 'right',
										border: [false, false, false, false]
									}
								],												
								[
									{
										text: 'Código',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Descrição da Aplicação',
										style: 'tableHeader',
										alignment: 'center',
                                        colSpan: 2								
									},{},									
									{
										text: 'Valor',
										style: 'tableHeader'
									}
								]						
							)

							for(let i in res.results){

								model = res.results[i];
									
								rows.push([
									{
										text: model['APLICACOES_ID'],
										alignment: 'right',
										style: 'tableExample',
									},							
									{
										text: model['APLICACOES_NOME'],
                                        colSpan: 2,
										style: 'tableExample',
									},{},										
									{
										text: utils.number.float2moeda(model['APLICACOES_ENTRADAS'] - model['APLICACOES_SAIDAS']),
										alignment: 'right',
										style: 'tableExample'
									}
								]);


								totalAplicacao += (model['APLICACOES_ENTRADAS'] - model['APLICACOES_SAIDAS']);
								geralAplicacao += (model['APLICACOES_ENTRADAS'] - model['APLICACOES_SAIDAS']);
								geralReceita += model['APLICACOES_ENTRADAS'];
								geralDespesa += model['APLICACOES_SAIDAS'];

							}							

							rows.push([
								{
									text: 'GERAL DA APLICAÇÃO',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(geralAplicacao),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);
							rows.push([
								{
									text: 'TOTAL DESPESAS',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(geralDespesa),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);
							rows.push([
								{
									text: 'TOTAL RECEITAS',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(geralReceita),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);
							rows.push([
								{
									text: 'SALDO ANTERIOR',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(saldoAnterior),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);
							rows.push([
								{
									text: 'RECEITA-DESPESA',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(geralReceita - geralDespesa),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);

							rows.push([
								{
									text: 'SALDO GERAL',
									alignment: 'right',
									bold: true,							
									colSpan: 3,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},
								{
									text: utils.number.float2moeda(saldoAnterior + geralReceita - geralDespesa),
									alignment: 'right',
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);

					} else { // Analítico (8 Colunas)
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
									text: 'POSIÇÃO FINANCEIRA BANCOS - ANALÍTICA',
									colSpan: 4,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},
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
									text: '',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Referência: ' + params.inicio + ' a ' + params.final,
									colSpan: 4,
									fontSize: 10,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],												
							[
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Ent/Sai',
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Descrição',
									alignment: 'center',
									style: 'tableHeader',
									colSpan: 3
								},{},{},
								{
									text: 'Documento',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Banco',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Valor',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)

						for(let i in res.results){

							model = res.results[i];

							if(ultimaAplicacao !== model['CONTROLES_ID_APLICACOES']) {
								if(ultimaAplicacao > 0) {
									rows.push([
										{
											text: 'Total Aplicacao',
											alignment: 'right',
											bold: true,							
											colSpan: 7,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totalAplicacao),
											alignment: 'right',
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
										}
									]);												
								}
								ultimaAplicacao = model['CONTROLES_ID_APLICACOES'];
                                totalAplicacao = 0;
                                rows.push([
									{
										text: 'Aplicação: ' +
											  model['CONTROLES_ID_APLICACOES'] + ' - ' + 
											  model['APLICACOES_NOME'],
										alignment: 'left',
										fontSize: 10,
										bold: true,							
										colSpan: 8,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},{},{},{}
								]);
							}

							rows.push([
								{
									text: moment(model['CONTROLES_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: model['CONTROLES_TIPO'] == 'E' ? 'Entrada' : model['CONTROLES_TIPO'] == 'S' ? 'Saída' : 'Nulo',
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: model['CONTROLES_NOME'],
									style: 'tableExample',
									colSpan: 3
								},{},{},
								{
									text: model['CONTROLES_DOCUMENTO'] || '',
									style: 'tableExample',
								},
								{
									text: model['CONTROLES_ID_PORTADORES'],
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(model['CONTROLES_VALOR']),
									alignment: 'right',
									style: 'tableExample'
								},
							]);

							if(model['CONTROLES_TIPO'] == 'E') {
								totalAplicacao += model['CONTROLES_VALOR'];
								geralAplicacao += model['CONTROLES_VALOR'];
								geralReceita   += model['CONTROLES_VALOR'];
							} else {
								totalAplicacao -= model['CONTROLES_VALOR'];
								geralAplicacao -= model['CONTROLES_VALOR'];	
								geralDespesa   += model['CONTROLES_VALOR'];
							}

						}

						rows.push([
							{
								text: 'GERAL DA APLICAÇÃO',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralAplicacao),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);
						rows.push([
							{
								text: 'TOTAL DESPESAS',
								alignment: 'right',
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralDespesa),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);
						rows.push([
							{
								text: 'TOTAL RECEITAS',
								alignment: 'right',
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralReceita),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);
						rows.push([
							{
								text: 'SALDO ANTERIOR',
								alignment: 'right',
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(saldoAnterior),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);
						rows.push([
							{
								text: 'RECEITA-DESPESA',
								alignment: 'right',
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralReceita - geralDespesa),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);

						rows.push([
							{
								text: 'SALDO GERAL',
								alignment: 'right',
								bold: true,							
								colSpan: 7,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(saldoAnterior + geralReceita - geralDespesa),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
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

const obterSaldoAnterior = function(params, db) {
    return new Promise(async (resolve, reject) => {

		const { aplinicial, aplfinal, porinicial, porfinal, inicio} = params;
		let sqlWhere = ` and CONTROLES_ID_APLICACOES between ${aplinicial} and ${aplfinal} and
							 CONTROLES_ID_PORTADORES between ${porinicial} and ${porfinal} `;
		
		let sql = `select sum(case when CONTROLES_TIPO = 'E' then CONTROLES_VALOR else 0 end) CONTROLES_ENTRADAS,
		                  sum(case when CONTROLES_TIPO = 'S' then CONTROLES_VALOR else 0 end) CONTROLES_SAIDAS from CONTROLES
					 where CONTROLES_EMISSAO < '${inicio.replace (/\//ig,'.')}' ${sqlWhere}`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0]['CONTROLES_ENTRADAS'] - results[0]['CONTROLES_SAIDAS']);
            }
        });
    });
};