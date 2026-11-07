'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const samosFB   = require('../../../services/samosFirebird');
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
			pageMargins: [20, 40, 20, 35],
			header: function(page, pages) { 
				return { 
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 70,
							height: 30,
						},
						{   stack: [
								'Relatório de Romaneios',
								'Periodo: ' + params.inicio + ' a ' + params.final
							],
							width: '*',
							style: {
								fontSize: 12,
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
								fontSize: 8,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [25, 10]
				}
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					alignment: 'center',
					fontSize: 8,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Rom Ser Dte Qtd Uni Cod  Des Ped Ser Ven
						widths:  [12, 30, 12, 35, 25, 15, 25, 200, 25, 12, 60],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Loja',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Romaneio',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Ser',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Entrega',
									style: 'tableHeader',
									alignment: 'center'									
                                },								
								{
									text: 'Quant',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Uni',
									style: 'tableHeader'
                                },
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
									text: 'Pedido',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Ser',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Vendedor',
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
						'_'.repeat(110),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [25, 10]  // 40. 10
				};
			},
			styles: {
				tableExample: {
					fontSize: 6,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 6,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;			
			api.entregas().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					const db  = await samosFB.conectarBanco(params.client);						
					for(let i in res.results){

						let model = res.results[i];
						let valorEntrega = 0;
						
						// cálculos e atualizações de cada item aqui...

						let fretePercentual = (model['ROMANEIOS_FRETE'] / model['ROMANEIOS_TOTAL']);

						if(model['PESSOAS_FORMULA'].match(/percentual/)){
							valorEntrega = (model['MOVIMENTOS_IMPOSTO'] * fretePercentual);
						} else {
							valorEntrega = calcularValorFixo(model['PESSOAS_FORMULA'], model['MOVIMENTOS_IMPOSTO'], model['ROMANEIOS_LOCAL']);
						}    

						atualizarValorFrete(model['ROMANEIOSITENS_ID'], valorEntrega, db);

						// fim dos cálculos


						rows.push([
							{
								text: model['ROMANEIOS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},				
							{
								text: model['ROMANEIOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['ROMANEIOS_SERIE'],
								alignment: 'center',
								style: 'tableExample'
							},				
							{
								text: moment(model['ROMANEIOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
                            },
							{
								text: model['ROMANEIOSITENS_ID_ITEM'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: model['ROMANEIOSITENS_ID_ITEM'],
								alignment: 'right',
								style: 'tableExample'
							},					
							{
								text: model['ROMANEIOSITENS_ID_ITEM'],
								alignment: 'left',
								style: 'tableExample'
							},					
							{
								text: model['MOVIMENTOS_IMPOSTO'],
								alignment: 'right',
								style: 'tableExample'
							},				
							{
								text: model['PESSOAS_ID'],
								alignment: 'center',
								style: 'tableExample'
							},				
							{
								text: model['DOCUMENTOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 2
                            },{}
						]);
					}

					pdfStream(docDefinition, resolve, reject);
					db.detach();
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const calcularValorFixo = function(formulas, partida, tipo) {

    const urbano = tipo == 'U';
    const formula = JSON.parse(formulas);  
    const totalPedido = partida;
    let valorServico = 0;
    
    if(formula) {
        if (totalPedido <= 500) {
            if (urbano) {
                valorServico = formula['urbA'];
            } else {
                valorServico = formula['subA'];
            }
        } else {
            if (urbano) {
                valorServico = formula['urbB'];
            } else {
                valorServico = formula['subB'];
            }
        }
    }

    return valorServico;
}

const atualizarValorFrete = function(item, frete, db) {
    return new Promise(async (resolve, reject) => {
		
		let sql = `update ROMANEIOSITENS set ROMANEIOSITENS_TOTAL = ${frete}
				   where ROMANEIOSITENS_ID = ${item}`;

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};