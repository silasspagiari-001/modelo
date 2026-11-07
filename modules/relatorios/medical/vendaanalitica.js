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
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { //   PRO FAB  [NOM ] XXX QVD CUS VDA MRG SLD
						widths:   [25, 60, 70, 50, 50, 50, 50, 50, 30, 30],
						headerRows: 3,
						body: []
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
			api.vendaanalitica().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let valorCusto = 0;
					let valorVenda = 0;

					let grupoQtdVendido = 0;
					let grupoValorCusto = 0;
					let grupoValorVenda = 0;
					
					let totalQtdVendido = 0;
					let totalValorCusto = 0;
					let totalValorVenda = 0;
					let totalFrete      = 0;
					let totalSeguro     = 0;
					let totalDespesas   = 0;
					let margemMovimento = 0;
					let ultimoGrupo     = 0;

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
								width: 100,
								height: 22,	
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Venda Grupo Analítica',
								colSpan: 6,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
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
								text: ' ',
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
								text: 'Cód',
								style: 'tableHeader',
								alignment: 'center'									
                            },
							{
								text: 'Fábrica',
								style: 'tableHeader',
								alignment: 'center'									
							},                            
							{
								text: 'Nome do Produto',
								style: 'tableHeader',
								colSpan: 3,
								alignment: 'center'									
							},{},{},
							{
								text: 'Qtde Vendida',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Custo Final',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor Venda',
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: 'Margem',
								style: 'tableHeader',
								alignment: 'center'
							},	
							{
								text: 'Saldo',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					)

					for(let i in res.results){

						valorCusto = res.results[i]['MOVIMENTOS_VALORCUSTO'];
						valorVenda = res.results[i]['MOVIMENTOS_VALORVENDA'];
						margemMovimento = (((valorVenda - valorCusto) / valorVenda) * 100);

						if(ultimoGrupo != res.results[i]['GRUPOS_ID']) {
							if(grupoValorVenda > 0) {
								rows.push([
									{
										text: 'TOTAL GRUPO',
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										colSpan: 5,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},
									{
										text: grupoQtdVendido.toFixed(0),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(grupoValorCusto),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
										
									},{
										text: utils.number.float2moeda(grupoValorVenda),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda((((grupoValorVenda - grupoValorCusto) / grupoValorVenda) * 100)),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: '',
										border: [false, false, false, false]
									}
								]);
								grupoQtdVendido = 0;
								grupoValorCusto = 0;
								grupoValorVenda = 0;		
							}
							rows.push([
								{
									text: '* * * ' + ('00000' + res.results[i]['GRUPOS_ID']).slice(-5) + ' - ' + 
									    res.results[i]['GRUPOS_NOME'] + ' * * *',
									alignment: 'center',
									style: 'tableExample',
									colSpan: 10
								},{},{},{},{},{},{},{},{},{}
							]);	
							ultimoGrupo = res.results[i]['GRUPOS_ID'];
						}

						rows.push([
							{
								text: res.results[i]['PRODUTOS_ID'],
								alignment: 'right',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['PRODUTOS_FABRICA'],
								alignment: 'left',
								style: 'tableExample',
							},							                            
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 3
							},{},{},
							{
								text: res.results[i]['MOVIMENTOS_VENDIDO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCusto),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORVENDA']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(margemMovimento),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['SALDOS_DISPONIVEL'].toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

						grupoQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						grupoValorCusto += valorCusto;
						grupoValorVenda += res.results[i]['MOVIMENTOS_VALORVENDA'];

						totalQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						totalValorCusto += valorCusto;
						totalValorVenda += res.results[i]['MOVIMENTOS_VALORVENDA'];

						totalFrete      += res.results[i]['MOVIMENTOS_VALORFRETE'];
						totalSeguro     += res.results[i]['MOVIMENTOS_VALORSEGURO'];
						totalDespesas   += res.results[i]['MOVIMENTOS_VALORDESPESAS'];

					}

					rows.push([
						{
							text: 'TOTAL GERAL',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},
						{
							text: totalQtdVendido.toFixed(0),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalValorCusto),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(totalValorVenda),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(((totalValorVenda - totalValorCusto) / totalValorVenda) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false]
						}
					]);

// Frete/seguro/despesas...

					rows.push([
						{
							text: 'Frete:',
							alignment: 'right',
							colSpan: 2,
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: utils.number.float2moeda(totalFrete),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 7
						},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Seguro:',
							alignment: 'right',
							colSpan: 2,
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: utils.number.float2moeda(totalSeguro),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 7
						},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Despesas:',
							alignment: 'right',
							colSpan: 2,
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: utils.number.float2moeda(totalDespesas),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 7
						},{},{},{},{},{},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};
