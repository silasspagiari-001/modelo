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
		let tipoSaldo = [
			'Com Saldo Positivo',
			'Com Saldo Negativo',
			'Com Saldo Zerado',
			'Com Saldo Positivo ou Negativo',
			'Todos os Produtos',
			'Abaixo do Mínimo',
			'Acima do Máximo',
			'Com Peso Bruto',
			'Sem Peso Bruto',
			'Com Margem',
			'Sem Margem'
		];

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 40, 20, 35], // [40, 40, 40, 35],
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
							text: [
								{
									text: 'Saldos de Produtos' + (
											params.status == 0 ? ' - Ativos' : 
											params.status == 1 ? ' - Inativos' :
											params.status == 2 ? ' - Fora de linha' : '') + (
										params.preco == 0 ? ' - Preço de Venda\n' : 
										params.preco == 1 ? ' - Preço de Custo\n' :
										params.preco == 2 ? ' - Preço de Compra\n' :
										 '\n'),
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								},
								{
									text: `Tipo: ${tipoSaldo[params.tipo]} - Fornecedor: ${params.pessoainicial} até ${params.pessoafinal} - Grupo: ${params.grupoinicial} até ${params.grupofinal}`,
									width: '*',
									style: {
										fontSize: 8,
										alignment: 'center',
										color: 'blue'
									}
								},

							]
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
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD NOM  UNI SLD PRC AUD
						widths: [30, 315, 20,  45, 45, 45],
						headerRows: 1,						
						body: [
							[
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
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
                                },                                								
								{
									text: 'Preço',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Auditado',  
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
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.saldoprodutos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimaPessoa = 0;
					let qtdeBase = 0;
					let precoBase = 0;
					let valorEstoquePessoa = 0;
					let valorEstoqueGeral = 0;
					let precoProduto = 0;
					let saldoDisponivel = 0;

					for(let i in res.results){

						saldoDisponivel = res.results[i]['SALDOS_DISPONIVEL'] || 0;

						if(params.preco == 0) {
							precoProduto = utils.number.float2moeda(res.results[i]['SALDOS_PRECO']);
						} else if(params.preco == 1) {
                            precoProduto = utils.number.float2moeda(res.results[i]['SALDOS_CUSTO']);
						} else if(params.preco == 2) {
							precoProduto = utils.number.float2moeda(res.results[i]['SALDOS_COMPRA']);
						} else {
							precoProduto = '';
						}
						
						if(parseInt(params.pessoainicial) != 1 && parseInt(params.pessoafinal) != 999999) {
							if(ultimaPessoa !== res.results[i]['PRODUTOS_ID_PESSOAS']) {
								ultimaPessoa = res.results[i]['PRODUTOS_ID_PESSOAS'];
								if(valorEstoquePessoa > 0) {
									rows.push([
										{
											text: '',
											alignment: 'left',
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{},
										{
											text: 'TOTAL FORNECEDOR:',
											alignment: 'right',
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{},
										{
											text: utils.number.float2moeda(valorEstoquePessoa),
											alignment: 'right',
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{}
									]);	
									valorEstoquePessoa = 0;
								}
								rows.push([
									{
										text: '',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 6,
										border: [false, false, false, false]
									},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '****** Fornecedor: ' + res.results[i]['PRODUTOS_ID_PESSOAS'] + ' ' +
																	  res.results[i]['PESSOAS_NOME'] + ' ******',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 6,
										fontSize: 10,
										border: [false, false, false, false]
									},							
									{},{},{},{},{}
								]);
								rows.push([
									{
										text: '',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 6,
										border: [false, false, false, false]
									},							
									{},{},{},{},{}
								]);
							}	
						}

						rows.push([
							{
								text: ("000000" + res.results[i]['PRODUTOS_ID']).slice(-6),
								alignment: 'right',
								style: 'tableExample'
							},							
							{
								text: res.results[i]['PRODUTOS_NOME'] + (res.results[i]['PRODUTOS_MARCA'] ? ' - ' + res.results[i]['PRODUTOS_MARCA'] : ''),
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: saldoDisponivel.toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: precoProduto,
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: '',
								alignment: 'right',
								style: 'tableExample',
							}
						]);

						qtdeBase = (res.results[i]['SALDOS_DISPONIVEL'] > 0 ? res.results[i]['SALDOS_DISPONIVEL'] : 0);
						precoBase = (params.preco == 0 ? res.results[i]['SALDOS_PRECO'] : params.preco == 1 ? res.results[i]['SALDOS_CUSTO'] : res.results[i]['SALDOS_COMPRA']);

						valorEstoquePessoa += (qtdeBase * precoBase);
						valorEstoqueGeral +=  (qtdeBase * precoBase);
					}

					if(parseInt(params.pessoainicial) != 1 && parseInt(params.pessoafinal) != 999999 && params.preco != 3) {
						rows.push([
							{
								text: '',
								alignment: 'left',
								style: 'tableExample',
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: 'TOTAL FORNECEDOR:',
								alignment: 'right',
								style: 'tableExample',
								bold: true,
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.number.float2moeda(valorEstoquePessoa),
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 2,
								border: [false, false, false, false]
							},{}
						]);	
					}

					rows.push([
						{
							text: '',
							alignment: 'left',
							style: 'tableExample',
							colSpan: 2,
							border: [false, false, false, false]
						},{},
						{
							text: 'TOTAL GERAL:',
							alignment: 'right',
							style: 'tableExample',
							bold: true,
							colSpan: 2,
							border: [false, false, false, false]
						},{},
						{
							text: utils.number.float2moeda(valorEstoqueGeral),
							alignment: 'right',
							style: 'tableExample',
							bold: 'true',
							colSpan: 2,
							border: [false, false, false, false]
						},{}
					]);	

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};