'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

const getVendaUsuario = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, clientname, tipo, documento, vendedor, inicio, final} = params;
		const db = await samosFB.conectarBanco(params.client);

		let sqlEmpresa = '';
		let sqlDocumento = '';
		let sqlUsuario = '';
		let sqlSearch = '';

		if(empresa > 0) {
			sqlEmpresa = ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(documento > 0) {
			sqlDocumento = ` and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '000${documento}' `;
		}

		if(vendedor > 0) {
			sqlUsuario = ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
		} 

		if(clientname == 'prudenmoveis') {
			sqlSearch = `execute block returns (
				USUARIOS_ID_EMPRESAS integer,
				EMPRESAS_FANTASIA varchar(50),
				USUARIOS_ID integer,
				USUARIOS_NOME varchar(50),
				MOVIMENTOS_QTDEVENDAS integer,
				MOVIMENTOS_VALORPARTIDA numeric(14,2),
				MOVIMENTOS_TOTAL numeric(14, 2),      
				MOVIMENTOS_PRECOMINIMO numeric(14, 2),
				MOVIMENTOS_COMISSAO numeric(14, 2)    
			)
			as
			begin
				for
					select MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME from MOVIMENTOS
					join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
					join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
					where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
						  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
						  MOVIMENTOS_STATUS <> 'C' ${sqlEmpresa} ${sqlUsuario}
					group by MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME
					into :USUARIOS_ID_EMPRESAS,
						 :EMPRESAS_FANTASIA,
						 :USUARIOS_ID,
						 :USUARIOS_NOME
				do
					begin
						MOVIMENTOS_QTDEVENDAS = 0;
						MOVIMENTOS_VALORPARTIDA = 0;
						MOVIMENTOS_TOTAL = 0;
						MOVIMENTOS_PRECOMINIMO = 0;
						MOVIMENTOS_COMISSAO = 0;

						select count(*) from MOVIMENTOS
						where MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
							MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
							right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
							MOVIMENTOS_STATUS <> 'C'
						into
							:MOVIMENTOS_QTDEVENDAS;

						select sum(MOVIMENTOSITENS_IMPOSTO),
							   sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS),
							   sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_VALORPISST),
							   sum(round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2))
						from MOVIMENTOSITENS
						join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
						join SALDOS on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS     
						where MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
							  MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
							right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
							MOVIMENTOS_STATUS <> 'C'
						into
							:MOVIMENTOS_VALORPARTIDA,
							:MOVIMENTOS_TOTAL,
							:MOVIMENTOS_PRECOMINIMO,
							:MOVIMENTOS_COMISSAO;
						if (MOVIMENTOS_VALORPARTIDA > 0) then  suspend;
					end
			end;`    
		} else {  // Demais clientes, não existe partida.
			if(tipo == 0) {  // Sintético
				sqlSearch = `select MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
										sum(MOVIMENTOS_TOTAL - MOVIMENTOS_FRETE - MOVIMENTOS_DESPESAS) as MOVIMENTOS_VALORTOTAL from MOVIMENTOS
								join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
								join CIDADES on CIDADES_ID = USUARIOS_ID_CIDADES       
										where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
										((MOVIMENTOS_STATUS <> 'C') and 
										 (MOVIMENTOS_STATUS <> 'D') and
										 (MOVIMENTOS_STATUS <> 'R') and
										 (MOVIMENTOS_STATUS <> 'V')) ${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
								group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO`
			} else { // Analítico
				sqlSearch = `select MOVIMENTOS_ID_DOCUMENTOS, 
									MOVIMENTOS_NUMERO, 
									MOVIMENTOS_SERIE, 
									MOVIMENTOS_ID_USUARIOS, 
									USUARIOS_NOME, 
									MOVIMENTOS_ID_PESSOAS, 
									MOVIMENTOS_NOME,
									CIDADES_NOME, 
									CIDADES_ESTADO, 
									MOVIMENTOS_EMISSAO, 
									MOVIMENTOS_ENTRADASAIDA,
									MOVIMENTOSITENS_ID_PRODUTOS, 
									PRODUTOS_NOME, 
									MOVIMENTOSITENS_QUANTIDADE, 
									MOVIMENTOS_MARGEM,
									MOVIMENTOS_SEGURO,
									MOVIMENTOSITENS_MARGEM,
									MOVIMENTOSITENS_SEGURO,
									MOVIMENTOSITENS_CUSTO,
									MOVIMENTOSITENS_VALORCOFINSST,
									SALDOS_CUSTO,
									(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
							from MOVIMENTOSITENS
							left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
							left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
							left outer join SALDOS on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS
							left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
							left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
							left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
							where ((MOVIMENTOS_STATUS <> 'C') and 
								   (MOVIMENTOS_STATUS <> 'D') and
								   (MOVIMENTOS_STATUS <> 'R') and
								   (MOVIMENTOS_STATUS <> 'V')) and
							MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
							${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
							ORDER BY MOVIMENTOS_ID_USUARIOS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
			}
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
		if(params.tipo == 0) { // Sintético (10 Cols.)
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
					{
						style: 'tableExample',
						table: { //   COD  [VEN  ]  MUN  UF TOT MRK RES %FA REG
							widths:   [30, 100, 70, 100, 15, 55, 25, 25, 25, 25],
							headerRows: 3,
							body: []
						}
					}
				],
				footer: function(page, pages) {
					return { 
						stack: [ 
							'_'.repeat(100),  // antes 95
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
		} else {  // Analítico (12 Cols.)
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},  // 12 Colunas
					{
						style: 'tableExample',
						table: { //   TIP  DOC SER COD  PES EMI PRO  DES QTD TOT MRK RES 
							widths:   [13,  25, 13, 20, 130, 35, 20, 100, 30, 30, 22, 20],
							headerRows: 3,
							body: []
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
		}

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			getVendaUsuario(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;
					let totalVendas = 0;

					let totalQtdDocto = 0;
					let totalVlrDocto = 0;
					let mrkDocto = 0;
					let resDocto = 0;

					let totalQtdVendedor = 0;
					let totalVlrVendedor = 0;
					let totalCusVendedor = 0;
					let totalMrkVendedor = 0;
					let totalResVendedor = 0;
					
					let geralQtdVendedor = 0;
					let geralVlrVendedor = 0;
					let geralCusVendedor = 0;
					let geralMrkVendedor = 0;
					let geralResVendedor = 0;


					let docAnt;
					let docAtu;
					let venAnt;
					let model;
					let percFat = 0;
					let reguFat = 0;

					for(let t in res.results) {
						totalVendas += cents(res.results[t]['MOVIMENTOS_VALORTOTAL']);
					}

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

					if(params.tipo == 0) { // Sintético
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
									text: 'Relatório de Vendas por Vendedor - Sintético',
									colSpan: 6,
									fontSize: 12,
									alignment: 'center',
									color: 'blue',
									border: [false, false, false, false]
								},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									colSpan: 2,
									fontSize: 8,
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
									colSpan: 6,
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
						);
						
						rows.push( 
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome do Vendedor',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2
								},{},
								{
									text: 'Cidade',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'UF',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Total',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'MarkUp',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Result',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '% SFAT',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Regua',
									style: 'tableHeader',
									alignment: 'center'									
								}
							]
						)	
					} else { // Analítico
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
									text: 'Relatório de Vendas por Vendedor - Analítico',
									colSpan: 8,
									fontSize: 12,
									alignment: 'center',
									color: 'blue',
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									colSpan: 2,
									fontSize: 8,
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
						);
						
						rows.push( 
							[
								{
									text: 'TIP',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Docto',
									style: 'tableHeader',
									alignment: 'center',
								},
								{
									text: 'Sér',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Cód',
									style: 'tableHeader',
									alignment: 'center'									
								},					
								{
									text: 'Pessoa',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Emissão',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Prod',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Descrição',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Qtde',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Valor Total',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'MarkUp',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Result',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)	
					}

					if(params.tipo == 0) {  // Sintético
						let totalCusto = 0;
						for(let i in res.results){
							percFat = ((cents(res.results[i]['MOVIMENTOS_VALORTOTAL']) / totalVendas) * 100);
							reguFat += percFat;
	
                            let custoUsuario = await getCustoUsuario(res.results[i]['MOVIMENTOS_ID_USUARIOS'], params, db);
							let markUsuario = (((cents(res.results[i]['MOVIMENTOS_VALORTOTAL']) / cents(custoUsuario)) - 1) * 100);
							let resUsuario = (100 - ((cents(custoUsuario) / cents(res.results[i]['MOVIMENTOS_VALORTOTAL'])) * 100));

                            totalCusto += cents(custoUsuario);

							rows.push([
								{
									text: ('00000' + res.results[i]['MOVIMENTOS_ID_USUARIOS']).slice(-5),
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: res.results[i]['USUARIOS_NOME'],
									alignment: 'left',
									colSpan: 2,
									style: 'tableExample',
								},{},
								{
									text: res.results[i]['CIDADES_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['CIDADES_ESTADO'],
									alignment: 'center',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_VALORTOTAL']),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(markUsuario),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(resUsuario),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(percFat),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(reguFat),
									alignment: 'right',
									style: 'tableExample'
								}
							]);	
							
						}
	
						rows.push([
							{
								text: 'TOTAIS:',
								alignment: 'right',
								colSpan: 5,
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: utils.number.float2moeda(totalVendas / 100),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]							
							},
							{
								text: utils.number.float2moeda(((totalVendas / totalCusto)  - 1) * 100), // Markup
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]							
							},
							{
								text: utils.number.float2moeda((100 - (totalCusto / totalVendas * 100))), // Result
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]							
							},
							{
								text: utils.number.float2moeda(totalCusto / 100),
								alignment: 'right',
								style: 'tableExample',
								colSpan: 2,
								border: [false, false, false, false]							
							},{}							
						]);	
					} else {  // Analítico
						for(let i in res.results){

							model = res.results[i]; 

							docAtu = model['MOVIMENTOS_NUMERO'];

							let tipDoc = siglaDocumento(model['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4));

							if(docAnt != model['MOVIMENTOS_NUMERO']) {
								if(totalVlrDocto > 0) {
									rows.push([
										{
											text: 'Total do Documento',
											colSpan: 8,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totalQtdDocto),
											bold: true,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalVlrDocto),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(mrkDocto),
											bold: true,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(resDocto),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},

									]);			
								}
								totalVlrDocto = 0;
								totalQtdDocto = 0;
								mrkDocto = model['MOVIMENTOS_SEGURO'];
								resDocto = model['MOVIMENTOS_MARGEM'];									
							}

							if(venAnt != model['MOVIMENTOS_ID_USUARIOS']) {
								if(totalVlrVendedor > 0) {
									totalMrkVendedor = ((totalVlrVendedor / totalCusVendedor)  - 1) * 100;
									totalResVendedor = (100 - (totalCusVendedor / totalVlrVendedor * 100));
									rows.push([
										{
											text: 'Total do Vendedor',
											colSpan: 8,
											alignment: 'right',
											bold: true,
											style: 'tableExample',
											border: [false, false, false, false]											
										},{},{},{},{},{},{},{},
										{
											text: utils.number.float2moeda(totalQtdVendedor),
											bold: true,
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalVlrVendedor),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalMrkVendedor),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										},
										{
											text: utils.number.float2moeda(totalResVendedor),
											alignment: 'right',
											style: 'tableExample',
											border: [false, false, false, false]											
										}
									]);			
								}
								rows.push([
									{
										text: '****** VENDEDOR: ' + ("00000" + model['MOVIMENTOS_ID_USUARIOS']).slice(-5) + ' ' + model['USUARIOS_NOME'] + ' ******',
										colSpan: 12,
										fontSize: 10,
										alignment: 'center',
										bold: true,
										style: 'tableExample',
										border: [false, false, false, false]											
									},{},{},{},{},{},{},{},{},{},{},{}
								]);			
								venAnt           = model['MOVIMENTOS_ID_USUARIOS'];
								totalVlrVendedor = 0;
								totalQtdVendedor = 0;
								totalCusVendedor = 0;
								totalMrkVendedor = 0;
								totalResVendedor = 0;
							}

							rows.push([
								{
									text: docAtu == docAnt ? '' : tipDoc,
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_ID_PESSOAS'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : model['MOVIMENTOS_NOME'].substring(0, 40),
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: docAtu == docAnt ? '' : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]
								},
								{
									text: model['PRODUTOS_NOME'].substring(0, 30),
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_QUANTIDADE']),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_SEGURO']),  // MarkUp
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								},
								{
									text: utils.number.float2moeda(model['MOVIMENTOSITENS_MARGEM']), // Result
									alignment: 'right',
									style: 'tableExample',
									border: [false, false, false, false]									
								}
							]);	

							totalQtdDocto    += model['MOVIMENTOSITENS_QUANTIDADE'];
							totalQtdVendedor += model['MOVIMENTOSITENS_QUANTIDADE'];
							geralQtdVendedor += model['MOVIMENTOSITENS_QUANTIDADE'];

							totalCusVendedor += (model['MOVIMENTOSITENS_QUANTIDADE'] * (model['MOVIMENTOSITENS_CUSTO'] + model['MOVIMENTOSITENS_VALORCOFINSST']));
							geralCusVendedor += (model['MOVIMENTOSITENS_QUANTIDADE'] * (model['MOVIMENTOSITENS_CUSTO'] + model['MOVIMENTOSITENS_VALORCOFINSST']));

							totalVlrDocto    += model['MOVIMENTOSITENS_TOTAL'];
							totalVlrVendedor += model['MOVIMENTOSITENS_TOTAL'];
							geralVlrVendedor += model['MOVIMENTOSITENS_TOTAL'];

							if(docAnt != model['MOVIMENTOS_NUMERO']) {
								docAnt = model['MOVIMENTOS_NUMERO'];
							}
							
						}

						rows.push([
							{
								text: 'Total do Documento',
								colSpan: 8,
								bold: true,
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalQtdDocto),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalVlrDocto),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(mrkDocto),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(resDocto),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							}
						]);

						totalMrkVendedor = ((totalVlrVendedor / totalCusVendedor)  - 1) * 100;
						totalResVendedor = (100 - (totalCusVendedor / totalVlrVendedor * 100));

						rows.push([
							{
								text: 'Total do Vendedor',
								colSpan: 8,
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(totalQtdVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalVlrVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalMrkVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(totalResVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							}
						]);

						geralMrkVendedor = ((geralVlrVendedor / geralCusVendedor)  - 1) * 100;
						geralResVendedor = (100 - (geralCusVendedor / geralVlrVendedor * 100));

						rows.push([
							{
								text: 'Geral Vendedor',
								colSpan: 8,
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},
							{
								text: utils.number.float2moeda(geralQtdVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(geralVlrVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(geralMrkVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
							},
							{
								text: utils.number.float2moeda(geralResVendedor),
								alignment: 'right',
								bold: true,
								style: 'tableExample',
								border: [false, false, false, false]
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

const getCustoUsuario = function(usuario, params, db) {
    return new Promise(async (resolve, reject) => {
		
		let sqlEmpresa = '';
		let sqlUsuario = ` and MOVIMENTOS_ID_USUARIOS = ${usuario} `;

		if(params.empresa > 0) {
			sqlEmpresa = ` and MOVIMENTOS_ID_EMPRESAS = ${params.empresa} `;
		}

		let sql = `select MOVIMENTOS_ID_USUARIOS, sum(MOVIMENTOSITENS_QUANTIDADE * (MOVIMENTOSITENS_CUSTO + MOVIMENTOSITENS_VALORCOFINSST)) as MOVIMENTOS_CUSTO from MOVIMENTOSITENS
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
	             	where MOVIMENTOS_EMISSAO between  '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}' and
                   right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0002' and
		           MOVIMENTOS_STATUS <> 'C' ${sqlEmpresa} ${sqlUsuario}
                   group by MOVIMENTOS_ID_USUARIOS`;

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
				let custototal = results[0] ? results[0]['MOVIMENTOS_CUSTO'] : 0;

                resolve(custototal);
            }
        });
    });
};