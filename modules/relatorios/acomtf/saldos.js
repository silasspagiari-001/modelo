'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB = require('../../../services/samosFirebird');

const getSaldos = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, tipo, status, quebra, pessoainicial, pessoafinal, grupoinicial, grupofinal } = params;
		const db = await samosFB.conectarBanco(params.client);

		let parPessoainicial = (pessoainicial > 0 ? pessoainicial : 1);
		let parPessoafinal  = (pessoafinal > 0 ? pessoafinal : 999999);
		let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
		let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

		let sqlWhere = '';
		let sqlOrder = '';
		
		if((params.log || '').toUpperCase().match(/HERMES/)) {
			if(parPessoainicial == 1 && parPessoafinal == 999999 && parGrupoinicial == 1 && parGrupofinal == 999999) {
				sqlOrder = 'PRODUTOS_NOME';
			} else if(parPessoafinal != 999999 && parGrupofinal != 999999) {
				sqlOrder = 'PRODUTOS_ID_PESSOAS, PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
			} else if(parPessoafinal != 999999 && parGrupofinal == 999999) {
				sqlOrder = 'PRODUTOS_ID_PESSOAS, PRODUTOS_NOME';
			} else if(parPessoafinal == 999999 && parGrupofinal != 999999) {
				sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
			}
		} else if((params.log || '').toUpperCase().match(/SANTANA/)) {
			sqlOrder = 'PRODUTOS_ID_GRUPOS, PRODUTOS_NOME';
		} else {
			sqlOrder = (parPessoainicial == 1 && parPessoafinal == 999999 ? 'PRODUTOS_NOME' : 'PRODUTOS_ID_PESSOAS, PRODUTOS_NOME');
		}

		sqlWhere += `PRODUTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} and `;
		sqlWhere += `PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} and `

		if(status != '') {
			if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'T')  {  // Ativo da Pruden/Stilo traz o fora de linha
				sqlWhere += `(PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') and `;
			} else if (status == 'T') {
				sqlWhere += ` PRODUTOS_STATUS <> 'F' and `;
			} else  {
				sqlWhere += ` PRODUTOS_STATUS = '${status}' and `;
			}    
		}

		if(tipo == 0) {
			sqlWhere += `SALDOS_DISPONIVEL > 0 and `;  // 0 - Positivo
		} else if(tipo == 1) {
			sqlWhere += `SALDOS_DISPONIVEL < 0 and `;  // 1 - Negativo
		} else if(tipo == 2) {
			sqlWhere += `SALDOS_DISPONIVEL = 0 and `;  // 2 - Zerado
		} else if(tipo == 3) {
			sqlWhere += `SALDOS_DISPONIVEL <> 0 and `; // 3 - Positivo ou Negativo
		} else if(tipo == 5) {
			sqlWhere += `SALDOS_DISPONIVEL < SALDOS_MINIMO and `; // Abaixo do mínimo
		} else if(tipo == 6) {
			sqlWhere += `SALDOS_DISPONIVEL > SALDOS_MAXIMO and `; // Acima do máximo
		} else if(tipo == 7) {
			sqlWhere += `PRODUTOS_PESOBRUTO > 0 and `; // Com peso bruto
		} else if(tipo == 8) {
			sqlWhere += `PRODUTOS_PESOBRUTO <= 0 and `; // Sem peso bruto
		} else if(tipo == 9) {
			sqlWhere += `SALDOS_MARGEM > 0 and `; // Com margem
		} else if(tipo == 10) {
			sqlWhere += `SALDOS_MARGEM <= 0 and `; // Sem margem
		}

		const sqlIds = `select PRODUTOS_ID from PRODUTOS
						where PRODUTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} and 
							  PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal}`;
							  
		db.query(sqlIds, async (error, resultsIds) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlIds);
			} else {
				await api['processos/atualizasaldo']().create({
					empresa : empresa,
					produtos: (resultsIds || []).map(item => item['PRODUTOS_ID']),
					client  : params.client
				});

				let sqlSearch = `select PRODUTOS_ID, PRODUTOS_FABRICA, PRODUTOS_MARCA, PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_ID_GRUPOS,
										PRODUTOS_ID_PESSOAS, PRODUTOS_PESOBRUTO, SALDOS_CUSTO, SALDOS_COMPRA, SALDOS_PRECO, SALDOS_MARGEM,
										SALDOS_MAXIMO, SALDOS_MINIMO, SALDOS_DISPONIVEL, GRUPOS_NOME, PESSOAS_NOME
				from PRODUTOS
				left outer join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
				left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
				left outer join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
				where ${sqlWhere}
						PRODUTOS_NOME <> ''
				order by ${sqlOrder}`

				db.query(sqlSearch, (error, results) => {
					if (error) {
						samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
					} else {

						samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
					}
				});
			}
		});                
	});
}

