'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB     = require('../../../services/samosFirebird');
const samosFB_inv = require('../../../services/samosFB');

const getInventario = async function(params){
	try {
		const { empresa, tipo, inicio} = params;

		let sqlSearch = '';

		if(tipo == 0 || tipo == 2 || tipo == 3) {// estoque físico ou físico sem icms (analítico e sintético)
			sqlSearch = `select 
				MOVIMENTOSITENS_ID_PRODUTOS,
				PRODUTOS_ID_GRUPOS, 
				GRUPOS_NOME,
				PRODUTOS_NOME,
				PRODUTOS_MARCA,
				PRODUTOS_APLICACAO,
				PRODUTOS_UNIDADE,
				NCMS_NCM,
				SALDOS_CUSTO,
				SALDOS_COMPRA,
				SALDOS_RESERVADO,
				SALDOS_PRECO,
				sum(case when OPERACOES_ESTOQUE = 'C' and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
						then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
				sum(case when OPERACOES_ESTOQUE = 'D' and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
						then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
			from MOVIMENTOSITENS                                    
			join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
			join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
			join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
			join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
			join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
			join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
			where MOVIMENTOS_ID_EMPRESAS = ${empresa}  and 
				((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${inicio.replace (/\//ig,'.')}') or
				(MOVIMENTOS_ID_OPERACOES < 500000 and MOVIMENTOS_ENTRADASAIDA <= '${inicio.replace (/\//ig,'.')}')) and
				PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and
				(OPERACOES_ESTOQUE = 'C' or OPERACOES_ESTOQUE = 'D') and
				PRODUTOS_INVENTARIO = 'T'
			group by MOVIMENTOSITENS_ID_PRODUTOS, 
				PRODUTOS_ID_GRUPOS, 
				GRUPOS_NOME,
				PRODUTOS_NOME,
				PRODUTOS_MARCA,
				PRODUTOS_APLICACAO, 
				PRODUTOS_UNIDADE,
				NCMS_NCM,
				SALDOS_CUSTO, 
				SALDOS_COMPRA,
				SALDOS_RESERVADO,
				SALDOS_PRECO
			order by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS`;

		} else {  // Estoque contábil
			sqlSearch = `select 
				MOVIMENTOSITENS_ID_PRODUTOS,
				PRODUTOS_ID_GRUPOS, 
				GRUPOS_NOME,
				PRODUTOS_NOME,
				PRODUTOS_MARCA,
				PRODUTOS_APLICACAO,
				PRODUTOS_UNIDADE,
				NCMS_NCM,
				SALDOS_CUSTO,
				SALDOS_COMPRA,
				SALDOS_PRECO,
				sum(case when MOVIMENTOSITENS_ID_OPERACOES < 500000 and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
						then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
				sum(case when MOVIMENTOSITENS_ID_OPERACOES >= 500000 and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
						then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
			from MOVIMENTOSITENS                                    
			join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
			join DOCUMENTOS on DOCUMENTOS_ID      = MOVIMENTOS_ID_DOCUMENTOS
			join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
			join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
			join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
			join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
			where MOVIMENTOS_ID_EMPRESAS = ${empresa}  and 
				((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${inicio.replace (/\//ig,'.')}') or
				(MOVIMENTOS_ID_OPERACOES < 500000 and MOVIMENTOS_ENTRADASAIDA <= '${inicio.replace (/\//ig,'.')}')) and
				PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and                                        
				PRODUTOS_INVENTARIO = 'T' and
				((right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003') or (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005'))
			group by MOVIMENTOSITENS_ID_PRODUTOS, 
				PRODUTOS_ID_GRUPOS, 
				GRUPOS_NOME,
				PRODUTOS_NOME, 
				PRODUTOS_MARCA,
				PRODUTOS_APLICACAO,
				PRODUTOS_UNIDADE,
				NCMS_NCM,
				SALDOS_CUSTO, 
				SALDOS_COMPRA,
				SALDOS_PRECO
			order by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS`;
		}
		
		const results = await samosFB_inv.executeSQL(sqlSearch, params);

		return {
			results, 
			total  : results.length
		};
	} catch(error) {
		const msg = 'Falha ao buscar inventário';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		const cents = utils.number.cents.bind(utils.number);		

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 40, 15, 35], //[40, 40, 40, 35],
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
							text: [
								{
									text: `Inventario de Produtos`,
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								}
							]
						},
						{
							stack: [
								moment.tz(params.timezone).format('DD/MM/YYYY'),
								moment.tz(params.timezone).format('HH:mm:ss'),
								'Pág: ' + ("00000" + (parseInt(page.toString()) + 1)).slice(-5)
							],
							width: 100,
							style: {
								fontSize: 8,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [15, 10]  // 40,10
				}
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 8,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD NCM NOM DTI UNI SLD PRC TOT
						widths: [40, 30, 220, 45, 15, 50, 40, 60],
						headerRows: 1,						
						body: [
							[
								{
									text: 'NCM',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'
                                },								
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Quantidade',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Unitário',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
                                }
							]
						]
					}
				}
			],
		};

        return new Promise(async (resolve, reject) => { 
			params.noChilds = true;			
			getInventario(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					const db = await samosFB.conectarBanco(params.client); 					
					let qtdeBase = 0;
					let precoCusto = 0;
					let precoCompra = 0;
					let precoVenda = 0;
					let percIcms = 0;
                    let precoBase = 0;
					let valorItem = 0;
					let qtdeEstoque = 0;
					let valorEstoque = 0;
					let qtdeGrupo = 0;
					let valorGrupo = 0
					let grupoAnt = 0;
					let valorIcms = 0;
					let totalIcms = 0;
					let descriIcms = '';

					for(let i in res.results){

						qtdeBase = res.results[i]['MOVIMENTOSITENS_ENTRADAS'] - res.results[i]['MOVIMENTOSITENS_SAIDAS'];
						precoCusto = cents(res.results[i]['SALDOS_CUSTO']);
						precoCompra = cents(res.results[i]['SALDOS_COMPRA']);
						precoVenda = cents(res.results[i]['SALDOS_PRECO']);
						percIcms = await obterIcmsCompras(params.empresa, res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'], params.inicio, db);

						if(params.tipo == 2 || params.tipo == 3 ) { // Sem ICMS
							precoBase = (params.preco == '0' ? // Custo
							              (precoCusto - ((precoCusto / 100) * percIcms)) :
										(params.preco == '1' ? // Compra
										  (precoCompra - ((precoCompra / 100) * percIcms)) :
										  (precoVenda - ((precoVenda / 100) * percIcms))));
						} else {
							precoBase = (params.preco == '0' ? precoCusto : (params.preco == '1' ? precoCompra : precoVenda));
						}

						if(params.tipo == 3) {  // Analítico sem ICMS
							valorIcms = ((params.preco == '0' ? ((precoCusto / 100) * percIcms) :  // Custo
							            (params.preco == '1' ? ((precoCompra / 100) * percIcms) : // Compra
															   ((precoVenda / 100) * percIcms))) * qtdeBase); // Venda
				
							descriIcms = valorIcms > 0 ? `(Icms: ${percIcms}% Valor R$: ${utils.number.float2moeda(valorIcms/100)})`: '';
							totalIcms += valorIcms;
						}

                        valorItem = (qtdeBase * precoBase);

						if(qtdeBase > 0) {
                            if(grupoAnt != res.results[i]['PRODUTOS_ID_GRUPOS']) {
								if(qtdeGrupo > 0) {
									rows.push([								
										{
											text: 'TOTAL GRUPO....',
											colSpan: 4,
											alignment: 'right',
											style: 'tableExample',
											fontSize: 10,										
											bold: true,
											border: [false, false, false, false]
										},{},{},{},
										{
											text: qtdeGrupo.toFixed(0),
											colSpan: 2,
											alignment: 'right',
											style: 'tableExample',
											fontSize: 10,										
											bold: true,
											border: [false, false, false, false]
										},{},
										{
											text: utils.number.float2moeda(valorGrupo / 100),
											colSpan: 2,
											alignment: 'right',
											style: 'tableExample',
											fontSize: 10,										
											bold: true,
											border: [false, false, false, false]
										},{}
									]);
								}
								rows.push([								
									{
										text: `****** Grupo: ${("00000" + res.results[i]['PRODUTOS_ID_GRUPOS']).slice(-5)} ${res.results[i]['GRUPOS_NOME']} ******`,
										colSpan: 8,
										alignment: 'center',
										style: 'tableExample',
										fontSize: 10,										
										bold: true,
										border: [false, false, false, false]
									},{},{},{},{},{},{},{}
								]);
								grupoAnt = res.results[i]['PRODUTOS_ID_GRUPOS'];
								qtdeGrupo = 0;
								valorGrupo = 0;
							}

							rows.push([								
								{
									text: res.results[i]['NCMS_NCM'],
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]
								},
								{
									text: ("000000" + res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS']).slice(-6),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]
								},							
								{
									text: res.results[i]['PRODUTOS_NOME'] + ' ' + descriIcms,
									alignment: 'left',
									style: 'tableExample',
									border: [false, false, false, false]
								},
								{
									text: params.inicio,
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]
								},
								{
									text: res.results[i]['PRODUTOS_UNIDADE'],
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: qtdeBase,
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: utils.number.float2moeda(precoBase/100),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: utils.number.float2moeda(valorItem/100),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]								
								}
							]);

							qtdeGrupo += qtdeBase;
							valorGrupo += valorItem;
							qtdeEstoque += qtdeBase;
							valorEstoque += valorItem;
						}
					}

					rows.push([								
						{
							text: 'TOTAL GRUPO....',
							colSpan: 4,
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{},{},{},
						{
							text: qtdeGrupo.toFixed(0),
							colSpan: 2,							
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{},
						{
							text: utils.number.float2moeda(valorGrupo/100),
							colSpan: 2,
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{}
					]);

					rows.push([								
						{
							text: 'TOTAL GERAL....',
							colSpan: 4,
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{},{},{},
						{
							text: qtdeEstoque.toFixed(0),
							colSpan: 2,							
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{},
						{
							text: utils.number.float2moeda(valorEstoque/100),
							colSpan: 2,
							alignment: 'right',
							style: 'tableExample',
							fontSize: 10,										
							bold: true,
							border: [false, false, false, false]
						},{}
					]);

					if(params.tipo == 3) {
						rows.push([								
							{
								text: 'TOTAL ICMS DESCONTADO....',
								colSpan: 4,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,										
								bold: true,
								border: [false, false, false, false]
							},{},{},{},
							{
								text: '',
								colSpan: 2,							
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,										
								bold: true,
								border: [false, false, false, false]
							},{},
							{
								text: utils.number.float2moeda(totalIcms/100),
								colSpan: 2,
								alignment: 'right',
								style: 'tableExample',
								fontSize: 10,										
								bold: true,
								border: [false, false, false, false]
							},{}
						]);	
					}

					pdfStream(docDefinition, resolve, reject);
					db.detach();
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const obterIcmsCompras = function(empresa, produto, inicio, db) {
    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOSITENS_ICMS as ICMS, MOVIMENTOS_ENTRADASAIDA as ENTRADA from MOVIMENTOSITENS
		           join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
  				   where MOVIMENTOS_ID_EMPRESAS = ${empresa} and
		  				 MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
		  				 right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0005' and
						  MOVIMENTOS_ENTRADASAIDA = (select max(MOVIMENTOS_ENTRADASAIDA) from MOVIMENTOSITENS
               										 join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
													 where   MOVIMENTOS_ID_EMPRESAS = ${empresa} and
											    	  MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
													  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0005')`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0]['ICMS'] : 0);
            }
        });
    });
};