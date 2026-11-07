'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getRelPessoas = async function(params){
	try {
		const { tipo, 
				ordem, 
				inicio, 
				final, 
				relacao,
				datainicio,
				datafinal,
				status } = params;

		let sqlWhere = `where PESSOAS_ID > 0 `;
		let sqlOrder = '';
		let sqlDatas = '';

		if(tipo && tipo != 0){
			sqlWhere += `and PESSOAS_TIPO = '${tipo}' `;
		}
			
		if(status && status != 2) {
			sqlWhere += `and PESSOAS_STATUS = '${status == 0 ? 'T' : 'F'}' `
		}

		if(parseInt(relacao) > 0 && datainicio && datafinal && datainicio != 'Data inválida' && datafinal != 'Data inválida') {
			if(relacao == '1') {  // Sem movimento
			   sqlWhere += `and not exists(
											select MOVIMENTOS_ID from MOVIMENTOS
											where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
											MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and
											((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
											(right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
											((MOVIMENTOS_STATUS <> 'C') and
											 (MOVIMENTOS_STATUS <> 'D') and
											 (MOVIMENTOS_STATUS <> 'R') and
											 (MOVIMENTOS_STATUS <> 'V')) `
			} else {  // Com movimento
				sqlWhere += `and exists(
					select MOVIMENTOS_ID from MOVIMENTOS
					where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
					MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and
					((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
					(right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
					((MOVIMENTOS_STATUS <> 'C') and
					(MOVIMENTOS_STATUS <> 'D') and
					(MOVIMENTOS_STATUS <> 'R') and
					(MOVIMENTOS_STATUS <> 'V')) `
			}
		}

		if(parseInt(relacao) > 0 && datainicio && datafinal && datainicio != 'Data inválida' && datafinal != 'Data inválida') {
		   sqlDatas = `MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and `
		}

		if(ordem == 0) {
			sqlWhere += inicio ? `and PESSOAS_NOME like '${inicio}%' ` : ''; 
			sqlOrder = ' order by PESSOAS_NOME ';  
		} else if (ordem == 9) {
			sqlWhere += inicio ? `and PESSOAS_FANTASIA like '${inicio}%' ` : '';
			sqlOrder = ' order by PESSOAS_NOME ';  
		} else if (ordem == 4) {
			sqlWhere += inicio ? `and PESSOAS_CPFCNPJ = '${inicio}' ` : '';
			sqlOrder = ' order by PESSOAS_ID ';  
		} else if (ordem == 5) {
			sqlWhere += (inicio && final) ? `and PESSOAS_ID between ${inicio} and ${final}` : '';
			sqlOrder = ' order by PESSOAS_ID ';  
		} else if (ordem == 7) {
			sqlWhere += `and (
				CIDADES.CIDADES_NOME         like '%${inicio}%' or
				CIDADESCOBRANCA.CIDADES_NOME like '%${inicio}%'
			)`;
			sqlOrder = ' order by CIDADES.CIDADES_NOME, PESSOAS_NOME ';  
		}

		const sql = `select PESSOAS.*, 
		coalesce((select max(MOVIMENTOS_EMISSAO) from MOVIMENTOS
		where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
								${sqlDatas}
								((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
								(right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
								MOVIMENTOS_STATUS <> 'C'), '1899-12-30') as PESSOAS_ULTIMA,            
				CIDADES.CIDADES_NOME,CIDADES.CIDADES_ESTADO,CIDADES.CIDADES_IBGE,
				CIDADESCOBRANCA.CIDADES_NOME as CIDADES_NOMECOBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADES_ESTADOCOBRANCA,
				CIDADESCOBRANCA.CIDADES_IBGE   as CIDADES_IBGECOBRANCA,
				USUARIOS_NOME 
			from PESSOAS
			left outer join USUARIOS                   on USUARIOS_ID = PESSOAS_ID_USUARIOS
			left outer join CIDADES                    on CIDADES.CIDADES_ID         = PESSOAS.PESSOAS_ID_CIDADES
			left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
			${sqlWhere} ${sqlOrder}`;

		const results = await samosFB.executeSQL(sql, params);

		return { results }
	} catch(error) {
		const msg = 'Falha ao buscar pessoas';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let pathLogo;
		let intervalo = params.datainicio != 'Data inválida' && params.datafinal != 'Data inválida' ? 
		                'Entre ' + params.datainicio + ' e ' + params.datafinal : '';
		let tipo = params.relacao == '1' ? ' - Sem Movimento' : 
		           params.relacao == '2' ? ' - Com Movimento' : '';

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
							text: `Relatório de Pessoas ${tipo} ${intervalo}`,
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
				{columns: [{},{},{},{},{},{},{},{},{},{}]},				
				{
					style: 'tableExample',
					table: {   //CD  NOM  END  NR  BAI  CP  MN  UF FO  UL
						widths: [22, 185, 130, 30, 80, 40, 90, 15, 60, 40],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Cód',
									style: 'tableHeader'
								},
								{
									text: 'Fantasia/Nome',
									style: 'tableHeader',
									alignment: 'center'
								}, 
								{
									text: 'Endereço',
									style: 'tableHeader'
								},
								{
									text: 'N°',
									style: 'tableHeader'
								},
								{
									text: 'Bairro',
									style: 'tableHeader'
								},	
								{
									text: 'CEP',
									style: 'tableHeader'
								},															
								{
									text: 'Cidade',
									style: 'tableHeader'
								}, 
								{
									text: 'UF',
									style: 'tableHeader'
								},
								{
									text: 'Fone',
									style: 'tableHeader'
								},
								{
									text: 'Última',
									style: 'tableHeader'
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
					fontSize: 10,
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
			getRelPessoas(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					for(let i in res.results){
						const cepArray = res.results[i]['PESSOAS_CEP'].split('');
						cepArray.splice(5,0,'-');
						const cepMascarado = cepArray.join('');
						const ultimaCompra = moment(res.results[i]['PESSOAS_ULTIMA']);

						rows.push([
							{
								text: ("00000" + res.results[i]['PESSOAS_ID']).slice(-5),
								style: {fontSize: 7}
							},							
							{   text: res.results[i]['PESSOAS_FANTASIA'] || res.results[i]['PESSOAS_NOME'],
								style: {fontSize: 7}
							},
							{ 
								text: res.results[i]['PESSOAS_ENDERECO'],
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['PESSOAS_NUMERO'],
								style: {fontSize: 7}								
							},
							{
								text: res.results[i]['PESSOAS_BAIRRO'],
								style: {fontSize: 7}
							},
							{
								text: cepMascarado,
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['CIDADES_NOME'],
								style: {fontSize: 7}
							},
							{
								text: res.results[i]['CIDADES_ESTADO'],
								style: {fontSize: 7}
							},
							{
								text: utils.string.maskFone(res.results[i]['PESSOAS_TELEFONE']),
								style: {fontSize: 7}
							},
							{
								text: `${ultimaCompra.isSameOrBefore('1900-01-01') ? '' : ultimaCompra.format('DD/MM/YYYY')}`,
								style: {fontSize: 7}								
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
