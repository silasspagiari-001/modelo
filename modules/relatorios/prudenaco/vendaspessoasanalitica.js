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

            const docImpressao = params.documento == 1 ? 'Orçamento' :
                                 params.documento == 2 ? 'Pedido' :
                                 params.documento == 3 ? 'NF Eletrônica' :
                                 params.documento == 4 ? 'Requisição' : 'Docto';

            let nomeRelatorio = params.documento == 1 ? 'Orçamentos' :
                                params.documento == 2 ? 'Pedidos' :
                                params.documento == 3 ? 'Notas Eletrônicas' :
                                params.documento == 4 ? 'Requisições' : 'Docto';

            let status = params.status == 0 ? '- Todos' :
                         params.status == 1 ? '- Com NF-e' :
                         params.status == 2 ? '- Sem NF-e' :
                         params.status == 3 ? '- Baixados' :
                         params.status == 4 ? '- Abertos' :
                         params.status == 5 ? '- Sem NF-e Abertos' : '(Indefinido)';

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [  //  1  2  3  4  5  6
                    {columns: [{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [75, 75, 75, 75, 100, 100],
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
                        margin: [15, 10]
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 10,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
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
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: `${nomeRelatorio} ${status}`,
                        colSpan: 4,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},
                    {
                        text: '',
                        border: [false, false, false, false]
                    }
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 4,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false],
                    }
                ],												
                [
                    {
                        text: docImpressao,
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Vencimento',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Valor',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Situação',
                        colSpan: 2,
                        style: 'tableHeader',
                        alignment: 'center'
                    },{}
                ]
            );

            let totalPessoa = 0;
            let totalGeral= 0;

            for(let i in dados){

                totalPessoa += cents(dados[i]['MOVIMENTOS_TOTAL']);
                totalGeral  += cents(dados[i]['MOVIMENTOS_TOTAL']);
                
                if(dados[i]['MOVIMENTOS_ID_PESSOAS'] != (dados[parseInt(i) - 1] || {})['MOVIMENTOS_ID_PESSOAS']) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 6,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `CÓD. CLIENTE: ${dados[i]['MOVIMENTOS_ID_PESSOAS']} - NOME: ${dados[i]['PESSOAS_NOME']} ***`,
                            colSpan: 6,
                            fontSize: 10,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'] + ' ' + dados[i]['MOVIMENTOS_SERIE'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: '',  // Vencimento
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['MOVIMENTOS_TOTAL']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: (dados[i]['MOVIMENTOS_ID_PESSOAS'] == dados[i]['DOCUMENTOS_ID_PESSOAS']) ?
                               dados[i]['MOVIMENTOS_NOME'] : '',
                        colSpan: 2
                    },{}
                ]);	

                if(dados[i]['MOVIMENTOS_ID_PESSOAS'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_ID_PESSOAS']) {
                    rows.push([
                        {
                            text: 'Total do Cliente: ',
                            alignment: 'right',
                            colSpan: 3,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},					
                        {
                            text: utils.number.float2moeda(totalPessoa / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: '',
                            colSpan: 2,
                            border: [false, false, false, false]
                        },{}
                    ]);	

                    totalPessoa = 0;
                }

            }

            if(totalPessoa > 0) {
                rows.push([
                    {
                        text: 'Total do Cliente: ',
                        alignment: 'right',
                        colSpan: 3,
                        border: [false, false, false, false],
                        style: 'tableExample'
                    },{},{},					
                    {
                        text: utils.number.float2moeda(totalPessoa / 100),
                        alignment: 'right',
                        bold: true,
                        border: [false, false, false, false],
                        style: 'tableExample'
                    },
                    {
                        text: '',
                        colSpan: 2,
                        border: [false, false, false, false]
                    },{}
                ]);	
            }

            rows.push([
                {
                    text: 'Total Geral: ',
                    alignment: 'right',
                    colSpan: 3,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},{},					
                {
                    text: utils.number.float2moeda(totalGeral / 100),
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: '',
                    colSpan: 2,
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
        status,
        cidade,
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

    let sqlStatus = status == 1 ? ` and MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' ` : // Com nfe
                    status == 2 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' ` : // Sem nfe
                    status == 3 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z'))` : // Baixados
                    status == 4 ? ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' and MOVIMENTOS_STATUS <> 'F' and MOVIMENTOS_STATUS <> 'C'` :  // Abertos 
                    status == 5 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` : ''; // Sem nfe Abertos

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOS_NUMERO,
                          MOVIMENTOS_SERIE,
                          MOVIMENTOS_EMISSAO,
                          MOVIMENTOS_ID_PESSOAS,
                          DOCUMENTOS_ID_PESSOAS,
                          MOVIMENTOS_NOME,
                          PESSOAS_NOME,
                          CIDADES_NOME,
                          CIDADES_ESTADO,
                          MOVIMENTOS_TOTAL    
                from MOVIMENTOS
                join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                    MOVIMENTOS_ID_PESSOAS between ${(idPessoai || '1')} and ${(idPessoaf || '999999')} and
                    ${cidade ? ` CIDADES_NOME LIKE '%${cidade}%' and ` : ''}
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D') and (MOVIMENTOS_STATUS <> 'R')) ${sqlStatus}
                order by MOVIMENTOS_ID_PESSOAS,MOVIMENTOS_EMISSAO,MOVIMENTOS_NUMERO`

console.log('sql: ', sql);

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