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
                            widths:  [50, 250, 40, 40, 40, 40, 40],
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

            const grams = utils.number.grams.bind(utils.number);					

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: `Relatório de Saldo/Validade Lotes` ,
                        colSpan: 5,
                        bold: true,
                        fontSize: 14,
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
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: `Validade entre: ${moment(params.inicio).format('DD/MM/YYYY')} e ${moment(params.final).format('DD/MM/YYYY')}`,
                        colSpan: 5,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false],
                    }
                ],												
                [
                    {
                        text: 'Lote',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Produto',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Fabricação',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Validade',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Entradas',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Saídas',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Saldo Atual',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let model;

            for(let i in dados){

                model = dados[i];

                rows.push([
                    {
                        text: model['LOTES_REFERENCIA'],
                        alignment: 'center',
                        style: 'tableExample'
                    },							
                    {
                        text: model['PRODUTOS_NOME'],
                        style: 'tableExample'
                    },						
                    {
                        text: moment(model['LOTES_FABRICACAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: moment(model['LOTES_VALIDADE']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: model['ENTRADAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: model['SAIDAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: ((grams(model['ENTRADAS']) - grams(model['SAIDAS'])) / 1000),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    return new Promise(async (resolve, reject) => {

        let sql = `select MOVIMENTOSITENS_ID_LOTES,
                          MOVIMENTOSITENS_ID_PRODUTOS,
                          LOTES_REFERENCIA,
                          LOTES_FABRICACAO,
                          LOTES_VALIDADE,
                          PRODUTOS_NOME,
                          LOTES_QUANTIDADE,
                          LOTES_SALDO,
                          sum(case when OPERACOES_ESTOQUE = 'C' then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) ENTRADAS,
                          sum(case when OPERACOES_ESTOQUE = 'D' then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) SAIDAS
                    from MOVIMENTOSITENS
                    join LOTES      on LOTES_ID = MOVIMENTOSITENS_ID_LOTES
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                    join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    where MOVIMENTOS_ID_EMPRESAS = ${params.empresa}
                    and MOVIMENTOSITENS_ID_LOTES > 0
                    and LOTES_VALIDADE >= 'now'
                    and (not MOVIMENTOS_STATUS in('C','D', 'N')) and
                    LOTES_ID_PRODUTOS between ${params.produtoinicial} and ${params.produtofinal} and
                    PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and
                    LOTES_VALIDADE between '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}'

                    group by MOVIMENTOSITENS_ID_LOTES, MOVIMENTOSITENS_ID_PRODUTOS, LOTES_REFERENCIA, LOTES_FABRICACAO, LOTES_VALIDADE, PRODUTOS_NOME, LOTES_QUANTIDADE, LOTES_SALDO
                    order by LOTES_VALIDADE, PRODUTOS_NOME`

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