'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['code128'], {"includetext" : true});
codes.loadModules(['qrcode'], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A6',  // 105 × 148 mm
			pageMargins: [0, 2, 2, 2],
			content: [
				{
					style: 'tableReport',
					table: {   // 7 Colunas 
						      //  1   2   3   4   5   6   7
							  //VOL ESP.... MAR NUM PBR PLQ
						widths: [30, 25, 35, 50, 20, 35, 35],
						body: []
					},
					style: {
						font: 'Consolas',
						fontSize: 8
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

					for(let i in res.results){
						let model = res.results[i];
						let transporte = res.results[i]['MOVIMENTOS_ENVIO'][0];
						let vias = parseInt(transporte['MOVIMENTOSENVIO_QUANTIDADE']) || 1;
						let tamNome = model['PESSOAS_NOME'].length;						
						let tamEnd = model['PESSOAS_ENDERECO'].length + 
						             model['PESSOAS_NUMERO'].length + 
									 model['PESSOAS_PAGINA'].length + 1;
						const barcodes  = await getBarcode(model['PESSOAS_CEP']);
						const qrcodes   = await getQrcode('https://goo.gl/maps/Ynt8k56yuEeQiVQG9'); // Localização da Hosp
						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/etiqueta/${model['EMPRESAS_CPFCNPJ']}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/etiqueta/default.png`;
						}
	

						let impressos;

						for(impressos = 0; impressos < vias; impressos++) {

							rows.push([
								{
									image: `${pathLogo}`,
									fit: [40, 40],
									alignment: 'center',
									border: [false, false, false, true]
								},
								{
									text: [
										{
											text: model['EMPRESAS_NOME'],
											fontSize: 8
										},
										{
											text: `\n${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']}\n${model['EMPRESAS_BAIRRO']}`,
											fontSize: 8
										},
										{
											text: `\n${utils.string.maskCep(model['EMPRESAS_CEP'])} ${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}`,
											fontSize: 8
										},
										{
											text: `\n${model['EMPRESAS_PAGINA']}`,
											fontSize: 8
										}
									],
									colSpan: 5,
									border: [false, false, false, true]
								},{},{},{},{},
								{
									border: [false, false, false, true],
									table: {
										body: [
											[
												qrcodes ? {
													image: 'data:image/png;base64,' + qrcodes,
													width: 32,
													height: 32,
													alignment: 'center'
												} : ''
											]
										]
									},
									layout: 'noBorders'
								}
							]);
	
							rows.push([
								{
									text: 'Destinatário:',
									style: {
										fontSize: 12,
										decoration: 'underline'
									},
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: model['PESSOAS_NOME'].toUpperCase() + (tamNome > 35 ? '' : '\n\n'),
									colSpan: 7,
									fontSize: 15,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_ENDERECO'].toUpperCase()} ${model['PESSOAS_NUMERO']} ${model['PESSOAS_PAGINA'].toUpperCase()}` + (tamEnd > 35 ? '' : '\n\n'),
									colSpan: 7,
									fontSize: 15,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_BAIRRO'].toUpperCase()}`,
									colSpan: 7,
									fontSize: 15,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${utils.string.maskCep(model['PESSOAS_CEP'])} ${model['CIDADES_NOME']} ${model['CIDADES_ESTADO']}`,
									colSpan: 7,
									fontSize: 15,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);

							rows.push([
								{
									text: `${utils.string.maskFone(model['PESSOAS_TELEFONE'])} ${utils.string.maskFone(model['PESSOAS_CELULAR'])}`,
									colSpan: 7,
									fontSize: 15,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);							

							rows.push([
								{
									colSpan: 7,
									border: [false, false, false, false],
									table: {
										body: [
											[ 
												barcodes ? {
													image: 'data:image/png;base64,' + barcodes,
													width: 72,
													height: 52, 
													alignment: 'center'														
												} : ''
											]
										]
									},
									layout: 'noBorders'
								},{},{},{},{},{},{}
							]);
	

							rows.push([
								{
									colSpan: 7,
									border: [false, true, false, true],
									text: '\nRecebedor:\n',
									fontSize: 10
								},{},{},{},{},{},{}
							]);

							rows.push([
								{
									colSpan: 4,
									border: [false, true, false, true],
									text: '\nDocumento:\n',
									fontSize: 10
								},{},{},{},
								{
									colSpan: 3,
									border: [false, true, false, true],
									text: '\nData:\n',
									fontSize: 10
								},{},{}
							]);

							rows.push([
								{
									colSpan: 7,
									border: [false, true, false, true],
									text: `\nTransportador: ${transporte['MOVIMENTOSENVIO_NOME'].toUpperCase()}`,
									fontSize: 10
								},{},{},{},{},{},{}
							]);

							rows.push([
								{
									text: [
										{
											text: `Volume(s)\n\n`, fontSize: 6
										},
										{
											text: `${((impressos + 1) || 1)}/${(transporte['MOVIMENTOSENVIO_QUANTIDADE'] || 1)}`,
											fontSize: 8, alignment: 'center'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: [
										{
											text: `Espécie\n\n`, fontSize: 6 },
										{
											text: transporte['MOVIMENTOSENVIO_ESPECIE'],
											fontSize: 8,
											alignment: 'center'
										}
									],
									colSpan: 2,
									border: [false, true, true, true]
								},{},
								{
									text: [
										{
											text: `Marca\n\n`, fontSize: 6
										},
										{
											text: transporte['MOVIMENTOSENVIO_MARCA'],
											fontSize: 8,
											alignment: 'center'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: 'Número', fontSize: 5 // Número (?)
								},
								{
									text: [
										{
											text: `Peso Bruto\n\n`,
											fontSize: 6
										},
										{
											text: utils.number.float2moeda(transporte['MOVIMENTOSENVIO_PESOBRUTO']),
											fontSize: 8,
											alignment: 'right'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: [
										{
											text: `Peso Líq.\n\n`,
											fontSize: 6
										},
										{
											text: utils.number.float2moeda(transporte['MOVIMENTOSENVIO_PESOLIQUIDO']),
											fontSize: 8,
											alignment: 'right'
										}
									],	
									border: [false, true, false, true]
								}
							]);
	
							rows.push([
								{
									text: `Documento: ${model['MOVIMENTOS_SERIE'] == 'NE' ? 'NF' : model['MOVIMENTOS_SERIE']} ${model['MOVIMENTOS_NUMERO']}   Emissão: ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`,
									fontSize: 12,
									colSpan: 7,
									border: [false, false, false, false]								
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `EM CASO DE EXTRAVIO LIGAR PARA: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])} ${utils.string.maskFone(model['EMPRESAS_CELULAR'])}`,
									fontSize: 8, 
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
							
							if(vias > 1 && (impressos + 1) < vias) {
								rows.push([
									{
										text: ``,
										fontSize: 1,
										colSpan: 7,
										border: [false, false, false, false],
										pageBreak: 'before'                                    
									},{},{},{},{},{},{}
								]);	
							}
							
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

const getBarcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('code128', chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};