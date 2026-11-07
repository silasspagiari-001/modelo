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
                                    text: `Inventario de Produtos em ${moment(params.inicio).format('DD/MM/YYYY')} - ${(
                                        params.preco == 0 ? 'Preço de Custo\n'  : 
                                        params.preco == 1 ? 'Preço de Compra\n' : 
                                        params.preco == 2 ? 'Preço de Venda\n' : 
                                        'Custo Médio\n')}`,
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
                {columns: [{},{},{},{},{},{},{}]},
                {
                    style: 'tableExample',
                    table: {   //COD NOM UNI SLD PRC TOT
                        widths: [30, '*', 15, 40, 55, /*50,*/ 50],
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
                                    text: 'Qtde',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Unitário',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Total',
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

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);

            let rows = docDefinition.content[1].table.body;
            
            let totalGeral = 0;
            let totalGrupo = 0;

            for(let i in dados){
                const total = (
                    params.preco == 0 ? dados[i]['SALDOS_CUSTO'] :
                    params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                    params.preco == 2 ? dados[i]['SALDOS_PRECO'] :
                    params.preco == 3 ? dados[i]['SALDOS_RESERVADO'] : 0
                ) * dados[i]['SALDOS_QUANTIDADE'];

                totalGeral += total;
                totalGrupo += total;

                if(!dados[parseInt(i) - 1] || dados[parseInt(i) - 1]['PRODUTOS_ID_GRUPOS'] != dados[i]['PRODUTOS_ID_GRUPOS']) {
					rows.push([
                        {
                            text: `***GRUPO: ${dados[i]['PRODUTOS_ID_GRUPOS']} - ${dados[i]['GRUPOS_NOME']}***`,
                            alignment: 'center',
                            style: 'tableExample',
                            bold: true,
                            colSpan: 6,
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
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
                        text: dados[i]['PRODUTOS_NOME'] ,
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
                        text: dados[i]['SALDOS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(
                            params.preco == 0 ? dados[i]['SALDOS_CUSTO'] :
                            params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                            params.preco == 2 ? dados[i]['SALDOS_PRECO']  :
                            params.preco == 3 ? dados[i]['SALDOS_RESERVADO']  : 0
                        ),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(total),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    }
                ]);

                if(!dados[parseInt(i) + 1] || dados[parseInt(i) + 1]['GRUPOS_NOME'] != dados[i]['GRUPOS_NOME']) {
                    rows.push([
                        {
                            text: '',
                            alignment: 'left',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },
                        {
                            text: `TOTAL GRUPO: ${dados[i]['GRUPOS_NOME']}`,
                            alignment: 'right',
                            style: 'tableExample',
                            bold: true,
                            colSpan: 4,
                            border: [false, false, false, false]
                        },{},{},{},
                        {
                            text: utils.number.float2moeda(totalGrupo),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        }
                    ]);
                    

					rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    totalGrupo = 0;
                }
            }

            rows.push([
                {
                    text: '',
                    alignment: 'left',
                    style: 'tableExample',
                    colSpan: 3,
                    border: [false, false, false, false]
                },{},{},
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    colSpan: 2,
                    border: [false, false, false, false]
                },{},
                {
                    text: utils.number.float2moeda(totalGeral),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {
    const sql = `execute block returns(
        PRODUTOS_ID          integer,    
        PRODUTOS_NOME        varchar(100),
        PRODUTOS_UNIDADE     varchar(03),
        PRODUTOS_ID_GRUPOS   integer,    
        GRUPOS_NOME          varchar(50),  
        SALDOS_QUANTIDADE    numeric(12,3),
        SALDOS_CUSTO         numeric(12,2),
        SALDOS_COMPRA        numeric(12,2),
        SALDOS_PRECO         numeric(12,2),
        SALDOS_RESERVADO     numeric(12,2),
        SALDOS_TRANSFERENCIA numeric(12,2))        
    as                                                    
    declare variable V_SALDO         numeric(12,3);       
    declare variable V_SITUACAO      char(1);       
    declare variable V_PRODUTO       varchar(10);         
    declare variable V_ESTOQUE       varchar(1);          
    declare variable V_QUANTIDADE    numeric(12,3);       
    declare variable V_TOTAL         numeric(12,2);           
    declare variable V_CUSTOATUAL    numeric(12,2);
    declare variable V_CUSTOANTERIOR numeric(12,2);
    declare variable V_EMISSAO       date;
    declare variable V_ENTRADASAIDA  date;
    begin                                                 
    for
    select                                            
        PRODUTOS_ID,      
        PRODUTOS_NOME,                                  
        PRODUTOS_UNIDADE, 
        PRODUTOS_ID_GRUPOS,                                                                    
        GRUPOS_NOME,
        SALDOS_CUSTO,                                   
        SALDOS_COMPRA,                                  
        SALDOS_PRECO,
        SALDOS_RESERVADO,
        SALDOS_TRANSFERENCIA
    from PRODUTOS                                     
    join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS     
    join SALDOS on SALDOS_ID_EMPRESAS = '${params.empresaLogada}' and SALDOS_ID_PRODUTOS = PRODUTOS_ID
    where PRODUTOS_INVENTARIO = 'T' and
          PRODUTOS_ID_GRUPOS between ${params.grupoinicial || 0} and ${params.grupofinal || 99999}
          order by PRODUTOS_ID_GRUPOS, PRODUTOS_NOME                            
    into                                              
        :PRODUTOS_ID,            
        :PRODUTOS_NOME,                                 
        :PRODUTOS_UNIDADE,                              
        :PRODUTOS_ID_GRUPOS,                       
        :GRUPOS_NOME,                                   
        :SALDOS_CUSTO,                                  
        :SALDOS_COMPRA,                                 
        :SALDOS_PRECO,                                   
        :SALDOS_RESERVADO,
        :SALDOS_TRANSFERENCIA
    do                                                
    begin
        V_SALDO = 0;
        for
            select MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, OPERACOES_ESTOQUE, sum(MOVIMENTOSITENS_QUANTIDADE)
            from MOVIMENTOSITENS
            left outer join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
            left outer join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
            left outer join SALDOS     on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
            where MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID and
                MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                OPERACOES_ESTOQUE <> 'N'
            group by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
            order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
            into :V_EMISSAO, :V_ENTRADASAIDA, :V_ESTOQUE,:V_QUANTIDADE
        do
            begin
                if ((V_EMISSAO <= '${params.inicio}') and (V_ENTRADASAIDA <= '${params.inicio}')) then
                    begin
                        if (V_ESTOQUE = 'C') then
                            V_SALDO = V_SALDO + :V_QUANTIDADE;
                        else if (V_ESTOQUE = 'D') then
                            V_SALDO = V_SALDO - :V_QUANTIDADE;
                    end
            end
        
        if (V_SALDO > 0) then
            begin
              SALDOS_QUANTIDADE = V_SALDO;
              suspend;  
            end
        end
    end`;

    const results = await samosFB.executeSQL(sql, params);

    return results;
}