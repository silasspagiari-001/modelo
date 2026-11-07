'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{}]}, // 11 Cols
				{
					style: 'tableExample',
					table: { //   NUM SER ORD  PES EMI VCT DTP ATR ORI VLR  PRZ
						widths:   [30, 15, 15, 140, 40, 40, 40, 25, 50, 50, 20],  // 10 Cols.
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
				tableParcial: {
					fontSize: 7,
					color: 'blue',
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
            api['relatorios/lislais/comissoes']().read(params)
				.then(async res => {

					let rows = docDefinition.content[1].table.body;

					let totOriVendedor = 0;
					let totAbeVendedor = 0;
					let totPgoVendedor = 0;
					let totOriGeral = 0;
					let totAbeGeral = 0;
					let totPgoGeral = 0;
					let ultimoVendedor = 0;

					let pathLogo;
					let dataPagamento;

					const db = await samosFB.conectarBanco(params.client); 					
					let baixasParciaisVendedor = [];

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
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'RELAÇÃO DE TÍTULOS A RECEBER POR VENDEDOR',
								colSpan: 7,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								border: [false, false, false, false],
								colSpan: 2								
							},{}
						],
						[
							{							
								text: '',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: `${params.ordem == 0 ? ' Vencimento: ' : ' Pagamento: '}` + params.vctinicio + ' a ' + params.vctfinal,
								colSpan: 7,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],												
						[
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'Sér',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Ord',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Cliente',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'									
							},							
							{
								text: 'Vencimento',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Pagamento',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Atr',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor Original',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Valor ABE/PGO',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Prazo',
								style: 'tableHeader',
								alignment: 'center'
							}
						]
					)

					for(let i in res.results){

						if(parseInt(res.results[i]['FINANCEIROS_ATRASO']) > 90) {  // Só paga comissão de títulos pagos até 90 dias atrás.
							continue;
						}

						if(ultimoVendedor !== res.results[i]['FINANCEIROS_ID_USUARIOS']) { 
							if(ultimoVendedor > 0) {
								if(params.status != 1) { // Se não for relação de abertos
									baixasParciaisVendedor = await obterBaixasParciaisVendedor(params.empresa, ultimoVendedor, params.vctinicio, params.vctfinal, db);
								}
								if(baixasParciaisVendedor.length > 0) {
									for(let j in baixasParciaisVendedor) {
										let baixa = baixasParciaisVendedor[j];
										rows.push([
											{
												text: baixa['FINANCEIROS_NUMERO'],
												alignment: 'right',
												style: 'tableParcial',
											},							
											{
												text: baixa['FINANCEIROS_SERIE'],
												alignment: 'center',
												style: 'tableParcial',
											},
											{
												text: baixa['FINANCEIROS_PARCELA'],
												alignment: 'right',
												style: 'tableParcial',
											},
											{
												text: 'Baixa Parcial',
												alignment: 'left',
												style: 'tableParcial',
											},
											{
												text: '',
												alignment: 'center',
												style: 'tableParcial',
											},
											{
												text: '',
												alignment: 'center',
												style: 'tableParcial',
											},
											{
												text: moment(baixa['FINANCEIROSITENS_EMISSAO']).format('DD/MM/YYYY'),
												alignment: 'center',
												style: 'tableParcial',
											},
											{
												text: '',
												style: 'tableParcial',
											},
											{
												text: '',
												alignment: 'right',
												style: 'tableParcial',
											},								
											{
												text: utils.number.float2moeda((utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS'])) / 100),
												alignment: 'right',
												style: 'tableParcial',
											},								
											{
												text: 'Parc',
												alignment: 'center',
												style: 'tableParcial',
											}
										]);			
										totPgoVendedor += utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS']);
										totPgoGeral    += utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS'])
									}
								}
								rows.push([
									{
										text: 'TOTAIS VENDEDOR: ',
										alignment: 'right',
										bold: true,							
										colSpan: 8,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},{},{},{},
									{
										text: utils.number.float2moeda(totOriVendedor),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(totAbeVendedor),
										alignment: 'right',
										bold: true,							
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: '(ABE)',
										border: [false, false, false, false],
									}
								]);	
								if(totPgoVendedor > 0) {
									rows.push([
										{
											text: '',
											colSpan: 9,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totPgoVendedor / 100),
											alignment: 'right',
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
										},
										{
											text: '(PGO)',
											border: [false, false, false, false],
										}
									]);	
								}
							}
							
							ultimoVendedor = res.results[i]['FINANCEIROS_ID_USUARIOS'];	
							baixasParciaisVendedor = [];														
							totOriVendedor = 0;
							totAbeVendedor = 0;
							totPgoVendedor = 0;

							rows.push([
								{
									text: '* * * * * * VENDEDOR: ' +
											res.results[i]['FINANCEIROS_ID_USUARIOS'] + ' - ' + 
											res.results[i]['USUARIOS_NOME'] + ' * * * * * *',
									alignment: 'center',
									bold: true,							
									colSpan: 11,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},{},{},{},{},{},{},{},{}
							]);
						}

						dataPagamento = moment(res.results[i]['FINANCEIROS_PAGAMENTO']);

						rows.push([
							{
								text: res.results[i]['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: res.results[i]['FINANCEIROS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: res.results[i]['FINANCEIROS_PARCELA'],
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: res.results[i]['PESSOAS_NOME'].substring(0, 30),
								alignment: 'left',
								style: 'tableExample',
							},
							{
								text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: dataPagamento.isSameOrBefore('1900-01-01') ? '' : dataPagamento.format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: res.results[i]['FINANCEIROS_ATRASO'],
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),								                                                   
								alignment: 'right',
								style: 'tableExample',
							},								
							{
								text: (res.results[i]['FINANCEIROS_STATUS'] == 'A' ? utils.number.float2moeda(res.results[i]['FINANCEIROS_ABERTO'])
								                                                   : utils.number.float2moeda(res.results[i]['FINANCEIROS_PAGO'])),
								alignment: 'right',
								style: 'tableExample',
							},								
							{
								text: (res.results[i]['FINANCEIROS_STATUS'] == 'A' ? 'Abe' : 'Pago'),
								alignment: 'center',
								style: 'tableExample',
							}
						]);

						totOriVendedor += res.results[i]['FINANCEIROS_ORIGINAL'];
						totOriGeral += res.results[i]['FINANCEIROS_ORIGINAL'];

						if(res.results[i]['FINANCEIROS_STATUS'] == 'A') {
							totAbeVendedor  += res.results[i]['FINANCEIROS_ABERTO'];
							totAbeGeral     += res.results[i]['FINANCEIROS_ABERTO'];
						} else {
							totPgoVendedor  += utils.number.cents(res.results[i]['FINANCEIROS_PAGO']);
							totPgoGeral     += utils.number.cents(res.results[i]['FINANCEIROS_PAGO']);	
						}

					}

					if(params.status != 1) { // Se não for relação de abertos
						baixasParciaisVendedor = await obterBaixasParciaisVendedor(params.empresa, ultimoVendedor, params.vctinicio, params.vctfinal, db);
					}
					if(baixasParciaisVendedor.length > 0) {
						for(let j in baixasParciaisVendedor) {
							let baixa = baixasParciaisVendedor[j];
							rows.push([
								{
									text: baixa['FINANCEIROS_NUMERO'],
									alignment: 'right',
									style: 'tableParcial',
								},							
								{
									text: baixa['FINANCEIROS_SERIE'],
									alignment: 'center',
									style: 'tableParcial',
								},
								{
									text: baixa['FINANCEIROS_PARCELA'],
									alignment: 'right',
									style: 'tableParcial',
								},
								{
									text: 'Baixa Parcial',
									alignment: 'left',
									style: 'tableParcial',
								},
								{
									text: '',
									alignment: 'center',
									style: 'tableParcial',
								},
								{
									text: '',
									alignment: 'center',
									style: 'tableParcial',
								},
								{
									text: moment(baixa['FINANCEIROSITENS_EMISSAO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableParcial',
								},
								{
									text: '',
									style: 'tableParcial',
								},
								{
									text: '',
									alignment: 'right',
									style: 'tableParcial',
								},								
								{
									text: utils.number.float2moeda((utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS'])) / 100),
									alignment: 'right',
									style: 'tableParcial',
								},								
								{
									text: 'Parc',
									alignment: 'center',
									style: 'tableParcial',
								}
							]);			
							totPgoVendedor += utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS']);
							totPgoGeral    += utils.number.cents(baixa['FINANCEIROSITENS_VALOR']) + utils.number.cents(baixa['FINANCEIROSITENS_JUROS']) + utils.number.cents(baixa['FINANCEIROSITENS_TAXAS']) - utils.number.cents(baixa['FINANCEIROSITENS_DESCONTOS']);
						}
					}

					rows.push([
						{
							text: 'TOTAIS VENDEDOR: ',
							alignment: 'right',
							bold: true,							
							colSpan: 8,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totOriVendedor),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totAbeVendedor),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: '(ABE)',
							border: [false, false, false, false],
						}
					]);	
					if(totPgoVendedor > 0) {
						rows.push([
							{
								text: '',
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totPgoVendedor / 100),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},
							{
								text: '(PGO)',
								border: [false, false, false, false],
							}
						]);	
					}

					// GERAIS RELATORIO

					rows.push([
						{
							text: 'TOTAL GERAL: ',
							alignment: 'right',
							bold: true,							
							colSpan: 8,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totOriGeral),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totAbeGeral),
							alignment: 'right',
							bold: true,							
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: '(ABE)',
							border: [false, false, false, false],
						}
					]);	
					if(totPgoGeral > 0) {
						rows.push([
							{
								text: '',
								colSpan: 9,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totPgoGeral / 100),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},
							{
								text: '(PGO)',
								border: [false, false, false, false],
							}
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

const obterBaixasParciaisVendedor = function(empresa, vendedor, inicio, final, db) {
    return new Promise(async (resolve, reject) => {
		let sql = `select 
			FINANCEIROSITENS_VALOR, 
			FINANCEIROSITENS_JUROS, 
			FINANCEIROSITENS_TAXAS, 
			FINANCEIROSITENS_DESCONTOS, 
			FINANCEIROSITENS_DEBITACREDITA,
			FINANCEIROSITENS_EMISSAO,
			FINANCEIROS_NUMERO,
			FINANCEIROS_SERIE, 
			FINANCEIROS_ID_PESSOAS, 
			PESSOAS_NOME,
			FINANCEIROS_PARCELA, 
			FINANCEIROS_EMISSAO,
			FINANCEIROS_VENCIMENTO, 
			FINANCEIROS_ORIGINAL
	from FINANCEIROSITENS
	join FINANCEIROS on FINANCEIROS_ID = FINANCEIROSITENS_ID_FINANCEIROS
	join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
	where FINANCEIROS_ID_USUARIOS = ${vendedor} and
			FINANCEIROS_ID_EMPRESAS = ${empresa} and
			FINANCEIROS_STATUS = 'A' and
			FINANCEIROSITENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
			FINANCEIROSITENS_DEBITACREDITA = 'D'
		order by FINANCEIROSITENS_EMISSAO`

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
