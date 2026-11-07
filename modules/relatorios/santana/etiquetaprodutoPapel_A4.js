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
			pageMargins: [2, 2, 2, 2],
			content: [
				{
					table: {  
						widths: [284], // Uma coluna apenas
						body: []
					}
				}
			]
		};

        return new Promise((resolve, reject) => {
			api.etiquetas().readById(params.id, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;
					const itens = res.results[0]['ETIQUETAS_ITENS'];

					for(let i in itens){

						const vias = (itens[i]['ETIQUETASITENS_QUANTIDADE'] || 1);

						for (let v = 0; v < vias; v++) {
							rows.push([
								{
									text: [
										{
											text: `${itens[i]['PRODUTOS_NOME']}\n`,
											font: 'Consolas',
											fontSize: 20,
											alignment: 'left',		
										},
										{
											text: `APLICACAO: ${itens[i]['ETIQUETASITENS_APLICACAO']}\n`,
											font: 'Consolas',
											fontSize: 20,
											alignment: 'left',		
										},
										{
											text: `MODELO: ${itens[i]['ETIQUETASITENS_MODELO']}\n`,
											font: 'Consolas',
											fontSize: 20,
											alignment: 'left',		
										}
									],
									border: [true, true, true, true]
								}
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
