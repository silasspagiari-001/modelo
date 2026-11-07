'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getComissoesFin = async function(params){
	try {
		const { empresa, tipo, vendedor, emiinicio, emifinal} = params;
		let sqlWhere = '';
		let sqlSearch = '';

		if(empresa > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
		}

		if(vendedor > 0) {
			sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
		}
		
		if (tipo == '0') {  // Relatório Sintético
			sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) as BASE,
							sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO01,
							sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO02,
							sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.018) ELSE 0 END) COMISSAO03,
							sum(case when MOVIMENTOS_MARGEM >= 35
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.02) ELSE 0 END) COMISSAO04           
						 from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, sum(MOVIMENTOSCAIXA_DUPLICATA) as BASE,
				sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO01,
				sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO02,
				sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.01) ELSE 0 END) COMISSAO03,
				sum(case when MOVIMENTOS_MARGEM >= 35
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.013) ELSE 0 END) COMISSAO04           
				from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and 
				  MOVIMENTOSCAIXA_DUPLICATA > 0 and                      
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CAR' as TIPO, sum(MOVIMENTOSCAIXA_CREDITO) as BASE,
			sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO01,
			sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO02,
			sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO03,
			sum(case when MOVIMENTOS_MARGEM >= 35
				then (MOVIMENTOSCAIXA_CREDITO * 0.013) ELSE 0 END) COMISSAO04
					   
				from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  MOVIMENTOSCAIXA_CREDITO > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CHE' as TIPO, sum(MOVIMENTOSCAIXA_CHEQUE) as BASE,
				sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
					then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO01,
				sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
					then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO02,
				sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
					then (MOVIMENTOSCAIXA_CHEQUE * 0.018) ELSE 0 END) COMISSAO03,
				sum(case when MOVIMENTOS_MARGEM >= 35
					then (MOVIMENTOSCAIXA_CHEQUE * 0.02) ELSE 0 END) COMISSAO04
				   
				from MOVIMENTOS 
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  MOVIMENTOSCAIXA_CHEQUE > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO`
		} else {    // Analítico
			sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'DIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM,
							sum(MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) as BASE,
							sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO01,
							sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.01) ELSE 0 END) COMISSAO02,
							sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.018) ELSE 0 END) COMISSAO03,
							sum(case when MOVIMENTOS_MARGEM >= 35
								then ((MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) * 0.02) ELSE 0 END) COMISSAO04           
						 from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
			where MOVIMENTOSCAIXA_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_DEBITO) > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'FIN' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM, 
				sum(MOVIMENTOSCAIXA_DUPLICATA) as BASE,
				sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO01,
				sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.005) ELSE 0 END) COMISSAO02,
				sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.01) ELSE 0 END) COMISSAO03,
				sum(case when MOVIMENTOS_MARGEM >= 35
					then (MOVIMENTOSCAIXA_DUPLICATA * 0.013) ELSE 0 END) COMISSAO04
	   
				   from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and MOVIMENTOSCAIXA_DUPLICATA > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CAR' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM,
			sum(MOVIMENTOSCAIXA_CREDITO) as BASE,
			sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO01,
			sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO02,
			sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
				then (MOVIMENTOSCAIXA_CREDITO * 0.01) ELSE 0 END) COMISSAO03,
			sum(case when MOVIMENTOS_MARGEM >= 35
				then (MOVIMENTOSCAIXA_CREDITO * 0.013) ELSE 0 END) COMISSAO04
					   
				from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS                
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  MOVIMENTOSCAIXA_CREDITO > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM
			
			union
			
			select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, 'CHE' as TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM, 
				sum(MOVIMENTOSCAIXA_CHEQUE) as BASE,
				sum(case when MOVIMENTOS_MARGEM > 22.99 and MOVIMENTOS_MARGEM <= 25
					then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO01,
				sum(case when MOVIMENTOS_MARGEM > 25 and MOVIMENTOS_MARGEM < 33
					then (MOVIMENTOSCAIXA_CHEQUE * 0.01) ELSE 0 END) COMISSAO02,
				sum(case when MOVIMENTOS_MARGEM >= 33 and MOVIMENTOS_MARGEM < 35
					then (MOVIMENTOSCAIXA_CHEQUE * 0.018) ELSE 0 END) COMISSAO03,
				sum(case when MOVIMENTOS_MARGEM >= 35
					then (MOVIMENTOSCAIXA_CHEQUE * 0.02) ELSE 0 END) COMISSAO04
				   
				from MOVIMENTOS
			join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
			join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
			join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
			where MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
				  DOCUMENTOS_NOME = 'Pedidos' and
				  MOVIMENTOSCAIXA_CHEQUE > 0 and
				  MOVIMENTOS_STATUS <> 'C' ${sqlWhere}
			group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, TIPO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_NOME, MOVIMENTOS_MARGEM`
		}
		
		const results = await samosFB.executeSQL(sqlSearch, params);

		return {
			results, 
			total  : results.length
		};
	} catch(error) {
		const msg = 'Falha ao buscar comissões fin';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let docDefinition = {};
		if(params.tipo == 0) { // Sintético
			docDefinition = {
				pageOrientation: 'portrait',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{}]},
					{
						style: 'tableExample',
						table: { // EMP   V NOM  DOC   BA  VLR
							widths:   [15, 15, 230, 25, 100, 70],  // 6 Cols.
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
		} else {    // Analítico
			docDefinition = {
				pageOrientation: 'landscape',
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 35],  // E S D I
				content: [
					{columns: [{},{},{},{},{},{},{},{},{}]}, // 9 Cols
					{
						style: 'tableExample',
						table: { // EMP  NUM SE  NOM  TIP  BAS  MRG %COM  VLC
							widths:   [20, 40, 30, 230,  25, 100,  50, 50, 100],  // 9 Cols.
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
							'_'.repeat(140),
							{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
						],
						margin: [25, 10]
					};
				},
				styles: {
					tableExample: {
						fontSize: 10,
						margin: [0, 0, 0, 0],
						border: 0
					},
					tableHeader: {
						bold: true,
						fontSize: 10,
						color: 'black'
					}
				}
			};
		}

    return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			getComissoesFin(params)
				.then(res => {

					let rows = docDefinition.content[1].table.body;

					let totalBase = 0;
					let totalComissao = 0;
					let venBase = 0;
					let venComissao = 0;

          			let vlrComissao = 0;
					let ultimoVendedor = 0;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					if (params.tipo == 0) { // Sintético
							rows.push(
								[
									{							
										image: pathLogo,
										width: 80,
										colSpan: 2,
										fontSize: 10,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'Relatório de Comissões - Sintético',
										colSpan: 3,
										fontSize: 10,
										alignment: 'center',
										border: [false, false, false, false]
									},{},{},
									{
										text: moment.tz(params.timezone).format('DD/MM/YYYY'),
										fontSize: 10,
										alignment: 'right',
										border: [false, false, false, false]								
									}
								],
								[
									{							
										text: ' ',
										colSpan: 2,
										alignment: 'left',
										border: [false, false, false, false]
									},{},
									{ 
										text: 'Período: ' + (params.inicio || params.emiinicio) + ' a ' + (params.final || params.emifinal),
										colSpan: 3,
										alignment: 'center',
										border: [false, false, false, false]
									},{},{},
									{
										text: moment.tz(params.timezone).format('HH:mm:ss'),
										alignment: 'right',
										border: [false, false, false, false]
									}
								],												
								[
									{
										text: 'Ven',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Emp',
										style: 'tableHeader',
										alignment: 'center'									
									},								
									{
										text: 'Nome do Vendedor',
										style: 'tableHeader'
									},
									{
										text: 'Tipo',
										style: 'tableHeader'
									},
									{
										text: 'Base',
										style: 'tableHeader',
										alignment: 'center'									
									},
									{
										text: 'Comissão',
										style: 'tableHeader',
										alignment: 'center'									
									}
								]						
							)

							for(let i in res.results){

								vlrComissao = (res.results[i]['COMISSAO01'] + res.results[i]['COMISSAO02'] + 
															 res.results[i]['COMISSAO03'] + res.results[i]['COMISSAO04']);
															 
								rows.push([
									{
										text: res.results[i]['MOVIMENTOS_ID_USUARIOS'],
										alignment: 'right',
										style: 'tableExample',
									},							
									{
										text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
										alignment: 'right',
										style: 'tableExample',
									},														
									{
										text: res.results[i]['USUARIOS_NOME'],
										alignment: 'left',
										style: 'tableExample'
									},
									{
										text: res.results[i]['TIPO'],
										alignment: 'left',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(res.results[i]['BASE']),
										alignment: 'right',
										style: 'tableExample'
									},
									{
										text: utils.number.float2moeda(vlrComissao),
										alignment: 'right',
										style: 'tableExample'
									}
								]);

								totalBase += res.results[i]['BASE'];
								totalComissao += vlrComissao;
							}

							rows.push([
								{
									text: 'TOTAIS',
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									colSpan: 4,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},{},
								{
									text: utils.number.float2moeda(totalBase),
									alignment: 'right',
									fontSize: 7,
									bold: true,							
									border: [false, false, false, false],
									style: 'tableExample'
								},{
									text: utils.number.float2moeda(totalComissao),
									alignment: 'right',
									fontSize: 7,
									bold: true,
									border: [false, false, false, false],
									style: 'tableExample'
								}
							]);
					} else { // Analítico (9 Colunas)
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
									text: 'Relatório de Comissões - Analítico',
									colSpan: 6,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('DD/MM/YYYY'),
									alignment: 'right',
									border: [false, false, false, false]								
								}
							],
							[
								{							
									text: '',
									colSpan: 2,
									alignment: 'left',
									border: [false, false, false, false]
								},{},
								{ 
									text: 'Período: ' + params.inicio + ' a ' + params.final,
									colSpan: 5,
									alignment: 'center',
									border: [false, false, false, false]
								},{},{},{},{},
								{
									text: moment.tz(params.timezone).format('HH:mm:ss'),
									colSpan: 2,
									alignment: 'right',
									border: [false, false, false, false]
								},{}
							],												
							[
								{
									text: 'Emp',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nº',
									style: 'tableHeader'
								},
								{
									text: 'Série',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Nome',
									style: 'tableHeader',
									alignment: 'center'									
								},
								{
									text: 'Tipo',
									style: 'tableHeader',
									alignment: 'center'									
								},							
								{
									text: 'Base',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '% Margem',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '% Com',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Valor Comissão',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						)

						for(let i in res.results){

							if(ultimoVendedor !== res.results[i]['MOVIMENTOS_ID_USUARIOS']) { 
								if(ultimoVendedor > 0) {
									rows.push([
										{
											text: 'Total Vendedor',
											alignment: 'right',
											bold: true,							
											colSpan: 5,
											border: [false, false, false, false],
											style: 'tableExample'							
										},{},{},{},{},
										{
											text: utils.number.float2moeda(venBase),
											alignment: 'right',
											bold: true,							
											border: [false, false, false, false],
											style: 'tableExample'
										},{
											text: utils.number.float2moeda(venComissao),
											alignment: 'right',
											bold: true,			
											colSpan: 3,				
											border: [false, false, false, false],
											style: 'tableExample'											
										},{},{}
									]);												
								}
								ultimoVendedor = res.results[i]['MOVIMENTOS_ID_USUARIOS'];								
								venBase = 0;
								venComissao = 0;
								rows.push([
									{
										text: 'Vendedor: ' +
											  res.results[i]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + 
											  res.results[i]['USUARIOS_NOME'],
										alignment: 'center',
										bold: true,							
										colSpan: 9,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{},{},{},{},{},{},{},{}
								]);
							}

							vlrComissao = (res.results[i]['COMISSAO01'] + res.results[i]['COMISSAO02'] +
						                 res.results[i]['COMISSAO03'] + res.results[i]['COMISSAO04'])

							rows.push([
								{
									text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
									alignment: 'right',
									style: 'tableExample',
								},							
								{
									text: res.results[i]['MOVIMENTOS_NUMERO'],
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_SERIE'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: res.results[i]['MOVIMENTOS_NOME'],
									alignment: 'left',
									style: 'tableExample',
								},
								{
									text: res.results[i]['TIPO'],
									alignment: 'center',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(res.results[i]['BASE']),
									alignment: 'right',
									style: 'tableExample',
								},								
								{
									text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_MARGEM']),
									alignment: 'right',
									style: 'tableExample',
								},
								{
									text: utils.number.float2moeda(perComissao(res.results[i]['MOVIMENTOS_MARGEM'], res.results[i]['TIPO'])),
									alignment: 'right',
									style: 'tableExample'
								},
								{
									text: utils.number.float2moeda(vlrComissao),
									alignment: 'right',
									style: 'tableExample'
								},
							]);

							venBase     += res.results[i]['BASE'];
							venComissao += vlrComissao;
						}

						rows.push([
							{
								text: 'Total Vendedor',
								alignment: 'right',
								bold: true,							
								colSpan: 5,
								border: [false, false, false, false],
								style: 'tableExample'							
							},{},{},{},{},
							{
								text: utils.number.float2moeda(venBase),
								alignment: 'right',
								bold: true,							
								border: [false, false, false, false],
								style: 'tableExample'
							},{
								text: utils.number.float2moeda(venComissao),
								alignment: 'right',
								bold: true,			
								colSpan: 3,				
								border: [false, false, false, false],
								style: 'tableExample'											
							},{},{}
						]);												

					}  // Fim do analítico

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				}); 
        });
    }
};

