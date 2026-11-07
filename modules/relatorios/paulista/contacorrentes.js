'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		return new Promise(async (resolve, reject) => {
			try {
				const queryLancamentos = await api.contacorrentes().read(params);
				const lancamentos = queryLancamentos.results;

				let pathLogo;

				try {
					pathLogo = utils.client.getImagePath(`logos/headers/${lancamentos[0]['EMPRESAS_CPFCNPJ']}.png`, params);
				} catch(error) {
					pathLogo = `${appRoot}/resources/images/headers/default.png`;
				}

				let docDefinition = {
					pageOrientation: 'landscape',
					pageSize: 'A4',
					pageMargins: [40, 40, 40, 35],
					header: function(page, pages) { 
						return { 
							alignment: 'justify',
							columns: [
								{
									image: pathLogo,
									width: 100,
									height: 22,
								},
								{
									text: 'Extrato de Conta Corrente',
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
							],
							margin: [40, 10]
						}
					},
					footer: function(page, pages) { 
						return { 
							stack: [ 
								'_'.repeat(140),
								{ 
									text: 'Página: ' + page.toString() + ' de ' + pages.toString(), 
									italics: true, 
									fontSize: 8, 
									alignment: 'right'
								}
							],
							margin: [40, 10]
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
					},
					content: [
						{
							style: {
								tableHeader: {
									bold: true,
									color: 'black'
								}
							},
							table: {
								widths: ['*'],
								headerRows: 1,						
								body: [
									[
										{
											text: 'Nome: ' + lancamentos[0]['PESSOAS_NOME'],
											style: 'tableHeader',
											fontSize: 13,
											border: [false, false, false, false],
											margin: [5, 10, 5, 0]
										}
									],
									[
										{
											text: 'Lançamentos de ' + params.inicio + ' a ' + params.final,
											style: 'tableHeader',
											fontSize: 11,
											border: [false, false, false, false],
											margin: [0, 8, 5, 2]
										}
									]
								]
							}
						},
						{
							style: 'tableExample',
							table: {
								widths: [60, '*', 100, 60, 60],
								headerRows: 1,						
								body: [
									[
										{
											text: 'Emissão',
											style: 'tableHeader'
										},
										{
											text: 'Descrição',
											style: 'tableHeader'
										}, 
										{
											text: 'Documento',
											style: 'tableHeader'
										},
										{
											text: 'Valor',
											style: 'tableHeader'
										},
										{
											text: 'Saldo',
											style: 'tableHeader'
										}
									]
								]
							},
							layout: {
								fillColor: function (i) {
									return (i % 2 === 0) ? '#E5E5E5' : null;
								}
							}
						}
					],			
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

				const rows = docDefinition.content[1].table.body;

				//lanca o saldo inicial primeiro
				const saldoInicial = lancamentos[0]['SALDOINICIAL_CONTACORRENTES'];

				rows.push([
					{
						text: 'Saldo Inicial'
					},{},{},{},
					{
						text: (saldoInicial > 0 ? '+' : '') + utils.number.float2moeda(saldoInicial, true),
						color: saldoInicial >= 0 ? 'green' : 'red',
						alignment: 'right'	
					}
				]);
				
				for(let i in lancamentos){
					const lancamento = lancamentos[i];
					const tipo  = lancamento['CONTACORRENTES_DEBITOCREDITO'];
					const valor = lancamento['CONTACORRENTES_VALOR'];
					const saldo = lancamento['SALDOLCTO_CONTACORRENTES'];

					rows.push([
						{
							text: (lancamento['CONTACORRENTES_EMISSAO'] || '').split('-').reverse().join('/')
						},							
						{   
							text: lancamento['CONTACORRENTES_NOME']
						},
						{ 
							text: lancamento['CONTACORRENTES_DOCUMENTO']
						},
						{
							text: (tipo == 'C' ? '+' : '-') + utils.number.float2moeda(valor),
							color: tipo == 'C' ? 'green' : 'red',
							alignment: 'right'								
						},
						{
							text: (saldo > 0 ? '+' : '') + utils.number.float2moeda(saldo),
							color: saldo >= 0 ? 'green' : 'red',
							alignment: 'right'	
						}
					]);
				}

				//lanca o saldo final
				const saldoFinal = lancamentos[0]['SALDOFINAL_CONTACORRENTES'];

				rows.push([
					{
						text: 'Saldo Final'
					},{},{},{},
					{
						text: (saldoFinal > 0 ? '+' : '') + utils.number.float2moeda(saldoFinal, true),
						color: saldoFinal >= 0 ? 'green' : 'red',
						alignment: 'right'	
					}
				]);

				pdfStream(docDefinition, resolve, reject);
			} catch (error) {
				reject(error);
			}
        });
	},
	
    readById: (id, params) => {
		return new Promise(async (resolve, reject) => {
			try {
				let docDefinition = {
					pageOrientation: 'portrait',
					pageSize: 'A4',
					background: [
						{
							image: `${appRoot}/resources/images/marcasdagua/recibo.png`,
							width: 600
						}
					],						
					pageMargins: [30, 30, 30, 30],
					content: [
						{columns: [{},{},{},{},{},{}]},
						{
							style: 'tableReport',
							table: {
								widths: [80, 80, 80, 80, 40, 120],
								body: []
							}
						} 
					],
					styles: {
						tableReport: {
							margin: [0, 0, 0, 0],
						}
					}
				};

				const queryLancamentos = await api.contacorrentes().readById(id, params);
				const lancamentos      = queryLancamentos.results;
				const lancamento       = lancamentos[0];
				const tipo             = lancamento['CONTACORRENTES_DEBITOCREDITO'];
				const valor            = lancamento['CONTACORRENTES_VALOR'];
				const cpfcnpjEmpresa   = lancamento['EMPRESAS_CPFCNPJ'];
				const cpfcnpjPessoa    = lancamento['PESSOAS_CPFCNPJ'];
				const observacoes      = lancamento['CONTACORRENTES_OBSERVACOES'];

				const pagador = {
					nome    : tipo == 'C' ? lancamento['EMPRESAS_NOME']    : lancamento['PESSOAS_NOME'],
					cpfcnpj : tipo == 'C' ? lancamento['EMPRESAS_CPFCNPJ'] : lancamento['PESSOAS_CPFCNPJ'],
					rotulo  : tipo == 'C' ? (cpfcnpjEmpresa.length == 11 ? 'CPF' : 'CNPJ') : (cpfcnpjPessoa.length == 11 ? 'CPF' : 'CNPJ')
				}

				const recebedor = {
					nome    : tipo == 'D' ? lancamento['EMPRESAS_NOME']    : lancamento['PESSOAS_NOME'],
					cpfcnpj : tipo == 'D' ? lancamento['EMPRESAS_CPFCNPJ'] : lancamento['PESSOAS_CPFCNPJ'],
					rotulo  : tipo == 'D' ? (cpfcnpjEmpresa.length == 11 ? 'CPF' : 'CNPJ') : (cpfcnpjPessoa.length == 11 ? 'CPF' : 'CNPJ')
				}
				
				const rows = docDefinition.content[1].table.body;

				rows.push([
					{
						text: 'Referência',
						fontSize: 10,
						style: 'tableHeader',
						alignment: 'left'
					},
					{
						colSpan: 4,
						text: 'Recibo',
						fontSize: 20,
						style: 'tableHeader',
						alignment: 'center'
					},{},{},{},
					{
						text: [
							{
								text: 'Valor\n',
								fontSize: 10, 
								alignment: 'left'
							},
							{
								text: `R$ ${utils.number.float2moeda(valor)}\n`,
								alignment: 'right',
								style: {
									bold: true,
									fontSize: 14
								}
							}
							
						]
					}								
				]);

				rows.push([
					{
						colSpan: 3,
						text: [
							{
								text: 'Pagador:\n',
								fontSize: 10, 
								alignment: 'left'
							},
							{
								text:  `${pagador.nome}\n`,
								alignment: 'left',
								style: {
									bold: true,
									fontSize: 12
								}
							},
							{
								text:  `${pagador.rotulo}: ${utils.string.maskCnp(pagador.cpfcnpj)}\n`,
								alignment: 'left',
								style: {
									bold: true,
									fontSize: 12
								}
							}									
						]
					},{},{},
					{
						colSpan: 3,
						text: [
							{
								text: 'Recebedor:\n',
								fontSize: 10, 
								alignment: 'left'
							},
							{
								text: `${recebedor.nome}\n`,
								alignment: 'left',
								style: {
									bold: true,
									fontSize: 12
								}
							},
							{
								text:  `${recebedor.rotulo}: ${utils.string.maskCnp(recebedor.cpfcnpj)}\n`,
								alignment: 'left',
								style: {
									bold: true,
									fontSize: 12
								}
							}
						]	
					},{},{}
				]);

				rows.push([
					{
						colSpan: 6,
						text:  `Recebi(emos) de ${pagador.nome}, ${pagador.rotulo} nº ${utils.string.maskCnp(pagador.cpfcnpj)},
								a importância de R$ ${utils.number.float2moeda(valor)} (${utils.number.ValorPorExtenso(valor)}) referente a ${lancamento['CONTACORRENTES_NOME']}
								
								${observacoes ? `Obs.: ${observacoes}` : ''}
								`,
						alignment: 'justify',
						style: {
							bold: true,
							fontSize: 12
						}
					}
				]);

				rows.push([
					{
						colSpan: 3,
						text: [
							{
								text: 'Pago por:\n\n\n',
								fontSize: 10, 
								alignment: 'left'
							},
							{
								text:  '_______________________________________________________\n\n\n\n',
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 10
								}
							},
							{
								text:  'Assinatura:____________________________________________',
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 10
								}
							}									
						]
					},{},{},
					{
						colSpan: 3,
						text: [
							{
								text: 'Recebido por:\n\n\n',
								fontSize: 10, 
								alignment: 'left'
							},
							{
								text:  '_______________________________________________________\n\n\n\n',
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 10
								}
							},
							{
								text:  'Assinatura:____________________________________________',
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 10
								}
							}									
						]
					},{},{}
				]);

				rows.push([
					{
						text: `\n\n${lancamento['CIDADES_NOME']}, ${lancamento['CIDADES_ESTADO']}, ________ de _________________ de __________`,
						colSpan: 5,
						fontSize: 12, 
						alignment: 'left',
						border: [true, false, true, true]
					},{},{},{},{},
					{
						text: '\n',
						fontSize: 10,
						alignment: 'center',
						border: [true, false, true, true]
					},
				]);

				rows.push([
					{
						text: ' ',
						colSpan: 5,
						border: [false, false, false, false]
					},{},{},{},{},
					{
						text: ' ',
						border: [false, false, false, false]
					}
				]);													

				rows.push([
					{
						text: ' ',
						colSpan: 5,
						border: [false, true, false, false]
					},{},{},{},{},
					{
						text: ' ',
						border: [false, true, false, false]
					}
				]);
				
				//cria uma copia do objeto para segunda via
				const segundaVia = JSON.parse(JSON.stringify(rows));
				rows.push(...segundaVia);

				pdfStream(docDefinition, resolve, reject);
			} catch (error) {
				reject(error);
			}
        });
	}
};