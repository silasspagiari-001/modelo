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
                    {columns: [{},{},{},{},{},{},{}]},  // 7 Cols
                    {
                        style: 'tableExample',
                        table: {    //COD [DES  ]  QTD TOT NFE EMI
                            widths:  [40, 40, 160 , 40, 60, 50, 90],
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

            const cents = utils.number.cents.bind(utils.number);					
            let pesAnterior      = 0;
            let totalVlrPessoa = 0;

            let geralValor = 0;

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
                        text: 'Relação de Vendas por Pessoa Produtos',
                        colSpan: 4,
                        bold: true,
                        fontSize: 12,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},
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
                        colSpan: 4,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false]
                    }
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
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'NF Número',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            for(let i in dados){

                if(pesAnterior != dados[i]['MOVIMENTOS_ID_PESSOAS']) {
                    if(totalVlrPessoa > 0) {
                        rows.push([
                            {
                                text: 'TOTAL DA PESSOA',
                                alignment: 'right',
                                bold: true,
                                style: 'tableExample',
                                colSpan: 4
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(totalVlrPessoa / 100),
                                alignment: 'right',
                                bold: true,
                                style: 'tableExample'
                            },
                            {
                                text: '',
                                colSpan: 2,
                                style: 'tableExample'
                            },{}
                        ]);	        
                    }


                    rows.push([
                        {
                            text: `\n****** PESSOA: ${('00000' + dados[i]['MOVIMENTOS_ID_PESSOAS'].toString()).slice(-5)} ${dados[i]['PESSOAS_NOME']} ******`,
                            alignment: 'center',
                            style: 'tableExample',
                            fontSize: 10,
                            bold: true,
                            colSpan: 7,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{}
                    ]);	        

                    totalVlrPessoa = 0;
                    pesAnterior    = dados[i]['MOVIMENTOS_ID_PESSOAS'];
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
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_TOTAL']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    }
                ]);	

                totalVlrPessoa += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                geralValor     += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);

            }

            rows.push([
                {
                    text: 'TOTAL PESSOA',
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    colSpan: 4,
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(totalVlrPessoa / 100),
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    border: [false, false, false, false]
                },
                {
                    text: '',
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
                    bold: true,
                    colSpan: 4,
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(geralValor / 100),
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    border: [false, false, false, false]
                },
                {
                    text: '',
                    colSpan: 2,
                    style: 'tableExample',
                    border: [false, false, false, false]
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
        prp,
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
                        MOVIMENTOS_ID_PESSOAS,                        
                        PESSOAS_NOME,
                        MOVIMENTOS_EMISSAO,
                        MOVIMENTOS_NUMERO,
                        MOVIMENTOSITENS_QUANTIDADE,
                        MOVIMENTOSITENS_TOTAL
                    from MOVIMENTOSITENS
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                    join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                    join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                    join GRUPOS     on GRUPOS_ID     = PRODUTOS_ID_GRUPOS
                    where MOVIMENTOS_ID_USUARIOS between ${idUsuarioi || 1} and ${idUsuariof || 999999} and
                        MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                        MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                        MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                        MOVIMENTOS_ID_PESSOAS between ${idPessoai || 1} and ${idPessoaf || 9999999} and
                        ${prp == '1' ? ` PESSOAS_TIPO = 'G' and ` : ''}                                      
                        MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi || 1} and ${idProdutof || 9999999} and
                        PRODUTOS_ID_GRUPOS between ${idGrupoi || 1} and ${idGrupof || 999999} and
                        left(OPERACOES_ACAO, 1) = 'V' and
                        ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D') and (MOVIMENTOS_STATUS <> 'R'))
                        ${vacina == '1' ? ` and PRODUTOS_DERIVADO <> 'V'` : ''}
                        
                    order by PESSOAS_NOME, MOVIMENTOS_EMISSAO, PRODUTOS_ID`;


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