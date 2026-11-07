'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFB');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

//Implementado do sencha Ext.apply
function aplicarParametros(object, config)
{
	if (object && config && typeof config === 'object') {
		let i, j, k;
		for (i in config) {
			object[i] = config[i];
		}
	}
	return object;
}

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
					table: { //   GRP  [NOM             ] QVD VDA %FAT
						widths:   [45, 30, 30, 30, 30, 50, 60, 60, 60, 60],
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
					fontSize: 9,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 9,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendasintetica().read(params)
				.then( async(res) => {
					let rows = docDefinition.content[1].table.body;

					let valorVenda = 0;
					let valorST    = 0;   
					let totalQtdVendido = 0;
					let totalValorVenda = 0;
					let totalValorST    = 0;
					let totalFrete      = 0;
					let totalSeguro     = 0;
					let totalDespesas   = 0;
					let fatGrupo        = 0;

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
								text: 'Relatório de Venda Sintética - ' + (params.documento == 0 ? 'Pedidos' : 'Notas'),
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
								text: 'Código',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Nome do Grupo',
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
								text: 'Valor Venda',
								style: 'tableHeader',
								alignment: 'center'
							},	
							{
								text: 'Valor ST',
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: '% SFAT',
								style: 'tableHeader',
								alignment: 'center'
							}	
						]						
					)

					let fatTotal = 0;

					for(let i in res.results) {
                        fatTotal += res.results[i]['MOVIMENTOS_VALORVENDA'];						
					}

					for(let i in res.results){
						valorVenda = res.results[i]['MOVIMENTOS_VALORVENDA'];
						valorST = res.results[i]['MOVIMENTOS_VALORST'];
					    
						fatGrupo = utils.number.float2moeda((valorVenda / fatTotal) * 100);

						if(res.results[i]['MOVIMENTOS_VENDIDO'] > 0) {
							rows.push([
								{
									text: res.results[i]['GRUPOS_ID'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['GRUPOS_NOME'],
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
									text: utils.number.float2moeda(valorVenda),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorST),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: fatGrupo,
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
						}

						totalQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						totalValorVenda += valorVenda;
						totalValorST    += valorST;

						totalFrete      += res.results[i]['MOVIMENTOS_VALORFRETE'];
						totalSeguro     += res.results[i]['MOVIMENTOS_VALORSEGURO'];
						totalDespesas   += res.results[i]['MOVIMENTOS_VALORDESPESAS'];

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
							text: totalQtdVendido.toFixed(0),
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
							text: utils.number.float2moeda(totalValorST),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);

// Frete/seguro/despesas...

					rows.push([
						{
							text: 'Frete:',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalFrete),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Seguro:',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalSeguro),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Despesas:',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDespesas),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};
