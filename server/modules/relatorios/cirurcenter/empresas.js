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
			pageMargins: [20, 40, 20, 15],
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
							text: 'Relatório de Empresas',
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
					fontSize: 10,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CD  CNP FAN NOM  END  NR  BAI  CP  MN  UF  FO
						widths: [22, 65, 70, 140, 130, 20,  70, 35, 85, 15, 60],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Cód',
									style: 'tableHeader'
								},
								{
									text: 'CNPJ',
									style: 'tableHeader',
									alignment: 'center'
								}, 
								{
									text: 'Fantasia',
									style: 'tableHeader',
									alignment: 'center'
								}, 
								{
									text: 'Nome',
									style: 'tableHeader',
									alignment: 'center'
								}, 
								{
									text: 'Endereço',
									style: 'tableHeader'
								},
								{
									text: 'N°',
									style: 'tableHeader'
								},
								{
									text: 'Bairro',
									style: 'tableHeader'
								},	
								{
									text: 'CEP',
									style: 'tableHeader'
								},															
								{
									text: 'Cidade',
									style: 'tableHeader'
								}, 
								{
									text: 'UF',
									style: 'tableHeader'
								},
								{
									text: 'Fone',
									style: 'tableHeader'
								}								
							]
						]
					},
					layout: {
						fillColor: function (i) {
							return (i % 2 === 0) ? '#E3E3E3' : null;
						}
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
			api.empresas().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){
						const cepArray = res.results[i]['EMPRESAS_CEP'].split('');
						cepArray.splice(5,0,'-');
						const cepMascarado = cepArray.join('');

						rows.push([
							{
								text: ("00000" + res.results[i]['EMPRESAS_ID']).slice(-5),
								style: {fontSize: 7}
							},							
							{   
								text: utils.string.maskCnp(res.results[i]['EMPRESAS_CPFCNPJ']),
								style: {fontSize: 7}
							},
							{   
								text: res.results[i]['EMPRESAS_FANTASIA'],
								style: {fontSize: 7}
							},
							{  
								 text: res.results[i]['EMPRESAS_NOME'],
								style: {fontSize: 7}
							},
							{ 
								text: res.results[i]['EMPRESAS_ENDERECO'],
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['EMPRESAS_NUMERO'],
								style: {fontSize: 7}								
							},
							{
								text: res.results[i]['EMPRESAS_BAIRRO'],
								style: {fontSize: 7}
							},
							{
								text: cepMascarado,
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['CIDADES_NOME'],
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['CIDADES_ESTADO'],
								style: {fontSize: 7}
							},
							{
								text: utils.string.maskFone(res.results[i]['EMPRESAS_TELEFONE']),
								style: {fontSize: 7}
							}
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