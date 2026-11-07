'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

moment.locale('pt_BR');

module.exports = { 
    read: params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [15, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 13 Colunas
                {
                    style: 'tableExample',
                    table: { //   DOC SER EMI EMP CFOP VEN CLI  NOM MUN  UF VIS PRZ OUT
                        widths:   [25, 13, 32, 12, 14, 12, 20, 100, 70, 10, 50, 50, 50],
                        headerRows: 3,
                        body: []
                    }
                }
            ],
            footer: function(page, pages) {
                return { 
                    stack: [ 
                        { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                    ],
                    margin: [25, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 6,
                    margin: [0, 0, 0, 0],
                    border: 0
                },
                tableHeader: {
                    bold: true,
                    fontSize: 6,
                    color: 'black'
                }
            }
        };	

		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			
            let rows            = docDefinition.content[1].table.body;

            let movVista  = 0; 
            let movPrazo  = 0;
            let movOutras = 0;
            let quebra    = params.quebra;  // 0-Sem 1-Com
            let itens     = params.itens;   // 0-Sem 1-Com

            let totalAvista     = 0;
            let totalAprazo     = 0;
            let totalOutras     = 0;
            let totalDevolucoes = 0; 

            let docAnt = '';
            let model;

            let pathLogo;
            let Cabecario = 'Relatorio de Compra/Venda por CFOP';

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 100,
                        height: 22,	
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: Cabecario,
                        colSpan: 9,
                        fontSize: 12,
                        alignment: 'center',
                        color: 'blue',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        fontSize: 8,
                        alignment: 'right',
                        border: [false, false, false, false]								
                    },{}
                ],
                [
                    {							
                        text: ' ',
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Referencia: ' +   moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 9,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],	
            );
            
            rows.push( 
                [
                    {
                        text: 'Numero',
                        style: 'tableHeader',
                        alignment: 'center',
                    },
                    {
                        text: 'Ser',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: params.tipo == 5 ? 'Entrada' : 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emp',
                        style: 'tableHeader',
                        alignment: 'center'
                    },			
                    {
                        text: 'CFOP',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Ven',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: params.tipo == 5 ? 'For' : 'Cli',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: params.tipo == 5 ? 'Nome do Fornecedor' : 'Nome do Cliente',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Município',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'UF',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'A Vista',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'A Prazo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Outras',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            )					

            for(let i in dados){

                model = dados[i]; 

                movVista  = 0;
                movPrazo  = 0;
                movOutras = 0;

                if(itens == 1) {  // Se imprime os itens do movimento

                    if(docAnt != model['MOVIMENTOS_NUMERO']) {
                        if(docAnt) {
                            rows.push([
                                {
                                    text: '- '.repeat(160),
                                    colSpan: 13,
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]											
                                },{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }
                    }    
                }

                if(docAnt != model['MOVIMENTOS_NUMERO']) {
                    if(model['OPERACOES_ACAO'] == 'DC' || model['OPERACOES_ACAO'] == 'DV') { // Devolução de compra ou venda
                        totalDevolucoes += model['MOVIMENTOS_TOTAL'];
                        movOutras = model['MOVIMENTOS_TOTAL'];                                
                    } else {
                        if(model['OPERACOES_ACAO'] != 'VN') { // Se não for venda normal, vai em outras
                            movOutras = model['MOVIMENTOS_TOTAL'];
                        } else {
                            if(model['MOVIMENTOS_ID_PRAZOS'] < 3) {
                                movVista = model['MOVIMENTOS_TOTAL'];
                            } else {
                                if(model['MOVIMENTOS_ID_PRAZOS'] > 9) {
                                    movPrazo = model['MOVIMENTOS_TOTAL'];
                                }
                            }    
                        }    
                    }

                    if(model['MOVIMENTOS_STATUS'].match(/C|D|R/)) { // Canceladas/Denegadas/Recusadas
                        rows.push([
                            {
                                text: model['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_SERIE'],
                                alignment: 'center',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text:  params.tipo == 5 ? moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY') : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_EMPRESAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOSITENS_OPERACOES4'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_USUARIOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PESSOAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: ( model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_NOMEPROPRIEDADE'] : model['CIDADES_NOME']).slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_ESTADOPROPRIEDADE'] : model['CIDADES_ESTADO'],
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: (model['MOVIMENTOS_STATUS'] == 'C' ? '*** CANCELADA ***' :
                                        model['MOVIMENTOS_STATUS'] == 'D' ? '*** DENEGADA ***' : 'RECUSADA'),
                                bold: true,
                                alignment: 'center',
                                colSpan: 3,
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },{},{}
                        ]);	
                    } else {

                        rows.push([
                            {
                                text: model['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_SERIE'],
                                alignment: 'center',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },

                              
                            {
                                text:  params.tipo == 5 ? moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY') : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },


                            {
                                text: model['MOVIMENTOS_ID_EMPRESAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOSITENS_OPERACOES4'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_USUARIOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PESSOAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: ( model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_NOMEPROPRIEDADE'] : model['CIDADES_NOME']).slice(0, 20),
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_ESTADOPROPRIEDADE'] : model['CIDADES_ESTADO'],
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movVista),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movPrazo),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movOutras),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            }
                        ]);	

                        if(itens == 1) {  // Se imprime os itens do movimento)
                            rows.push([
                                {
                                    colSpan: 13,
                                    border: [false, false, false, false, false],
                                    table: {
                                        widths: [30, 30, 150, 60, 80, 80],
                                        body: [
                                            [
                                                {
                                                    text: 'Cfop',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Cód',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}                                                            
                                                },
                                                {
                                                    text: 'Descrição',
                                                    alignment: 'left',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Qtde',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Preço',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Total',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }
                        totalAvista += movVista;
                        totalAprazo += movPrazo;
                        totalOutras += movOutras;

                        // imprime os itens

                    }

                    docAnt = model['MOVIMENTOS_NUMERO'];
                }
                
                if(itens == 1) {  // Se imprime os itens do movimento)                                
                    rows.push([
                        {
                            colSpan: 13,
                            border: [false, false, false, false, false],
                            table: {
                                widths: [30, 30, 150, 60, 80, 80],
                                body: [
                                    [
                                        {
                                            text: model['MOVIMENTOSITENS_ID_OPERACOES'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}                                                            
                                        },
                                        {
                                            text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}                                                            
                                        },
                                        {
                                            text: model['PRODUTOS_NOME'],
                                            alignment: 'left',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: model['MOVIMENTOSITENS_QUANTIDADE'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: utils.number.float2moeda(model['MOVIMENTOSITENS_PRECO']),
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        }
                                    ]
                                ]
                            },
                            layout: 'noBorders'        
                        },{},{},{},{},{},{},{},{},{},{},{},{}
                    ]);
                }

            }

            rows.push([
                {
                    text: 'Totais',
                    colSpan: 10,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},{},{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalAvista),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },
                {
                    text: utils.number.float2moeda(totalAprazo),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },
                {
                    text: utils.number.float2moeda(totalOutras),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                }
            ]);						

            rows.push([
                {
                    text: 'Liquido:',
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: utils.number.float2moeda(totalAvista + totalAprazo),
                    colSpan: 2,
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: 'Devoluções:',
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: utils.number.float2moeda(totalDevolucoes),
                    colSpan: 2,
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: '',
                    colSpan: 5,
                    border: [false, false, false, false]
                },{},{},{},{}
            ]);						


			pdfStream(docDefinition, resolve, reject);
			db.detach();					
        });
    }
};

const obterDados = function(db, params) {
    let { 
        empresa,
        pessoa,
        inicio,
        final,
        quebra,
        cfopa,
        itens,
        cfopb
    } = params;

    return new Promise(async (resolve, reject) => {
        let sqlWhere = '';
        let sqlSearch = '';
        let SqlOrder  = '';
        let sqlTipo = '';
        let filtrarCan = '';
        let sqlPeriodo = '';

        cfopa = cfopa ? cfopa : '';
        cfopb = cfopb ? cfopb : '';
        pessoa = pessoa ? pessoa : 0;

        filtrarCan = ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' `;

        if (cfopa != '') {
           sqlWhere += `and ((SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) = '${cfopa}') `;
          if (cfopb != '') {
             sqlWhere += ` or (SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) = '${cfopb}')) `;
          } else 
            {sqlWhere += `)` }
        }

        if (pessoa > 0) {
          sqlWhere += `and MOVIMENTOS_ID_PESSOAS = ${pessoa} `;
        }

        SqlOrder = `ORDER BY MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`

       sqlTipo = `((MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3)) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5)))`;// Notas

        if(empresa > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
        }

        sqlPeriodo += ` MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `

        sqlSearch = `select MOVIMENTOS_ID,
        SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) AS MOVIMENTOSITENS_OPERACOES4 ,
                            MOVIMENTOS_ID_DOCUMENTOS,
                            DOCUMENTOS_NOME,
                            MOVIMENTOS_EMISSAO, 
                            MOVIMENTOS_STATUS,
                            MOVIMENTOS_ENTRADASAIDA, 
                            MOVIMENTOS_NUMERO, 
                            MOVIMENTOS_SERIE,
                            MOVIMENTOS_ID_EMPRESAORIGEM,
                            MOVIMENTOS_NUMEROORIGEM,
                            MOVIMENTOS_SERIEORIGEM,
                            MOVIMENTOS_ID_PESSOAS, 
                            MOVIMENTOS_ID_USUARIOS, 
                            MOVIMENTOS_ID_OPERACOES,
                            MOVIMENTOS_TOTAL, 
                            MOVIMENTOS_ID_EMPRESAS, 
                            MOVIMENTOS_ID_PRAZOS,
                            MOVIMENTOS_NOME, 
                            CIDADES.CIDADES_NOME as CIDADES_NOME, 
                            CIDADES.CIDADES_ESTADO as CIDADES_ESTADO, 
                            MOVIMENTOS_ID_PROPRIEDADES,
                            CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
                            CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                            OPERACOES_ACAO,
                            PESSOAS_TIPO,
                            PRODUTOS_NOME, 
                            PRODUTOS_DERIVADO, 
                            MOVIMENTOSITENS_ID_PRODUTOS, 
                            MOVIMENTOSITENS_ID_OPERACOES,
                            MOVIMENTOSITENS_QUANTIDADE, 
                            MOVIMENTOSITENS_PRECO, 
                            MOVIMENTOSITENS_TOTAL,
                            PRAZOS_NOME
                        from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                        join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                        left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                        left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                        left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                        left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                        left outer join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
                        left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES

        where ${sqlTipo} and ${sqlPeriodo} ${filtrarCan}
        ${sqlWhere} ${SqlOrder}`;

        console.log(sqlSearch);
        
        db.query(sqlSearch, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
}