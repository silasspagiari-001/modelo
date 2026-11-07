'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getVendaUsuario = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, clientname, tipo, documento, vendedor, inicio, final} = params;
		const db = await samosFB.conectarBanco(params.client);

		let sqlEmpresa = '';
		let sqlDocumento = '';
		let sqlUsuario = '';
		let sqlSearch = '';

		if(empresa > 0) {
			sqlEmpresa = ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(documento > 0) {
			sqlDocumento = ` and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '000${documento}' `;
		}

		if(vendedor > 0) {
			sqlUsuario = ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
		} 

		if(clientname == 'prudenmoveis') {
			sqlSearch = `execute block returns (
				USUARIOS_ID_EMPRESAS integer,
				EMPRESAS_FANTASIA varchar(50),
				USUARIOS_ID integer,
				USUARIOS_NOME varchar(50),
				MOVIMENTOS_QTDEVENDAS integer,
				MOVIMENTOS_VALORPARTIDA numeric(14,2),
				MOVIMENTOS_TOTAL numeric(14, 2),      
				MOVIMENTOS_PRECOMINIMO numeric(14, 2),
				MOVIMENTOS_COMISSAO numeric(14, 2)    
			)
			as
			begin
				for
					select MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME from MOVIMENTOS
					join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
					join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
					where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
						  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
						  MOVIMENTOS_STATUS <> 'C' ${sqlEmpresa} ${sqlUsuario}
					group by MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME
					into :USUARIOS_ID_EMPRESAS,
						 :EMPRESAS_FANTASIA,
						 :USUARIOS_ID,
						 :USUARIOS_NOME
				do
					begin
						MOVIMENTOS_QTDEVENDAS = 0;
						MOVIMENTOS_VALORPARTIDA = 0;
						MOVIMENTOS_TOTAL = 0;
						MOVIMENTOS_PRECOMINIMO = 0;
						MOVIMENTOS_COMISSAO = 0;

						select count(*) from MOVIMENTOS
						where MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
							MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
							right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
							MOVIMENTOS_STATUS <> 'C'
						into
							:MOVIMENTOS_QTDEVENDAS;

						select sum(MOVIMENTOSITENS_IMPOSTO),
							   sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS),
							   sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_VALORPISST),
							   sum(round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2))
						from MOVIMENTOSITENS
						join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
						join SALDOS on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS     
						where MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
							  MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
							right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
							MOVIMENTOS_STATUS <> 'C'
						into
							:MOVIMENTOS_VALORPARTIDA,
							:MOVIMENTOS_TOTAL,
							:MOVIMENTOS_PRECOMINIMO,
							:MOVIMENTOS_COMISSAO;
						if (MOVIMENTOS_VALORPARTIDA > 0) then  suspend;
					end
			end;`    
		} else {  // Demais clientes, não existe partida.
			if(tipo == 0) {  // Sintético
				sqlSearch = `select MOVIMENTOS_ID_USUARIOS, 
									USUARIOS_NOME, 
									CIDADES_NOME, 
									CIDADES_ESTADO,
									USUARIOS_ID,
									USUARIOS_ID_EMPRESAS,
									EMPRESAS_FANTASIA, 
									sum(MOVIMENTOS_TOTAL - MOVIMENTOS_FRETE - MOVIMENTOS_DESPESAS) as MOVIMENTOS_VALORTOTAL from MOVIMENTOS
								join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
								join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
								join CIDADES  on CIDADES_ID  = USUARIOS_ID_CIDADES       
										where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
										((MOVIMENTOS_STATUS <> 'C') and 
										 (MOVIMENTOS_STATUS <> 'D') and
										 (MOVIMENTOS_STATUS <> 'R') and
										 (MOVIMENTOS_STATUS <> 'V')) ${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
								group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO, USUARIOS_ID, USUARIOS_ID_EMPRESAS, EMPRESAS_FANTASIA`
			} else { // Analítico
				sqlSearch = `select USUARIOS_ID,
									USUARIOS_ID_EMPRESAS,
									EMPRESAS_FANTASIA,
									MOVIMENTOS_ID_DOCUMENTOS, 
									MOVIMENTOS_NUMERO, 
									MOVIMENTOS_SERIE, 
									MOVIMENTOS_ID_USUARIOS, 
									USUARIOS_NOME, 
									MOVIMENTOS_ID_PESSOAS, 
									MOVIMENTOS_NOME,
									CIDADES_NOME, 
									CIDADES_ESTADO, 
									MOVIMENTOS_EMISSAO, 
									MOVIMENTOS_ENTRADASAIDA,
									MOVIMENTOSITENS_ID_PRODUTOS, 
									PRODUTOS_NOME, 
									MOVIMENTOSITENS_QUANTIDADE, 
									MOVIMENTOS_MARGEM,
									MOVIMENTOS_SEGURO,
									MOVIMENTOSITENS_MARGEM,
									MOVIMENTOSITENS_SEGURO,
									MOVIMENTOSITENS_CUSTO,
									MOVIMENTOSITENS_VALORCOFINSST,
									SALDOS_CUSTO,
									(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
							from MOVIMENTOSITENS
							left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
							left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
							left outer join SALDOS on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS
							left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
							left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
							left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
							left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
							where ((MOVIMENTOS_STATUS <> 'C') and 
								   (MOVIMENTOS_STATUS <> 'D') and
								   (MOVIMENTOS_STATUS <> 'R') and
								   (MOVIMENTOS_STATUS <> 'V')) and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
							${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
							ORDER BY MOVIMENTOS_ID_USUARIOS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
			}
		}

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
			getVendaUsuario(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

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
										text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPartida) * 100)),
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

						let mediaVendas = (res.results[i]['MOVIMENTOS_VALORPARTIDA'] / res.results[i]['MOVIMENTOS_QTDEVENDAS']);
                        let valorPmm = (((res.results[i]['MOVIMENTOS_VALORPARTIDA'] - res.results[i]['MOVIMENTOS_PRECOMINIMO']) / res.results[i]['MOVIMENTOS_VALORPARTIDA']) * 100);

                        rows.push([
                            {
                                text: ('000000' + res.results[i]['USUARIOS_ID']).slice(-6),
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
								text: res.results[i]['USUARIOS_NOME'],
								fontSize: res.results[i]['USUARIOS_NOME'].length > 35 ? 8 : 12,
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOS_QTDEVENDAS'],
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORPARTIDA']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(mediaVendas),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_PRECOMINIMO']),
                                alignment: 'right',
                                style: 'tableExample'
							},
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_COMISSAO']),
                                alignment: 'right',
                                style: 'tableExample'
							},							
                            {
                                text: utils.number.float2moeda(valorPmm),
                                alignment: 'right',
                                style: 'tableExample'
							}
                        ]);	

						totalQdeVendas   += res.results[i]['MOVIMENTOS_QTDEVENDAS'];
						totalPartida     += res.results[i]['MOVIMENTOS_VALORPARTIDA'];
						totalPrecoMinimo += res.results[i]['MOVIMENTOS_PRECOMINIMO'];
						totalComissao    += res.results[i]['MOVIMENTOS_COMISSAO'];

						geralQdeVendas   += res.results[i]['MOVIMENTOS_QTDEVENDAS'];
						geralPartida     += res.results[i]['MOVIMENTOS_VALORPARTIDA'];
						geralPrecoMinimo += res.results[i]['MOVIMENTOS_PRECOMINIMO'];
						geralComissao    += res.results[i]['MOVIMENTOS_COMISSAO'];

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
							text: utils.number.float2moeda((((totalPartida - totalPrecoMinimo) / totalPartida) * 100)),
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
							text: utils.number.float2moeda((((geralPartida - geralPrecoMinimo) / geralPartida) * 100)), // PMM
							alignment: 'right',
							bold: true,
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
