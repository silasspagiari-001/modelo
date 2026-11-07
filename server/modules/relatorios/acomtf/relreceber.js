'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getFinanceiros = async function(params){
	try {
		const { 
			empresa,
			documento,
			numero,
			serie,
			pessoa,
			nomePessoa,
			inicio,
			final,
			ordem,
			status,
			start,
			limit,
			tipo,
			portador,
			tipopessoa
		} = params;

		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		let sqlOrder = '';
		let sqlEmpresa   = empresa   ? `and FINANCEIROS_ID_EMPRESAS   = ${empresa} `   : '';
		let sqlDocumento = documento ? `and FINANCEIROS_ID_DOCUMENTOS = ${documento} ` : '';
		let sqlPortador  = portador  ? `and FINANCEIROS_ID_PORTADORES = ${portador} `  : '';
		let sqlWhere = `where FINANCEIROS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlPortador}`; 
		if(numero > 0 && ordem != 5 && ordem != 7) {
			sqlWhere += ` and FINANCEIROS_NUMERO = '${numero}' `;
			if(serie) {
				sqlWhere += ` and FINANCEIROS_SERIE = '${serie}' `;
			}
			if(tipo) {
				sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
			}                
			sqlOrder  = ` order by FINANCEIROS_NUMERO, FINANCEIROS_ID `;
		} else {    
			//param pessoa pode ser PESSOAS_ID ou PESSOAS_CPFCNPJ
			if(pessoa > 0) {
				sqlWhere += ` and (FINANCEIROS_ID_PESSOAS = ${pessoa} or PESSOAS_CPFCNPJ = '${pessoa}') `; 
			}

			if(nomePessoa) {
				sqlWhere += ` and (PESSOAS_NOME like '%${nomePessoa}%' or PESSOAS_CPFCNPJ = '${nomePessoa}') `; 
			}

			//ABERTOS
			if(status == 0) {
				sqlWhere += ` and FINANCEIROS_STATUS = 'A' `; 

			//PAGOS
			} else if(status == 1) {
				sqlWhere += ` and FINANCEIROS_STATUS = 'P' `; 

			//INATIVOS
			} else if(status == 2) {
				sqlWhere += ` and PESSOAS_STATUS = 'F' `; 

			//EXPORTAR (para remessas)
			} else if(status == 3) {
				sqlWhere += ` and ((FINANCEIROS_EXPORTADO = 'F') or (FINANCEIROS_EXPORTADO = 'E'))
							  and FINANCEIROS_STATUS      = 'A'
							  and FINANCEIROS_ABERTO      > 0  
							  and FINANCEIROS_NOSSONUMERO > 0`; 
			
			//EXPORTADOS
			} else if(status == 4) {
				sqlWhere += ` and FINANCEIROS_EXPORTADO = 'T' 
							  and FINANCEIROS_EMISSAO > '01.11.2018' `; 
							
			//EMITIDOS (boletos já impressos)
			} else if(status == 5) {
				sqlWhere += ` and FINANCEIROS_EXPORTADO = 'E' `; 

			//REJEITADOS
			} else if(status == 6) {
				sqlWhere += ` and FINANCEIROS_EXPORTADO = 'R' `; 

			//BAIXA BANCO
			} else if(status == 7) {
				sqlWhere += ` and FINANCEIROS_EXPORTADO = 'B' `; 
			} 

			if (inicio && final && inicio.length > 0 && final.length > 0) {
				if (ordem == 0 || ordem == 3 || ordem == 4 || ordem == 5) {
					sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
				} else if(ordem == 1) {
					sqlWhere += ` and FINANCEIROS_PAGAMENTO  between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
				} else if (ordem == 2) {
					sqlWhere += ` and FINANCEIROS_EMISSAO    between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
				}
			}

			if(tipo) {
				sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
			}

			if(tipopessoa && tipo == 'P') {
				if(tipopessoa == 1) { // 1 - Titulos, 2 - Entregas, 3 - Montagens
				   sqlWhere += ` and PESSOAS_TIPO <> 'C' 
								 and PESSOAS_TIPO <> 'F'
								 and PESSOAS_TIPO <> 'N'
								 and PESSOAS_TIPO <> 'O' `;
				} else if(tipopessoa == 2) {
				   sqlWhere += ` and ((PESSOAS_TIPO = 'N') or (PESSOAS_TIPO = 'O')) `
				} else if(tipopessoa == 3) {
				   sqlWhere += ` and ((PESSOAS_TIPO = 'C') or (PESSOAS_TIPO = 'F')) `
				}
			} else if(tipopessoa && tipo == 'R') {
				if(tipopessoa == 1) { // 1 - Pessoas, 2 - Empresas, 3 - Financeiras
					sqlWhere += ` and PESSOAS_TIPO <> 'K' and PESSOAS_TIPO <> 'O' and PESSOAS_TIPO <> 'U' `;
				} else if(tipopessoa == 2) {
					sqlWhere += ` and ((PESSOAS_TIPO = 'O') or (PESSOAS_TIPO = 'U')) `;
				} else if(tipopessoa == 3) {
					sqlWhere += ` and PESSOAS_TIPO = 'K' `;
				} 
			}

			if(ordem == 0) {
				sqlOrder += ` order by FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			} else if (ordem == 1) {
				sqlOrder += ` order by FINANCEIROS_PAGAMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			} else if (ordem == 2) {
				sqlOrder += ` order by FINANCEIROS_EMISSAO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			} else if (ordem == 3) {
				sqlOrder += ` order by FINANCEIROS_ID_PESSOAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			} else if (ordem == 5) {
				if(numero == ''){
					sqlWhere += ` and FINANCEIROS_NOSSONUMERO > 0 `;
				} else {
					sqlWhere += ` and FINANCEIROS_NOSSONUMERO = '${numero}' `;
				}
				sqlOrder  = ` order by FINANCEIROS_NOSSONUMERO, FINANCEIROS_ID `;
			} else if (ordem == 6) {
				sqlWhere += ` and FINANCEIROS_NOSSONUMERO = 0 `;
				sqlOrder  = ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			} else if (ordem == 7) { // Valor
				if(parseInt(numero) > 0) {
					sqlWhere += ` and FINANCEIROS_ORIGINAL = ${numero.toString().replace(",", ".")}`;
				}
				sqlOrder  = ` order by FINANCEIROS_ORIGINAL `;
			} else {
				sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
			}
		}
		
		const sqlCount  = `select count(*) from FINANCEIROS
				left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
				${sqlWhere}`;
		
		const sqlSearch = `select ${limits} 
				FINANCEIROS_ID,
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
				FINANCEIROS_ID_DOCUMENTOS,
				DOCUMENTOS_COLETACARTAO,
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
				PESSOAS_PAGINA,
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
				(BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
				FINANCEIROS_ID_PRAZOS,
				PRAZOS_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_BOLETO,
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
				left outer join DOCUMENTOS                 on DOCUMENTOS_ID              = FINANCEIROS_ID_DOCUMENTOS
				left outer join PRAZOS                     on PRAZOS_ID                  = FINANCEIROS_ID_PRAZOS
				left outer join PESSOAS                    on PESSOAS_ID                 = FINANCEIROS_ID_PESSOAS
				left outer join CIDADES as CIDADESPESSOAS  on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESAS on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
				left outer join PORTADORES                 on PORTADORES_ID              = FINANCEIROS_ID_PORTADORES
				left outer join BANCOS                     on BANCOS_ID                  = PORTADORES_ID_BANCOS
				left outer join APLICACOES                 on APLICACOES_ID              = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                     on CUSTOS_ID                  = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                   on USUARIOS_ID                = FINANCEIROS_ID_USUARIOS
			${sqlWhere} ${sqlOrder}`; 

		const total = await samosFB.count(sqlCount, params);
		const results = await samosFB.executeSQL(sqlSearch, params);

		return { results, total };
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
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [40, 40, 40, 35],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Num Par Emi Vct Ori Jur Dsc Abe Obs
						       // 1   2   3   4   5   6   7   8   9   10
						widths: [16, 36, 16, 55, 55, 60, 45, 45, 60, 52],
						headerRows: 7,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(95),
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
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

        return new Promise(async (resolve, reject) => {
            delete params.limit;
            
			getFinanceiros(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let ultimaEmpresa = 0;
					let empOriginal  = 0;
					let empJuros     = 0
                    let empDescontos = 0;
					let empAberto    = 0;

					let totalOriginal  = 0;
					let totalJuros     = 0
                    let totalDescontos = 0;
					let totalAberto    = 0;

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
								colSpan: 4,
								text: 'Relação de Baixas a ' + (params.tipo == 'R' ? 'Receber' : 'Pagar') + (params.selecionados == 'true' ? ' (Selecionados)' : ''),
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false],
                                colSpan: 2								
							},{}
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
								colSpan: 4,
								text: 'Vencimento: ' + params.inicio + ' a ' + params.final,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},
                            {
								colSpan: 2,
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]								
							},{}
						]
					);

					if(params.layout == 0) {  // se as baixas forem de pessoa individual
						rows.push(	          // Aqui irá os dados da pessoa num cabeçalho
							[
								{
									text: 'Nome:',
									colSpan: 2
								},{},							
								{
									text: res.results[0]['PESSOAS_NOME'] + '(' + res.results[0]['FINANCEIROS_ID_PESSOAS'] + ')',
									colSpan: 6
								},{},{},{},{},{},
								{
									text: 'Cep: ' + utils.string.maskCep(res.results[0]['PESSOAS_CEP']),
									colSpan: 2
								},{}
							], 
							[
								{
									text: 'Endereço:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['PESSOAS_ENDERECO'] + (res.results[0]['PESSOAS_NUMERO'] ? ', ' + res.results[0]['PESSOAS_NUMERO']: ''),
									colSpan: 6
								},{},{},{},{},{},
								{
									text: 'Tel: ' + utils.string.maskFone(res.results[0]['PESSOAS_TELEFONE']),
									colSpan: 2
								},{},
							],
							[
								{
									text: 'Bairro:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['PESSOAS_BAIRRO'],
									colSpan: 3
								}, 
								{},{},
								{
									text: 'Cel: ' + utils.string.maskFone(res.results[0]['PESSOAS_CELULAR']),
									colSpan: 3
								}, {} ,{},
								{
									text: (res.results[0]['PESSOAS_CPFCNPJ'].length == 11 ? 'Rg: ' : 'IE: ') + res.results[0]['PESSOAS_INSCRICAO'],
									colSpan: 2								
								},{}
							],
							[
								{
									text: 'Cidade:',
									colSpan: 2
								},{},
								{
									text: res.results[0]['CIDADES_NOME'] + '/' + res.results[0]['CIDADES_ESTADO'],
									colSpan: 6
								},{},{},{},{},{},
								{
									text: (res.results[0]['PESSOAS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:') +
									utils.string.maskCnp(res.results[0]['PESSOAS_CPFCNPJ']),
									colSpan: 2
								},{}
							],
							[
								{
									text: '',
									fontSize: 6,
									colSpan: 2,
									border: [false, false, false, false]
								},{},
								{
									text: '',
									fontSize: 6,
									colSpan: 6,
									border: [false, false, false, false]								
								},{},{},{},{},{},
								{
									text: '',
									fontSize: 6,
									colSpan: 2,
									border: [false, false, false, false]								
								},{}
							]
						);
					};

					rows.push(					
						[
							{
								text: 'Lj',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'									
							},							
							{
								text: 'Par',
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
								text: 'Original',
								style: 'tableHeader',
								alignment: 'center'									
							},                                             
							{
								text: 'Juros',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Desconto',
								style: 'tableHeader',
								alignment: 'center'
							},                     
							{
								text: 'Aberto',
								style: 'tableHeader',
								alignment: 'center'
							},                                           
							{
								text: 'Obs',
								style: 'tableHeader',
								alignment: 'center'									
							}
						]					
                    );

					calcularJurDsc(params, res);  // Calcula os juros e descontos

					for(let i in res.results){

						if(res.results[i]['FINANCEIROS_ID_EMPRESAS'] !== ultimaEmpresa) {
							if(ultimaEmpresa > 0) {
								rows.push([
									{
										text: '',
										colSpan: 3,
										border: [false, false, false, false]							
									},{},{},
									{
										text: `Subtotal (${ultimaEmpresa})`,
										colSpan: 2,										
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'			
									},{},
									{
										text: utils.number.float2moeda(empOriginal / 100),
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: empJuros > 0 ? utils.number.float2moeda(empJuros / 100) : '',
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'
									},
									{
										text: empDescontos > 0 ? utils.number.float2moeda(empDescontos / 100) : '',
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: utils.number.float2moeda(empAberto / 100),
										alignment: 'right',
										fontSize: 10,
										bold: true,
										border: [false, false, false, false],
										style: 'tableExample'							
									},{
										text: '',
										border: [false, false, false, false]
									}
								]);			
							}
							ultimaEmpresa = res.results[i]['FINANCEIROS_ID_EMPRESAS'];
							empOriginal   = 0;
							empAberto     = 0;
							empJuros      = 0;
							empDescontos  = 0;
						}

						rows.push([
							{
								text: res.results[i]['FINANCEIROS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: res.results[i]['FINANCEIROS_PARCELA'],
								alignment: 'center',
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
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_JUROS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_JUROS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},								
							{
								text: res.results[i]['FINANCEIROS_DESCONTOS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_DESCONTOS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_OBSERVACOES'],
								alignment: 'left',
								style: 'tableExample'
							}                            								
						]);

						empOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						empAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						empJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						empDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

						totalOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						totalJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						totalDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

					}

					rows.push([
						{
							text: '',
							colSpan: 3,
							border: [false, false, false, false]							
						},{},{},
						{
							text: `Subtotal (${ultimaEmpresa})`,
							colSpan: 2,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},
						{
							text: utils.number.float2moeda(empOriginal / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empJuros > 0 ? utils.number.float2moeda(empJuros / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empDescontos > 0 ? utils.number.float2moeda(empDescontos / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(empAberto / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false]
						}
					]);			
		
					rows.push([
						{
							text: '',
							colSpan: 3,
							border: [false, false, false, false]							
						},{},{},
						{
							text: 'Total Geral',
							colSpan: 2,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},
						{
							text: utils.number.float2moeda(totalOriginal / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalJuros > 0 ? utils.number.float2moeda(totalJuros / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalDescontos > 0 ? utils.number.float2moeda(totalDescontos / 100) : '',
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(totalAberto / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: '',
							border: [false, false, false, false]
						}
					]);
										
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};

const calcularJurDsc = function(params, res) {
	const juros              = params.juros;
	const descontos          = (params.descontos * 100);
	const descontosPorTitulo = Math.floor(descontos / res.total);
	const sobraDesconto      = descontos % res.total;
	const moraDiaria         = parseFloat(juros) / 30 / 100;
	const dataAtual          = moment.tz(params.timezone).hours(0).minutes(0).seconds(0);

	for(let i in res.results){
		const vctoOriginal   = moment.tz(res.results[i]['FINANCEIROS_VENCIMENTO'], params.timezone);
		const valorAberto    = (res.results[i]['FINANCEIROS_ABERTO'] * 100) ;
		const diasAtraso     = parseInt((dataAtual - vctoOriginal) / 1000 / 60 / 60 / 24);
		const tituloAtrasado = vctoOriginal.isBefore(dataAtual);
		const valorJuros     = tituloAtrasado ? parseInt(valorAberto * moraDiaria * diasAtraso) : 0;
		const valorDesconto  = (descontosPorTitulo + (i == 0 ? sobraDesconto : 0));

		res.results[i]['FINANCEIROS_ORIGINAL']  = res.results[i]['FINANCEIROS_ABERTO'];
		res.results[i]['FINANCEIROS_DESCONTOS'] = valorDesconto / 100;
		res.results[i]['FINANCEIROS_JUROS']     = valorJuros / 100;
		res.results[i]['FINANCEIROS_ABERTO']    = (valorAberto + valorJuros - valorDesconto) / 100;
	};
};
