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
		let intervalo = params.datainicio != 'Data inválida' && params.datafinal != 'Data inválida' ? 
		                'Entre ' + params.datainicio + ' e ' + params.datafinal : '';
		let tipo = params.relacao == '1' ? ' - Sem Movimento' : 
		           params.relacao == '2' ? ' - Com Movimento' : '';

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 40, 40, 35],
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
							text: `Relatório de Produtos ${tipo} ${intervalo}`,
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
					margin: [20, 10]
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
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{}]},				
				{
					style: 'tableExample',
					table: {   //CD  NOM  NCM  UNI PRC SLD
						widths: [30, 305, 40, 25, 50, 50],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Cód',
									style: 'tableHeader'
								},
								{
									text: 'Nome',
									style: 'tableHeader',
									alignment: 'center'
								}, 
								{
									text: 'NCM',
									style: 'tableHeader'
								},
								{
									text: 'Unid',
									style: 'tableHeader'
								},
								{
									text: 'Preço',
									style: 'tableHeader'
								},	
								{
									text: 'Saldo',
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
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [20, 10]
				};
			},			
			styles: {
				tableExample: {
					fontSize: 8,
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
			api.relprodutos().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimoGrupo = 0;
					for(let i in res.results){
						const ultimaCompra = moment(res.results[i]['PRODUTOS_ULTIMA']);
						if(params.ordem == 0) { // Ordem Grupo
                           if(ultimoGrupo != res.results[i]['PRODUTOS_ID_GRUPOS']) {
								rows.push([
									{
										text: "* * * Grupo: " + res.results[i]['PRODUTOS_ID_GRUPOS'] + " - " + res.results[i]['GRUPOS_NOME'] + '* * *',
										alignment: 'center',
										colSpan: 6,
										style: {fontSize: 10},
										border: [false, false, false, false]										
									},{},{},{},{},{}
								]);	
						   }
						   ultimoGrupo = res.results[i]['PRODUTOS_ID_GRUPOS'];
						}

						rows.push([
							{
								text: ("00000" + res.results[i]['PRODUTOS_ID']).slice(-5),
								style: 'tableExample'
							},							
							{   text: res.results[i]['PRODUTOS_NOME'],
							style: 'tableExample'
							},
							{ 
								text: res.results[i]['NCMS_NCM'],
								style: 'tableExample'
							},
							{
								text: res.results[i]['PRODUTOS_UNIDADE'],
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['SALDOS_PRECO']),
                                alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['SALDOS_DISPONIVEL'],
                                alignment: 'right',                                
								style: 'tableExample'
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
