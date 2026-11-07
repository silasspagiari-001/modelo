'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getUsuariosAtivos = async function(params){
	return new Promise(async (resolve, reject) => {

		const { empresa, conteudo, ordem, tipo, status} = params;
		const db = await samosFB.conectarBanco(params.client);            
		
		let sqlWhere = `where USUARIOS_ID > 0  `;
			sqlWhere += empresa ? `and USUARIOS_ID_EMPRESAS = ${empresa} ` : '';
		let sqlOrder = '';

		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and USUARIOS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
		} else {      
			if(tipo && tipo != 'z') {
				sqlWhere += `and USUARIOS_TIPO = '${tipo}' `; 
			}

			if(status) {
				if(status == 0) {//traz os Internos, Externos e Internos/Externos (todos os ativos)
					sqlWhere += ` and (USUARIOS_STATUS = 'I' or USUARIOS_STATUS = 'E' or USUARIOS_STATUS = 'T') `
				} else if (status == 1) {
					sqlWhere += ` and USUARIOS_STATUS = 'I'`
				} else if (status == 2) {
					sqlWhere += ` and USUARIOS_STATUS = 'E'`
				} else if (status == 3) {
					sqlWhere += ` and USUARIOS_STATUS = 'T'`
				} else if (status == 4) {
					sqlWhere += ` and USUARIOS_STATUS = 'F'`
				} else if (status == 5) {
					sqlWhere += ` and USUARIOS_STATUS = 'P'`
				}
			}

			if(ordem == 0) {
				sqlWhere += `and USUARIOS_NOME like '${conteudo}%' `; 
				sqlOrder = ' order by USUARIOS_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and USUARIOS_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by USUARIOS_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += `and upper(USUARIOS_LOGIN) like '%${conteudo.toString().toUpperCase()}%' `;
				sqlOrder = ' order by USUARIOS_LOGIN ';  
			} else if (ordem == 3) {
				sqlWhere += `and USUARIOS_CPFCNPJ like '%${conteudo}%' `;
				sqlOrder = ' order by USUARIOS_CPFCNPJ ';  
			} else if (ordem == 4) {
				sqlWhere += conteudo > 0 ? `and USUARIOS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by USUARIOS_ID ';  
			}
		}

		const sqlSearch = `execute block returns (USUARIOS_ID integer,
							USUARIOS_STATUS char(1),
							USUARIOS_NOME varchar(50),
							USUARIOS_LOGIN varchar(50),
							USUARIOS_CELULAR varchar(15),
							EMPRESAS_FANTASIA varchar(50),
							USUARIOS_FILIAL01 char(1),
							USUARIOS_FILIAL02 char(1),
							USUARIOS_FILIAL03 char(1),
							USUARIOS_FILIAL04 char(1),
							USUARIOS_FILIAL05 char(1),
							USUARIOS_FILIAL06 char(1),
							USUARIOS_FILIAL07 char(1),
							USUARIOS_FILIAL08 char(1),
							USUARIOS_FILIAL09 char(1),
							USUARIOS_FILIAL99 char(1)) as
							declare variable PERMISSOES_ID_EMPRESAS integer;
							begin
							for
							select USUARIOS_ID,
									USUARIOS_STATUS,
									USUARIOS_NOME,
									USUARIOS_LOGIN,
									USUARIOS_CELULAR,
									EMPRESAS_FANTASIA
							from USUARIOS
							join EMPRESAS on EMPRESAS_ID = USUARIOS_ID_EMPRESAS
							${sqlWhere} 
							${sqlOrder}
							into
								:USUARIOS_ID,
								:USUARIOS_STATUS,
								:USUARIOS_NOME,
								:USUARIOS_LOGIN,
								:USUARIOS_CELULAR,
								:EMPRESAS_FANTASIA
							do
							begin
							USUARIOS_FILIAL01 = 'F';
							USUARIOS_FILIAL02 = 'F';
							USUARIOS_FILIAL03 = 'F';
							USUARIOS_FILIAL04 = 'F';
							USUARIOS_FILIAL05 = 'F';
							USUARIOS_FILIAL06 = 'F';
							USUARIOS_FILIAL07 = 'F';
							USUARIOS_FILIAL08 = 'F';
							USUARIOS_FILIAL09 = 'F';
							USUARIOS_FILIAL99 = 'F';
							for
							select PERMISSOES_ID_EMPRESAS
							from PERMISSOES
							join EMPRESAS on EMPRESAS_ID = PERMISSOES_ID_EMPRESAS
							where PERMISSOES_ID_USUARIOS = :USUARIOS_ID
							into
								:PERMISSOES_ID_EMPRESAS
							do
								begin
								if (PERMISSOES_ID_EMPRESAS = 1)  then  USUARIOS_FILIAL01 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 2)  then  USUARIOS_FILIAL02 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 3)  then  USUARIOS_FILIAL03 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 4)  then  USUARIOS_FILIAL04 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 5)  then  USUARIOS_FILIAL05 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 6)  then  USUARIOS_FILIAL06 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 7)  then  USUARIOS_FILIAL07 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 8)  then  USUARIOS_FILIAL08 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 9)  then  USUARIOS_FILIAL09 = 'T';
								if (PERMISSOES_ID_EMPRESAS = 99) then  USUARIOS_FILIAL99 = 'T';
								end
							suspend;
							end
						end`;
		
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
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
			getUsuariosAtivos(params)
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
