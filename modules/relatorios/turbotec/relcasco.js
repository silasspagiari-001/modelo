'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB = require('../../../services/samosFirebird');

const getMovimentos = async function(params){
	return new Promise(async (resolve, reject) => {
		const db = await samosFB.conectarBanco(params.client);
		const limits = (params.start >= 0 && params.limit >= 0) ? `first ${params.limit} skip ${params.start} ` : '';
		let sqlOrder = '';
		let sqlEmpresa       = params.empresa       ? `and MOVIMENTOS_ID_EMPRESAS   = '${params.empresa}'       ` : '';
		let sqlDocumento     = params.documento     ? `and MOVIMENTOS_ID_DOCUMENTOS = '${params.documento}'     ` : '';
		let sqlNomeDocumento = params.nomedocumento ? `and DOCUMENTOS_NOME          = '${params.nomedocumento}' ` : '';
		let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlNomeDocumento} `;

		if(params.pessoa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${params.pessoa}' `; 
		}
		
		if (params.inicio && params.final && params.inicio.length > 0 && params.final.length > 0) {
			if (params.ordem == 3) { // Entrada/Saida
				sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}' `;
			} else {
				sqlWhere += ` and MOVIMENTOS_EMISSAO between '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}' `;
			}
		}

		if(params.ordem == 0) {
			sqlOrder = ` order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
		} else if (params.ordem == 1) {
			sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
		} else if (params.ordem == 2) {
			sqlOrder = ` order by MOVIMENTOS_NUMERO `;
		} else if (params.ordem == 3) {
			sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
		}  

		console.log(params); 

		//Filtro da situação (S)im deve (N)ao deve (T)odos MOVIMENTOSITENS_ESCRITURACAO
		/*
                                        ['1', 'SIM'],
                                        ['2', 'NÃO'],
                                        ['0', 'PSC']

		*/
		if(params.situacao != 'T'){
			if( params.situacao == 'S' ){ sqlWhere += ` and MOVIMENTOSITENS_ESCRITURACAO = '1' ` }
			if( params.situacao == 'N' ){ sqlWhere += ` and MOVIMENTOSITENS_ESCRITURACAO = '2' ` }
		}
							  
		const sqlSearch = `
			select ${limits} 
				MOVIMENTOS_ID, 
				MOVIMENTOS_ID_EMPRESAS, 
				MOVIMENTOS_ID_PESSOAS, 
				MOVIMENTOS_ID_DOCUMENTOS,
				MOVIMENTOS_NUMERO,
				MOVIMENTOS_SERIE,
				MOVIMENTOS_NUMEROORIGEM,
				MOVIMENTOS_SERIEORIGEM,
				MOVIMENTOS_ID_OPERACOES,
				OPERACOES_ACAO,
				MOVIMENTOS_STATUS,
				MOVIMENTOS_SITUACAO,
				MOVIMENTOS_EMISSAO,
				MOVIMENTOS_ENTRADASAIDA,
				USUARIOS_LOGIN,
				PESSOAS_NOME,
				PESSOAS_CELULAR,
				CIDADES_NOME,
				CIDADES_ESTADO,
				MOVIMENTOS_CPFCNPJ,
				MOVIMENTOS_TOTAL,
				EMPRESAS_FANTASIA,
				EMPRESAS_NOME,
				DOCUMENTOS_NOME,
				MOVIMENTOSITENS_ID_PRODUTOS, 				
				PRODUTOS_NOME,
				MOVIMENTOSITENS_QUANTIDADE,
				MOVIMENTOSITENS_PRECO, 
				MOVIMENTOSITENS_TOTAL				
			from MOVIMENTOSITENS
			    join PRODUTOS       on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
			    join MOVIMENTOS     on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				left join USUARIOS  on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
				left join PESSOAS   on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
				left join CIDADES   on CIDADES_ID    = PESSOAS_ID_CIDADES
				join DOCUMENTOS     on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
				join EMPRESAS       on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
				left join OPERACOES on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
			${sqlWhere} ${sqlOrder}`; 

console.log('sqlSearch: ', sqlSearch);

		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [10, 40, 40, 40],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CDP  [PRO  ] QTD DOC SER EMI  PES CEL  MUN  UF
						widths:  [30, 80, 115, 25, 30, 15, 45, 200, 70, 95, 15],  // 10 Cols. 
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
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
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;

			getMovimentos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

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
								width: 80,
								colSpan: 2,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text:'Relatório de Controle de Casco - ' + (params.situacao == 'S' ? '(Com Casco a Devolver)' 
								                                         :  params.situacao == 'N' ? '(Sem Casco a Devolver)' : 'Todos'),
								colSpan: 7,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								fontSize: 10,
								alignment: 'right',
								colSpan: 2,
								border: [false, false, false, false]							
							},{}
						],
						[
							{							
								text: res.results[0] ? res.results[0]['EMPRESAS_FANTASIA'] : '',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 7,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Produto',
								style: 'tableHeader',
								alignment: 'center',								
								border: [true, true, true, true]
							},
							{
								text: 'Nome do Produto',
								style: 'tableHeader',
								alignment: 'center',
								colSpan: 2,								
								border: [true, true, true, true]
							},{},
							{
								text: 'Qtde',
								style: 'tableHeader',
								alignment: 'center',								
								border: [true, true, true, true]
							},
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center',								
								border: [true, true, true, true]
							},
							{
								text: 'Sér',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, true, true, true]								
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, true]								
							},						
							{
								text: 'Pessoa',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, true]
							},
							{
								text: 'Celular',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, true]
							},
							{
								text: 'Cidade',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, true]
							},
							{
								text: 'UF',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, true]
							}
						]
					)

					for(let i in res.results){
						rows.push([
							{
								text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'right',
								style: 'tableExample',
								border: [true, true, true, true]
                            },							
							{
								text: res.results[i]['PRODUTOS_NOME'],
								colSpan: 2,
								style: 'tableExample',
								border: [true, true, true, true]
                            },{},							
							{
								text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'],
								alignment: 'right',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
								border: [true, true, true, true]
                            },							
							{
								text: res.results[i]['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, true]
							},						
							{
								text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, true]
							},						
							{
								text: String(res.results[i]['PESSOAS_NOME']).slice(0,35),
								alignment: 'left',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: utils.string.maskFone(res.results[i]['PESSOAS_CELULAR']),
								alignment: 'left',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: res.results[i]['CIDADES_NOME'],
								alignment: 'left',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: res.results[i]['CIDADES_ESTADO'],
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, true, true]
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
