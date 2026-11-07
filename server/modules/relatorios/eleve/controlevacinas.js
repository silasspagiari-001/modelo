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
        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);

console.log('dados[0]: ', dados[0])

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
                        table: { //  DT [PROD ] LAB  NF LOT  [CRIADOR ] MUN  UF DOS SLD 
                            widths: [40, 60, 50, 40, 30, 30, 30, 30, 30, 40, 12, 25, 25],
                            headerRows: 5,
                            body: [
                                [
                                    {
                                        image: `${appRoot}/resources/images/headers/brasao_sp.png`,
                                        width: 50,  //80
                                        height: 56, //90
                                        border: [false,false,false,false]
                                    },
                                    {
                                        text: `GOVERNO DO ESTADO DE SÃO PAULO
                                            SECRETARIA DE AGRICULTURA E ABASTECIMENTO
                                            COORDENADORIA DE DEFESA AGROPECUÁRIA`,
                                        alignment: 'center',
                                        bold: true,
                                        fontSize: 13,
                                        colSpan: 10,
                                        border: [false,false,false,false]
                                    },{},{},{},{},{},{},{},{},{},
                                    {
                                        image: `${appRoot}/resources/images/headers/defesa_agropecuaria.png`,
                                        width: 50,
                                        height: 56,
                                        alignment: 'left',
                                        colSpan: 2,
                                        border: [false,false,false,false]
                                    },{}
                                ],
                                [
                                    {
                                        text: 'FICHA DE CONTROLE DE RECEBIMENTO E VENDAS DE PRODUTOS VETERINÁRIOS\n\n',
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
                                ],
                                [
                                    {
                                        text: 'Estabelecimento: ' + dados[0]['EMPRESAS_NOME'],
                                        colSpan: 13,
                                        border: [false,false,false,false]
                                    },{},{},{},{},{},{},{},{},{},{},{},{}
                                ],
                                [
                                    {
                                        text: 'Vendedor: LOJA',
                                        style: 'tableExample',
                                        colSpan: 3,
                                        border: [false,false,false,false]
                                    },{},{},
                                    {
                                        text: 'Endereço',
                                        style: 'tableExample',
                                        border: [false,false,false,false]
                                    },
                                    {
                                        text: dados[0]['EMPRESAS_ENDERECO'],
                                        style: 'tableExample',
                                        border: [false,false,false,false],
                                        colSpan: 9
                                    },{},{},{},{},{},{},{},{}
                                ],
                                [
                                    {
                                        text: 'Município',
                                        style: 'tableExample',
                                        border: [false,false,false,false]
                                    },
                                    {
                                        text: dados[0]['CIDADES_NOME'],
                                        style: 'tableExample',
                                        border: [false,false,false,false],
                                        colSpan: 8
                                    },{},{},{},{},{},{},{},
                                    {
                                        text: `De ${moment(params.inicio).format('DD/MM/YYYY')} até ${moment(params.final).format('DD/MM/YYYY')}`,
                                        style: 'tableExample',
                                        border: [false,false,false,false],
                                        colSpan: 4
                                    },{},{},{}
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
            
// Entradas
            rows.push([
                {
                    text: 'RECEBIMENTOS: ',                    
                    alignment: 'center',
                    fontSize: 13,
                    bold: true,
                    colSpan: 13,
                    border: [false, false, false, true]                    
                },{},{},{},{},{},{},{},{},{},{},{},{}
            ],
            [
                {
                    text: 'Data',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Produto',
                    colSpan: 2,
                    fontSize: 6,
                    alignment: 'center'
                },{},
                {
                    text: 'Laboratório',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Nº da Partida',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Nº de doses',
                    fontSize: 6,       
                    alignment: 'center'                                                                        
                },
                {
                    text: 'Nº da Fatura',
                    alignment: 'center',
                    fontSize: 6
                },
                {
                    text: 'Data do\nVencimento',
                    fontSize: 6,
                    alignment: 'center',
                    colSpan: 2                              
                },{},
                {
                    text: 'Saldo Anterior',
                    fontSize: 6,
                    alignment: 'center',
                    colSpan: 2
                },{},
                {
                    text: 'Saldo Atual',
                    fontSize: 6,
                    alignment: 'center',
                    colSpan: 2
                },{}
            ])

            for(let i in dados){

                if(dados[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) != '0005') {  // Só entradas
                    continue;
                }

                rows.push([
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6
                    },                            
                    {
                        text: dados[i]['PRODUTOS_NOME'].slice(0, 32),
                        colSpan: 2,
                        alignment: 'left',
                        fontSize: 6
                    },{},
                    {
                        text: dados[i]['PRODUTOS_FABRICA'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['LOTES_REFERENCIA'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['DOSES_QUANTIDADE'].toFixed(0),
                        alignment: 'center',
                        fontSize: 6                                
                    },  
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: moment(dados[i]['LOTES_VALIDADE']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6,
                        colSpan: 2
                    },{},
                    {
                        text: '0', // Saldo Anterior
                        alignment: 'right',
                        fontSize: 6,
                        colSpan: 2                            
                    },{},
                    {
                        text: dados[i]['DOSES_QUANTIDADE'].toFixed(0), // Saldo atual
                        alignment: 'right',
                        fontSize: 6,
                        colSpan: 2                               
                    },{}
                ]);
            }

            // Saidas

            rows.push([
                {
                    text: 'VENDAS: ',                    
                    alignment: 'center',
                    fontSize: 13,
                    bold: true,
                    colSpan: 13,
                    border: [false, false, false, false]                    
                },{},{},{},{},{},{},{},{},{},{},{},{}
            ],
            [
                {
                    text: 'Data',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Produto',
                    colSpan: 2,
                    fontSize: 6,
                    alignment: 'center'
                },{},
                {
                    text: 'Laboratório',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Nota Fiscal',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'N° da\nPartida',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Criador',
                    fontSize: 6,       
                    alignment: 'center',                                                                         
                    colSpan: 3
                },{},{},
                {
                    text: 'Município',
                    fontSize: 6
                },
                {
                    text: 'UF',
                    fontSize: 6,
                    alignment: 'center'                              
                },
                {
                    text: 'N° de\nDoses',
                    fontSize: 6,
                    alignment: 'center'
                },
                {
                    text: 'Saldo',
                    fontSize: 6,
                    alignment: 'center'
                }
            ])

            for(let i in dados){

                if(dados[i]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) != '0003') {  // Só saídas
                    continue;
                }

                rows.push([
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 6
                    },                            
                    {
                        text: dados[i]['PRODUTOS_NOME'].slice(0, 32),
                        colSpan: 2,
                        alignment: 'left',
                        fontSize: 6
                    },{},
                    {
                        text: dados[i]['PRODUTOS_FABRICA'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['LOTES_REFERENCIA'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['PESSOAS_NOME'].slice(0, 25),
                        colSpan: 3,
                        fontSize: 6                                
                    },{},{},          
                    {
                        text: dados[i]['CIDADES_NOME'].slice(0, 9),
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['CIDADES_ESTADO'],
                        alignment: 'center',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        fontSize: 6                                
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        fontSize: 6                                
                    }
                ]);
            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {
    const sql = `execute block returns(
        MOVIMENTOS_NUMERO integer,
        MOVIMENTOS_SERIE char(3),
        MOVIMENTOS_EMISSAO date,
        MOVIMENTOS_ID_DOCUMENTOS integer,
        MOVIMENTOS_ID_PESSOAS integer,
        PESSOAS_NOME varchar(50),
        MOVIMENTOS_ID_PROPRIEDADES integer,
        PROPRIEDADES_NOME varchar(50),
        PRODUTOS_ID integer,
        PRODUTOS_NOME varchar(100),
        PRODUTOS_UNIDADE varchar(3),
        PRODUTOS_FABRICA varchar(15),
        PRODUTOS_EMBALAGEM numeric(12,3),
        MOVIMENTOSITENS_QUANTIDADE numeric(12,3),
        DOSES_QUANTIDADE numeric(12,3),
        MOVIMENTOSITENS_TOTAL numeric(12,2),
        LOTES_REFERENCIA   VARCHAR(20),
        LOTES_NOME         VARCHAR(100),
        LOTES_LOCALIZACAO  VARCHAR(15),
        LOTES_EMISSAO      DATE,
        LOTES_FABRICACAO   DATE,
        LOTES_VALIDADE     DATE,
        LOTES_QUANTIDADE   NUMERIC(12,3),
        EMPRESAS_NOME      VARCHAR(100),
        EMPRESAS_ENDERECO  VARCHAR(100),
        CIDADES_NOME       VARCHAR(100),
        CIDADES_ESTADO     VARCHAR(2),
        USUARIOS_NOME      VARCHAR(100)
    ) as
    begin
        for
            select MOVIMENTOS_NUMERO, 
                   MOVIMENTOS_SERIE,
                   MOVIMENTOS_EMISSAO,
                   MOVIMENTOS_ID_DOCUMENTOS,
                   MOVIMENTOS_ID_PESSOAS,
                   MOVIMENTOS_NOME,
                   MOVIMENTOS_ID_PROPRIEDADES,
                   PROPRIEDADES_NOME, 
                   PRODUTOS_ID,
                   PRODUTOS_NOME,
                   PRODUTOS_UNIDADE,
                   PRODUTOS_FABRICA,
                   PRODUTOS_EMBALAGEM,                   
                   MOVIMENTOSITENS_QUANTIDADE,
                   (MOVIMENTOSITENS_QUANTIDADE * PRODUTOS_EMBALAGEM) as DOSES_QUANTIDADE,
                   MOVIMENTOSITENS_TOTAL,
                   LOTES_REFERENCIA,
                   LOTES_NOME,
                   LOTES_LOCALIZACAO,
                   LOTES_EMISSAO,
                   LOTES_FABRICACAO,
                   LOTES_VALIDADE,
                   LOTES_QUANTIDADE,
                   EMPRESAS_NOME,
                   EMPRESAS_ENDERECO,
                   CIDADES_NOME,
                   CIDADES_ESTADO,
                   USUARIOS_NOME
            from MOVIMENTOSITENS
            join MOVIMENTOS   on MOVIMENTOS_ID   = MOVIMENTOSITENS_ID_MOVIMENTOS
            join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
            join PESSOAS      on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
            join PRODUTOS     on PRODUTOS_ID     = MOVIMENTOSITENS_ID_PRODUTOS
            join LOTES        on LOTES_ID        = MOVIMENTOSITENS_ID_LOTES
            join EMPRESAS     on EMPRESAS_ID     = MOVIMENTOS_ID_EMPRESAS
            join CIDADES      on CIDADES_ID      = EMPRESAS_ID_CIDADES
            join USUARIOS     on USUARIOS_ID     = MOVIMENTOS_ID_USUARIOS
            where MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                  ((MOVIMENTOS_ID_DOCUMENTOS = 10003) or (MOVIMENTOS_ID_DOCUMENTOS = 10005)) and
                  MOVIMENTOSITENS_ID_PRODUTOS between  ${params.produtoinicial} and ${params.produtofinal} and
                  MOVIMENTOSITENS_ID_LOTES between ${params.loteinicial} and ${params.lotefinal} and
                  MOVIMENTOS_EMISSAO between '${params.inicio}' and '${params.final}' and
                  PRODUTOS_DERIVADO = 'V'
            order by MOVIMENTOS_ID_EMPRESAS,
                     MOVIMENTOS_NUMERO,
                     MOVIMENTOS_SERIE,
                     MOVIMENTOS_EMISSAO
            into
                :MOVIMENTOS_NUMERO,
                :MOVIMENTOS_SERIE,
                :MOVIMENTOS_EMISSAO,
                :MOVIMENTOS_ID_DOCUMENTOS,
                :MOVIMENTOS_ID_PESSOAS,
                :PESSOAS_NOME,
                :MOVIMENTOS_ID_PROPRIEDADES,
                :PROPRIEDADES_NOME, 
                :PRODUTOS_ID,
                :PRODUTOS_NOME,
                :PRODUTOS_UNIDADE,
                :PRODUTOS_FABRICA,
                :PRODUTOS_EMBALAGEM,                
                :MOVIMENTOSITENS_QUANTIDADE,
                :DOSES_QUANTIDADE,
                :MOVIMENTOSITENS_TOTAL,
                :LOTES_REFERENCIA,
                :LOTES_NOME,
                :LOTES_LOCALIZACAO,
                :LOTES_EMISSAO,
                :LOTES_FABRICACAO,
                :LOTES_VALIDADE,
                :LOTES_QUANTIDADE,
                :EMPRESAS_NOME,
                :EMPRESAS_ENDERECO,
                :CIDADES_NOME,
                :CIDADES_ESTADO,
                :USUARIOS_NOME
        do
            begin 
                MOVIMENTOS_ID_PROPRIEDADES = coalesce(MOVIMENTOS_ID_PROPRIEDADES,0);
                suspend;
            end
    end`;

console.log('sql: ', sql);

    return await samosFB.executeSQL(sql, params);
}