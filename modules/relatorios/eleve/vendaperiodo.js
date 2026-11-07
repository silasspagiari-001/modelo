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
            pageMargins: [10, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 14 Colunas
                {
                    style: 'tableExample',
                    table: { //   DOC SER EMI EMP CPG VEN CLI  NOM MUN  UF VIS PRZ CAR OUT
                        widths:   [25, 13, 32, 17, 12, 12, 20, 90, 55, 10, 42, 42, 42, 42],
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
			api.vendaperiodo().read(params)
				.then(async res => {
					let rows            = docDefinition.content[1].table.body;

					let movVista  = 0;
                    let movPrazo  = 0;
                    let movCartao = 0;
                    let movOutras = 0;
                    let quebra    = params.quebra;  // 0-Sem 1-Com
                    let itens     = params.itens;   // 0-Sem 1-Com

                    let tipoDocumento = params.tipo == 3 ? "NOTAS FISCAIS" :
                                        params.tipo == 2 ? "PEDIDOS" :
                                        params.tipo == 4 ? "REQUISIÇÕES" :
                                        params.tipo == 11 ? "CUPONS FISCAIS" :
                                        params.tipo == 1 ? "ORÇAMENTOS" : 'DOCUMENTOS';

                    let totalAvista     = 0;
                    let totalAprazo     = 0;
                    let totalCartao     = 0;
                    let totalOutras     = 0;
                    let totalDevolucoes = 0; 

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
                                text: `RELACAO DE ${tipoDocumento}`,
                                colSpan: 10,
                                fontSize: 12,
                                alignment: 'center',
                                color: 'blue',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},
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
                                text: 'Referencia: ' + params.emiinicio + ' a ' + params.emifinal,
                                colSpan: 10,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},
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
                                text: 'Tri',
                                style: 'tableHeader',
                                alignment: 'center'
                            },			
                            {
                                text: 'Cpg',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Ven',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Cli',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Nome do Cliente',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'Município',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'UF',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'A Vista',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'A Prazo',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Cartao',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Outras',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    )					

                    for(let i in res.results){

                        model = res.results[i]; 

                        movVista  = 0;
                        movPrazo  = 0;
                        movCartao = 0;
                        movOutras = 0;

                        if(model['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0005' && model['PESSOAS_TIPO'] == 'E') {
                            continue;  // Filtra as notas de despesas
                        }

                        if(itens == 1) {  // Se imprime os itens do movimento

                            if(docAnt != model['MOVIMENTOS_NUMERO']) {
                                if(docAnt) {
                                    rows.push([
                                        {
                                            text: '- '.repeat(160),
                                            colSpan: 13,
                                            bold: true,
                                            style: 'tableExample',
                                            border: [false, false, false, false]											
                                        },{},{},{},{},{},{},{},{},{},{},{},{},{}
                                    ]);
                                }
                            }    
                        }

                        if(docAnt != model['MOVIMENTOS_NUMERO']) {
                            if(model['OPERACOES_ACAO'] == 'DC') { // Devolução de compra
                                totalDevolucoes += model['MOVIMENTOS_TOTAL'];
                            }
                            if(model['OPERACOES_ACAO'] != 'VN') { // Se não for venda normal, vai em outras
                                movOutras = model['MOVIMENTOS_TOTAL'];
                            } else {
                                if(model['MOVIMENTOS_ID_PRAZOS'] < 3) {
                                    movVista = model['MOVIMENTOS_TOTAL'];
                                } else {
                                    if(model['MOVIMENTOS_ID_PRAZOS'] == 100) { // Cartão
                                        movCartao = model['MOVIMENTOS_TOTAL'];
                                    } else {
                                        if(model['MOVIMENTOS_ID_PRAZOS'] > 9) {
                                            movPrazo = model['MOVIMENTOS_TOTAL'];
                                        }
                                    }
                                }    
                            }

                            if(model['MOVIMENTOS_STATUS'] == 'C') { // Canceladas
                                rows.push([
                                    {
                                        text: model['MOVIMENTOS_NUMERO'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_SERIE'],
                                        alignment: 'center',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_OPERACOES'].toString().slice(0, 4),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },                                    
                                    {
                                        text: model['MOVIMENTOS_ID_PRAZOS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_USUARIOS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_PESSOAS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['CIDADES_NOME'].slice(0, 18),
                                        style: 'tableExample',
                                        border: [false, false, false, false]
                                    },
                                    {
                                        text: model['CIDADES_ESTADO'],
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: '*** CANCELADA ***',
                                        bold: true,
                                        alignment: 'center',
                                        colSpan: 4,
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },{},{},{}
                                ]);	
                            } else {

                                rows.push([
                                    {
                                        text: model['MOVIMENTOS_NUMERO'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_SERIE'],
                                        alignment: 'center',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_OPERACOES'].toString().slice(0, 4),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_PRAZOS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_USUARIOS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_ID_PESSOAS'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['CIDADES_NOME'].slice(0, 20),
                                        style: 'tableExample',
                                        border: [false, false, false, false]
                                    },
                                    {
                                        text: model['CIDADES_ESTADO'],
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: utils.number.float2moeda(movVista),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: utils.number.float2moeda(movPrazo),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: utils.number.float2moeda(movCartao),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: utils.number.float2moeda(movOutras),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    }
                                ]);	

                                if(itens == 1) {  // Se imprime os itens do movimento)
                                    rows.push([
                                        {
                                            colSpan: 14,
                                            border: [false, false, false, false, false],
                                            table: {
                                                widths: [30, 150, 60, 80, 80],
                                                body: [
                                                    [
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
                                                        }
                                                    ]
                                                ]
                                            },
                                            layout: 'noBorders'        
                                        },{},{},{},{},{},{},{},{},{},{},{},{},{}
                                    ]);
                                }
                                totalAvista += movVista;
                                totalAprazo += movPrazo;
                                totalCartao += movCartao;
                                totalOutras += movOutras;

                                // imprime os itens

                            }
        
                            docAnt = model['MOVIMENTOS_NUMERO'];
                        }
                        
                        if(itens == 1) {  // Se imprime os itens do movimento)                                
                            rows.push([
                                {
                                    colSpan: 14,
                                    border: [false, false, false, false, false],
                                    table: {
                                        widths: [30, 150, 60, 80, 80],
                                        body: [
                                            [
                                                {
                                                    text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}                                                            
                                                },
                                                {
                                                    text: model['PRODUTOS_NOME'],
                                                    alignment: 'left',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: model['MOVIMENTOSITENS_QUANTIDADE'],
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_PRECO']),
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }

                    }

                    rows.push([
                        {
                            text: 'Totais',
                            colSpan: 10,
                            alignment: 'right',
                            bold: true,
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalAvista),
                            bold: true,
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },
                        {
                            text: utils.number.float2moeda(totalAprazo),
                            bold: true,
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },
                        {
                            text: utils.number.float2moeda(totalCartao),
                            bold: true,
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },
                        {
                            text: utils.number.float2moeda(totalOutras),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        }
                    ]);						

                    rows.push([
                        {
                            text: `\n${res.results[0]['DOCUMENTOS_NOME'].toUpperCase().split(' ')[0]}S DE: ___________ A ___________ Dia: _____/_____/_____ `,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nVENDA A VISTA:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);						

                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nVENDA A PRAZO:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);			
                    
                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nDEVOLUCOES A VISTA:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);			

                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nDEVOLUCOES A PRAZO:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);			
                    
                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nTOTAL DO DIA:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);			

                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\n(-) DEVOLUCOES:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);			

                    rows.push([
                        {
                            text: ``,
                            colSpan: 8,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},
                        {
                            text: '\nTOTAL DE VENDAS:',
                            colSpan: 6,
                            fontSize: 10,
                            style: 'tableExample'
                        },{},{},{},{},{}
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