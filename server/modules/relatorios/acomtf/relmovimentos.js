'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getRelMovimentos = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, documento, nomedocumento, numero, pessoa, movimentosnome, inicio, final, ordem, status, situacao, start, limit } = params;
		const db = await samosFB.conectarBanco(params.client);
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		let sqlOrder = '';
		let sqlEmpresa       = empresa       ? `and MOVIMENTOS_ID_EMPRESAS   = '${empresa}'       ` : '';
		let sqlDocumento     = documento     ? `and MOVIMENTOS_ID_DOCUMENTOS = '${documento}'     ` : '';
		let sqlNomeDocumento = nomedocumento ? `and DOCUMENTOS_NOME          = '${nomedocumento}' ` : '';
		let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlNomeDocumento} `;

		if(pessoa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
		} else if(movimentosnome) {
			sqlWhere += ` and MOVIMENTOS_NOME like '${movimentosnome}%' `; 
		}
		
		if (inicio && final && inicio.length > 0 && final.length > 0) {
			if (ordem == 3) { // Entrada/Saida
				sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
			} else {
				sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
			}
		}

		if(ordem == 0) {
			sqlOrder = ` order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
		} else if (ordem == 1) {
			sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
		} else if (ordem == 2) {
			sqlOrder = ` order by MOVIMENTOS_NUMERO `;
		} else if (ordem == 3) {
			sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
		}  

		if(parseInt(situacao) >= 0) {
			sqlWhere += ` and MOVIMENTOS_SITUACAO = '${situacao}' `;
		}

		if(status != 'T') {
			if(status == 'E') {
				sqlWhere += ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' and MOVIMENTOS_STATUS <> 'R' `; 
			} else if(status == 'C' || status == 'D' || status == 'R') {
				sqlWhere += ` and MOVIMENTOS_STATUS = '${status}' `; 
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
			pageMargins: [40, 40, 40, 40],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Num Ser CFO Dte S/E  PES 
						       //STA  BIC VIC BSU VSU VIP FRE S/D DSC VLP VLN
						widths:  [39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39],  // 11 Cols. Duas Linhas
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
			getRelMovimentos(params)
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
								text: res.results[0] ? 'Relatório de ' + res.results[0]['DOCUMENTOS_NOME'] : 'Relatório',
								colSpan: 5,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 3,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]								
							},{},{}
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
								colSpan: 5,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 3,
								alignment: 'right',
								border: [false, false, false, false]
							},{},{}
						],												
						[
							{
								text: 'N°',
								style: 'tableHeader',
								alignment: 'center',								
								border: [true, true, true, false]
							},
							{
								text: 'Série',
								style: 'tableHeader',
								border: [true, true, true, false]								
							},
							{
								text: 'CFOP',
								style: 'tableHeader',
								border: [true, true, true, false]								
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'	,
								border: [true, true, true, false]								
							},
							{
								text: 'Data Sai/Ent',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, true, true, false]									
							},								
							{
								text: 'Pessoa',
								style: 'tableHeader',
								colSpan: 6,
								border: [true, true, true, false]
							},{},{},{},{},{}
						],
						[								
							{
								text: 'Status',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, true, true]
							},				
							{
								text: 'Base Icms',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, true, true]
							},																				
							{
								text: '$ Icms',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, true, true]
							},																												
							{
								text: 'BC Icms ST',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, true, true]								
							},
							{
								text: '$ Icms ST',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, true, true]								
							},
							{
								text: '$ Ipi',
								style: 'tableHeader',
								alignment: 'center',
								border: [true, false, false, true]									
							},
							{
								text: 'Frete',
								style: 'tableHeader',
								alignment: 'center',
								border: [false, false, false, true]									
							},
							{
								text: 'Seg/Des',
								style: 'tableHeader',
								alignment: 'center',
								border: [false, false, false, true]									
							},
							{
								text: 'Desconto',
								style: 'tableHeader',
								alignment: 'center',
								border: [false, false, false, true]									
							},								
							{
								text: '$ Produtos',
								style: 'tableHeader',
								alignment: 'center',
								border: [false, false, false, true]									
							},
							{
								text: '$ Total',
								style: 'tableHeader',
								alignment: 'center',
								border: [false, false, true, true]									
							}
						]
					)

					for(let i in res.results){

						if(params.iddocumento ==  3){ // Se for Nota Eletrônica
							if(params.operacao == 1) {     // Vendas
                               if(res.results[i]['OPERACOES_ACAO'] != 'VN') {
								   continue;
							   }
							} else if(params.operacao == 2) {  // Transferências
								if(res.results[i]['OPERACOES_ACAO'].slice(0, 1) != 'T') {
								     continue;
								}
							} else if(params.operacao == 3){  // Devoluções
								if(res.results[i]['OPERACOES_ACAO'].slice(0, 1) != 'D') {
									continue;
								} 
							}
						}

						rows.push([
							{
								text: res.results[i]['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
								border:[true, , false, false]
                            },							
							{
								text: res.results[i]['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, false]
							},
							{
								text: res.results[i]['MOVIMENTOS_ID_OPERACOES'].toString(). slice(0, 4),
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, false]
                            },							
							{
								text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, false]
							},
							{
								text: moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
								border:[true, true, false, false]
                            },							
							{
								text: res.results[i]['MOVIMENTOS_NOME'],
								colSpan: 6,
								alignment: 'left',
								style: 'tableExample',
								border:[true, true, true, false]
							},{},{},{},{},{}
						],
						[	
							{
								text: (res.results[i]['MOVIMENTOS_STATUS'] === 'C' ? 'Cancelado' :
							           res.results[i]['MOVIMENTOS_STATUS'] === 'D' ? 'Devolvida' :
									   res.results[i]['MOVIMENTOS_STATUS'] === 'R' ? 'Recusada'  : ''),
								alignment: 'left',
								style: 'tableExample',
								color: 'red',
								border:[true, false, true, true]
							},							
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEICMS']),
								alignment: 'right',
								style: 'tableExample',
								border:[true, false, true, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORICMS']),
								alignment: 'right',
								style: 'tableExample',
								border:[true, false, true, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_BASEST']),
								alignment: 'right',
								style: 'tableExample',
								border:[true, false, true, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORST']),
								alignment: 'right',
								style: 'tableExample',
								border:[true, false, true, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORIPI']),
								alignment: 'right',
								style: 'tableExample',
								border:[true, false, false, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_FRETE']),
								alignment: 'right',
								style: 'tableExample',
								border:[false, false, false, true]
							},
                            {
                                text: utils.number.float2moeda((res.results[i]['MOVIMENTOS_SEGURO'] + res.results[i]['MOVIMENTOS_DESPESAS'])),
								alignment: 'right',
								style: 'tableExample',
								border:[false, false, false, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_DESCONTOS']),
								alignment: 'right',
								style: 'tableExample',
								border:[false, false, false, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_PRODUTOS']),
								alignment: 'right',
								style: 'tableExample',
								border:[false, false, false, true]
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: 'tableExample',
								border:[false, false, true, true]
							}							
						]);

						if(res.results[i]['MOVIMENTOS_STATUS'] === 'C') {
							totalCanceladas += (res.results[i]['MOVIMENTOS_TOTAL'] * 100);
						} else {
							totalBaseIcms += (res.results[i]['MOVIMENTOS_BASEICMS'] * 100);
							totalValorIcms += (res.results[i]['MOVIMENTOS_VALORICMS'] * 100);
							totalBaseSt += (res.results[i]['MOVIMENTOS_BASEST'] * 100);
							totalValorSt += (res.results[i]['MOVIMENTOS_VALORST'] * 100);
							totalIpi += (res.results[i]['MOVIMENTOS_VALORIPI'] * 100);
							totalFrete += (res.results[i]['MOVIMENTOS_FRETE'] * 100);
							totalSeguro += (res.results[i]['MOVIMENTOS_SEGURO'] * 100);
							totalDespesas += (res.results[i]['MOVIMENTOS_DESPESAS'] * 100);
							totalDescontos += (res.results[i]['MOVIMENTOS_DESCONTOS'] * 100);
							totalProdutos += (res.results[i]['MOVIMENTOS_PRODUTOS'] * 100);
							totalMovimentos += (res.results[i]['MOVIMENTOS_TOTAL'] * 100);	
						}

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalBaseIcms / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalValorIcms / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},
						{
							text: utils.number.float2moeda(totalBaseSt / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalValorSt / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},
						{
							text: utils.number.float2moeda(totalIpi / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalFrete / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda((totalSeguro + totalDespesas) / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDescontos / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalProdutos / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalMovimentos / 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						}							
					]);

// Canceladas

					rows.push([
						{
							text: 'CANCELADAS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 9,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalCanceladas / 100),
							alignment: 'left',
							fontSize: 7,
							bold: true,		
							colSpan: 2,					
							border: [false, false, false, false],
							style: 'tableExample'
						},{}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
