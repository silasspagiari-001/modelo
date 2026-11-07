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
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}
			
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 10, 15, 15],  // [15, 15, 15, 15]
			content: [
				{
					style: 'tableReport',
					table: {   // 9 Colunas, 5 etiquetas
						      //   1    2    3    4    5
						widths: [105, 105, 105, 105, 105],
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

					let registros = parseInt(viasEtiquetas.length) < 10 ? 10 : parseInt(viasEtiquetas.length);
					let j = 0, k = 0, l = 0, m = 0, linhas = 0;

					for(let i = 0; i < registros; i += 5) {

						j = (parseInt(i) + 1);
						k = (parseInt(i) + 2);
						l = (parseInt(i) + 3);	
						m = (parseInt(i) + 4);							

						let idProdutoI  = i < viasEtiquetas.length ? viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoJ  = j < viasEtiquetas.length ? viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoK  = k < viasEtiquetas.length ? viasEtiquetas[k]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoL  = l < viasEtiquetas.length ? viasEtiquetas[l]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoM  = m < viasEtiquetas.length ? viasEtiquetas[m]['ETIQUETASITENS_ID_PRODUTOS'] : '';

						let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_ETIQUETA'].substring(0, 60) : '';
						let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_ETIQUETA'].substring(0, 60) : '';
						let desProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_ETIQUETA'].substring(0, 60) : '';
						let desProdutoL = idProdutoL ? viasEtiquetas[l]['PRODUTOS_ETIQUETA'].substring(0, 60) : '';
						let desProdutoM = idProdutoM ? viasEtiquetas[m]['PRODUTOS_ETIQUETA'].substring(0, 60) : '';

						let cplProI = "A".repeat(60 - desProdutoI.length);
						let cplProJ = "A".repeat(60 - desProdutoJ.length);
						let cplProK = "A".repeat(60 - desProdutoK.length);
						let cplProL = "A".repeat(60 - desProdutoL.length);												
						let cplProM = "A".repeat(60 - desProdutoM.length);

						let idQrCodeI   = idProdutoI ? ('789' + ('0000000000' + idProdutoI).slice(-10)) : '';
						let idQrCodeJ   = idProdutoJ ? ('789' + ('0000000000' + idProdutoJ).slice(-10)) : '';
						let idQrCodeK   = idProdutoK ? ('789' + ('0000000000' + idProdutoK).slice(-10)) : '';
						let idQrCodeL   = idProdutoL ? ('789' + ('0000000000' + idProdutoL).slice(-10)) : '';
						let idQrCodeM   = idProdutoM ? ('789' + ('0000000000' + idProdutoM).slice(-10)) : '';
								
						let qrcodesI = idProdutoI ? await getQrcode(idQrCodeI) : '';
						let qrcodesJ = idProdutoJ ? await getQrcode(idQrCodeJ) : '';
						let qrcodesK = idProdutoK ? await getQrcode(idQrCodeK) : '';
						let qrcodesL = idProdutoL ? await getQrcode(idQrCodeL) : '';
						let qrcodesM = idProdutoM ? await getQrcode(idQrCodeM) : '';

						let precoI = idProdutoI ? `R$ ${utils.number.float2moeda(viasEtiquetas[i]['SALDOS_PRECO'])}` : ``;
						let precoJ = idProdutoJ ? `R$ ${utils.number.float2moeda(viasEtiquetas[j]['SALDOS_PRECO'])}` : ``;
						let precoK = idProdutoK ? `R$ ${utils.number.float2moeda(viasEtiquetas[k]['SALDOS_PRECO'])}` : ``;
						let precoL = idProdutoL ? `R$ ${utils.number.float2moeda(viasEtiquetas[l]['SALDOS_PRECO'])}` : ``;
						let precoM = idProdutoM ? `R$ ${utils.number.float2moeda(viasEtiquetas[m]['SALDOS_PRECO'])}` : ``;
		
						rows.push([
							desProdutoI ? {
								image: pathLogo,
								width: 98,
								height: 25,
								alignment: 'center',
								border: [true, true, true, false]
							} : { text: '', border: [false, false, false, false]},
							desProdutoJ ? {
								image: pathLogo,
								width: 98,
								height: 25,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							desProdutoK ? {
								image: pathLogo,
								width: 98,
								height: 25,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							desProdutoL ? {
								image: pathLogo,
								width: 98,
								height: 25,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
							desProdutoM ? {
								image: pathLogo,
								width: 98,
								height: 25,
								alignment: 'center',
								border: [true, true, true, false]								
							} : { text: '', border: [false, false, false, false]},
						]);

						rows.push([
							{
								text: idProdutoI,
								bold: true,
								alignment: 'center',
								border: idProdutoI ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: idProdutoJ,
								bold: true,
								alignment: 'center',
								border: idProdutoJ ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: idProdutoK,
								bold: true,
								alignment: 'center',
								border: idProdutoK ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: idProdutoL,
								bold: true,
								alignment: 'center',
								border: idProdutoL ? [true, false, true, false]	: [false, false, false, false]
							},
							{
								text: idProdutoM,
								bold: true,
								alignment: 'center',
								border: idProdutoM ? [true, false, true, false]	: [false, false, false, false]
							}
						]);

						rows.push([
							{
								text: [
									{
										text: desProdutoI + '\n',
										font: 'Consolas',	
										fontSize: 11,									
										bold: true,										
										alignment: 'center'
									},
									{
										text: cplProI,
										font: 'Consolas',
										color: 'white',
										bold: true,										
										fontSize: 11
									}
								],
								border: idProdutoI ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: [
									{
										text: desProdutoJ + '\n',
										font: 'Consolas',										
										fontSize: 11,
										bold: true,
										alignment: 'center'
									},
									{
										text: cplProJ,
										font: 'Consolas',
										color: 'white',
										bold: true,
										fontSize: 11
									}
								],
								border: idProdutoJ ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: [
									{
										text: desProdutoK + '\n',
										font: 'Consolas',										
										fontSize: 11,
										bold: true,
										alignment: 'center'
									},
									{
										text: cplProK,
										font: 'Consolas',
										color: 'white',
										bold: true,										
										fontSize: 11
									}

								],
								border: idProdutoK ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: [
									{
										text: desProdutoL + '\n',
										font: 'Consolas',										
										fontSize: 11,
										bold: true,
										alignment: 'center'
									},
									{
										text: cplProL,
										font: 'Consolas',
										color: 'white',
										bold: true,										
										fontSize: 11
									}
								],
								border: idProdutoL ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: [
									{
										text: desProdutoM + '\n',
										font: 'Consolas',										
										fontSize: 11,										
										bold: true,
										alignment: 'center'
									},
									{
										text: cplProM,
										font: 'Consolas',
										color: 'white',
										bold: true,										
										fontSize: 11
									}
								],
								border: idProdutoM ? [true, false, true, false] : [false, false, false, false]
							}
						]);

						rows.push([											
							{
								text: desProdutoI ? 'Preço à Vista' : '',
								decoration: 'underline',
								alignment: 'center',
								border: desProdutoI ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: desProdutoJ ? 'Preço à Vista' : '',
								decoration: 'underline',
								alignment: 'center',
								border: desProdutoJ ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: desProdutoK ? 'Preço à Vista' : '',
								decoration: 'underline',
								alignment: 'center',
								border: desProdutoK ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: desProdutoL ? 'Preço à Vista' : '',
								decoration: 'underline',
								alignment: 'center',
								border: desProdutoL ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: desProdutoM ? 'Preço à Vista' : '',
								decoration: 'underline',
								alignment: 'center',
								border: desProdutoM ? [true, false, true, false] : [false, false, false, false]
							}
						]);

						rows.push([
							{
								text: precoI,
								fontSize: 12,
								alignment: 'center',
								bold: true,
								border: desProdutoI ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoJ,
								fontSize: 12,
								alignment: 'center',
								bold: true,
								border: desProdutoJ ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoK,
								fontSize: 12,
								alignment: 'center',
								bold: true,
								border: desProdutoK ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoL,
								fontSize: 12,
								alignment: 'center',
								bold: true,
								border: desProdutoL ? [true, false, true, false] : [false, false, false, false]
							},
							{
								text: precoM,
								fontSize: 12,
								alignment: 'center',
								bold: true,
								border: desProdutoM ? [true, false, true, false] : [false, false, false, false]
							}
						]);

						rows.push([
							qrcodesI ? {
								image: 'data:image/png;base64,' + qrcodesI,
								width: 40, 
								height: 40,
								alignment: 'center',
								border: [true, false, true, false]
							} : { text: '', border: [false, false, false, false]},						
							qrcodesJ ? {
								image: 'data:image/png;base64,' + qrcodesJ,
								width: 40,
								height: 40,
								alignment: 'center',
								border: [true, false, true, false]								
							} : { text: '', border: [false, false, false, false]},						
							qrcodesK ? {
								image: 'data:image/png;base64,' + qrcodesK,
								width: 40,
								height: 40,
								alignment: 'center',
								border: [true, false, true, false]								
							} : { text: '', border: [false, false, false, false]},						
							qrcodesL ? {
								image: 'data:image/png;base64,' + qrcodesL,
								width: 40,
								height: 40,
								alignment: 'center',
								border: [true, false, true, false]								
							} : { text: '', border: [false, false, false, false]},						
							qrcodesM ? {
								image: 'data:image/png;base64,' + qrcodesM,
								width: 40,
								height: 40,
								alignment: 'center',
								border: [true, false, true, false]								
							} : { text: '', border: [false, false, false, false]}
						]);

						rows.push([
							{
								text: '',
								border: desProdutoI ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: desProdutoJ ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: desProdutoK ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: desProdutoL ? [true, false, true, true] : [false, false, false, false]
							},
							{
								text: '',
								border: desProdutoM ? [true, false, true, true] : [false, false, false, false]
							}
						]);

						linhas++

						if(linhas > 3) {
							rows.push([
								{
									text: '',
									border: [false, true, false, false],
									colSpan: 4,
								},{},{},{},{
									text: '',
									pageBreak: 'after',
									border: [false, true, false, false]									
								}
							]);
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

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};
