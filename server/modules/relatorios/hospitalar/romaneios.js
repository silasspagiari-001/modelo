'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
        console.log('params: ', params);
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [20, 20, 25, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},  // 10 Colunas
                    {
                        style: 'tableExample',
                        table: { //   NFE SER  [Destin  ]  [MU/uf   ]  [ VOL]   [PESO]
                            widths:   [40, 25, 50, 60, 100, 40, 50, 50, 25, 25],    
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
                        fontSize: 9,
                        margin: [0, 0, 0, 0],
                        border: 0
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 9,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;
         
            let totalVolumes = 0;
            let totalPeso = 0;
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
                        text: 'ROMANEIO DE COLETA',
                        colSpan: 6,
                        fontSize: 14,
                        alignment: 'center',
                        color: 'blue',
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
                        text: ' ',
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: `${dados.length > 0 ? 'Transportadora: ' + dados[0]['TRANSPORTES_NOME'] : ''}`,
                        colSpan: 6,
                        alignment: 'center',
                        fontSize: 14,                        
                        color: 'blue',                        
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
                        text: 'NF-e',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Série',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Destinatário',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 3									
                    },{},{},
                    {
                        text: 'Cidade/UF',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 3
                    },{},{},
                    {
                        text: 'Volumes',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 2                        								
                    },{}
/*                    {
                        text: 'Peso (KG)',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 2                        
                    },{}*/
                ]
            )


            for(let i in dados){
                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample',
                    },							
                    {
                        text: '1', // Série
                        style: 'tableExample',
                    },
                    {
                        text: (dados[i]['PESSOAS_NOME'] || '').slice(0, 45),
                        colSpan: 3,
                        style: 'tableExample'
                    },{},{},
                    {
                        text: dados[i]['CIDADES_NOME'] + '/' + dados[i]['CIDADES_ESTADO'],
                        colSpan: 3,                        
                        style: 'tableExample'
                    },{},{},
                    {
                        text: dados[i]['MOVIMENTOSENVIO_QUANTIDADE'] || '1',
                        alignment: 'right',
                        colSpan: 2,                                                
                        style: 'tableExample'
                    },{}
/*                    {
                        text: (grams(dados[i]['MOVIMENTOSENVIO_PESOBRUTO']) / 1000).toString().replace('.', ','),
                        alignment: 'right',
                        colSpan: 2,                                                
                        style: 'tableExample'
                    },{}*/
                ]);

                // iNCREMENTO DE TOTALIZADORES AQUI
                totalVolumes += dados[i]['MOVIMENTOSENVIO_QUANTIDADE'] || 1;
//              totalPeso    += grams(dados[i]['MOVIMENTOSENVIO_PESOBRUTO']);
            }

            rows.push([
                {
                    text: 'TOTAL',
                    alignment: 'right',
                    bold: true,							
                    colSpan: 8,
                    border: [false, false, false, false],
                    style: 'tableExample'							
                },{},{},{},{},{},{},{},
                {
                    text: totalVolumes.toFixed(0),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    colSpan: 2,
                    style: 'tableExample'							
                },{}
/*                {
                    text: (totalPeso / 1000).toString().replace('.', ','),
                    alignment: 'right',
                    bold: true,							
                    border: [false, false, false, false],
                    colSpan: 2,
                    style: 'tableExample'
                },{}*/
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = async function(db, params) { 

    const { empresa, pessoa, transporte, inicio, final, ordem} = params;

    let parPessoa      = (pessoa > 0 ? pessoa : '');
    let parTransporte  = (transporte > 0 ? transporte : '');

    let sqlWhere = '';
    let SqlOrder  = '';

    if(parPessoa) {
        sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = ${parPessoa} `;
    }

    if(parTransporte) {
        sqlWhere += ` and MOVIMENTOSENVIO_ID_TRANSPORTES = ${parTransporte} `;
    }


    if(ordem == 0) {
        SqlOrder = `order by MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO;`
    } else if(ordem == 1) {
        SqlOrder = `order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO;`
    } else {
        SqlOrder = `order by MOVIMENTOS_NUMERO;`
    }

    if(empresa > 0) {
        sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
    }

    return new Promise(async (resolve, reject) => {
		let sql = `select MOVIMENTOS_ID_EMPRESAS,
                          MOVIMENTOS_NUMERO,
                          MOVIMENTOS_SERIE,
                          MOVIMENTOS_ID_PESSOAS,
                          PESSOAS_NOME,
                          CIDADES_NOME,
                          CIDADES_ESTADO,
                          TRANSPORTES_NOME,
                          MOVIMENTOSENVIO_QUANTIDADE,
                          MOVIMENTOSENVIO_VOLUMES,
                          MOVIMENTOSENVIO_PESOBRUTO
                    from MOVIMENTOSENVIO                                    
                        left outer join MOVIMENTOS on MOVIMENTOS_ID   = MOVIMENTOSENVIO_ID_MOVIMENTOS
                        left outer join PESSOAS    on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
                        left outer join CIDADES    on CIDADES_ID      = PESSOAS_ID_CIDADES
                        left outer join TRANSPORTES on TRANSPORTES_ID = MOVIMENTOSENVIO_ID_TRANSPORTES
                    where ((MOVIMENTOS_STATUS <> 'C') and 
                            (MOVIMENTOS_STATUS <> 'D') and
                            (MOVIMENTOS_STATUS <> 'R') and
                            (MOVIMENTOS_STATUS <> 'V')) and
                            right(MOVIMENTOS_ID_DOCUMENTOs, 4) = '0003' and
                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                            ${sqlWhere}
                            ${SqlOrder}`

console.log('SQL: ', sql);

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