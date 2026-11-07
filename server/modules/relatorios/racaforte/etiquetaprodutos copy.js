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
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 10, 15, 15],  // [15, 15, 15, 15]
			content: [
				{
					style: 'tableReport',
					table: {   //  3 etiquetas
						      //   1    2    3
						widths: [175, 175, 175],
						breakRows: false,
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
					let linhas = 0;
					let impressas = 0;
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}

					let etiquetas = res.results[0]['ETIQUETAS_ITENS'];
					let tipoEtiqueta = res.results[0]['TIPO'] || '';

					let viasEtiquetas = [];

					if(tipoEtiqueta == 'FolhaA4') { // Etiqueta meia A4
                      // INICIO DA A4
					  for(let i in etiquetas){ 

						const vias = etiquetas[i]['ETIQUETASITENS_QUANTIDADE'] || 1;

						for(let v = 0; v < vias; v++) {

							let idProduto  = etiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] || '';
							let desProduto = etiquetas[i]['PRODUTOS_NOME'].substring(0, 60);
							let idQrCode   = idProduto ? ('789' + ('0000000000' + idProduto).slice(-10)) : '';
							let qrcodes    = idProduto ? await getQrcode(idQrCode) : '';
							let preco      = idProduto ? `${utils.number.float2moeda(etiquetas[i]['SALDOS_PRECO'])}` : ``;
							let promo      = idProduto ? `${utils.number.float2moeda((etiquetas[i]['SALDOS_PRECO'] * .9))}` : ``;
							let parcelado  = idProduto ? `${utils.number.float2moeda((etiquetas[i]['SALDOS_PRECO'] * .9)/3)}` : ``;
										
							if(impressas > 1) {
								rows.push([
									{
										text: '',
										pageBreak: 'before',
										colSpan: 3,
										border: [false, false, false, false]
									},{},{}
								]);    
								impressas = 0;
							} else {
								rows.push([
									{
										text: '\n',
										fontSize: 2,
										colSpan: 3,
										border: [false, false, false, false]
									},{},{}
								]);    
							}

							rows.push([
								{
									image: `${pathLogo}`,
									width: 100,  // 50x50
									height: 100,
									alignment: 'center',
									border: [true, true, false, false]
								},
								{
									text: '\nRaçaforte\n',
									colSpan: 2,
	//								fillColor: 'black',
									alignment: 'center',
									fontSize: 30,  //36
									bold: true,
									border: [false, true, true, false]
								},{}
							]);
	
							rows.push([
								{
									text: desProduto + (desProduto.length < 40 ? '\n\n' : ''),
									font: 'Consolas',
									colSpan: 3,	
									fontSize: 25,
									border: [true, false, true, false]
								},{},{}
							]);
	
							rows.push([											
								{
									colSpan: 3,
									text: 'Cód: ' + idProduto + '\n',
									fontSize: 14,
									bold: true,
									alignment: 'center',
									colSpan: 3,
									border: [true, false, true, false]
								},{},{}											
							],
							[
								{
									text: [
										{
											text: 'À Vista de: ',
											alignment: 'left',				
											font: 'Consolas',
											fontSize: 16										
										},
										{
											text: 'R$ ' + preco,
											alignment: 'left',
											font: 'Consolas',
											decoration: 'lineThrough',
											fontSize: 20
										}
									],
									colSpan: 3,
									border: [true, false, true, false]
								},{},{}
							],
							[
								{
									text: [
										{
											text: '\n',
											fontSize: 2
										},
										{
											text: 'Por: ',
											font: 'Consolas',
											alignment: 'center',				
											fontSize: 20										
										},
										{
											text: 'R$ ' + promo,
											font: 'Consolas',
											alignment: 'center',
											fontSize: 50
										},
										{
											text: `\nou 3x de R$ ${parcelado} no Cartão`,
											font: 'Consolas',
											alignment: 'center',
											fontSize: 25
										}
									],
									colSpan: 3,
									border: [true, false, true, false]
								},{},{}
							],
							[
								{
									image: 'data:image/png;base64,' + qrcodes,
									width: 60, 
									height: 60,
									colSpan: 3,
									alignment: 'right',
									border: [true, false, true, false]
								},{},{}
							]);
	
							rows.push([
								{
									text: '',
									border: [true, false, true, true],
									colSpan: 3
								},{},{}
							]);
	
							linhas++
	
							impressas++;

							if(impressas > 1) {
								rows.push([
									{
										text: '\n',
										border: [false, false, false, false],
										colSpan: 3,
									},{},{}
								]);	
							} else {
								rows.push([
									{
										text: '\n' + '- '.repeat(100),
										border: [false, false, false, false],
										colSpan: 3,
									},{},{}
								]);	
							}

						}
			
						}

                      // FIM DA A4
					} else {  // Etiqueta normal para prateleira
						// INICIO DA ETIQUETA NORMAL
						for(let i in etiquetas){ // cria um novo objeto com a quantidade exata de vias de cada etiqueta.

							let vias = etiquetas[i]['ETIQUETASITENS_QUANTIDADE'];
	
							for (let j = 0; j < vias; j++) {                         
								viasEtiquetas.push(etiquetas[i]);
							}
						}
	
						let registros = parseInt(viasEtiquetas.length) < 3 ? 3 : parseInt(viasEtiquetas.length);
						let j = 0, k = 0;
	
						for(let i = 0; i < registros; i += 3) {
	
							j = (parseInt(i) + 1);
							k = (parseInt(i) + 2);
	
							let idProdutoI  = i < viasEtiquetas.length ? 'Código: ' + viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
							let idProdutoJ  = j < viasEtiquetas.length ? 'Código: ' + viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';
							let idProdutoK  = k < viasEtiquetas.length ? 'Código: ' + viasEtiquetas[k]['ETIQUETASITENS_ID_PRODUTOS'] : '';
	
							let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(0, 60) : '';
							let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(0, 60) : '';
							let desProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(0, 60) : '';
											
							let precoI = idProdutoI ? `A Vista: R$ ${utils.number.float2moeda(viasEtiquetas[i]['SALDOS_PRECO'])}` : ``;
							let precoJ = idProdutoJ ? `A Vista: R$ ${utils.number.float2moeda(viasEtiquetas[j]['SALDOS_PRECO'])}` : ``;
							let precoK = idProdutoK ? `A Vista: R$ ${utils.number.float2moeda(viasEtiquetas[k]['SALDOS_PRECO'])}` : ``;

							rows.push([
								{
									text: idProdutoI,
									font: 'Consolas',	
									bold: true,
									fontSize: 12,
									border: [true, true, true, false]
								},
								{
									text: idProdutoJ,
									font: 'Consolas',										
									bold: true,
									fontSize: 12,
									border: [true, true, true, false]
								},
								{
									text: idProdutoK,
									font: 'Consolas',										
									bold: true,
									fontSize: 12,
									border: [true, true, true, false]
								}
							]);
	
							rows.push([
								{
									text: desProdutoI,
									font: 'Consolas',	
									fontSize: 12,
									border: [true, false, true, false]
								},
								{
									text: desProdutoJ,
									font: 'Consolas',										
									fontSize: 12,
									border: [true, false, true, false]
								},
								{
									text: desProdutoK,
									font: 'Consolas',										
									fontSize: 12,
									border: [true, false, true, false]
								}
							]);

							rows.push([
								{
									text: 'a\n',
									font: 'Consolas',										
									fontSize: 12,
									color: 'white',
									border: [true, false, true, false]
								},{
									text: 'a\n',
									font: 'Consolas',										
									fontSize: 12,
									color: 'white',
									border: [true, false, true, false]
								},{
									text: 'a\n',
									font: 'Consolas',										
									fontSize: 12,
									color: 'white',
									border: [true, false, true, false]
								}
							]);

							rows.push([
								{
									text: precoI,
									font: 'Consolas',	
									bold: true,
									fontSize: 14,
									border: [true, false, true, true]
								},
								{
									text: precoJ,
									font: 'Consolas',										
									bold: true,
									fontSize: 14,
									border: [true, false, true, true]
								},
								{
									text: precoK,
									font: 'Consolas',										
									bold: true,
									fontSize: 14,
									border: [true, false, true, true]
								}
							]);
		
							linhas++
	
							if(linhas > 9) {
								rows.push([
									{
										text: '',
										border: [false, true, false, false],
										colSpan: 2,
									},{},{
										text: '',
										pageBreak: 'after',
										border: [false, true, false, false]									
									}
								]);
								linhas = 0;
							}
	
						}
	
						// FIM DA ETIQUETA NORMAL
					}
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};
