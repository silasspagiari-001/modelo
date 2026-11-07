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
			pageOrientation: 'landscape',
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
							text: 'Relatório de Usuários',
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
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CÓD NOM LOG  FIL CEL  01  02  03  04  05, 06, 07, 08, 09, 99 
						widths: [35, 220, 80, 100, 80, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
						headerRows: 1,
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader'
								}, 
								{
									text: 'Nome',
									style: 'tableHeader'
								}, 
								{
									text: 'Login',
									style: 'tableHeader'									
								},
								{
									text: 'Filial',
									style: 'tableHeader'
                                },
								{
									text: 'Celular',
									style: 'tableHeader'
								},                                
								{
									text: '01',
									style: 'tableHeader'
								},	
								{
									text: '02',
									style: 'tableHeader'
								},															
								{
									text: '03',
									style: 'tableHeader'
								}, 
								{
									text: '04',
									style: 'tableHeader'
								},
								{
									text: '05',
									style: 'tableHeader'
                                },
								{
									text: '06',
									style: 'tableHeader'
								},	
								{
									text: '07',
									style: 'tableHeader'
								},															
								{
									text: '08',
									style: 'tableHeader'
								}, 
								{
									text: '09',
									style: 'tableHeader'
								},
								{
									text: '99',
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
						'_'.repeat(140),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},			
			styles: {
				tableExample: {
					fontSize: 10,
					margin: [0, 0, 0, 0],
					border: 0 // 0.5
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.usuariosativos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						rows.push([
							{   text: res.results[i]['USUARIOS_ID'], alignment: 'right'},
							{   text: res.results[i]['USUARIOS_NOME']},
							{ 	text: res.results[i]['USUARIOS_LOGIN']},
							{	text: res.results[i]['EMPRESAS_FANTASIA']},
							{	text: utils.string.maskFone(res.results[i]['USUARIOS_CELULAR'])},
                            {   text: (res.results[i]['USUARIOS_FILIAL01'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL02'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL03'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL04'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL05'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL06'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL07'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL08'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL09'] == 'T' ? 'X' : ''), alignment: 'center'},
                            {   text: (res.results[i]['USUARIOS_FILIAL99'] == 'T' ? 'X' : ''), alignment: 'center'}
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
