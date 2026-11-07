'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

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
					table: { // GRP  [NOM     ] XXX XXX QVD CUS VDA MRG
						widths:   [35, 30, 50, 50, 50, 50, 50, 50, 50, 50],
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
			api.vendasintetica().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

					const db = await samosFB.conectarBanco(params.client); 					

					let resumoUsuario = await obterResumoUsuario(params, db);
					let resumoFornecedor = await obterResumoFornecedor(params, db);					

					db.detach();

					let valorCusto = 0;
					let totalQtdVendido = 0;
					let totalValorCusto = 0;
					let totalValorVenda = 0;
					let totalFrete      = 0;
					let totalSeguro     = 0;
					let totalDespesas   = 0;
					let margemMovimento = 0;

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
								text: 'Relatório de Venda Sintética - ' + (params.documento == 0 ? 'Pedidos' : 'Notas'),
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
								text: 'Período: ' + params.inicio + ' a ' + params.final,
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
								text: 'Código',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Nome do Grupo',
								style: 'tableHeader',
								colSpan: 5,
								alignment: 'center'									
							},{},{},{},{},
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
								text: 'Margem',
								style: 'tableHeader',
								alignment: 'center'
							}	
						]						
					)

					for(let i in res.results){

						if (res.results[i]['MOVIMENTOS_VALORVENDA'] == 0) {
							continue; 
				        }						

						valorCusto = res.results[i]['MOVIMENTOS_VALORCUSTO'];
						margemMovimento = (((res.results[i]['MOVIMENTOS_VALORVENDA'] / valorCusto) - 1) * 100);

						rows.push([
							{
								text: res.results[i]['GRUPOS_ID'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: res.results[i]['GRUPOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5
							},{},{},{},{},
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
								text: utils.number.float2moeda(margemMovimento),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

						totalQtdVendido += res.results[i]['MOVIMENTOS_VENDIDO'];
						totalValorCusto += valorCusto;
						totalValorVenda += res.results[i]['MOVIMENTOS_VALORVENDA'];

						totalFrete      += res.results[i]['MOVIMENTOS_VALORFRETE'];
						totalSeguro     += res.results[i]['MOVIMENTOS_VALORSEGURO'];
						totalDespesas   += res.results[i]['MOVIMENTOS_VALORDESPESAS'];

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 6,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalQtdVendido),
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
							text: utils.number.float2moeda(((totalValorVenda / totalValorCusto) - 1) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);

// Frete/seguro/despesas...

					rows.push([
						{
							text: 'Frete:',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalFrete),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Seguro:',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalSeguro),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					rows.push([
						{
							text: 'Despesas:',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDespesas),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample',
							colSpan: 8
						},{},{},{},{},{},{},{}
					]);

					// Resumo por vendedor

					rows.push([
						{
							text: 'Código',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Nome do Vendedor',
							style: 'tableHeader',
							colSpan: 5,
							alignment: 'center'									
						},{},{},{},{},
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
							text: 'Margem',
							style: 'tableHeader',
							alignment: 'center'
						}	
					]);

					for(let i in resumoUsuario){

						valorCusto = resumoUsuario[i]['MOVIMENTOS_CUSTO'];
						margemMovimento = (((resumoUsuario[i]['MOVIMENTOS_TOTAL'] / valorCusto) - 1) * 100);

						rows.push([
							{
								text: resumoUsuario[i]['MOVIMENTOS_ID_USUARIOS'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: resumoUsuario[i]['USUARIOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5
							},{},{},{},{},
							{
								text: resumoUsuario[i]['MOVIMENTOS_QUANTIDADE'].toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCusto),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(resumoUsuario[i]['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(margemMovimento),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 6,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalQtdVendido),
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
							text: utils.number.float2moeda(((totalValorVenda / totalValorCusto) - 1) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);

					// Fim do resumo por vendedor.

					// Agora, resumo por fornecedor...

					rows.push([
						{
							text: 'Código',
							style: 'tableHeader',
							alignment: 'center'									
						},
						{
							text: 'Nome do Fornecedor',
							style: 'tableHeader',
							colSpan: 5,
							alignment: 'center'									
						},{},{},{},{},
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
							text: 'Margem',
							style: 'tableHeader',
							alignment: 'center'
						}	
					]);

					for(let i in resumoFornecedor){

						valorCusto = resumoFornecedor[i]['MOVIMENTOS_CUSTO'];
						margemMovimento = (((resumoFornecedor[i]['MOVIMENTOS_TOTAL'] / valorCusto) - 1) * 100);

						rows.push([
							{
								text: resumoFornecedor[i]['PRODUTOS_ID_PESSOAS'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: resumoFornecedor[i]['PESSOAS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5
							},{},{},{},{},
							{
								text: resumoFornecedor[i]['MOVIMENTOS_QUANTIDADE'].toFixed(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorCusto),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(resumoFornecedor[i]['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(margemMovimento),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							colSpan: 6,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalQtdVendido),
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
							text: utils.number.float2moeda(((totalValorVenda / totalValorCusto) - 1) * 100),
							alignment: 'right',
							fontSize: 7,
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);

					// Fim do resumo por fornecedor.

					pdfStream(docDefinition, resolve, reject);
					db.detach();

				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const obterResumoUsuario = function(params, db) {

	const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, usuarioinicial, usuariofinal, pessoa, documento} = params;	

	let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
	let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
	let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
	let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
	let parUsuarioinicial = (usuarioinicial > 0 ? usuarioinicial : 1);
	let parUsuariofinal  = (usuariofinal > 0 ? usuariofinal : 999999);
	let idDocumento = parseInt(documento) + 2;	

	let sqlWhere = '';

	sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
	sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${parUsuarioinicial} and ${parUsuariofinal} `;
	sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    


    return new Promise(async (resolve, reject) => {
		
		let sql = `select MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 
		                  sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_QUANTIDADE,
						  sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_CUSTO,
					 	  sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_TOTAL
	               from MOVIMENTOSITENS
				   join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				   join USUARIOS   on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
				   where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa}
				     ${sqlWhere}
				     and ((MOVIMENTOS_STATUS <> 'C') and 
					      (MOVIMENTOS_STATUS <> 'D') and
					      (MOVIMENTOS_STATUS <> 'R') and
					      (MOVIMENTOS_STATUS <> 'V'))
					 and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})				   
					 and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
					 group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const obterResumoFornecedor = function(params, db) {

	const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, usuarioinicial, usuariofinal, pessoa, documento} = params;	

	let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
	let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
	let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
	let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
	let parUsuarioinicial = (usuarioinicial > 0 ? usuarioinicial : 1);
	let parUsuariofinal  = (usuariofinal > 0 ? usuariofinal : 999999);
	let idDocumento = parseInt(documento) + 2;	

	let sqlWhere = '';

	sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
	sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${parUsuarioinicial} and ${parUsuariofinal} `;
	sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    


    return new Promise(async (resolve, reject) => {
		
		let sql = `select PRODUTOS_ID_PESSOAS, PESSOAS_NOME, 
		                  sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_QUANTIDADE,
						  sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_CUSTO,
					 	  sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_DESPESAS - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_TOTAL
	               from MOVIMENTOSITENS
				   join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				   join PESSOAS    on PESSOAS_ID = PRODUTOS_ID_PESSOAS
				   where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa}
				     ${sqlWhere}
				     and ((MOVIMENTOS_STATUS <> 'C') and 
					      (MOVIMENTOS_STATUS <> 'D') and
					      (MOVIMENTOS_STATUS <> 'R') and
					      (MOVIMENTOS_STATUS <> 'V'))
					 and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento})				   
					 and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
					 group by PRODUTOS_ID_PESSOAS, PESSOAS_NOME`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};
