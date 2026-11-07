'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFB');

module.exports = {
    create: async (data, params) => { 
        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(data, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [20, 12, 60, 40, 32, '*', 100, 35, 45],
                            headerRows: 3,
                            body: []
                        },
                        layout: {
                            fillColor: function (i) {
                                return (i % 2 === 0) ? '#F0F0F0' : null;
                            }
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
                        text: `Relação de ${data.nomedocumento}`,
                        colSpan: 7,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{}
                ],
                [
                    {
                        text: '.',
                        color: 'white',
                        colSpan: 9,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{}
                ],
                [
                    {
                        text: 'Docto',
                        style: 'tableHeader',
                        alignment: 'center'                                    
                    },
                    {
                        text: 'SE',
                        style: 'tableHeader',
                        alignment: 'center'    
                    },
                    {
                        text: 'Vendedor',
                        style: 'tableHeader',
                        alignment: 'center'    
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'    
                    },
                    {
                        text: 'Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Nome Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Cidade',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'UF',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            const cents = utils.number.cents.bind(utils.number);     
            
            let totalGeral = 0;

            for(let i in dados){
                totalGeral += cents(dados[i]['MOVIMENTOS_TOTAL']);

                if(i > 0 && (data.produtos == 'T' || data.produtos === true)) {
                    rows.push([
                        {
                            text: 'Docto',
                            style: 'tableHeader',
                            alignment: 'center'                                    
                        },
                        {
                            text: 'SE',
                            style: 'tableHeader',
                            alignment: 'center'    
                        },
                        {
                            text: 'Vendedor',
                            style: 'tableHeader',
                            alignment: 'center'    
                        },
                        {
                            text: 'Emissão',
                            style: 'tableHeader',
                            alignment: 'center'    
                        },
                        {
                            text: 'Pessoa',
                            style: 'tableHeader',
                            alignment: 'center'
                        },
                        {
                            text: 'Nome Pessoa',
                            style: 'tableHeader',
                            alignment: 'center'
                        },
                        {
                            text: 'Cidade',
                            style: 'tableHeader',
                            alignment: 'center'
                        },
                        {
                            text: 'UF',
                            style: 'tableHeader',
                            alignment: 'center'
                        },
                        {
                            text: 'Total',
                            style: 'tableHeader',
                            alignment: 'center'
                        }
                    ]);
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        style: 'tableHeader',
                        alignment: 'center'                                    
                    },
                    {
                        text: dados[i]['MOVIMENTOS_SERIE'],
                        style: 'tableHeader',
                        alignment: 'center'    
                    },
                    {
                        text: (dados[i]['USUARIOS_NOME'] || '').slice(0, 15),
                        style: 'tableHeader',
                        alignment: 'left'    
                    },
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        style: 'tableHeader',
                        alignment: 'center'    
                    },
                    {
                        text: dados[i]['MOVIMENTOS_ID_PESSOAS'],
                        style: 'tableHeader',
                        alignment: 'right'
                    },
                    {
                        text: (dados[i]['MOVIMENTOS_NOME'] || '').slice(0, 30),
                        style: 'tableHeader',
                        alignment: 'left'
                    },
                    {
                        text: dados[i]['CIDADES_NOME'],
                        style: 'tableHeader',
                        alignment: 'left'
                    },
                    {
                        text: dados[i]['CIDADES_ESTADO'],
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOS_TOTAL']),
                        style: 'tableHeader',
                        alignment: 'right'
                    }
                ]);

                if((data.produtos == 'T' || data.produtos === true)) {
                    rows.push([
                        {
                            text: '',
                            style: 'tableHeader',
                            colSpan: 5,
                            alignment: 'center'    ,
                            border: [false, false, false, false]                                    
                        },{},{},{},{},
                        {
                            text: 'Produto',
                            style: 'tableHeader',
                            colSpan: 2,
                            alignment: 'center'
                        },{},
                        {
                            text: 'Qtde',
                            style: 'tableHeader',
                            alignment: 'center'
                        },
                        {
                            text: 'Total',
                            style: 'tableHeader',
                            alignment: 'center'
                        }
                    ]);

                    for (let item of dados[i]['MOVIMENTOS_ITENS'] || []) {
                        rows.push([
                            {
                                text: '',
                                style: 'tableHeader',
                                colSpan: 5,
                                alignment: 'center',
                                border: [false, false, false, false]                                
                            },{},{},{},{},
                            {
                                text: item['PRODUTOS_NOME'],
                                style: 'tableHeader',
                                colSpan: 2,
                                alignment: 'left'
                            },{},
                            {
                                text: utils.number.float2moeda(item['MOVIMENTOSITENS_QUANTIDADE']),
                                style: 'tableHeader',
                                alignment: 'right'
                            },
                            {
                                text: utils.number.float2moeda(item['MOVIMENTOSITENS_TOTAL']),
                                style: 'tableHeader',
                                alignment: 'right'
                            }
                        ]);
                    }
                }
            }
            
            rows.push([
                {
                    text: '.',
                    color: 'white',
                    colSpan: 9,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},{},{},{},{},{}
            ]);

            rows.push([
                {
                    text: 'Total Geral: ',
                    style: 'tableHeader',
                    colSpan: 8,
                    alignment: 'right',
                    border: [false, false, false, false]                                
                },{},{},{},{},,{},{},
                {
                    text: utils.number.float2moeda(totalGeral / 100),
                    style: 'tableHeader',
                    alignment: 'right',
                    border: [false, false, false, false]        
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = async function(data, params) {
    const ids = data['ids'];

    const sql = `select 
        MOVIMENTOS_ID,
        MOVIMENTOS_NUMERO,
        MOVIMENTOS_SERIE,
        MOVIMENTOS_EMISSAO,
        MOVIMENTOS_ID_PESSOAS,
        MOVIMENTOS_NOME,
        MOVIMENTOS_TOTAL,
        USUARIOS_NOME,
        CIDADES_NOME,
        CIDADES_ESTADO
    from MOVIMENTOS 
    join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
    join PESSOAS  on PESSOAS_ID  = MOVIMENTOS_ID_PESSOAS
    join CIDADES  on CIDADES_ID  = PESSOAS_ID_CIDADES
    where ${ids.map(id => ` (MOVIMENTOS_ID = ${id}) `).join(' or ')}`;

    try {
        const results = await samosFB.executeSQL(sql, params);

        if(data.produtos == 'T' || data.produtos === true) {
            for (let movimento of results) {
                const sqlItens = `select 
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_TOTAL,
                    PRODUTOS_NOME
                from MOVIMENTOSITENS
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
            }
        }

        return results;
    } catch (error) {
        console.log(error);
        throw error;
    }
};