'use strict';  // Relação para acerto - baixa receber/pagar

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    create: async (financeiro, params) => {
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 15],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Emp Num Par Emi Vct Ori Jur Dsc Abe Prz Nom Cel
						       // 1   2   3   4   5   6   7   8   9   10  11  12
						widths: [16, 36, 16, 55, 55, 60, 45, 45, 60, 52, 200, 52],
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
					fontSize: 9,
					color: 'black'
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.financeiros().readById(financeiro.ids, params)
				.then(res => {

					let rows = docDefinition.content[1].table.body;

					let totalOriginal  = 0;
					let totalJuros     = 0
                    let totalDescontos = 0;
					let totalAberto    = 0;
					
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${financeiro.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(
                        [
                            {
								image: pathLogo,
                                width: 80,
                                colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{
								colSpan: 9,
								text: 'Relação de Baixas a ' + (financeiro.tipo == 'R' ? 'Receber' : 'Pagar') + (financeiro.selecionados == 'true' ? ' (Selecionados)' : ''),
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('DD/MM/YYYY'),
								alignment: 'right',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]
							}
						],
						[
                            {
								text: res.results[0]['EMPRESAS_FANTASIA'].split(' ')[0] + ' ' + res.results[0]['EMPRESAS_FANTASIA'].split(' ')[2],
								colSpan: 2,
								alignment: 'left',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]																
							},{},
							{
								colSpan: 9,
								text: 'Vencimento: ' + financeiro.inicio + ' a ' + financeiro.final,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},
                            {
								text: moment.tz(params.timezone).format('HH:mm:ss'),
								alignment: 'right',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]								
							}
						]
					);

					rows.push(					
						[
							{
								text: 'Emp',
								style: 'tableHeader',
                                fontSize: 7,
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
							},
							{
								text: 'Pessoa',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Fone',
								style: 'tableHeader',
								alignment: 'center'									
							}
						]					
                    );

					for(let i in financeiro.titulosimp){	

						const model = financeiro.titulosimp[i];

						rows.push([
							{
								text: model['FINANCEIROS_ID_EMPRESAS'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['FINANCEIROS_NUMERO'],
								alignment: 'right',
								style: 'tableExample',
							},							
							{
								text: model['FINANCEIROS_PARCELA'],
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(model['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(model['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},                            
							{
								text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['FINANCEIROS_JUROS'] > 0 ? utils.number.float2moeda(model['FINANCEIROS_JUROS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},								
							{
								text: model['FINANCEIROS_DESCONTOS'] > 0 ? utils.number.float2moeda(model['FINANCEIROS_DESCONTOS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(model['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: (model['PRAZOCALCULADO_FINANCEIRO'] * -1),
								alignment: 'right',
								style: 'tableExample'
							},
                            {
								text: model['PESSOAS_NOME'].slice(0, 40),
								style: 'tableExample'
                            },
                            {
								text: utils.string.maskFone(model['PESSOAS_CELULAR']),
								style: 'tableExample',
                                fontSize: 7
                            }                            								
						]);


						if(model['FINANCEIROS_OBSERVACOES'].length > 0) {
							rows.push([
								{
									text: 'Obs: ' + model['FINANCEIROS_OBSERVACOES'],
									alignment: 'left',
									style: 'tableExample',
									colSpan: 12
								},{},{},{},{},{},{},{},{},{},{},{}
							]);	
						}						

						totalOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						totalJuros     += (model['FINANCEIROS_JUROS'] * 100);
						totalDescontos += (model['FINANCEIROS_DESCONTOS'] * 100);

					}

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
						},
                        {
							text: '',
							border: [false, false, false, false]
						},
                        {
							text: '',
							border: [false, false, false, false]
						},
                        {
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