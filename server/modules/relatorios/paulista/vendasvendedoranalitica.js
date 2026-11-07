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
            const quebraPorVendedor = params.quebra == 1;

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [28, 13, '*', 80, 60, 45, 30, '*', 35, 35, 35, 35],
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
                        colSpan: 2,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Relação de Vendas por Vendedor Analítica',
                        colSpan: 8,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},{},
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
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 8,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],												
                [
                    {
                        text: 'Docto',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'SE',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome do Cliente',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Município',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Condição Pgt',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Pro',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Descrição',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Custo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
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
                        text: 'Margem',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalCustoDocumento = 0;
            let totalCustoTotalDocumento = 0;
            let totalQtdeDocumento  = 0;
            let totalTotalDocumento = 0;

            let totalCustoVendedor = 0;
            let totalCustoTotalVendedor = 0;
            let totalQtdeVendedor  = 0;
            let totalTotalVendedor = 0;

            for(let i in dados){
                totalCustoDocumento      += cents(dados[i]['SALDOS_CUSTO']);
                totalCustoTotalDocumento += (cents(dados[i]['SALDOS_CUSTO']) * cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']));
                totalQtdeDocumento       += cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']);
                totalTotalDocumento      += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);

                totalCustoVendedor      += cents(dados[i]['SALDOS_CUSTO']);
                totalCustoTotalVendedor += (cents(dados[i]['SALDOS_CUSTO']) * cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']));
                totalQtdeVendedor       += cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']);
                totalTotalVendedor      += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                
                if(quebraPorVendedor && (dados[i]['MOVIMENTOS_ID_USUARIOS'] != (dados[parseInt(i) - 1] || {})['MOVIMENTOS_ID_USUARIOS'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 12,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** VENDEDOR: ${dados[i]['MOVIMENTOS_ID_USUARIOS']} ${dados[i]['USUARIOS_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 12,
                            fontSize: 15,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['MOVIMENTOS_SERIE'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['PESSOAS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: `${dados[i]['CIDADES_NOME']}, ${dados[i]['CIDADES_ESTADO']}`,
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRAZOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['SALDOS_CUSTO']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['MOVIMENTOSITENS_TOTAL']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((cents(dados[i]['SALDOS_CUSTO']) * cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE'])) / cents(dados[i]['MOVIMENTOSITENS_TOTAL'])),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                if(dados[i]['MOVIMENTOS_NUMERO'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_NUMERO']) {
                    const totalMargem = totalCustoTotalDocumento / totalTotalDocumento;

                    rows.push([
                        {
                            text: '',
                            alignment: 'right',
                            colSpan: 6,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},							
                        {
                            text: 'Total do Documento',
                            colSpan: 2,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},
                        {
                            text: utils.number.float2moeda(totalCustoDocumento / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalQtdeDocumento / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalTotalDocumento / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalMargem),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);	

                    totalCustoDocumento      = 0;
                    totalCustoTotalDocumento = 0;
                    totalQtdeDocumento       = 0;
                    totalTotalDocumento      = 0;
                }

                if(quebraPorVendedor && (dados[i]['MOVIMENTOS_ID_USUARIOS'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_ID_USUARIOS'])) {
                    const totalMargem = totalCustoTotalVendedor / totalTotalVendedor;

                    rows.push([
                        {
                            text: '',
                            alignment: 'right',
                            colSpan: 6,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},							
                        {
                            text: 'Total do Vendedor',
                            colSpan: 2,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},
                        {
                            text: utils.number.float2moeda(totalCustoVendedor / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalQtdeVendedor / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalTotalVendedor / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totalMargem),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);

                    totalCustoVendedor      = 0;
                    totalCustoTotalVendedor = 0;
                    totalQtdeVendedor       = 0;
                    totalTotalVendedor      = 0;
                }
            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        documento, 
        vacina,
        bonificacao,
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
		let sql = `execute block returns (
            MOVIMENTOS_NUMERO           INTEGER,
            MOVIMENTOS_SERIE            VARCHAR(2),
            MOVIMENTOS_EMISSAO          DATE,
            MOVIMENTOS_ID_PESSOAS       INTEGER,
            PESSOAS_NOME                VARCHAR(50),
            CIDADES_NOME                VARCHAR(50),
            CIDADES_ESTADO              VARCHAR(2),
            MOVIMENTOS_ID_USUARIOS      INTEGER,
            USUARIOS_NOME               VARCHAR(50),
            MOVIMENTOS_ID_PRAZOS        INTEGER,
            PRAZOS_NOME                 VARCHAR(50),
            MOVIMENTOSITENS_ID_PRODUTOS INTEGER,
            PRODUTOS_NOME               VARCHAR(100),
            MOVIMENTOSITENS_QUANTIDADE  numeric(12,2),
            SALDOS_CUSTO                numeric(12,2),
            MOVIMENTOSITENS_PRECO       numeric(12,2),
            MOVIMENTOSITENS_TOTAL       numeric(12,2)
          )
          as
          begin
            for
              select MOVIMENTOS_NUMERO,
                     MOVIMENTOS_SERIE,
                     MOVIMENTOS_EMISSAO,
                     MOVIMENTOS_ID_PESSOAS,
                     PESSOAS_NOME,
                     CIDADES_NOME,
                     CIDADES_ESTADO,
                     MOVIMENTOS_ID_USUARIOS,
                     USUARIOS_NOME,
                     MOVIMENTOS_ID_PRAZOS,
                     PRAZOS_NOME,
                     MOVIMENTOSITENS_ID_PRODUTOS,
                     PRODUTOS_NOME,
                     MOVIMENTOSITENS_QUANTIDADE,
                     SALDOS_CUSTO,
                     MOVIMENTOSITENS_PRECO,
                     MOVIMENTOSITENS_TOTAL
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                join PRAZOS     on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
                join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
                join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
              where MOVIMENTOS_ID_EMPRESAS   = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO          between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_USUARIOS      between ${idUsuarioi || 1}  and ${idUsuariof || 999999} and
                    MOVIMENTOS_ID_PESSOAS       between ${idPessoai  || 1}  and ${idPessoaf  || 999999} and
                    PRODUTOS_ID_GRUPOS          between ${idGrupoi   || 1}  and ${idGrupof   || 999999} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi || 1}  and ${idProdutof || 999999} and
                    ${vacina      == '1' ? ` PRODUTOS_DERIVADO <> 'V' and ` : ''}
                    ${prp         == '1' ? ` PESSOAS_TIPO = 'G' and ` : ''}
                    ${bonificacao == '2' ? ` ((OPERACOES_ID <> 591100) AND (OPERACOES_ID <> 591000) AND (OPERACOES_ID <> 691000) AND (OPERACOES_ID <> 691100)) and ` : ''}
                    ((OPERACOES_ACAO = 'VN') or (OPERACOES_ACAO = 'DC')) and
                    ((MOVIMENTOS_STATUS <> 'C') or (MOVIMENTOS_STATUS <> 'D'))
               order by MOVIMENTOS_ID_USUARIOS,MOVIMENTOS_EMISSAO,MOVIMENTOS_NUMERO
            into
              :MOVIMENTOS_NUMERO,
              :MOVIMENTOS_SERIE,
              :MOVIMENTOS_EMISSAO,
              :MOVIMENTOS_ID_PESSOAS,
              :PESSOAS_NOME,
              :CIDADES_NOME,
              :CIDADES_ESTADO,
              :MOVIMENTOS_ID_USUARIOS,
              :USUARIOS_NOME,
              :MOVIMENTOS_ID_PRAZOS,
              :PRAZOS_NOME,
              :MOVIMENTOSITENS_ID_PRODUTOS,
              :PRODUTOS_NOME,
              :MOVIMENTOSITENS_QUANTIDADE,
              :SALDOS_CUSTO,
              :MOVIMENTOSITENS_PRECO,
              :MOVIMENTOSITENS_TOTAL
            do
              begin
                suspend;
              end
          end ;`

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