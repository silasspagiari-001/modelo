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
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{}]},  // 11 Cols
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [20, 25, 15, 22, 100, 38, 38, 30, 90, 35, 40],
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
                        colSpan: 7,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},
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
                        colSpan: 7,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],												
                [
                    {
                        text: 'Tipo',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Docto',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Ser',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Pes',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome da Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Origem',
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
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalTotalDocumento = 0;
            let totalTotalVendedor = 0;
            let totalGeral = 0;
            let sameDoc;
            let tipoDocumento = params.documento == 1 ? 'ORC' :
                                params.documento == 2 ? 'PED' :
                                params.documento == 3 ? 'NFS' :
                                params.documento == 4 ? 'REQ' : '';

            for(let i in dados){

                totalTotalDocumento     += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                totalTotalVendedor      += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                totalGeral              += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);

                sameDoc = (dados[i]['MOVIMENTOS_NUMERO'] == (dados[parseInt(i) - 1] || {})['MOVIMENTOS_NUMERO'])
                
                if(quebraPorVendedor && (dados[i]['MOVIMENTOS_ID_USUARIOS'] != (dados[parseInt(i) - 1] || {})['MOVIMENTOS_ID_USUARIOS'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 11,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** VENDEDOR: ${dados[i]['MOVIMENTOS_ID_USUARIOS']} ${dados[i]['USUARIOS_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 11,
                            fontSize: 15,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: sameDoc ? '' : tipoDocumento,   // Criar função, analisar pelo MOVIMENTOS_ID_DOCUMENTOS
                        alignment: 'center',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },
                    {
                        text: sameDoc ? '' : dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },							
                    {
                        text: sameDoc ? '' : dados[i]['MOVIMENTOS_SERIE'],
                        alignment: 'left',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },						
                    {
                        text: sameDoc ? '' : dados[i]['MOVIMENTOS_ID_PESSOAS'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },							
                    {
                        text: sameDoc ? '' : dados[i]['PESSOAS_NOME'].slice(0, 22),
                        alignment: 'left',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },						
                    {
                        text: sameDoc ? '' : moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]                        
                    },
                    {
                        text: (sameDoc || dados[i]['MOVIMENTOS_NUMEROORIGEM'] == 0)  ? '' : (dados[i]['MOVIMENTOS_NUMEROORIGEM'] + ' ' +  dados[i]['MOVIMENTOS_SERIEORIGEM']),
                        alignment: 'center',
                        style: 'tableExample',
                        border: sameDoc ? [false, false, false, false] : [true, true, true, true]
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_NOME'].slice(0, 20),
                        alignment: 'left',
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
                    }
                ]);	

                if(dados[i]['MOVIMENTOS_NUMERO'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_NUMERO']) {
                    rows.push([
                        {
                            text: 'Total do Documento',
                            colSpan: 10,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalTotalDocumento / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);	

                    totalTotalDocumento = 0;
                }

                if(quebraPorVendedor && (dados[i]['MOVIMENTOS_ID_USUARIOS'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_ID_USUARIOS'])) {

                    rows.push([
                        {
                            text: 'Total do Vendedor',
                            colSpan: 10,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalTotalVendedor / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);
                    totalTotalVendedor      = 0;
                }
            }

            rows.push([
                {
                    text: 'Total Geral',
                    colSpan: 10,
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},{},{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalGeral / 100),
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

const obterDados = function(db, params) {
    const { 
        documento, 
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

    let sqlNfe = params.nfe == 1 ? `MOVIMENTOS_NUMEROORIGEM > 0 and ((MOVIMENTOS_SERIEORIGEM = 'NE') or (MOVIMENTOS_SERIEORIGEM = 'NS')) and ` :  // Com nfe
                 params.nfe == 2 ? `MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_SERIEORIGEM <> 'NS' and ` : ' '  // Sem nfe/nfserviço

    let sqlUnion = params.documento == 3 ? `union
            select ORDENS_ID_DOCUMENTOS as MOVIMENTOS_ID_DOCUMENTOS,
                ORDENS_NUMERO  as MOVIMENTOS_NUMERO,
                ORDENS_SERIE   as MOVIMENTOS_SERIE,
                ORDENS_EMISSAO as MOVIMENTOS_EMISSAO,
                ORDENS_EMISSAO as MOVIMENTOS_ENTRADASAIDA,
                ORDENS_NUMEROORIGEM as MOVIMENTOS_NUMEROORIGEM,
                ORDENS_SERIEORIGEM  as MOVIMENTOS_SERIEORIGEM,
                ORDENS_ID_PESSOAS   as MOVIMENTOS_ID_PESSOAS,
                PESSOAS_NOME,
                ORDENS_ID_USUARIOS as MOVIMENTOS_ID_USUARIOS,
                USUARIOS_NOME,
                ORDENSPRODUTOS_ID_PRODUTOS as MOVIMENTOSITENS_ID_PRODUTOS,
                PRODUTOS_NOME,
                ORDENSPRODUTOS_QUANTIDADE as MOVIMENTOSITENS_QUANTIDADE,
                ORDENSPRODUTOS_PRECO      as MOVIMENTOSITENS_PRECO,
                ORDENSPRODUTOS_TOTAL      as MOVIMENTOSITENS_TOTAL
            from ORDENSPRODUTOS
            join ORDENS on ORDENS_ID = ORDENSPRODUTOS_ID_ORDENS
            join PESSOAS    on PESSOAS_ID    = ORDENS_ID_PESSOAS
            join OPERACOES  on OPERACOES_ID  = ORDENSPRODUTOS_ID_OPERACOES
            join USUARIOS   on USUARIOS_ID   = ORDENS_ID_USUARIOS
            join PRODUTOS   on PRODUTOS_ID   = ORDENSPRODUTOS_ID_PRODUTOS
            where ORDENS_ID_EMPRESAS   = ${empresaLogada} and
                ORDENS_ID_DOCUMENTOS = ${empresaLogada}0007  and
                ORDENS_EMISSAO          between '${inicio}' and '${final}' and
                ORDENS_ID_USUARIOS      between ${idUsuarioi || 1}  and ${idUsuariof || 999999} and
                ORDENS_ID_PESSOAS       between ${idPessoai  || 1}  and ${idPessoaf  || 999999} and
                PRODUTOS_ID_GRUPOS      between ${idGrupoi   || 1}  and ${idGrupof   || 999999} and
                ORDENSPRODUTOS_ID_PRODUTOS between ${idProdutoi || 1}  and ${idProdutof || 999999} and
                OPERACOES_ACAO = 'VN' and
                ((ORDENS_STATUS <> 'C') and (ORDENS_STATUS <> 'D'))`
    : ''; // Se não for nf-e com nf serviços

    return new Promise(async (resolve, reject) => {
		let sql = `
              select MOVIMENTOS_ID_DOCUMENTOS,
                     MOVIMENTOS_NUMERO,
                     MOVIMENTOS_SERIE,
                     MOVIMENTOS_EMISSAO,
                     MOVIMENTOS_ENTRADASAIDA,
                     MOVIMENTOS_NUMEROORIGEM,
                     MOVIMENTOS_SERIEORIGEM,
                     MOVIMENTOS_ID_PESSOAS,
                     PESSOAS_NOME,
                     MOVIMENTOS_ID_USUARIOS,
                     USUARIOS_NOME,
                     MOVIMENTOSITENS_ID_PRODUTOS,
                     PRODUTOS_NOME,
                     MOVIMENTOSITENS_QUANTIDADE,
                     MOVIMENTOSITENS_PRECO,
                     MOVIMENTOSITENS_TOTAL
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
                join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
              where MOVIMENTOS_ID_EMPRESAS   = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO          between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_USUARIOS      between ${idUsuarioi || 1}  and ${idUsuariof || 999999} and
                    MOVIMENTOS_ID_PESSOAS       between ${idPessoai  || 1}  and ${idPessoaf  || 999999} and
                    PRODUTOS_ID_GRUPOS          between ${idGrupoi   || 1}  and ${idGrupof   || 999999} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi || 1}  and ${idProdutof || 999999} and
                    ${sqlNfe}
                    OPERACOES_ACAO = 'VN' and
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
               ${sqlUnion}
               order by 10, 4, 2`

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