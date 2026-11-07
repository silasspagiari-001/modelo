'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getResultados = async function(params){
	return new Promise(async (resolve, reject) => {
		const { tipo, empresa, aplicacao, inicio, final} = params;
		const db = await samosFB.conectarBanco(params.client);
		let sqlWhere = '';
		let sqlSearch = '';

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOSCAIXA_ID_EMPRESAS = ${empresa} `;
		}

		if(aplicacao > 0) {
			sqlWhere += ` and MOVIMENTOSCAIXA_ID_APLICACOES = ${aplicacao} `;
		}

		if(tipo == 0) {  // Analítico
			sqlSearch = `select MOVIMENTOSCAIXA_EMISSAO, MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME, MOVIMENTOSCAIXA_NOME, EMPRESAS_NOME,
						case when MOVIMENTOSCAIXA_TIPO = 'E'
								then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
									MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
									MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
									MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
									MOVIMENTOSCAIXA_OUTRO) ELSE 0 END MOVIMENTOSCAIXA_ENTRADAS,
	
						case when MOVIMENTOSCAIXA_TIPO = 'S'
								then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
										MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
										MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
										MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
										MOVIMENTOSCAIXA_OUTRO) ELSE 0 END MOVIMENTOSCAIXA_SAIDAS
						FROM MOVIMENTOSCAIXA
						left outer join APLICACOES on APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
						left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOSCAIXA_ID_EMPRESAS
						where MOVIMENTOSCAIXA_ID_APLICACOES > 1 and MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
						${sqlWhere}
						order by MOVIMENTOSCAIXA_ID_APLICACOES, MOVIMENTOSCAIXA_EMISSAO`
		} else {  // Sintético
			sqlSearch = `select MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME,
						sum(case when MOVIMENTOSCAIXA_TIPO = 'E'
								then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
									MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
									MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
									MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
									MOVIMENTOSCAIXA_OUTRO) ELSE 0 END) MOVIMENTOSCAIXA_ENTRADAS,
	
						sum(case when MOVIMENTOSCAIXA_TIPO = 'S'
									then (MOVIMENTOSCAIXA_DINHEIRO - MOVIMENTOSCAIXA_TROCO + MOVIMENTOSCAIXA_CHEQUE +
											MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITOLOJA +
											MOVIMENTOSCAIXA_ALIMENTACAO + MOVIMENTOSCAIXA_REFEICAO + MOVIMENTOSCAIXA_PRESENTE +
											MOVIMENTOSCAIXA_COMBUSTIVEL + MOVIMENTOSCAIXA_DUPLICATA + MOVIMENTOSCAIXA_BOLETO +
											MOVIMENTOSCAIXA_OUTRO) ELSE 0 END) MOVIMENTOSCAIXA_SAIDAS
						FROM MOVIMENTOSCAIXA
						left outer join APLICACOES ON APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
						where MOVIMENTOSCAIXA_ID_APLICACOES > 0 and MOVIMENTOSCAIXA_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
						${sqlWhere}
						group by MOVIMENTOSCAIXA_ID_APLICACOES, APLICACOES_NOME`
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
		let	docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{}]},
					{
						style: 'tableExample',
						table: {   // APL   NOM  ENT SAI  SLD (Sintético)
							       // DTE   [NOM   ] ENT SAI  (Analítico)
							widths:   [50,  230,  70, 70, 70],  // 5 Cols.
							headerRows: 2,
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
							'_'.repeat(95),
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

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			getResultados(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let ultimaAplicacao = 0;
					let aplEntradas = 0;
					let aplSaidas = 0;

					let totEntradas = 0;
					let totSaidas = 0;
					let totSaldo = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(		
						[
							{							
								image: pathLogo,
								width: 60,
								fontSize: 8,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Demonstrativo de Resultados por Aplicação - ' + (params.tipo == 0 ? 'Analítico' : 'Sintético'),
								colSpan: 3,
								fontSize: 10,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 8,
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: ' ',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final + ' - Empresa: ' + (params.empresa > 0 ? params.empresa.toString() + ' ' + (params.tipo == 0 && res.results[0] ? res.results[0]['EMPRESAS_NOME'] : '') : 'Todas'),
								colSpan: 3,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						]
					);			
						
					if(params.tipo == 0) {  // Analítico

						rows.push(
							[
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Descrição do Lançamento',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2								
								},{},
								{
									text: 'Entradas',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Saídas',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						);
					} else {  // Sintético
						rows.push(
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome da Aplicação',
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Entradas',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Saídas',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'									
								}				
							]
						);
					}

					for(let i in res.results){

						let valorSaldo = (res.results[i]['MOVIMENTOSCAIXA_ENTRADAS'] -
								      res.results[i]['MOVIMENTOSCAIXA_SAIDAS']);

						if(params.tipo == 0) {   // Analítico
							if(ultimaAplicacao != res.results[i]['MOVIMENTOSCAIXA_ID_APLICACOES']) {
								if(aplEntradas > 0 || aplSaidas > 0) {
									rows.push([
										{
											text: 'TOTAL DA APLICACAO',
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											colSpan: 3,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},
										{
											text: utils.number.float2moeda(aplEntradas),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										},
										{
											text: utils.number.float2moeda(aplSaidas),
											alignment: 'right',
											fontSize: 7,
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'							
										}
									]);
									aplEntradas = 0;
									aplSaidas = 0;
								}
								rows.push([
									{
										text: `* * * Aplicacao: ${('00000' + res.results[i]['MOVIMENTOSCAIXA_ID_APLICACOES']).slice(-5)} - ${res.results[i]['APLICACOES_NOME']}  * * *`,
										alignment: 'center',
										style: 'tableExample',
										colSpan: 5,
										fontSize: 9,
										color: 'blue',
										bold: true
									},{},{},{},{}
								]);	
								ultimaAplicacao = res.results[i]['MOVIMENTOSCAIXA_ID_APLICACOES'];
							}
	
							rows.push([
								{
									text: moment(res.results[i]['MOVIMENTOSCAIXA_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOSCAIXA_NOME'],
									alignment: 'left',
									colSpan: 2,
									style: 'tableExample'
								},{},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSCAIXA_ENTRADAS']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSCAIXA_SAIDAS']),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
						} else {  // Sintético
							rows.push([
								{
									text: res.results[i]['MOVIMENTOSCAIXA_ID_APLICACOES'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['APLICACOES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},														
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSCAIXA_ENTRADAS']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSCAIXA_SAIDAS']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorSaldo),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
						}

						aplEntradas += res.results[i]['MOVIMENTOSCAIXA_ENTRADAS'];
						aplSaidas += res.results[i]['MOVIMENTOSCAIXA_SAIDAS'];

						totEntradas += res.results[i]['MOVIMENTOSCAIXA_ENTRADAS'];
						totSaidas += res.results[i]['MOVIMENTOSCAIXA_SAIDAS'];
						totSaldo += valorSaldo;
					}

					if(params.tipo == 0) {  // Analítico
						rows.push([
							{
								text: 'TOTAL DA APLICACAO',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 3,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},
							{
								text: utils.number.float2moeda(aplEntradas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},
							{
								text: utils.number.float2moeda(aplSaidas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
						]);

						rows.push([
							{
								text: 'TOTAL GERAL',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 3,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},
							{
								text: utils.number.float2moeda(totEntradas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: utils.number.float2moeda(totSaidas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
								
							}
						]);	
					} else { // Sintético
						rows.push([
							{
								text: 'TOTAIS',
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								colSpan: 2,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},
							{
								text: utils.number.float2moeda(totEntradas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: utils.number.float2moeda(totSaidas),
								alignment: 'right',
								fontSize: 7,
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
								
							},{
								text: utils.number.float2moeda(totSaldo),
								alignment: 'right',
								fontSize: 7,
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
