'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const mkdirp    = require('mkdirp');
const moment    = require('moment-timezone');


module.exports = {
    read: params => {
		let pathLogo;
		let strInventario = '';

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
									text: `Inventario de Produtos em ${moment(params.inicio).format('DD/MM/YYYY')} - Preço de  ${(params.preco == 0 ? 'Custo\n' : params.preco == 1 ? 'Compra\n' : 'Venda\n')}`,
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								}
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
					table: {   //COD NOM UNI SLD PRC TOT
						widths: [30, 300, 15, 40, 40, 50],
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
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
                                }
							]
						]
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
			api.inventario().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let qtdeBase = 0;
                    let precoBase = 0;
                    let valorItem = 0;
					let valorEstoque = 0;

					for(let i in res.results){

                        qtdeBase = res.results[i]['MOVIMENTOSITENS_ENTRADAS'] - res.results[i]['MOVIMENTOSITENS_SAIDAS'];
                        precoBase = (params.preco == '0' ? res.results[i]['SALDOS_CUSTO'] : (params.preco == '1' ? res.results['SALDOS_COMPRA'] : res.results['SALDOS_PRECO']));
                        valorItem = (qtdeBase * precoBase);

						if(qtdeBase > 0) {
							rows.push([
								{
									text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]
								},							
								{
									text: res.results[i]['PRODUTOS_NOME'] + ' - ' + res.results[i]['PRODUTOS_APLICACAO'],
									alignment: 'left',
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
									text: qtdeBase,
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: utils.number.float2moeda(precoBase),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: utils.number.float2moeda(valorItem),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								}
							]);

							strInventario += res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'].toString() + ';' +
							             res.results[i]['PRODUTOS_NOME'] + ' - ' + res.results[i]['PRODUTOS_APLICACAO'] + ';' +
										 res.results[i]['PRODUTOS_UNIDADE'] + ';' +
										 qtdeBase.toString().replace('.', ',') + ';' +
										 precoBase.toString().replace('.', ',') + ';' +
								         valorItem.toString().replace('.', ',') + '\n';

							valorEstoque += valorItem;
						}
					}

					rows.push([
						{
							text: '',
							alignment: 'left',
							style: 'tableExample',
							colSpan: 3,
							border: [false, false, false, false]
						},{},{},
						{
							text: 'TOTAL GERAL:',
							alignment: 'right',
							style: 'tableExample',
							bold: true,
							colSpan: 2,
							border: [false, false, false, false]
						},{},
						{
							text: utils.number.float2moeda(valorEstoque),
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false]
						}
					]);	

//					pra gerar um CSV:
					const caminhoInv = 'public/inventario/';
					const caminhoCompleto = `${appRoot}/public/inventario/`;
			
					if (!fs.existsSync(caminhoCompleto)){
						mkdirp(caminhoCompleto)
					}
			
					fs.writeFileSync(`${caminhoInv}/inventariodez.txt`, strInventario);
								
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};