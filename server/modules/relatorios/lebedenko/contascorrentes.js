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
            const faturamento = await obterFaturamento(db, params);
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: { //  DTE CTA  DES VLR SFT
                            widths:  [40, 20, 350, 60, 40],
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
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: 'Resumo Analítico por Aplicação',
                        colSpan: 3,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
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
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 3,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false],
                    }
                ],												
                [
                    {
                        text: 'Data',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Apl',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Descrição do Lançamento',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Valor Total',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: '% S/Fatur.',
                        style: 'tableHeader',
                        alignment: 'center'	
                    }
                ]
            );

            let totalAplicacao = 0;
            let geralAplicacao = 0;
            let valorFaturamento = cents(faturamento[0]['FATURAMENTO']);

            for(let i in dados){

                totalAplicacao += cents(dados[i]['CONTACORRENTES_VALOR']);
                geralAplicacao += cents(dados[i]['CONTACORRENTES_VALOR']);

                if(dados[i]['CONTACORRENTES_ID_APLICACOES'] != (dados[parseInt(i) - 1] || {})['CONTACORRENTES_ID_APLICACOES']) {                   
                    rows.push([
                        {
                            text: `****** APLICAÇÃO: ${dados[i]['CONTACORRENTES_ID_APLICACOES']} - ${dados[i]['APLICACOES_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 5,
                            fontSize: 8,
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: moment(dados[i]['CONTACORRENTES_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['CONTACORRENTES_ID_APLICACOES'],
                        alignment: 'right',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['CONTACORRENTES_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },		
                    {
                        text: utils.number.float2moeda(cents(dados[i]['CONTACORRENTES_VALOR']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: ((cents(dados[i]['CONTACORRENTES_VALOR']) / valorFaturamento)*100).toFixed(3).replace('.', ','),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                if(dados[i]['CONTACORRENTES_ID_APLICACOES'] != (dados[parseInt(i) + 1] || {})['CONTACORRENTES_ID_APLICACOES']) {
                    rows.push([
                        {
                            text: 'Total da Aplicação',
                            colSpan: 3,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},
                        {
                            text: utils.number.float2moeda(totalAplicacao / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: ((totalAplicacao / valorFaturamento)*100).toFixed(3).replace('.', ','),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);

                    totalAplicacao = 0;
                }
            }
            rows.push([
                {
                    colSpan: 5,
                    border: [false, false, false, false],
                    table: {
                        widths: [140, 120],
                        body: [
                            [
                                {
                                    text: 'Total (Faturamento)',
                                    fontSize: 10,
                                },
                                {
                                    text: utils.number.float2moeda(valorFaturamento / 100),
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 10}
                                }
                            ],
                            [ 
                                {
                                    text: 'Total (Despesa)',
                                    fontSize: 10,
                                },
                                {
                                    text: utils.number.float2moeda(geralAplicacao / 100),
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 10}
                                }
                            ],
                            [ 
                                {
                                    text: 'Total (Faturamento - Despesa)',
                                    fontSize: 10,
                                },
                                {
                                    text: utils.number.float2moeda((valorFaturamento - geralAplicacao) / 100),
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 10}
                                }
                            ],
                            [ 
                                {
                                    text: '% Sobre Faturamento',
                                    fontSize: 10,
                                },
                                {
                                    text: utils.number.float2moeda((geralAplicacao / valorFaturamento) * 100),
                                    alignment: 'right',
                                    style: {bold: true,	fontSize: 10}
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                },{},{},{},{}

            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        tipo, 
        inicio, 
        final, 
        empresaLogada, 
        idContai, 
        idContaf, 
        idAplicacaoi, 
        idAplicacaof, 
        despesas
    } = params;

    return new Promise(async (resolve, reject) => {
        const sqlDespesas = despesas == 1 ? ` APLICACOES_TIPO = 'D' and ` : `` ;
		let sql = `
                select CONTACORRENTES_EMISSAO,
                       CONTACORRENTES_ID_APLICACOES,
                       CONTACORRENTES_NOME,
                       CONTACORRENTES_VALOR,
                       APLICACOES_NOME
                from CONTACORRENTES
                join APLICACOES on APLICACOES_ID = CONTACORRENTES_ID_APLICACOES
                where CONTACORRENTES_ID_EMPRESAS = ${empresaLogada} and
                    ${sqlDespesas}
                    CONTACORRENTES_EMISSAO between '${inicio}' and '${final}' and
                    CONTACORRENTES_ID_APLICACOES between ${idAplicacaoi} and ${idAplicacaof} and
                    CONTACORRENTES_ID_PESSOAS between ${idContai} and ${idContaf}
                order by CONTACORRENTES_ID_APLICACOES, CONTACORRENTES_EMISSAO, CONTACORRENTES_ID`

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

const obterFaturamento = function(db, params) {
    const { 
        inicio, 
        final, 
        empresaLogada
    } = params;

    return new Promise(async (resolve, reject) => {

		let sql = `
                select sum(MOVIMENTOS_TOTAL) as FATURAMENTO from MOVIMENTOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada}
                and MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}0003 and OPERACOES_ACAO = 'VN'
                and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D'
                and MOVIMENTOS_EMISSAO between '${inicio}' and '${final}'`

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