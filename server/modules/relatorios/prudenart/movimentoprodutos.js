'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const cents = utils.number.cents.bind(utils.number);
            const grams = utils.number.grams.bind(utils.number);
            const produtos = await obterProdutos(db, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 20, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
							widths: [18, 18, 20, 15, 10, 5, 5, 15, 28, 15, 40, 40, 35, 52, 40, 30, 30],
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
                        margin: [15, 10]  // 10, 10
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 7,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 7,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;

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
                        colSpan: 2,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Relação de Movimentos de Produtos',
                        colSpan: 13,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},{},{},{},{},{},{},
                    {
                        text: '',
                        colSpan: 2,
                        fontSize: 10,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 13,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],												
				[
					{
						text: 'Cla.Fis',
						style: 'tableHeader',
						alignment: 'center',
						colSpan: 2									
					},{},
					{
						text: 'Cód',
						style: 'tableHeader',
						alignment: 'center'							
					},							
					{
						text: 'Descrição do Produto',
						style: 'tableHeader',
						alignment: 'center',
						colSpan: 14,								
					},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]
            );

			let modelPro = [];
			let modelMov = [];
			let saldoInventario = 0;

            for(let i in produtos){

				modelPro = produtos[i];

                const movimentos = await obterMovimentos(db, modelPro['PRODUTOS_ID'], params);
				const noPeriodo  = await obterAtuais(db, modelPro['PRODUTOS_ID'], params);
				const inventPro  = await obterInventario(db, modelPro['PRODUTOS_ID'], params);

				if(inventPro.length > 0) {
					saldoInventario = ((grams(inventPro[0]['MOVIMENTOSITENS_ENTRADAS']) - grams(inventPro[0]['MOVIMENTOSITENS_SAIDAS'])) / 1000);
				} else {
					saldoInventario = 0;
				}

				if(params.tipo = 0) {
					if(noPeriodo.length == 0 && saldoInventario <= 0) {
						continue;
					}	
				}

				if(params.tipo = 1) {  // Apenas com saldo
					if(saldoInventario <= 0) {
						continue;
					}	
				}
				
				if(params.tipo = 2) {  // Apenas com movimento
					if(noPeriodo.length == 0) {
						continue;
					}	
				}

				rows.push([
					{
						text: modelPro['NCMS_NCM'],
						border: [false, true, false, false],
						style: 'tableExample',
						colSpan: 2							
					},{},
					{
						text: modelPro['PRODUTOS_ID'],
						border: [false, true, false, false],
						style: 'tableExample',
						alignment: 'right'							
					},
					{
						text: modelPro['PRODUTOS_NOME'] + ' [Saldo: ' + utils.number.float2moeda(modelPro['SALDOS_DISPONIVEL']) + ']',
						border: [false, true, false, false],
						style: 'tableExample',
						colSpan: 14,
						border: [false, true, false, false]
					},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]);

				rows.push([  // Cabeçalho secundário
					{
						text: 'Data',
						style: 'tableHeader',
						alignment: 'center',
						colSpan: 2,
						border: [false, false, false, false]
					},{},                                
					{
						text: 'CFOP',
						style: 'tableHeader',
						alignment: 'left',
						border: [false, false, false, false],
						colSpan: 5,									
					},{},{},{},{},
					{
						text: 'Tip',
						style: 'tableHeader',
						alignment: 'left',
						border: [false, false, false, false]									
					},
					{
						text: 'Número',
						style: 'tableHeader',
						alignment: 'center',
						border: [false, false, false, false]									
					},
					{
						text: 'Se',
						style: 'tableHeader',
						border: [false, false, false, false],
						alignment: 'center'
					},
					{
						text: modelPro['PRODUTOS_UNIDADE'] == 'KG' ? 'Qtde Kg' : 'Qtde Pc',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: modelPro['PRODUTOS_UNIDADE'] == 'KG' ? 'Qtde Br' : 'Qtde Kg',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: 'Preço',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: 'Valor',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: 'Ipi',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: 'Médio',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'right'
					},
					{
						text: 'Tipo',
						style: 'tableHeader',
						border: [false, false, false, false],									
						alignment: 'left'
					}
				]);	

				// aqui vai fazer tudo, calcular o custo medio, preparar os dados pro resumo do item, etc.
                let qtdeAnterior = 0;
                let qtdeEntradas = 0;
                let qtdeSaidas   = 0;

                let vlrAnterior = 0;
                let vlrEntradas = 0;
                let vlrSaidas   = 0;

				let totalIpiInicial = 0;
				let totalIpiEntradas = 0;
				let totalIpiSaidas = 0;

				// vars Controle Custo Médio
				let mFlag   = false;
				let mSaldo  = 0;
				let mSldCme = 0;
				let mSldFin = 0;

                for(let j in movimentos) {

                    modelMov = movimentos[j];
					let dataMovimento = moment(modelMov['MOVIMENTOS_ENTRADASAIDA']).format('YYYY-MM-DD');

					let isAnterior = moment(dataMovimento).isBefore(params.inicio);

					if(mFlag == false) {
						if(modelMov['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/1000|1102|2102|2202|1403|2403|1933/)) {
							mSaldo = grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']) / 1000;
							if(mSaldo > 0) {
								mSldCme = ((cents(modelMov['MOVIMENTOSITENS_TOTAL'])/100) / (grams(modelMov['MOVIMENTOSITENS_QUANTIDADE'])/1000));
							}
							mSldFin = modelMov['MOVIMENTOSITENS_TOTAL'];
							mFlag = true;
						}			
					} else {
						if(modelMov['OPERACOES_ESTOQUE'].trim() == 'D') {  // Debita
							mSaldo = mSaldo - (grams(modelMov['MOVIMENTOSITENS_QUANTIDADE'])/1000);
							if(modelMov['OPERACOES_CUSTO'].trim() == 'T') {  // Agora esse campo é usado pro custo médio
								mSldFin = mSldFin - (mSldCme * (grams(modelMov['MOVIMENTOSITENS_QUANTIDADE'])/1000));
							}  //
						} else {  // Credita
							mSldFin  = mSldFin + (((cents(modelMov['MOVIMENTOSITENS_TOTAL'])/100) + (cents(modelMov['MOVIMENTOSITENS_VALORIPI'])/100)));
							mSaldo   = mSaldo + (grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']) / 1000);
							if(mSaldo > 0 && modelMov['OPERACOES_CUSTO'].trim() == 'T') {								
								mSldCme = (mSldFin / mSaldo);
							}
						}
					}

					mFlag = true;

                    let tipoDoc = (modelMov['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4);

                    if(isAnterior) { // Aqui só calcula, sem imprimir

                        if( modelMov['OPERACOES_ESTOQUE'].trim() == 'C' ){
                            qtdeAnterior = qtdeAnterior + grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']);
                            vlrAnterior  = vlrAnterior + cents(modelMov['MOVIMENTOSITENS_TOTAL']);
                        } else {
                            qtdeAnterior = qtdeAnterior - grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']);
                            vlrAnterior  = vlrAnterior - cents(modelMov['MOVIMENTOSITENS_TOTAL']);
                        }

                    } else { // aqui imprime os lançamentos e faz o cálculo tbm

                        if( modelMov['OPERACOES_ESTOQUE'].trim() == 'C' ){
                            qtdeEntradas += grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']);
                            vlrEntradas  += cents(modelMov['MOVIMENTOSITENS_TOTAL']);
                        } else {
                            qtdeSaidas += grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']);
                            vlrSaidas  += cents(modelMov['MOVIMENTOSITENS_TOTAL']);
                        }

						rows.push([
							{
								text: modelMov['OPERACOES_ESTOQUE'].trim() == 'C' ?
									  (moment(modelMov['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(modelMov['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY')) :
									  moment(modelMov['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
								style: 'tableExample',
								colSpan: 2,
								alignment: 'center',
								border: [false, false, false, false]
                            },{},
                            {
								text: modelMov['MOVIMENTOSITENS_ID_OPERACOES'] + ' ' +
								      String(modelMov['OPERACOES_NOME']).slice(0,15),
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5,								
								border: [false, false, false, false]								
                            },{},{},{},{},
							{
								text: siglaDocumento(tipoDoc),
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]
							},
                            {
								text: modelMov['MOVIMENTOS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
							},
                            {
								text: modelMov['MOVIMENTOS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: Number(modelMov['MOVIMENTOSITENS_QUANTIDADE'] || 0).toFixed(2).replace('.', ','),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},	
							{
								text: utils.number.float2moeda(modelMov['PRODUTOS_UNIDADE'] == 'KG' ? ((grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']) / grams(modelMov['PRODUTOS_PESOLIQUIDO'] || 1000))) :
								                                              ((grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']) * grams(modelMov['PRODUTOS_PESOLIQUIDO'] || 1000))/1000000)),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(modelMov['MOVIMENTOSITENS_PRECO']),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(modelMov['MOVIMENTOSITENS_TOTAL']),								
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(modelMov['MOVIMENTOSITENS_IPI']),
								border: [false, false, false, false],
								alignment: 'right',								
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(mSldCme),
								border: [false, false, false, false],									
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: modelMov['OPERACOES_ESTOQUE'].trim() == 'C' ? 'Entrada' : 'Saida',
								border: [false, false, false, false],
								style: 'tableExample'
							}
						]);

                    }

                }

				//Display quantidades
				let displayEstoqueInicial = (qtdeAnterior / 1000).toFixed(3).replace('.', ',');
				let displayEntradas       = (qtdeEntradas / 1000).toFixed(3).replace('.', ',');
				let displaySaidas         = (qtdeSaidas / 1000).toFixed(3).replace('.', ',');
				let displayEstoqueAtual   = ((qtdeAnterior + qtdeEntradas - qtdeSaidas) / 1000).toFixed(3).replace('.', ',');

				//Display totais
				let displayValorInicial  = utils.number.float2moeda(vlrAnterior / 100, true);
				let displayValorEntradas = utils.number.float2moeda(vlrEntradas / 100, true);
				let displayValorSaidas   = utils.number.float2moeda(vlrSaidas / 100, true);
				let displayValorAtual    = utils.number.float2moeda(((vlrAnterior + vlrEntradas) - vlrSaidas) / 100, true);

				rows.push([
					{
						style: 'tableExample',
						table: {
							body: [
								[
									//Espaçamento
									{
										text: '\t\t\t .'.repeat(8),
										border: [false, false, false, false]
									},
									//Tabela totalizador
									{
										style: 'tableExample',
										table: {
											body: [
												[
													'Inicial', 
													{
														text: displayEstoqueInicial,
														alignment: 'right'
													} 
												],
												[
													'Entradas', 
													{
														text: `${ displayEntradas } `,
														alignment: 'right'
													}
												],
												[
													'Saidas', 
													{
														text: `${ displaySaidas } `,
														alignment: 'right'
													} 
												],
												[
													'Atual', 
													{
														text: `${ displayEstoqueAtual }`,
														alignment: 'right'
													} 
												]
											]
										},
										border: [false, false, false, false]
									}, 
									//Espaçamento
									{
										text: '\t'.repeat(15),
										border: [false, false, false, false]
									},
									//Tabela valores totais
									{
										style: 'tableExample',
										table: {
											body: [
												[
													'Valor estoque inicial', 
													'Valor entradas',              
													'Valor saidas',                
													'Valor atual'
												],
												[ 
													{
														text: displayValorInicial,
														alignment: 'right'
													}, 
													{
														text: displayValorEntradas,
														alignment: 'right'
													},  
													{
														text: displayValorSaidas,
														alignment: 'right'
													},   
													{
														text: `${ displayValorAtual }`, 
														alignment: 'right'
													}
												],														
												[
													{
														text: 'Ipi estoque inicial', 
														color: 'white',  // Oculto
														border: [false, false, false, false],
														alignment: 'center'
													}, 
													{
														text: 'Ipi entradas',
														color: 'white',
														border: [false, false, false, false],
														alignment: 'center'
													},  
													{
														text: 'Ipi saidas',
														color: 'white',
														border: [false, false, false, false],
														alignment: 'center'
													},    
													{
														text: 'Ipi atual',
														color: 'white',
														border: [false, false, false, false],
														alignment: 'center'
													} 
												],
												[ 
													{
														text: utils.number.float2moeda(totalIpiInicial / 100) || '\n',
														border: [false, false, false, false],
														alignment: 'right'
													}, 
													{
														text: utils.number.float2moeda(totalIpiEntradas / 100) || '\n',
														border: [false, false, false, false],
														alignment: 'right'
													},  
													{
														text: utils.number.float2moeda(totalIpiSaidas / 100) || '\n',
														border: [false, false, false, false],
														alignment: 'right'
													},    
													{
														text: utils.number.float2moeda( ( (totalIpiInicial + totalIpiEntradas) - totalIpiSaidas) / 100) || '\n',
														border: [false, false, false, false],
														alignment: 'right'
													} 
												]
											]
										},
										border: [false, false, false, false]
									}
								],
							]
						},
						colSpan: 17,
						border: [false, false, false, false]
					},
					{},{},{},{},{},{},{},{},{},{},{},{},{},{}
				]);

				// fim do resumo

            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterProdutos = function(db, params) {
    const { 
		empresa, 
		produtoinicial, 
		produtofinal, 
		grupoinicial, 
		grupofinal
	} = params;

    return new Promise(async (resolve, reject) => {
		let sql = `select PRODUTOS_ID,
		                  PRODUTOS_NOME,
						  PRODUTOS_UNIDADE,
						  PRODUTOS_PESOLIQUIDO,
						  SALDOS_RESERVADO,
						  SALDOS_DISPONIVEL,
						  NCMS_NCM from PRODUTOS
				   join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
				   join NCMS on NCMS_ID = PRODUTOS_ID_NCMS
				   where PRODUTOS_ID between ${(produtoinicial || 1)} and ${(produtofinal || 999999)} and
				         PRODUTOS_ID_GRUPOS between ${(grupoinicial || 1)} and ${(grupofinal || 999999)}
			       order by PRODUTOS_ID`;

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

const obterMovimentos = function(db, idproduto, params) {

    return new Promise(async (resolve, reject) => {
		let sql = `select 
					MOVIMENTOSITENS_ID_PRODUTOS, 
					PRODUTOS_NOME, 
					PRODUTOS_UNIDADE,
					PRODUTOS_PESOLIQUIDO,
					MOVIMENTOS_ID_DOCUMENTOS,
					MOVIMENTOS_EMISSAO, 
					MOVIMENTOS_ENTRADASAIDA,
					MOVIMENTOSITENS_ID_OPERACOES, 
					OPERACOES_NOME, 
					OPERACOES_ESTOQUE, 
					OPERACOES_CUSTO,
					NCMS_NCM, 
					SALDOS_RESERVADO,
					SALDOS_DISPONIVEL,
					MOVIMENTOS_NUMERO, 
					MOVIMENTOS_SERIE, 
					MOVIMENTOSITENS_QUANTIDADE, 
					MOVIMENTOSITENS_PRECO,
					MOVIMENTOSITENS_TOTAL,
					MOVIMENTOSITENS_IPI
				from MOVIMENTOSITENS
				join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
				join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
				join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
				join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
				join SALDOS     on SALDOS_ID_EMPRESAS = ${params.empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
				where MOVIMENTOS_ENTRADASAIDA <= '${params.final.replace (/\//ig,'.')}' and
					MOVIMENTOS_ID_EMPRESAS = ${params.empresa}  and 
					MOVIMENTOSITENS_ID_PRODUTOS = ${idproduto} and 
					((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
					OPERACOES_ESTOQUE <> 'N'
					order by MOVIMENTOS_ENTRADASAIDA`;

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

/*
sqlSearch = `
*/

const obterAtuais = function(db, idproduto, params) {

    return new Promise(async (resolve, reject) => {
		let sql = `select 
					MOVIMENTOSITENS_ID_PRODUTOS, 
					PRODUTOS_NOME, 
					PRODUTOS_UNIDADE,
					PRODUTOS_PESOLIQUIDO,
					MOVIMENTOS_ID_DOCUMENTOS,
					MOVIMENTOS_EMISSAO, 
					MOVIMENTOS_ENTRADASAIDA,
					MOVIMENTOSITENS_ID_OPERACOES, 
					OPERACOES_NOME, 
					OPERACOES_ESTOQUE, 
					OPERACOES_CUSTO,
					NCMS_NCM, 
					SALDOS_RESERVADO,
					SALDOS_DISPONIVEL,
					MOVIMENTOS_NUMERO, 
					MOVIMENTOS_SERIE, 
					MOVIMENTOSITENS_QUANTIDADE, 
					MOVIMENTOSITENS_PRECO,
					MOVIMENTOSITENS_TOTAL,
					MOVIMENTOSITENS_IPI
				from MOVIMENTOSITENS
				join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
				join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
				join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
				join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
				join SALDOS     on SALDOS_ID_EMPRESAS = ${params.empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
				where MOVIMENTOS_ENTRADASAIDA between '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}' and
					MOVIMENTOS_ID_EMPRESAS = ${params.empresa}  and 
					MOVIMENTOSITENS_ID_PRODUTOS = ${idproduto} and 
					((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
					OPERACOES_ESTOQUE <> 'N'
					order by MOVIMENTOS_ENTRADASAIDA`;

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

const obterInventario = function(db, idproduto, params) {

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOSITENS_ID_PRODUTOS,
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
					where MOVIMENTOS_ID_EMPRESAS = ${params.empresa}  and 
						MOVIMENTOSITENS_ID_PRODUTOS = ${idproduto} and
						((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${params.final.replace (/\//ig,'.')}') or
						(MOVIMENTOS_ID_OPERACOES < 500000 and MOVIMENTOS_ENTRADASAIDA <= '${params.final.replace (/\//ig,'.')}')) and
						(OPERACOES_ESTOQUE = 'C' or OPERACOES_ESTOQUE = 'D') 

					group by MOVIMENTOSITENS_ID_PRODUTOS`;		

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


const siglaDocumento = function(idDocumento) {

	if(idDocumento == '0001') {	return 'ORC'; } else
	if(idDocumento == '0002') { return 'PED'; } else
	if(idDocumento == '0003') { return 'NFS'; } else
	if(idDocumento == '0004') { return 'REQ'; } else
	if(idDocumento == '0005') { return 'NFE'; } else
	if(idDocumento == '0006') { return 'CPA'; } else	
	if(idDocumento == '0007') { return 'ORD'; } else
	if(idDocumento == '0008') { return 'DUP'; } else
	if(idDocumento == '0009') { return 'DUP'; } else 
	                          { return 'NDA'}
	
};
