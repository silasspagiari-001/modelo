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

function removerProdutosRepetidos(produtos){
	const produtosUnicos = [];
	const jaFoi = {};
	const removidos = {};
	for( let i = 0 ; i < produtos.length ; i++ )
	{
		if( jaFoi[ produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'] ] == undefined ){
			jaFoi[ produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'] ] = true;
			produtosUnicos.push( produtos[i] );
		}else{
			removidos[ produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'] ] = true;
		}
	}

	return produtosUnicos;
}

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
			api.movimentos().readById(params.id, params)
				.then(async res => {

					let rows = docDefinition.content[0].table.body;
					let linhas = 0;
					let pathLogo;

					let impresas = { /*Tudo o que ja foi*/ };
					let repetidas = {};
					
					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}

					let etiquetas = removerProdutosRepetidos( res.results[0]['MOVIMENTOS_ITENS'] );
					let viasEtiquetas = [];
					
					// INICIO DA ETIQUETA NORMAL
					for(let i in etiquetas){ // cria um novo objeto com a quantidade exata de vias de cada etiqueta.

						let vias = 1;
						for (let j = 0; j < vias; j++) {                         
							viasEtiquetas.push(etiquetas[i]);
						}
					}

					let registros = parseInt(viasEtiquetas.length) < 3 ? 3 : parseInt(viasEtiquetas.length);
					let j = 0, k = 0;

					//O CONTADOR VAI INCREMENTAR LA EM BAIXO
					for(let i = 0; i < registros; i = i) {

						j = (parseInt(i) + 1);
						k = (parseInt(i) + 2);

						let idProdutoI  = i < viasEtiquetas.length ? viasEtiquetas[i]['MOVIMENTOSITENS_ID_PRODUTOS'] : '';
						let idProdutoJ  = j < viasEtiquetas.length ? viasEtiquetas[j]['MOVIMENTOSITENS_ID_PRODUTOS'] : '';
						let idProdutoK  = k < viasEtiquetas.length ? viasEtiquetas[k]['MOVIMENTOSITENS_ID_PRODUTOS'] : '';

						let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(0, 60) : '';
						let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(0, 60) : '';
						let desProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(0, 60) : '';

						let idQrCodeI   = idProdutoI ? ('789' + ('0000000000' + idProdutoI).slice(-10)) : '';
						let idQrCodeJ   = idProdutoJ ? ('789' + ('0000000000' + idProdutoJ).slice(-10)) : '';
						let idQrCodeK   = idProdutoK ? ('789' + ('0000000000' + idProdutoK).slice(-10)) : '';
								
						let qrcodesI = idProdutoI ? await getQrcode(idQrCodeI) : '';
						let qrcodesJ = idProdutoJ ? await getQrcode(idQrCodeJ) : '';
						let qrcodesK = idProdutoK ? await getQrcode(idQrCodeK) : '';

						let precoI = idProdutoI ? `${utils.number.float2moeda(viasEtiquetas[i]['SALDOS_PRAZO'])}` : ``;
						let precoJ = idProdutoJ ? `${utils.number.float2moeda(viasEtiquetas[j]['SALDOS_PRAZO'])}` : ``;
						let precoK = idProdutoK ? `${utils.number.float2moeda(viasEtiquetas[k]['SALDOS_PRAZO'])}` : ``;

						rows.push([
							desProdutoI ? {
								text: 'Pinguim Construcenter',
								color: 'white',
								fillColor: 'black',
								alignment: 'center',
								fontSize: 14,
								bold: true,
								border: [true, true, true, false]
							} : { text: '', border: [true, true, true, false]},
							desProdutoJ ? {
								text: 'Pinguim Construcenter',
								color: 'white',
								fillColor: 'black',
								alignment: 'center',
								fontSize: 14,
								bold: true,
								border: [true, true, true, false]								
							} : { text: '', border: [true, true, true, false]},
							desProdutoK ? {
								text: 'Pinguim Construcenter',
								color: 'white',
								fillColor: 'black',
								alignment: 'center',
								fontSize: 14,
								bold: true,
								border: [true, true, true, false]								
							} : { text: '', border: [true, true, true, false]}
						]);

						rows.push([
							{
								text:  desProdutoI,
								font: 'Consolas',	
								fontSize: 10,
								border: [true, false, true, false]
							},
							{
								text: desProdutoJ,
								font: 'Consolas',										
								fontSize: 10,
								border: [true, false, true, false]
							},
							{
								text: desProdutoK,
								font: 'Consolas',										
								fontSize: 10,
								border: [true, false, true, false]
							}
						]);

						rows.push([											
							{
								table: {
									widths: [80, 30, 60],
									body: [
										[
											{
												text: idProdutoI,
												fontSize: 12,
												bold: true,
												color: 'white',
												fillColor: idProdutoI ? 'black' : '',
												alignment: 'center'
											},
											{
												text: '',
											},
											idProdutoI ? {
												image: 'data:image/png;base64,' + qrcodesI,
												width: 40, 
												height: 40,
												rowSpan: 2,
												alignment: 'center',
												border: [true, false, true, false]
											} : { text: '', rowSpan: 2}				
										],
										[
											{
												text: [
													{
														text: idProdutoI ? 'À Vista\n' : '',
														alignment: 'center',														
													},
													{
														text: precoI,
														alignment: 'center',
														fontSize: 14,
														bold: true
													}
												],
												border: [false, false, false, false]
											},
											{ text: ''},
											{ text: ''}
										]
									]
								},
								layout: 'noBorders'
							},
							{
								table: {
									widths: [80, 30, 60],
									body: [
										[
											{
												text: idProdutoJ,
												fontSize: 12,
												bold: true,
												color: 'white',
												fillColor: idProdutoJ ? 'black' : '',
												alignment: 'center'
											},
											{
												text: ''
											},
											idProdutoJ ? {
												image: 'data:image/png;base64,' + qrcodesJ,
												width: 40, 
												height: 40,
												rowSpan: 2,
												alignment: 'center',
											} : { text: '', rowSpan: 2}
										],
										[
											{
												text: [
													{
														text: idProdutoJ ? 'À Vista\n' : '',
														alignment: 'center',														
													},
													{
														text: precoJ,
														alignment: 'center',
														fontSize: 14,
														bold: true
													}
												],
												border: [false, false, false, false]
											},
											{ text: ''},
											{ text: ''}
										]
									]
								},
								layout: 'noBorders'
							}, // agora é o K
							{
								table: {
									widths: [80, 30, 60],
									body: [
										[
											{
												text: idProdutoK,
												fontSize: 12,
												bold: true,
												color: 'white',
												fillColor: idProdutoK ? 'black' : '',
												alignment: 'center',
												border: idProdutoK ? [true, false, true, false] : [false, false, false, false]
											},
											{
												text: '',
												border: idProdutoK ? [true, false, true, false] : [false, false, false, false]												
											},
											idProdutoK ? {
												image: 'data:image/png;base64,' + qrcodesK,
												width: 40, 
												height: 40,
												rowSpan: 2,
												alignment: 'center',
												border: [true, false, true, false]
											} : { text: '', rowSpan: 2, border: [false, false, false, false]}
										],
										[
											{
												text: [
													{
														text: idProdutoK ? 'À Vista\n' : '',
														alignment: 'center',														
													},
													{
														text: precoK,
														alignment: 'center',
														fontSize: 14,
														bold: true
													}
												],
												border: [false, false, false, false]
											},
											{ text: '',	border: idProdutoK ? [true, false, true, false] : [false, false, false, false]},
											{ text: '',	border: idProdutoK ? [true, false, true, false] : [false, false, false, false]}
										]
									]
								},
								layout: 'noBorders'
							}
						]);

						rows.push([
							{
								text: '',
								border: [false, false, false, false],
								colSpan: 3
							},{},{}
						]);

						//Identificar os produtos que ja foram impressos
						if(!impresas[ idProdutoI ]){
							impresas[ idProdutoI ] = 1;
						}else{
							impresas[ idProdutoI ]++;
							repetidas[idProdutoI] = true;
						}

						if(!impresas[ idProdutoJ ]){
							impresas[ idProdutoJ ] = 1;
						}else{
							impresas[ idProdutoJ ]++;
							repetidas[idProdutoJ] = true;
						}

						if(!impresas[ idProdutoK ]){
							impresas[ idProdutoK ] = 1;
						}else{
							impresas[ idProdutoK ]++;
							repetidas[idProdutoK] = true;
						}

						//PULA PARA O PROXIMO BLOCO DE 3
						i += 3;
						
						linhas++

						if(linhas > 6) {
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
