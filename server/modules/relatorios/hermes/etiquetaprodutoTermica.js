'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(["ean2", "ean5", "ean8", "ean13"]);

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
			pageSize: {width: 290, height: 'auto'},//'A6',  // 105 × 148 mm
			pageMargins: [10, 2, 2, 1],
			content: [
				{
					style: 'tableReport',
					table: {   // 3 Colunas, 2 etiquetas
						      //  1   2   3   4  SP   1   2   3   4
						widths: [30, 20, 20, 20,  8, 30, 20, 20, 20],
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

					for(let i in etiquetas){ // cria um novo objeto com a quantidade exata de vias de cada etiqueta.

						let vias = etiquetas[i]['ETIQUETASITENS_QUANTIDADE'];

						for (let j = 0; j < vias; j++) {                         
							viasEtiquetas.push(etiquetas[i]);
						}
					}

					let registros = parseInt(viasEtiquetas.length) < 2 ? 2 : parseInt(viasEtiquetas.length);
					let j = 0;

					for(let i = 0; i < registros; i += 2) {

						j = (parseInt(i) + 1);

						let idProdutoI  = i < viasEtiquetas.length ? viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoJ  = j < viasEtiquetas.length ? viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';

						let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_ETIQUETA'].substring(0, 80) : '';
						let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_ETIQUETA'].substring(0, 80) : '';

						let refProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_FABRICA'] : '';
						let refProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_FABRICA'] : '';

						let uniProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_UNIDADE'] : '';
						let uniProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_UNIDADE'] : '';

						let barraProdutoI = utils.string.onlyNumbers(viasEtiquetas[i]['PRODUTOS_BARRA']);
						let barraProdutoJ = utils.string.onlyNumbers(viasEtiquetas[j]['PRODUTOS_BARRA']);

						let codBarProdutoI  = await getBarCode(barraProdutoI);
						let codBarProdutoJ  = await getBarCode(barraProdutoJ);

						let cplProI = "A".repeat(80 - desProdutoI.length);
						let cplProJ = "A".repeat(80 - desProdutoJ.length);
		
						rows.push([
							{
								text: [
									{
										text: 'Código\n',
										fontSize: 6,
										alignment: 'center'
									},
									{
										text: idProdutoI + '\n',
										fontSize: 8,
										alignment: 'right'
									}
								],								
								border: idProdutoI ? [false, false, true, true] : [false, false, false, false]
							},
							{								
								text: [
									{
										text: 'Referência Fábrica\n',
										fontSize: 5,
										alignment: 'center'
									},
									{
										text: refProdutoI + '',
										fontSize: 8,
										alignment: 'center'
									}
								],								
								colSpan: 2,
								border: idProdutoI ? [false, false, false, true] : [false, false, false, false]
							},{},
							{
								text: [
									{
										text: 'Uni\n',
										fontSize: 6,
										alignment: 'center'
									},
									{
										text: uniProdutoI + '\n',
										fontSize: 8,
										alignment: 'center'
									}
								],								
								border: idProdutoI ? [true, false, false, true] : [false, false, false, false]
							},
							{
								text: 'C',  // Separadora (do meio) invisível
								color: 'white',
								fontSize: 8,
								border: [false, false, false, false]
							},
							{
								text: [
									{
										text: 'Código\n',
										fontSize: 6,
										alignment: 'center'
									},
									{
										text: idProdutoJ + '\n',
										fontSize: 8,
										alignment: 'right'
									}
								],								
								border: idProdutoJ ? [false, false, true, true] : [false, false, false, false]
							},
							{								
								text: [
									{
										text: 'Referência Fábrica\n',
										fontSize: 5,
										alignment: 'center'
									},
									{
										text: refProdutoJ + '',
										fontSize: 8,
										alignment: 'center'
									}
								],								
								colSpan: 2,
								border: idProdutoJ ? [false, false, false, true] : [false, false, false, false]
							},{},
							{
								text: [
									{
										text: 'Uni\n',
										fontSize: 6,
										alignment: 'center'
									},
									{
										text: uniProdutoJ + '\n',
										fontSize: 8,
										alignment: 'center'
									}
								],								
								border: idProdutoJ ? [true, false, false, true] : [false, false, false, false]
							}
						]);

						rows.push([  // Descrição dos produtos
							{
								colSpan: 4,
								text: [
									{
										text: desProdutoI,
										font: 'Consolas',	
										fontSize: 8,									
										bold: true,										
										alignment: 'center'
									},
/*									{
										text: cplProI,
										font: 'Consolas',
										color: 'white',
										bold: true,										
										fontSize: 8
									}*/
								],
								border: idProdutoI ? [false, false, false, true] : [false, false, false, false]
							},{},{},{},
							{
								text: 'C', // Separadora das descrições
								color: 'white',
								border: [false, false, false, false]
							},
							{
								colSpan: 4,
								text: [
									{
										text: desProdutoJ + '\n',
										font: 'Consolas',										
										fontSize: 8,
										bold: true,
										alignment: 'center'
									},
/*									{
										text: cplProJ,
										font: 'Consolas',
										color: 'white',
										bold: true,
										fontSize: 8
									}*/
								],
								border: idProdutoJ ? [false, false, false, true] : [false, false, false, false]
							},{},{},{}
						]);

						rows.push([
							{
									image: 'data:image/png;base64,' + codBarProdutoI,
									width: 55,
									height: 25, // 20
									alignment: 'center',
									colSpan: 2,
									border: [false, false, true, false]
							},{},
							{
								text: 'Localização',
								fontSize: 6,
								colSpan: 2,
								border: [true, true, false, false]
							},{},
							{
								text: 'C', // Divisor de coluna
								color: 'white',
								border: [false, false, false, false]
							},
							{
								image: 'data:image/png;base64,' + codBarProdutoJ,
								width: 55,
								height: 25, // 20
								alignment: 'center',
								colSpan: 2,
								border: [false, false, true, false]
							},{},
							{
								text: 'Localização',
								fontSize: 6,
								colSpan: 2,
								border: [true, true, false, false]
							},{}
						]);

						rows.push([
							{
								text: '\n',
								fontSize: 10,
								colSpan: 9,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{}
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

const getBarCode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create("ean13", chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};