module.exports = {
    read: params => {
		let tipoSaldo = [
			'Com Saldo Positivo',
			'Com Saldo Negativo',
			'Com Saldo Zerado',
			'Todos os Produtos',
			'Abaixo do Mínimo',
			'Acima do Máximo',
			'Com Peso Bruto',
			'Sem Peso Bruto',
			'Com Margem',
			'Sem Margem'
		];

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [40, 40, 40, 35],
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
									text: 'Saldos de Produtos - Preço de ' + (params.preco == 0 ? 'Venda\n' : params.preco == 1 ? 'Custo\n' : 'Compra\n'),
									width: '*',
									style: {
										fontSize: 12,
										alignment: 'center',
										color: 'blue'
									}
								},
								{
									text: `Tipo: ${tipoSaldo[params.tipo]} - Fornecedor: ${params.pessoainicial} até ${params.pessoafinal} - Grupo: ${params.grupoinicial} até ${params.grupofinal}`,
									width: '*',
									style: {
										fontSize: 8,
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
								fontSize: 6,
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
					fontSize: 6,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 6,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //COD UNI NOM MIN MAX SLD PES MAR PRC
						widths: [30, 15, 195, 35, 35, 35, 35, 35, 40],
						headerRows: 1,						
						body: [
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
									alignment: 'center'
                                },
								{
									text: 'Mínimo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Máximo',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
                                },                                								
								{
									text: 'PesoBruto',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: '%Margem',
									style: 'tableHeader',
									alignment: 'center'
								},
								{
									text: 'Preço',
									style: 'tableHeader',
									alignment: 'center'
								}
							]
						]
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(92),
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 6,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 6,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			getSaldos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimaPessoa = 0;
					let qtdeBase = 0;
					let precoBase = 0;
					let valorEstoquePessoa = 0;
					let valorEstoqueGeral = 0;

					for(let i in res.results){

						if(parseInt(params.pessoainicial) != 1 && parseInt(params.pessoafinal) != 999999) {
							if(ultimaPessoa !== res.results[i]['PRODUTOS_ID_PESSOAS']) {
								ultimaPessoa = res.results[i]['PRODUTOS_ID_PESSOAS'];
								if(valorEstoquePessoa > 0) {
									rows.push([
										{
											text: '',
											alignment: 'left',
											style: 'tableExample',
											colSpan: 5,
											border: [false, false, false, false]
										},							
										{},{},{},{},
										{
											text: 'TOTAL FORNECEDOR:',
											alignment: 'right',
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{},
										{
											text: utils.number.float2moeda(valorEstoquePessoa),
											alignment: 'right',
											style: 'tableExample',
											colSpan: 2,
											border: [false, false, false, false]
										},{}
									]);	
									valorEstoquePessoa = 0;
								}
								rows.push([
									{
										text: '',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '****** Fornecedor: ' + res.results[i]['PRODUTOS_ID_PESSOAS'] + ' ' +
																	  res.results[i]['PESSOAS_NOME'] + ' ******',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 9,
										fontSize: 10,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
								rows.push([
									{
										text: '',
										alignment: 'center',
										style: 'tableExample',
										colSpan: 9,
										border: [false, false, false, false]
									},							
									{},{},{},{},{},{},{},{}
								]);
							}	
						}

						rows.push([
							{
								text: ("00000" + res.results[i]['PRODUTOS_ID']).slice(-5),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
                            },							
                            {
                                text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample',
								border: [false, false, false, false]
                            },
                            {
								text: res.results[i]['SALDOS_MINIMO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['SALDOS_MAXIMO'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['SALDOS_DISPONIVEL'].toFixed(0),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: res.results[i]['PRODUTOS_PESOBRUTO'].toFixed(3),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: utils.number.float2moeda(res.results[i]['SALDOS_MARGEM']),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
                            {
								text: (params.preco == 0 ? utils.number.float2moeda(res.results[i]['SALDOS_PRECO']) : params.preco == 1 ? utils.number.float2moeda(res.results[i]['SALDOS_CUSTO']) : utils.number.float2moeda(res.results[i]['SALDOS_COMPRA'])),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
							},
						]);

						qtdeBase = (res.results[i]['SALDOS_DISPONIVEL'] > 0 ? res.results[i]['SALDOS_DISPONIVEL'] : 0);
						precoBase = (params.preco == 0 ? res.results[i]['SALDOS_PRECO'] : params.preco == 1 ? res.results[i]['SALDOS_CUSTO'] : res.results[i]['SALDOS_COMPRA']);

						valorEstoquePessoa += (qtdeBase * precoBase);
						valorEstoqueGeral +=  (qtdeBase * precoBase);
					}

					if(parseInt(params.pessoainicial) != 1 && parseInt(params.pessoafinal) != 999999) {
						rows.push([
							{
								text: '',
								alignment: 'left',
								style: 'tableExample',
								colSpan: 5,
								border: [false, false, false, false]
							},{},{},{},{},
							{
								text: 'TOTAL FORNECEDOR:',
								alignment: 'right',
								style: 'tableExample',
								bold: true,
								colSpan: 2,
								border: [false, false, false, false]
							},{},
							{
								text: utils.number.float2moeda(valorEstoquePessoa),
								alignment: 'right',
								style: 'tableExample',
								bold: 'true',
								colSpan: 2,
								border: [false, false, false, false]
							},{}
						]);	
					}

					rows.push([
						{
							text: '',
							alignment: 'left',
							style: 'tableExample',
							colSpan: 5,
							border: [false, false, false, false]
						},{},{},{},{},
						{
							text: 'TOTAL GERAL:',
							alignment: 'right',
							style: 'tableExample',
							bold: true,
							colSpan: 2,
							border: [false, false, false, false]
						},{},
						{
							text: utils.number.float2moeda(valorEstoqueGeral),
							alignment: 'right',
							style: 'tableExample',
							colSpan: 2,
							border: [false, false, false, false]
						},{}
					]);	

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
