'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['code128'], {"includetext" : false});

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 20],
			content: [
				{
					style: 'tableReport',
					table: {   // 9 Colunas 
						      //  1   2   3   4   5   6   7   8   9
						widths: [45, 45, 10, 76, 76, 76, 76, 76, 76],
						body: []
					},
					style: {
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
						let vias = parseInt(transporte['MOVIMENTOSENVIO_VOLUMES']) || 1;

						let pathLogo;
						let impressos;
						let foneExtravio = model['MOVIMENTOS_ID_EMPRESAS'] == 3 ? model['EMPRESAS_CELULAR'] : model['EMPRESAS_TELEFONE'];

						try {
							pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/headers/default.png`;
						}

						for(impressos = 0; impressos < vias; impressos++) {

							rows.push([
								{
									image: pathLogo,
									fit: [100,100],
									colSpan: 2,
									border: [false, false, false, true]
								},{},
								{
									text: '',
									border: [false, false, false, true]
								},
								{
									text: [
										{
											text: model['EMPRESAS_FANTASIA'],
											font: 'Consolas',
											fontSize: 18,
											bold: true
										},
										{
											text: `\n${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} ${model['EMPRESAS_BAIRRO']}`,
											fontSize: 12
										},
										{
											text: `\n${utils.string.maskCep(model['EMPRESAS_CEP'])} ${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}`,
											fontSize: 12
										}
	
									],
									colSpan: 5,
									border: [false, false, false, true]
								},{},{},{},{}
							]);
	
							rows.push([
								{
									text: 'Destinatário:',
									colSpan: 9,
									fontSize: 10,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: model['PESSOAS_NOME'],
									bold: true,
									colSpan: 9,
									fontSize: 16,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_ENDERECO']} ${model['PESSOAS_NUMERO']} `,
									colSpan: 9,
									fontSize: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: `${model['PESSOAS_BAIRRO']}`,
									colSpan: 9,
									fontSize: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: `${utils.string.maskCep(model['PESSOAS_CEP'])} ${model['CIDADES_NOME']} ${model['CIDADES_ESTADO']}`,
									colSpan: 9,
									fontSize: 14,
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: [
										{
											text: 'Transportador: ',
											fontSize: 11
										},
										{
											text: transporte['MOVIMENTOSENVIO_NOME'],
											fontSize: 14
										}
									],
									colSpan: 9,
									border: [false, false, false, true]
								},{},{},{},{},{},{},{},{}							
							]);
	
							rows.push([
								{
									text: [
										{
											text: `Qtde\n`,
											fontSize: 9
										},
										{
											text: transporte['MOVIMENTOSENVIO_QUANTIDADE'],
											fontSize: 12,
											alignment: 'right'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: [
										{
											text: `Espécie\n`,
											fontSize: 9
										},
										{
											text: transporte['MOVIMENTOSENVIO_ESPECIE'],
											fontSize: 12,
											alignment: 'center'
										}
									],
									colSpan: 2,
									border: [false, true, true, true]
								},{},
								{
									text: [
										{
											text: `Marca\n`,
											fontSize: 9
										},
										{
											text: transporte['MOVIMENTOSENVIO_MARCA'],
											fontSize: 12,
											alignment: 'center'
										}
									],	
									colSpan: 2,								
									border: [false, true, true, true]
								},{},
								{
									text: [
										{
											text: `Número\n`,
											fontSize: 9
										},
										{
											text: `${(transporte['MOVIMENTOSENVIO_VOLUMES'] || 1)}/${((impressos + 1) || 1)}`,
											fontSize: 12,
											alignment: 'center'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: [
										{
											text: `Peso Bruto\n`,
											fontSize: 9
										},
										{
											text: utils.number.float2moeda(transporte['MOVIMENTOSENVIO_PESOBRUTO']),
											fontSize: 12,
											alignment: 'center'
										}
									],	
									border: [false, true, true, true]
								},
								{
									text: [
										{
											text: `Peso Líquido\n`,
											fontSize: 9
										},
										{
											text: utils.number.float2moeda(transporte['MOVIMENTOSENVIO_PESOLIQUIDO']),
											fontSize: 12,
											alignment: 'center'
										}
									],	
									border: [false, true, false, true]
								}
							]);
	
							rows.push([
								{
									text: `Documento: ${model['MOVIMENTOS_SERIE']} ${model['MOVIMENTOS_NUMERO']}   Emissão: ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`,
									fontSize: 14,
									colSpan: 9,
									bold: true,
									border: [false, false, false, false]								
								},{},{},{},{},{},{},{},{}
							]);
	
							rows.push([
								{
									text: `EM CASO DE EXTRAVIO LIGAR PARA: ${utils.string.maskFone(foneExtravio)}`,
									fontSize: 10, 
									colSpan: 9,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{}
							]);

							rows.push([
								{
									text: '- '.repeat(67),
									fontSize: 14,
									colSpan: 9,
									bold: true,
									border: [false, false, false, false]								
								},{},{},{},{},{},{},{},{}
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