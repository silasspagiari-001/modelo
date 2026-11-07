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
            let [ano, mes] = params.inicio.split('-');
            let mesAno = `${mes}/${ano}`;

            const db = await samosFB.conectarBanco(params.client); 
            const res = await obterDados(db, params);
            const slsAtn = await obterAnterior(db, params);

            let docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {   //[B]  UF CFO ICM VLN BIC VIC ISE OUT  [B]
                            widths:  [50, 50, 50, 60, 60, 60, 60, 60, 50],  // 9 Cols.
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
                        margin: [15, 10]  // 10, 10
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

            let rows = docDefinition.content[1].table.body;
            let pathLogo;
            let ImprimeEntfora = 0;
            let ImprimeSaiestado = 0;
            let ImprimeSaiforaestado = 0;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }					

            rows.push(		
                [
                    { image: pathLogo, width: 80, fontSize: 10, alignment: 'left', border: [false, false, false, false] },
                    { text: 'Apuração de ICMS', colSpan: 8, fontSize: 14, alignment: 'center', border: [false, false, false, false] },{},{},{},{},{},{},
                    { text: moment.tz(params.timezone).format('DD/MM/YYYY'), fontSize: 8, alignment: 'right', border: [false, false, false, false] }
                ],
                [
                    { text: '', alignment: 'left', border: [false, false, false, false] },
                    { text: 'Referência: ' + mesAno, colSpan: 8, alignment: 'center', border: [false, false, false, false] },{},{},{},{},{},{},
                    { text: moment.tz(params.timezone).format('HH:mm:ss'), alignment: 'right', border: [false, false, false, false] }
                ],												
                [
                    { text: 'a',    style: 'tableHeader', color: 'white', border: [false, false, false, false] },
                    { text: 'CFOP', style: 'tableHeader', alignment: 'center', },
                    { text: 'Valor Contábil', style: 'tableHeader', alignment: 'center' },								
                    { text: 'Base do ICMS',   style: 'tableHeader', alignment: 'center' },								
                    { text: 'Valor do ICMS',  style: 'tableHeader', alignment: 'center' },
                    { text: 'Valor Isento',   style: 'tableHeader', alignment: 'center' },
                    { text: 'Valor Outras',   style: 'tableHeader', alignment: 'center' },
                    { text: 'Retido ST', style: 'tableHeader', alignment: 'center' },
                    { text: 'a',    style: 'tableHeader', color: 'white', border: [false, false, false, false] }
                ],
                [
                    { text: '', alignment: 'left',colSpan: 9, border: [false, false, false, false] },{},{},{},{},{},{},{},{}
                ],
                [
                    { text: '', alignment: 'left', border: [false, false, false, false] },
                    { text: '100 - ENTRADAS E/OU AQUISICAO DE SERVICOS NO ESTADO',fontSize: 10, colSpan: 8, alignment: 'left', border: [false, false, false, false] },{},{},{},{},{},{},
                    { text: moment.tz(params.timezone).format('HH:mm:ss'), alignment: 'right', border: [false, false, false, false] }
                ],


            );

            let SubentContabil100  = 0;
            let SubentBaseIcms100  = 0;
            let SubentValorIcms100 = 0;
            let SubentIsento100    = 0;
            let SubentOutras100    = 0;					
            let SubentRetsub100    = 0;					

            let SubentContabil200  = 0;
            let SubentBaseIcms200  = 0;
            let SubentValorIcms200 = 0;
            let SubentIsento200    = 0;
            let SubentOutras200    = 0;					
            let SubentRetsub200    = 0;					

            let SubsaiContabil500  = 0;
            let SubsaiBaseIcms500  = 0;
            let SubsaiValorIcms500 = 0;
            let SubsaiIsento500    = 0;
            let SubsaiOutras500    = 0;					
            let SubsaiRetsub500    = 0;					

            let SubsaiContabil600  = 0;
            let SubsaiBaseIcms600  = 0;
            let SubsaiValorIcms600 = 0;
            let SubsaiIsento600    = 0;
            let SubsaiOutras600    = 0;					
            let SubsaiRetsub600    = 0;					

            let entContabil  = 0;
            let entBaseIcms  = 0;
            let entValorIcms = 0;
            let entIsento    = 0;
            let entOutras    = 0;					
            let entRetsub    = 0;					

            let saiContabil  = 0;
            let saiBaseIcms  = 0;
            let saiValorIcms = 0;
            let saiIsento    = 0;
            let saiOutras    = 0;
            let saiRetsub    = 0;					

            for(let i in res){

                if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  > 1999 && ImprimeEntfora == 0) {

                    rows.push([
                        { text: '', style: 'tableExample', border: [false, false, false, false] },
                        { text: 'SUB TOTAL', style: 'tableExample', alignment: 'right', fontSize: 6, border: [false, false, false, false], },
                        { text: utils.number.float2moeda(SubentContabil100 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubentBaseIcms100 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentValorIcms100 / 100),alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubentIsento100 / 100), style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentOutras100 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentRetsub100 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: '', style: 'tableExample', border: [false, false, false, false] }
                    ]);
                    ImprimeEntfora = 1,
                    rows.push(		
                        [
                            { text: '', alignment: 'left',colSpan: 9, border: [false, false, false, false] },{},{},{},{},{},{},{},{}
                        ],
                        [
                            { text: '', alignment: 'left', border: [false, false, false, false] },
                            { text: '200 - ENTRADAS E/OU AQUISICAO DE SERVICOS FORA DO ESTADO',fontSize: 10, colSpan: 8, alignment: 'left', border: [false, false, false, false] },{},{},{},{},{},{},
                            { text: moment.tz(params.timezone).format('HH:mm:ss'), alignment: 'right', border: [false, false, false, false] }
                        ],
                    );                   
                }

                if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  > 4999 && ImprimeSaiestado == 0) {
                    rows.push([
                        { text: '', style: 'tableExample', border: [false, false, false, false] },
                        { text: 'SUB TOTAL', style: 'tableExample', alignment: 'right', fontSize: 6, border: [false, false, false, false], },
                        { text: utils.number.float2moeda(SubentContabil200 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubentBaseIcms200 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentValorIcms200 / 100),alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubentIsento200 / 100), style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentOutras200 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubentRetsub200 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: '', style: 'tableExample', border: [false, false, false, false] }
                    ]);

                    ImprimeSaiestado = 1,
                    rows.push(		
                        [
                            { text: '', alignment: 'left',colSpan: 9, border: [false, false, false, false] },{},{},{},{},{},{},{},{}
                        ],
                        [
                            { text: '', alignment: 'left', border: [false, false, false, false] },
                            { text: '500 - SAIDAS E/OU AQUISICAO DE SERVICOS NO ESTADO',fontSize: 10, colSpan: 8, alignment: 'left', border: [false, false, false, false] },{},{},{},{},{},{},
                            { text: moment.tz(params.timezone).format('HH:mm:ss'), alignment: 'right', border: [false, false, false, false] }
                        ],
                    );                   
                }

                if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  > 5999 && ImprimeSaiforaestado == 0) {

                    rows.push([
                        { text: '', style: 'tableExample', border: [false, false, false, false] },
                        { text: 'SUB TOTAL', style: 'tableExample', alignment: 'right', fontSize: 6, border: [false, false, false, false], },
                        { text: utils.number.float2moeda(SubsaiContabil500 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubsaiBaseIcms500 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubsaiValorIcms500 / 100),alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },							
                        { text: utils.number.float2moeda(SubsaiIsento500 / 100), style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubsaiOutras500 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: utils.number.float2moeda(SubsaiRetsub500 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                        { text: '', style: 'tableExample', border: [false, false, false, false] }
                    ]);


                    ImprimeSaiforaestado = 1,
                    rows.push(		
                        [
                            { text: '', alignment: 'left',colSpan: 9, border: [false, false, false, false] },{},{},{},{},{},{},{},{}
                        ],
                        [
                            { text: '', alignment: 'left', border: [false, false, false, false] },
                            { text: '600 - SAIDAS E/OU AQUISICAO DE SERVICOS FORA DO ESTADO',fontSize: 10, colSpan: 8, alignment: 'left', border: [false, false, false, false] },{},{},{},{},{},{},
                            { text: moment.tz(params.timezone).format('HH:mm:ss'), alignment: 'right', border: [false, false, false, false] }
                        ],
                    );                   
                }

                rows.push([
                    {
                        text: '',
                        style: 'tableExample',
                        border: [false, false, false, false]								
                    },
                    {
                        text: (res[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 1000).toFixed(3),
                        alignment: 'right',
                        bold: true,									
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_TOTAL']),
                        alignment: 'right',
                        bold: true,									
                        style: 'tableExample'
                    },							
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_BASEICMS']),
                        alignment: 'right',
                        bold: true,									
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_VALORICMS']),
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_ISENTAS']), // Isentas
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_ISENTAS'] - res[i]['MOVIMENTOS_VALORST']), // Outras
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(res[i]['MOVIMENTOS_VALORST']), // Outras
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: '',
                        style: 'tableExample',
                        border: [false, false, false, false]								
                    },


                ]);

                
                if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  > 5000) {

                    saiContabil  += cents(res[i]['MOVIMENTOS_TOTAL']);
                    saiBaseIcms  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                    saiValorIcms += cents(res[i]['MOVIMENTOS_VALORICMS']);
                    saiIsento    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                    saiOutras    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST'] - res[i]['MOVIMENTOS_ISENTAS']);
                    saiRetsub    += cents(res[i]['MOVIMENTOS_VALORST']);

                    if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  < 6000) {
                        SubsaiContabil500  += cents(res[i]['MOVIMENTOS_TOTAL']);
                        SubsaiBaseIcms500  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                        SubsaiValorIcms500 += cents(res[i]['MOVIMENTOS_VALORICMS']);
                        SubsaiIsento500    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                        SubsaiOutras500    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST'] - res[i]['MOVIMENTOS_ISENTAS'] );
                        SubsaiRetsub500    += cents(res[i]['MOVIMENTOS_VALORST']);
                    } else {
                        SubsaiContabil600  += cents(res[i]['MOVIMENTOS_TOTAL']);
                        SubsaiBaseIcms600  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                        SubsaiValorIcms600 += cents(res[i]['MOVIMENTOS_VALORICMS']);
                        SubsaiIsento600    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                        SubsaiOutras600    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST']- res[i]['MOVIMENTOS_ISENTAS'] );
                        SubsaiRetsub600    += cents(res[i]['MOVIMENTOS_VALORST']);
                    };

                } else {
                    entContabil  += cents(res[i]['MOVIMENTOS_TOTAL']);
                    entBaseIcms  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                    entValorIcms += cents(res[i]['MOVIMENTOS_VALORICMS']);
                    entIsento    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                    entOutras    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST']- res[i]['MOVIMENTOS_ISENTAS'] );
                    entRetsub    += cents(res[i]['MOVIMENTOS_VALORST']);

                    if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  < 2000) {
                        SubentContabil100  += cents(res[i]['MOVIMENTOS_TOTAL']);
                        SubentBaseIcms100  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                        SubentValorIcms100 += cents(res[i]['MOVIMENTOS_VALORICMS']);
                        SubentIsento100    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                        SubentOutras100    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST']- res[i]['MOVIMENTOS_ISENTAS'] );
                        SubentRetsub100    += cents(res[i]['MOVIMENTOS_VALORST']);
                    } else {
                        if(res[i]['MOVIMENTOSITENS_ID_OPERACOES']  < 5000) {
                            SubentContabil200  += cents(res[i]['MOVIMENTOS_TOTAL']);
                            SubentBaseIcms200  += cents(res[i]['MOVIMENTOS_BASEICMS']);
                            SubentValorIcms200 += cents(res[i]['MOVIMENTOS_VALORICMS']);
                            SubentIsento200    += cents(res[i]['MOVIMENTOS_ISENTAS']);
                            SubentOutras200    += cents(res[i]['MOVIMENTOS_TOTAL'] - res[i]['MOVIMENTOS_BASEICMS'] - res[i]['MOVIMENTOS_VALORST']- res[i]['MOVIMENTOS_ISENTAS'] );
                            SubentRetsub200    += cents(res[i]['MOVIMENTOS_VALORST']);
                        } 
                    }


                }
                    
            }	

            rows.push([
                { text: '', style: 'tableExample', border: [false, false, false, false] },
                { text: 'SUB TOTAL', style: 'tableExample', alignment: 'right', fontSize: 6, border: [false, false, false, false], },
                { text: utils.number.float2moeda(SubsaiContabil600 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },							
                { text: utils.number.float2moeda(SubsaiBaseIcms600 / 100), alignment: 'right', bold: true, style: 'tableExample',border: [false, false, false, false]  },
                { text: utils.number.float2moeda(SubsaiValorIcms600 / 100),alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },							
                { text: utils.number.float2moeda(SubsaiIsento600 / 100), style: 'tableExample',border: [false, false, false, false]  },
                { text: utils.number.float2moeda(SubsaiOutras600 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                { text: utils.number.float2moeda(SubsaiRetsub600 / 100), alignment: 'right', style: 'tableExample',border: [false, false, false, false]  },
                { text: '', style: 'tableExample', border: [false, false, false, false] }
            ]);


            // TOTALIZADORES
            rows.push([
                {
                    text: 'A',
                    style: 'tableExample',
                    color: 'white',
                    fontSize: 10,
                    colSpan: 9,
                    border: [false, false, false, false]
                },{},{},{},{},{},{},{},{}
            ]);


            // SALDO ANTERIOR
            rows.push([
                {
                    text: 'SALDO ANTERIOR',
                    style: 'tableExample',
                    alignment: 'right',
                    border: [false, false, false, false],
                    colSpan: 4
                },{},{},{},
                {
                    text: utils.number.float2moeda(slsAtn[0]['CREDITOS_VALOR']),
                    alignment: 'right',
                    style: 'tableExample'
                },							
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                },
                                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                }

            ]);

            rows.push([
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                },
                {
                    text: 'TOTAL ENTRADAS',
                    style: 'tableExample',
                    alignment: 'right',
                    fontSize: 6,
                    border: [false, false, false, false],
                },
                {
                    text: utils.number.float2moeda(entContabil / 100),
                    alignment: 'right',
                    bold: true,									
                    style: 'tableExample'
                },							
                {
                    text: utils.number.float2moeda(entBaseIcms / 100),
                    alignment: 'right',
                    bold: true,									
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(entValorIcms / 100),
                    alignment: 'right',
                    style: 'tableExample'
                },							
                {
                    text: utils.number.float2moeda(entIsento / 100), // Isentas
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(entOutras / 100), // Outras
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(entRetsub / 100), // Outras
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                }

            ]);
            rows.push([
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                },
                {
                    text: 'TOTAL SAIDAS',
                    style: 'tableExample',
                    alignment: 'right',
                    border: [false, false, false, false],
                },
                {
                    text: utils.number.float2moeda(saiContabil / 100),
                    alignment: 'right',
                    bold: true,									
                    style: 'tableExample'
                },							
                {
                    text: utils.number.float2moeda(saiBaseIcms / 100),
                    alignment: 'right',
                    bold: true,									
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(saiValorIcms / 100),
                    alignment: 'right',
                    style: 'tableExample'
                },							
                {
                    text: utils.number.float2moeda(saiIsento / 100), // Isentas
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(saiOutras / 100), // Outras
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(saiRetsub / 100), // Outras
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                }
            ]);

            rows.push([
                {
                    text: 'DIFERENÇA DO ICMS NO MÊS',
                    style: 'tableExample',
                    alignment: 'right',
                    border: [false, false, false, false],
                    colSpan: 4
                },{},{},{},
                {
                    text: utils.number.float2moeda((saiValorIcms - entValorIcms) / 100),
                    alignment: 'right',
                    style: 'tableExample'
                },							
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                },
                                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                }

            ]);

            // SALDO ANTERIOR

            rows.push([
                {
                    text: 'SALDO ATUAL',
                    style: 'tableExample',
                    alignment: 'right',
                    border: [false, false, false, false],
                    colSpan: 4
                },{},{},{},
                {
                    text: utils.number.float2moeda(slsAtn[0]['CREDITOS_VALOR'] + (entValorIcms/100) - ((saiValorIcms / 100))),
                    alignment: 'right',
                    style: 'tableExample'
                },							
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]								
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                },
                                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]					
                }

            ]);


            pdfStream(docDefinition, resolve, reject);

        });
    }
};

