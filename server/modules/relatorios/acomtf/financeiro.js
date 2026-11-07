'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getFinanceiros = async function(params){
	try {
		const { 
			empresa,
			empresacnpj,
			tipo,
			pesinicio,
			pesfinal,
			porinicio,
			porfinal,
			aplinicio,
			aplfinal,
			cusinicio,
			cusfinal,
			vloinicio,
			vlofinal,
			emiinicio,
			emifinal,
			vctinicio,
			vctfinal,
			paginicio,
			pagfinal,
			quebra,
			semnn,
			ordem,
			status,
			codprofis,
			nomeprofis,
			start,
			limit
		} = params;

		let sqlOrder = '';
		let sqlEmpresa   = empresa   ? `and FINANCEIROS_ID_EMPRESAS   = ${empresa} `   : '';
		let sqlPessoa    = tipo == 'T' 
						   ? ((pesinicio && pesfinal) ? `and ((FINANCEIROS_ID_PESSOAS = ${pesinicio}) or (FINANCEIROS_ID_PESSOAS = ${pesfinal})) ` : '')
						   : ((pesinicio && pesfinal) ? `and FINANCEIROS_ID_PESSOAS between ${pesinicio} and  ${pesfinal} `  : '');

		let sqlPortador  = (porinicio && porfinal) ? `and FINANCEIROS_ID_PORTADORES between ${porinicio} and  ${porfinal} `  : '';
		let sqlAplicacao = (aplinicio && aplfinal) ? `and FINANCEIROS_ID_APLICACOES between ${aplinicio} and  ${aplfinal} `  : '';
		let sqlCusto     = (cusinicio && cusfinal) ? `and FINANCEIROS_ID_CUSTOS between ${cusinicio} and  ${cusfinal} `  : '';
		let sqlSemnn     = semnn == 'true' ? ' and ((FINANCEIROS_NOSSONUMERO = 0) or (FINANCEIROS_NOSSONUMERO is null))' : '';
		let sqlProfissio = codprofis ? ` and MOVIMENTOS_PROTOCOLO = '${codprofis}' ` : '';
		let sqlWhere = `where FINANCEIROS_ID > 0 ${sqlEmpresa} 
												 ${sqlPessoa} 
												 ${sqlPortador} 
												 ${sqlAplicacao} 
												 ${sqlCusto} 
												 ${sqlSemnn}
												 ${sqlProfissio} `;

		if(tipo && tipo != 'T') {                                                     
			if(status == 0) {
				sqlWhere += ` and FINANCEIROS_STATUS = 'A' `;
			} else if(status == 1) {
				sqlWhere += ` and FINANCEIROS_STATUS = 'P' `; 
			} 
		}

		if (emiinicio && emifinal && emiinicio != 'Data inválida' && emifinal != 'Data inválida') {
			sqlWhere += ` and FINANCEIROS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' `;
		}

		if (vctinicio && vctfinal && vctinicio != 'Data inválida' && vctinicio != 'Data inválida') {
			sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${vctinicio.replace (/\//ig,'.')}' and '${vctfinal.replace (/\//ig,'.')}' `;
		}    
		if (paginicio && pagfinal && paginicio != 'Data inválida' && pagfinal != 'Data inválida') {
			sqlWhere += ` and FINANCEIROS_PAGAMENTO between '${paginicio.replace (/\//ig,'.')}' and '${pagfinal.replace (/\//ig,'.')}' `;
		}    

		if (parseFloat(vloinicio) > 0 && parseFloat(vlofinal) > 0) {
			sqlWhere += ` and FINANCEIROS_ORIGINAL between ${vloinicio} and ${vlofinal} `;
		}    

		if(tipo && tipo != 'T') {
			sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
		}

		if(ordem == 0) {
			sqlOrder += ` order by FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 1) {
			sqlOrder += ` order by FINANCEIROS_PAGAMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 2) {
			sqlOrder += ` order by FINANCEIROS_EMISSAO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 3) {
			sqlOrder += ` order by FINANCEIROS_ID_PESSOAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 4) {
			sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 5) {
			sqlOrder += ` order by FINANCEIROS_ID_PORTADORES, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 6) {
			sqlOrder += ` order by FINANCEIROS_ID_APLICACOES, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 7) {
			sqlOrder += ` order by FINANCEIROS_ID_CUSTOS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else if (ordem == 8) {
			sqlOrder += ` order by FINANCEIROS_ORIGINAL, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		} else {
			sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
		}
								
		const sqlSearch = `select FINANCEIROS_ID,
				FINANCEIROS_ID_DOCUMENTOS,
				FINANCEIROS_TIPO,
				FINANCEIROS_ID_EMPRESAS,
				EMPRESAS_FANTASIA,
				EMPRESAS_NOME,
				EMPRESAS_CPFCNPJ,
				EMPRESAS_TELEFONE,
				EMPRESAS_ENDERECO,
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				CIDADESEMPRESAS.CIDADES_NOME as EMPRESAS_CIDADES,
				CIDADESEMPRESAS.CIDADES_ESTADO as EMPRESAS_ESTADO,
				FINANCEIROS_ID_MOVIMENTOS,
				FINANCEIROS_ID_USUARIOS,
				USUARIOS_NOME,
				USUARIOS_EMAIL,
				USUARIOS_TELEFONE,
				USUARIOS_CELULAR,
				FINANCEIROS_ID_PESSOAS,
				PESSOAS_CPFCNPJ,
				PESSOAS_ID_CIDADES,
				PESSOAS_INSCRICAO,
				PESSOAS_NOME,
				PESSOAS_FANTASIA,
				PESSOAS_ENDERECO,
				PESSOAS_NUMERO,
				PESSOAS_BAIRRO,
				PESSOAS_EMAIL,
				PESSOAS_TELEFONE,
				PESSOAS_CELULAR,
				PESSOAS_TELEFONECOBRANCA,
				PESSOAS_CELULARCOBRANCA,
				PESSOAS_CEP,
				PESSOAS_CREDITO,
				CIDADESPESSOAS.CIDADES_NOME,
				CIDADESPESSOAS.CIDADES_ESTADO,
				FINANCEIROS_ID_PORTADORES,
				PORTADORES_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_PARCELA,
				FINANCEIROS_PARCELAS,
				FINANCEIROS_NOSSONUMERO,
				FINANCEIROS_EMISSAO,
				FINANCEIROS_VENCIMENTO,
				FINANCEIROS_PAGAMENTO,
				FINANCEIROS_BAIXA,
				FINANCEIROS_ORIGINAL,
				FINANCEIROS_ABERTO,
				FINANCEIROS_DESCONTOS,
				FINANCEIROS_JUROS,
				FINANCEIROS_TAXAS,
				FINANCEIROS_PAGO,
				FINANCEIROS_TOTAL,
				FINANCEIROS_OBSERVACOES,
				FINANCEIROS_STATUS,
				FINANCEIROS_EXPORTADO,
				FINANCEIROS_LOG,
				FINANCEIROS_NUMERO,
				FINANCEIROS_SERIE,
				FINANCEIROS_ID_EMPRESAORIGEM,
				FINANCEIROS_NUMEROORIGEM,
				FINANCEIROS_SERIEORIGEM,
				iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO
			from FINANCEIROS
				left outer join EMPRESAS                   on EMPRESAS_ID                = FINANCEIROS_ID_EMPRESAS
				left outer join PESSOAS                    on PESSOAS_ID                 = FINANCEIROS_ID_PESSOAS
				left outer join CIDADES as CIDADESPESSOAS  on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESAS on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
				left outer join PORTADORES                 on PORTADORES_ID              = FINANCEIROS_ID_PORTADORES
				left outer join APLICACOES                 on APLICACOES_ID              = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                     on CUSTOS_ID                  = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                   on USUARIOS_ID                = FINANCEIROS_ID_USUARIOS
				left outer join MOVIMENTOS                 on MOVIMENTOS_ID              = FINANCEIROS_ID_MOVIMENTOS
			${sqlWhere} ${sqlOrder}`; 

		const results = await samosFB.executeSQL(sqlSearch, params);       

		return { results };
	} catch(error) {
		const msg = 'Falha ao buscar financeiros';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [40, 40, 40, 35],
			content: [  //  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15  
				{columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Tip Num Ser Par Pes Por Emi Vct Pgt Atz Abe Pgo  [ Obs ]
						       // 1   2   3   4   5    6   7   8   9  10  11  12  13  14   15
						widths: [15, 15, 25, 10, 10, 180, 15, 35, 35, 40, 20, 45, 45, 20, 150],
						headerRows: 3,
						body: []
					},
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
			getFinanceiros(params)
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
					
					rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
                                colSpan: 4,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},
							{
								colSpan: 10,
								text: 'RELAÇÃO DE TITULOS A ' + (params.tipo == 'R' ? 'RECEBER' : 'PAGAR') + ' POR ' + ordemRelatorio,
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'],
								colSpan: 4,
								alignment: 'left',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]																
							},{},{},{},
							{
								colSpan: 10,
								text: 'Vencimento: ' + params.vctinicio + ' a ' + params.vctfinal,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]								
							}
						],	
						[{text: 'Emp',	        style: 'tableHeader', alignment: 'center'},
						 {text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
						 {text: 'Número',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Sér',          style: 'tableHeader', alignment: 'center'},
						 {text: 'Par',          style: 'tableHeader', alignment: 'center'},
						 {text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
						 {text: 'Por',          style: 'tableHeader', alignment: 'center'},
						 {text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
						 {text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
						 {text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
                         {text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
						 {text: 'Valor Aberto',	style: 'tableHeader', alignment: 'center'},
						 {text: 'Valor Pago',	style: 'tableHeader', alignment: 'center'},
 						 {text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}]
                    );

					for(let i in res.results){
						let model = res.results[i];
						let tipoDoc = (model['FINANCEIROS_ID_DOCUMENTOS'] || '').toString().slice(-4);

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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);		
									}
									rows.push([
										{
											text: `****** VENCIMENTO: ${moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PAGAMENTO: ${moment(res.results[i]['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** EMISSAO: ${moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY')} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PESSOA: ${('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6)} ${model['PESSOAS_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** PORTADOR: ${('00000' + model['FINANCEIROS_ID_PORTADORES']).slice(-5)} ${model['PORTADORES_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** APLICACAO: ${('000000' + model['FINANCEIROS_ID_APLICACOES']).slice(-6)} ${model['APLICACOES_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);		
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
												colSpan: 15,
												border: [false, false, false, false]							
											},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
										]);															
									}
									rows.push([
										{
											text: `****** CENTRO DE CUSTO: ${('00000' + model['FINANCEIROS_ID_CUSTOS']).slice(-5)} ${model['CUSTOS_NOME']} ******`,
											fontSize: 10,
											bold: true,
											alignment: 'center',
											colSpan: 15,
											border: [false, false, false, false]							
										},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]);
                                    if(totalOriginal > 0) {
										rows.push([
											{text: 'Emp',	       style: 'tableHeader', alignment: 'center'},
											{text: 'Tipo',         style: 'tableHeader', alignment: 'center'},
											{text: 'Número',       style: 'tableHeader', alignment: 'center'},
											{text: 'Sér',          style: 'tableHeader', alignment: 'center'},
											{text: 'Par',          style: 'tableHeader', alignment: 'center'},
											{text: 'Pessoa',       style: 'tableHeader', alignment: 'center'},
											{text: 'Por',          style: 'tableHeader', alignment: 'center'},
											{text: 'Emissão',      style: 'tableHeader', alignment: 'center'},
											{text: 'Vencimento',   style: 'tableHeader', alignment: 'center'},
											{text: 'Pagamento',    style: 'tableHeader', alignment: 'center'},
											{text: 'Prazo',        style: 'tableHeader', alignment: 'center'},							
											{text: 'Valor Aberto', style: 'tableHeader', alignment: 'center'},
											{text: 'Valor Pago',   style: 'tableHeader', alignment: 'center'},
            								{text: 'Observações',  style: 'tableHeader', alignment: 'center', colSpan: 2}, {}
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
								text: model['FINANCEIROS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: siglaDocumento(tipoDoc),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: model['FINANCEIROS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: model['FINANCEIROS_PARCELA'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: `${('000000' + model['FINANCEIROS_ID_PESSOAS']).slice(-6)} ${model['PESSOAS_NOME']}`,
								alignment: 'left',
								style: 'tableExample'
							},							
							{
								text: model['FINANCEIROS_ID_PORTADORES'],
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
								text: (model['FINANCEIROS_STATUS'] == 'P' ? '' : model['PRAZOCALCULADO_FINANCEIRO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_PAGO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['FINANCEIROS_OBSERVACOES'],
								alignment: 'left',
								colSpan: 2,
								style: 'tableExample'
							},{}
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
							colSpan: 15,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]);															

					rows.push([
						{
							text: `GERAL: (ABERTO) -=> ${utils.number.float2moeda(geralAberto / 100) || '0,00'}   (JUROS) -=> ${utils.number.float2moeda(geralJuros / 100) || '0,00'}   (PAGO) -=> ${utils.number.float2moeda(geralPago / 100) || '0,00'} (TOTAL ${ordemRelatorio}) -=> ${utils.number.float2moeda((geralOriginal) / 100)}`,
							fontSize: 10,
							bold: true,
							alignment: 'right',
							colSpan: 15,
							border: [false, false, false, false]							
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
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