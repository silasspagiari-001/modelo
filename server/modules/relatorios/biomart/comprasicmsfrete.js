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
                    {columns: [{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [30, '*', 100, 50, 50, 50, 60, 60],
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
                            '_'.repeat(150),
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

            const cents = utils.number.cents.bind(utils.number);					

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
                        text: 'Relação de Compras (ICMS e Frete)',
                        colSpan: 4,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},
                    {
                        text: '',
                        colSpan: 2,
                        fontSize: 10,
                        alignment: 'right',
                        border: [false, false, false, false]								
                    },{}
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 4,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],												
                [
                    {
                        text: 'Código',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Nome do fornecedor',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 3	
                    },{},{},
                    {
                        text: 'Cidade, UF',
                        style: 'tableHeader',
                        colSpan: 2,
                        alignment: 'center'	
                    },{},
                    {
                        text: 'Vlr Frete',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Vlr ICMS',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalIcms = 0;
            let totalFrete = 0;

            for(let i in dados){

                let freteMovimento = dados[i]['MOVIMENTOS_ID_APLICACOES'] == 406 ?  // Aplicação de frete
                                     (cents(dados[i]['NOTA'] + dados[i]['FRETE']) / 100) :
                                     (cents(dados[i]['FRETE']) / 100);

                let icmsMovimento = (cents(dados[i]['ICMS']) / 100);

                if((freteMovimento + icmsMovimento) == 0) {
                    continue;
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_ID_PESSOAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['PESSOAS_NOME'],
                        alignment: 'left',
                        colSpan: 3,
                        style: 'tableExample'
                    },{},{},
                    {
                        text: (dados[i]['CIDADES_NOME'] + '/' + dados[i]['CIDADES_ESTADO']),
                        alignment: 'left',
                        colSpan: 2,
                        style: 'tableExample'
                    },{},
                    {
                        text: utils.number.float2moeda(freteMovimento),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(icmsMovimento),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                totalFrete += freteMovimento;
                totalIcms  += icmsMovimento;
            }

            rows.push([
                {
                    text: 'Totais',
                    alignment: 'right',
                    bold: true,
                    colSpan: 6,
                    style: 'tableExample'
                },{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalFrete),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalIcms),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                }
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        grupo,
		pessoa,
        inicio, 
        final, 
        empresaLogada
    } = params;

	const sqlPessoa = pessoa ? `MOVIMENTOS_ID_PESSOAS = ${pessoa} and ` : ""

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOS_ID_PESSOAS, 
                          PESSOAS_NOME,
                          CIDADES_NOME,
                          CIDADES_ESTADO,
                          MOVIMENTOS_ID_APLICACOES,
                          APLICACOES_NOME,
                          sum(MOVIMENTOSITENS_TOTAL) as NOTA,
                          sum(MOVIMENTOSITENS_FRETE) as FRETE,
                          sum(MOVIMENTOSITENS_VALORICMS) as ICMS
                   from MOVIMENTOSITENS  
                   join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                   join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                   join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                   join APLICACOES on APLICACOES_ID = MOVIMENTOS_ID_APLICACOES
                   join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
              where  ${sqlPessoa}
                     right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005' and
                     MOVIMENTOS_ENTRADASAIDA between '${inicio}' and '${final}' and
                     ((PRODUTOS_ID_GRUPOS = 3) or (PRODUTOS_ID_GRUPOS = 6) or (PRODUTOS_ID_GRUPOS = 15))
              group by MOVIMENTOS_ID_PESSOAS,PESSOAS_NOME,CIDADES_NOME,CIDADES_ESTADO, MOVIMENTOS_ID_APLICACOES, APLICACOES_NOME
              order by PESSOAS_NOME`;

            console.log('sql: ', sql);

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