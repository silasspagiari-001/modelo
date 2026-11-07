'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);
		    let docDefinition = {};
            let totalVendedor = 0;
            let totalVendas  = 0;
            let totalVendedorOrc = 0;
            let totalVendasOrc  = 0;
            let VencidasComissao = 0;
            let PagasComissao = 0;

            let rows;

       		if(params.tipo == 0) { // Sintético

                docDefinition = {
                    pageOrientation : 'portrait',
                    pageSize: 'A4',
                    pageMargins: [20, 40, 15, 35],  // E S D I 
                    content: [
                        {columns: [{},{},{},{},{},{},{},{},{}]},  // 9
                        {
                            style: 'tableExample',
                            table: {
                                widths:  [40, 15, 40, 80, 90, 40, 50, 50, 50],
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
                                { text: 'PáginaS: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                            ],
                            margin: [40, 10]  // 10, 10
                        };
                    },
                    styles: {
                        tableExample: {
                            fontSize: 7,
                            margin: [0, 0, 0, 0],
                            border: 0
                        },
                        tableHeader: {
                            bold: true,
                            fontSize: 7,
                            color: 'black'
                        }
                    }
                };

                rows = docDefinition.content[1].table.body;

                let pathLogo;

                try {
                    pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
                } catch(error) {
                    pathLogo = `${appRoot}/resources/images/headers/default.png`;
                }

                let docAnt = 0;
                rows.push(		
                    [
                        {							
                            image: pathLogo,
                            width: 80,
                            alignment: 'left',
                            border: [false, false, false, false]
                        },
                        { 
                            text: 'Comissão de Vendedores',
                            colSpan: 7,
                            bold: true,
                            fontSize: 13,
                            alignment: 'center',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},
                        {
                            text: '',
                            border: [false, false, false, false]								
                        }
                    ],
                    [
                        {							
                            text: moment.tz(params.timezone).format('HH:mm:ss'),
                            alignment: 'left',
                            border: [false, false, false, false]
                        },
                        { 
                            text: 'Período: ' + params.inicio + ' a ' + params.final,
                            colSpan: 7,
                            fontSize: 8,
                            alignment: 'center',
                            border: [false, false, false, false],



                        },{},{},{},{},{},{},
                        {
                            text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                            alignment: 'right',
                            border: [false, false, false, false]
                        }
                    ],												

                    [
                        {							
                            text: '',
                            border: [false, false, false, false]
                        },
                        { 
                            text: dados[0]['USUARIOS_NOME'],
                            bold: true,
                            colSpan: 7,
                            fontSize: 10,
                            alignment: 'center',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},
                        {
                            text: '',
                            border: [false, false, false, false]
                        }
                    ]												
                );

                rows.push([
                { text: 'NUMERO', style: 'tableHeader', alignment: 'center' },
                { text: 'SR', style: 'tableHeader', alignment: 'center' },
                { text: 'CODIGO', style: 'tableHeader', alignment: 'center' },
                { text: 'CLIENTE', style: 'tableHeader', alignment: 'center', colSpan: 3 }, {}, {},
                { text: 'EMISSAO', style: 'tableHeader', alignment: 'center' },
                { text: 'VALOR NF', style: 'tableHeader', alignment: 'center' },
                { text: 'COMISSÃO', style: 'tableHeader', alignment: 'center' }
            ]);

            for (let i in dados) {

                totalVendas += (dados[i]['MOVIMENTOS_TOTAL']);
                totalVendedor += (dados[i]['COMISSAO_TOTAL']); 

                rows.push([
                { text: dados[i]['MOVIMENTOS_NUMERO'], alignment: 'right', style: 'tableExample' },
                { text: dados[i]['MOVIMENTOS_SERIE'], style: 'tableExample' },
                { text: dados[i]['MOVIMENTOS_ID_PESSOAS'], alignment: 'right', style: 'tableExample' },
                { text: dados[i]['PESSOAS_NOME'], alignment: 'left', style: 'tableExample', colSpan: 3 }, {}, {},
                { text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'), alignment: 'right', style: 'tableExample' },
                { text: utils.number.float2moeda(dados[i]['MOVIMENTOS_TOTAL']), alignment: 'right', style: 'tableExample' },
                { text: utils.number.float2moeda(dados[i]['COMISSAO_TOTAL']), alignment: 'right', style: 'tableExample' }
                ]);
            }
            } else {
                docDefinition = {
                    pageOrientation: 'portrait',
                    pageSize: 'A4',
                    pageMargins: [20, 40, 15, 35],  // E S D I 
                    content: [
                        {columns: [{},{},{},{},{},{},{},{},{}]},  // 9
                        {
                            style: 'tableExample',
                            table: {
                                widths:  [40, 15, 40, 80, 90, 40, 50, 50, 50],
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
                                { text: 'PáginaA: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                            ],
                            margin: [40, 10]  // 10, 10
                        };
                    },
                    styles: {
                        tableExample: {
                            fontSize: 7,
                            margin: [0, 0, 0, 0],
                            border: 0
                        },
                        tableHeader: {
                            bold: true,
                            fontSize: 7,
                            color: 'black'
                        }
                    }
                };

                rows = docDefinition.content[1].table.body;

                let pathLogo;

                try {
                    pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
                } catch(error) {
                    pathLogo = `${appRoot}/resources/images/headers/default.png`;
                }

                let docAnt = 0;
                rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Comissão de Vendedores',
                        colSpan: 7,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: '',
                        border: [false, false, false, false]								
                    }
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Período: ' + params.inicio + ' a ' + params.final,
                        colSpan: 7,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false],



                    },{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false]
                    }
                ],												

                [
                    {							
                        text: '',
                        border: [false, false, false, false]
                    },
                    { 
                        text: dados[0]['USUARIOS_NOME'],
                        bold: true,
                        colSpan: 7,
                        fontSize: 10,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: '',
                        border: [false, false, false, false]
                    }
                ]												
                );

                for(let i in dados){
                    if(docAnt != dados[i]['MOVIMENTOS_NUMERO']) {
                        rows.push(		
                            [
                                {
                                    text: '\n',
                                    colSpan: 9,
                                    border: [false, false, false, false]
                                },{},{},{},{},{},{},{},{}
                            ]
                        );

                    rows.push(		
                    [
                        { text: 'NUMERO'  ,style: 'tableHeader', alignment: 'center' },
                        { text: 'SR'      ,style: 'tableHeader', alignment: 'center' },
                        { text: 'CODIGO'  ,style: 'tableHeader', alignment: 'center' },
                        { text: 'CLIENTE' ,style: 'tableHeader', alignment: 'center', colSpan: 3 },{},{},
                        { text: 'EMISSAO' ,style: 'tableHeader', alignment: 'center' },
                        { text: 'VALOR NF',style: 'tableHeader', alignment: 'center', colSpan: 2 },{}
                    ]        );

                    totalVendas += dados[i]['MOVIMENTOS_TOTAL']
                   

                        rows.push([
                            {
                                text: dados[i]['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [true, false, false, false]
                            },							
                            {
                                text: dados[i]['MOVIMENTOS_SERIE'],
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: dados[i]['MOVIMENTOS_ID_PESSOAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: dados[i]['PESSOAS_NOME'],
                                alignment: 'left',
                                style: 'tableExample',
                                colSpan: 3,
                                border: [false, false, false, false]
                            },{},{},
                            {
                                text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: utils.number.float2moeda(dados[i]['MOVIMENTOS_TOTAL']),
                                alignment: 'right',
                                style: 'tableExample',
                                colSpan: 2,
                                border: [false, false, true, false]
                            },{}
                        ]);	

                        rows.push(		
                            [
                                {
                                    text: 'CODIGO',
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'DESCRICAO',
                                    style: 'tableHeader',
                                    alignment: 'center',
                                    colSpan: 4
                                },{},{},{},
                                {
                                    text: 'UN',
                                    style: 'tableHeader',
                                    alignment: 'center'	
                                },
                                {
                                    text: 'QTDE',
                                    style: 'tableHeader',
                                    alignment: 'center',
                                },
                                {
                                    text: 'VALOR TOTAL',
                                    style: 'tableHeader',
                                    alignment: 'center',
                                },
                                {
                                    text: 'COMISSAO',
                                    style: 'tableHeader',
                                    alignment: 'center',
                                }
                            ]
                        );

                        docAnt = dados[i]['MOVIMENTOS_NUMERO'];
                    }    

                    totalVendedor += (dados[i]['COMISSAO_TOTAL']);

//                    console.log(dados[i]['COMISSAO_TOTAL']);

                    rows.push([
                        {
                            text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },							
                        {
                            text: dados[i]['PRODUTOS_NOME'],
                            style: 'tableExample',
                            colSpan: 4,
                            border: [false, false, false, false]
                        },{},{},{},						
                        {
                            text: dados[i]['PRODUTOS_UNIDADE'],
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },
                        {
                            text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },
                        {
                            text: utils.number.float2moeda(dados[i]['TOTAL_LIQUIDO']),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },
                        {
                            text: utils.number.float2moeda(dados[i]['COMISSAO_TOTAL']),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },
                        
                    ]);	

                }

            }

            rows.push([
                    {
                        text: 'TOTAIS NF:',
                        alignment: 'right',
                        colSpan: 7,
                        bold: true,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalVendas),
                        alignment: 'right',
                        fontSize: 8,                        
                        bold: true,
                        border: [false, false, false, false]                                    
                    },
                    {
                        text: utils.number.float2moeda(totalVendedor),
                        alignment: 'right',
                        fontSize: 8,                        
                        bold: true,
                        border: [false, false, false, false]                                    

                    }
                ]);                            

                rows.push([
                    {
                        text: 'TOTAL GERAL:',
                        alignment: 'right',
                        colSpan: 7,
                        bold: true,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalVendasOrc + totalVendas),
                        alignment: 'right',
                        fontSize: 8,                        
                        bold: true,
                        border: [false, false, false, false]                                    
                    },
                    {
                        text: utils.number.float2moeda(totalVendedorOrc + totalVendedor),
                        alignment: 'right',
                        fontSize: 8,                        
                        bold: true,
                        border: [false, false, false, false]                                    

                    }
                ]);          

                rows.push([{ text: '', style: 'tableHeader', alignment: 'center',border: [false, false, false, false],colSpan: 9 },{},{},{},{},{},{},{},{}]);


                rows.push([
                { text: 'NUMERO', style: 'tableHeader', alignment: 'center' },
                { text: 'SR', style: 'tableHeader', alignment: 'center' },
                { text: 'CODIGO', style: 'tableHeader', alignment: 'center' },
                { text: 'CLIENTE', style: 'tableHeader', alignment: 'center', colSpan: 2 }, {}, 
                { text: 'EMISSAO', style: 'tableHeader', alignment: 'center' },
                { text: 'VENCIMENTO', style: 'tableHeader', alignment: 'center' },
                { text: 'VALOR', style: 'tableHeader', alignment: 'center' },
                { text: 'COMISSÃO', style: 'tableHeader', alignment: 'center' }
            ]);

            rows.push([
                    {
                        text: 'TOTAL COMISSÃO A RECEBER:',
                        alignment: 'right',
                        colSpan: 7,
                        fontSize: 10,                        
                        bold: true,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(0),
                        alignment: 'right',
                        fontSize: 8,                        
                        bold: true,
                        border: [false, false, false, false]                                    
                    },
                    {
                        text: utils.number.float2moeda(totalVendedor),
                        alignment: 'right',
                        fontSize: 10,                        
                        bold: true,
                        border: [false, false, false, false]                                    

                    }
                ]);                            







            pdfStream(docDefinition, resolve, reject);
        });
    }
};


