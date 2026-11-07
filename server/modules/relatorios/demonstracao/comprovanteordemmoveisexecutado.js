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
			pageMargins: [30, 30, 30, 30],
			content: [  // FL NR SE PE VP VS  
				{columns: [{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 10,
                    table: {
                        widths: [20, 35, 20, 300, 50, 50],
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
            }
        };

        return new Promise(async (resolve, reject) => {
			api.ordensmoveis().readById(params.id, params)
				.then(async res => {
                    const rows        = docDefinition.content[1].table.body;
                    const ordemmoveis = res.results[0];
                    const produtos    = ordemmoveis['ORDENS_PRODUTOSITENS'] || [];
                    const servicos    = ordemmoveis['ORDENS_SERVICOSITENS'] || [];
                    const obs         = `PAGAMENTO SERVIÇOS REALIZADOS`;
                    
                    const cpfCnpj  = ordemmoveis['MONTADORES_CPFCNPJ'];
                    const descricaoDocumento = (cpfCnpj.length == 11 ? 'CPF:' : 'CNPJ:');

					let linhas;                    
                    let linhasItens = 0;
               
                    rows.push([
                        {
                            text: 'ORDEM DE SERVIÇO EXECUTADO\n',
                            fontSize: 22, 
                            border: [true, true, true, false],
                            bold: true,
                            colSpan: 6,
                            alignment: 'center'
                        },{},{},{},{},{}
                    ]);
                
                    rows.push([
                        {
                            text: 'A',
                            color: 'white',
                            fontSize: 2,
                            colSpan: 6,
                            border: [true, false, true, false]
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'PRESTADOR: ',
                            colSpan: 3,
                            border: [true, false, false, false]
                        },{},{},
                        {
                            text: ordemmoveis['MONTADORES_NOME'],
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, false]
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'DATA: ',
                            colSpan: 3,
                            border: [true, false, false, false]
                        },{},{},
                        {
                            text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, false]
                        },{},{},
                    ]);

                    rows.push([
                        {
                            text: 'N° ORDEM',
                            colSpan: 3,
                            border: [true, false, false, false]                            
                        },{},{},
                        {
                            text: ordemmoveis['ORDENS_NUMERO'],
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, true]
                        },{},{}
                    ]);
                              
                    if(produtos.length > 0) {
                        rows.push([
                            {
                                text: 'a',
                                color: 'white',
                                fontSize: 1,
                                colSpan: 6,
                                border: [false, true, false, false]                            
                            },{},{},{},{},{}
                        ]);    
                        rows.push([
                            {
                                text: 'Produto',
                                colSpan: 2,
                                border: [true, true, true, true],
                                fontSize: 8,
                                alignment: 'center'
                            },{},
                            {
                                text: 'Descrição do Produto',
                                colSpan: 2,
                                fontSize: 8,                            
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: 'Qtde',
                                fontSize: 8,                            
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Total',
                                border: [true, true, true, true],
                                alignment: 'center'
                            }
                        ]);    
                        for(let i in produtos){
                            rows.push([
                                {
                                    text: produtos[i]['ORDENSPRODUTOS_ID_PRODUTOS'],
                                    colSpan: 2,
                                    border: [true, true, true, true],
                                    alignment: 'right'
                                },{},
                                {
                                    text: produtos[i]['PRODUTOS_NOME'],
                                    border: [true, true, true, true],
                                    colSpan: 2
                                },{},
                                {
                                    text: produtos[i]['ORDENSPRODUTOS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    alignment: 'right'
                                },{
                                    text: utils.number.float2moeda(produtos[i]['ORDENSPRODUTOS_TOTAL']),
                                    alignment: 'right'
                                }
                            ]);
                            linhasItens++
                        };   
                        rows.push([
                            {
                                text: 'Total Produtos: ',
                                colSpan: 4,
                                alignment: 'right',
                                border: [true, false, false, false]
                            },{},{},{},
                            {
                                text: produtos.length,
                                alignment: 'right',
                                bold: true,
                                border: [true, false, true, false]
                            },
                            {
                                text: utils.number.float2moeda(ordemmoveis['ORDENS_PRODUTOS']),
                                alignment: 'right',
                                bold: true,
                                border: [false, false, true, false]
                            }
                        ]);    
                    }
// Serviços                    
                    if(servicos.length > 0) {
                        rows.push([
                            {
                                text: 'a',
                                color: 'white',
                                fontSize: 1,
                                colSpan: 6,
                                border: [false, true, false, false]                            
                            },{},{},{},{},{}
                        ]);    
                        rows.push([
                            {
                                text: 'Serviço',
                                colSpan: 2,                                
                                border: [true, true, true, true],
                                fontSize: 8,
                                alignment: 'center'
                            },{},
                            {
                                text: 'Descrição do Serviço',
                                colSpan: 2,
                                fontSize: 8,                            
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: 'Qtde',
                                fontSize: 8,                            
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Total',
                                border: [true, true, true, true],
                                alignment: 'center'
                            }
                        ]);    
                        for(let i in servicos){
                            rows.push([
                                {
                                    text: servicos[i]['ORDENSSERVICOS_ID_SERVICOS'],
                                    colSpan: 2,                                    
                                    border: [true, true, true, true],
                                    alignment: 'right'
                                },{},
                                {
                                    text: servicos[i]['SERVICOS_NOME'],
                                    border: [true, true, true, true],
                                    colSpan: 2
                                },{},
                                {
                                    text: servicos[i]['ORDENSSERVICOS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    alignment: 'right'
                                },
                                {
                                    text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_TOTAL']),
                                    alignment: 'right'
                                }
                            ]);
                            linhasItens++
                        };   
                        rows.push([
                            {
                                text: 'Total Serviços: ',
                                colSpan: 4,
                                alignment: 'right',
                                border: [true, false, false, false]
                            },{},{},{},
                            {
                                text: servicos.length,
                                alignment: 'right',
                                bold: true
                            },
                            {
                                text: utils.number.float2moeda(ordemmoveis['ORDENS_SERVICOS']),
                                alignment: 'right',
                                bold: true
                            }
                        ]);    
                    }          

                    rows.push([
                        {
                            text: 'a',
                            color: 'white',
                            fontSize: 1,
                            colSpan: 6,
                            border: [false, true, false, false]                            
                        },{},{},{},{},{}
                    ]);    

                    rows.push([
                        {
                            text: 'Total Ordem: ',
                            colSpan: 5,
                            alignment: 'right',
                            border: [true, true, false, true]
                        },{},{},{},{},
                        {
                            text: utils.number.float2moeda(ordemmoveis['ORDENS_TOTAL']),
                            alignment: 'right',
                            bold: true
                        }
                    ]);    

                    rows.push([
                        {
                            text: '\n\n____________________________________________',
                            alignment: 'center',
                            border: [true, false, true, false],
                            colSpan: 6
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Assinatura do Prestador',
                            border: [true, false, true, true],
                            alignment: 'center',
                            colSpan: 6
                        },{},{},{},{},{}
                    ]);

                    if((produtos.length + servicos.length) > 9) {
                        rows.push([
                            {
                                text: 'RECIBO',
                                pageBreak: 'before',
                                fontSize: 20, 
                                border: [true, true, false, true],
                                bold: true,
                                colSpan: 3,
                                alignment: 'left'
                            },{},{},
                            {
                                text: 'Valor:',
                                pageBreak: 'before',                                
                                alignment: 'right',
                                fontSize: 17, 
                                border: [false, true, false, true],
                                bold: true
                            },
                            {
                                text: `R$ ${utils.number.float2moeda(ordemmoveis['ORDENS_TOTAL'])}\n`,
                                pageBreak: 'before',
                                alignment: 'right',
                                fontSize: 17, 
                                colSpan: 2,
                                border: [false, true, true, true],
                                bold: true
                            },{}
                        ]);    
                    } else {
                        for (linhas = linhasItens; linhas < 11; linhas++) {
                            rows.push([
                                {
                                    colSpan: 6,
                                    text: 'A',                                    
                                    color: 'white',
                                    border: [false, false, false, false]
                                },{},{},{},{},{}
                            ]);    
                        }    
                        rows.push([
                            {
                                text: 'RECIBO',
                                fontSize: 20, 
                                border: [true, true, false, true],
                                bold: true,
                                colSpan: 3,
                                alignment: 'left'
                            },{},{},
                            {
                                text: 'Valor:',
                                alignment: 'right',
                                fontSize: 17, 
                                border: [false, true, false, true],
                                bold: true
                            },
                            {
                                text: `R$ ${utils.number.float2moeda(ordemmoveis['ORDENS_TOTAL'])}\n`,
                                alignment: 'right',
                                fontSize: 17, 
                                colSpan: 2,
                                border: [false, true, true, true],
                                bold: true
                            },{}
                        ]);    
                    }

                    rows.push([
                        {
                            text: '',
                            colSpan: 6,
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Recebi de:',
                            colSpan: 3,
                            fontSize: 12, 
                            border: [true, true, false, false],
                            alignment: 'left'
                        },{},{},
                        {
                            table: {
                                widths: [408],  //413
                                body: [
                                    [
                                        {
                                            text: `${ordemmoveis['EMPRESAS_NOME']} (${ordemmoveis['EMPRESAS_FANTASIA']})`,
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 3,
                            fontSize: 12, 
                            border: [false, true, true, false],
                            alignment: 'left'
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Endereço:',
                            colSpan: 3,
                            fontSize: 12, 
                            border: [true, false, false, false],
                            alignment: 'left'
                        },{},{},
                        {
                            table: {
                                widths: [408],
                                body: [
                                    [
                                        {
                                            text: `${ordemmoveis['EMPRESAS_ENDERECO']} ${ordemmoveis['EMPRESAS_NUMERO']} - ${ordemmoveis['EMPRESAS_BAIRRO']}`,
                                        }
                                    ]
                                ]
                            },
                            colSpan: 3,
                            fontSize: 10, 
                            border: [false, false, true, false],
                            alignment: 'left'
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'A quantia de:',
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 510 ],  //523
                                body: [
                                    [
                                        {
                                            text: utils.number.ValorPorExtenso(ordemmoveis['ORDENS_TOTAL']),
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Correspondente a:',
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 510 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(0, 82) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 510 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(82, 160) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 510 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(160, 242) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'e para clareza firmo o presente.',
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: `${ordemmoveis['CIDADES_NOME']} - ${ordemmoveis['CIDADES_ESTADO']}, ${moment.tz(params.timezone).format('DD/MM/YYYY')}`,
                            colSpan: 6,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Assinatura:',
                            fontSize: 11, 
                            border: [true, false, false, false],
                            colSpan: 2,
                            alignment: 'left'
                        },{},
                        {
                            table: {
                                widths: [425],  //458
                                body: [
                                    [
                                        {
                                            text: 'A\n',
                                            color: 'white',
                                            border: [false, false, false, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 4,
                            fontSize: 12, 
                            border: [false, false, true, false],
                            alignment: 'left'
                        },{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Nome:',
                            fontSize: 11, 
                            colSpan: 2,
                            border: [true, false, false, false],
                            alignment: 'left'
                        },{},
                        {
                            table: {
                                widths: [270],  //282
                                body: [
                                    [
                                        {
                                            text: ordemmoveis['MONTADORES_NOME'],
                                            fontSize: 11, 
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            fontSize: 12, 
                            border: [false, false, false, false],
                            alignment: 'left'
                        },
                        {
                            text: descricaoDocumento,
                            fontSize: 11, 
                            border: [false, false, false, false],
                            alignment: 'right'
                        },
                        {
                            table: {
                                widths: [100],  // 128
                                body: [
                                    [
                                        {
                                            text: utils.string.maskCnp(cpfCnpj),
                                            fontSize: (cpfCnpj.length > 11 ? 10 : 12), 
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            fontSize: 12,
                            colSpan: 2,
                            border: [false, false, true, false],
                            alignment: 'right'
                        },{}
                    ]);

                    rows.push([
                        {
                            text: 'Endereço:',
                            colSpan: 2,
                            fontSize: 11, 
                            border: [true, false, false, true],
                            alignment: 'left'
                        },{},
                        {
                            table: {
                                widths: [437],  // 458
                                body: [
                                    [
                                        {
                                            text: `${ordemmoveis['MONTADORES_ENDERECO']} ${ordemmoveis['MONTADORES_NUMERO']} - ${ordemmoveis['MONTADORES_BAIRRO']}`,
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 4,
                            fontSize: 10, 
                            border: [false, false, true, true],
                            alignment: 'left'
                        },{},{},{}
                    ]);                    

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};
