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
									text: 'Relação de Movimentos de Produtos\n',
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								},
								{
									text: `Periodo: ${params.inicio} até ${params.final} - Grupo: ${params.grupoinicial} a ${params.grupofinal} - Produto: ${params.produtoinicial} a ${params.produtofinal}`,
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
					fontSize: 10,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   // 1   2   3   4   5   6   7   8   9  10  11  12  13
						widths: [40, 30, 60, 20, 20, 20, 20, 40, 15, 40, 40, 40, 40],
						headerRows: 1,
						body: [
							[
								{
									text: 'Cla.Fis',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Cód',
									style: 'tableHeader',
									alignment: 'center'									
                                },								
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 11,								
								},{},{},{},{},{},{},{},{},{},{}
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
					fontSize: 8,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.movimentoprodutos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimoProduto = 0;
					for(let i in res.results){

						if(ultimoProduto !== res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS']) { 	
							ultimoProduto = res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'];
							rows.push([
								{
									text: res.results[i]['NCMS_NCM'],
									border: [false, true, false, false],
									style: 'tableExample'							
								},
								{
									text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									border: [false, true, false, false],
									style: 'tableExample'							

								},
								{
									text: res.results[i]['PRODUTOS_NOME'] + ' [Saldo: ' + utils.number.float2moeda(res.results[i]['SALDOS_DISPONIVEL']) + ']',
									border: [false, true, false, false],
									style: 'tableExample',
									colSpan: 11,
									border: [false, true, false, false]
								},{},{},{},{},{},{},{},{},{},{},
							]);
							// Cabeçalho secundário vai aqui...
							rows.push([
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'right',
									colSpan: 2,
									border: [false, false, false, false]
                                },{},                                
                                {
									text: 'Código Descrição',
									style: 'tableHeader',
									alignment: 'left',
									border: [false, false, false, false],
									colSpan: 5,									
                                },{},{},{},{},
                                {
									text: 'Número',
									style: 'tableHeader',
									alignment: 'center',
									border: [false, false, false, false]									
								},
                                {
									text: 'Se',
									style: 'tableHeader',
									border: [false, false, false, false],
									alignment: 'center'
								},
                                {
									text: 'Qtde',
									style: 'tableHeader',
									border: [false, false, false, false],									
									alignment: 'right'
								},
                                {
									text: 'Preço',
									style: 'tableHeader',
									border: [false, false, false, false],									
									alignment: 'right'
                                },
                                {
									text: 'Valor',
									style: 'tableHeader',
									border: [false, false, false, false],									
									alignment: 'right'
								},
                                {
									text: 'Tipo',
									style: 'tableHeader',
									border: [false, false, false, false],									
									alignment: 'left'
								}
							]);								
						}							

						rows.push([
							{
								text: res.results[i]['OPERACOES_ESTOQUE'] == 'C' ?
									  (moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY')) :
									  moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								style: 'tableExample',
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
                            },{},
                            {
								text: res.results[i]['MOVIMENTOSITENS_ID_OPERACOES'] + ' ' +
								      res.results[i]['OPERACOES_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5,								
								border: [false, false, false, false]								
                            },{},{},{},{},
                            {
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
							},
                            {
								text: res.results[i]['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_QUANTIDADE']),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_PRECO']),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_TOTAL']),								
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},
							{
								text: (res.results[i]['OPERACOES_ESTOQUE'] == 'C' ? 'Entrada' : res.results[i]['OPERACOES_ESTOQUE'] == 'D' ? 'Saida' : 'Nulo'),
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
