'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getControleBancos = async function(params){
	return new Promise(async (resolve, reject) => {
		const { portador, inicio, final, status } = params;
		const db = await samosFB.conectarBanco(params.client);

		let sqlWhere = ``;

		if(status == 0) {
			sqlWhere += `  if (CONTROLES_STATUS = 'T') then  suspend; `;
		} else if (status == 1) {
			sqlWhere += `  if (CONTROLES_STATUS = 'F') then  suspend; `;
		} else {
			sqlWhere += ` suspend;  `;
		}

		let wherePortadores = portador ? 'where CONTROLES_ID_PORTADORES = ' + `${portador}` : '';

		const sqlSearch = `execute block returns (
			CONTROLES_ID             INTEGER NOT NULL,
			CONTROLES_STATUS         CHAR(1) NOT NULL,
			CONTROLES_ID_PORTADORES  INTEGER NOT NULL,
			CONTROLES_ID_APLICACOES  INTEGER NOT NULL,
			CONTROLES_EMISSAO        DATE NOT NULL,
			CONTROLES_VENCIMENTO     DATE,
			CONTROLES_COMPENSADO     DATE,
			CONTROLES_NOME           VARCHAR(100),
			CONTROLES_DOCUMENTO      VARCHAR(20),
			CONTROLES_TIPO           CHAR(1),
			CONTROLES_VALOR          NUMERIC(12,2),
			VALORSALDO_CONTROLES     NUMERIC(12,2),
			CONTROLES_LOG            VARCHAR(50),
			APLICACOES_NOME          VARCHAR(50),
			PORTADORES_NOME          VARCHAR(50),
			PORTADORES_AGENCIA       VARCHAR(6),
			PORTADORES_CONTA         VARCHAR(15)
		  ) as
			declare variable V_SALDO NUMERIC(12,2);
			begin
			  V_SALDO = 0;
			  for
				select
				  CONTROLES_ID,
				  CONTROLES_STATUS,
				  CONTROLES_ID_PORTADORES,
				  CONTROLES_ID_APLICACOES,
				  CONTROLES_EMISSAO,
				  CONTROLES_VENCIMENTO,
				  CONTROLES_COMPENSADO,
				  CONTROLES_NOME,
				  CONTROLES_DOCUMENTO,
				  CONTROLES_TIPO,
				  CONTROLES_VALOR,
				  CONTROLES_LOG,
				  APLICACOES_NOME,
				  PORTADORES_NOME,
				  PORTADORES_AGENCIA,
				  PORTADORES_CONTA
				from controles
				left outer join APLICACOES on APLICACOES_ID = CONTROLES_ID_APLICACOES
				left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
				${wherePortadores}
				order by CONTROLES_ID_PORTADORES,CONTROLES_VENCIMENTO,CONTROLES_ID
				into
				  :CONTROLES_ID,
				  :CONTROLES_STATUS,
				  :CONTROLES_ID_PORTADORES,
				  :CONTROLES_ID_APLICACOES,
				  :CONTROLES_EMISSAO,
				  :CONTROLES_VENCIMENTO,
				  :CONTROLES_COMPENSADO,
				  :CONTROLES_NOME,
				  :CONTROLES_DOCUMENTO,
				  :CONTROLES_TIPO,
				  :CONTROLES_VALOR,
				  :CONTROLES_LOG,
				  :APLICACOES_NOME,
				  :PORTADORES_NOME,
				  :PORTADORES_AGENCIA,
				  :PORTADORES_CONTA
			  do
				begin
					if(CONTROLES_STATUS = 'T') then
						begin
							if (CONTROLES_TIPO = 'E' ) then
								V_SALDO = V_SALDO + CONTROLES_VALOR;
							else
								V_SALDO = V_SALDO - CONTROLES_VALOR;
							VALORSALDO_CONTROLES = V_SALDO;
						end
				  if (CONTROLES_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}') then
					${sqlWhere}
				end
			end;
		`
		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: 1, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{}]},  // 6 Colunas
				{
					style: 'tableExample',
					table: { //  [DTE, HIS DOC ENT SAI SLD]  // 6 Cols
						widths: (params.tipo == '0' ? [40,  230, 55, 55, 55, 60] : [50, 50, 60, 40, 255, 50]),
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
			getControleBancos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalEntradas = 0;
					let totalSaidas = 0;
					let totalCheques = 0;
					let geralCheques = 0;
					let vctoAnterior;
					let desStatus = (params.status == 0 ? 'Conciliados' : (params.status == 1 ? 'Não Conciliados' : 'Todos'));

					let cabRelatorio = '';

					if(params.tipo == '0') {  // Extrato
						cabRelatorio = (res.results.length > 0 ? `Extrato Bancário\nAgência: ${res.results[0]['PORTADORES_AGENCIA']} Conta: ${res.results[0]['PORTADORES_CONTA']} \nNome: ${res.results[0]['PORTADORES_NOME']}` : 'Extrato Bancário');
					} else {
						cabRelatorio = (res.results.length > 0 ? `Relatório de Cheques Emitidos\nAgência: ${res.results[0]['PORTADORES_AGENCIA']} Conta: ${res.results[0]['PORTADORES_CONTA']} Status: ${desStatus}\nNome: ${res.results[0]['PORTADORES_NOME']}` : 'Relatório de Cheques Emitidos');
					}

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
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: cabRelatorio,
								colSpan: 4,
								fontSize: 10,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								border: [false, false, false, false]								
							}
						],
						[
							{							
								text: ' ',
								alignment: 'left',
								border: [false, false, false, false]
							},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 4,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								border: [false, false, false, false]
							}
						]										
					);

					if(params.tipo == '0')  { // Extrato
						rows.push(											
							[
								{
									text: 'Data',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Histórico',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Documento',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Entradas',
									style: 'tableHeader',
									alignment: 'center'
								},								
								{
									text: 'Saídas',
									style: 'tableHeader',
									alignment: 'center'
								},				
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
								}
							]						
						)
					} else {   // Relatório de cheques
						rows.push(											
							[
								{
									text: 'Emissao',
									alignment: 'center'
								},
								{
									text: 'Vencimento',
									alignment: 'center'
								},
								{
									text: 'Compensado',
									alignment: 'center'
								},								
								{
									text: 'Nro Cheque',
									alignment: 'center'
								},								
								{
									text: 'Histórico',
									alignment: 'center'
								},				
								{
									text: 'Valor',
									alignment: 'center'
								}
							]						
						)
					}

					for(let i in res.results){

						if(params.tipo == '0') {  // Extrato
							rows.push([
								{
									text: moment(res.results[i]['CONTROLES_VENCIMENTO']).format('DD/MM/YYYY'),
									alignment: 'center',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['CONTROLES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['CONTROLES_DOCUMENTO'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: (res.results[i]['CONTROLES_TIPO'] == 'E' ? utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']) : ''),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: (res.results[i]['CONTROLES_TIPO'] == 'S' ? utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']) : ''),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(res.results[i]['VALORSALDO_CONTROLES']),
									alignment: 'right',
									style: 'tableExample',
								}
							]);
						} else {
							if(res.results[i]['CONTROLES_DOCUMENTO'].substring(0, 2).toUpperCase() == 'CH') {
								rows.push([
									{
										text: moment(res.results[i]['CONTROLES_EMISSAO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},							
									{
										text: moment(res.results[i]['CONTROLES_VENCIMENTO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},
									{
										text: moment(res.results[i]['CONTROLES_COMPENSADO'] || '1899-12-30').isSameOrBefore('1900-01-01') ? '' :  moment(res.results[i]['CONTROLES_COMPENSADO']).format('DD/MM/YYYY'),
										alignment: 'center'
									},
									{
										text: res.results[i]['CONTROLES_DOCUMENTO'],
										alignment: 'left'
									},
									{
										text: res.results[i]['CONTROLES_NOME'],
										alignment: 'left'
									},
									{
										text: utils.number.float2moeda(res.results[i]['CONTROLES_VALOR']),
										alignment: 'right'
									}
								]);	
								totalCheques += res.results[i]['CONTROLES_VALOR'];
								geralCheques += res.results[i]['CONTROLES_VALOR'];			
							}
						}

                        totalEntradas   += (res.results[i]['CONTROLES_TIPO'] == 'E' ? res.results[i]['CONTROLES_VALOR'] : 0);
						totalSaidas     += (res.results[i]['CONTROLES_TIPO'] == 'S' ? res.results[i]['CONTROLES_VALOR'] : 0);

					}

					if(params.tipo == '0') {  // Totalizador extrato
						rows.push([
							{
								text: 'TOTAIS',
								colSpan: 3,
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},
							{
								text: utils.number.float2moeda(totalEntradas),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: utils.number.float2moeda(totalSaidas),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{
								text: '',
								border: [false, false, false, false],
							}
						]);	
					} else {   // Totalizador Cheques
						rows.push([
							{
								text: 'TOTAL GERAL',
								colSpan: 5,
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},
							{
								text: utils.number.float2moeda(geralCheques),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'							
							}
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
