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
            const comDespesas = params.opcao == '1';

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [   // 1  2  3  4  5  6  7  8  9 10
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {  //   1   2   3    4             5                          6             7    8    9    10
                            widths:  [60, 70, '*', '*', (comDespesas ? '*' : 0), (comDespesas ? '*' : 0), '*', '*', '*', '*'],
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
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Fluxo de Caixa Sintético',
                        colSpan: 8,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},
                    {
                        text: '',
                        fontSize: 10,
                        alignment: 'right',
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
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 6,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],												
                [
                    {
                        text: 'Data',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Semana',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    ...(() => {
                        return comDespesas ? [
                            {
                                text: 'Receber',
                                style: 'tableHeader',
                                alignment: 'center'								
                            },
                            {
                                text: 'Pagar',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Diversos',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Corteva',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Prev Receitas Diversas',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Prev Fornec Diversos',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ] : [
                            {
                                text: 'Receber',
                                style: 'tableHeader',
                                alignment: 'center',
                                colSpan: 2								
                            },{},
                            {
                                text: 'Pagar',
                                colSpan: 4,
                                style: 'tableHeader',
                                alignment: 'center'
                            },{},{},{}
                        ];
                    })(),
                    {
                        text: 'Diferença',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Saldo',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let saldo = 0;
            let diferenca = 0;

            for(let i in dados){
                if(
                    (
                        cents(dados[i]['RECEBER']      || 0) +
                        cents(dados[i]['PAGAR']        || 0) + 
                        cents(dados[i]['DIVERSOS']     || 0) + 
                        cents(dados[i]['RECEITAS']     || 0) + 
                        cents(dados[i]['FORNECEDORES'] || 0) + 
                        cents(dados[i]['CORTEVA']      || 0) 
                    ) == 0
                ) {
                    continue;
                }

                diferenca = 0;

                if(comDespesas) {
                    diferenca = cents(dados[i]['RECEITAS'] || 0) +
                                cents(dados[i]['RECEBER']  || 0) - (
                                cents(dados[i]['PAGAR']    || 0) + 
                                cents(dados[i]['DIVERSOS'] || 0) +
                                cents(dados[i]['FORNECEDORES'] || 0) +
                                cents(dados[i]['CORTEVA']  || 0));    
                } else {
                    diferenca = cents(dados[i]['RECEBER']  || 0) - cents(dados[i]['PAGAR'] || 0);
                }

                saldo += diferenca;

                rows.push([
                    {
                        text: moment(dados[i]['DATA']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },							
                    {
                        text: moment(dados[i]['DATA']).format('dddd'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    ...(() => {
                        return comDespesas ? [
                            {
                                text: utils.number.float2moeda(cents(dados[i]['RECEBER']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },							
                            {
                                text: utils.number.float2moeda(cents(dados[i]['PAGAR']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },							
                            {
                                text: utils.number.float2moeda(cents(dados[i]['DIVERSOS']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },							
                            {
                                text: utils.number.float2moeda(cents(dados[i]['CORTEVA']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(cents(dados[i]['RECEITAS']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(cents(dados[i]['FORNECEDORES']) / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            }
                        ] : [
                            {
                                text: utils.number.float2moeda(cents(dados[i]['RECEBER']) / 100),
                                colSpan: 2,
                                style: 'tableExample',
                                alignment: 'right'								
                            },{},
                            {
                                text: utils.number.float2moeda(cents(dados[i]['PAGAR']) / 100),
                                colSpan: 4,
                                style: 'tableExample',
                                alignment: 'right'
                            },{},{},{}
                        ];
                    })(),
                    {
                        text: utils.number.float2moeda(diferenca / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(saldo / 100),
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
    const { inicio, final, empresaLogada } = params;

    return new Promise(async (resolve, reject) => {
		let sql = `execute block returns (
            DATA DATE,
            RECEBER NUMERIC(14,2),
            PAGAR NUMERIC(14,2),
            DIVERSOS NUMERIC(14,2),
            CORTEVA NUMERIC(14,2),
            RECEITAS NUMERIC(14, 2),
            FORNECEDORES NUMERIC(14, 2)
          )
          as
            declare variable V_DATA date;
            declare variable V_RECEBER NUMERIC(14,2);
            declare variable V_PAGAR NUMERIC(14,2);
            declare variable V_DIVERSOS NUMERIC(14,2);
            declare variable V_CORTEVA NUMERIC(14,2);
            declare variable V_RECEITAS NUMERIC(14,2);
            declare variable V_FORNECEDORES NUMERIC(14,2);
          begin
            V_DATA = cast('${inicio}' as date);
            V_RECEBER = 0;
            V_PAGAR = 0;
            V_DIVERSOS = 0;
            V_CORTEVA = 0;
            V_RECEITAS = 0;
            V_FORNECEDORES = 0;
          
            while (V_DATA <= cast('${final}' as date)) do
              begin
                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                  FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                      FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                      FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                      FINANCEIROS_TIPO = 'R' and
                      FINANCEIROS_ID_PESSOAS <> 42690 and
                      FINANCEIROS_STATUS = 'A'
                into
                  :V_RECEBER;
          
                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                  FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                      FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                      FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                      FINANCEIROS_TIPO = 'P' and
                      FINANCEIROS_STATUS = 'A' and
                      ((FINANCEIROS_ID_PESSOAS <> 901920) and (FINANCEIROS_ID_PESSOAS <> 901921) and (FINANCEIROS_ID_PESSOAS <> 42691))
                into
                  :V_PAGAR;
          
                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                  FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                      FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                      FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                      FINANCEIROS_TIPO = 'P' and
                      FINANCEIROS_STATUS = 'A' and
                      FINANCEIROS_ID_PESSOAS = 901920
                into
                  :V_CORTEVA;
          
                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                  FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                      FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                      FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                      FINANCEIROS_TIPO = 'P' and
                      FINANCEIROS_STATUS = 'A' and
                      FINANCEIROS_ID_PESSOAS = 901921
                into
                  :V_DIVERSOS;

                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                  FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                      FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                      FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                      FINANCEIROS_TIPO = 'R' and
                      FINANCEIROS_STATUS = 'A' and
                      FINANCEIROS_ID_PESSOAS = 42690
                into
                  :V_RECEITAS;
  
                select sum(FINANCEIROS_ABERTO) as FINANCEIROS_ABERTO
                from
                    FINANCEIROS
                where FINANCEIROS_ID_EMPRESAS = '${empresaLogada}' and
                        FINANCEIROS_VENCIMENTO between :V_DATA and :V_DATA and
                        FINANCEIROS_ID_PORTADORES between 1 and 999999 and
                        FINANCEIROS_TIPO = 'P' and
                        FINANCEIROS_STATUS = 'A' and
                        FINANCEIROS_ID_PESSOAS = 42691
                into
                    :V_FORNECEDORES;
                              
                DATA         = V_DATA;
                RECEBER      = V_RECEBER;
                PAGAR        = V_PAGAR;
                CORTEVA      = V_CORTEVA;
                DIVERSOS     = V_DIVERSOS;
                RECEITAS     = V_RECEITAS;
                FORNECEDORES = V_FORNECEDORES;
          
                suspend;
                V_DATA = V_DATA + 1;
             end
          end;`

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