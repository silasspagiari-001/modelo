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
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'landscape',
            pageSize: 'A4',
            pageMargins: [20, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{}]}, // 12 Cols
                {
                    style: 'tableExample',
                    table: {   // EMP NUM SER DTE PRO  DES  COR QTD PAR CUS COM PMM
                        widths:  [10,  35, 20, 45, 35, 240, 70, 25, 60, 60, 45, 35],  // 12 Cols.
                        headerRows: 3,
                        body: []
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
                        { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                    ],
                    margin: [25, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 10,
                    margin: [0, 0, 0, 0],
                    border: 0
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            }
        };		

        return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			api.comissoespro().read(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let venQtde = 0;
					let venPrecoMinimo = 0;
                    let venPartida = 0;
                    let venComissao = 0;
                    let venPmm = 0;
                    let valorPmm = 0;
                    let dataMovto = '';

					let totalQtde = 0;
					let totalPrecoMinimo = 0;
                    let totalPartida = 0;
                    let totalComissao = 0;
                    let totalPmm = 0;
                    let ultimoVendedor = 0;

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
                                text: 'Relatório de Comissões - Produtos',
                                colSpan: 8,                                
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                                colSpan: 2,
                                alignment: 'right',
                                border: [false, false, false, false]								
                            },{}
                        ],
                        [
                            {							
                                text: '',
                                colSpan: 4,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},{},{},
                            { 
                                text: 'Período: ' + params.inicio + ' a ' + params.final,
                                colSpan: 5,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('HH:mm:ss'),
                                colSpan: 3,
                                alignment: 'right',
                                border: [false, false, false, false]
                            },{},{}
                        ],												
                        [
                            {
                                text: 'Lj',  // Col 01
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Pedido',  // Col 02
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Tipo',  // Col 03
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Emissão',  // Col 04
                                style: 'tableHeader',
                                alignment: 'center'									
                            },								
                            {
                                text: 'Código',  // Col 05
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Descrição do Produto',  // Col 06
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Cor',  // Col 07
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Qtde',  // Col 08
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Partida',  // Col 09
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Preço Mínimo',  // Col 10
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Comissão',  // Col 11
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% PMM',  // Col 12
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    )

                    for(let i in res.results){

                        if(ultimoVendedor !== res.results[i]['MOVIMENTOS_ID_USUARIOS']) { 
                            if(ultimoVendedor > 0) {
                                rows.push([
                                    {
                                        text: 'Total Vendedor',
                                        alignment: 'right',
                                        bold: true,							
                                        colSpan: 7,
                                        border: [false, false, false, false],
                                        style: 'tableExample'							
                                    },{},{},{},{},{},{},
                                    {
                                        text: venQtde.toFixed(0),
                                        alignment: 'right',
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'
                                    },{
                                        text: utils.number.float2moeda(venPartida),
                                        alignment: 'right',                                        
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'											
                                    },{
                                        text: utils.number.float2moeda(venPrecoMinimo),
                                        alignment: 'right',                                        
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'											
                                    },{											
                                        text: utils.number.float2moeda(venComissao),
                                        alignment: 'right',
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'							
                                    },{
                                        text: (!utils.number.float2moeda(venPmm) ? '0,00' : utils.number.float2moeda(venPmm)),
                                        alignment: 'right',
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'                                        
                                    }
                                ]);												
                            }
                            venQtde= 0;
                            venPrecoMinimo = 0;
                            venPartida = 0;
                            venComissao = 0;
                            rows.push([
                                {
                                    text: 'Vendedor: ' +
                                            res.results[i]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + 
                                            res.results[i]['USUARIOS_NOME'],
                                    alignment: 'center',
                                    bold: true,							
                                    colSpan: 12,
                                    border: [false, false, false, false],
                                    style: 'tableExample'							
                                },{},{},{},{},{},{},{},{},{},{},{}
                            ]);

                            rows.push([
                                {
                                    text: 'Lj',  // Col 01
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Pedido',  // Col 02
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Tipo',  // Col 03
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Emissão',  // Col 04
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },								
                                {
                                    text: 'Código',  // Col 05
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Descrição do Produto',  // Col 06
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Cor',  // Col 07
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Qtde',  // Col 08
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Partida',  // Col 09
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Preço Mínimo',  // Col 10
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Comissão',  // Col 11
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: '% PMM',  // Col 12
                                    style: 'tableHeader',
                                    alignment: 'center'
                                }
                            ]);                                    
                            ultimoVendedor = res.results[i]['MOVIMENTOS_ID_USUARIOS'];                            
                        }
                                  
                        //valorPmm = (((res.results[i]['MOVIMENTOSITENS_PARTIDA'] - res.results[i]['MOVIMENTOSITENS_PRECOMINIMO']) / res.results[i]['MOVIMENTOSITENS_PARTIDA']) * 100);
                        valorPmm = (((res.results[i]['MOVIMENTOSITENS_PARTIDA'] - res.results[i]['MOVIMENTOSITENS_PRECOMINIMO']) / res.results[i]['MOVIMENTOSITENS_PRECOMINIMO']) * 100);

                        dataMovto = moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
                        dataMovto = dataMovto.substring(0, 6) + dataMovto.substring(8, 10);

                        rows.push([
                            {
                                text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),
                                alignment: 'right',
                                style: 'tableExample',
                            },							
                            {
                                text: res.results[i]['MOVIMENTOS_NUMERO'],
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOS_SERIE'],
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
                                text: dataMovto,
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'left',
                                style: 'tableExample'
                            },
                            {
                                text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample',
                            },								
                            {
                                text: res.results[i]['PRODUTOS_NOME'].substring(0, 40),
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['PRODUTOS_MARCA'],
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_PARTIDA']),  
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample'
                            },								
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_PRECOMINIMO']),
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_COMISSAO']),
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(valorPmm),
                                color: (res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012' ? 'red' : 'black'),                                
                                alignment: 'right',
                                style: 'tableExample'
                            }
                        ]);

                        if(res.results[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0012') { // Devoluções
                            venQtde -= res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                            venPrecoMinimo -= res.results[i]['MOVIMENTOSITENS_PRECOMINIMO'];
                            venPartida -= res.results[i]['MOVIMENTOSITENS_PARTIDA']
                            venComissao -= res.results[i]['MOVIMENTOSITENS_COMISSAO'];
//                          venPmm = (((venPartida - venPrecoMinimo) / venPartida) * 100);
                            venPmm = (((venPartida - venPrecoMinimo) / venPrecoMinimo) * 100);
    
                            totalQtde -= res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                            totalPrecoMinimo -= res.results[i]['MOVIMENTOSITENS_PRECOMINIMO'];
                            totalPartida -= res.results[i]['MOVIMENTOSITENS_PARTIDA']
                            totalComissao -= res.results[i]['MOVIMENTOSITENS_COMISSAO'];
//                          totalPmm = (((totalPartida - totalPrecoMinimo) / totalPartida) * 100);    
                            totalPmm = (((totalPartida - totalPrecoMinimo) / totalPrecoMinimo) * 100);                                
                        } else {
                            venQtde += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                            venPrecoMinimo += res.results[i]['MOVIMENTOSITENS_PRECOMINIMO'];
                            venPartida += res.results[i]['MOVIMENTOSITENS_PARTIDA']
                            venComissao += res.results[i]['MOVIMENTOSITENS_COMISSAO'];
//                          venPmm = (((venPartida - venPrecoMinimo) / venPartida) * 100);
                            venPmm = (((venPartida - venPrecoMinimo) / venPrecoMinimo) * 100);
    
                            totalQtde += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                            totalPrecoMinimo += res.results[i]['MOVIMENTOSITENS_PRECOMINIMO'];
                            totalPartida += res.results[i]['MOVIMENTOSITENS_PARTIDA']
                            totalComissao += res.results[i]['MOVIMENTOSITENS_COMISSAO'];
//                          totalPmm = (((totalPartida - totalPrecoMinimo) / totalPartida) * 100);    
                            totalPmm = (((totalPartida - totalPrecoMinimo) / totalPrecoMinimo) * 100);
                        }
                    }

                    rows.push([
                        {
                            text: 'Total Vendedor',
                            alignment: 'right',
                            bold: true,							
                            colSpan: 7,
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{},{},{},{},{},{},
                        {
                            text: venQtde.toFixed(0),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(venPartida),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                            
                        },{								
                            text: utils.number.float2moeda(venPrecoMinimo),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{
                            text: utils.number.float2moeda(venComissao),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(venPmm),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'                        
                        }
                    ]);

                    rows.push([
                        {
                            text: 'Total Geral',
                            alignment: 'right',
                            bold: true,							
                            colSpan: 7,
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{},{},{},{},{},{},
                        {
                            text: totalQtde.toFixed(0),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(totalPartida),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{								
                            text: utils.number.float2moeda(totalPrecoMinimo),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{
                            text: utils.number.float2moeda(totalComissao),
                            alignment: 'right',
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'                            
                        },{
                            text: utils.number.float2moeda(totalPmm),
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