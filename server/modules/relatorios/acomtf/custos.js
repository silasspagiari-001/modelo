'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getCustos = async function(params){
	return new Promise(async (resolve, reject) => {
		const { conteudo, ordem, status, start, limit } = params;
		const db = await samosFB.conectarBanco(params.client);
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		let sqlWhere = `where CUSTOS_ID > 0  `;
			sqlWhere += status == 0 ? `and CUSTOS_STATUS = 'T' ` : status == 1 ? `and CUSTOS_STATUS = 'F' ` : '';
		let sqlOrder = '';

		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and CUSTOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
		} else {    
			if(ordem == 0) {
				sqlWhere += `and CUSTOS_NOME like '${conteudo}%' `; 
				sqlOrder = ' order by CUSTOS_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and CUSTOS_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by CUSTOS_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += conteudo > 0 ? `and CUSTOS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by CUSTOS_ID ';  
			} else if (ordem == 3) {
				sqlWhere += `and CUSTOS_MASCARA like '${conteudo}%' `;
				sqlOrder = ' order by CUSTOS_MASCARA ';
			} else if(ordem == 4){
				try {
					const id = await samosFB.buscaMultipla({
						db, conteudo,
						tabela: 'CUSTOS',
						chave: 'CUSTOS_ID',
						campos: [
							'CUSTOS_ID', 
							'CUSTOS_NOME',
							'CUSTOS_MASCARA'
						]
					});

					sqlWhere += `and CUSTOS_ID = '${id}' `;
					sqlOrder = ' order by CUSTOS_ID '; 
				} catch (e) {
					reject(e);
				}
			}
		}    

		const sqlCount  = `select count(*) from CUSTOS  ${sqlWhere}`;
		const sqlSearch = `select ${limits} * from CUSTOS  ${sqlWhere} ${sqlOrder}`;
		const total = await samosFB.count(db, sqlCount);
		
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total, resolve, reject});
			}
		});
	});
}

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
							text: 'Relatório de Centros de Custo',
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
					table: {   //COD MSK STA NOM TIP
						widths: [35, 40, 35, 310, 90],
						headerRows: 1,
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader'
								}, 
								{
									text: 'Máscara',
									style: 'tableHeader'									
								},
								{
									text: 'Status',
									style: 'tableHeader'
                                },
								{
									text: 'Nome',
									style: 'tableHeader'
								},                                
								{
									text: 'Tipo',
									style: 'tableHeader'
								},
							]
						]
					},
					layout: {
						fillColor: function (i) {
							return (i % 2 === 0) ? '#F0F0F0' : null;
						}
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
			getCustos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						rows.push([
							{   text: res.results[i]['CUSTOS_ID'], alignment: 'right'},
							{ 	text: res.results[i]['CUSTOS_MASCARA']},
							{	text: res.results[i]['CUSTOS_STATUS'] == 'T' ? 'Ativo' : 'Inativo'},
                            {   text: res.results[i]['CUSTOS_NOME']},
							{	text: res.results[i]['CUSTOS_TIPO'] == 'R' ? 'Receita' : 
							          res.results[i]['CUSTOS_TIPO'] == 'D' ? 'Despesa' :
									  res.results[i]['CUSTOS_TIPO'] == 'E' ? 'Receita Sintética' :
									  res.results[i]['CUSTOS_TIPO'] == 'S' ? 'Despesa Sintética' : ''
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
