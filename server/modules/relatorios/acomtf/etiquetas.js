'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const codes = require('rescode');
codes.loadModules(['code128'], {"includetext" : false});

const getProdutoById = async function(id, params){
	try {
		const ids = id.toString().split(',');

		let sqlWhere = ` where `;

		sqlWhere += ids.map(id => ` PRODUTOS_ID = '${id}' `).join(' or ');
		
		const sqlSearch = `select 
			PRODUTOS_ID,
			PRODUTOS_NOME,
			PRODUTOS_APLICACAO,
			SALDOS_PRECO
		from PRODUTOS
		left outer join SALDOS on SALDOS_ID_EMPRESAS = ${params.empresa} and 
								  SALDOS_ID_PRODUTOS = PRODUTOS_ID
		${sqlWhere}`;

		const results = await samosFB.executeSQL(sqlSearch, params);

		return { results: results.length, total };
	} catch(error) {
		const msg = 'Falha ao buscar produtos por id';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [30, 30, 30, 30],
			content: [
				{
					style: 'tableReport',
					table: {   // 6 Colunas 
						      //  1    2    3   4    5   6    7   8    9  10   11
						widths: [105,  5, 105,  5, 105,  5, 105,  5, 105,  5, 105],
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
			getProdutoById(params.produtos, params)
				.then(async res => {
					let rows = docDefinition.content[0].table.body;

					for(let i in res.results){
						let pathLogo;

						try {
							pathLogo = utils.client.getImagePath(`logos/headers/${params.cnpj}.png`, params);
						} catch(error) {
							pathLogo = `${appRoot}/resources/images/headers/default.png`;
						}

						rows.push([
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
							},
							{
								text: '',
								border: [true, false, true, false]
							},
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
							},
							{
								text: '',
								border: [true, false, true, false]
							},
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
							},
							{
								text: '',
								border: [true, false, true, false]
							},
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
							},
							{
								text: '',
								border: [true, false, true, false]
							},
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
							},
							{
								text: '',
								border: [true, false, true, false]
							},
							{
								image: pathLogo,
								width: 80,
								alignment: 'center',
								border: [true, true, true, false]
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
