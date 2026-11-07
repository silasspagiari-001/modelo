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
        return new Promise(async (resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'landscape', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						styles: {
							tableExample: {
								fontSize: 6,
								margin: [0, 0, 0, 0],
								border: 0
							},
							tableHeader: {
								bold: true,
								fontSize: 6,
								color: 'black'
							}
						},									
						content: [
							{
								style: 'tableReport',
								table: { // Cod  Des Est Méd CsA CsN %Df %Mk VnA VnN QdE
									//        1   2   3   4   5   6   7   8   9  10  11 // 12 Colunas
									widths: [35, 25, 180, 50, 50, 50, 50, 50, 50, 50, 50, 50], // 450
									heights: 5,
									headerRows: 3,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						footer: function(page, pages) {
							return { 
								stack: [ 
									'_'.repeat(140),
									{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
								],
								margin: [40, 10]
							};
						},			
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					const cents = utils.number.cents.bind(utils.number);
					const db = await samosFB.conectarBanco(params.client);
					let model = res.results[0];
					let produtos        = model['MOVIMENTOS_ITENS'];
					let itensPagina     = 0;
					let rows            = docDefinition.content[0].table.body;
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 80,
								alignment: 'center',
								border: [false, false, false, false]
							},{},
							{
								text: `\n${model['EMPRESAS_NOME']}`,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false]
							},
							{
								colSpan: 4,
								text: 'Atualizar Preços',
								alignment: 'center',
								style: {fontSize: 16, bolditalics: true},
								border: [false, false, false, false]
							},{},{},{},
							{
								colSpan: 5, 
								text: `\n${moment.tz(params.timezone).format('DD/MM/YYYY')} ${moment.tz(params.timezone).format('HH:mm:ss')}`,
								alignment: 'right',
								border: [false, false, false, false]								
							},{},{},{},{}
						],
						[
							{
								text: `Nota Fiscal: ${model['MOVIMENTOS_NUMERO']} Emissão: ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')} Fornecedor: (${model['MOVIMENTOS_ID_PESSOAS']}) ${model['MOVIMENTOS_NOME']}`,
								style: {fontSize: 10},
								colSpan: 12,								
							},{},{},{},{},{},{},{},{},{},{},{}
						],
						[
							{
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Produto',
								alignment: 'center',								
								colSpan: 2
							},{},
							{
								text: 'Saldo',
								alignment: 'center'								
							},
							{
								text: 'Méd Vendas',
								alignment: 'center'						
							},
							{
								text: 'Custo Ant',
								alignment: 'center'								
							},
							{
								text: 'Custo Novo',
								alignment: 'center'
							},	
							{
								text: '% Diferença',
								alignment: 'center'								
							}, 
							{
								text: '% MarkUp',
								alignment: 'center'								
							},
							{
								text: 'Venda Ant',
								alignment: 'center'								
							},
							{
								text: 'Venda Novo',
								alignment: 'center'								
							},
							{
								text: 'Qtde Entrada',
								alignment: 'center'								
							}
						]
					);

					for(let i in produtos){
						let idEmpresa = model['MOVIMENTOS_ID_EMPRESAS'];
						let codigoProduto = produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'];
						let dataReferencia = model['MOVIMENTOS_ENTRADASAIDA'];
						let qtdeProduto  = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
						let saldoProduto = produtos[i]['SALDOS_DISPONIVEL'].toFixed(0);
						let vendaUltimopreco = await obterSomaVendas(idEmpresa, codigoProduto, dataReferencia, db);
						let {vendas, ultimopreco} = vendaUltimopreco;
						let custoAnterior = cents(produtos[i]['MOVIMENTOSITENS_CUSTO']);
						let custoAtual = cents(produtos[i]['SALDOS_CUSTO']);
						let precoAtual = cents(produtos[i]['SALDOS_PRECO']);

						let perDiferenca = (custoAtual == custoAnterior) ? 0 :
						 				   (((custoAtual / custoAnterior) * 100) - 100)
						let perMarkup = (custoAtual == precoAtual) ? 0 :
					          			(((precoAtual / custoAtual) * 100) - 100)

						rows.push(
							[
								{							
									text: codigoProduto,
									alignment: 'center',
									style: {
										bold: true,
										fontSize: 10
									}											
								},
								{
									text: produtos[i]['PRODUTOS_NOME'],
									colSpan: 2,
									style: {bold: true, fontSize: 8}
								},{},
								{
									text: saldoProduto,
									alignment: 'right',
									style: {fontSize: 10},
								},
								{
									text: (vendas/6).toFixed(0),
									alignment: 'right',
									style: {fontSize: 10},
								},
								{
									text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_CUSTO']),
									alignment: 'right',
									style: {fontSize: 10}
								},
								{
									text: utils.number.float2moeda(produtos[i]['SALDOS_CUSTO']),
									alignment: 'right',
									style: {fontSize: 10},																			
								},
								{
									text: utils.number.float2moeda(perDiferenca) || '0,00',
									alignment: 'right',
									style: {fontSize: 10},																			
								},
								{
									text: utils.number.float2moeda(perMarkup) || '0,00',
									alignment: 'right',
									style: {fontSize: 10},																			
								},
								{
									text: utils.number.float2moeda(ultimopreco) || '0,00',
									alignment: 'right',
									style: {fontSize: 10},																			
								},
								{
									text: utils.number.float2moeda(produtos[i]['SALDOS_PRECO']),
									alignment: 'right',
									style: {fontSize: 10},																			
								},
								{
									text: qtdeProduto,
									alignment: 'right',
									style: {fontSize: 10},																			
								}
							]
						)						

						itensPagina++
						if(itensPagina > 30) {
							itensPagina = 0;
							rows.push( // Aqui fecho o rodapé de cada página
								[
									{
										colSpan: 12,
										text: 'Continua...',
										pageBreak: 'after',
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{}
								]						
							);									
						}
					}  // end for

					rows.push(
						[
							{
								text: '',
								colSpan: 8,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								colSpan: 2,
								text: 'Valor da Nota',
								alignment: 'right',
								fontSize: 12,
								bold: true
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
								alignment: 'right',
								fontSize: 12,								
								bold: true								
							},{}
						]						
					);									

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const obterSomaVendas = function(empresa, produto, datareferencia, db) {
    return new Promise(async (resolve, reject) => {
		let vendas, ultimopreco;	
		
		let sql = `execute block returns ( VENDAS numeric(12,2), ULTIMOPRECO numeric(12,3) ) as
								declare variable ENTRADASAIDA date;		
								declare variable QUANTIDADE numeric(12,3);
								declare variable PRECO numeric(12, 2);
								begin
									VENDAS = 0;
									for
										select MOVIMENTOS_ENTRADASAIDA, 
											   MOVIMENTOSITENS_QUANTIDADE, 
											   MOVIMENTOSITENS_PRECO
										from MOVIMENTOSITENS
										join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS      
										join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
										where   MOVIMENTOS_ID_EMPRESAS = ${empresa} and
												MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
												MOVIMENTOS_ENTRADASAIDA between dateadd(-6 month to date '${datareferencia}') and '${datareferencia}' and
												((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
												OPERACOES_ACAO = 'VN' and OPERACOES_ESTOQUE = 'D'
										order by MOVIMENTOS_ENTRADASAIDA
										into
										    :ENTRADASAIDA,
											:QUANTIDADE,
											:PRECO
									do
										begin
											VENDAS = VENDAS + :QUANTIDADE;
											if (:ENTRADASAIDA < '${datareferencia}') then
												begin
													ULTIMOPRECO = :PRECO;
												end  
										end
								suspend;
								end;`

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
				vendas      = results[0] ? results[0]['VENDAS'] : 0;
				ultimopreco = results[0] ? results[0]['ULTIMOPRECO'] : 0;

                resolve({ vendas, ultimopreco });
            }
        });
    });
};