'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getOrdemById = async function(id, params){
	try {
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
				PESSOAS.PESSOAS_ID_CIDADES,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				PRODUTOS_NOME,
				PRODUTOS_BARRA,
				SALDOS_CSTLOCAL, 
				SALDOS_CSTOUTROS,
				DOCUMENTOS_NOME,
				DOCUMENTOS_LAYOUT,
				DOCUMENTOS_ID_APLICACOES,
				DOCUMENTOS_ALTERAPRECO,
				APLICACOES_NOME
			from ORDENS 
				left join PESSOAS    on PESSOAS_ID = ORDENS_ID_PESSOAS
				left join EMPRESAS   on EMPRESAS_ID = ORDENS_ID_EMPRESAS
				left join CIDADES    on CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
				left join CIDADES    as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS_ID_CIDADES
				left join PRODUTOS   on PRODUTOS_ID = ORDENS_IDSKY
				left join SALDOS     on SALDOS_ID_EMPRESAS = ORDENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = PRODUTOS_ID
				left join DOCUMENTOS on DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
				left join APLICACOES on APLICACOES_ID = DOCUMENTOS_ID_APLICACOES
			${sqlWhere} ${sqlOrder} `; 
		
		const results = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(results.map(async ordem => {
			const sqlProdutos = `select 
				ORDENSPRODUTOS.*, 
				PRODUTOS_NOME, 
				PRODUTOS_MARCA, 
				SALDOS_PRECO
			from ORDENSPRODUTOS
			left outer join PRODUTOS on PRODUTOS_ID = ORDENSPRODUTOS_ID_PRODUTOS
			left outer join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = ${ordem['ORDENS_ID_EMPRESAS']}
			where ORDENSPRODUTOS_ID_ORDENS = ${ordem['ORDENS_ID']} 
			order by ORDENSPRODUTOS_ID`;

			ordem['ORDENS_PRODUTOSITENS'] = await samosFB.executeSQL(sqlProdutos, params);

			const sqlServicos = `select 
				ORDENSSERVICOS.*, 
				SERVICOS_NOME, 
				SERVICOS_PRECO
			from ORDENSSERVICOS
			left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
			where ORDENSSERVICOS_ID_ORDENS = ${ordem['ORDENS_ID']}
			order by ORDENSSERVICOS_ID`;

			ordem['ORDENS_SERVICOSITENS'] = await samosFB.executeSQL(sqlServicos, params);
		}));

		return { 
			results, 
			total: results.length 
		};
	} catch(error) {
		const msg = 'Falha ao buscar ordens por id';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			getOrdemById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Cod   [Descricao  ]   C   L
									//        1   2   3   4   5   6   7
									widths: [70, 90, 60, 60, 60, 80, 80],
									heights: 5,
									body: []
								},
								style: {
									fontSize: 10
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
						
					let model       = res.results[0];
					let itensPagina = 0;

					let obsOrdem = (model['ORDENS_OBSERVACOES'] ? model['ORDENS_OBSERVACOES'].split('|').join(' ') : '\n\n\n\n');

					let emiOrdem = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let produtos = model['ORDENS_PRODUTOSITENS'] || [];
					let rows     = docDefinition.content[0].table.body;

					let itensEspelho = [
						'CARCAÇA CENTRAL',
						'PRATO',
						'COLAR',
						'MANCAL DE ENCOSTO',
						'MANCAL RADIAL',
						'ESPACADOR',
						'ANEL DE COLAR',
						'ANEL DE EIXO',
						'ANEL VITON CENTRAL',
						'TRAVA DE MANCAL',
						'FLANGE',
						'ROTOR', 
						'EIXO'
					];

					rows.push(
						[
							{
								text: model['EMPRESAS_FANTASIA'],
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
							},
							{
								text: `${model['DOCUMENTOS_NOME'].toUpperCase()} - INTERNA`,
								alignment: 'center',
								colSpan: 5,
								border: [false, false, false, false],								
								style: {bold: true, fontSize: 12}
							},{},{},{},{},
							{
								text: 'Nº ' + model['ORDENS_REFERENCIA'],
								alignment: 'right',
								style: {bold: true},
								border: [false, false, false, false]
							}
						],
						[

							{
								text: 'Emissao: ' + emiOrdem,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
								colSpan: 2
							},{},
							{
								text: ``,
								colSpan: 3,
								border: [false, false, false, false],
								style: {bold: true,	fontSize: 7}
							},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								colSpan: 2,
								border: [false, false, false, false],
								style: {bold: true}
							},{}
						],
						[
							{
								text: 'Cliente: ' + model['ORDENS_NOME'],
								colSpan: 5,
								border: [false, true, false, false],

							},{},{},{},{},
							{
								text: 'Código: ' + model['ORDENS_ID_PESSOAS'],
								colSpan: 2,
								alignment: 'right',
								border: [false, true, false, false]								
							},{}
						],
						[
							{
								text: 'Equipamento: ' + model['PRODUTOS_NOME'],
								colSpan: 4,
								border: [false, true, false, false]								
							},{},{},{},
							{
								text: 'Situação: ' + (model['ORDENS_STATUS'] == 'N' ? 'Aberta' : model['ORDENS_STATUS'] == 'E' ? 'Fechada' : 'Faturada'),
								colSpan: 3,
								border: [false, true, false, false]								
							},{},{}
						],
						[
							{
								text: 'Modelo: ' + model['ORDENS_IDENTIFICACAO'],
								colSpan: 3,
								border: [false, true, false, false]								
							},{},{},
							{
								text: 'Aplicação: ' + model['ORDENS_GEOLOCALIZACAO'],
								colSpan: 4,
								border: [false, true, false, false]								
							},{},{},{}	
						],
						[
							{
								text: 'Defeito : ' + obsOrdem,
								colSpan: 7,
								alignment: 'justify',
								border: [false, false, false, false]								
							},{},{},{},{},{},{}
						],
						[
							{ 
								text: 'DESCRIÇÃO DO MATERIAL APLICADO',
								colSpan: 7,
								alignment: 'center',
								border: [false, true, false, false]
							},{},{},{},{},{},{}
						]
					);

					rows.push(
						[
							{
								text: 'Código',
								alignment: 'center'
							},
							{
								text: 'Descrição do Produto',
								alignment: 'center',
								colSpan: 3
							}, 
							{},{},
							{
								text: 'Qtde',
								alignment: 'center'								
							},
							{
								text: 'Unitário',
								alignment: 'center'								
							},
							{
								text: 'Total',
								alignment: 'center'								
							}
						]
					);

					if(produtos.length > 0) {
						for(let i in produtos){

							rows.push(
								[
									{							
										text: produtos[i]['ORDENSPRODUTOS_ID_PRODUTOS'],
										alignment: 'right'
									},
									{
										text: produtos[i]['PRODUTOS_NOME'],
										colSpan: 3,
									},{},{},
									{ 
										text: produtos[i]['ORDENSPRODUTOS_QUANTIDADE'], 
										alignment: 'right'
									},
									{ 
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_PRECO']), 
										alignment: 'right'
									},
									{ 
										text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_TOTAL']),
										alignment: 'right'
									}
								]
							);

							itensPagina++

							if(itensPagina > 13) {
								itensPagina = 0;
								rows.push( // Aqui fecho o rodapé de cada página
									[
										{
											colSpan: 7,
											text: 'Continua...',
											pageBreak: 'after',
											border: [false, false, false, false]
										},{},{},{},{},{},{}
									]						
								);									
							}

						}		
					} else { // Lista default
						for(let i in itensEspelho){

							rows.push(
								[
									{							
										text: ' ',
									},
									{
										text: itensEspelho[i],
										colSpan: 3,
									},{},{},
									{ text: ' '},   // Qtde
									{ text: ' '},   // Unitário
									{ text: ' '}   // Total																
								]
							);

							itensPagina++

							if(itensPagina > 13) {
								itensPagina = 0;
								rows.push( // Aqui fecho o rodapé de cada página
									[
										{
											colSpan: 7,
											text: 'Continua...',
											pageBreak: 'after',
											border: [false, false, false, false]
										},{},{},{},{},{},{}
									]						
								);									
							}

						}		
					}

					if(itensPagina < 13) {
						for(let lB = itensPagina; lB < 13; lB++) {
							rows.push([ //linhas restantes até completar 1/2 A4
								{							
									text: ' ',
								},
								{
									text: 'A',
									color: 'white',
									colSpan: 3,
								},{},{},
								{ text: ' '},   // Qtde
								{ text: ' '},   // Unitário
								{ text: ' '}   // Total																
							]);	
						}
					}
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};