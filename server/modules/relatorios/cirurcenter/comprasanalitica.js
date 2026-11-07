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
            pageMargins: [15, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 13 Colunas
                {
                    style: 'tableExample',
                    table: { //   NUM SER EMI REC FOR   UF ICM IPI  ST FRE SEG DSP VLN
                        widths:   [25, 12, 35, 35, 100, 10, 32, 32, 32, 32, 32, 32, 40],
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
			api.comprasanalitica().read(params)
				.then(async res => {
					let rows = docDefinition.content[1].table.body;

                    let totalProdutos  = 0;
                    let totalDescontos = 0;
                    let totalValornfe  = 0;
                    let totalBaseIcms  = 0; 
                    let totalValorIcms = 0;
                    let totalBaseSt    = 0;
                    let totalValorSt   = 0;
                    let totalIpi       = 0;
                    let totalFrete     = 0;
                    let totalSeguro    = 0;
                    let totalDespesas  = 0;

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
                                colSpan: 2,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},
                            { 
                                text: 'Relatório Analítico de Compras',
                                colSpan: 9,
                                fontSize: 12,
                                alignment: 'center',
                                color: 'blue',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                                colSpan: 2,
                                fontSize: 8,
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
                                text: 'Recepção: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                                colSpan: 9,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},
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
                                text: 'Vlr Icms',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Vlr Ipi',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Vlr ST',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Frete',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Despesas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Descontos',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Total Nota',
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
                                        text: '- '.repeat(159),
                                        colSpan: 13,
                                        bold: true,
                                        style: 'tableExample',
                                        border: [false, false, false, false]											
                                    },{},{},{},{},{},{},{},{},{},{},{},{}
                                ]);
                            }
                        }    
                        
                        if(docAnt != model['MOVIMENTOS_NUMERO']) {                            
                            totalProdutos  += cents(model['MOVIMENTOS_PRODUTOS']);
                            totalValorIcms += cents(model['MOVIMENTOS_VALORICMS']);
                            totalIpi       += cents(model['MOVIMENTOS_VALORIPI']);
                            totalValorSt   += cents(model['MOVIMENTOS_VALORST']);
                            totalFrete     += cents(model['MOVIMENTOS_FRETE']);
                            totalSeguro    += cents(model['MOVIMENTOS_SEGURO']);
                            totalDespesas  += cents(model['MOVIMENTOS_DESPESAS']);
                            totalDescontos += cents(model['MOVIMENTOS_DESCONTOS']);
                            totalValornfe  += cents(model['MOVIMENTOS_TOTAL']);

                            rows.push([
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
                                    text: moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: ('000000' + model['MOVIMENTOS_ID_PESSOAS']).slice(-6) + '  ' + model['MOVIMENTOS_NOME'].slice(0, 20),
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
                                    text: utils.number.float2moeda(model['MOVIMENTOS_VALORICMS']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_VALORIPI']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_VALORST']),
                                    alignment: 'right',
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
                                    text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO'] + model['MOVIMENTOS_DESPESAS']),
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']),
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

                            if(params.itens == 1) {  // Com itens
                                rows.push([
                                    {
                                        colSpan: 13,
                                        border: [false, false, false, false, false],
                                        table: {  //CFO COD  DES QTD PRC TOT PIP VIP PIC VIC VST FRE SEG DSP
                                            widths: [20, 20, 120, 25, 25, 35, 20, 25, 20, 25, 25, 25, 25, 28],
                                            body: [
                                                [
                                                    {
                                                        text: 'Cfop',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Cód',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}                                                            
                                                    },
                                                    {
                                                        text: 'Descrição',
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
                                                        text: '% IPI',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Vlr IPI',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: '% ICM',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Vlr ICMS',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Vlr ST',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Frete',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Despesas',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    },
                                                    {
                                                        text: 'Descontos',
                                                        alignment: 'right',
                                                        style: {bold: true,	fontSize: 6}
                                                    }                                                
                                                ]
                                            ]
                                        },
                                        layout: 'noBorders'        
                                    },{},{},{},{},{},{},{},{},{},{},{},{}
                                ]);        
                            }
                            docAnt = model['MOVIMENTOS_NUMERO'];
                        }

                        if(params.itens == 1) {
                            rows.push([
                                {
                                    colSpan: 13,
                                    border: [false, false, false, false, false],
                                    table: {//  CFO COD  DES QTD PRC TOT PIP VIP PIC VIC VST FRE SEG DSP
                                        widths: [20, 20, 120, 25, 25, 35, 20, 25, 20, 25, 25, 25, 25, 28],
                                        body: [
                                            [
                                                {
                                                    text: model['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}                                                            
                                                },
                                                {
                                                    text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
                                                    alignment: 'right',
                                                    style: {fontSize: 6}                                                            
                                                },
                                                {
                                                    text: model['PRODUTOS_NOME'].slice(0, 34),
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
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_IPI']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_VALORIPI']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_ICMS']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_VALORICMS']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_VALORST']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_FRETE']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda((model['MOVIMENTOSITENS_SEGURO'] + model['MOVIMENTOS_DESPESAS'])),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_DESCONTOS']),
                                                    alignment: 'right',
                                                    style: {fontSize: 6}
                                                }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }
                    } 

                    rows.push([
                        {
                            colSpan: 13,
                            border: [false, true, false, false, false],
                            table: {
                                widths: [30, 55, 55, 55, 55, 55, 55, 55, 55],
                                body: [
                                    [
                                        {
                                            text: 'TOTAIS',
                                            alignment: 'right',
                                            bold: true,
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr Produtos\n${utils.number.float2moeda(totalProdutos / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}                                                            
                                        },
                                        {
                                            text: `Vlr ICMS\n${utils.number.float2moeda(totalValorIcms / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr IPI\n${utils.number.float2moeda(totalIpi / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr ST\n${utils.number.float2moeda(totalValorSt / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr Frete\n${utils.number.float2moeda(totalFrete / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr Seg/Dsp\n${utils.number.float2moeda((totalSeguro + totalDespesas) / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr Descontos\n${utils.number.float2moeda(totalDescontos / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                        {
                                            text: `Vlr Notas\n${utils.number.float2moeda(totalValornfe / 100)}`,
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 8}
                                        },
                                    ]
                                ]
                            },
                            layout: 'noBorders'        
                        },{},{},{},{},{},{},{},{},{},{},{},{}
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