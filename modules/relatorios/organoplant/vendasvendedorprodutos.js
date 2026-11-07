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
                    {columns: [{},{},{},{},{},{},{},{},{}]},  // 9 Cols
                    {
                        style: 'tableExample',
                        table: {    //CD [DES    ] UN  GRP QTD VLR EMB TOT
                            widths:  [30, 45, '*', 15, 80, 40, 50, 40, 35],
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
                        fontSize: 6,
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
            let venAnterior      = 0;
            let totalVlrVendedor = 0;
            let totalQtdVendedor = 0;
            let totalEmbVendedor = 0;

            let totalTORDONXT   = 0;
            let totalDOMINUMXT  = 0;
            let totalTRUPER     = 0;
            let totalPADRON     = 0;
            let totalTOGAR      = 0;
            let totalGARLON     = 0;
            let totalULTRAS     = 0;

            let geralValor = 0;
            let geralQtde = 0;
            let geralEmba = 0;

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
                        text: 'Relação de Vendas por Vendedor Produtos',
                        colSpan: 5,
                        bold: true,
                        fontSize: 12,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
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
                        colSpan: 5,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
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
                        text: 'Descrição do Produto',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 2	
                    },{},
                    {
                        text: 'Uni',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Grupo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Embalagem',
                        style: 'tableHeader',
                        fontSize: 7,
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            for(let i in dados){

                if(venAnterior != dados[i]['MOVIMENTOS_ID_USUARIOS']) {
                    if(totalVlrVendedor > 0) {
                        rows.push([
                            {
                                text: 'TOTAL DO VENDEDOR',
                                alignment: 'right',
                                style: 'tableExample',
                                colSpan: 4
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(totalQtdVendedor / 100),
                                alignment: 'right',
                                colSpan: 2,
                                style: 'tableExample'
                            },{},
                            {
                                text: utils.number.float2moeda(totalVlrVendedor / 100),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(totalEmbVendedor),
                                alignment: 'right',
                                colSpan: 2,
                                style: 'tableExample'
                            },{}
                        ]);	        
                    }


                    rows.push([
                        {
                            text: `\n****** VENDEDOR: ${('00000' + dados[i]['MOVIMENTOS_ID_USUARIOS'].toString()).slice(-5)} ${dados[i]['USUARIOS_NOME']} ******\n\n`,
                            alignment: 'center',
                            style: 'tableExample',
                            fontSize: 10,
                            bold: true,
                            colSpan: 9,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);	        

                    totalQtdVendedor = 0;
                    totalVlrVendedor = 0;
                    totalEmbVendedor = 0;
                    venAnterior      = dados[i]['MOVIMENTOS_ID_USUARIOS'];
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample',
                        colSpan: 2
                    },{},
                    {
                        text: dados[i]['PRODUTOS_UNIDADE'],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: ('00000' + dados[i]['PRODUTOS_ID_GRUPOS']).slice(-5) + ' ' + dados[i]['GRUPOS_NOME'].slice(0, 17),
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['TOTAL_QUANTIDADE']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['TOTAL_VALOR']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_EMBALAGEM'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((cents(dados[i]['TOTAL_QUANTIDADE']) * cents(dados[i]['PRODUTOS_EMBALAGEM'])) / 10000),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                totalVlrVendedor += cents(dados[i]['TOTAL_VALOR']);
                totalQtdVendedor += cents(dados[i]['TOTAL_QUANTIDADE']);
                totalEmbVendedor += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                geralValor       += cents(dados[i]['TOTAL_VALOR']);
                geralQtde        += cents(dados[i]['TOTAL_QUANTIDADE']);
                geralEmba        += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);

                if(dados[i]['PRODUTOS_NOME'].match(/TORDON XT/)) {
                    totalTORDONXT += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

                if(dados[i]['PRODUTOS_NOME'].match(/DOMINUM XT/)) {
                    totalDOMINUMXT += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

                if(dados[i]['PRODUTOS_NOME'].match(/TRUPER/)) {
                    totalTRUPER += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

                if(dados[i]['PRODUTOS_NOME'].match(/PADRON/)) {
                    totalPADRON += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

                if(dados[i]['PRODUTOS_NOME'].match(/TOGAR/)) {
                    totalTOGAR += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }
                
                if(dados[i]['PRODUTOS_NOME'].match(/GARLON/)) {
                    totalGARLON += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

                if(dados[i]['PRODUTOS_NOME'].match(/TORDON ULTRA/)) {
                    totalULTRAS += (dados[i]['TOTAL_QUANTIDADE'] * dados[i]['PRODUTOS_EMBALAGEM']);
                }

            }

            if(totalTORDONXT > 0) {
                rows.push([
                    {
                        text: 'TOTAL TORDON XT',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalTORDONXT),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            if(totalDOMINUMXT > 0) {
                rows.push([
                    {
                        text: 'TOTAL DOMINUM XT',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalDOMINUMXT),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            if(totalTRUPER > 0) {
                rows.push([
                    {
                        text: 'TOTAL TRUPER',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalTRUPER),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            if(totalPADRON > 0) {
                rows.push([
                    {
                        text: 'TOTAL PADRON',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalPADRON),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            if(totalTOGAR > 0) {
                rows.push([
                    {
                        text: 'TOTAL TOGAR',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalTOGAR),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            if(totalGARLON > 0) {
                rows.push([
                    {
                        text: 'TOTAL GARLON',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalGARLON),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }
           
            if(totalULTRAS > 0) {
                rows.push([
                    {
                        text: 'TOTAL ULTRA S',
                        alignment: 'right',
                        bold: true,
                        style: 'tableExample',
                        colSpan: 7,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalULTRAS),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },{}
                ]);    
            }

            rows.push([
                {
                    text: 'TOTAL DO VENDEDOR',
                    alignment: 'right',
                    style: 'tableExample',
                    colSpan: 4,
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(totalQtdVendedor / 100),
                    colSpan: 2,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},
                {
                    text: utils.number.float2moeda(totalVlrVendedor / 100),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: utils.number.float2moeda(totalEmbVendedor),
                    alignment: 'right',
                    colSpan: 2,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{}
            ]);	 

            rows.push([
                {
                    text: 'TOTAL GERAL',
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false],
                    colSpan: 4
                },{},{},{},
                {
                    text: utils.number.float2moeda(geralQtde / 100),
                    alignment: 'right',
                    colSpan: 2,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},
                {
                    text: utils.number.float2moeda(geralValor / 100),
                    alignment: 'right',
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(geralEmba),
                    alignment: 'right',
                    colSpan: 2,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{}
            ]);	        

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        documento, 
        vacina,
        inicio, 
        final, 
        empresaLogada, 
        idUsuarioi, 
        idUsuariof, 
        idGrupoi, 
        idGrupof, 
        idProdutoi, 
        idProdutof,
        idPessoai, 
        idPessoaf 
    } = params;

    return new Promise(async (resolve, reject) => {

    let sql = `select MOVIMENTOSITENS_ID_PRODUTOS,
                        PRODUTOS_NOME, 
                        PRODUTOS_UNIDADE, 
                        PRODUTOS_EMBALAGEM,
                        PRODUTOS_ID_GRUPOS,
                        GRUPOS_NOME,
                        MOVIMENTOS_ID_USUARIOS,
                        USUARIOS_NOME,
                        sum(MOVIMENTOSITENS_QUANTIDADE) as TOTAL_QUANTIDADE,
                        sum(MOVIMENTOSITENS_TOTAL) as TOTAL_VALOR
                    from MOVIMENTOSITENS
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                    join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                    join GRUPOS     on GRUPOS_ID     = PRODUTOS_ID_GRUPOS
                    join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                    where MOVIMENTOS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                        MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                        MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                        MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                        MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                        MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                        PRODUTOS_ID_GRUPOS between ${idGrupoi} and ${idGrupof} and
                        left(OPERACOES_ACAO, 1) = 'V' and
                        ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                        ${vacina == '1' ? ` and PRODUTOS_DERIVADO <> 'V'` : ''}
                        
                    group by MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_UNIDADE, 
                             PRODUTOS_EMBALAGEM, PRODUTOS_ID_GRUPOS, GRUPOS_NOME, MOVIMENTOS_ID_USUARIOS,
                            USUARIOS_NOME
                    order by MOVIMENTOS_ID_USUARIOS, PRODUTOS_NOME`;

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