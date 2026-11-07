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
			pageSize: {width: 290, height: 'auto'},//'A7', //
			pageOrientation: 'portrait', //'landscape',
			pageMargins: [12, 2, 2, 1], // [10, 2, 2, 1] E S D I
			content: [
				{
					style: 'tableReport',
					table: {   // 7 Colunas 
						      //  1   2   3   4   5   6   7
							  //VOL ESP.... MAR NUM PBR PLQ
						widths: [30, 18, 29, 50, 20, 35, 35],
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
						let tamEnd = model['PESSOAS_ENDERECO'].length + model['PESSOAS_NUMERO'].length + 1;
						const qrcodes   = await getQrcode('https://maps.app.goo.gl/ZoL6DgeBBbGUggDG9'); // Localização da Turbotec
						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/etiqueta/${params.empresacnpj}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/etiqueta/default.png`;
						}
	
						let impressos;

						for(impressos = 0; impressos < vias; impressos++) {
							if(impressos > 0) {
								rows.push([
									{
										text: ``,
										fontSize: 1, 
										colSpan: 7,
										pageBreak: 'before',
										border: [false, false, false, false]
									},{},{},{},{},{},{}
								]);
							} else {
								rows.push([
									{
										text: ``,
										fontSize: 1, 
										colSpan: 7,
										border: [false, false, false, false]
									},{},{},{},{},{},{}
								]);
							}

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
											fontSize: 7
										},
										{
											text: `\n${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']}\n${model['EMPRESAS_BAIRRO']}`,
											fontSize: 7
										},
										{
											text: `\n${utils.string.maskCep(model['EMPRESAS_CEP'])} ${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}`,
											fontSize: 7
										},
										{
											text: `\n${model['EMPRESAS_PAGINA']}`,
											fontSize: 7
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
													width: 28, // 32
													height: 28, // 32
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
										fontSize: 10,
										decoration: 'underline'
									},
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_NOME'].toUpperCase()}\n${model['PESSOAS_ENDERECO'].toUpperCase()} ${model['PESSOAS_NUMERO']}\n${model['PESSOAS_BAIRRO'].toUpperCase()}\n${utils.string.maskCep(model['PESSOAS_CEP'])} ${model['CIDADES_NOME']} ${model['CIDADES_ESTADO']}`,
									colSpan: 7,
									fontSize: (model['PESSOAS_NOME'].length > 30 ? 12 : 14), 
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
		
							rows.push([
								{
									colSpan: 7,
									border: [false, true, false, true],
									text: `Transportador: ${transporte['MOVIMENTOSENVIO_NOME'].toUpperCase()}`,
									fontSize: 9
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
											fontSize: 7, alignment: 'center'
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
											fontSize: 7,
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
											fontSize: 7,
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
											fontSize: 7,
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
											fontSize: 7,
											alignment: 'right'
										}
									],	
									border: [false, true, false, true]
								}
							]);
	
							rows.push([
								{
									text: [
										{
											text: `Documento: ${model['MOVIMENTOS_SERIE'] == 'NE' ? 'NF' : model['MOVIMENTOS_SERIE']} ${model['MOVIMENTOS_NUMERO']}   Emissão: ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`,
											fontSize: 11,
											colSpan: 7,
											border: [false, false, false, false]
										},
										{
											text: `\nEM CASO DE EXTRAVIO LIGAR PARA: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])} ${utils.string.maskFone(model['EMPRESAS_CELULAR'])}`,
											fontSize: 7, 
										}
									],
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);							
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