const obterDados = async function(db, params) {
        const {empresaLogada, inicio, final} = params;

    let sql = '';
    let sqlEmpresa = '';

    // MOVIMENTOSITENS_IMEDIATA = %COMISSAO
    // MOVIMENTOSITENS_DEPOSITO = PRECO2
    sqlEmpresa = `MOVIMENTOS_ID_EMPRESAS = ${empresaLogada}`                

    sql = `select 
                SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) AS MOVIMENTOSITENS_ID_OPERACOES,
                sum(
                    MOVIMENTOSITENS_TOTAL +
                    MOVIMENTOSITENS_FRETE +
                    MOVIMENTOSITENS_SEGURO +
                    MOVIMENTOSITENS_DESPESAS +
                    MOVIMENTOSITENS_VALORIPI -
                    MOVIMENTOSITENS_DESCONTOS + 
                    MOVIMENTOSITENS_VALORST
                ) as MOVIMENTOS_TOTAL,
                sum(MOVIMENTOSITENS_BASEICMS) as MOVIMENTOS_BASEICMS,
                sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS,
                sum(MOVIMENTOSITENS_VALORST) as MOVIMENTOS_VALORST,
                sum(case when
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '30') or 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '40') or 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '41')
                    then (
                        MOVIMENTOSITENS_TOTAL + 
                        MOVIMENTOSITENS_FRETE + 
                        MOVIMENTOSITENS_SEGURO + 
                        MOVIMENTOSITENS_DESPESAS +
                        MOVIMENTOSITENS_VALORIPI - 
                        MOVIMENTOSITENS_DESCONTOS                         
                    ) ELSE 0 END) MOVIMENTOS_ISENTAS                
            from MOVIMENTOSITENS
            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            where MOVIMENTOS_ID > 0 and
                 ${sqlEmpresa} and 

                  MOVIMENTOS_ID_EMPRESAS = 1  and ((MOVIMENTOS_ID_DOCUMENTOS = 10005) or (MOVIMENTOS_ID_DOCUMENTOS = 10003))  and
                  (
                    MOVIMENTOS_STATUS <> 'C' and
                    MOVIMENTOS_STATUS <> 'D' and
                    MOVIMENTOS_STATUS <> 'R' and
                    MOVIMENTOS_STATUS <> 'V'
                  ) and
                  MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
            group by MOVIMENTOSITENS_ID_OPERACOES
            order by MOVIMENTOSITENS_ID_OPERACOES`;

//                  MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'            

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



const obterAnterior = async function(db, params) {
        const {inicio, final} = params;

    let sql = '';
    let [ano, mes] = inicio.split('-');

    mes = mes -1;

    if (mes == 0) {
        mes = 12;
        ano = ano -1;
    };

    // MOVIMENTOSITENS_IMEDIATA = %COMISSAO
    // MOVIMENTOSITENS_DEPOSITO = PRECO2

sql = `SELECT FIRST 1 CREDITOS_VALOR
FROM CREDITOS
WHERE
    EXTRACT(MONTH FROM CREDITOS_EMISSAO) = ${mes}
    AND EXTRACT(YEAR FROM CREDITOS_EMISSAO) = ${ano}
    AND CREDITOS_ID_PESSOAS = 999999999
UNION ALL
SELECT
    0 AS CREDITO_VALOR
FROM RDB$DATABASE
WHERE NOT EXISTS (
    SELECT 1
    FROM CREDITOS
    WHERE
        EXTRACT(MONTH FROM CREDITOS_EMISSAO) = ${mes}
        AND EXTRACT(YEAR FROM CREDITOS_EMISSAO) = ${ano}
        AND CREDITOS_ID_PESSOAS = 999999999  )`






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