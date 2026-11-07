'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB = require('../../../services/samosFirebird');

//Adaptado do Ext.util.Format.TextMask.maskPhone
const maskPhone = function(v){
	if (
		v &&
		v.toString().replace(/[^0-9]/g, '') &&
		v.toString().replace(/[^0-9]/g, '').length > 7 &&
		parseInt(v.toString().replace(/[^0-9]/g, '')) > 1
	) {
		v = v.toString().replace(/[^0-9]/g, '');
		v = /^0/.test(v) ? v.toString().replace(/^0/, '') : v;
		v = v.split('');
		if (v.length > 9) {
			v.splice(2, 0, ') ');
			v.splice(0, 0, '(');
		}
		v.splice(-4, 0, '-');
		v = v.join('');
		v = v.replace(') 0', ') ');
		v = v.replace(' 0', ' ');

	} else {
		v = '';
	}

	return v;
}

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
		} else if(params.movimentosnome) {
			sqlWhere += ` and MOVIMENTOS_NOME like '${params.movimentosnome}%' `; 
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

		//Filtro da situação
		if(params.situacao != 'T'){
			if( params.situacao == 'S' ){ sqlWhere += ` and MOVIMENTOS_SITUACAO = 1 ` }
			if( params.situacao == 'N' ){ sqlWhere += ` and MOVIMENTOS_SITUACAO = 0 ` }
		}

		if(params.status != 'T') {
			if(params.status == 'E') {
				sqlWhere += ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' and MOVIMENTOS_STATUS <> 'R' `; 
			} else if(params.status == 'C' || params.status == 'D' || params.status == 'R') {
				sqlWhere += ` and MOVIMENTOS_STATUS = '${params.status}' `; 
			}
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
				MOVIMENTOS_NOME,
				PESSOAS_CELULAR,
				CIDADES_NOME,
				CIDADES_ESTADO,
				MOVIMENTOS_CPFCNPJ,
				MOVIMENTOS_TOTAL,
				MOVIMENTOS_BASEICMS,
				MOVIMENTOS_VALORICMS,
				MOVIMENTOS_BASEST,
				MOVIMENTOS_VALORST,
				MOVIMENTOS_VALORIPI,
				MOVIMENTOS_FRETE,
				MOVIMENTOS_SEGURO,
				MOVIMENTOS_DESPESAS,
				MOVIMENTOS_DESCONTOS,
				MOVIMENTOS_PRODUTOS,
				MOVIMENTOS_NFE,
				MOVIMENTOS_PROTOCOLO,
				EMPRESAS_FANTASIA,
				EMPRESAS_NOME,
				DOCUMENTOS_NOME,
				PRAZOS_NOME
			from MOVIMENTOS 
				left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
				left join PESSOAS         on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
				left join CIDADES         on CIDADES_ID    = PESSOAS_ID_CIDADES
				join DOCUMENTOS           on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
				join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
				left join OPERACOES       on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
				left outer join PRAZOS    on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
			${sqlWhere} ${sqlOrder}`; 

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
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [10, 40, 40, 40],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {    
						widths:  [25, 20, 39, 145, 60, 90, 20, 50, 39],  // 9 Cols. 
						headerRows: 4,
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
					fontSize: 7,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 7,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;

			getMovimentos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let totalBaseIcms = 0;
					let totalValorIcms = 0;
					let totalBaseSt = 0;
					let totalValorSt = 0;
					let totalIpi = 0;
					let totalFrete = 0;
					let totalSeguro = 0;
					let totalDespesas = 0;
					let totalDescontos = 0;
					let totalProdutos = 0;
					let totalMovimentos = 0;
					let totalCanceladas = 0;

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
								colSpan: 3,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},
							{ 
								text:'Relatório de Controle de Casco',
								colSpan: 4,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
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
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 4,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'N°',
								style: 'tableHeader',
								alignment: 'center',								
								border: [true, true, true, true]
							},
							{
								text: 'Série',
								style: 'tableHeader',
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
								border: [true, true, true, true]
							},
							{
								text: 'Celular',
								style: 'tableHeader',
								border: [true, true, true, true]
							},
							{
								text: 'Cidade',
								style: 'tableHeader',
								border: [true, true, true, true]
							},
							{
								text: 'UF',
								style: 'tableHeader',
								border: [true, true, true, true]
							},
							{
								text: 'Valor',
								style: 'tableHeader',
								border: [true, true, true, true]
							},
							{
								text: 'Deve Casco',
								style: 'tableHeader',
								border: [true, true, true, true]
							}
						]
					)

					for(let i in res.results){
						rows.push([
							{
								text: ('000000' + String(res.results[i]['MOVIMENTOS_NUMERO'])).slice(-6),
								alignment: 'center',
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
								text: String(res.results[i]['MOVIMENTOS_NOME']).slice(0,35),
								alignment: 'left',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: maskPhone(res.results[i]['PESSOAS_CELULAR']),
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
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL'], true),
								alignment: 'right',
								style: 'tableExample',
								border:[true, true, true, true]
							},
							{
								text: res.results[i]['MOVIMENTOS_SITUACAO'] == '0' ? 'Não' : 'Sim',
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
