'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');

const getOrdemMoveisById = async function(id, params){
	return new Promise(async (resolve, reject) => {
		const db = await samosFB.conectarBanco(params.client);
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;
	 
		sqlWhere += ids.reduce((result, id) => {
			return result += ` ORDENS_ID = '${id}' or `
		}, '').slice(0, -3);

		const sqlOrder = ` order by ORDENS_ID `;

		const sqlSearch = `
			select ORDENS.*,
				EMPRESAS_FANTASIA,
				EMPRESAS_MUNICIPAL,
				EMPRESAS_CPFCNPJ, 
				EMPRESAS_INSCRICAO,
				EMPRESAS_TELEFONE,
				EMPRESAS_CELULAR,
				EMPRESAS_NOME,
				EMPRESAS_ENDERECO, 
				EMPRESAS_NUMERO,
				EMPRESAS_BAIRRO,
				EMPRESAS_CEP,
				CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
				CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
				PESSOAS.PESSOAS_FANTASIA,
				PESSOAS.PESSOAS_NOME,
				PESSOAS.PESSOAS_TIPO,
				PESSOAS.PESSOAS_ENDERECO,
				PESSOAS.PESSOAS_NUMERO,
				PESSOAS.PESSOAS_BAIRRO,
				PESSOAS.PESSOAS_CEP,                    
				PESSOAS.PESSOAS_CPFCNPJ,
				PESSOAS.PESSOAS_INSCRICAO,
				PESSOAS.PESSOAS_TELEFONE,
				PESSOAS.PESSOAS_EMAIL,
				PESSOAS.PESSOAS_CELULAR,
				PESSOAS.PESSOAS_PAGINA,
				PESSOASMONTADOR.PESSOAS_NOME as MONTADORES_NOME,
				PESSOASMONTADOR.PESSOAS_TIPO as MONTADORES_TIPO,
				PESSOASMONTADOR.PESSOAS_CPFCNPJ as MONTADORES_CPFCNPJ,
				PESSOASMONTADOR.PESSOAS_INSCRICAO as MONTADORES_INSCRICAO,                    
				PESSOASMONTADOR.PESSOAS_ENDERECO as MONTADORES_ENDERECO,
				PESSOASMONTADOR.PESSOAS_NUMERO as MONTADORES_NUMERO,
				PESSOASMONTADOR.PESSOAS_BAIRRO as MONTADORES_BAIRRO,
				PESSOASMONTADOR.PESSOAS_CEP as MONTADORES_CEP,
				CIDADESMONTADOR.CIDADES_NOME as CIDADES_NOMEMONTADOR,
				CIDADESMONTADOR.CIDADES_ESTADO as CIDADES_ESTADOMONTADOR,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				DOCUMENTOS_LAYOUT,
				DOCUMENTOS_ID_APLICACOES,
				APLICACOES_NOME
			from ORDENS 
				left join PESSOAS    on PESSOAS_ID = ORDENS_ID_PESSOAS
				left join PESSOAS    as PESSOASMONTADOR on PESSOASMONTADOR.PESSOAS_ID = ORDENS_ID_USUARIOS
				left join EMPRESAS   on EMPRESAS_ID = ORDENS_ID_EMPRESAS
				left join CIDADES    on CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
				left join CIDADES    as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES
				left join CIDADES    as CIDADESMONTADOR on CIDADESMONTADOR.CIDADES_ID = PESSOASMONTADOR.PESSOAS_ID_CIDADES
				left join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
				left join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
			${sqlWhere} ${sqlOrder} `; 

			db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: 1, resolve, reject, sqlFilhos: {
					ORDENS_PRODUTOSITENS: `select 
							ORDENSPRODUTOS.*, PRODUTOS_NOME, PRODUTOS_MARCA, SALDOS_PRECO
						from ORDENSPRODUTOS
							join PRODUTOS on PRODUTOS_ID = ORDENSPRODUTOS_ID_PRODUTOS
							join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
							join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = results['ORDENS_ID_EMPRESAS']
						where ORDENSPRODUTOS_ID_ORDENS = results['ORDENS_ID'] 
						order by ORDENSPRODUTOS_ID`,
					ORDENS_SERVICOSITENS: `select 
							ORDENSSERVICOS.*, SERVICOS_NOME, SERVICOS_PRECO
						from ORDENSSERVICOS
							join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
						where ORDENSSERVICOS_ID_ORDENS = results['ORDENS_ID'] 
						order by ORDENSSERVICOS_ID`
				}});
			}
		});
	});
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			getOrdemMoveisById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [34, 43, 19, 55, 39, 29, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
									heights: 5,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
					
					let model = res.results[0];

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);
					let fanPessoa = (siglaFilial != 'FT' && model['PESSOAS_FANTASIA'] ? model['PESSOAS_FANTASIA'] : '');

					let obsOrdem =  (model['ORDENS_OBSERVACOES'] ? model['ORDENS_OBSERVACOES'].split('|').join(' ') : '\n\n\n\n');

					const emiOrdem     = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['ORDENS_PRODUTOSITENS'] || [];
					let servicos        = model['ORDENS_SERVICOSITENS'] || [];
					let rows            = docDefinition.content[0].table.body;
					let cnpMontador     = (model['MONTADORES_CPFCNPJ']||[]).length == 11 ? 'F' : 'J';

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(
						[
							{
								colSpan: 4,
								text: [
									{
										text: model['MONTADORES_NOME'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 8}
									},
									{
										text: `${model['MONTADORES_ENDERECO']} ${model['MONTADORES_NUMERO']} - ${model['MONTADORES_BAIRRO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: utils.string.maskCep(model['MONTADORES_CEP']) + ' ' + model['CIDADES_NOMEMONTADOR'] + ' ' + model['CIDADES_ESTADOMONTADOR'] + '\n',
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: (cnpMontador == 'F' ? 'CPF: ': 'CNPJ: ') + utils.string.maskCnp(model['MONTADORES_CPFCNPJ']) + (cnpMontador == 'F' ? '\nRG: ': '\nI.E.: ') + model['MONTADORES_INSCRICAO'],
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
								],
								border: [true, true, true, true]
							},{},{},{},
							{
								colSpan: 6,
								text: [	
									{
										text: 'a\n',
										color: 'white',
										fontSize: 10
									},							
									{									
										text: 'Ordem de Serviço',
										fontSize: 15,
										alignment: 'center'
									}
								]
							},{},{},{},{},{},
							{
								colSpan: 2,
								text: [
									{
										text: `\n`,
										fontSize: 8,
										alignment: 'center'
									},
									{
										text: `${siglaFilial}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 25
										}										
									}									
								]
							},{},
							{
								colSpan: 2,
								text: [
									{
										text: ''
									},
									{
										text: `\n`,
										fontSize: 6,
										alignment: 'center'
									},
									{
										text: model['ORDENS_NUMERO'],
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 15
										}
									},
									{
										text: `\n${emiOrdem}`,
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 10
										}										
									}									
								]
							},{}
						],
						[
							{
								text: 'Nome:'
							},
							{
								text: model['ORDENS_NOME'] + (fanPessoa.length > 0 ? ` (${fanPessoa.toUpperCase()})` : ''),
								colSpan: 9
							},{},{},{},{},{},{},{},{},
							{
								text: 'Cel:',
								alignment: 'right'
							},
							{
								text: utils.string.maskFone(model['PESSOAS_CELULAR']),
								colSpan: 3
							},
							{},{}
						],
						[
							{
								text: 'Endereço:',
								fontSize: 7.5
							},
							{
								text: model['PESSOAS_ENDERECO'],
								colSpan: 7
							},{},{},{},{},{},{},{
								text: 'Número:',
								alignment: 'right',
								style: {
									fontSize: 7.5
								}										
							},{
								text: model['PESSOAS_NUMERO'],
								alignment: 'right'
							},
							{
								text: 'Tel:',
								alignment: 'right'
							},
							{
								text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
								colSpan: 3
							},{},{}
						],
						[
							{
								text: 'Bairro:'
							},
							{
								text: model['PESSOAS_BAIRRO'],
								colSpan: 6
							},{},{},{},{},{},	
							{
								text: 'Cep:',
								alignment: 'right'
							}, 
							{
								text: model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
								colSpan: 2
							},{},
							{
								text: (model['ORDENS_CPFCNPJ'].length == 11 ? "RG:" : "I.E.:"),
								alignment: 'right'
							},{
								text: model['PESSOAS_INSCRICAO'],
								colSpan: 3
							},{},{}
						],
						[
							{
								text: 'Cidade:'
							},
							{
								text: model['CIDADES_NOME'],
								colSpan: 4
							},{},{},{},
							{
								text: 'UF:',
								alignment: 'right'
							},
							{
								text: model['CIDADES_ESTADO'],
								alignment: 'center'
							},	
							{
								text: model['ORDENS_CPFCNPJ'].length == 11 ? 'CPF:' : 'CNPJ:',
								alignment: 'right'
							}, 
							{
								text: utils.string.maskCnp(model['ORDENS_CPFCNPJ']),
								fontSize: (model['ORDENS_CPFCNPJ'].length == 11 ? 8 : 7),
								colSpan: 2
							},{},
							{
								text: '',
							},{
								text: '',
								colSpan: 3
							},{},{}
						],
						[
							{ 
								text: 'Obs:'
							},{
								text: (model['PESSOAS_PAGINA'] ? model['PESSOAS_PAGINA'] : ''),
								colSpan: 13
							},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);


					if(produtos.length > 0) {
						rows.push(
							[
								{ 
									text: 'a\n', 
									color: 'white',
									style: {
										fontSize: 1
									},
									colSpan: 14,									
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],	
							[
								{
									text: 'Código',
									alignment: 'center'
								},
								{
									text: 'Descrição do Produto',
									alignment: 'center',
									colSpan: 7
								}, 
								{},{},{},{},{},{},
								{
									text: 'Cor',
									alignment: 'center',
									colSpan: 2,
									fontSize: 6								
								},{},
								{
									colSpan: 2,
									text: 'Quantidade',
									alignment: 'center'								
								},{},
								{
									colSpan: 2,
									text: 'Total',
									alignment: 'center'								
								},{}
							]
						);

						for(let i in produtos){
							let qtdeProduto = produtos[i]['ORDENSPRODUTOS_QUANTIDADE'].toFixed(0);
							rows.push(
								[
									{							
										text: produtos[i]['ORDENSPRODUTOS_ID_PRODUTOS'],	
										alignment: 'center',
										style: {
											fontSize: 8
										}											
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 7,
										style: {
											fontSize: 8
										}
									},{},{},{},{},{},{},
									{
										text: produtos[i]['PRODUTOS_MARCA'],
										alignment: 'center',
										colSpan: 2,
										style: {
											fontSize: 8
										}
									},{},
									{
										colSpan: 2,
										text: qtdeProduto,
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_TOTAL']),
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{}
								]
							);
						}		
					}

					if(servicos.length > 0) {
						rows.push(
							[
								{ 
									text: 'a\n', 
									color: 'white',
									style: {
										fontSize: 1
									},
									colSpan: 14,									
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],	
							[
								{
									text: 'Código',
									alignment: 'center'
								},
								{
									text: 'Descrição do Serviço',
									alignment: 'center',
									colSpan: 9
								}, 
								{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: 'Quantidade',
									alignment: 'center'								
								},{},
								{
									colSpan: 2,
									text: 'Total',
									alignment: 'center'								
								},{}
							]
						);

						for(let i in servicos){
							let qtdeServico = servicos[i]['ORDENSSERVICOS_QUANTIDADE'].toFixed(0);
							rows.push(
								[
									{							
										text: servicos[i]['ORDENSSERVICOS_ID_SERVICOS'],
										alignment: 'center',
										style: {
											fontSize: 8
										}											
									},
									{
										text: servicos[i]['SERVICOS_NOME'],
										colSpan: 9,
										style: {
											fontSize: 8
										}
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 2,
										text: qtdeServico,
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_TOTAL']),
										alignment: 'right',
										style: {
											fontSize: 8
										}																			
									},{}
								]
							);
						}		
					}
					
					rows.push(
						[
							{
								text: '',
								colSpan: 8
							},{},{},{},{},{},{},{},							
							{
								text: 'TOTAL:',
								bold: true,
								colSpan: 2,
								alignment: 'right'
							},{},
							{
								colSpan: 2,
								text: (produtos.length + servicos.length),
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true
								}																		
							},{},
							{
								colSpan: 2,
								text: utils.number.float2moeda(model['ORDENS_TOTAL']),
								alignment: 'right',
								style: {
									fontSize: 9,
									bold: true							
								}																			
							},{}
						]
					)

					rows.push(
						[
							{
								text: '',
								colSpan: 7,
								alignment: 'center',
								border: [true, true, true, false],
								style: {
									fontSize: 8,
									bold: true
								}																			

							},{},{},{},{},{},{},
							{
								text: obsOrdem,
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, false]
							},{},{},{},{},{},{}

						]
					)

					rows.push(
						[
							{
								text: '__________________________________________________',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, false],								
								style: {
									fontSize: 10
								}																			

							},{},{},{},{},{},{},
							{
								text: '',
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, false]								
							},{},{},{},{},{},{}

						]
					)

					rows.push(
						[
							{
								text: 'Assinatura',
								colSpan: 7,
								alignment: 'center',
								border: [true, false, true, true],								
								style: { fontSize: 10 }

							},{},{},{},{},{},{},
							{
								text: '',
								colSpan: 7,
								alignment: 'left',
								border: [true, false, true, true]
							},{},{},{},{},{},{}

						]
					)

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
