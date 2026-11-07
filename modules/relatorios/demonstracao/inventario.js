'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFB');
const samosRedis = require('../../../services/samosRedis')

module.exports = {
    read: params => {
        let pathLogo;

        try {
            pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
        } catch(error) {
            pathLogo = `${appRoot}/resources/images/headers/default.png`;
        }

        let docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 35],
            header: function(page, pages) { 
                return { 
                    alignment: 'justify',
                    columns: [
                        {
                            image: pathLogo,
                            width: 100,
                            height: 22,
                        },
                        {
                            text: [
                                {
                                    text: `Inventario de Produtos em ${moment(params.inicio).format('DD/MM/YYYY')} - ${(
                                        params.preco == 0 ? 'Preço de Custo\n'  : 
                                        params.preco == 1 ? 'Preço de Compra\n' : 
                                        params.preco == 2 ? 'Preço de Venda\n' : 
                                        'Custo Médio\n')}`,
                                    width: '*',
                                    style: {
                                        fontSize: 11,
                                        alignment: 'center',
                                        color: 'blue'
                                    }
                                }
                            ]
                        },
                        {
                            stack: [
                                moment.tz(params.timezone).format('DD/MM/YYYY'),
                                moment.tz(params.timezone).format('HH:mm:ss')
                            ],
                            width: 100,
                            style: {
                                fontSize: 6,
                                alignment: 'right',
                                bold: true
                            }
                        }
                    ],
                    margin: [40, 10]
                }
            },
            styles: {
                tableExample: {
                    fontSize: 8,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            },
            content: [
                {columns: [{},{},{},{},{},{}]},
                {
                    style: 'tableExample',
                    table: {   //COD NOM UNI SLD PRC TOT // 6 Cols.
                        widths: [30, '*', 15, 40, 55, 50],
                        headerRows: 1,                        
                        body: [
                            [
                                {
                                    text: 'Código',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Descrição do Produto',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Uni',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Qtde',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: params.preco == 0 ? 'R$ Custo'  : 
                                          params.preco == 1 ? 'R$ Compra' : 
                                          params.preco == 2 ? 'R$ Venda'  : 'Custo Médio',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Total',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                }
                            ]
                        ]
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
                        '_'.repeat(95),
                        { text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
                    ],
                    margin: [40, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 8,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            }
        };

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);

            let rows = docDefinition.content[1].table.body;
            
            let totalGeral = 0;
            let totalGrupo = 0;

            for(let i in dados){

                if(parseInt(params.grupoinicial) > 0) {
                    if(dados[i]['GRUPOS_ID'] < params.grupoinicial) {
                        continue;
                    }
                }

                if(parseInt(params.grupofinal) > 0) {
                    if(dados[i]['GRUPOS_ID'] > params.grupofinal) {
                        continue;
                    }
                }


                const total = (
                    params.preco == 0 ? dados[i]['SALDOS_CUSTO'] :
                    params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                    params.preco == 2 ? dados[i]['SALDOS_PRECO'] :
                    params.preco == 3 ? dados[i]['SALDOS_MEDIO'] : 0
                ) * dados[i]['SALDOS_QUANTIDADE'];

                totalGeral += total;
                totalGrupo += total;

                if(!dados[parseInt(i) - 1] || dados[parseInt(i) - 1]['GRUPOS_NOME'] != dados[i]['GRUPOS_NOME']) {
					rows.push([
                        {
                            text: `***GRUPO: ${dados[i]['GRUPOS_NOME']}***`,
                            alignment: 'center',
                            style: 'tableExample',
                            bold: true,
                            colSpan: 6,
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);
                }
            
                rows.push([
                    {
                        text: dados[i]['PRODUTOS_ID'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },                            
                    {
                        text: dados[i]['PRODUTOS_NOME'] ,
                        alignment: 'left',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: dados[i]['PRODUTOS_UNIDADE'],
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: dados[i]['SALDOS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(
                            params.preco == 0 ? dados[i]['SALDOS_CUSTO']  :
                            params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                            params.preco == 2 ? dados[i]['SALDOS_PRECO']  :
                            params.preco == 3 ? dados[i]['SALDOS_MEDIO']  : 0
                        ),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(total),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    }
                ]);

                if(!dados[parseInt(i) + 1] || dados[parseInt(i) + 1]['GRUPOS_NOME'] != dados[i]['GRUPOS_NOME']) {
                    rows.push([
                        {
                            text: `TOTAL GRUPO: ${dados[i]['GRUPOS_NOME']}`,
                            alignment: 'right',
                            style: 'tableExample',
                            bold: true,
                            colSpan: 5,
                            border: [false, false, false, false]
                        },{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalGrupo),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        }
                    ]);
                    
					rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    totalGrupo = 0;
                }
            }

            rows.push([
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    colSpan: 5,
                    border: [false, false, false, false]
                },{},{},{},{},
                {
                    text: utils.number.float2moeda(totalGeral),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {

    const dataInventario = moment(params.inicio).format('DD.MM.YYYY');

    const sql = `select * from PROC_INVENTARIOSPED (${params.empresaLogada}, '${dataInventario}')`;

    const results = /*cacheData ? JSON.parse(cacheData) : */await samosFB.executeSQL(sql, params);

    return results;
}