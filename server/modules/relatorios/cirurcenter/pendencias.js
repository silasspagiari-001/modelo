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
                    {columns: [{},{},{},{},{},{},{},{}]},  // 8 Cols
                    {
                        style: 'tableExample',
                        table: {    //PR QDE  DES RET EMI PRC TOT  REQ (8 Cols)
                            widths:  [40, 30, 210, 50, 50, 40, 45, 30],
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
                        margin: [15, 10]  // 10, 10
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 8,
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
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Relação de Pendencias',
                        colSpan: 5,
                        bold: true,
                        fontSize: 12,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
                    {
                        text: '',
                        border: [false, false, false, false]								
                    }
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: `Pessoa: ${dados[0]['PESSOAS_ID']} - ${dados[0]['PESSOAS_NOME']}    CPF/CNPJ: ${utils.string.maskCnp(dados[0]['PESSOAS_CPFCNPJ'])}`,
                        colSpan: 5,
                        fontSize: 8,
                        bold: true,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false]
                    }
                ],												
                [
                    {
                        text: 'Produto',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Descrição do Produto',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Retirado por',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Data',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Preço',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total Liq',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Pen Nº',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalPendencias = 0;

            for(let i in dados){

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'center',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample',
                    },
                    {
                        text: (dados[i]['MOVIMENTOS_PROTOCOLO'] == 'IMPORTACAO' ? '' :dados[i]['MOVIMENTOS_PROTOCOLO']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_PRECO']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['TOTAL_LIQUIDO']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);

                totalPendencias += (dados[i]['TOTAL_LIQUIDO'])
            }

            rows.push(
                [
                    {
                      text: 'Total Pendências',
                      bold: true,
                      alignment: 'right',
                      colSpan: 6,
                      border: [false, false, false, false]
                    },{},{},{},{},{},
                    {
                       text: utils.number.float2moeda(totalPendencias),
                       alignment: 'right',
                       border: [false, false, false, false]                       
                    },
                    {
                        text: '',
                        border: [false, false, false, false]
                    }
                ]
            )

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    const { pessoa } = params;

    return new Promise(async (resolve, reject) => {

        let sql = `select 
                        MOVIMENTOS_ID_EMPRESAS, 
                        MOVIMENTOSITENS_ID_MOVIMENTOS,
                        MOVIMENTOS_EMISSAO, 
                        MOVIMENTOS_NUMERO, 
                        MOVIMENTOS_SERIE,
                        MOVIMENTOS_PROTOCOLO,
                        PESSOAS_ID,
                        PESSOAS_NOME,
                        PESSOAS_CPFCNPJ,
                        MOVIMENTOS_ID_DOCUMENTOS, 
                        MOVIMENTOSITENS_ID_PRODUTOS, 
                        PRODUTOS_NOME,
                        PRODUTOS_MARCA,
                        PRODUTOS_UNIDADE,
                        MOVIMENTOSITENS_QUANTIDADE, 
                        MOVIMENTOSITENS_PRECO, 
                        MOVIMENTOSITENS_TOTAL,
                        cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO
                    from MOVIMENTOS
                    join MOVIMENTOSITENS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    join PESSOAS    on PESSOAS_ID  = MOVIMENTOS_ID_PESSOAS
                    join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    where MOVIMENTOS_ID_PESSOAS = '${pessoa}'  and
                        right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and
                        MOVIMENTOS_ID_OPERACOES = 600000 and
                        ((MOVIMENTOS_STATUS <> 'C') and 
                        (MOVIMENTOS_STATUS <> 'D') and
                        (MOVIMENTOS_STATUS <> 'R') and
                        (MOVIMENTOS_STATUS <> 'V'))
                    order by MOVIMENTOS_EMISSAO, PRODUTOS_NOME`;


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