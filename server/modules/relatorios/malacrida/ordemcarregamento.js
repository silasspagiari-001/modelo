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
    create: async (data, params) => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client);
                       
            const dados = await obterDados(db, data);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{}]},  // 11
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [40, 20, 40, 40, 40, 40, 40, 40, 40, 40, 40],
                            headerRows: 4,
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
                        fontSize: 6,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${data.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            let grpAnt = 0;

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
                        text: 'ORDEM DE CARREGAMENTO',
                        colSpan: 9,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},
                    { 
                        text: '',
                        fontSize: 11,
                        alignment: 'center',
                        border: [false, false, false, false]
                    }
                ],
                [
                    {
                        text: `Documentos (${data.numeros.length}): ${data.numeros.join(', ')}`,
                        alignment: 'center',
                        fontSize: 11,
                        bold: true,
                        colSpan: 11,
                        border: [false, false, false, false],
                        style: 'tableExample'
                    },{},{},{},{},{},{},{},{},{},{}                    
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'left',
                        colSpan: 2,
                        fontSize: 11,
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: '',
                        colSpan: 6,
                        fontSize: 11,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 3,
                        fontSize: 11,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{},{}
                ],												
                [
                    {
                        text: 'Código',
                        style: 'tableHeader',
                        fontSize: 11,
                        colSpan: 2,
                        alignment: 'center'									
                    },{},
                    {
                        text: 'Descrição do Produto',
                        style: 'tableHeader',
                        alignment: 'center'	,
                        fontSize: 11,
                        colSpan: 7
                    },{},{},{},{},{},{},
                    {
                        text: 'Quantidade',
                        style: 'tableHeader',
                        alignment: 'center',
                        fontSize: 11,
                        colSpan: 2
                    },{}
                ]
            );

            for(let i in dados){

                    if(grpAnt != dados[i]['PRODUTOS_ID_GRUPOS']) {
                        rows.push(
                            [  {
                                text: '.',
                                alignment: 'center',
    							color: 'white',
                                colSpan: 11,
                                fontSize: 10,
                                bold: true,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{}
                        ],
                    
                            [  {
                                text: 'GRUPO: ' + dados[i]['GRUPOS_NOME'].toString(),
                                alignment: 'center',
                                colSpan: 11,
                                fontSize: 10,
                                bold: true,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{}
                        ]
                    
                    
                    );
                        grpAnt = dados[i]['PRODUTOS_ID_GRUPOS'];
                    }    

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        fontSize: 11,
                        colSpan: 2,
                        style: 'tableExample'
                    },{},
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        style: 'tableExample',
                        fontSize: 11,
                        colSpan: 7
                    },{},{},{},{},{},{},
                    {
                        text: dados[i]['QUANTIDADE'],
                        alignment: 'right',
                        fontSize: 11,
                        style: 'tableExample',
                        colSpan: 2

                    },{}
                    
                ]);	




            }


            rows.push([ { text: '\n', fontSize: 11, colSpan: 11, border: [false, false, false, false], style: 'tableExample' },{},{},{},{},{},{},{},{},{},{} ]);	
            rows.push([ { text: '\n', fontSize: 11, colSpan: 11, border: [false, false, false, false], style: 'tableExample' },{},{},{},{},{},{},{},{},{},{} ]);	
            rows.push([ { text: '\n', fontSize: 11, colSpan: 11, border: [false, false, false, false], style: 'tableExample' },{},{},{},{},{},{},{},{},{},{} ]);	
            rows.push([ { text: '\n', fontSize: 11, colSpan: 11, border: [false, false, false, false], style: 'tableExample' },{},{},{},{},{},{},{},{},{},{} ]);	
            
                rows.push([
                    {
                        text: '____/____/____ ',
                        alignment: 'right',
                        fontSize: 11,
                        colSpan: 2,
                        border: [false, false, false, false],
                        style: 'tableExample'
                    },{},
                    {
                        text: '____________________',
                        alignment: 'center',
                        style: 'tableExample',
                        fontSize: 11,
                        border: [false, false, false, false],
                        colSpan: 3
                    },{},{},
                    {
                        text: '____________________',
                        alignment: 'center',
                        fontSize: 11,
                        border: [false, false, false, false],
                        style: 'tableExample',
                        colSpan: 3
                    },{},{},
                    {
                        text: '____________________',
                        alignment: 'center',
                        fontSize: 11,
                        border: [false, false, false, false],
                        style: 'tableExample',
                        colSpan: 3
                    },{},{}
                    
                ]);	
                rows.push([
                    {
                        text: '',
                        alignment: 'right',
                        fontSize: 11,
                        colSpan: 2,
                        border: [false, false, false, false],
                        style: 'tableExample'
                    },{},
                    {
                        text: 'Controle de Carga',
                        alignment: 'center',
                        style: 'tableExample',
                        fontSize: 11,
                        border: [false, false, false, false],
                        colSpan: 3
                    },{},{},
                    {
                        text: 'Conferente',
                        alignment: 'center',
                        fontSize: 11,
                        border: [false, false, false, false],
                        style: 'tableExample',
                        colSpan: 3
                    },{},{},
                    {
                        text: 'Motorista',
                        alignment: 'center',
                        fontSize: 11,
                        border: [false, false, false, false],
                        style: 'tableExample',
                        colSpan: 3
                    },{},{}
                    
                ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};


const obterDados = async function(db, data) {

    let sql = ` select              
            MOVIMENTOSITENS_ID_PRODUTOS, 
            PRODUTOS_NOME,
            GRUPOS_NOME,
            PRODUTOS_ID_GRUPOS,
            sum(MOVIMENTOSITENS_QUANTIDADE) as QUANTIDADE
        from MOVIMENTOSITENS
        left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
        left outer join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
        left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
        left outer join GRUPOS     on GRUPOS_ID   = PRODUTOS_ID_GRUPOS
        where MOVIMENTOSITENS_ID_MOVIMENTOS in(${data.ids.join(',')})
        group by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS,PRODUTOS_NOME,GRUPOS_NOME 
        order by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS`;

	    return new Promise((resolve, reject) => {
          db.query(sql, (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

