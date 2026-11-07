'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB   = require('../../../services/samosFB');
const moment    = require('moment-timezone');

const getProdutos = async function(params) {
	try {
		let { conteudo, pessoa, empresa, ordem, status, start, limit } = params;

		let sqlWhere = `where PRODUTOS_ID > 0  `;
		let sqlOrder = '';

		if(status == 'H') { // status H Busca todos produtos, independente do status no banco
		//Ativo da Pruden/Stilo traz o fora de linha
		} else if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'T')  {
			sqlWhere += ` and (PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') `;
		//Ativo, fora de linha e produtos de assistência
		} else if((params.client || '').toUpperCase().match(/MOVEIS/) && status == 'G') {
			sqlWhere += ` and ((PRODUTOS_STATUS = 'T') or (PRODUTOS_STATUS = 'L') or (PRODUTOS_STATUS = 'A')) `;
		} else if (status == 'T') {
			sqlWhere += ` and PRODUTOS_STATUS <> 'F' `;
		} else if (status && params.client) {
			sqlWhere += ` and PRODUTOS_STATUS = '${status}' `;
		}    
	
		if (conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and PRODUTOS_ID = ${conteudo.replace(/\./ig, '')} `;
		} else if (conteudo && conteudo.substring(0, 1) == '+') {
			sqlWhere += `and PRODUTOS_NOME like  '${conteudo.replace(/\+/ig, '%')}%' `;
		} else if (conteudo && conteudo.substring(0, 1) == '#') {
			sqlWhere += `and PRODUTOS_BARRA like  '${conteudo.replace(/\#/ig, '%')}%' `;
		} else if (conteudo && conteudo.substring(0, 1) == '@') {
			sqlWhere += `and PRODUTOS_MARCA like '${conteudo.replace(/\@/ig, '%')}%' `;
		} else if (conteudo && conteudo.substring(0, 1) == '-') {
			sqlWhere += `and PRODUTOS_FABRICA like  '${conteudo.replace(/\-/ig, '%').toUpperCase()}%' `;
		} else {
			if (ordem == 0) {
				sqlWhere += `and PRODUTOS_NOME like '${conteudo}%' `;
				sqlOrder = ' order by PRODUTOS_NOME ';
			} else if (ordem == 1) {
				sqlWhere += `and PRODUTOS_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by PRODUTOS_NOME ';
			} else if (ordem == 2) {
				sqlWhere += conteudo > 0 ? `and PRODUTOS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by PRODUTOS_ID ';
			} else if (ordem == 3) {
				const id = await samosFB.buscaMultipla({
					conteudo,
					tabela: 'PRODUTOS',
					chave: 'PRODUTOS_ID',
					campos: [
						'PRODUTOS_ID',
						'PRODUTOS_BARRA',
						'PRODUTOS_NOME'
					]
				}, params);

				sqlWhere += ` and PRODUTOS_ID = '${id}' `;
				sqlOrder  = ' order by PRODUTOS_ID ';
			} else if (ordem == 4) {
				sqlWhere += ` and PRODUTOS_MARCA like '%${conteudo}%' `;
				sqlOrder = ' order by PRODUTOS_MARCA ';
			} else if (ordem == 5) {
				sqlWhere += ` and PRODUTOS_APLICACAO like '%${conteudo}%' `;
				sqlOrder = ' order by PRODUTOS_APLICACAO, PRODUTOS_NOME ';
			} else if (ordem == 6) {
				sqlWhere += ` and PRODUTOS_FABRICA like '%${conteudo.toUpperCase()}%' `;
				sqlOrder = ' order by PRODUTOS_FABRICA, PRODUTOS_NOME ';
			}else if (ordem == 7) {
				sqlWhere += `and PRODUTOS_NOME like  '%${conteudo.replace('%', '')}%' `;
				//Se for vista
				if( params.tipopreco == 'vista'){
					sqlOrder = ' order by SALDOS_PRECO, PRODUTOS_NOME ';

				}else{
					sqlOrder = ' order by SALDOS_PRAZO, PRODUTOS_NOME ';
				}
			}
		}

		const precoMarkUp = process.env[params.client ? ((params.client || '').toUpperCase() + '_MARKUP') : 'MARKUP'] == 'TRUE';
		
		const sqlSearch = `select 
			${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
			PRODUTOS.*, 
			GRUPOS_NOME, 
			NCMS_NCM,
			NCMS_NOME, 
			PESSOAS_NOME, 
			MONTAGENS_NOME, 
			MONTAGENS_VALOR
		from PRODUTOS
		join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
		left outer join GRUPOS    on GRUPOS_ID    = PRODUTOS_ID_GRUPOS
		left outer join NCMS      on NCMS_ID      = PRODUTOS_ID_NCMS
		left outer join PESSOAS   on PESSOAS_ID   = PRODUTOS_ID_PESSOAS
		left outer join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
		${sqlWhere} ${sqlOrder}`;
		
		const sqlCount = `select count(*) from PRODUTOS 
						  join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
						  ${sqlWhere}`;

		const total = await samosFB.count(sqlCount, params);
		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async produto => {
			if(status == 'H') {
				produto['PRODUTOS_STATUS'] = (produto['PRODUTOS_STATUS'] == 'F' ? 'T' : produto['PRODUTOS_STATUS']); // Pra impedir bloqueios, ativo os inativos
			}
			const sqlSaldos = `select 
				SALDOS_ID,
				SALDOS_ID_EMPRESAS,
				SALDOS_ID_PRODUTOS,
				SALDOS_MAXIMO,
				SALDOS_MINIMO,
				SALDOS_DISPONIVEL,
				SALDOS_COMPRADO,
				SALDOS_RESERVADO,
				SALDOS_COMPRA,
				SALDOS_CUSTO,
				SALDOS_PRECO,
				${
					precoMarkUp ? 
					'(SALDOS_PRECO - round((SALDOS_PRECO * (SALDOS_MARKUP / 100)), 2))': 
					'SALDOS_PRECOMINIMO'
				} as SALDOS_PRECOMINIMO,
				SALDOS_TRANSFERENCIA,
				SALDOS_PRAZO,
				SALDOS_MARGEM,
				SALDOS_MARKUP,
				SALDOS_MARGEMMINIMA,
				SALDOS_LOCAL,
				SALDOS_ESCRITURACAO,
				SALDOS_COMISSAO,
				SALDOS_COMISSAOPRAZO,
				SALDOS_EXCECAO,
				SALDOS_IPI,
				SALDOS_ICMSLC,
				SALDOS_ICMS01,
				SALDOS_ICMS02,
				SALDOS_BASELC,
				SALDOS_BASE01,
				SALDOS_BASE02,
				SALDOS_CSTLOCAL,
				SALDOS_CSTOUTROS,
				SALDOS_CSTSUBST,
				SALDOS_ALIQUOTACFE,
				SALDOS_ALIQUOTASUBST,
				SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
				(
					select first 1 skip 0 PROMOCOESITENS_VALOR from PROMOCOESITENS
					join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
					where PROMOCOES_STATUS   = 'T'           and
						  PROMOCOES_EMISSAO  <= current_date and
						  PROMOCOES_VALIDADE >= current_date and
						  ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
						  PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
				) as VALOR_PROMOCAO,
				(
					select first 1 skip 0 PROMOCOESITENS_CUSTOTECNICO from PROMOCOESITENS
					join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
					where PROMOCOES_STATUS   = 'T'           and
						  PROMOCOES_EMISSAO  <= current_date and
						  PROMOCOES_VALIDADE >= current_date and
						  ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
						  PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
				) as QTDE_PROMOCAO
			from SALDOS 
			where SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}
				  ${empresa ? ` and SALDOS_ID_EMPRESAS = ${empresa}` : ''}`;
	
			produto['SALDOS'] = await samosFB.executeSQL(sqlSaldos, params);

			//entra aqui para verificar se tem preço específico para este cliente
			if(pessoa) {
				const queryPessoa = await samosFB.executeSQL(`select PESSOAS_FORMULA from PESSOAS where PESSOAS_ID = ${pessoa}`, params);
				
				await Promise.all((produto['SALDOS'] || []).map(async saldo => {
					try {
						//caso encontre preço específico, atribui ao campo SALDOS_PRECO
						(JSON.parse(queryPessoa[0]['PESSOAS_FORMULA']) || [])
							.filter(produto => produto['ID'] == saldo['SALDOS_ID_PRODUTOS'])
							.map(produto => {
								saldo['SALDOS_PRECO'] = produto['RS'] || saldo['SALDOS_PRECO'];
								saldo['SALDOS_PRAZO'] = produto['RS'] || saldo['SALDOS_PRAZO'];

								if(produto['RS'] < saldo['SALDOS_PRECOMINIMO']) {
									saldo['SALDOS_PRECOMINIMO'] = produto['RS'] || saldo['SALDOS_PRECOMINIMO'];
								}
							})
					} catch (e) {/*caso nao tenha formula cai aqui e prossegue normalmente*/}
				}));
			}

			const sqlPromocoes = `select 
				PROMOCOES_NOME, 
				PROMOCOES_VALIDADE, 
				PROMOCOESITENS_VALOR, 
				PROMOCOESITENS_DESCONTO, 
				round((100 - (PROMOCOESITENS_VALOR / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADO,                    
				PROMOCOESITENS_PARCELAS, 
				cast((PROMOCOESITENS_INDICE * PROMOCOESITENS_PARCELAS * PROMOCOESITENS_VALOR) as integer) as TOTALPARCELAS_ITENS
			from PROMOCOESITENS
			join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
			left outer join SALDOS   on SALDOS_ID_PRODUTOS = PROMOCOESITENS_ID_PRODUTOS and 
										SALDOS_ID_EMPRESAS = ${empresa ? empresa : 1}
			  
			where PROMOCOES_STATUS = 'T'             and
				  PROMOCOES_EMISSAO  <= current_date and
				  PROMOCOES_VALIDADE >= current_date and
				  ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
				  PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}`;

			produto['PROMOCOES'] = await samosFB.executeSQL(sqlPromocoes, params);

			const sqlSaldosGeral = `select 
				SALDOS_DISPONIVEL, 
				SALDOS_RESERVADO, 
				SALDOS_COMPRADO, 
				EMPRESAS_ID, 
				EMPRESAS_NOME, 
				EMPRESAS_FANTASIA
			from SALDOS 
			left outer join EMPRESAS on EMPRESAS_ID = SALDOS_ID_EMPRESAS
			where EMPRESAS_ID > 0 and
				  SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}`;
				  
			produto['SALDOSGERAL'] = await samosFB.executeSQL(sqlSaldosGeral, params);

			const sqlNcms = `select
				NCMS_NCM, 
				NCMS_ALIQUOTANACIONAL, 
				NCMS_ALIQUOTAESTADUAL,
				NCMS_ALIQUOTAIMPORTADO, 
				NCMS_ALIQUOTAMUNICIPAL,
				NCMS_CSTPIS,
				NCMS_CSTCOFINS,
				NCMS_ALIQUOTAPIS,
				NCMS_ALIQUOTACOFINS,
				NCMS_ALIQUOTAFCP,
				NCMS_DIFAL
			from NCMS 
			where NCMS_ID = ${produto['PRODUTOS_ID_NCMS']}`;

			produto['NCMS'] = await samosFB.executeSQL(sqlNcms, params);
			
			const sqlLotes = `select first 1 skip 0
				LOTES_ID,
				LOTES_REFERENCIA,
				LOTES_FABRICACAO,
				LOTES_VALIDADE
			from LOTES
			where LOTES_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
			  and LOTES_STATUS = 'T'
			  and LOTES_VALIDADE > 'now'
			order by LOTES_VALIDADE`;

			produto['LOTES'] = await samosFB.executeSQL(sqlLotes, params);

		}));

		return { results, total };

	} catch(error) {
		const msg = 'Falha ao buscar produtos';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let docDefinition = {
			pageOrientation: 'landscape',
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
							text: 'Estoque de Produtos',
							width: '*',
							style: {
								fontSize: 16,
								alignment: 'center',
								color: 'red'
							}
						},
						{
							stack: [
								moment.tz(params.timezone).format('DD/MM/YYYY'),
								moment.tz(params.timezone).format('HH:mm:ss')
							],
							width: 100,
							style: {
								fontSize: 10,
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
					fontSize: 10,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CD BAR NOM  UNI MAR  GRP SLD
						widths: [40, 75, 300, 20, 75, 120, 70],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Cód Barras',
									style: 'tableHeader',
									alignment: 'center'									
                                },                                
								{
									text: 'Nome',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Uni',
									style: 'tableHeader',
									alignment: 'center'									
                                },                                
                                {
									text: 'Marca',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Grupo',
									style: 'tableHeader',
									alignment: 'center'
                                },
								{
									text: 'Saldo',
									style: 'tableHeader',
									alignment: 'center'
                                }                                
							]
						]
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
						{ text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 8,
					margin: [0, 0, 0, 0],
					border: 0 // 0.5
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			getProdutos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){
						rows.push([
							{
								text: res.results[i]['PRODUTOS_ID'],
								alignment: 'right',
								style: 'tableExample',
                            },							
							{
								text: res.results[i]['PRODUTOS_BARRA'],
								alignment: 'left',
								style: 'tableExample'
                            },
							{
								text: res.results[i]['PRODUTOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
                                text: res.results[i]['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample'
                            },
                            {   
								text: res.results[i]['PRODUTOS_MARCA'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
								text: res.results[i]['GRUPOS_NOME'],
								alignment: 'left',
								style: 'tableExample'
                            },
                            {
								text: res.results[i]['PRODUTOS_PESOBRUTO'],
								alignment: 'right',
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
