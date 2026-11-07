'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.ordens().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L
									//        1   2   3   4   5   6   7
									widths: [70, 90, 60, 60, 60, 80, 80],
									heights: 5,
									body: []
								},
								style: {
									fontSize: 10
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
						
					let model       = res.results[0];
					let itensPagina = 0;

					let obsOrdem = (model['ORDENS_OBSERVACOES'] ? model['ORDENS_OBSERVACOES'].split('|').join(' ') : '\n\n\n\n');

					let emiOrdem = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let produtos = model['ORDENS_PRODUTOSITENS'] || [];
					let rows     = docDefinition.content[0].table.body;

					let itensEspelho = [
						'CARCAÇA CENTRAL',
						'PRATO',
						'COLAR',
						'MANCAL DE ENCOSTO',
						'MANCAL RADIAL',
						'ESPACADOR',
						'ANEL DE COLAR',
						'ANEL DE EIXO',
						'ANEL VITON CENTRAL',
						'TRAVA DE MANCAL',
						'FLANGE',
						'ROTOR', 
						'EIXO'
					];

					rows.push(
						[
							{
								text: model['EMPRESAS_FANTASIA'],
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
							},
							{
								text: `${model['DOCUMENTOS_NOME'].toUpperCase()} - INTERNA`,
								alignment: 'center',
								colSpan: 5,
								border: [false, false, false, false],								
								style: {bold: true, fontSize: 12}
							},{},{},{},{},
							{
								text: 'Nº ' + model['ORDENS_REFERENCIA'],
								alignment: 'right',
								style: {bold: true},
								border: [false, false, false, false]
							}
						],
						[

							{
								text: 'Emissao: ' + emiOrdem,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
								colSpan: 2
							},{},
							{
								text: ``,
								colSpan: 3,
								border: [false, false, false, false],
								style: {bold: true,	fontSize: 7}
							},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								colSpan: 2,
								border: [false, false, false, false],
								style: {bold: true}
							},{}
						],
						[
							{
								text: 'Cliente: ' + model['ORDENS_NOME'],
								colSpan: 5,
								border: [false, true, false, false],

							},{},{},{},{},
							{
								text: 'Código: ' + model['ORDENS_ID_PESSOAS'],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, false]								
							},{}
						],
						[
							{
								text: 'Equipamento: ' + model['PRODUTOS_NOME'],
								colSpan: 4,
								border: [false, true, false, false]								
							},{},{},{},
							{
								text: 'Situação: ' + (model['ORDENS_STATUS'] == 'N' ? 'Aberta' : model['ORDENS_STATUS'] == 'E' ? 'Fechada' : 'Faturada'),
								colSpan: 3,
								border: [false, true, false, false]								
							},{},{}
						],
						[
							{
								text: 'Modelo: ' + model['ORDENS_IDENTIFICACAO'],
								colSpan: 3,
								border: [false, true, false, false]								
							},{},{},
							{
								text: 'Aplicação: ' + model['ORDENS_GEOLOCALIZACAO'],
								colSpan: 4,
								border: [false, true, false, false]								
							},{},{},{}	
						],
						[
							{
								text: 'Defeito : ' + obsOrdem,
								colSpan: 7,
								alignment: 'justify',
								border: [false, false, false, false]								
							},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'DESCRIÇÃO DO MATERIAL APLICADO',
								colSpan: 7,
								alignment: 'center',
								border: [false, true, false, false]
							},{},{},{},{},{},{}
						]
					);

					rows.push(
						[
							{
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 3
							}, 
							{},{},
							{
								text: 'Qtde',
								alignment: 'center'								
							},
							{
								text: 'Unitário',
								alignment: 'center'								
							},
							{
								text: 'Total',
								alignment: 'center'								
							}
						]
					);

					if(produtos.length > 0) {
						for(let i in produtos){

							rows.push(
								[
									{							
										text: produtos[i]['ORDENSPRODUTOS_ID_PRODUTOS'],
										alignment: 'right'
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 3,
									},{},{},
									{ 
										text: produtos[i]['ORDENSPRODUTOS_QUANTIDADE'], 
										alignment: 'right'
									},
									{ 
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_PRECO']), 
										alignment: 'right'
									},
									{ 
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_TOTAL']),
										alignment: 'right'
									}
								]
							);

							itensPagina++

							if(itensPagina > 13) {
								itensPagina = 0;
								rows.push( // Aqui fecho o rodapé de cada página
									[
										{
											colSpan: 7,
											text: 'Continua...',
											pageBreak: 'after',
											border: [false, false, false, false]
										},{},{},{},{},{},{}
									]						
								);									
							}

						}		
					} else { // Lista default
						for(let i in itensEspelho){

							rows.push(
								[
									{							
										text: ' ',
									},
									{
										text: itensEspelho[i],
										colSpan: 3,
									},{},{},
									{ text: ' '},   // Qtde
									{ text: ' '},   // Unitário
									{ text: ' '}   // Total																
								]
							);

							itensPagina++

							if(itensPagina > 13) {
								itensPagina = 0;
								rows.push( // Aqui fecho o rodapé de cada página
									[
										{
											colSpan: 7,
											text: 'Continua...',
											pageBreak: 'after',
											border: [false, false, false, false]
										},{},{},{},{},{},{}
									]						
								);									
							}

						}		
					}

					if(itensPagina < 13) {
						for(let lB = itensPagina; lB < 13; lB++) {
							rows.push([ //linhas restantes até completar 1/2 A4
								{							
									text: ' ',
								},
								{
									text: 'A',
									color: 'white',
									colSpan: 3,
								},{},{},
								{ text: ' '},   // Qtde
								{ text: ' '},   // Unitário
								{ text: ' '}   // Total																
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