let perComissao = function(margem, tipo) {
	let percComissao = 0;

	if(tipo == 'DIN') {
		if(margem > 22.99 && margem <= 25) {
			percComissao =  1
		} else if(margem > 25 && margem < 33) {
			percComissao = 1
		} else if(margem >= 33 && margem < 35) {
			percComissao = 1.8
		} else if(margem >= 35) {
			percComissao = 2
		}
	}	

	if(tipo == 'FIN') {
		if(margem > 22.99 && margem <= 25) {
			percComissao =  0.5
		} else if(margem > 25 && margem < 33) {
			percComissao = 0.5
		} else if(margem >= 33 && margem < 35) {
			percComissao = 1
		} else if(margem >= 35) {
			percComissao = 1.3
		}
	}	

	if(tipo == 'CAR') {
		if(margem > 22.99 && margem <= 25) {
			percComissao =  1
		} else if(margem > 25 && margem < 33) {
			percComissao = 1
		} else if(margem >= 33 && margem < 35) {
			percComissao = 1
		} else if(margem >= 35) {
			percComissao = 1.3
		}
	}	

	if(tipo == 'CHE') {
		if(margem > 22.99 && margem <= 25) {
			percComissao =  1
		} else if(margem > 25 && margem < 33) {
			percComissao = 1
		} else if(margem >= 33 && margem < 35) {
			percComissao = 1.8
		} else if(margem >= 35) {
			percComissao = 2
		}
	}	

	return percComissao;
};
