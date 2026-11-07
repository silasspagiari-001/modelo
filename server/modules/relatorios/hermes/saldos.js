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
							text: [
								{
									text: 'Saldos de Produtos - Preço de ' + (params.preco == 0 ? 'Venda\n' : params.preco == 1 ? 'Custo\n' : 'Compra\n'),
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
								fontSize: 6,
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
					fontSize: 6,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 6,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD UNI NOM MIN MAX SLD PES MAR PRC
						widths: [30, 15, 195, 35, 35, 35, 35, 35, 40],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },											
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Mínimo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Máximo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
                                },                                								
								{
									text: 'PesoBruto',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '%Margem',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Preço',
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
						'_'.repeat(92),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 6,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 6,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.saldoprodutos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimaPessoa = 0;
					let ultimoGrupo  = 0;
					let qtdeBase = 0;
					let precoBase = 0;

					let qtdeEstoquePessoa = 0;
					let qtdeEstoqueGrupo = 0;
					let qtdeEstoqueGeral = 0;

					let valorEstoquePessoa = 0;
					let valorEstoqueGrupo = 0;
					let valorEstoqueGeral = 0;

					for(let i in res.results){

						if(parseInt(params.pessoafinal) != 999999) {
							if(ultimaPessoa !== res.results[i]['PRODUTOS_ID_PESSOAS']) {
								ultimaPessoa = res.results[i]['PRODUTOS_ID_PESSOAS'];
								if(valorEstoquePessoa > 0) {
									rows.push([
										{
											text: 'TOTAL FORNECEDOR:',
											alignment: 'right',
											style: 'tableExample',
											bold: true,
											colSpan: 4,
											border: [false, false, false, false]
										},{},{},{},
										{
											text: qtdeEstoquePessoa,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{},
										{
											text: utils.number.float2moeda(valorEstoquePessoa),
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											colSpan: 3,
											border: [false, false, false, false]
										},{},{}
									]);	
									qtdeEstoquePessoa = 0;
									valorEstoquePessoa = 0;
								}
								rows.push([
									{
										text: '',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '****** Fornecedor: ' + res.results[i]['PRODUTOS_ID_PESSOAS'] + ' ' +
																	  res.results[i]['PESSOAS_NOME'] + ' ******',
										style: 'tableExample',
										bold: true,
										colSpan: 9,
										fontSize: 10,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
							}	
						}

						if(parseInt(params.grupofinal) != 999999) {
							if(ultimoGrupo !== res.results[i]['PRODUTOS_ID_GRUPOS']) {
								ultimoGrupo = res.results[i]['PRODUTOS_ID_GRUPOS'];
								if(valorEstoqueGrupo > 0) {
									rows.push([
										{
											text: 'TOTAL GRUPO:',
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											colSpan: 4,
											border: [false, false, false, false]
										},{},{},{},
										{
											text: qtdeEstoqueGrupo,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{},
										{
											text: utils.number.float2moeda(valorEstoqueGrupo),
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											colSpan: 3,
											border: [false, false, false, false]
										},{},{}
									]);	
									qtdeEstoqueGrupo = 0;
									valorEstoqueGrupo = 0;
								}
								rows.push([
									{
										text: '',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '****** Grupo: ' + res.results[i]['PRODUTOS_ID_GRUPOS'] + ' ' +
																	  res.results[i]['GRUPOS_NOME'] + ' ******',
										alignment: 'center',
										bold: true,
										style: 'tableExample',
										colSpan: 9,
										fontSize: 10,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
							}	
						}

						rows.push([
							{
								text: ("00000" + res.results[i]['PRODUTOS_ID']).slice(-5),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
                            },							
                            {
                                text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								border: [false, false, false, false]
                            },
                            {
								text: res.results[i]['SALDOS_MINIMO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['SALDOS_MAXIMO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['SALDOS_DISPONIVEL'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['PRODUTOS_PESOBRUTO'].toFixed(3),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: utils.number.float2moeda(res.results[i]['SALDOS_MARGEM']),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: (params.preco == 0 ? utils.number.float2moeda(res.results[i]['SALDOS_PRECO']) : params.preco == 1 ? utils.number.float2moeda(res.results[i]['SALDOS_CUSTO']) : utils.number.float2moeda(res.results[i]['SALDOS_COMPRA'])),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
						]);

						qtdeBase = (res.results[i]['SALDOS_DISPONIVEL'] > 0 ? res.results[i]['SALDOS_DISPONIVEL'] : 0);
						precoBase = (params.preco == 0 ? res.results[i]['SALDOS_PRECO'] : params.preco == 1 ? res.results[i]['SALDOS_CUSTO'] : res.results[i]['SALDOS_COMPRA']);

						qtdeEstoqueGrupo  += qtdeBase;
						qtdeEstoquePessoa += qtdeBase;
						qtdeEstoqueGeral  += qtdeBase;

						valorEstoqueGrupo  += (qtdeBase * precoBase);
						valorEstoquePessoa += (qtdeBase * precoBase);
						valorEstoqueGeral  += (qtdeBase * precoBase);
					}

					if(parseInt(params.grupofinal) != 999999) {
						rows.push([
							{
								text: 'TOTAL GRUPO:',
								alignment: 'right',
								style: 'tableExample',
								bold: true,
								colSpan: 4,
								border: [false, false, false, false]
							},{},{},{},
							{
								text: qtdeEstoqueGrupo,
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.number.float2moeda(valorEstoqueGrupo),
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}
						]);	
					}

					if(parseInt(params.pessoafinal) != 999999) {
						rows.push([
							{
								text: 'TOTAL FORNECEDOR:',
								alignment: 'right',
								style: 'tableExample',
								bold: true,
								colSpan: 4,
								border: [false, false, false, false]
							},{},{},{},
							{
								text: qtdeEstoquePessoa,
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.number.float2moeda(valorEstoquePessoa),
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}
						]);	
					}

					rows.push([
						{
							text: 'TOTAL GERAL:',
							alignment: 'right',
							style: 'tableExample',
							bold: true,
							colSpan: 4,
							border: [false, false, false, false]
						},{},{},{},
						{
							text: qtdeEstoqueGeral,
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
							bold: true,
							colSpan: 3,
							border: [false, false, false, false]
						},{},{}
					]);	

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
