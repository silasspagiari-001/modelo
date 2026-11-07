'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['qrcode'], {"includetext" : false});

module.exports = {
    read: params => {

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/etiqueta/DefaultM.png`;
		}			

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 15],  // 20, 20, 20, 15] 
			content: [
				{
					style: 'tableReport',
					table: {   // 7 Colunas, 7 etiquetas
						      //  1   2   3   4   5   6   7
						widths: [70, 70, 70, 70, 70, 70, 70],  // 5x100
						dontBreakRows: true,
						body: []
					},
					style: {
						fontSize: 10
					}
				}
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0]
				}
			}
		};

        return new Promise((resolve, reject) => {
			api.etiquetas().readById(params.id, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;

					let etiquetas = res.results[0]['ETIQUETAS_ITENS'];

					let viasEtiquetas = [];
					let lista = '';

					for(let i in etiquetas){ // cria um novo objeto com a quantidade exata de vias de cada etiqueta.

						lista += etiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] + ';' + etiquetas[i]['PRODUTOS_NOME'] + ';' + etiquetas[i]['SALDOS_PRECO'] + ';\n';

						let vias = etiquetas[i]['ETIQUETASITENS_QUANTIDADE'];

						for (let j = 0; j < vias; j++) {                         
							viasEtiquetas.push(etiquetas[i]);
						}
					}

					console.log('lista: ', lista);

					let registros = parseInt(viasEtiquetas.length) < 14 ? 14 : parseInt(viasEtiquetas.length);
					let j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, linhas = 0;

					for(let i = 0; i < registros; i += 7) {

						j = (parseInt(i) + 1);
						k = (parseInt(i) + 2);
						l = (parseInt(i) + 3);	
						m = (parseInt(i) + 4);							
						n = (parseInt(i) + 5);	
						o = (parseInt(i) + 6);							

						let idProdutoI  = i < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoJ  = j < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoK  = k < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[k]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoL  = l < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[l]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoM  = m < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[m]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoN  = n < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[n]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoO  = o < viasEtiquetas.length ? 'Cód ' + viasEtiquetas[o]['ETIQUETASITENS_ID_PRODUTOS'] : '';						

     					let precoI = idProdutoI ? `R$ ${utils.number.float2moeda(viasEtiquetas[i]['SALDOS_PRECO'])}` : ``;
						let precoJ = idProdutoJ ? `R$ ${utils.number.float2moeda(viasEtiquetas[j]['SALDOS_PRECO'])}` : ``;
						let precoK = idProdutoK ? `R$ ${utils.number.float2moeda(viasEtiquetas[k]['SALDOS_PRECO'])}` : ``;
						let precoL = idProdutoL ? `R$ ${utils.number.float2moeda(viasEtiquetas[l]['SALDOS_PRECO'])}` : ``;
						let precoM = idProdutoM ? `R$ ${utils.number.float2moeda(viasEtiquetas[m]['SALDOS_PRECO'])}` : ``;
						let precoN = idProdutoN ? `R$ ${utils.number.float2moeda(viasEtiquetas[n]['SALDOS_PRECO'])}` : ``;
						let precoO = idProdutoO ? `R$ ${utils.number.float2moeda(viasEtiquetas[o]['SALDOS_PRECO'])}` : ``;
		
						rows.push([
							idProdutoI ? {
								image: pathLogo,
								width: 70,    //98
								height: 20,  //25
								alignment: 'center',
								border: [true, true, true, false]
							} : { text: '', border: [false, false, false, false]},
							idProdutoJ ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							idProdutoK ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							idProdutoL ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							idProdutoM ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							idProdutoN ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							idProdutoO ? {
								image: pathLogo,
								width: 70,
								height: 20,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]}
						]);

						rows.push([
							{
								text: precoI,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoI ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoJ,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoJ ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoK,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoK ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoL,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoL ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoM,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoM ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoN,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoN ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoO,
								fontSize: 14,
								alignment: 'center',
								bold: true,
								border: idProdutoO ? [true, false, true, false] : [false, false, false, false]
							}
						]);

						rows.push([
							{
								text: '',
								border: idProdutoI ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoJ ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoK ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoL ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoM ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoN ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: idProdutoO ? [true, false, true, true] : [false, false, false, false]
							}														
						]);

						linhas++

						if(linhas > 8 && m < (registros - 1)) { 
							rows.push([
								{
									text: 'a',
									color: 'white',
									fontSize: 1,
									colSpan: 6
								},{},{},{},{},{},
								{
									text: 'a',
									color: 'white',
									pageBreak: 'after',
									fontSize: 1
								}
							])
							
							linhas = 0;
						}
					}
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
