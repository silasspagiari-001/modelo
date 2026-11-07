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
                                    text: `RELAÇÃO PARA COMPRAS`,
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
                    fontSize: 7,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            },
            content: [
                {columns: [{},{},{},{},{},{},{}]},
                {
                    style: 'tableExample',
                    table: {   //COD NOM UNI FOR ULT CPA VDA SLD PED
                        widths: [30, '*', 15, 40, 40, 40, 40, 40, 40],
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
                                    text: 'Fornecedor',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Ultima',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Compra',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Venda',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Saldo',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'PED',
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
                    margin: [20, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 6,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 7,
                    color: 'black'
                }
            }
        };

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);
            
            let rows = docDefinition.content[1].table.body;
            
            for(let i in dados){

                const ultimaCompra = dados[i]['ULTIMA_COMPRA'] == null ? '' : moment(dados[i]['ULTIMA_COMPRA']).format('DD/MM/YYYY');
               
                if(!dados[parseInt(i) - 1] || dados[parseInt(i) - 1]['GRUPOS_NOME'] != dados[i]['GRUPOS_NOME']) {
					rows.push([
                        {
                            text: `***GRUPO: ${dados[i]['GRUPOS_ID']} - ${dados[i]['GRUPOS_NOME']} ***`,
                            alignment: 'center',
                            fontSize: 10,
                            bold: true,
                            colSpan: 9,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 9,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
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
                        text: dados[i]['PRODUTOS_NOME'],
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
                        text: dados[i]['PESSOAS_NOME'].slice(0, 10),
                        alignment: 'left',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: ultimaCompra,
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['SALDOS_COMPRA']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['SALDOS_PRECO']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: dados[i]['SALDOS_DISPONIVEL'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: '',
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, true]
                    }
                ]);

            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {
    const sql = `select                                            
        PRODUTOS_ID,                                    
        PRODUTOS_NOME,                                  
        PRODUTOS_UNIDADE,                               
        PRODUTOS_ID_GRUPOS,                                 
        GRUPOS_ID,
        GRUPOS_NOME,
        PRODUTOS_ID_PESSOAS,
        PESSOAS_NOME,
        SALDOS_DISPONIVEL,
        SALDOS_COMPRA,                                  
        SALDOS_PRECO,
        (select max(MOVIMENTOS_EMISSAO) FROM MOVIMENTOSITENS
         join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
         join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
         where MOVIMENTOSITENS_ID_PRODUTOS = PRODUTOS_ID
           and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005'
           and left(OPERACOES_ACAO, 1) = 'C' ) as ULTIMA_COMPRA

    from PRODUTOS                                     
    join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS     
    join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
    join SALDOS on SALDOS_ID_EMPRESAS = '${params.empresaLogada}' and SALDOS_ID_PRODUTOS = PRODUTOS_ID
    where PRODUTOS_ID_GRUPOS between ${params.grupoinicial || 0} and ${params.grupofinal || 99999} and
          PRODUTOS_ID_PESSOAS between ${params.pessoainicial || 0} and ${params.pessoafinal || 999999}
          order by PRODUTOS_ID_GRUPOS, PRODUTOS_NOME`;

    const results = await samosFB.executeSQL(sql, params);

    return results;
}