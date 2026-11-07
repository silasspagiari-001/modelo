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
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 40, 20, 35],  // [40, 40, 40, 35],
			header: function(page, pages) { 
				return { 
					alignment: 'justify',
					columns: [
						{
							image: pathLogo,
							width: 100,
							height: 22,
						},
						{
							text: 'Relatório de Aplicações',
							width: '*',
							style: {
								fontSize: 16,
								alignment: 'center',
								color: 'red'
							}
						},
						{
							stack: [
								moment.tz(params.timezone).format('DD/MM/YYYY'),
								moment.tz(params.timezone).format('HH:mm:ss')
							],
							width: 100,
							style: {
								fontSize: 10,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [40, 10]
				}
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					alignment: 'center',
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {    //COD MSK NIVEL/NOME
						widths: [70, 400, 45],
						headerRows: 1,
						body: [
							[
								{
									text: 'Máscara',
									style: 'tableHeader'									
								},
								{
									text: 'Nome',
									style: 'tableHeader'
                                },
								{
									text: 'Reduzido',
									style: 'tableHeader'
								}
							]
						]
					}
				}
			],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},			
			styles: {
				tableExample: {
					fontSize: 10,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.aplicacoes().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let nivelAtual = res.results[0]['APLICACOES_MASCARA'];
					for(let i in res.results){
						const id = res.results[i]['APLICACOES_ID'];
						const mascara = res.results[i]['APLICACOES_MASCARA'] || '';
						const status = res.results[i]['APLICACOES_STATUS'] == 'A' ? 'Analítica' : 'Sintética';
						const nome = res.results[i]['APLICACOES_NOME'];
						const tipo = res.results[i]['APLICACOES_TIPO'] == 'R' ? 'Receita' : 'Despesa';

						let nivelEspacosAtual = '';
						let qtdeEspacosNivel = 0;

						if(mascara != ''){
							const mascaraDividida = mascara.split('.');
							const ultimoNivel = mascaraDividida.slice(-1);
							const nivelSintetico = mascaraDividida.slice(0, mascaraDividida.length-1).join('.');

							if( nivelAtual != nivelSintetico ){
								nivelAtual = nivelSintetico;
							}
							
							for( let i = mascaraDividida.length-1 ; i >= 1 ; i-- ){
								
								if( Number(mascaraDividida[i]) > 0 ){
									qtdeEspacosNivel += 5;
								}
							}

							nivelEspacosAtual = (new Array( qtdeEspacosNivel )).fill('A').join('');
						}

						rows.push([
							{ 	text: mascara || 'SEM MASCARA', alignment: 'left'},
							{	text: [
								{text: nivelEspacosAtual, fontSize: 10, color: 'white'},
								{text: nome}
							]},
							{   text: id, alignment: 'center'},
						]);
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
