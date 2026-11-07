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
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
				{
					style: 'tableExample',
					table: { //  CD  [NOME ]  UN MIN SLD VDA MDI MME CPA
						widths: [25, 55, 130, 20, 40, 40, 40, 40, 40, 40],
						headerRows: 3,
						body: []
					},
					layout: {
						fillColor: function (i) {
							return (i % 2 === 0) ? '#E3E3E3' : null;
						}
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(100),
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
			api.compras().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let grupoAnt;		
					let pessoaAnt;			

					const cents = utils.number.cents.bind(utils.number);					

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
								text: `Relatório para Compras - para ${params.meses} ${((params.meses && params.meses > 1) ? 'Meses' : 'Mês')}` ,
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
								text: `Vendas: ${params.inicio} a ${params.final} (${res.results[0]['PRODUTOS_PERIODO']} dias)`,
								colSpan: 6,
								fontSize: 8,
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
								text: 'Nome Produto',
								colSpan: 2,
								style: 'tableHeader',
								alignment: 'center'									
							},{},
							{
								text: 'Unid',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Mínimo',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Saldo',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'Vendas',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Méd Diária',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Méd Mensal',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Comprar',
								style: 'tableHeader',
								alignment: 'center'
							}							
						]						
					)

					for(let i in res.results){

                        let QtdeMeses = (params.meses && params.meses > 0) ? params.meses : 1;
						let codigoProduto = res.results[i]['PRODUTOS_ID'];
						let saldoAtual = cents(res.results[i]['SALDOS_DISPONIVEL']);
						let periodo = res.results[i]['PRODUTOS_PERIODO'];
						let vendas = await obterVendasPeriodo(params.empresa, codigoProduto, params.inicio, params.final, params);
						let mediaDiaria = (vendas > 0 && periodo > 0 ? cents(vendas/periodo) : 0);
						let mediaMensal = (mediaDiaria > 0 ? (mediaDiaria * 30) : 0);
						let qtdeComprar = (mediaMensal > 0 && (Math.round(mediaMensal * QtdeMeses) - saldoAtual) > 0) ?
										  (Math.round(mediaMensal * QtdeMeses) - saldoAtual) : 0;

						if((qtdeComprar/100) >= 1) {
                            if(grupoAnt !== res.results[i]['PRODUTOS_ID_GRUPOS']) {
								rows.push([
									{
										text: '*** ' + ("00000" + res.results[i]['PRODUTOS_ID_GRUPOS']).slice(-5) + ' - ' + res.results[i]['GRUPOS_NOME'] + ' ***',
										colSpan: 10,
										alignment: 'center',
										style: 'tableExample',
										fontSize: 10,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);
								grupoAnt = res.results[i]['PRODUTOS_ID_GRUPOS'];
							}
                            if(pessoaAnt !== res.results[i]['PRODUTOS_ID_PESSOAS']) {
								rows.push([
									{
										text: '### Fornecedor: ' + ("000000" + res.results[i]['PRODUTOS_ID_PESSOAS']).slice(-5) + ' - ' + res.results[i]['PESSOAS_NOME'],
										colSpan: 10,
										alignment: 'left',
										style: 'tableExample',
										fontSize: 10,
										bold: true
									},{},{},{},{},{},{},{},{},{}
								]);
								pessoaAnt = res.results[i]['PRODUTOS_ID_PESSOAS'];
							}
							rows.push([
								{
									text: codigoProduto,
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['PRODUTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
									colSpan: 2
								},{},
								{
									text: res.results[i]['PRODUTOS_UNIDADE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: res.results[i]['SALDOS_MINIMO'].toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: (saldoAtual / 100).toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: vendas.toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(mediaDiaria / 100),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(mediaMensal / 100),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: (qtdeComprar /100).toFixed(0),
									alignment: 'right',
									style: 'tableExample'
								}							
							]);
						}
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const obterVendasPeriodo = function(empresa, produto, inicio, final, params) {
    return new Promise(async (resolve, reject) => {
		const db = await samosFB.conectarBanco(params.client); 
		
		let sql = `execute block returns ( VENDAS numeric(12,2) ) as
								declare variable EMISSAO date;		
								declare variable QUANTIDADE numeric(12,3);
								begin
									VENDAS = 0;
									for
										select MOVIMENTOS_EMISSAO,
											   MOVIMENTOSITENS_QUANTIDADE
										from MOVIMENTOSITENS
										join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
										join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
										where   MOVIMENTOS_ID_EMPRESAS = ${empresa} and
												MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
												MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
												((MOVIMENTOS_STATUS <> 'C') and 
                                                 (MOVIMENTOS_STATUS <> 'D') and
                                                 (MOVIMENTOS_STATUS <> 'R') and
                                                 (MOVIMENTOS_STATUS <> 'V')) and
												OPERACOES_ACAO = 'VN' and OPERACOES_ESTOQUE = 'D'
										order by MOVIMENTOS_EMISSAO
										into
										    :EMISSAO,
											:QUANTIDADE
									do
										begin
											VENDAS = VENDAS + :QUANTIDADE;
										end
								suspend;
								end;`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0]['VENDAS'] : 0);
            }
			db.detach();
        });
    });
};