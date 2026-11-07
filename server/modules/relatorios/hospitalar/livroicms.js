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
    create: (data, params) => { 
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [15, 40, 15, 35],  // E S D I 
			content: [
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Esp Ser Num Dia  UF CFO  VLN  BIC PIC VIC ISE OUT [PESSOA           ]
						widths:  [15, 12, 38, 10, 13, 20,  50, 50, 25, 50, 50, 40, 10, 10, 10, 10, 2],  // 17 Cols.
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(103),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [15, 10]  // 10, 10
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
			api.livroicms().read(params)
				.then(async res => {

					let rows = docDefinition.content[1].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 
					const cents = utils.number.cents.bind(utils.number);					

					let resumoCfop = await obterResumoCfop(params.empresa, params.tipo, params.mes, params.ano, db);
					let resumoUf = await obterResumoUf(params.empresa, params.tipo, params.mes, params.ano, db);

					db.detach();

					let totValorContabil = 0;
					let totBaseIcms = 0;
					let totValorIcms = 0;
					let totIsentas = 0;
					let totOutras = 0;
					let docAnt;
					let docAtu;
					let valorContabil;
					let valorBaseIcms;
					let valorIcms;
					let valorIsentas;
					let valorReducao;
					let valorOutras;
					let valorIpi;

					rows.push(		
						[
							{							
								image: pathLogo,
								width: 80,
								colSpan: 4,
								fontSize: 10,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},
							{ 
								text: 'Registro de ' + (params.tipo == 0 ? 'Entradas' : 'Saidas'),
								colSpan: 9,
								fontSize: 14,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 4,
								fontSize: 10,
								alignment: 'right',
								border: [false, false, false, false]								
							},{},{},{}
						],
						[
							{							
								text: params.empresanome.split('+').join(' '),
								colSpan: 4,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},
							{ 
								text: 'Período: ' + params.mes + '/' + params.ano,
								colSpan: 9,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 4,
								alignment: 'right',
								border: [false, false, false, false]
							},{},{},{},
						],												
						[
							{
								text: 'Esp',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Sér',
								style: 'tableHeader'
							},
							{
								text: 'Docto',
								style: 'tableHeader',
								alignment: 'center'								
							},
							{
								text: 'DT',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'UF',
								style: 'tableHeader',
								alignment: 'center'									
							},								
							{
								text: 'CFOP',
								style: 'tableHeader',
								alignment: 'center'
							},								
							{
								text: 'Valor Contábil',
								style: 'tableHeader',
								alignment: 'center'
							},				
							{
								text: 'Base Icms',
								style: 'tableHeader',
								alignment: 'center'
							},																				
							{
								text: '% Icms',
								style: 'tableHeader',
								alignment: 'center'
							},																												
							{
								text: 'Valor Icms',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Isentas',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Outras',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Pessoa',
								style: 'tableHeader',
								alignment: 'center',
								colSpan: 5
							},{},{},{},{}
						]
					)

					for(let i in res.results){

						docAtu = res.results[i]['MOVIMENTOS_NUMERO'];
						valorContabil = cents(res.results[i]['MOVIMENTOS_TOTAL']);
						valorBaseIcms = cents(res.results[i]['MOVIMENTOS_BASEICMS']);
						valorIcms     = cents(res.results[i]['MOVIMENTOS_VALORICMS']);
						valorIsentas  = cents(res.results[i]['MOVIMENTOS_ISENTAS']);
						valorReducao  = cents(res.results[i]['MOVIMENTOS_REDUCAO']);
						valorIpi      = cents(res.results[i]['MOVIMENTOS_VALORIPI']);
						valorOutras   = Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) > 0 ? Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) : 0;
	
						if(res.results[i]['MOVIMENTOS_STATUS'] == 'C' || res.results[i]['MOVIMENTOS_STATUS'] == 'D') {
							if(docAtu != docAnt) {
								rows.push([
									{
										text: 'NF-e',
										alignment: 'right',
										style: 'tableExample',
										bold: true									
									},							
									{
										text: '1',
										alignment: 'center',
										bold: true,									
										style: 'tableExample'
									},
									{
										text: res.results[i]['MOVIMENTOS_NUMERO'],
										alignment: 'right',
										bold: true,									
										style: 'tableExample'
									},							
									{
										text: res.results[i]['MOVIMENTOS_DATACONTABIL'].split('-')[2],
										alignment: 'right',
										bold: true,									
										style: 'tableExample'
									},
									{
										text: '',
										alignment: 'center',
										bold: true,									
										style: 'tableExample'
									},							
									{
										text: '',
										alignment: 'left',
										bold: true,									
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(0),
										alignment: 'right',
										style: 'tableExample'
									},							
									{
										text: utils.number.float2moeda(0),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(0),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(0),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(0), // Isentas
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(0), // Outras
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: (res.results[i]['MOVIMENTOS_STATUS'] == 'C' ? '*** CANCELADA ***' : '*** DENEGADA ***'),
										colSpan: 5,
										alignment: 'left',
										bold: true,
										style: 'tableExample'
									},{},{},{},{}			
								]);	
							}	
							docAnt = res.results[i]['MOVIMENTOS_NUMERO'];							
						} else {							
							rows.push([
								{
									text: (docAtu != docAnt ? 'NF-e' : ''),
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: (docAtu != docAnt ? '1' : ''),
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: (docAtu != docAnt ? res.results[i]['MOVIMENTOS_NUMERO'] : ''),
									alignment: 'right',
									style: 'tableExample'
								},							
								{
									text: (docAtu != docAnt ? res.results[i]['MOVIMENTOS_DATACONTABIL'].split('-')[2] : ''),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: (docAtu != docAnt ? res.results[i]['MOVIMENTOS_ESTADO'] : ''),
									alignment: 'center',
									style: 'tableExample'
								},							
								{
									text: (res.results[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100000).toFixed(3),
									alignment: 'left',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorContabil / 100),
									alignment: 'right',
									style: 'tableExample'
								},							
								{
									text: utils.number.float2moeda(valorBaseIcms / 100),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_ICMS']), // % Icms
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorIcms / 100),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda((valorIsentas + valorReducao) / 100), // Isentas
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(valorOutras / 100),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: (docAtu != docAnt ? res.results[i]['MOVIMENTOS_NOME'].substr(0, 18) : ''),
									colSpan: 5,
									alignment: 'left',
									style: 'tableExample'
								},{},{},{},{}			
							]);
	
							docAnt = res.results[i]['MOVIMENTOS_NUMERO'];
							totValorContabil += valorContabil
							totBaseIcms += valorBaseIcms;
							totValorIcms += valorIcms;
							totIsentas += (valorIsentas + valorReducao);
							totOutras += valorOutras;
						}

					}

					rows.push([ // Totalizadores
						{
							text: 'TOTAIS',
							colSpan: 6,
							alignment: 'right',
							bold: true,
							style: 'tableExample',
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totValorContabil / 100),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},							
						{
							text: utils.number.float2moeda(totBaseIcms / 100),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(0),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totValorIcms / 100),
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totIsentas / 100), // Isentas
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totOutras / 100), // Total Outras
							alignment: 'right',
							bold: true,							
							style: 'tableExample'
						},
						{
							text: '',
							colSpan: 5,
							alignment: 'left',
							style: 'tableExample'
						},{},{},{},{}			
					]);

					rows.push([ // resumo por CFOP
						{
							text: 'RC',
							color: 'white',
							colSpan: 17,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
					]);

					rows.push([
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]
						},							
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]
						},
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},							
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},							
						{
							text: 'CFOP',
							alignment: 'center',
							style: 'tableExample'
						},
						{
							text: 'Valor Contábil',
							alignment: 'right',
							style: 'tableExample'
						},							
						{
							text: 'Base ICMS',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Valor ICMS',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Isentas',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Outras',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},{},{},{}			
					]);

					for(let i in resumoCfop){

						valorContabil = cents(resumoCfop[i]['MOVIMENTOS_TOTAL']);
						valorBaseIcms = cents(resumoCfop[i]['MOVIMENTOS_BASEICMS']);
						valorIcms     = cents(resumoCfop[i]['MOVIMENTOS_VALORICMS']);
						valorIsentas  = cents(resumoCfop[i]['MOVIMENTOS_ISENTAS']);
						valorReducao  = cents(resumoCfop[i]['MOVIMENTOS_REDUCAO']);
						valorIpi      = cents(resumoCfop[i]['MOVIMENTOS_VALORIPI']);
						valorOutras   = Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) > 0 ? Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) : 0;
 
						rows.push([
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]
							},							
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},							
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},							
							{
								text: (resumoCfop[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100000).toFixed(3),
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorContabil / 100),
								alignment: 'right',
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(valorBaseIcms / 100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorIcms / 100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda((valorIsentas + valorReducao)/100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorOutras / 100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: '',
								colSpan: 5,
								border: [false, false, false, false],
								style: 'tableExample'
							},{},{},{},{}			
						]);

					}

					rows.push([   // Resumo por estado
						{
							text: 'RU',
							color: 'white',
							colSpan: 17,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
					]);

					rows.push([
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]
						},							
						{
							text: '',
							style: 'tableExample',
							border: [false, false, false, false]
						},
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},							
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: '',
							border: [false, false, false, false],
							style: 'tableExample'
						},							
						{
							text: 'UF',
							alignment: 'center',
							style: 'tableExample'
						},
						{
							text: 'Valor Contábil',
							alignment: 'right',
							style: 'tableExample'
						},							
						{
							text: 'Base ICMS',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Valor ICMS',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Isentas',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: 'Outras',
							alignment: 'right',
							style: 'tableExample'
						},
						{
							text: '',
							colSpan: 5,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},{},{},{}			
					]);

					for(let i in resumoUf){  // resumo por UF

						valorContabil = cents(resumoUf[i]['MOVIMENTOS_TOTAL']);
						valorBaseIcms = cents(resumoUf[i]['MOVIMENTOS_BASEICMS']);
						valorIcms     = cents(resumoUf[i]['MOVIMENTOS_VALORICMS']);
						valorIsentas  = cents(resumoUf[i]['MOVIMENTOS_ISENTAS']);
						valorReducao  = cents(resumoUf[i]['MOVIMENTOS_REDUCAO']);
						valorIpi      = cents(resumoUf[i]['MOVIMENTOS_VALORIPI']);
						valorOutras   = Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) > 0 ? Math.abs(valorContabil - valorBaseIcms - valorIsentas - valorReducao) : 0;

						rows.push([
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]
							},							
							{
								text: '',
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},							
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},
							{
								text: '',
								border: [false, false, false, false],
								style: 'tableExample'
							},							
							{
								text: resumoUf[i]['CIDADES_ESTADO'],
								alignment: 'left',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorContabil / 100),
								alignment: 'right',
								style: 'tableExample'
							},							
							{
								text: utils.number.float2moeda(valorBaseIcms / 100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(0),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorIcms / 100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda((valorIsentas + valorReducao)/100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(valorOutras/100),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: '',
								colSpan: 5,
								border: [false, false, false, false],
								style: 'tableExample'
							},{},{},{},{}			
						]);

					}

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const obterResumoCfop = function(empresa, tipo, mes, ano, db) {
    return new Promise(async (resolve, reject) => {
		const ultimoDiaMes = moment(`${ano}-${mes}-01`, 'YYYY-MM-DD').endOf('month').format('DD');
		let sqlTipo = tipo == 0 ? ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5) ` : ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3) `;
		let sqlDataContabil = tipo == 0 ? `MOVIMENTOS_ENTRADASAIDA` : `MOVIMENTOS_EMISSAO`;

		let sql = `select MOVIMENTOSITENS_ID_OPERACOES, 
					 	  sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI) as MOVIMENTOS_TOTAL,
		                  sum(MOVIMENTOSITENS_BASEICMS) as MOVIMENTOS_BASEICMS,
						  sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS,
						  sum(MOVIMENTOSITENS_VALORIPI) as MOVIMENTOS_VALORIPI,
						  sum(case when (cast(MOVIMENTOSITENS_CST as integer) = 40) or (cast(MOVIMENTOSITENS_CST as integer) = 240)
						  then (MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI) ELSE 0 END) MOVIMENTOS_ISENTAS,
    					  sum(case when (cast(MOVIMENTOSITENS_CST as integer) = 20) or 
							  (cast(MOVIMENTOSITENS_CST as integer) = 70)
						  then (abs(MOVIMENTOSITENS_BASEICMS - MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI)) ELSE 0 END) MOVIMENTOS_REDUCAO

	               from MOVIMENTOSITENS
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				   where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa} ${sqlTipo}
				     and (MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D')				   
					 and ${sqlDataContabil} between '01.${mes}.${ano}' and '${ultimoDiaMes}.${mes}.${ano}' 
					 group by MOVIMENTOSITENS_ID_OPERACOES`

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

const obterResumoUf = function(empresa, tipo, mes, ano, db) {
    return new Promise(async (resolve, reject) => {
		const ultimoDiaMes = moment(`${ano}-${mes}-01`, 'YYYY-MM-DD').endOf('month').format('DD');
		let sqlTipo = tipo == 0 ? ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5) ` : ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3) `;
		let sqlDataContabil = tipo == 0 ? `MOVIMENTOS_ENTRADASAIDA` : `MOVIMENTOS_EMISSAO`;

		let sql = `select CIDADES_ESTADO,
  						  sum(MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
						      MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI) as MOVIMENTOS_TOTAL,
		                  sum(MOVIMENTOSITENS_BASEICMS) as MOVIMENTOS_BASEICMS,
						  sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS,
						  sum(MOVIMENTOSITENS_VALORIPI) as MOVIMENTOS_VALORIPI,
						  sum(case when (cast(MOVIMENTOSITENS_CST as integer) = 40) or (cast(MOVIMENTOSITENS_CST as integer) = 240)
						  then (MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI) ELSE 0 END) MOVIMENTOS_ISENTAS,
						  sum(case when (cast(MOVIMENTOSITENS_CST as integer) = 20) or 
							  (cast(MOVIMENTOSITENS_CST as integer) = 70)
						  then (abs(MOVIMENTOSITENS_BASEICMS - MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + 
							  MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORST + MOVIMENTOSITENS_VALORIPI)) ELSE 0 END) MOVIMENTOS_REDUCAO
	               from MOVIMENTOSITENS
				   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
				   join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
				   join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
				   where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa} ${sqlTipo}
				     and (MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D')
					 and ${sqlDataContabil} between '01.${mes}.${ano}' and '${ultimoDiaMes}.${mes}.${ano}' 
					 group by CIDADES_ESTADO`

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