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
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [20, 20, 20, 15],
			content: [
				{columns: [{},{},{},{},{},{},{},{},{}]},
				{
					style: 'tableExample',
					table: {   //Num Nome       Emi Vct Ori Jur Dsc Abe
						       //[]  [        ]   5   6   7   8   9   10
						widths: [45, 16, 56, 66, 50, 54, 45, 40, 40, 52],
						headerRows: 3,
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

					let ultimaEmpresa = 0;
					let empOriginal  = 0;
					let empJuros     = 0
                    let empDescontos = 0;
					let empAberto    = 0;

					let totalOriginal  = 0;
					let totalJuros     = 0
                    let totalDescontos = 0;
					let totalAberto    = 0;
                    let FinancObs = '';
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
                                colSpan: 2,
								alignment: 'left',
								border: [false, false, false, false]
							},{},
							{
								colSpan: 6,
								text: 'Fluxo de Caixa - ' + (params.tipo == 'R' ? 'Recebimentos' : 'Pagamentos'),
								alignment: 'center',
								style: {bold: true,	fontSize: 12},
								border: [false, false, false, false]
							},{},{},{},{},{},
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
								colSpan: 2,
								alignment: 'left',
								style: {bold: true,	fontSize: 8},
								border: [false, false, false, false]																
							},{},
							{
								colSpan: 6,
								text: 'Vencimento: ' + params.inicio + ' a ' + params.final,
								alignment: 'center',
								style: {bold: true,	fontSize: 10},
								border: [false, false, false, false]
							},{},{},{},{},{},
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
								text: 'Número',
								style: 'tableHeader',
								alignment: 'center'
							},
							{
								text: 'Nome',
								style: 'tableHeader',
								alignment: 'center',
								colSpan: 3
							},{},{},
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
								text: 'Desc',
								style: 'tableHeader',
								alignment: 'center'
							},                     
							{
								text: 'Aberto',
								style: 'tableHeader',
								alignment: 'center'
							}
						]					
                    );

					for(let i in res.results){

						if(params.tipo == 'P' && res.results[i]['FINANCEIROS_ID_ORDENS'] == 1) { // Filtra os inativos
							continue;
						}

						rows.push([
							{
								text: res.results[i]['FINANCEIROS_NUMERO'].toString() + '/' + res.results[i]['FINANCEIROS_PARCELA'].toString(),
								alignment: 'right',
								style: 'tableExample',
							},
							{
								text: res.results[i]['FINANCEIROS_ID_PESSOAS'] == 1 ?
								      res.results[i]['FINANCEIROS_OBSERVACOES'].slice(0, 28) :
								      res.results[i]['PESSOAS_NOME'].slice(0, 28),
								alignment: 'left',
								style: 'tableExample',
								colSpan: 3
							},{},{},
							{
								text: moment(res.results[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},
							{
								text: moment(res.results[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
								alignment: 'center',
								style: 'tableExample'
							},                            
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ORIGINAL']),
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: res.results[i]['FINANCEIROS_JUROS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_JUROS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},								
							{
								text: res.results[i]['FINANCEIROS_DESCONTOS'] > 0 ? utils.number.float2moeda(res.results[i]['FINANCEIROS_DESCONTOS']) : '',
								alignment: 'right',
								style: 'tableExample'
							},
							{
								text: utils.number.float2moeda(res.results[i]['FINANCEIROS_ABERTO']),
								alignment: 'right',
								style: 'tableExample'
							}
						]);

                        FinancObs = res.results[i]['FINANCEIROS_OBSERVACOES'];

                       if (FinancObs && FinancObs.trim() !== '') {
						rows.push([
							{
								text: '',
								alignment: 'right',
								style: 'tableExample',
                                border: [false, false, false, false]								
							},
							{
								colSpan: 9,
								text: res.results[i]['FINANCEIROS_OBSERVACOES'].slice(0, 80),
								alignment: 'rileft',
								style: 'tableExample',
                                border: [false, false, false, false]								
							},{},{},{},{},{},{},{},{}
						]);
                    };




						empOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						empAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						empJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						empDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

						totalOriginal  += (res.results[i]['FINANCEIROS_ORIGINAL'] * 100);
						totalAberto    += (res.results[i]['FINANCEIROS_ABERTO'] * 100);
						totalJuros     += (res.results[i]['FINANCEIROS_JUROS'] * 100);
						totalDescontos += (res.results[i]['FINANCEIROS_DESCONTOS'] * 100);

					}

					rows.push([
						{
							text: ultimaEmpresa ? `Subtotal (${ultimaEmpresa})` : '',
							colSpan: 6,							
							alignment: 'right',
							fontSize: 10,
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(empOriginal / 100),
							alignment: 'right',							
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empJuros > 0 ? utils.number.float2moeda(empJuros / 100) : '',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: empDescontos > 0 ? utils.number.float2moeda(empDescontos / 100) : '',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},{
							text: utils.number.float2moeda(empAberto / 100),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						}
					]);			
		
					rows.push([
						{
							text: 'Total Geral',
							colSpan: 6,							
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},{},{},{},{},{},
						{
							text: utils.number.float2moeda(totalOriginal / 100),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalJuros > 0 ? utils.number.float2moeda(totalJuros / 100) : '',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'
						},
						{
							text: totalDescontos > 0 ? utils.number.float2moeda(totalDescontos / 100) : '',
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
						},
						{
							text: utils.number.float2moeda(totalAberto / 100),
							alignment: 'right',
							bold: true,
							border: [false, false, false, false],
							style: 'tableExample'							
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
