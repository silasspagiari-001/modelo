'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		const isPrivilegiado = (params.tipousuario == 0 || params.tipousuario == 6); // Diretor ou auditor
		const cS = (isPrivilegiado ? 33 : 1);
		const fanEmpresa = params.fantasia ? (params.fantasia.indexOf('-') != -1 ? params.fantasia.slice(params.fantasia.indexOf('-') + 2, Infinity) : params.fantasia.slice(0, 2)) : 'Loja';
		const pOrientacao = (isPrivilegiado ? 'landscape' : 'portrait');
		const descriStatus = params.status == 0 ? 'Ativos' :
							 params.status == 1 ? 'Inativos' :
							 params.status == 2 ? 'Showroom' : 'Todos';

		let docDefinition = {
			pageOrientation: pOrientacao,
			pageSize: 'A4',
			pageMargins: [20, 40, 20, 35],
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
									text: `Saldos de Produtos - ${descriStatus}\n`,
									width: '*',
									style: {
										alignment: 'center',
										color: 'blue'
									}
								},
								{
									text: `Fornecedor: ${params.pessoainicial} até ${params.pessoafinal} - Grupo: ${params.grupoinicial} até ${params.grupofinal}`,
									width: '*',
									style: {
										alignment: 'center',
										color: 'blue'
									}
								},

							]
						},
						{
							stack: [
								moment.tz(params.timezone).format('DD/MM/YYYY'),
								moment.tz(params.timezone).format('HH:mm:ss')
							],
							width: 100,
							style: {
								fontSize: 10,
								alignment: 'right',
								bold: true
							}
						}
					],
					margin: [40, 10]
				}
			},
			styles: {
				tableExample: {
					fontSize: 10,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD UNI NOM  CD  02  03  04  05  06  07  08  09  TT  // 13 Cols.
						widths: [35, 20, 280, cS, cS, cS, cS, cS, cS, cS, 33, 33, 33],
						headerRows: 1,						
						body: [
							isPrivilegiado ?
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center',
                                },
								{
									text: 'CD',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 02',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 03',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 04',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 05',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 06',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 07',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 08',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Loja 09',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								},
							]:
							[  // Se não for diretor ou auditor mostra apenas a loja e o CD
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 8
                                },{},{},{},{},{},{},{},
								{
									text: 'CD',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: fanEmpresa,
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								},
							]							
						]
					},
					layout: {
						fillColor: function (i) {
							return (i % 2 === 0) ? '#F0F0F0' : null;  // '#E3E3E3'
						}
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 10,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.saldoscomparativo().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimaPessoa = 0;
					let precoCalculo = 0;
					let linhasPagina = 1; 					

					let somaItens01 = 0;
					let somaItens02 = 0;
					let somaItens03 = 0;
					let somaItens04 = 0;
					let somaItens05 = 0;
					let somaItens06 = 0;
					let somaItens07 = 0;
					let somaItens08 = 0;
					let somaItens09 = 0;

					let valorItens01 = 0;
					let valorItens02 = 0;
					let valorItens03 = 0;
					let valorItens04 = 0;
					let valorItens05 = 0;
					let valorItens06 = 0;
					let valorItens07 = 0;
					let valorItens08 = 0;
					let valorItens09 = 0;

					for(let i in res.results){
						
						let model = res.results[i];

						let saldoDisponivel01 = 0;
						let saldoDisponivel02 = 0;
						let saldoDisponivel03 = 0;
						let saldoDisponivel04 = 0;
						let saldoDisponivel05 = 0;
						let saldoDisponivel06 = 0;
						let saldoDisponivel07 = 0;
						let saldoDisponivel08 = 0;
						let saldoDisponivel09 = 0;


						let saldoTotal = 0;

                        if(isPrivilegiado) {
							saldoDisponivel01 = model['SALDOS_FILIAL01'];
							saldoDisponivel02 = model['SALDOS_FILIAL02'];
							saldoDisponivel03 = model['SALDOS_FILIAL03'];
							saldoDisponivel04 = model['SALDOS_FILIAL04'];
							saldoDisponivel05 = model['SALDOS_FILIAL05'];
							saldoDisponivel06 = model['SALDOS_FILIAL06'];
							saldoDisponivel07 = model['SALDOS_FILIAL07'];
							saldoDisponivel08 = model['SALDOS_FILIAL08'];
							saldoDisponivel09 = model['SALDOS_FILIAL09'];	
							
							somaItens01 += saldoDisponivel01;
							somaItens02 += saldoDisponivel02;
							somaItens03 += saldoDisponivel03;
							somaItens04 += saldoDisponivel04;
							somaItens05 += saldoDisponivel05;
							somaItens06 += saldoDisponivel06;
							somaItens07 += saldoDisponivel07;
							somaItens08 += saldoDisponivel08;
							somaItens09 += saldoDisponivel09;

							precoCalculo = (params.preco == 0 ? model['SALDOS_PRECO'] : 
							                params.preco == 1 ? model['SALDOS_CUSTO'] : model['SALDOS_COMPRA']);

							valorItens01 += (saldoDisponivel01 * precoCalculo);
							valorItens02 += (saldoDisponivel02 * precoCalculo);
							valorItens03 += (saldoDisponivel03 * precoCalculo);
							valorItens04 += (saldoDisponivel04 * precoCalculo);
							valorItens05 += (saldoDisponivel05 * precoCalculo);
							valorItens06 += (saldoDisponivel06 * precoCalculo);
							valorItens07 += (saldoDisponivel07 * precoCalculo);
							valorItens08 += (saldoDisponivel08 * precoCalculo);
							valorItens09 += (saldoDisponivel09 * precoCalculo);							

						} else {
							saldoDisponivel01 = parseInt(model['SALDOS_FILIAL01']) > 10 ? 10 : model['SALDOS_FILIAL01'];
							saldoDisponivel02 = (params.empresa == 2 ? (parseInt(model['SALDOS_FILIAL02']) > 10 ? 10 : model['SALDOS_FILIAL02']) : 0);
							saldoDisponivel03 = (params.empresa == 3 ? (parseInt(model['SALDOS_FILIAL03']) > 10 ? 10 : model['SALDOS_FILIAL03']) : 0);
							saldoDisponivel04 = (params.empresa == 4 ? (parseInt(model['SALDOS_FILIAL04']) > 10 ? 10 : model['SALDOS_FILIAL04']) : 0);
							saldoDisponivel05 = (params.empresa == 5 ? (parseInt(model['SALDOS_FILIAL05']) > 10 ? 10 : model['SALDOS_FILIAL05']) : 0);
							saldoDisponivel06 = (params.empresa == 6 ? (parseInt(model['SALDOS_FILIAL06']) > 10 ? 10 : model['SALDOS_FILIAL06']) : 0);
							saldoDisponivel07 = (params.empresa == 7 ? (parseInt(model['SALDOS_FILIAL07']) > 10 ? 10 : model['SALDOS_FILIAL07']) : 0);
							saldoDisponivel08 = (params.empresa == 8 ? (parseInt(model['SALDOS_FILIAL08']) > 10 ? 10 : model['SALDOS_FILIAL08']) : 0);
							saldoDisponivel09 = (params.empresa == 9 ? (parseInt(model['SALDOS_FILIAL09']) > 10 ? 10 : model['SALDOS_FILIAL09']) : 0);
						}

						const saldoZerado = parseInt(saldoDisponivel01) == 0 && 
											parseInt(saldoDisponivel02) == 0 &&
											parseInt(saldoDisponivel03) == 0 &&
											parseInt(saldoDisponivel04) == 0 &&
											parseInt(saldoDisponivel05) == 0 &&
											parseInt(saldoDisponivel06) == 0 &&
											parseInt(saldoDisponivel07) == 0 &&
											parseInt(saldoDisponivel08) == 0 &&											
						                    parseInt(saldoDisponivel09) == 0;
							
						saldoTotal = parseInt(saldoDisponivel01) + parseInt(saldoDisponivel02) + parseInt(saldoDisponivel03) + parseInt(saldoDisponivel04) + parseInt(saldoDisponivel05) +
						             parseInt(saldoDisponivel06) + parseInt(saldoDisponivel07) + parseInt(saldoDisponivel08) + parseInt(saldoDisponivel09);
						
						let saldoDisponivelLoja = saldoTotal - saldoDisponivel01;

						saldoDisponivel01   = parseInt(saldoDisponivel01)   == 0 ? '' : saldoDisponivel01;
						saldoDisponivel02   = parseInt(saldoDisponivel02)   == 0 ? '' : saldoDisponivel02;
						saldoDisponivel03   = parseInt(saldoDisponivel03)   == 0 ? '' : saldoDisponivel03;
						saldoDisponivel04   = parseInt(saldoDisponivel04)   == 0 ? '' : saldoDisponivel04;
						saldoDisponivel05   = parseInt(saldoDisponivel05)   == 0 ? '' : saldoDisponivel05;
						saldoDisponivel06   = parseInt(saldoDisponivel06)   == 0 ? '' : saldoDisponivel06;
						saldoDisponivel07   = parseInt(saldoDisponivel07)   == 0 ? '' : saldoDisponivel07;
						saldoDisponivel08   = parseInt(saldoDisponivel08)   == 0 ? '' : saldoDisponivel08;
						saldoDisponivel09   = parseInt(saldoDisponivel09)   == 0 ? '' : saldoDisponivel09;
						saldoDisponivelLoja = parseInt(saldoDisponivelLoja) == 0 ? '' : saldoDisponivelLoja;

						if(!saldoZerado) {	
							if(isPrivilegiado) {
								rows.push([
									{
										text: ("00000" + model['PRODUTOS_ID']).slice(-5),
										alignment: 'right',
										style: 'tableExample'
									},							
									{
										text: model['PRODUTOS_UNIDADE'],
										alignment: 'center',
										style: 'tableExample'
									},
									{
										text: model['PRODUTOS_NOME'] + (model['PRODUTOS_MARCA'] ? ' - ' + model['PRODUTOS_MARCA'] : ''),
										alignment: 'left',
										style: 'tableExample'
									},
									{
										text: saldoDisponivel01,
										alignment: 'right'
									},
									{
										text: saldoDisponivel02,
										alignment: 'right'
									},
									{
										text: saldoDisponivel03,
										alignment: 'right'
									},
									{
										text: saldoDisponivel04,
										alignment: 'right'
									},
									{
										text: saldoDisponivel05,
										alignment: 'right'
									},
									{
										text: saldoDisponivel06,
										alignment: 'right'
									},
									{
										text: saldoDisponivel07,
										alignment: 'right'
									},
									{
										text: saldoDisponivel08,
										alignment: 'right'
									},
									{
										text: saldoDisponivel09,
										alignment: 'right'
									},
									{
										text: saldoTotal,
										alignment: 'right'
									},
								]);		
							} else {
								rows.push([
									{
										text: ("00000" + res.results[i]['PRODUTOS_ID']).slice(-5),
										alignment: 'right',
										style: 'tableExample'
									},							
									{
										text: res.results[i]['PRODUTOS_UNIDADE'],
										alignment: 'center',
										style: 'tableExample'
									},
									{
										text: res.results[i]['PRODUTOS_NOME'] + (res.results[i]['PRODUTOS_MARCA'] ? ' - ' + res.results[i]['PRODUTOS_MARCA'] : ''),
										alignment: 'left',
										style: 'tableExample',
										colSpan: 8
									},{},{},{},{},{},{},{},
									{
										text: saldoDisponivel01,
										alignment: 'right'
									},
									{
										text: saldoDisponivelLoja,
										alignment: 'right'
									},
									{
										text: (saldoTotal == 0 ? '' : saldoTotal),
										alignment: 'right'
	
									}
								]);		
							}
							linhasPagina++;
							if(linhasPagina > 29) {linhasPagina = 1;}
						}
					}

					if(isPrivilegiado) {

						if(linhasPagina > 17) {  // Se não houver espaço na mesma página
							rows.push(
								[{
									text: '',
									colSpan: 13,
									pageBreak: 'after',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{}],
							)
						}
						
						rows.push(
							[{
								text: '',
								colSpan: 13,
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{}],
							[{  // Cabeçalho
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'Loja', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: 'Itens',
								alignment: 'center',
								colSpan: 2
							},{},{
								text: 'Total Preço ' + (params.preco == 0 ? 'Venda' : params.preco == 1 ? 'Custo' : 'Compra'),
								alignment: 'center',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 01
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'CD', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens01,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens01),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 02
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'RB', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens02,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens02),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 03
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'CM', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens03,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens03),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 04
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'JF', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens04,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens04),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 05
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'DR', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens05,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens05),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 06
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'AS', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens06,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens06),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 07
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'AN', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens07,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens07),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 08
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'ML', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens08,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens08),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Loja 09
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'FT', 
								colSpan: 2,
								alignment: 'center'
							},{},
							{
								text: somaItens09,
								alignment: 'right',
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens09),
								alignment: 'right',
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}],
							[{  // Total Lojas
								text: '', colSpan: 3, border: [false, false, false, false]},
							{},{},
							{ 
								text: 'TOTAL', 
								colSpan: 2,
								style: {bold: true},
								alignment: 'center'
							},{},
							{
								text: (somaItens01 + somaItens02 + somaItens03 + somaItens04 + somaItens05 +
								       somaItens06 + somaItens07 + somaItens08 + somaItens09),
								alignment: 'right',
								style: {bold: true},								
								colSpan: 2
							},{},{
								text: utils.number.float2moeda(valorItens01 + valorItens02 + valorItens03 + valorItens04 + valorItens05 +
									                           valorItens06 + valorItens07 + valorItens08 + valorItens09),
								alignment: 'right',
								style: {bold: true},								
								colSpan: 3
							},{},{},
							{
								text: '',
								colSpan: 3,
								border: [false, false, false, false]
							},{},{}]

						);
					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
