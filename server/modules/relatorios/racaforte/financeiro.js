'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 15],
			content: [  //  1  2  3  4  5  6  7  8  9
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Num Pes Msg  UF Emi Vct Pgt Vlr Prz
							   // 1    2   3   4   5   6   7   8   9 
						widths: [30, 200, 35, 10, 40, 40, 40, 50, 35],
						headerRows: 3,
						body: []
					},
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [20, 10]
				};
			},
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
			}
		};
 
        return new Promise(async (resolve, reject) => {
			api.relfinanceiros().read(params)
				.then(res => {
					if(!res.results[0]) {
						resolve({ results: [] });
						return;
					}
					
					
					let rows = docDefinition.content[1].table.body;
					
					let ultimoQ; // Controle de quebra

					let totalOriginal  = 0;
					let totalAberto    = 0;
					let totalJuros     = 0;
					let totalPago      = 0;

					let geralOriginal  = 0;
					let geralAberto    = 0;
					let geralJuros     = 0;
					let geralPago      = 0;

					let quebra         = params.quebra == 'true';
					let semnn          = params.semnn == 'true';
					let ordem          = params.ordem;

					const ordemRelatorio = ordem == 0 ? 'VENCIMENTO' :
					                       ordem == 1 ? 'PAGAMENTO' :
										   ordem == 2 ? 'EMISSAO' :
										   ordem == 3 ? 'PESSOA' :
										   ordem == 4 ? 'NUMERO' :
										   ordem == 5 ? 'PORTADOR' :
										   ordem == 6 ? 'APLICACAO' :
										   ordem == 7 ? 'CENTRO CUSTO' :  
										                'NENHUMA'

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
					



   			       if(ordem == 0) { // VENCIMENTO

                    rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{
								colSpan: 7,
								text: 'RELAÇÃO DE TITULOS A ' + (params.tipo == 'R' ? 'RECEBER' : 'PAGAR') + ' POR ' + ordemRelatorio,
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]
							}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'],
								alignment: 'left',
								style: {bold: true,	fontSize: 5},
								border: [false, false, false, false]																
							},
							{
								colSpan: 7,
								text: 'Vencimento: ' + params.vctinicio + ' a ' + params.vctfinal,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]								
							}
						],	
						[{text: 'Número',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
						 {text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
						 {text: 'UF',           style: 'tableHeader', alignment: 'center'},
						 {text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
						 {text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
						 {text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
						 {text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
                         {text: 'Prazo',        style: 'tableHeader', alignment: 'center'}]
                    )
                };
 

   			       if(ordem == 1) { // PAGAMENTO

                    rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{
								colSpan: 7,
								text: 'RELAÇÃO DE TITULOS A ' + (params.tipo == 'R' ? 'RECEBER' : 'PAGAR') + ' POR ' + ordemRelatorio,
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]
							}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'],
								alignment: 'left',
								style: {bold: true,	fontSize: 5},
								border: [false, false, false, false]																
							},
							{
								colSpan: 7,
								text: 'Pagamento: ' + params.paginicio + ' a ' + params.pagfinal,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]								
							}
						],	
						[{text: 'Número',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
						 {text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
						 {text: 'UF',           style: 'tableHeader', alignment: 'center'},
						 {text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
						 {text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
						 {text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
						 {text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
                         {text: 'Prazo',        style: 'tableHeader', alignment: 'center'}]
                    )
                };
 




   			       if(ordem == 2) { // EMISSAO

                    rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
								alignment: 'left',
								border: [false, false, false, false]
							},
							{
								colSpan: 7,
								text: 'RELAÇÃO DE TITULOS A ' + (params.tipo == 'R' ? 'RECEBER' : 'PAGAR') + ' POR ' + ordemRelatorio,
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]
							}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'],
								alignment: 'left',
								style: {bold: true,	fontSize: 5},
								border: [false, false, false, false]																
							},
							{
								colSpan: 7,
								text: 'Emissão: ' + params.emiinicio + ' a ' + params.emifinal,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 6},
								border: [false, false, false, false]								
							}
						],	
						[{text: 'Número',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
						 {text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
						 {text: 'UF',           style: 'tableHeader', alignment: 'center'},
						 {text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
						 {text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
						 {text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
						 {text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
                         {text: 'Prazo',        style: 'tableHeader', alignment: 'center'}]
                    )
                };




					for(let i in res.results){
						let model = res.results[i];
						if(quebra) {
							if(ordem == 0) { // Quebra 0 - Vencimento
								if(model['FINANCEIROS_VENCIMENTO'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);		
									}
									rows.push([
										{
											text: `****** VENCIMENTO: ${moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push(
											[{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}				   
										]);
									}
									ultimoQ = model['FINANCEIROS_VENCIMENTO'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;
									totalPago = 0;	
								}
							}

							if(ordem == 1) { // Quebra 1 - Pagamento
								if(model['FINANCEIROS_PAGAMENTO'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PAGAMENTO: ${moment(res.results[i]['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_PAGAMENTO'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;	
								}
							}

							if(ordem == 2) { // Quebra 2 - Emissao
								if(model['FINANCEIROS_EMISSAO'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** EMISSAO: ${moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_EMISSAO'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;
								}
							}

							if(ordem == 3) { // Quebra 3 - PESSOA
								if(model['FINANCEIROS_ID_PESSOAS'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PESSOA: ${('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6)} ${model['PESSOAS_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},						 
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_ID_PESSOAS'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;	
								}
							}

							if(ordem == 5) { // Quebra 5 - PORTADOR
								if(model['FINANCEIROS_ID_PORTADORES'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PORTADOR: ${('00000' + model['FINANCEIROS_ID_PORTADORES']).slice(-5)} ${model['PORTADORES_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 0,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_ID_PORTADORES'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;	
								}
							}							

							if(ordem == 6) { // Quebra 6 - APLICACAO
								if(model['FINANCEIROS_ID_APLICACOES'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** APLICACAO: ${('000000' + model['FINANCEIROS_ID_APLICACOES']).slice(-6)} ${model['APLICACOES_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);		
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_ID_APLICACOES'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;	
								}
							}							

							if(ordem == 7) { // Quebra 7 - CENTRO DE CUSTO
								if(model['FINANCEIROS_ID_CUSTOS'] != ultimoQ) {
									if(totalOriginal > 0) {
										rows.push([
											{
												text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
												fontSize: 10,
												bold: true,
												alignment: 'right',
												colSpan: 9,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** CENTRO DE CUSTO: ${('00000' + model['FINANCEIROS_ID_CUSTOS']).slice(-5)} ${model['CUSTOS_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 9,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'left'},
											{text: 'Mensagem',     style: 'tableHeader', alignment: 'center'},
											{text: 'UF',           style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Título',	style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'}
										]);
									}
									ultimoQ = model['FINANCEIROS_ID_CUSTOS'];
									totalOriginal = 0;
									totalAberto = 0;
									totalJuros = 0;									
									totalPago = 0;	
								}
							}
						}

						rows.push([
							{
								text: model['FINANCEIROS_NUMERO'].toString() + '/' + model['FINANCEIROS_PARCELA'].toString(),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: `${('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6)} ${model['PESSOAS_NOME']}`.slice(0, 50),
								alignment: 'left',
								style: 'tableExample'
							},							
							{
								text: model['FINANCEIROS_OBSERVACOES'].slice(0, 10),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['CIDADES_ESTADO'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_PAGAMENTO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' : moment(res.results[i]['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: (model['FINANCEIROS_STATUS'] == 'P' ? '' : model['PRAZOCALCULADO_FINANCEIRO']),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

						totalOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						totalPago      += (model['FINANCEIROS_PAGO'] * 100);
						totalJuros     += (model['FINANCEIROS_JUROS'] * 100);

						geralOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						geralAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						geralPago      += (model['FINANCEIROS_PAGO'] * 100);
						geralJuros     += (model['FINANCEIROS_JUROS'] * 100);

					}
		
					rows.push([
						{
							text: `TOTAIS: (ABERTO) -=> ${utils.number.float2moeda(totalAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(totalJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(totalPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((totalOriginal) / 100)}`,
							fontSize: 10,
							bold: true,
							alignment: 'right',
							colSpan: 9,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{}
					]);															

					rows.push([
						{
							text: `GERAL: (ABERTO) -=> ${utils.number.float2moeda(geralAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(geralJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(geralPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((geralOriginal) / 100)}`,
							fontSize: 10,
							bold: true,
							alignment: 'right',
							colSpan: 9,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{}
					]);															

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
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
	
}