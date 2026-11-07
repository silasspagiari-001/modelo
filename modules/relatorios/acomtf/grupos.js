'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getGrupos = async function(params){
	try {
		const { conteudo, ordem, status, start, limit } = params;
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		let sqlWhere = `where GRUPOS_ID > 0  `;
			sqlWhere += status == 0 ? `and GRUPOS_STATUS = 'T' ` : status == 1 ? `and GRUPOS_STATUS = 'F' ` : '';

		let sqlSearch = '';
		let sqlOrder = '';

		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and GRUPOS_ID = ${conteudo.replace(/\./ig,'')} `;
		} else {            
			if(ordem == 0) {
				sqlWhere += `and GRUPOS_NOME like '${conteudo}%' `; 
				sqlOrder = ' order by GRUPOS_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and GRUPOS_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by GRUPOS_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += conteudo > 0 ? `and GRUPOS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by GRUPOS_ID ';  
			} else if(ordem == 3){
				const id = await samosFB.buscaMultipla({
					conteudo,
					tabela: 'GRUPOS',
					chave: 'GRUPOS_ID',
					campos: [
						'GRUPOS_ID', 
						'GRUPOS_NOME'
					]
				}, params);

				sqlWhere += `and GRUPOS_ID = '${id}' `;
				sqlOrder = ' order by GRUPOS_ID '; 
			}
		}    

		const sqlCount  = `select count(*) from GRUPOS  ${sqlWhere}`;

		sqlSearch = `select ${limits} * from GRUPOS  ${sqlWhere} ${sqlOrder}`;

		const total = await samosFB.count(sqlCount, params);
		const results = await samosFB.executeSQL(sqlSearch, params);

		if(params.client.toUpperCase().match(/PRUDENMOVEIS/) || params.userName == 'SUPERVISOR') {
			await Promise.all(results.map(async result => {
				const sqlPercentuais = `
						select first 1 skip 0 SALDOS_MARGEM, SALDOS_MARGEMMINIMA, SALDOS_COMISSAO from SALDOS
						join PRODUTOS on PRODUTOS_ID = SALDOS_ID_PRODUTOS
						where SALDOS_ID_EMPRESAS = 1 and 
						(PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') and
						PRODUTOS_ID_GRUPOS = ${result['GRUPOS_ID']}`;        

				const resPercentuais = await samosFB.executeSQL(sqlPercentuais, params) || [];

				if(resPercentuais.length > 0) {
					result['PERCENTUAL_MARGEM']       = resPercentuais[0]['SALDOS_MARGEM'];
					result['PERCENTUAL_MARGEMMINIMA'] = resPercentuais[0]['SALDOS_MARGEMMINIMA'];
					result['PERCENTUAL_COMISSAO']     = resPercentuais[0]['SALDOS_COMISSAO'];
					result['PERCENTUAL_DESCVEN']      = params.descven;
					result['PERCENTUAL_DESCSUP']      = params.descsup;
					result['PERCENTUAL_DESCDIR']      = params.descdir;
				} else {
					result['PERCENTUAL_MARGEM']       = 0;
					result['PERCENTUAL_MARGEMMINIMA'] = 0;
					result['PERCENTUAL_COMISSAO']     = 0;
					result['PERCENTUAL_DESCVEN']      = 0;
					result['PERCENTUAL_DESCSUP']      = 0;
					result['PERCENTUAL_DESCDIR']      = 0;
				}
			}))
		}
		
		return { results, total };
	} catch(error) {
		const msg = 'Falha ao buscar grupos';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
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
							text: 'Relatório de Grupos',
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
				{columns: [{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD ST  NOM]
						widths: [35, 35, 440],
						headerRows: 1,
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader'
								}, 
								{
									text: 'Status',
									style: 'tableHeader'
                                },
								{
									text: 'Nome',
									style: 'tableHeader'
								}
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
			getGrupos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){

						rows.push([
							{   text: res.results[i]['GRUPOS_ID'], alignment: 'right'},
							{	text: res.results[i]['GRUPOS_STATUS'] == 'T' ? 'Ativo' : 'Inativo'},
                            {   text: res.results[i]['GRUPOS_NOME']}
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