const obterDados = async function(db, params) {
    const { 
        tipo,
        vendedor,
        inicio, 
        final, 
        empresaLogada 
    } = params;

    let sqlVendedor  = cents(vendedor)  > 0 ? `MOVIMENTOS_ID_USUARIOS = ${vendedor} and ` : '';

    let sql = '';

    // MOVIMENTOSITENS_IMEDIATA = %COMISSAO
    // MOVIMENTOSITENS_DEPOSITO = PRECO2

//            SUM((((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO)-MOVIMENTOSITENS_DESCONTOS)) / 100 * USUARIOS_COMISSAO) AS COMISSAO_TOTAL


    if(params.tipo == 1) { // Sintético

      sql = ` select MOVIMENTOS_ID_USUARIOS, 
                    USUARIOS_NOME,
                    MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,MOVIMENTOS_EMISSAO,MOVIMENTOS_ID_PESSOAS,PESSOAS_NOME,MOVIMENTOS_TOTAL,
                    MOVIMENTOSITENS_ID_PRODUTOS, 
                    PRODUTOS_NOME,PRODUTOS_UNIDADE,PRODUTOS_ID_GRUPOS,
                    MOVIMENTOSITENS_QUANTIDADE,MOVIMENTOSITENS_DEPOSITO,MOVIMENTOSITENS_IMEDIATA,                  
                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    cast((((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS)/100) * USUARIOS_COMISSAO as numeric(12,2)) AS COMISSAO_TOTAL                    
                from MOVIMENTOS
                left outer join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                left outer join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                left outer join USUARIOS   on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                where  MOVIMENTOS_ID_EMPRESAS  = ${empresaLogada} and 
                        ((MOVIMENTOS_STATUS <> 'C') and 
                        (MOVIMENTOS_STATUS <> 'D') and
                        (MOVIMENTOS_STATUS <> 'R')) and
                        OPERACOES_ACAO = 'VN' and        
                        ${sqlVendedor}
                        MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                        order by MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`;
    } else {
        sql = `
            SELECT 
            MOVIMENTOS_ID_USUARIOS,
            USUARIOS_NOME,
            MOVIMENTOS_NUMERO,
            MOVIMENTOS_SERIE,
            MOVIMENTOS_EMISSAO,
            MOVIMENTOS_ID_PESSOAS,
            PESSOAS_NOME,
            SUM((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO)-MOVIMENTOSITENS_DESCONTOS) AS MOVIMENTOS_TOTAL,
            SUM((((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO)-MOVIMENTOSITENS_DESCONTOS)) / 100 * USUARIOS_COMISSAO) AS COMISSAO_TOTAL
            FROM MOVIMENTOS
            LEFT JOIN MOVIMENTOSITENS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            LEFT JOIN OPERACOES ON OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
            LEFT JOIN PESSOAS ON PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            LEFT JOIN USUARIOS ON USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
            LEFT JOIN PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
            LEFT JOIN SALDOS ON SALDOS_ID_EMPRESAS = ${empresaLogada} AND SALDOS_ID_PRODUTOS = PRODUTOS_ID
            WHERE MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} AND
                MOVIMENTOS_STATUS NOT IN ('C', 'D', 'R') AND
                OPERACOES_ACAO = 'VN' AND
                ${sqlVendedor}
                MOVIMENTOS_EMISSAO BETWEEN '${inicio.replace(/\//g, '.')}' AND '${final.replace(/\//g, '.')}'
            GROUP BY 
            MOVIMENTOS_ID_USUARIOS,
            USUARIOS_NOME,
            MOVIMENTOS_NUMERO,
            MOVIMENTOS_SERIE,
            MOVIMENTOS_EMISSAO,
            MOVIMENTOS_ID_PESSOAS,
            PESSOAS_NOME
            ORDER BY 
            MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO
        `;

    }

//    console.log(sql);

	    return new Promise((resolve, reject) => {
          db.query(sql, (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};






