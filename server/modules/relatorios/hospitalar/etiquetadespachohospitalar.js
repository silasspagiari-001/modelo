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
			pageOrientation: 'landscape',
			pageSize: 'A6',  // 105 × 148 mm
			pageMargins: [7, 7, 2, 2], //0222
			content: [
				{
					style: 'tableReport',
					table: {   // 7 Colunas 
						      //  1   2   3   4   5   6   7
							  //VOL ESP.... MAR NUM PBR PLQ
						widths: [40, 30, 45, 60, 40, 85, 35],//
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
						let tamVolumes = vias > 99 ? 45 : 50;
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
									fit: [50, 50],
									alignment: 'center',
									border: [false, false, false, true]
								},
								{
									text: [
                                        {
                                            text: 'REMETENTE',
                                            fontSize: 10
                                        },
										{
											text: `\n${model['EMPRESAS_NOME']}`,
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
											text: `\n${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])} IE: ${model['EMPRESAS_INSCRICAO']}`,
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
													fit: [40, 40],
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
									text: [
										{
											text: 'DESTINATÁRIO',
											style: {
												fontSize: 16,
												decoration: 'underline'
											},
										},
										{
											text: ':',
											style: {
												fontSize: 16
											},
										}
									],
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}	
							]);
	
							rows.push([
								{
									text: model['PESSOAS_NOME'].toUpperCase(),
									colSpan: 7,
									fontSize: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_ENDERECO'].toUpperCase()} ${model['PESSOAS_NUMERO']} ${model['PESSOAS_PAGINA'].toUpperCase()}`,
									colSpan: 7,
									fontSize: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_BAIRRO'].toUpperCase()}`,
									colSpan: 7,
									fontSize: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `${utils.string.maskCep(model['PESSOAS_CEP'])} ${model['CIDADES_NOME']} ${model['CIDADES_ESTADO']}`,
									colSpan: 7,
									fontSize: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);

							rows.push([
								{
									text: `${utils.string.maskFone(model['PESSOAS_TELEFONE'])} ${utils.string.maskFone(model['PESSOAS_CELULAR'])}`,
									colSpan: 7,
									fontSize: 13,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);							

							rows.push([
                                {
                                    text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])} IE: ${model['PESSOAS_INSCRICAO']}`,
                                    fontSize: 13,
									colSpan: 7,
									border: [false, false, false, true]                                    
                                },{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: [
										{
											text: 'NOTA FISCAL',
											style: {
												fontSize: 16,
												decoration: 'underline'
											},
										},
										{
											text: '\n\n',
											style: {
												fontSize: 8
											},
										},
										{
											text: model['MOVIMENTOS_NUMERO'],                                    
											fontSize: 50,
											alignment: 'center'
										}
									],
									colSpan: 4,
									border: [false, false, false, false]
								},{},{},{},
								{
									text: [
										{
											text: 'VOLUME',
											style: {
												fontSize: 16,
												decoration: 'underline'
											},
										},
										{
											text: '\n\n',
											style: {
												fontSize: 8
											},
										},
										{
											text: `${((impressos + 1) || 1)}/${(transporte['MOVIMENTOSENVIO_QUANTIDADE'] || 1)}`,
											fontSize: tamVolumes,
											alignment: 'center'	
										}

									],
									colSpan: 3,
									border: [true, false, false, false]
								},{},{}	
							]);	

							
							if(vias > 1 && (impressos + 1) < vias) {
								rows.push([
									{
										text: ``,
										fontSize: 6,
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

const getQrcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('qrcode', chave);
		const codqr = (codigo || '').toString("base64");
        resolve(codqr);
    });
};