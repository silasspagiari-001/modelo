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
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { // PRO  [NOM     ] XXX XXX QVD CUS VDA MRG
						widths:   [40, 40, 50, 70, 80, 80, 80, 80, 80, 80],
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
						'_'.repeat(145),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 12,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 12,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendafabrica().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let valorCusto = 0;
					let valorVenda = 0;
					let totalQtdVendido = 0;
					let totalValorCusto = 0;
					let totalValorVenda = 0;
					let margemMovimento = 0;

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
								text: 'Venda Fábrica - ' + (params.documento == 0 ? 'Pedidos' : 'Notas') + ' - Filial: ' + (params.empresa ? params.empresafan : 'TODAS'),
								colSpan: 6,
								fontSize: 14,
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
								text: 'Período: ' + params.inicio + ' a ' + params.final + (params.pessoainicial ? ' Fabricas: ' + params.pessoainicial + ' e ' + params.pessoafinal : ''),
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
								text: 'Código',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Nome do Produto',
								style: 'tableHeader',
								colSpan: 5,
								alignment: 'center'									
							},{},{},{},{},
							{
								text: 'Qtde Vendida',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Valor Custo',
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
							}	
						]						
					)

					for(let i in res.results){

						let marcaProd = res.results[i]['PRODUTOS_MARCA'];
                        valorCusto = res.results[i]['MOVIMENTOS_VALORCUSTO'];
						valorVenda = res.results[i]['MOVIMENTOS_VALORVENDA'];
						margemMovimento = (((valorVenda - valorCusto) / valorVenda) * 100);

						if(res.results[i]['MOVIMENTOS_VENDIDO'] > 0) {
							rows.push([
								{
									text: res.results[i]['PRODUTOS_ID'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['PRODUTOS_NOME'] + (marcaProd ? ` - ${marcaProd}` : ''),
									alignment: 'left',
									style: 'tableExample',
									colSpan: 5
								},{},{},{},{},
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
									text: utils.number.float2moeda(valorVenda),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(margemMovimento),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
						}

						totalQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						totalValorCusto += valorCusto;
						totalValorVenda += valorVenda;

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							bold: true,							
							colSpan: 6,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalQtdVendido),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalValorCusto),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(totalValorVenda),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(((totalValorVenda - totalValorCusto) / totalValorVenda) * 100),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};
