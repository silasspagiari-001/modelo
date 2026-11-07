'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');
const samosFB_rel = require('../../../services/samosFirebird');
const cents       = utils.number.cents.bind(utils.number);

const getVendasPeriodo = async function(params){
    return new Promise(async (resolve, reject) => {

        const db = await samosFB.conectarBanco(params.client);

        let { 
            empresa,
            empresacnpj,
            tipo,
            status,
            pesinicio,
            pesfinal,
            grpinicio,
            grpfinal,
            proinicio,
            profinal,
            usuinicio,
            usufinal,
            emiinicio,
            emifinal,
            quebra,
            operacao,
            itens,
            vacina,
            start,
            limit
        } = params;            

        let sqlWhere = '';
        let sqlSearch = '';
        let SqlOrder  = '';
        let sqlTipo = '';

        let sqlVacina = vacina == 1; // 0-Com 1-Sem

        pesinicio = pesinicio ? pesinicio : 1;
        pesfinal  = pesfinal  ? pesfinal  : 9999999;
        proinicio = proinicio ? proinicio : 1;
        profinal  = profinal  ? profinal  : 9999999;
        grpinicio = grpinicio ? grpinicio : 1;
        grpfinal  = grpfinal  ? grpfinal  : 9999999;
        usuinicio = usuinicio ? usuinicio : 1;
        usufinal  = usufinal  ? usufinal  : 9999999;            

        sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${pesinicio} and ${pesfinal} `;
        sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${usuinicio} and ${usufinal} `;
        sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${proinicio} and ${profinal} `;
        sqlWhere += `and PRODUTOS_ID_GRUPOS between ${grpinicio} and ${grpfinal} `;
        sqlWhere += operacao == 1 ? ` and OPERACOES_ACAO = 'VN' ` :
                    operacao == 2 ? ` and left(OPERACOES_ACAO, 1) = 'T' ` :
                    operacao == 3 ? ` and OPERACOES_ACAO = 'DV' ` :
                    operacao == 4 ? ` and MOVIMENTOS_STATUS = 'C' ` : '';
        sqlWhere += sqlVacina ? ` and PRODUTOS_DERIVADO <> 'V' ` : '';
        sqlWhere += status == 1 ? ` and MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' ` : // Com nfe
                    status == 2 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' ` : // Sem nfe
                    status == 3 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z'))` : // Baixados
                    status == 4 ? ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` :  // Abertos
                    status == 5 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` : ''; // Sem nfe Abertos

        SqlOrder = `ORDER BY MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`

        sqlTipo = `MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})`

        if(empresa > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
        }

        sqlSearch = `select MOVIMENTOS_ID, 
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
                           PESSOAS_NOME,
                           CIDADES_NOME, 
                           CIDADES_ESTADO, 
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

        where ${sqlTipo} and
        MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' 
        ${sqlWhere} ${SqlOrder}`;

        db.query(sqlSearch, (error, results) => {
            if (error) {
                samosFB_rel.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
            } else {
                samosFB_rel.processarLeitura({db, results, total: results.length, resolve, reject});
            }
        });
    });
}

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
                    table: { //   TIP  NU SER DOC ORI  SE COD  NOM CPG DAT VEN VIS PRZ
                        widths:   [15, 30, 10, 15, 30, 10, 25, 130, 25, 35, 20, 55, 55],
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
			getVendasPeriodo(params)
				.then(async res => {
					let rows            = docDefinition.content[1].table.body;

                    let movTotal = 0;
                    let quebra    = params.quebra;  // 0-Sem 1-Com
                    let itens     = params.itens;   // 0-Sem 1-Com
                    
                    let totalVista = 0;
                    let totalPrazo = 0;

					let model;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

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
                                text: 'Relatório de Vendas no Período',
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
                                text: 'Referencia: ' + params.emiinicio + ' a ' + params.emifinal,
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
                                text: 'TIP',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'NUMERO',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'SE',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'DOC',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'ORIGEM',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'SE',
                                style: 'tableHeader',
                                alignment: 'center'
                            },	
                            {
                                text: 'CODIGO',
                                style: 'tableHeader',
                                alignment: 'center'
                            },				
                            {
                                text: 'NOME DA PESSOA',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'CPG',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'DATA',
                                style: 'tableHeader',
                                alignment: 'center'
                            },		
                            {
                                text: 'VEN',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'VALOR VISTA',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'VALOR PRAZO',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    );
                    
                    let docAnt = '';

                    for(let i in res.results){

                        model = res.results[i]; 

                        if(docAnt != model['MOVIMENTOS_NUMERO']) {
                            docAnt = model['MOVIMENTOS_NUMERO'];
                            rows.push([
                                {
                                    text: params.tipo == '3' ? 'NFS' :
                                        params.tipo == '2' ? 'PED' :
                                        params.tipo == '1' ? 'ORC' :
                                        params.tipo == '4' ? 'REQ' :
                                        'DOC',
                                    alignment: 'center',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]											
                                },
                                {
                                    text: model['MOVIMENTOS_NUMERO'],
                                    alignment: 'right',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: model['MOVIMENTOS_SERIE'],
                                    alignment: 'center',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: model['MOVIMENTOS_SERIEORIGEM'] == 'PE' ? 'PED' :
                                        model['MOVIMENTOS_SERIEORIGEM'] == 'OR' ? 'ORC' :
                                        model['MOVIMENTOS_NUMEROORIGEM'] == 999999 ? 'DIV' : '',
                                    alignment: 'center',
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]											
                                },
                                {
                                    text: cents(model['MOVIMENTOS_NUMEROORIGEM']) > 0 ? model['MOVIMENTOS_NUMEROORIGEM'] : '',
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]                                
                                },
                                {
                                    text: model['MOVIMENTOS_SERIEORIGEM'],
                                    alignment: 'center',
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
                                    text: model['PESSOAS_NOME'].slice(0, 37),
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: ('00000' + model['MOVIMENTOS_ID_PRAZOS'].toString()).slice(-5),
                                    alignment: 'center',
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                    alignment: 'center',
                                    border: [false, false, false, false],									
                                    style: 'tableExample'
                                },
                                {
                                    text: ('00000' + model['MOVIMENTOS_ID_USUARIOS'].toString()).slice(-5),
                                    alignment: 'center',
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: model['MOVIMENTOS_STATUS'] == 'C' ? '*** CANCELADA ***' :
                                        model['MOVIMENTOS_ID_PRAZOS'] == 1 ? utils.number.float2moeda(model['MOVIMENTOS_TOTAL']) : '', // A vista
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: model['MOVIMENTOS_STATUS'] == 'C' ? '' :
                                        model['MOVIMENTOS_ID_PRAZOS'] != 1 ? utils.number.float2moeda(model['MOVIMENTOS_TOTAL']) : '', // A prazo
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                }
                            ])

                            if(model['MOVIMENTOS_STATUS'] != 'C') {
                                if(model['MOVIMENTOS_ID_PRAZOS'] == 1) {
                                    totalVista += cents(model['MOVIMENTOS_TOTAL']);
                                } else {
                                    totalPrazo += cents(model['MOVIMENTOS_TOTAL']);
                                }
                            }
                        }

                    }

                    rows.push([
                        {
                            text: 'Totais',
                            colSpan: 11,
                            alignment: 'right',
                            bold: true,
                            fontSize: 10,
                            bold: true,
                            style: 'tableExample',
                            border: [false, true, false, false]											
                        },{},{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalVista / 100),
                            alignment: 'right',
                            fontSize: 10,
                            bold: true,
                            style: 'tableExample',
                            border: [false, true, false, false]
                        },
                        {
                            text: utils.number.float2moeda(totalPrazo / 100),
                            alignment: 'right',
                            fontSize: 10,
                            bold: true,
                            style: 'tableExample',
                            border: [false, true, false, false]
                        }
                    ]);						

					pdfStream(docDefinition, resolve, reject);
					db.detach();					
				})
				.catch(res => {
           			reject(res);
				});
        });
    }
};