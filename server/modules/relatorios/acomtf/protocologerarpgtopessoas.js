'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getFinanceirosById = async function(id, params){
	try {
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;

		sqlWhere += ids.reduce((result, id) => {
			return result += ` FINANCEIROS_ID = '${id}' or `
		}, '').slice(0, -3);
		
		const sqlSearch = `select 
				FINANCEIROS_ID,
				FINANCEIROS_TIPO,
				FINANCEIROS_ID_EMPRESAS,
				EMPRESAS_FANTASIA,
				EMPRESAS_TELEFONE, 
				EMPRESAS_CELULAR,
				EMPRESAS_NOME,
				EMPRESAS_EMAIL,
				EMPRESAS_INSCRICAO,
				EMPRESAS_CPFCNPJ,
				EMPRESAS_ENDERECO,
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
				CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
				CIDADESPESSOA.CIDADES_NOME as PESSOAS_CIDADES,
				CIDADESPESSOA.CIDADES_ESTADO as PESSOAS_ESTADO,
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
				PESSOAS_TIPO,
				PESSOAS_ID_CIDADES,
				PESSOAS_INSCRICAO,
				PESSOAS_NOME,
				PESSOAS_FANTASIA,
				PESSOAS_ENDERECO,
				PESSOAS_ENDERECOCOBRANCA,
				PESSOAS_BAIRROCOBRANCA,
				PESSOAS_CEPCOBRANCA,
				PESSOAS_NUMEROCOBRANCA,
				CIDADESCOBRANCA.CIDADES_NOME as CIDADESCOBRANCA_CIDADE_COBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADESCOBRANCA_ESTADO_COBRANCA,
				PESSOAS_NUMERO,
				PESSOAS_BAIRRO,
				PESSOAS_EMAIL,
				PESSOAS_PAGINA,
				PESSOAS_TELEFONE,
				PESSOAS_CELULAR,
				PESSOAS_CEP,
				PESSOAS_CREDITO,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				MOVIMENTOS_ID_PROPRIEDADES,
				PROPRIEDADES_CPFCNPJ,
				PROPRIEDADES_NOME,
				PROPRIEDADES_CEP,
				PROPRIEDADES_ENDERECO,
				PROPRIEDADES_NUMERO,
				PROPRIEDADES_BAIRRO,
				PROPRIEDADES_CEP,
				CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
				CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
				FINANCEIROS_ID_PORTADORES,
				PORTADORES_NOME,
				PORTADORES_ID_BANCOS,
				BANCOS_NOME,
				PORTADORES_AGENCIA,
				PORTADORES_CONTA,
				PORTADORES_CONVENIO,
				PORTADORES_CARTEIRA,
				PORTADORES_CPFCNPJ,
				PORTADORES_ENDERECO,
				PORTADORES_NUMERO,
				PORTADORES_BAIRRO,
				PORTADORES_CEP,
				PORTADORES_PROTESTO,
				PORTADORES_MORA,
				PORTADORES_MULTA,
				CIDADESPORTADOR.CIDADES_NOME as CIDADES_NOMEPORTADOR,
				CIDADESPORTADOR.CIDADES_ESTADO as CIDADES_ESTADOPORTADOR,
				FINANCEIROS_ID_PRAZOS,
				PRAZOS_NOME,
				FINANCEIROS_ID_APLICACOES,
				APLICACOES_NOME,
				FINANCEIROS_ID_CUSTOS,
				CUSTOS_NOME,
				FINANCEIROS_PARCELA,
				FINANCEIROS_PARCELAS,
				FINANCEIROS_NOSSONUMERO,
				FINANCEIROS_BOLETO,
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
				iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO,
				(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZOCALCULADO_BOLETO
			from FINANCEIROS
				left outer join EMPRESAS                      on EMPRESAS_ID                   = FINANCEIROS_ID_EMPRESAS
				left outer join DOCUMENTOS                    on DOCUMENTOS_ID                 = FINANCEIROS_ID_DOCUMENTOS
				left outer join PRAZOS                        on PRAZOS_ID                     = FINANCEIROS_ID_PRAZOS
				left outer join PESSOAS                       on PESSOAS_ID                    = FINANCEIROS_ID_PESSOAS
				left outer join PORTADORES                    on PORTADORES_ID                 = FINANCEIROS_ID_PORTADORES
				left outer join MOVIMENTOS                    on MOVIMENTOS_ID                 = FINANCEIROS_ID_MOVIMENTOS
				left outer join PROPRIEDADES                  on PROPRIEDADES_ID               = MOVIMENTOS_ID_PROPRIEDADES
				left outer join BANCOS                        on BANCOS_ID                     = PORTADORES_ID_BANCOS
				left outer join CIDADES                       on CIDADES.CIDADES_ID            = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPESSOA      on CIDADESPESSOA.CIDADES_ID      = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPORTADOR    on CIDADESPORTADOR.CIDADES_ID    = PORTADORES_ID_CIDADES
				left outer join CIDADES as CIDADESEMPRESA     on CIDADESEMPRESA.CIDADES_ID     = EMPRESAS_ID_CIDADES
				left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES_ID_CIDADES
				left outer join CIDADES as CIDADESCOBRANCA    on CIDADESCOBRANCA.CIDADES_ID    = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
				left outer join APLICACOES                    on APLICACOES_ID                 = FINANCEIROS_ID_APLICACOES
				left outer join CUSTOS                        on CUSTOS_ID                     = FINANCEIROS_ID_CUSTOS
				left outer join USUARIOS                      on USUARIOS_ID                   = FINANCEIROS_ID_USUARIOS
			${sqlWhere}
			order by FINANCEIROS_ID_EMPRESAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA  `;

		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async financeiro => {
			const sqlItens = `select 
				FINANCEIROSITENS.*, 
				APLICACOES_NOME, 
				PORTADORES_NOME
			from FINANCEIROSITENS
			left outer join APLICACOES on APLICACOES_ID = FINANCEIROSITENS_ID_APLICACOES
			left outer join PORTADORES on PORTADORES_ID = FINANCEIROSITENS_ID_PORTADORES
			where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
			order by FINANCEIROSITENS_ID`;

			financeiro['FINANCEIROS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
		}));

		return { 
			results, 
			total: results.length 
		};
	} catch(error) {
		const msg = 'Falha ao buscar financeiros por id';
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
			getFinanceirosById(params.ids, params)
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
								text: 'Relação de Titulos Gerados',
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
								text: 'Vencimento: ' + moment(res.results[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
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
								text: 'Prazo',
								style: 'tableHeader',
								alignment: 'center'									
							}
						]					
                    );

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
								text: res.results[i]['PRAZOCALCULADO_FINANCEIRO'],
								alignment: 'right',
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
