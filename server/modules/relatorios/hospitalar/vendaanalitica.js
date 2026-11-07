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
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [20, 20, 25, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
                    {
                        style: 'tableExample',
                        table: { //   PRO FAB  [NOM ] XXX QVD CUS VDA MRG SLD
                            widths:   [40, 60, 100, 100, 70, 70, 70, 70, 80, 50],    
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
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [25, 10]  // 10, 10
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 10,
                        margin: [0, 0, 0, 0],
                        border: 0
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;

            let grupoQtdVendido = 0;
            let grupoValorCompra = 0;
            let grupoValorVenda = 0;
            
            let totalQtdVendido = 0;
            let totalValorCompra = 0;
            let totalValorVenda = 0;
            let margem = 0;
            let ultimoGrupo     = 0;

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
                        width: 100,
                        height: 22,	
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Venda Analítica -  ' + (params.documento == 0 ? 'Pedidos' : 'Notas') + ' - Filial: ' + (params.empresa ? params.empresafan : 'TODAS'),
                        colSpan: 6,
                        fontSize: 16,
                        alignment: 'center',
                        color: 'blue',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        fontSize: 11,
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
                        text: 'Período: ' + params.inicio + ' a ' + params.final,
                        colSpan: 6,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],												
                [
                    {
                        text: 'Cód',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Nome do Produto',
                        style: 'tableHeader',
                        colSpan: 5,
                        alignment: 'center'									
                    },{},{},{},{},
                    {
                        text: 'Qtde Vendida',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },								
                    {
                        text: 'Compra Final',
                        style: 'tableHeader',
                        alignment: 'center'
                    },								
                    {
                        text: 'Valor Venda',
                        style: 'tableHeader',
                        alignment: 'center'
                    },				
                    {
                        text: 'Margem',
                        style: 'tableHeader',
                        alignment: 'center'
                    }	
                ]
            )


            for(let i in dados){

                let marcaProd = dados[i]['PRODUTOS_MARCA'];
                let valorVenda    = cents(dados[i]['MOVIMENTOS_VALORVENDA']);
                let valorCompra   = cents(dados[i]['MOVIMENTOS_VALORCOMPRA']);

                const margem = (100 - ((valorCompra / valorVenda) * 100));


                if(ultimoGrupo != dados[i]['GRUPOS_ID']) {
                    if(grupoValorVenda > 0) {
                        rows.push([
                            {
                                text: 'TOTAL GRUPO',
                                alignment: 'right',
                                bold: true,							
                                colSpan: 6,
                                border: [false, false, false, false],
                                style: 'tableExample'							
                            },{},{},{},{},{},
                            {
                                text: grupoQtdVendido.toFixed(0),
                                alignment: 'right',
                                bold: true,							
                                border: [false, false, false, false],
                                style: 'tableExample'							
                            },
                            {
                                text: utils.number.float2moeda(grupoValorCompra / 100),
                                alignment: 'right',
                                bold: true,							
                                border: [false, false, false, false],
                                style: 'tableExample'
                                
                            },
                            {
                                text: utils.number.float2moeda(grupoValorVenda / 100),
                                alignment: 'right',
                                bold: true,							
                                border: [false, false, false, false],
                                style: 'tableExample'							
                            },
                            {
                                text: utils.number.float2moeda((100 - ((grupoValorCompra / grupoValorVenda) * 100))),
                                alignment: 'right',
                                bold: true,							
                                border: [false, false, false, false],
                                style: 'tableExample'							
                            }
                        ]);
                        grupoQtdVendido = 0;
                        grupoValorCompra = 0;
                        grupoValorVenda = 0;		
                    }
                    rows.push([
                        {
                            text: '* * * ' + ('00000' + dados[i]['GRUPOS_ID']).slice(-5) + ' - ' + 
                                dados[i]['GRUPOS_NOME'] + ' * * *',
                            alignment: 'center',
                            style: 'tableExample',
                            colSpan: 10
                        },{},{},{},{},{},{},{},{},{}
                    ]);	
                    ultimoGrupo = dados[i]['GRUPOS_ID'];
                }

                rows.push([
                    {
                        text: dados[i]['PRODUTOS_ID'],
                        alignment: 'right',
                        style: 'tableExample',
                    },							
                    {
                        text: dados[i]['PRODUTOS_NOME'] + (marcaProd ? ` - ${marcaProd}` : ''),
                        alignment: 'left',
                        style: 'tableExample',
                        colSpan: 5
                    },{},{},{},{},
                    {
                        text: dados[i]['MOVIMENTOS_VENDIDO'].toFixed(0),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(valorCompra/100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(valorVenda/100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(margem),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);

                grupoQtdVendido  += dados[i]['MOVIMENTOS_VENDIDO'];
                grupoValorCompra += valorCompra;
                grupoValorVenda  += valorVenda;

                totalQtdVendido  += dados[i]['MOVIMENTOS_VENDIDO'];
                totalValorCompra += valorCompra;
                totalValorVenda  += valorVenda;

            }

            rows.push([
                {
                    text: 'TOTAL GRUPO',
                    alignment: 'right',
                    bold: true,							
                    colSpan: 6,
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },{},{},{},{},{},
                {
                    text: grupoQtdVendido.toFixed(0),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },
                {
                    text: utils.number.float2moeda(grupoValorCompra / 100),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'
                    
                },
                {
                    text: utils.number.float2moeda(grupoValorVenda / 100),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },
                {
                    text: utils.number.float2moeda((100 - ((grupoValorCompra / grupoValorVenda) * 100))),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                }
            ]);

            rows.push([
                {
                    text: 'TOTAL GERAL',
                    alignment: 'right',
                    bold: true,							
                    colSpan: 6,
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },{},{},{},{},{},
                {
                    text: totalQtdVendido.toFixed(0),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },{
                    text: utils.number.float2moeda(totalValorCompra / 100),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'
                    
                },{
                    text: utils.number.float2moeda(totalValorVenda / 100),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },{
                    text: utils.number.float2moeda((100 - ((totalValorCompra / totalValorVenda) * 100))),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    style: 'tableExample'							
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = async function(db, params) { 

    const { empresa, inicio, final, produtoinicial, produtofinal, grupoinicial, grupofinal, pessoa, documento, ordem} = params;

    let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
    let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
    let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
    let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
    let parPessoa      = (pessoa > 0 ? pessoa : '');
    let idDocumento = documento == 2 ? 2 : parseInt(documento) + 2;                                

    let sqlWhere = '';
    let SqlOrder  = '';

    sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} `;
    sqlWhere += `and PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `;    

    if(ordem == 1) {
        SqlOrder = `ORDER BY GRUPOS_ID, MOVIMENTOS_VENDIDO descending;`
    } else {
        SqlOrder = `ORDER BY GRUPOS_ID, MOVIMENTOS_VALORVENDA descending;`
    }

    if(empresa > 0) {
        sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
    }

    if(parPessoa) {
        sqlWhere += ` and PRODUTOS_ID_PESSOAS = ${parPessoa} `;
    }

    return new Promise(async (resolve, reject) => {
		let sql = `select GRUPOS_ID, 
                          GRUPOS_NOME, 
                          PRODUTOS_ID, 
                          PRODUTOS_NOME, 
                          PRODUTOS_FABRICA, 
                          PRODUTOS_MARCA, 
                          SALDOS_DISPONIVEL,
                          sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOS_VENDIDO,
                          sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as MOVIMENTOS_VALORCUSTO,
                          sum(MOVIMENTOSITENS_QUANTIDADE * SALDOS_COMPRA) as MOVIMENTOS_VALORCOMPRA,
                          sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOS_VALORVENDA,
                          sum(MOVIMENTOSITENS_FRETE) as MOVIMENTOS_VALORFRETE,
                          sum(MOVIMENTOSITENS_DESPESAS) as MOVIMENTOS_VALORDESPESAS,
                          sum(MOVIMENTOSITENS_VALORST) as MOVIMENTOS_VALORST
                    from MOVIMENTOSITENS                                    
                        left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        left outer join SALDOS ON SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                        left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                        left outer join GRUPOS   on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                    where ((MOVIMENTOS_STATUS <> 'C') and 
                            (MOVIMENTOS_STATUS <> 'D') and
                            (MOVIMENTOS_STATUS <> 'R') and
                            (MOVIMENTOS_STATUS <> 'V')) and
                            MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${idDocumento}) and
                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                            ${sqlWhere}
                            GROUP BY GRUPOS_ID, GRUPOS_NOME, PRODUTOS_NOME, PRODUTOS_ID, PRODUTOS_FABRICA, PRODUTOS_MARCA, SALDOS_DISPONIVEL
                            ${SqlOrder}`

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