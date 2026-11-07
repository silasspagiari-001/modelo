'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getLucratividade = async function(params){
	try {
		const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, usuario} = params;

		let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
		let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
		let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
		let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

		let sqlWhere = '';
		let sqlSearch = '';

		sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
		sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(usuario && usuario > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${usuario} `;
		}

		sqlSearch = `SELECT GRUPOS_ID, GRUPOS_NOME, PRODUTOS_ID, PRODUTOS_NOME, SALDOS_DISPONIVEL,
				sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_VENDIDO,
				sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_VALORCUSTO,
				sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_VALORVENDA,
				sum(MOVIMENTOSITENS_FRETE) as MOVIMENTOS_VALORFRETE,                                                        
				sum(MOVIMENTOSITENS_DESPESAS) as MOVIMENTOS_VALORDESPESAS
		FROM MOVIMENTOSITENS                                    
		left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
		left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
		left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
		left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
		where ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
		MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and
		MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
		${sqlWhere}
		GROUP BY GRUPOS_ID, GRUPOS_NOME, PRODUTOS_NOME, PRODUTOS_ID, PRODUTOS_FABRICA, SALDOS_DISPONIVEL`
		
		const results = await samosFB.executeSQL(sqlSearch, params);

		return {
			results, 
			total  : results.length
		};
	} catch(error) {
		const msg = 'Falha ao buscar lucratividade';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { //   PRO NOM MAR XXX QVD CUS VDA MRG SLD
						widths:   [25, 60, 50, 50, 50, 50, 50, 50, 50, 30],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(95),
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
			getLucratividade(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let valorCusto = 0;

					let grupoQtdVendido = 0;
					let grupoValorCusto = 0;
					let grupoValorVenda = 0;
					
					let totalQtdVendido = 0;
					let totalValorCusto = 0;
					let totalValorVenda = 0;
					let totalFrete      = 0;
					let totalSeguro     = 0;
					let totalDespesas   = 0;
					let margemMovimento = 0;
					let ultimoGrupo     = 0;

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
								width: 100,
								height: 22,	
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Relatório de Lucratividade por Produto',
								colSpan: 6,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]								
							},{}
						],
						[
							{							
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final + (params.usuario && params.usuario > 0 ? (' - Vendedor: ' + params.usuario) : ''),
								colSpan: 6,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Cód',
								style: 'tableHeader',
								alignment: 'center'									
                            },
							{
								text: 'Nome do Produto',
								style: 'tableHeader',
								colSpan: 3,
								alignment: 'center'									
                            },{},{},
							{
								text: 'Marca',
								style: 'tableHeader',
								alignment: 'center'									
							},                            
							{
								text: 'Qtde Vendida',
								style: 'tableHeader',
								alignment: 'center'									
                            },								
							{
								text: 'Valor Custo',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor Venda',
								style: 'tableHeader',
								alignment: 'center'
                            },		
							{
								text: 'Lucro',
								style: 'tableHeader',
								alignment: 'center'
							},                            		
							{
								text: 'Margem',
								style: 'tableHeader',
								alignment: 'center'
							}	
						]
					)

					for(let i in res.results){

						valorCusto = res.results[i]['MOVIMENTOS_VALORCUSTO'];
						margemMovimento = (((res.results[i]['MOVIMENTOS_VALORVENDA'] / valorCusto) - 1) * 100);

						if(ultimoGrupo != res.results[i]['GRUPOS_ID']) {
							if(grupoValorVenda > 0) {
								rows.push([
									{
										text: 'TOTAL GRUPO',
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										colSpan: 5,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},
									{
										text: grupoQtdVendido.toFixed(0),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(grupoValorCusto),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
										
									},{
										text: utils.number.float2moeda(grupoValorVenda),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(grupoValorVenda - grupoValorCusto),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(((grupoValorVenda / grupoValorCusto) - 1) * 100),
										alignment: 'right',
										fontSize: 7,
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									}
								]);
								grupoQtdVendido = 0;
								grupoValorCusto = 0;
								grupoValorVenda = 0;		
							}
							rows.push([
								{
									text: '* * * ' + ('00000' + res.results[i]['GRUPOS_ID']).slice(-5) + ' - ' + 
									    res.results[i]['GRUPOS_NOME'] + ' * * *',
									alignment: 'center',
									style: 'tableExample',
									colSpan: 10
								},{},{},{},{},{},{},{},{},{}
							]);	
							ultimoGrupo = res.results[i]['GRUPOS_ID'];
						}

						rows.push([
							{
								text: res.results[i]['PRODUTOS_ID'],
								alignment: 'right',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 3
							},{},{},
							{
								text: res.results[i]['PRODUTOS_FABRICA'],
								alignment: 'left',
								style: 'tableExample',
							},
							{
								text: res.results[i]['MOVIMENTOS_VENDIDO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCusto),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORVENDA']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORVENDA'] - valorCusto),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(margemMovimento),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

						grupoQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						grupoValorCusto += valorCusto;
						grupoValorVenda += res.results[i]['MOVIMENTOS_VALORVENDA'];

						totalQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						totalValorCusto += valorCusto;
						totalValorVenda += res.results[i]['MOVIMENTOS_VALORVENDA'];

						totalFrete      += res.results[i]['MOVIMENTOS_VALORFRETE'];
						totalSeguro     += res.results[i]['MOVIMENTOS_VALORSEGURO'];
						totalDespesas   += res.results[i]['MOVIMENTOS_VALORDESPESAS'];

					}

					rows.push([
						{
							text: 'TOTAL GRUPO',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},
						{
							text: grupoQtdVendido.toFixed(0),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(grupoValorCusto),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(grupoValorVenda),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(grupoValorVenda - grupoValorCusto),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(((grupoValorVenda / grupoValorCusto) - 1) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						}
					]);

					rows.push([
						{
							text: 'TOTAL GERAL',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},
						{
							text: totalQtdVendido.toFixed(0),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalValorCusto),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(totalValorVenda),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalValorVenda - totalValorCusto),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(((totalValorVenda / totalValorCusto) - 1) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						}
					]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};