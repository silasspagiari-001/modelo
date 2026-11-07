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
			getEmpresas(params)
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