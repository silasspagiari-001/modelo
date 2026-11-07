'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [25, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},  // 8 Colunas
				{
					style: 'tableExample',
					table: { //   COD  VEN QDV VLP MDV PRM COM  PMM
						widths:   [50, 250, 70, 80, 70, 80, 70, 40],
						headerRows: 3,
						body: []
					},
					layout: {
						fillColor: function (i) {
							return (i % 2 === 0) ? '#F0F0F0' : null;
						}
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
					fontSize: 12,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendausuario().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

					const cents = utils.number.cents.bind(utils.number);					

					let totalQdeVendas   = 0;
					let totalPartida     = 0;
					let totalPrecoMinimo = 0;
                    let totalComissao    = 0;
					
					let geralQdeVendas   = 0;
					let geralPartida     = 0;
					let geralPrecoMinimo = 0;
                    let geralComissao    = 0;

					let ultimaEmpresa    = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

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
								text: 'Relatório de Vendas por Vendedor',
								colSpan: 4,
								fontSize: 12,
								alignment: 'left',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},
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
								colSpan: 4,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],	
					);
					
                    rows.push( 
                        [
                            {
                                text: 'Código',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Vendedor',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Qde Vendas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Vlr Partida',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },					
                            {
                                text: 'Méd Vendas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Preço Mínimo',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Comissão',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },					
                            {
                                text: 'PMM %',
                                style: 'tableHeader',
                                alignment: 'center'									
                            }
                        ]
                    )

					for(let i in res.results){

						if(res.results[i]['USUARIOS_ID_EMPRESAS'] != ultimaEmpresa) {
							if(totalQdeVendas > 0) {
								rows.push([
									{ 
										text: 'TOTAL EMPRESA', 
										alignment: 'right',
										bold: true,
										colSpan: 2 
									},
									{},
									{
										text: totalQdeVendas,
										alignment: 'right',
										bold: true,
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPartida),										
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPartida/totalQdeVendas),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalPrecoMinimo),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totalComissao),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPrecoMinimo) * 100)),
										alignment: 'right',
										bold: true,										
										style: 'tableExample'
									}
								]);	
		
							};

							rows.push([
								{ 
									text: `EMPRESA: ${res.results[i]['USUARIOS_ID_EMPRESAS']} - ${res.results[i]['EMPRESAS_FANTASIA']} `, 
									alignment: 'center',
									colSpan: 8,
									fontSize: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{}
							]);	

							ultimaEmpresa    = res.results[i]['USUARIOS_ID_EMPRESAS'];
							totalQdeVendas   = 0;
							totalPartida     = 0;
							totalPrecoMinimo = 0;
							totalComissao    = 0;
						}

						let idVendedor = res.results[i]['USUARIOS_ID'];
						let nomeVendedor = res.results[i]['USUARIOS_NOME'];
						let devUsuario = await obterDevolucoes(idVendedor, params.empresa, params.inicio, params.final, db)
						let qtdeVendas = res.results[i]['MOVIMENTOS_QTDEVENDAS'];
                        let valorPartida = res.results[i]['MOVIMENTOS_VALORPARTIDA'];
                        let precoMinimo = res.results[i]['MOVIMENTOS_PRECOMINIMO'];
						let valorComissao = res.results[i]['MOVIMENTOS_COMISSAO'];

						if(devUsuario.length > 0) {
							for(let j in devUsuario) {  // Devoluções por usuário (vendedor)
								if(cents(devUsuario[j]['DEVOLUCOES_QUANTIDADE']) > 0) { // Se houver alguma devolução do usuário abate
									qtdeVendas    -= devUsuario[j]['DEVOLUCOES_QUANTIDADE'];
									valorPartida  -= devUsuario[j]['DEVOLUCOES_PARTIDA'];
									precoMinimo   -= devUsuario[j]['DEVOLUCOES_PRECOMINIMO'];
									totalComissao -= devUsuario[j]['DEVOLUCOES_COMISSAO'];
								}
							}
						}
												
						let mediaVendas = (valorPartida / qtdeVendas);
//                      let valorPmm = (((valorPartida - precoMinimo) / valorPartida) * 100);
                        let valorPmm = (((valorPartida - precoMinimo) / precoMinimo) * 100);

                        rows.push([
                            {
                                text: ('000000' + idVendedor).slice(-6),
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
								text: nomeVendedor,
								fontSize: nomeVendedor.length > 35 ? 8 : 12,
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: qtdeVendas,
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(valorPartida),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(mediaVendas),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(precoMinimo),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(valorComissao),
                                alignment: 'right',
                                style: 'tableExample'
							},							
                            {
                                text: utils.number.float2moeda(valorPmm),
                                alignment: 'right',
                                style: 'tableExample'
							}
                        ]);	

						totalQdeVendas   += qtdeVendas;
						totalPartida     += valorPartida;
						totalPrecoMinimo += precoMinimo;
						totalComissao    += valorComissao;

						geralQdeVendas   += qtdeVendas;
						geralPartida     += valorPartida;
						geralPrecoMinimo += precoMinimo;
						geralComissao    += valorComissao;

					}

					rows.push([
						{ 
							text: 'TOTAL EMPRESA:', 
							alignment: 'right',
							bold: true,
							colSpan: 2 
						},
						{},
						{
							text: totalQdeVendas,
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPartida),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPartida/totalQdeVendas),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalPrecoMinimo),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalComissao),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPrecoMinimo) * 100)),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						}
					]);	

					rows.push([
						{ 
							text: 'TOTAL GERAL:', 
							alignment: 'right',
							bold: true,
							colSpan: 2 
						},
						{},
						{
							text: geralQdeVendas,
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPartida),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPartida / geralQdeVendas),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralPrecoMinimo),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(geralComissao),
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda((((geralPartida - geralPrecoMinimo) / geralPrecoMinimo) * 100)), // PMM
							alignment: 'right',
							bold: true,
							style: 'tableExample'
						}
					]);	

					pdfStream(docDefinition, resolve, reject);
					db.detach();
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const obterDevolucoes = function(vendedor, empresa, inicio, final, db) {
    return new Promise(async (resolve, reject) => {
		
		let sqlEmpresa = empresa ? `MOVIMENTOS_ID_EMPRESAS = ${empresa} and `: '';
		let sql = `select   count(MOVIMENTOS_ID) as DEVOLUCOES_QUANTIDADE,
		                    sum(MOVIMENTOSITENS_IMPOSTO) as DEVOLUCOES_PARTIDA,
			        		sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as DEVOLUCOES_LIQUIDO,
							sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_VALORPISST) as DEVOLUCOES_PRECOMINIMO,
							sum(round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2)) as DEVOLUCOES_COMISSAO
					from MOVIMENTOSITENS
					join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
					join SALDOS on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
					where MOVIMENTOS_ID_USUARIOS = ${vendedor} and
					    ${sqlEmpresa}
						MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
						right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012' and
						MOVIMENTOS_STATUS <> 'C'`

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