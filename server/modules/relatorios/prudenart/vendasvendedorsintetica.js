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
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Cols.
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [40, 20, 25, 60, 60, 60, 60, 60, 40, 40],
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
                        text: 'Relação de Vendas por Vendedor Sintética',
                        colSpan: 6,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
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
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY') + '\n' +
                              'Status: ' + (params.status == 1 ? 'NÃO FATURADOS': params.status == 2 ? 'FATURADOS' : 'TODOS'),
                        colSpan: 6,
                        fontSize: 8,
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
                        text: 'Número',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Sér',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Status',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Pessoa',
                        colSpan: 4,
                        style: 'tableHeader',
                        alignment: 'center'
                    },{},{},{},
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        colSpan: 2,
                        alignment: 'center'
                    },{}
                ]
            );

            let venAnterior   = 0;
            let totalVendedor = 0;
            let totalGeral    = 0;

            for(let i in dados){

                if(dados[i]['MOVIMENTOS_ID_USUARIOS'] != venAnterior) {
                    if(totalVendedor > 0) {
                        rows.push([
                            {
                                text: 'TOTAL DO VENDEDOR',
                                alignment: 'right',
                                fontSize: 10,
                                bold: true,
                                colSpan: 8,
                                style: 'tableExample'
                            },{},{},{},{},{},{},{},
                            {
                                text: utils.number.float2moeda(totalVendedor / 100),
                                alignment: 'right',
                                fontSize: 10,
                                bold: true,
                                colSpan: 2,
                                style: 'tableExample'
                            },{}
                        ]);	        
                    }
                    rows.push(
                        [
                            {
                                text: 'a',
                                color: 'white',
                                fontSize: 6,
                                colSpan: 10,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},
                        ],
                        [{
                            text: `*** Vendedor: ${('00000' + dados[i]['MOVIMENTOS_ID_USUARIOS']).slice(-5)} - ${dados[i]['USUARIOS_NOME']} ***`,
                            alignment: 'center',
                            bold: true,
                            colSpan: 10,
                            fontSize: 10,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{},{}
                       ]);	        
                    venAnterior   = dados[i]['MOVIMENTOS_ID_USUARIOS'];
                    totalVendedor = 0;
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['MOVIMENTOS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOS_STATUS'],
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOS_NOME'],
                        alignment: 'left',
                        colSpan: 4,
                        style: 'tableExample'
                    },{},{},{},
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOS_TOTAL']),
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample'
                    },{}
                ]);	

                totalVendedor += cents(dados[i]['MOVIMENTOS_TOTAL']);
                totalGeral    += cents(dados[i]['MOVIMENTOS_TOTAL']);

            }

            rows.push([
                {
                    text: 'TOTAL DO VENDEDOR',
                    alignment: 'right',
                    fontSize: 10,
                    bold: true,
                    colSpan: 8,
                    style: 'tableExample'
                },{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalVendedor / 100),
                    alignment: 'right',
                    fontSize: 10,
                    bold: true,
                    colSpan: 2,
                    style: 'tableExample'
                },{}
            ]);	        

            rows.push([
                {
                    text: 'TOTAL GERAL',
                    alignment: 'right',
                    fontSize: 10,
                    bold: true,
                    colSpan: 8,
                    style: 'tableExample'
                },{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalGeral / 100),
                    alignment: 'right',
                    fontSize: 10,
                    bold: true,
                    colSpan: 2,
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
        status,
        inicio, 
        final, 
        empresaLogada, 
        idUsuarioi, 
        idUsuariof, 
        idPessoai, 
        idPessoaf 
    } = params;

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOS_NUMERO, 
                          MOVIMENTOS_SERIE,
                          MOVIMENTOS_EMISSAO,
                          MOVIMENTOS_STATUS,
                          MOVIMENTOS_TOTAL, 
                          MOVIMENTOS_NOME,
                          MOVIMENTOS_ID_USUARIOS,
                          USUARIOS_NOME
                   from MOVIMENTOS       
                   join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
              where  
                   MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                   MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                   MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                   MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                   MOVIMENTOS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and              
                   ${status == 1 ? `MOVIMENTOS_STATUS = 'N' and ` : status == 1 ? `MOVIMENTOS_STATUS = 'F' and` : ''}
                   ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))                   
              order by MOVIMENTOS_ID_USUARIOS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`

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