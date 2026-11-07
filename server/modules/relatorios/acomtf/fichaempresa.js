'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getEmpresas = async function(params){
	try {
		const { conteudo, ordem, status, start, limit } = params || {};
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		let sqlWhere = `where EMPRESAS_ID > 0  `;
			sqlWhere += status == 0 ? `and EMPRESAS_STATUS = 'T' ` : status == 1 ? `and EMPRESAS_STATUS = 'F' ` : '';
		let sqlOrder = '';

		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and EMPRESAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
		} else {            
			if(ordem == 0) {
				sqlWhere += `and EMPRESAS_NOME like '${conteudo.toUpperCase()}%' `; 
				sqlOrder = ' order by EMPRESAS_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and EMPRESAS_NOME like '%${conteudo.toUpperCase()}%' `;
				sqlOrder = ' order by EMPRESAS_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += `and EMPRESAS_FANTASIA like '%${conteudo.toUpperCase()}%' `;
				sqlOrder = ' order by EMPRESAS_FANTASIA ';  
			} else if (ordem == 3) {
				sqlWhere += `and EMPRESAS_CPFCNPJ like '%${conteudo}%' `;
				sqlOrder = ' order by EMPRESAS_CPFCNPJ ';  
			} else if (ordem == 4) {
				sqlWhere += conteudo > 0 ? `and EMPRESAS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by EMPRESAS_ID ';  
			} else if(ordem == 5){
				const id = await samosFB.buscaMultipla({
					conteudo,
					tabela: 'EMPRESAS',
					chave: 'EMPRESAS_ID',
					campos: [
						'EMPRESAS_ID',                                
						'EMPRESAS_NOME',
						'EMPRESAS_FANTASIA',
						'EMPRESAS_CPFCNPJ',
						'EMPRESAS_LOGIN',
						'EMPRESAS_EMAIL',
						'EMPRESAS_INSCRICAO'
					]
				}, params);

				sqlWhere += `and EMPRESAS_ID = '${id}' `;
				sqlOrder = ' order by EMPRESAS_ID '; 
			}
		}    

		const sqlCount  = `select count(*) from EMPRESAS ${sqlWhere} `;

		const sqlSearch = `select ${limits} 
			EMPRESAS.*,
			CIDADES_NOME,
			CIDADES_ESTADO,
			CIDADES_IBGE,
			PORTADORES_NOME 
		from EMPRESAS
		left outer join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
		left outer join PORTADORES on PORTADORES_ID = EMPRESAS_ID_PORTADORES
		${sqlWhere} ${sqlOrder}`;

		return { 
			results: await samosFB.executeSQL(sqlSearch, params), 
			total  : await samosFB.count(sqlCount, params)
		};
	} catch(error) {
		const msg = 'Falha ao buscar empresas';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			getEmpresas(params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						content: [
							{
								style: 'tableReport',
								table: {
									widths: ['*', '*', '*', '*', '*'],
									heights: 5,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					let rows = docDefinition.content[0].table.body;					
					let model = res.results[0];

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

                    rows.push(
                        [
							{
								image: pathLogo,
								fit: [100, 100],									
								width: 80,
								alignment: 'center'
							},							
                            {
                                text: [
									{
										text: '\n',
										fontSize: 7
									},
									{
										text: 'CADASTRO DE EMPRESAS',
									}
								],
                                colSpan: 4,
                                alignment: 'center',
                                style: {fontSize: 14}               
                            },{},{},{}
                        ],
                        [
                            {
                                text: 'Código: ' + model['EMPRESAS_ID']
                            },
                            {
                                text: (model['EMPRESAS_CPFCNPJ'].length == 11 ? "CPF: " : "CNPJ: ") + utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']),
                                alignment: 'left'
                            },
                            {
                                text: (model['EMPRESAS_CPFCNPJ'].length == 11 ? "RG: " : "I.E.: ") + utils.string.maskCnp(model['EMPRESAS_INSCRICAO']),
                                alignment: 'left'
                            },							
                            {
								text: 'Fone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE'])
                            },
                            {
								text: 'Celular: ' + utils.string.maskFone(model['EMPRESAS_CELULAR'])
                            }
						],
                        [
                            {
								text: 'Razão Social: ' + model['EMPRESAS_NOME'],
								colSpan: 3
                            },{},{},
                            {
								text: 'Fantasia: ' + model['EMPRESAS_FANTASIA'],
								colSpan: 2
                            },
                            {}
						],
                        [
                            {
								text: 'CEP: ' + model['EMPRESAS_CEP'].substr(0, 5) + '-' + model['EMPRESAS_CEP'].substr(5, 3),
                            },{
								text: 'Endereço: ' + model['EMPRESAS_ENDERECO'],
								colSpan: 3
							},{},{},
                            {
                                text: 'Número: ' + model['EMPRESAS_NUMERO']
                            }
						]);
                        rows.push([
                            {
								text: 'Bairro: ' + model['EMPRESAS_BAIRRO'],
								colSpan: 2
							},{},
							{
								text: 'Município: ' + model['CIDADES_NOME'],
								colSpan: 2
							},{},
                            {
                                text: 'UF: ' + model['CIDADES_ESTADO']
                            }
						],
						[
                            {
								text: 'Complemento: ' + model['EMPRESAS_PAGINA'],
								colSpan: 2
							},{},
							{
								text: 'E-mail: ' + model['EMPRESAS_EMAIL'],
								colSpan: 3
							},{},{}
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