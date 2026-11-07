'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {

			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [30, 15, 50, 220, 60, 60, 60],
                            headerRows: 3,
                            body: []
                        }
                    }
                ],
                footer: function(page, pages) {
                    return { 
                        stack: [ 
                            '_'.repeat(103),
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [15, 10]
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 7,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 7,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            const cents = utils.number.cents.bind(utils.number);					

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        colSpan: 2,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: `Relatório de Movimentação do Lote` ,
                        colSpan: 5,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{}
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: `Lote: ${dados[0]['LOTES_REFERENCIA']} - Produto: ${dados[0]['MOVIMENTOSITENS_ID_PRODUTOS']} - ${dados[0]['PRODUTOS_NOME']}`,
                        colSpan: 3,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],												
                [
                    {
                        text: 'Nf',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Se',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Entrada/Saida',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Entrada',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Saída',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Saldo',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalEntradas = 0;
            let totalSaidas = 0;
            let totalDevEntradas = 0;
            let totalDevSaidas = 0;
            let saldoLote = 0;
            let model;

            for(let i in dados){

                model = dados[i];

                console.log(model);

                if(model['OPERACOES_ACAO'] == 'DV') { // Devoluções de vendas
                    totalDevSaidas += model['MOVIMENTOSITENS_QUANTIDADE'];
                }

                if(model['OPERACOES_ACAO'] == 'DC') { // Devoluções de compras
                    totalDevEntradas += model['MOVIMENTOSITENS_QUANTIDADE'];
                }

                if(model['OPERACOES_ESTOQUE'] == 'C') {
                    saldoLote += model['MOVIMENTOSITENS_QUANTIDADE'];
                    totalEntradas += model['MOVIMENTOSITENS_QUANTIDADE'];
                } else {
                    if(model['OPERACOES_ESTOQUE'] == 'D') {
                        saldoLote -= model['MOVIMENTOSITENS_QUANTIDADE'];
                        totalSaidas += model['MOVIMENTOSITENS_QUANTIDADE'];
                    }
                }
                
                rows.push([
                    {
                        text: model['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: model['MOVIMENTOS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: model['MOVIMENTOS_NOME'].slice(0, 30),
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: (model['OPERACOES_ESTOQUE'] == 'C' ? model['MOVIMENTOSITENS_QUANTIDADE'] : ''),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: (model['OPERACOES_ESTOQUE'] == 'D' ? model['MOVIMENTOSITENS_QUANTIDADE'] : ''),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: saldoLote,
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

            }

            rows.push([
                {
                    text: 'TOTAIS:',
                    alignment: 'right',
                    style: 'tableExample',
                    colSpan: 4,
                    border: [false, false, false, false]
                },{},{},{},							
                {
                    text: totalEntradas,
                    alignment: 'right',
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: totalSaidas,
                    alignment: 'right',
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: '',
                    border: [false, false, false, false]
                }
            ]);	

            rows.push([
                {
                    colSpan: 7,
                    border: [false, false, false, false],
                    table: {
                        widths: [100, 60],
                        body: [
                            [
                                {
                                    text: 'Devoluções para Fornecedores',
                                    alignment: 'left',
                                    style: {bold: true,	fontSize: 7}                                                            
                                },
                                {
                                    text: totalDevEntradas,
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 7}
                                }
                            ],
                            [
                                {
                                    text: 'Devoluções de Clientes',
                                    alignment: 'left',
                                    style: {bold: true,	fontSize: 7}                                                            
                                },
                                {
                                    text: totalDevSaidas,
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 7}
                                }
                            ]
                        ]
                    }
//                    layout: 'noBorders'
                },{},{},{},{},{},{}
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOS_EMISSAO,
                          MOVIMENTOS_ENTRADASAIDA,
                          MOVIMENTOS_NUMERO,
                          MOVIMENTOS_SERIE,
                          MOVIMENTOS_NOME,
                          MOVIMENTOSITENS_ID_PRODUTOS,
                          PRODUTOS_NOME,
                          MOVIMENTOSITENS_QUANTIDADE,
                          MOVIMENTOSITENS_ID_OPERACOES,
                          trim(OPERACOES_ESTOQUE) as OPERACOES_ESTOQUE,
                          trim(OPERACOES_ACAO) as OPERACOES_ACAO,
                          LOTES_ID,
                          LOTES_REFERENCIA,
                          LOTES_FABRICACAO,
                          LOTES_VALIDADE
                   from MOVIMENTOSITENS
                   join LOTES on LOTES_ID = MOVIMENTOSITENS_ID_LOTES
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                   join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                   join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                   where MOVIMENTOSITENS_ID_LOTES = ${params.conteudo} and
                         ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003') or 
                          (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005'))
                   order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOSITENS_ID`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};