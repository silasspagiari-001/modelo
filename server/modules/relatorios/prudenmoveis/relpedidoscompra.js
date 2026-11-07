'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

module.exports = { 
    read: params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [15, 20, 15, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{}]},  // 11 Colunas
                {
                    style: 'tableExample',
                    table: { //   EMP NUM SER EMI REC FOR   UF FRE SEG DSP VLN
                        widths:   [15, 25, 10, 34, 34, 200, 10, 30, 30, 32, 55],
                        headerRows: 3,
                        body: []
                    }
                }
            ],
            footer: function(page, pages) {
                return { 
                    stack: [ 
                        { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                    ],
                    margin: [25, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 6,
                    margin: [0, 0, 0, 0],
                    border: 0
                },
                tableHeader: {
                    bold: true,
                    fontSize: 6,
                    color: 'black'
                }
            }
        };	
        
		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.pedidoscompra().read(params)
				.then(async res => {

                    console.log('params: ', params);
					let rows = docDefinition.content[1].table.body;

                    let totalValornfe  = 0;
                    let totalFrete     = 0;
                    let totalSeguro    = 0;
                    let totalDespesas  = 0;
                    let dataEntrada    = '';
                    let tipoRelatorio  = params.status == 1 ? ' - Não recebidos' :
                                         params.status == 2 ? ' - Recebidos'  :
                                         params.status == 9 ? ' - Assistência Técnica' : '';
					let docAnt = '';
					let model;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

                    rows.push(		
                        [
                            {							
                                image: pathLogo,
                                width: 100,
                                height: 22,	
                                colSpan: 4,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},{},{},
                            { 
                                text: `Relatório de Pedidos de Compra${tipoRelatorio}`,
                                colSpan: 6,
                                fontSize: 12,
                                alignment: 'center',
                                color: 'blue',
                                border: [false, false, false, false]
                            },{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                                fontSize: 8,
                                alignment: 'right',
                                border: [false, false, false, false]								
                            }
                        ],
                        [
                            {							
                                text: '',
                                colSpan: 4,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},{},{},
                            { 
                                text: 'Emissão: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                                colSpan: 6,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('HH:mm:ss'),
                                alignment: 'right',
                                border: [false, false, false, false]
                            }
                        ],	
                    );
                    
                    rows.push( 
                        [
                            {
                                text: 'Emp',
                                style: 'tableHeader',
                                alignment: 'center',
                            },
                            {
                                text: 'Numero',
                                style: 'tableHeader',
                                alignment: 'center',
                            },
                            {
                                text: 'Ser',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Emissão',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Recepção',
                                style: 'tableHeader',
                                alignment: 'center'
                            },			
                            {
                                text: 'Fornecedor',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Uf',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Frete',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Seguro',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Despesas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Valor Compra',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    );					

                    for(let i in res.results) {

                        model = res.results[i]; 
                        
                        if(docAnt != model['MOVIMENTOS_NUMERO']) {
                            if(docAnt && params.itens == 1) {
                                rows.push([
                                    {
                                        text: '- '.repeat(163),
                                        colSpan: 11,
                                        bold: true,
                                        style: 'tableExample',
                                        border: [false, false, false, false]											
                                    },{},{},{},{},{},{},{},{},{},{}
                                ]);
                            }
                        }    
                        
                        if(docAnt != model['MOVIMENTOS_NUMERO']) {                            
                            totalFrete     += cents(model['MOVIMENTOS_FRETE']);
                            totalSeguro    += cents(model['MOVIMENTOS_SEGURO']);
                            totalDespesas  += cents(model['MOVIMENTOS_DESPESAS']);
                            totalValornfe  += cents(model['MOVIMENTOS_TOTAL']);
                            dataEntrada    = moment(model['MOVIMENTOS_ENTRADASAIDA']);

                            rows.push([
                                {
                                    text: ((model['EMPRESAS_FANTASIA']||[]).split('-')[1] || model['EMPRESAS_FANTASIA'].slice(0, 3)),
                                    alignment: 'center',
                                    style: 'tableExample',
                                    bold: true,
                                    border: [false, false, false, false]
                                },
                                {
                                    text: model['MOVIMENTOS_NUMERO'],
                                    alignment: 'right',
                                    style: 'tableExample',
                                    bold: true,
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: model['MOVIMENTOS_SERIE'],
                                    alignment: 'center',
                                    style: 'tableExample',
                                    bold: true,
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                    style: 'tableExample',
                                    bold: true,
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: (moment(dataEntrada).isSameOrBefore('1900-01-01') ? '' : moment(dataEntrada).format('DD/MM/YYYY')),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: ('000000' + model['MOVIMENTOS_ID_PESSOAS']).slice(-6) + '  ' + model['MOVIMENTOS_NOME'].slice(0, 50),
                                    style: 'tableExample',
                                    bold: true,
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: model['CIDADES_ESTADO'],
                                    alignment: 'center',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                }
                            ]);	
                            if(params.itens == 1) {
                                rows.push([
                                    {
                                        colSpan: 11,
                                        border: [false, false, false, false, false],
                                        table: {  //COD  DES QTD PRC TOT FRE SEG DSP
                                            widths: [20, 250, 25, 25, 35, 25, 25, 35],
                                            body: [
                                                [
                                                    {
                                                        text: 'Cód',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}                                                            
                                                    },
                                                    {
                                                        text: `Descrição ${model['MOVIMENTOS_SITUACAO'] == 'A' ? '(Produto Assistência)' : 'do Produto'}`,
                                                        alignment: 'left',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Qtde',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Preço',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Total',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Frete',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Seguro',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Despesas',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    }
                                                ]
                                            ]
                                        },
                                        layout: 'noBorders'        
                                    },{},{},{},{},{},{},{},{},{},{}
                                ]);    
                            }
                            docAnt = model['MOVIMENTOS_NUMERO'];
                        }

                        if(params.itens == 1) {
                            rows.push([
                                {
                                    colSpan: 11,
                                    border: [false, false, false, false, false],
                                    table: {//  COD  DES QTD PRC TOT FRE SEG DSP
                                        widths: [20, 250, 25, 25, 35, 25, 25, 25],
                                        body: [
                                            [
                                                {
                                                    text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
                                                    alignment: 'right',
                                                    style: {fontSize: 6}                                                            
                                                },
                                                {
                                                    text: `${model['PRODUTOS_NOME']} ${model['PRODUTOS_MARCA']}`,
                                                    alignment: 'left',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: model['MOVIMENTOSITENS_QUANTIDADE'],
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_PRECO']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_FRETE']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_SEGURO']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_DESPESAS']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{}
                            ]);    
                        }

                    } 

                    rows.push([ // NUM SER EMI REC FOR UF FRE SEG DSP TOT
                        {
                            text: 'TOTAIS',
                            alignment: 'right',
                            bold: true,
                            colSpan: 7,
                            style: {bold: true,	fontSize: 8}
                        },{},{},{},{},{},{},
                        {
                            text: `${utils.number.float2moeda(totalFrete / 100)}`,
                            alignment: 'right',
                            style: {bold: true,	fontSize: 8}
                        },
                        {
                            text: `${utils.number.float2moeda(totalSeguro / 100)}`,
                            alignment: 'right',
                            style: {bold: true,	fontSize: 8}
                        },
                        {
                            text: `${utils.number.float2moeda(totalDespesas / 100)}`,
                            alignment: 'right',
                            style: {bold: true,	fontSize: 8}
                        },
                        {
                            text: `${utils.number.float2moeda(totalValornfe / 100)}`,
                            alignment: 'right',
                            style: {bold: true,	fontSize: 8}
                        }
                    ]);    

					pdfStream(docDefinition, resolve, reject);
					db.detach();					
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};