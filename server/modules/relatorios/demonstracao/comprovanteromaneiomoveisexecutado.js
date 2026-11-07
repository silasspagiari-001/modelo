'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFirebird'); 

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
			api.romaneiosmoveis().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
					const db = await samosFB.conectarBanco(params.client);                     
                    const romaneio = res.results[0];
                    const pedidos = romaneio['ROMANEIOS_ITENS'];
                    const primeiroItem = pedidos && pedidos[0] ? pedidos[0] : {};
                    const tipo = (romaneio['DOCUMENTOS_NOME'] || '').slice(9, Infinity).toUpperCase();
                    const local = (tipo == 'ENTREGA' ? (romaneio['ROMANEIOS_LOCAL'] == 'U' ? 'URBANO' : 'SUBURBANO') : '');
                    const isEntrega = (tipo == 'ENTREGA' ? true : false);
                    const obs      = (isEntrega ? `PAGAMENTO ENTREGAS REALIZADAS` : `PAGAMENTO MONTAGENS REALIZADAS`);
                    
                    const cpfCnpj  = romaneio['PESSOAS_CPFCNPJ'];
                    const descricaoDocumento = (cpfCnpj.length == 11 ? 'CPF:' : 'CNPJ:');
                    
                    const fretePercentual = (romaneio['ROMANEIOS_FRETE'] / romaneio['ROMANEIOS_TOTAL']);

                    let nomeCabecalho = '';
					let linhas;                    
                    let linhasItens = 0;

                    if(isEntrega && romaneio['ROMANEIOS_ID_PESSOAS'] == primeiroItem['MOVIMENTOS_ID_PESSOAS']) {
                        nomeCabecalho = 'CLIENTE RETIROU';
                    } else {
                        nomeCabecalho = romaneio['PESSOAS_NOME'];
                    }
                
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
                            text: nomeCabecalho,
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, false]
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'TIPO: ',
                            colSpan: 3,
                            border: [true, false, false, false]
                        },{},{},
                        {
                            text: tipo + (local ? ' ' + local : ''),
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
                            text: romaneio['ROMANEIOS_NUMERO'],
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, true]
                        },{},{}
                    ]);
          
                    rows.push([
                        {
                            text: 'Loja',
                            border: [true, true, true, true],
                            fontSize: 8,
                            alignment: 'center'
                        },
                        {
                            text: 'Número',
                            fontSize: 8,                            
                            border: [true, true, true, true],
                            alignment: 'center'
                        },
                        {
                            text: 'Série',
                            fontSize: 8,                            
                            border: [true, true, true, true],
                            alignment: 'center'
                        },
                        {
                            text: 'Nome',
                            border: [true, true, isEntrega, true],
                            alignment: 'center'                            
                        },
                        {
                            text: (isEntrega ? 'Partida' : ''),
                            border: [isEntrega, true, true, true],
                            alignment: 'center'
                        },
                        {
                            text: 'Serviços',
                            border: [true, true, true, true],
                            alignment: 'center'
                        }
                    ]);
          
                    let fantasia;

					for(let i in pedidos){
                        fantasia = pedidos[i]['EMPRESAS_FANTASIA'];
                        let valorTotal = pedidos[i]['ROMANEIOSITENS_TOTAL'];
                        rows.push([
                            {
                                text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: pedidos[i]['MOVIMENTOS_NUMERO'],
                                border: [true, true, true, true],
                                alignment: 'right'
                            },
                            {
                                text: pedidos[i]['MOVIMENTOS_SERIE'],
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: pedidos[i]['MOVIMENTOS_NOME'],
                                border: [true, true, isEntrega, true],
                                alignment: 'left'
                            },
                            {
                                text: (isEntrega ? utils.number.float2moeda(pedidos[i]['MOVIMENTOS_IMPOSTO']) : ''),
                                border: [isEntrega, true, true, true],
                                alignment: 'right'
                            },{
                                text: utils.number.float2moeda(valorTotal),
                                alignment: 'right'
                            }
                        ]);
                        linhasItens++
                    };
                    
                    rows.push([
                        {
                            text: 'VLR SERVIÇOS: ',
                            colSpan: 3,
                            border: [true, false, false, false]
                        },{},{},
                        {
                            text: utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, false]
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'VLR ROMANEIO: ',
                            colSpan: 3,
                            border: [true, false, false, false]
                        },{},{},
                        {
                            text: utils.number.float2moeda(romaneio['ROMANEIOS_FRETE']),
                            colSpan: 3,
                            bold: true,
                            border: [false, false, true, false]
                        },{},{}
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

                    if(pedidos.length > 9) {
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
                                text: `R$ ${utils.number.float2moeda(romaneio['ROMANEIOS_FRETE'])}\n`,
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
                                text: `R$ ${utils.number.float2moeda(romaneio['ROMANEIOS_FRETE'])}\n`,
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
                                            text: `${romaneio['EMPRESAS_NOME']} (${romaneio['EMPRESAS_FANTASIA']})`,
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
                                            text: `${romaneio['EMPRESAS_ENDERECO']} ${romaneio['EMPRESAS_NUMERO']} - ${romaneio['EMPRESAS_BAIRRO']}`,
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
                                            text: utils.number.ValorPorExtenso(romaneio['ROMANEIOS_FRETE']),
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
                                            text: obs && obs.toString ? obs.slice(0, 102) : '',
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
                                            text: obs && obs.toString ? obs.slice(103, 205) : '',
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
                                            text: obs && obs.toString ? obs.slice(206, 308) : '',
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
                                            text: obs && obs.toString ? obs.slice(309, 411) : '',
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
                            text: `${romaneio['CIDADES_NOME']} - ${romaneio['CIDADES_ESTADO']}, ${moment.tz(params.timezone).format('DD/MM/YYYY')}`,
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
                                            text: romaneio['PESSOAS_NOME'],
                                            fontSize: (romaneio['PESSOAS_NOME'].length > 30 ? 7.5 : 10),
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
                                            text: `${romaneio['PESSOAS_ENDERECO']} ${romaneio['PESSOAS_NUMERO']} - ${romaneio['PESSOAS_BAIRRO']}`,
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

const obterValorMontagem = function(idmovimento, db) { 
    return new Promise(async (resolve, reject) => {
		
		let sql = `select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                          join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                          join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                          where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idmovimento} and
                          MOVIMENTOSITENS_CSTPIS <> 'ML'`;

        db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results[0] ? results[0]['SUM'] : 0);
            }
        });
    });
};