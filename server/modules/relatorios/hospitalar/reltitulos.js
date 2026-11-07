'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'landscape',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 35],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {  //Emp Num Ser Par Nom Por Emi Vct Pgt Ori Abe Pago Prazo
						       // 1   2   3   4   5   6   7   8   9  10  11  12  13
						widths: [20, 36, 16, 16,250, 20, 45, 45, 45, 52, 52, 52, 30],
						headerRows: 3,
						body: []
					}
				}
			],
			footer: function(page, pages) {
				return { 
					stack: [ 
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
            delete params.limit;
			api.financeiros().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let totalOriginal  = 0;
					let totalAberto    = 0;
					let totalPago      = 0;

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
								colSpan: 7,
								text: 'Relação de Titulos - ' + (params.tipo == 'R' ? 'Receber' : 'Pagar'),
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
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
								colSpan: 7,
								text: 'Vencimento: ' + params.inicio + ' a ' + params.final,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},{},
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
								text: 'Emp',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Sér',
								style: 'tableHeader',
								alignment: 'center'									
							},							
							{
								text: 'Par',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Pessoa',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Por',
								style: 'tableHeader',
								alignment: 'center'									
							},
							{
								text: 'Emissão',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Vencto',
								style: 'tableHeader',
								alignment: 'center'									
							},                   
							{
								text: 'Pagto',
								style: 'tableHeader',
								alignment: 'center'									
							},                   
							{
								text: 'Original',
								style: 'tableHeader',
								alignment: 'center'									
							},                                             
							{
								text: 'Aberto',
								style: 'tableHeader',
								alignment: 'center'
							},           
							{
								text: 'Pago',
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

						const model = res.results[i];

						if(model['FINANCEIROS_TIPO'] == 'R' && model['FINANCEIROS_SERIE'] != 'NE') {
							continue; // Imprime só os títulos de notas, se for o receber
						}
						const dataPagamento = moment(model['FINANCEIROS_PAGAMENTO']).isSameOrBefore('1900-01-01') ? '' : moment(model['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY');

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
								text: model['FINANCEIROS_SERIE'],
								alignment: 'center',
								style: 'tableExample',
							},							
							{
								text: model['FINANCEIROS_PARCELA'],
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['PESSOAS_NOME'],
								style: 'tableExample',
							},		
							{
								text: model['FINANCEIROS_ID_PORTADORES'],
								alignment: 'right',
								style: 'tableExample',
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
								text: dataPagamento,
								alignment: 'center',
								style: 'tableExample'
							},             
							{
								text: utils.number.float2moeda(model['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(model['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(model['FINANCEIROS_PAGO']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: model['PRAZOCALCULADO_FINANCEIRO'],
								alignment: 'right',
								style: 'tableExample'
							}                            								
						]);

						totalOriginal  += (model['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (model['FINANCEIROS_ABERTO'] * 100);
						totalPago      += (model['FINANCEIROS_PAGO'] * 100);

					}
		
					rows.push([						
						{
							text: 'Totais',
							colSpan: 9,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},{},{},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalOriginal / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: utils.number.float2moeda(totalAberto / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalPago / 100),
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
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
