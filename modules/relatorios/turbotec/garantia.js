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
						pageSize: 'A4',                //  [E    S   D   I]
						pageMargins: [128, 54, 20, 25], // [120, 212, 20, 25]  
						content: [
							{
								style: 'tableReport',
								table: {
									//        1  2   3   4   5   6   7
									widths: [10, 6, 12, 230, 15, 8, 32],
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
					let emiOrdem = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let rows     = docDefinition.content[0].table.body;

					rows.push(
						[
                            { text: '', colSpan: 2, border: [false, false, false, false]},{},
							{
								text: model['EMPRESAS_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{}
						],
						[
                            { text: '', colSpan: 4, border: [false, false, false, false]},{},{},{},
							{
								text: emiOrdem,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
								colSpan: 3
							},{},{}
						],
						[
                            { text: '', colSpan: 2, border: [false, false, false, false]},{},
							{
								text: model['ORDENS_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{}
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['PESSOAS_ENDERECO'],
								alignment: 'left',
                                colSpan: 6,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{},{}
                        ],
						[
							{
								text: model['CIDADES_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{},
                            {
								text: model['CIDADES_ESTADO'],
								colSpan: 2,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false]
                            },{}
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['ORDENS_IDENTIFICACAO'],
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]								
							},{},{},
                            {
								text: model['ORDENS_GEOLOCALIZACAO'],
								colSpan: 3,
								alignment: 'center',
                                fontSize: 7,
								border: [false, false, false, false]								
                            },{},{}
						],
						[
                            { text: 'A', color: 'white', fontSize: 6, colSpan: 7, border: [false, false, false, false]},{},{},{},{},{},{}  // Só pra ajuste
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['ORDENS_REFERENCIA'],
								colSpan: 6,
								alignment: 'left',
								border: [false, false, false, false]								
							},{},{},{},{},{}
                        ]
					);
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};