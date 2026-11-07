'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const processosExecutaSql = require('../../processos/executasql');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);				

const samosFB   = require('../../../services/samosFirebird');

async function calculaCustoMedioProduto(db, idProduto, params ) {

	const movimentos = await obterMovimentos(db, idProduto, params);

	let mFlag    = false;
	let mSaldo   = 0;
	let mSldCme  = 0;
	let mSldFin  = 0;
	let modelMov = [];
	
	for(let j in movimentos) {

		modelMov = movimentos[j];

//		console.log('mFlag: ', mFlag);

		if(mFlag == false) {
			if(modelMov['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/1000|1010|1101|1102|2101|2102|2202|1403|2403|1933/)) {
				mSaldo = grams(modelMov['MOVIMENTOSITENS_QUANTIDADE']) / 1000;
				if(mSaldo > 0) {
					mSldCme = ((cents(modelMov['MOVIMENTOSITENS_TOTAL'])/100) / (grams(modelMov['MOVIMENTOSITENS_QUANTIDADE'])/1000));
				}
				mSldFin = modelMov['MOVIMENTOSITENS_TOTAL'];
//				console.log('msldFin: ', mSldFin);
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
	}

	return cents(mSldCme);
}

module.exports = {
    read: params => {

		const tiposaldo = params.tiposaldo;
		const valorAcrescimo      = params.valueacrescimo;
		const percentualAcrescimo = params.valuepercentual;
		const usaAcrescimo        = percentualAcrescimo > 0;

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
									text: `Inventario de Produtos em ${ moment( params.inicio ).format('DD/MM/YYYY') }`,
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
									alignment: 'center',
									colSpan: 2
								},{},							
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
			api.inventario().read(params)
				.then(async res => {

					let rows = docDefinition.content[1].table.body;
					const db = await samosFB.conectarBanco(params.client); 					
					let qtdeBase = 0;
					let precoCusto = 0;
					let precoCompra = 0;
					let precoMedio = 0;
					let precoVenda = 0;
                    let precoBase = 0;
					let valorItem = 0;
					let qtdeEstoque = 0;
					let valorEstoque = 0;
					let qtdeGrupo = 0;
					let valorGrupo = 0
					let grupoAnt = 0;

					for(let i in res.results){

						qtdeBase = res.results[i]['MOVIMENTOSITENS_ENTRADAS'] - res.results[i]['MOVIMENTOSITENS_SAIDAS'];
					
						//Com saldo positivo
						if( tiposaldo == '0' && qtdeBase <= 0 ){
							continue; //Pula este
						}
						//Com saldo negativo
						if( tiposaldo == '1' && qtdeBase >= 0 ){
							continue; //Pula este
						}
						//Com saldo zerado
						if( tiposaldo == '2' && qtdeBase != 0 ){
							continue; //Pula este
						}

						precoCusto = cents(res.results[i]['SALDOS_CUSTO']);
						precoCompra = cents(res.results[i]['SALDOS_COMPRA']);
						precoVenda = cents(res.results[i]['SALDOS_PRECO']);
						if(params.preco == 3) {
//							console.log('calculando preço médio...');
							precoMedio = precoCusto;// await calculaCustoMedioProduto(db, res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'], params ) || res.results[i]['SALDOS_RESERVADO'] || res.results[i]['SALDOS_CUSTO'];
						}

						precoBase = params.preco == '0' ? precoCusto : 
									params.preco == '1' ? precoCompra :
									params.preco == '2' ? precoVenda : precoMedio;

						//Se tem acrescimo, aplica
						if(usaAcrescimo)
						{
							//Se for ACRESCIMO
							if( valorAcrescimo == '0' ){
								precoBase = cents(precoBase + ( (percentualAcrescimo/100) * precoBase)) / 100;

							//Se for DECRESCIMO
							}else{
								precoBase = cents(precoBase - ( (percentualAcrescimo/100) * precoBase)) / 100;
							}
						}

                        valorItem = (qtdeBase * precoBase);

						if(  
							tiposaldo == '0' ? (qtdeBase > 0) :   //Exibe apenas do saldo positivo
							tiposaldo == '1' ? (qtdeBase <= 0) :  //Apenas do saldo negativo
							tiposaldo == '2' ? (qtdeBase == 0) :  //Apenas do saldo zerado
							                   (qtdeBase)	      //Exibe de todos os produtos	   
						){
                            if(grupoAnt != res.results[i]['PRODUTOS_ID_GRUPOS']) {
								if(
									(
										tiposaldo == '0' ? (qtdeGrupo > 0) :   //Exibe apenas do saldo positivo
										tiposaldo == '1' ? (qtdeGrupo <= 0) :  //Apenas do saldo negativo
										tiposaldo == '2' ? (qtdeGrupo == 0) :  //Apenas do saldo zerado
														   (qtdeGrupo)	       //Exibe de todos os produtos	

									//NAO IMPRIME O TOTALIZADOR ANTES DO PRIMEIRO ITEM
									) && grupoAnt > 0
								) {
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
											text: utils.number.float2moeda( qtdeGrupo.toFixed(0), true ),
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
									text: res.results[i]['PRODUTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
									border: [false, false, false, false],
									colSpan: 2
								},{},
								{
									text: res.results[i]['PRODUTOS_UNIDADE'],
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]								
								},
								{
									text: qtdeBase.toFixed(3),
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

					pdfStream(docDefinition, resolve, reject);
					db.detach();
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
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
				where MOVIMENTOS_ENTRADASAIDA <= '${params.inicio.replace (/\//ig,'.')}' and
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
