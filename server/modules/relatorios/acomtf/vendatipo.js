'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getVendaTipo = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, inicio, final, maquinas} = params;
		const db = await samosFB.conectarBanco(params.client);

		let arrMaquinas = maquinas.split(',');
		let sqlWhere = '';
		let sqlSearch = '';
		let idMaquina01 = arrMaquinas[0] ? arrMaquinas[0] : '';
		let idMaquina02 = arrMaquinas[1] ? arrMaquinas[1] : '';
		let idMaquina03 = arrMaquinas[2] ? arrMaquinas[2] : '';

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(params.log.toUpperCase().match(/PRUDENMOVEIS/)) {
			sqlSearch = `select MOVIMENTOSCAIXA_ID_EMPRESAS as MOVIMENTOS_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO as MOVIMENTOS_EMISSAO,
							count(*) as MOVIMENTOS_QUANTIDADE,
							sum(MOVIMENTOSCAIXA_DINHEIRO) as MOVIMENTOS_DINHEIRO,
							sum(MOVIMENTOSCAIXA_TRANSFERENCIAS) as MOVIMENTOS_TRANSFERENCIA,
							sum(MOVIMENTOSCAIXA_CHEQUE) as MOVIMENTOS_CHEQUE,
							sum(MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO) as MOVIMENTOS_CARTOES,
							sum(MOVIMENTOSCAIXA_DUPLICATA) as MOVIMENTOS_DUPLICATA,
							sum(MOVIMENTOSCAIXA_OUTRO) as MOVIMENTOS_FINANCEIRA
					from MOVIMENTOSCAIXA
					join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
					where ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
								right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
					MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
					${sqlWhere}
					group by MOVIMENTOSCAIXA_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO
					order by MOVIMENTOSCAIXA_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO`                       
		} else {
			sqlSearch = `select MOVIMENTOSCAIXA_EMISSAO as MOVIMENTOS_EMISSAO, 
							sum(MOVIMENTOSCAIXA_DINHEIRO) as MOVIMENTOS_DINHEIRO,
							sum(MOVIMENTOSCAIXA_TRANSFERENCIAS) as MOVIMENTOS_TRANSFERENCIA,
							sum(MOVIMENTOSCAIXA_CHEQUE) as MOVIMENTOS_CHEQUE,
							coalesce((select sum(CHEQUES_VALOR) from CHEQUES where CHEQUES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CHEQUES_EMISSAO <> CHEQUES_VENCIMENTO), 0) as MOVIMENTOS_CHEQUEPRAZO,
							coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina01}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES01,
							coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina02}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES02,
							coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina03}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES03,
							sum(MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO) as MOVIMENTOS_CARTOES,
							sum(MOVIMENTOSCAIXA_DUPLICATA) as MOVIMENTOS_DUPLICATA, 
							sum(case when (((FINANCEIROS_ID_PESSOAS = 98) or (FINANCEIROS_ID_PESSOAS = 21949))
							and MOVIMENTOSCAIXA_OUTRO > 0) then MOVIMENTOSCAIXA_OUTRO ELSE 0 END) MOVIMENTOS_FINANCEIRA01,
							sum(case when (FINANCEIROS_ID_PESSOAS = 99
							and MOVIMENTOSCAIXA_OUTRO > 0) then MOVIMENTOSCAIXA_OUTRO ELSE 0 END) MOVIMENTOS_FINANCEIRA02,
							sum(MOVIMENTOSCAIXA_OUTRO) as MOVIMENTOS_FINANCEIRA
					from MOVIMENTOSCAIXA
					join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
					left outer join FINANCEIROS on FINANCEIROS_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS and
													FINANCEIROS_PARCELA = FINANCEIROS_PARCELAS
					where ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
							MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and
					MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
					${sqlWhere}
					GROUP BY MOVIMENTOSCAIXA_EMISSAO`
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
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},  // 12 Colunas
				{
					style: 'tableExample',
					table: { //  [DTE, DIN TRA CHE CHP C01 C02 C03 FST FBR DUP TOT]
						widths:   [60,  57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57],
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
					fontSize: 9,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 9,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			getVendaTipo(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let arrMaquinas = params.maquinas.split(',');
					let idMaquina01 = arrMaquinas[0] ? arrMaquinas[0] : '';
					let idMaquina02 = arrMaquinas[1] ? arrMaquinas[1] : '';
					let idMaquina03 = arrMaquinas[2] ? arrMaquinas[2] : '';

					let valorCheque = 0;
					let valorTotal = 0;					

					let totalDinheiro = 0;					
					let totalTransferencia = 0;
					let totalCheque = 0;
					let totalChequePrazo = 0;
					let totalCartao01 = 0;
					let totalCartao02 = 0;
					let totalCartao03 = 0;
					let totalFinanceira01 = 0;
					let totalFinanceira02 = 0;
					let totalDuplicata = 0;
					let totalGeral = 0;

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
								text: 'Relatório de Vendas por Tipo Recebimento',
								colSpan: 8,
								fontSize: 12,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
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
								colSpan: 8,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Data',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Dinheiro',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Transferência',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Cheque Vista',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Cheque Pré',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: `${idMaquina01}`,
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: `${idMaquina02}`,
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: `${idMaquina03}`,
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Bradesco',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Santander',
								style: 'tableHeader',
								alignment: 'center'
                            },
							{
								text: 'Carnê',
								style: 'tableHeader',
								alignment: 'center'
                            },
							{
								text: 'Total',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					)

					for(let i in res.results){

						valorTotal = (res.results[i]['MOVIMENTOS_DINHEIRO'] + res.results[i]['MOVIMENTOS_CHEQUE'] +
									  res.results[i]['MOVIMENTOS_CARTOES']  + res.results[i]['MOVIMENTOS_DUPLICATA'] +
									  res.results[i]['MOVIMENTOS_FINANCEIRA'] + res.results[i]['MOVIMENTOS_TRANSFERENCIA']);
						              
						valorCheque = (res.results[i]['MOVIMENTOS_CHEQUE'] - res.results[i]['MOVIMENTOS_CHEQUEPRAZO'])

						rows.push([
							{
								text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
							},							
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_DINHEIRO']),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_TRANSFERENCIA']),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(valorCheque),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CHEQUEPRAZO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CARTOES01']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CARTOES02']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CARTOES03']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_FINANCEIRA01']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_FINANCEIRA02']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_DUPLICATA']),
								alignment: 'right',
								style: 'tableExample'
                            },							
							{
								text: utils.number.float2moeda(valorTotal),
								alignment: 'right',
								style: 'tableExample'
                            }                            
						]);

						totalDinheiro      += res.results[i]['MOVIMENTOS_DINHEIRO'];
						totalTransferencia += res.results[i]['MOVIMENTOS_TRANSFERENCIA'];
						totalCheque        += valorCheque;
						totalChequePrazo   += res.results[i]['MOVIMENTOS_CHEQUEPRAZO'];
						totalCartao01      += res.results[i]['MOVIMENTOS_CARTOES01'];
						totalCartao02      += res.results[i]['MOVIMENTOS_CARTOES02'];
						totalCartao03      += res.results[i]['MOVIMENTOS_CARTOES03'];						
						totalFinanceira01  += res.results[i]['MOVIMENTOS_FINANCEIRA01'];
						totalFinanceira02  += res.results[i]['MOVIMENTOS_FINANCEIRA02'];
						totalDuplicata     += res.results[i]['MOVIMENTOS_DUPLICATA'];
						totalGeral         += valorTotal;

					}

					rows.push([
						{
							text: 'TOTAIS',
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalDinheiro),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalTransferencia),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalCheque),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
							
						},{
							text: utils.number.float2moeda(totalChequePrazo),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalCartao01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalCartao02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalCartao03),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalFinanceira01),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalFinanceira02),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
                            style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalDuplicata),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},{
							text: utils.number.float2moeda(totalGeral),
							alignment: 'right',
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