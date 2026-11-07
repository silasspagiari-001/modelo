'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB = require('../../../services/samosFirebird');
const moment    = require('moment-timezone');

const getPrecos = async function(params){
	return new Promise(async (resolve, reject) => {
		const { empresa, tipo, produtoinicial, produtofinal, grupoinicial, grupofinal, situacao} = params;
		const db = await samosFB.conectarBanco(params.client);
		let sqlWhere = (tipo == 2 ? 'SALDOS_PRAZO > 0 and ' : '');
		sqlWhere += (situacao == 0 ? 'SALDOS_DISPONIVEL > 0 and ' : '');

		//Se ativo, ele vai ordenar pelo campo PRODUTOS_ID_MONTAGENS, que no caso é a ordem do produto no relatorio
		let usarOrdemPrecedencia = true;

		let sqlSearch = `
		  select PRODUTOS_ID, 
				 PRODUTOS_NOME, 
				 PRODUTOS_UNIDADE, 
				 PRODUTOS_PESOLIQUIDO,
				 PRODUTOS_ID_GRUPOS, 
				 SALDOS_TRANSFERENCIA,
				 SALDOS_CUSTO,
				 SALDOS_PRECO, 
				 SALDOS_PRAZO, 
				 GRUPOS_NOME
		  from PRODUTOS
		  left outer join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
		  left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
		  where PRODUTOS_ID between ${produtoinicial} and ${produtofinal} and
				PRODUTOS_ID_GRUPOS between ${grupoinicial} and ${grupofinal} and
				${sqlWhere}
				PRODUTOS_NOME <> ''
		  ${usarOrdemPrecedencia ? "order by PRODUTOS_ID_GRUPOS, PRODUTOS_ID_MONTAGENS" : "order by PRODUTOS_ID_GRUPOS, PRODUTOS_NOME"}`

		db.query(sqlSearch, (error, results) => {
			if (error) {
				samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
			} else {
				samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
			}
		});
	});
}

module.exports = {
    read: params => {
		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

		let tamNome     = (params.tipo == 0 || params.tipo == 2 ? 250 : params.tipo == 3 ? 310 : 190);
		let tamPreco    = (params.tipo == 0 || params.tipo == 1 ? 50 : 1);
		let tamPromocao = (params.tipo == 1 || params.tipo == 2 ? 50 : 1);

		let tamPeso  = (params.tipo == 1 || params.tipo == 2 ? 50 : 50);
		let tamCusto = (params.tipo == 2 || params.tipo == 3 ? 1 : 50);
		let tamBarra = (params.tipo == 2 || params.tipo == 3 ? 1 : 50);

		//Se for o tipo "Promoção" aumenta um pouco mais o nome e o promoção
		if( params.tipo == 2 ){
			tamNome = 310;
			tamPromocao = 70;
		}

		//Se for o tipo "Apenas descrição"
		if( params.tipo == 3 ){
			tamNome = 460;
			tamPeso = 1;
			tamBarra = 1;
			tamCusto = 1;
		}

		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [12, 40, 40, 35],
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
							text: 'Lista de Preços',
							width: '*',
							style: {
								fontSize: 16,
								alignment: 'center',
								color: 'red'
							}
						},
						{
							stack: [
								''
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
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			},
			content: [
				{columns: [{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //CD  NOM     UNI  PESO     BARRA     CUSTO      PRECO     PROMOCAO
						widths: [40, tamNome, 20, tamPeso, tamBarra, tamCusto,  tamPreco, tamPromocao],
						headerRows: 1,						
						body: [
							[
								{
									text: 'Código',
									style: 'tableHeader',
									alignment: 'center'									
                                },
								{
									text: 'Descrição do Produto',
									style: 'tableHeader',
									alignment: 'center'
                                },
								
								params.tipo == 3? {
									text: 'Un',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 4,
									border: (params.tipo == 0 || params.tipo == 1 || params.tipo == 3 ? [true, true, true, true] : [true, true, false, true]),
                                } : {
									text: 'Un',
									style: 'tableHeader',
									alignment: 'center',
									border: (params.tipo == 0 || params.tipo == 1 || params.tipo == 3 ? [true, true, true, true] : [true, true, false, true]),
                                },          
								
								params.tipo != 2 ? {
									text: 'Peso',
									style: 'tableHeader',
									alignment: 'center',
									border: [true, true, true, true]
                                } : {
									text: 'Peso',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 4,
									border: [true, true, true, true]
                                },  

								{
									text: (params.tipo != 2 ? 'Barra' : ''),
									style: 'tableHeader',
									alignment: 'center',
									border: [true, true, true, true]
                                },     

								params.tipo != 2 ? {
									text: 'Custo',
									style: 'tableHeader',
									alignment: 'center',
									border: [true, true, true, true]
                                } : {
									text: '',
									style: 'tableHeader',
									alignment: 'center',
									colSpan: 2,
									border: [true, true, true, true]
                                },        

                                {
									text: (params.tipo == 0 || params.tipo == 1 ? 'Preço' : ''),
									style: 'tableHeader',
									alignment: 'center',
									border: (params.tipo == 0 || params.tipo == 1 ? [true, true, true, true] : params.tipo == 3 ? [false, false, false, false] : [false, true, false, true]),
                                },
								{
									text: (params.tipo == 1 || params.tipo == 2 ? 'Promoção' : ''),
									style: 'tableHeader',
									alignment: 'center',
									border: (params.tipo == 1 || params.tipo == 2 ? [true, true, true, true] : [false, false, false, false]),
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
					fontSize: 7,
					margin: [0, 0, 0, 0]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			getPrecos(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;
					let ultimoGrupo = 0;					
					for(let i in res.results){

						if(ultimoGrupo !== res.results[i]['PRODUTOS_ID_GRUPOS']) { 	
							ultimoGrupo = res.results[i]['PRODUTOS_ID_GRUPOS'];
							rows.push([
								{
									text: res.results[i]['GRUPOS_NOME'],
									alignment: 'center',
									fontSize: 14,
									color: 'blue',
									bold: true,							
									colSpan: 8,
									border: [false, false, false, false],
									style: 'tableExample'							
								},{},{},{},{},{},{},{}
							]);
						}							

						rows.push([
							{
								text: ("00000" + res.results[i]['PRODUTOS_ID']).slice(-5),
								alignment: 'right',
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
                                text: params.tipo == 3 ? ('\t'.repeat(3) + res.results[i]['PRODUTOS_UNIDADE']) : res.results[i]['PRODUTOS_UNIDADE'],
								alignment: params.tipo == 3 ? 'right' : 'center',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
							{
                                text: params.tipo == 3 ? '' : utils.number.float2moeda(res.results[i]['PRODUTOS_PESOLIQUIDO']),
								alignment: params.tipo == 2 ? 'right' : 'center',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
							{
                                text: (params.tipo == 0 || params.tipo == 1 ? utils.number.float2moeda(res.results[i]['SALDOS_TRANSFERENCIA']) : ''),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
							{
                                text: (params.tipo == 0 || params.tipo == 1 ? utils.number.float2moeda(res.results[i]['SALDOS_CUSTO']) : ''),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
                            {
								text: (params.tipo == 0 || params.tipo == 1 ? utils.number.float2moeda(res.results[i]['SALDOS_PRECO']) : ''),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]								
                            },
                            {
								text: (params.tipo == 1 || params.tipo == 2 ? utils.number.float2moeda(res.results[i]['SALDOS_PRAZO']) : ''),
								alignment: 'right',
								style: 'tableExample',
								border: [false, false, false, false]
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
