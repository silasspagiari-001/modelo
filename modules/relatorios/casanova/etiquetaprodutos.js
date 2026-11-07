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
						widths: [180, 180, 180], // all 175 
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

						let idProdutoI  = i < viasEtiquetas.length ? viasEtiquetas[i]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoJ  = j < viasEtiquetas.length ? viasEtiquetas[j]['ETIQUETASITENS_ID_PRODUTOS'] : '';
						let idProdutoK  = k < viasEtiquetas.length ? viasEtiquetas[k]['ETIQUETASITENS_ID_PRODUTOS'] : '';

						let desProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_NOME'].substring(0, 60) : '';
						let desProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_NOME'].substring(0, 60) : '';
						let desProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_NOME'].substring(0, 60) : '';

						let uniProdutoI = idProdutoI ? viasEtiquetas[i]['PRODUTOS_UNIDADE'] : '';
						let uniProdutoJ = idProdutoJ ? viasEtiquetas[j]['PRODUTOS_UNIDADE'] : '';
						let uniProdutoK = idProdutoK ? viasEtiquetas[k]['PRODUTOS_UNIDADE'] : '';

						let precoI = idProdutoI ? `${utils.number.float2moeda(viasEtiquetas[i]['SALDOS_PRECO'])}` : ``;
						let precoJ = idProdutoJ ? `${utils.number.float2moeda(viasEtiquetas[j]['SALDOS_PRECO'])}` : ``;
						let precoK = idProdutoK ? `${utils.number.float2moeda(viasEtiquetas[k]['SALDOS_PRECO'])}` : ``;

			
						rows.push([
							desProdutoI ? {
								text: 'Casa Nova',
								color: 'white',
								fillColor: 'black',
								alignment: 'center',
								fontSize: 14,
								bold: true,
								border: [true, true, true, false]
							} : { text: '', border: [true, true, true, false]},
							desProdutoJ ? {
								text: 'Casa Nova',
								color: 'white',
								fillColor: 'black',
								alignment: 'center',
								fontSize: 14,
								bold: true,
								border: [true, true, true, false]								
							} : { text: '', border: [true, true, true, false]},
							desProdutoK ? {
								text: 'Casa Nova',
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
								text: desProdutoI,
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
									widths: [30, 35, '*', 15],
									body: [
										[
											{
												text: idProdutoI ? ('Cód\n' + idProdutoI) : '',
												fontSize: 12,
												font: 'Consolas',																
												bold: true,
												color: 'white',
												fillColor: idProdutoI ? 'black' : '',
												alignment: 'center'
											},
											idProdutoI ? {
												text: '\nÀ Vista',
												font: 'Consolas',	
												fontSize: 9,
												alignment: 'center',
												border: [true, false, true, false]
											} : { text: ''},
											{
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 5,						
													},
													{
														text: idProdutoI ? precoI : '',
														font: 'Consolas',													
														fontSize: 25,						
														bold: true,
														alignment: 'right'
													}
												]
											},
											idProdutoI ? {
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 7,						
													},
													{
														text: idProdutoI ? uniProdutoI : '',
														font: 'Consolas',													
														fontSize: 11,						
														bold: true,
														alignment: 'left'
													}
												]

											} : { text: ''}											
										]
									]
								},
								layout: 'noBorders'
							}, // J
							{
								table: { 
									widths: [30, 35, '*', 15],
									body: [
										[
											{
												text: idProdutoJ ? ('Cód\n' + idProdutoJ) : '',
												fontSize: 12,
												font: 'Consolas',																
												bold: true,
												color: 'white',
												fillColor: idProdutoJ ? 'black' : '',
												alignment: 'center'
											},
											idProdutoJ ? {
												text: '\nÀ Vista',
												font: 'Consolas',	
												fontSize: 9,
												alignment: 'center',
												border: [true, false, true, false]
											} : { text: ''},
											{
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 5,						
													},
													{
														text: idProdutoJ ? precoJ : '',
														font: 'Consolas',													
														fontSize: 25,						
														bold: true,
														alignment: 'right'
													}
												]
											},
											idProdutoJ ? {
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 7,						
													},
													{
														text: idProdutoJ ? uniProdutoJ : '',
														font: 'Consolas',													
														fontSize: 11,						
														bold: true,
														alignment: 'left'
													}
												]

											} : { text: ''}											
										]
									]
								},
								layout: 'noBorders'
							},
							{ // K
								table: { 
									widths: [30, 35, '*', 15],
									body: [
										[
											{
												text: idProdutoK ? ('Cód\n' + idProdutoK) : '',
												fontSize: 12,
												font: 'Consolas',																
												bold: true,
												color: 'white',
												fillColor: idProdutoK ? 'black' : '',
												alignment: 'center'
											},
											idProdutoK ? {
												text: '\nÀ Vista',
												font: 'Consolas',	
												fontSize: 9,
												alignment: 'center',
												border: [true, false, true, false]
											} : { text: ''},
											{
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 5,						
													},
													{
														text: idProdutoK ? precoK : '',
														font: 'Consolas',													
														fontSize: 25,						
														bold: true,
														alignment: 'right'
													}
												]
											},
											idProdutoK ? {
												text: [
													{
														text: 'a\n',
														color: 'white',
														fontSize: 7,						
													},
													{
														text: idProdutoK ? uniProdutoK : '',
														font: 'Consolas',													
														fontSize: 11,						
														bold: true,
														alignment: 'left'
													}
												]

											} : { text: ''}											
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
