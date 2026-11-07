'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);
const samosFB   = require('../../../services/samosFirebird');



module.exports = {
    read: params => {
		let docDefinition = {};
		docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],  // E S D I
			content: [
				{columns: [{},{},{},{},{},{},{}]},  // 7 Colunas
				{
					style: 'tableExample',
					table: { 
                        dontBreakRows: true,						
						widths: [50, 75, 75, 75, 75, 40, 100],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
						'_'.repeat(100),  // antes 95
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
					],
					margin: [25, 10]
				};
			},
			styles: {
				tableExample: {
					fontSize: 12,
					margin: [0, 0, 0, 0],
					border: 0
				},
				tableHeader: {
					bold: true,
					fontSize: 12,
					color: 'black'
				}
			}
		};

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.vendaestado().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

					let ufQtdeVenda     = 0;
					let totalQtdeVenda   = 0;
					let ultimoEstado = '';

					const db             = await samosFB.conectarBanco(params.client); 

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
								width: 100,
								height: 22,	
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Relação de Vendas por Estado',
								colSpan: 3,
								fontSize: 16,
								alignment: 'center',
								color: 'blue',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								colSpan: 2,
								fontSize: 12,
								alignment: 'right',
								border: [false, false, false, false]								
							},{}
						],
						[
							{							
								text: ' ',
								colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{ 
								text: 'Período: ' + params.inicio + ' a ' + params.final,
								colSpan: 3,
								alignment: 'center',
								border: [false, false, false, false]
							},{},{},
							{
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								colSpan: 2,
								alignment: 'right',
								border: [false, false, false, false]
							},{}
						],	
					);
					
					rows.push( 
						[
							{
								text: 'Código',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Descrição do Produto',
								style: 'tableHeader',
								alignment: 'center',
								colSpan: 4									
							},{},{},{},
							{
								text: 'Unid',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Quantidade',
								style: 'tableHeader',
								alignment: 'center'									
							}
						]
					)

					let model;

					for(let i in res.results){

						model = res.results[i];

						if(ultimoEstado != model['CIDADES_ESTADO']) {
							if(ufQtdeVenda > 0) {
	
								rows.push([
									{
										text: 'TOTAL DO ESTADO',
										bold: true,
										alignment: 'right',
										style: 'tableExample',
										colSpan: 6,
										border: [false, false, false, false]
									},{},{},{},{},{},
									{
										text: ufQtdeVenda,
										bold: true,
										alignment: 'right',
										style: 'tableExample',
										border: [false, false, false, false]										
									}
								]);	
								ufQtdeVenda = 0;
							}

							rows.push([
								{
									text: `Estado: ${estadoExtenso(model['CIDADES_ESTADO'])} (${model['CIDADES_ESTADO']})`,
									bold: true,
									fontSize: 14,
									alignment: 'center',
									style: 'tableExample',
									colSpan: 7,
									border: [false, false, false, false]
								},{},{},{},{},{},{}
							]);	

							ultimoEstado = model['CIDADES_ESTADO'];
						}	

						rows.push([
							{
								text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: model['PRODUTOS_NOME'],
								style: 'tableExample',								
								colSpan: 4
							},{},{},{},
							{
								text: model['PRODUTOS_UNIDADE'],
								alignment: 'center',
								style: 'tableExample',
							},
							{
								text: model['QUANTIDADE_TOTAL'],
								alignment: 'right',
								style: 'tableExample',
							}
						]);	

						ufQtdeVenda     += model['QUANTIDADE_TOTAL'];
						totalQtdeVenda  += model['QUANTIDADE_TOTAL'];

					}					

					rows.push([
						{
							text: 'TOTAL DO ESTADO',
							bold: true,
							alignment: 'right',
							style: 'tableExample',
							colSpan: 6,
							border: [false, false, false, false]
						},{},{},{},{},{},
						{
							text: ufQtdeVenda,
							bold: true,
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false]
						}
					]);	

					rows.push([
						{
							text: 'TOTAL GERAL',
							bold: true,
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false],
							colSpan: 6
						},{},{},{},{},{},
						{
							text: totalQtdeVenda,
							bold: true,							
							alignment: 'right',
							style: 'tableExample',
							border: [false, false, false, false]
						}
					]);	

					db.detach();

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};

const estadoExtenso = function(sigla) {

	const estados = {
		'AC': 'Acre',
		'AL': 'Alagoas',
		'AP': 'Amapá',
		'AM': 'Amazonas',
		'BA': 'Bahia',
		'CE': 'Ceará',
		'DF': 'Distrito Federal',
		'ES': 'Espírito Santo',
	    'EX': 'Exterior (Exportação)',
		'GO': 'Goiás',
		'MA': 'Maranhão',
		'MT': 'Mato Grosso',
		'MS': 'Mato Grosso do Sul',
		'MG': 'Minas Gerais',
		'PA': 'Pará',
		'PB': 'Paraíba',
		'PR': 'Paraná',
		'PE': 'Pernambuco',
		'PI': 'Piauí',
		'RJ': 'Rio de Janeiro',
		'RN': 'Rio Grande do Norte',
		'RS': 'Rio Grande do Sul',
		'RO': 'Rondônia',
		'RR': 'Roraima',
		'SC': 'Santa Catarina',
		'SP': 'São Paulo',
		'SE': 'Sergipe',
		'TO': 'Tocantins'
	  };

      if (estados.hasOwnProperty(sigla)) {
		return estados[sigla];
	  } else {
	  	return 'Sigla de estado inválida';
	  }	

};