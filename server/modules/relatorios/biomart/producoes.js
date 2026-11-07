'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFB');

module.exports = {
    read: params => {

		let pathLogo;

		try {
			pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
		} catch(error) {
			pathLogo = `${appRoot}/resources/images/headers/default.png`;
		}

        const cents = utils.number.cents.bind(utils.number);					

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);

            let idProdutoAnt = 0;
            let totalProduto = 0;

            let docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 20, 15, 15],
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
                    {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 13
                    {
                        style: 'tableExample',
                        table: { //  NR  SE  [PRODUTO         ] FIN NLO FAB VAL QTD UNI
                            widths: [40, 20, 40, 40, 30, 30, 30, 40, 30, 40, 40, 40, 20],
                            headerRows: 1,
                            body: [
                                [
                                    {
                                        image: pathLogo,
                                        width: 100,
                                        height: 22,
                                        border: [false,false,false,false]
                                    },
                                    {
                                        text: `REGISTRO DE PRODUÇÃO NO PERIODO`,
                                        alignment: 'center',
                                        bold: true,
                                        fontSize: 12,
                                        colSpan: 12,
                                        border: [false,false,false,false]
                                    },{},{},{},{},{},{},{},{},{},{},{}
                                ],
                                [
                                    {
                                        text: `De ${moment(params.inicio).format('DD/MM/YYYY')} até ${moment(params.final).format('DD/MM/YYYY')}`,
                                        alignment: 'center',
                                        colSpan: 13,
                                        style: {
                                            bold: true,
                                            decoration: 'underline',
                                            fontSize: 10,
                                            color: 'black'
                                        },
                                        border: [false,false,false,false]
                                    },{},{},{},{},{},{},{},{},{},{},{},{}
                                ]
                            ]
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

            let rows = docDefinition.content[1].table.body;
            
            rows.push([
                {
                    text: 'Controle',
                    fontSize: 8,
                    alignment: 'center'
                },
                {
                    text: 'Ser',
                    fontSize: 8,
                    alignment: 'center'
                },
                {
                    text: 'Produto',
                    fontSize: 8,
                    colSpan: 5,
                    alignment: 'center'
                },{},{},{},{},
                {
                    text: 'Finalizada',
                    fontSize: 8,
                    alignment: 'center'
                },
                {
                    text: 'Lote',
                    fontSize: 8,
                    alignment: 'center'
                },
                {
                    text: 'Fabricação',
                    fontSize: 8,
                    alignment: 'center'
                },
                {
                    text: 'Validade',
                    fontSize: 8,       
                    alignment: 'center'                                                                        
                },
                {
                    text: 'Qtde',
                    alignment: 'center',
                    fontSize: 8
                },
                {
                    text: 'Unid',
                    fontSize: 8,
                    alignment: 'center'
                }
            ]);
            

            for(let i in dados){

                if(idProdutoAnt != dados[i]['PRODUCOES_ID_PRODUTOS']) {
                    if(totalProduto > 0) {
                        rows.push([
                            {
                                text: 'TOTAL DO PRODUTO:',
                                alignment: 'right',
                                colSpan: 10,
                                fontSize: 8,
                                bold: true,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},
                            {
                                text: (utils.number.float2moeda(totalProduto / 100)).split(',')[0],
                                colSpan: 2,
                                alignment: 'right',
                                fontSize: 8,
                                bold: true,
                                border: [false, false, false, false]
                            },{},
                            {
                                text: '',
                                border: [false, false, false, false]            
                            }
                        ]);        
                    }
                    idProdutoAnt = dados[i]['PRODUCOES_ID_PRODUTOS'];
                    totalProduto = 0;                    
                }
    
                rows.push([
                    {
                        text: dados[i]['PRODUCOES_NUMERO'],
                        alignment: 'right',
                        fontSize: 6
                    },      
                    {
                        text: dados[i]['PRODUCOES_SERIE'],
                        alignment: 'center',
                        fontSize: 6
                    },                            
                    {
                        text: dados[i]['PRODUTOS_NOME'].slice(0, 30),
                        colSpan: 5,
                        fontSize: 6
                    },{},{},{},{},
                    {
                        text: moment(dados[i]['PRODUCOES_FINALIZADA']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6
                    },                            
                    {
                        text: dados[i]['LOTES_REFERENCIA'],
                        alignment: 'center',
                        fontSize: 6
                    },
                    {
                        text: moment(dados[i]['LOTES_FABRICACAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: moment(dados[i]['LOTES_VALIDADE']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: (utils.number.float2moeda(dados[i]['PRODUCOES_QUANTIDADE'])).split(',')[0],
                        alignment: 'right',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['PRODUTOS_UNIDADE'],
                        alignment: 'center',
                        fontSize: 6                                
                    },  
                ]);

                totalProduto += cents(dados[i]['PRODUCOES_QUANTIDADE']);
            }

            rows.push([
                {
                    text: 'TOTAL DO PRODUTO:',
                    alignment: 'right',
                    colSpan: 10,
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false]
                },{},{},{},{},{},{},{},{},{},
                {
                    text: (utils.number.float2moeda(totalProduto / 100)).split(',')[0],
                    colSpan: 2,
                    alignment: 'right',
                    fontSize: 8,
                    bold: true,
                    border: [false, false, false, false]
                },{},
                {
                    text: '',
                    border: [false, false, false, false]
                }
            ]);        

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {
    const sql = `select PRODUCOES_NUMERO,
                        PRODUCOES_SERIE,
                        PRODUCOES_FINALIZADA,
                        PRODUCOES_ID_PRODUTOS,
                        PRODUCOES_QUANTIDADE,
                        PRODUCOES_ID_LOTES,
                        LOTES_REFERENCIA,
                        LOTES_FABRICACAO,
                        LOTES_VALIDADE,
                        PRODUTOS_NOME,
                        PRODUTOS_UNIDADE
                     
            from PRODUCOES
            join PRODUTOS on PRODUTOS_ID = PRODUCOES_ID_PRODUTOS
            left outer join LOTES on LOTES_ID = PRODUCOES_ID_LOTES
            where PRODUCOES_ID_EMPRESAS = ${params.empresaLogada} and                  
                  PRODUCOES_ID_PRODUTOS between  ${params.produtoinicial} and ${params.produtofinal} and                  
                  PRODUCOES_FINALIZADA between '${params.inicio}' and '${params.final}'
            order by PRODUCOES_ID_EMPRESAS,
                     PRODUCOES_ID_PRODUTOS,
                     PRODUCOES_FINALIZADA`;

    return await samosFB.executeSQL(sql, params);
}