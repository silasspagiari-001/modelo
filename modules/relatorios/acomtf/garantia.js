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
						pageSize: 'A4',                //  [E    S   D   I]
						pageMargins: [128, 54, 20, 25], // [120, 212, 20, 25]  
						content: [
							{
								style: 'tableReport',
								table: {
									//        1  2   3   4   5   6   7
									widths: [10, 6, 12, 230, 15, 8, 32],
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
					let emiOrdem = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let rows     = docDefinition.content[0].table.body;

					rows.push(
						[
                            { text: '', colSpan: 2, border: [false, false, false, false]},{},
							{
								text: model['EMPRESAS_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{}
						],
						[
                            { text: '', colSpan: 4, border: [false, false, false, false]},{},{},{},
							{
								text: emiOrdem,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false],
								colSpan: 3
							},{},{}
						],
						[
                            { text: '', colSpan: 2, border: [false, false, false, false]},{},
							{
								text: model['ORDENS_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{}
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['PESSOAS_ENDERECO'],
								alignment: 'left',
                                colSpan: 6,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{},{}
                        ],
						[
							{
								text: model['CIDADES_NOME'],
								alignment: 'left',
                                colSpan: 5,
								style: {bold: true},
								border: [false, false, false, false],
							},{},{},{},{},
                            {
								text: model['CIDADES_ESTADO'],
								colSpan: 2,
								alignment: 'left',
								style: {bold: true},
								border: [false, false, false, false]
                            },{}
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['ORDENS_IDENTIFICACAO'],
								colSpan: 3,
								alignment: 'left',
								border: [false, false, false, false]								
							},{},{},
                            {
								text: model['ORDENS_GEOLOCALIZACAO'],
								colSpan: 3,
								alignment: 'center',
                                fontSize: 7,
								border: [false, false, false, false]								
                            },{},{}
						],
						[
                            { text: 'A', color: 'white', fontSize: 6, colSpan: 7, border: [false, false, false, false]},{},{},{},{},{},{}  // Só pra ajuste
                        ],
						[
                            { text: '', border: [false, false, false, false]},
							{
								text: model['ORDENS_REFERENCIA'],
								colSpan: 6,
								alignment: 'left',
								border: [false, false, false, false]								
							},{},{},{},{},{}
                        ]
					);
											
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};