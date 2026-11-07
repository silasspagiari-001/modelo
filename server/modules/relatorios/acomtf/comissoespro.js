'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getComissoesPro = async function(params){
    try {
        const { empresa, vendedor, inicio, final} = params;
        let sqlWhere = '';
        let sqlSearch = '';
        let sqlOrder = '';

        if(params.log.match(/prudenmoveis/)) {
            sqlOrder = 'order by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_NUMERO, PRODUTOS_NOME'
        } else {
            sqlOrder = 'order by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO, PRODUTOS_NOME'
        }

        if(empresa > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
        }

        if(vendedor > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
        }

        if(params.log.match(/prudenmoveis/)) {
                sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, PRODUTOS_APLICACAO, MOVIMENTOSITENS_QUANTIDADE,
                (MOVIMENTOSITENS_CUSTO * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_CUSTO,
                (MOVIMENTOSITENS_VALORPISST * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOSITENS_PRECOMINIMO,
                MOVIMENTOSITENS_IMPOSTO as MOVIMENTOSITENS_PARTIDA,
                round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2) as MOVIMENTOSITENS_COMISSAO
            FROM MOVIMENTOSITENS                                    
                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                and ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                     (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012')) and MOVIMENTOS_STATUS <> 'C'
                ${sqlWhere} ${sqlOrder}`
        } else {
                sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, PRODUTOS_APLICACAO, PRODUTOS_ID_GRUPOS,
                MOVIMENTOSITENS_QUANTIDADE, (SALDOS_PRECOMINIMO * MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_CUSTO,
                round(((MOVIMENTOS_IMPOSTO / MOVIMENTOS_TOTAL) * (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS)), 2) as MOVIMENTOSITENS_PARTIDA,
                round(((((MOVIMENTOS_IMPOSTO / MOVIMENTOS_TOTAL) * (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS)) / 100) * SALDOS_COMISSAO), 2) as MOVIMENTOSITENS_COMISSAO
            FROM MOVIMENTOSITENS                                    
                left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                and ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                     (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012')) and MOVIMENTOS_STATUS <> 'C'
                ${sqlWhere} ${sqlOrder}`
        } 
        
        const results = await samosFB.executeSQL(sqlSearch, params);

        return {
            results, 
            total  : results.length
        };
    } catch(error) {
        const msg = 'Falha ao buscar comissões pro';
        console.log(msg);
        console.log(error);
        throw { msg, error };
    }
}

module.exports = {
    read: params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [20, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{}]}, // 12 Cols
                {
                    style: 'tableExample',
                    table: {   // EMP NUM SER DTE PRO  DES  COR QTD CUS PAR COM PMM
                        widths:  [12,  20, 12, 32, 20, 145, 40, 20, 40, 40, 35, 25],  // 12 Cols.
                        headerRows: 3,
                        body: []
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
                        '_'.repeat(96),
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
			getComissoesPro(params)
				.then(res => {
					let rows = docDefinition.content[1].table.body;

					let venQtde = 0;
					let venCusto = 0;
                    let venPartida = 0;
                    let venComissao = 0;
                    let venPmm = 0;
                    let valorPmm = 0;

					let totalQtde = 0;
					let totalCusto = 0;
                    let totalPartida = 0;
                    let totalPmm = 0;
                    let ultimoVendedor = 0;

                    let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
                                        
                    rows.push(		
                        [
                            {							
                                image: pathLogo,
                                width: 80,
                                colSpan: 2,
                                fontSize: 10,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},
                            { 
                                text: 'Relatório de Comissões - Produtos',
                                colSpan: 8,
                                fontSize: 10,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                                colSpan: 2,
                                fontSize: 10,
                                alignment: 'right',
                                border: [false, false, false, false]								
                            },{}
                        ],
                        [
                            {							
                                text: '',
                                colSpan: 2,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},
                            { 
                                text: 'Período: ' + params.inicio + ' a ' + params.final,
                                colSpan: 8,
                                fontSize: 10,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('HH:mm:ss'),
                                colSpan: 2,
                                alignment: 'right',
                                border: [false, false, false, false]
                            },{}
                        ],												
                        [
                            {
                                text: 'Loja',  // Col 01
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Pedido',  // Col 02
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Tipo',  // Col 03
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Emissão',  // Col 04
                                style: 'tableHeader',
                                alignment: 'center'									
                            },								
                            {
                                text: 'Código',  // Col 05
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'Descrição do Produto',  // Col 06
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Cor',  // Col 07
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Qtde',  // Col 08
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Custo',  // Col 09
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Partida',  // Col 10
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Comissão',  // Col 11
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% PMM',  // Col 12
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    )

                    for(let i in res.results){

                        if(ultimoVendedor !== res.results[i]['MOVIMENTOS_ID_USUARIOS']) { 
                            if(ultimoVendedor > 0) {
                                rows.push([
                                    {
                                        text: 'Total Vendedor',
                                        alignment: 'right',
                                        fontSize: 6,
                                        bold: true,							
                                        colSpan: 7,
                                        border: [false, false, false, false],
                                        style: 'tableExample'							
                                    },{},{},{},{},{},{},
                                    {
                                        text: venQtde.toFixed(0),
                                        alignment: 'right',
                                        fontSize: 6,
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'
                                    },{
                                        text: utils.number.float2moeda(venCusto),
                                        alignment: 'right',
                                        fontSize: 6,
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'											
                                    },{
                                        text: utils.number.float2moeda(venPartida),
                                        alignment: 'right',                                        
                                        fontSize: 6,
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'											
                                    },{											
                                        text: utils.number.float2moeda(venPartida * .03), // Comissão
                                        alignment: 'right',
                                        fontSize: 6,
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'							
                                    },{
                                        text: utils.number.float2moeda(venPmm),
                                        alignment: 'right',
                                        fontSize: 6,
                                        bold: true,							
                                        border: [false, false, false, false],
                                        style: 'tableExample'                                        
                                    }
                                ]);												
                            }
                            venQtde= 0;
                            venCusto = 0;
                            venPartida = 0;
                            venComissao = 0;
                            rows.push([
                                {
                                    text: 'Vendedor: ' +
                                            res.results[i]['MOVIMENTOS_ID_USUARIOS'] + ' - ' + 
                                            res.results[i]['USUARIOS_NOME'],
                                    alignment: 'center',
                                    fontSize: 10,
                                    bold: true,							
                                    colSpan: 12,
                                    border: [false, false, false, false],
                                    style: 'tableExample'							
                                },{},{},{},{},{},{},{},{},{},{},{}
                            ]);

                            rows.push([
                                {
                                    text: 'Loja',  // Col 01
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Pedido',  // Col 02
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Tipo',  // Col 03
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Emissão',  // Col 04
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },								
                                {
                                    text: 'Código',  // Col 05
                                    style: 'tableHeader',
                                    alignment: 'center'									
                                },
                                {
                                    text: 'Descrição do Produto',  // Col 06
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Cor',  // Col 07
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Qtde',  // Col 08
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Custo',  // Col 09
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Partida',  // Col 10
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Comissão',  // Col 11
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: '% PMM',  // Col 12
                                    style: 'tableHeader',
                                    alignment: 'center'
                                }
                            ]);                                    
                            ultimoVendedor = res.results[i]['MOVIMENTOS_ID_USUARIOS'];                            
                        }
                                  
                        valorPmm = (((res.results[i]['MOVIMENTOSITENS_PARTIDA'] - res.results[i]['MOVIMENTOS_CUSTO']) / res.results[i]['MOVIMENTOSITENS_PARTIDA']) * 100);

                        rows.push([
                            {
                                text: res.results[i]['MOVIMENTOS_ID_EMPRESAS'],
                                alignment: 'right',
                                style: 'tableExample',
                            },							
                            {
                                text: res.results[i]['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOS_SERIE'],
                                alignment: 'center',
                                style: 'tableExample',
                            },
                            {
                                text: moment(res.results[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                alignment: 'left',
                                style: 'tableExample'
                            },
                            {
                                text: res.results[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                                alignment: 'right',
                                style: 'tableExample',
                            },								
                            {
                                text: res.results[i]['PRODUTOS_NOME'],
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['PRODUTOS_MARCA'],
                                alignment: 'left',
                                style: 'tableExample',
                            },
                            {
                                text: res.results[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOS_CUSTO']),
                                alignment: 'right',
                                style: 'tableExample'
                            },								
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_PARTIDA']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(res.results[i]['MOVIMENTOSITENS_COMISSAO']),
                                alignment: 'right',
                                style: 'tableExample'
                            },
                            {
                                text: utils.number.float2moeda(valorPmm),
                                alignment: 'right',
                                style: 'tableExample'
                            }
                        ]);

                        venQtde += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                        venCusto += res.results[i]['MOVIMENTOS_CUSTO'];
                        venPartida += res.results[i]['MOVIMENTOSITENS_PARTIDA']
                        venComissao += res.results[i]['MOVIMENTOSITENS_COMISSAO'];
                        venPmm = (((venPartida - venCusto) / venPartida) * 100);

                        totalQtde += res.results[i]['MOVIMENTOSITENS_QUANTIDADE'];
                        totalCusto += res.results[i]['MOVIMENTOS_CUSTO'];
                        totalPartida += res.results[i]['MOVIMENTOSITENS_PARTIDA']
                        totalPmm = (((totalPartida - totalCusto) / totalPartida) * 100);
                    }

                    rows.push([
                        {
                            text: 'Total Vendedor',
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            colSpan: 7,
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{},{},{},{},{},{},
                        {
                            text: venQtde.toFixed(0),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(venCusto),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                            
                        },{								
                            text: utils.number.float2moeda(venPartida),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{
                            text: utils.number.float2moeda(venPartida * .03),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(venPmm),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'                        
                        }
                    ]);

                    rows.push([
                        {
                            text: 'Total Geral',
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            colSpan: 7,
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{},{},{},{},{},{},
                        {
                            text: totalQtde.toFixed(0),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{
                            text: utils.number.float2moeda(totalCusto),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{								
                            text: utils.number.float2moeda(totalPartida),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'							
                        },{
                            text: utils.number.float2moeda(totalPartida * .03),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,							
                            border: [false, false, false, false],
                            style: 'tableExample'                            
                        },{
                            text: utils.number.float2moeda(totalPmm),
                            alignment: 'right',
                            fontSize: 6,
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};