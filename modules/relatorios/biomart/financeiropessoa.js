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
                content: [  // Cl No Tot
                    {columns: [{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [60, '*', 60],
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
                        border: 0
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
            let totalGeral = 0;
            
            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: `Contas a ${params.tipo == 'R' ? 'Receber' : 'Pagar'} por Pessoa - ${params.status == 0 ? 'Em Aberto' : params.status == 1 ? 'Pagos' : 'Abertos e Pagos'}`,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },
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
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Emissão: ' + params.emiinicio + ' a ' + params.emifinal + 
                              ' Vencto: ' + params.vctinicio + ' a ' + params.vctfinal +                              
                               (params.status == 1 ? ' Pagto: ' + params.paginicio + ' a ' + params.pagfinal : ''),
                        fontSize: 8,
                        bold: true,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },
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
                        text: 'Nome',
                        style: 'tableHeader'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'								
                    }
                ]
            );
//select FINANCEIROS_ID_PESSOAS, PESSOAS_NOME, sum(FINANCEIROS_ORIGINAL) as TOTALPESSOA
            for(let i in dados){
                rows.push([
                    {
                        text: dados[i]['FINANCEIROS_ID_PESSOAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['PESSOAS_NOME'],
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['TOTALPESSOA']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	
                totalGeral += cents(dados[i]['TOTALPESSOA']);
            }

            rows.push([
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    style: 'tableExample',
                    colSpan: 2,
                    border: [false, false, false, false]
                },{},
                {
                    text: utils.number.float2moeda(totalGeral / 100),
                    alignment: 'right',
                    style: 'tableExample'
                }
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    let sqlPessoa    = '';
    let sqlPortador  = (params.porinicio && params.porfinal) ? `and FINANCEIROS_ID_PORTADORES between ${params.porinicio} and  ${params.porfinal} `  : '';
    let sqlAplicacao = (params.aplinicio && params.aplfinal) ? `and FINANCEIROS_ID_APLICACOES between ${params.aplinicio} and  ${params.aplfinal} `  : '';
    let sqlCusto     = (params.cusinicio && params.cusfinal) ? `and FINANCEIROS_ID_CUSTOS between ${params.cusinicio} and  ${params.cusfinal} `  : '';
    if (params.pesinicio > 0 ) {
        sqlPessoa  = ` and FINANCEIROS_ID_PESSOAS IN (
          SELECT P2.PESSOAS_ID
          FROM PESSOAS P1
          JOIN PESSOAS P2 
              ON SUBSTRING(P2.PESSOAS_CPFCNPJ FROM 1 FOR 8) = SUBSTRING(P1.PESSOAS_CPFCNPJ FROM 1 FOR 8)
          WHERE P1.PESSOAS_ID = ${params.pesinicio} ) `
    }     
    
    let sqlWhere = `where FINANCEIROS_ID > 0 and FINANCEIROS_ID_EMPRESAS = ${params.empresa}
                                             and FINANCEIROS_TIPO = '${params.tipo}'
                    ${sqlPessoa} 
                    ${sqlPortador} 
                    ${sqlAplicacao} 
                    ${sqlCusto} `;

    if (params.emiinicio && params.emifinal && params.emiinicio != 'Data inválida' && params.emifinal != 'Data inválida') {
        sqlWhere += ` and FINANCEIROS_EMISSAO between '${params.emiinicio.replace (/\//ig,'.')}' and '${params.emifinal.replace (/\//ig,'.')}' `;
    }

    if (params.vctinicio && params.vctfinal && params.vctinicio != 'Data inválida' && params.vctinicio != 'Data inválida') {
        sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${params.vctinicio.replace (/\//ig,'.')}' and '${params.vctfinal.replace (/\//ig,'.')}' `;
    }    

    if (params.paginicio && params.pagfinal && params.paginicio != 'Data inválida' && params.pagfinal != 'Data inválida') {
        sqlWhere += ` and FINANCEIROS_PAGAMENTO between '${params.paginicio.replace (/\//ig,'.')}' and '${params.pagfinal.replace (/\//ig,'.')}' `;
    }    

    if(params.status == 0) {
        if(params.database && params.database != 'Data inválida') {
            sqlWhere += ` and ((FINANCEIROS_STATUS = 'A') or (FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO > '${params.database.replace (/\//ig,'.')}')) `;
        } else {
            sqlWhere += ` and FINANCEIROS_STATUS = 'A' `;
        }
    } else if(params.status == 1) {
        if(params.database && params.database != 'Data inválida' ) {
            sqlWhere += ` and FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO <= '${params.database.replace (/\//ig,'.')}')) `;
        } else {
            sqlWhere += ` and FINANCEIROS_STATUS = 'P' `; 
        }
    } 

    return new Promise(async (resolve, reject) => {
		let sql = `select FINANCEIROS_ID_PESSOAS, PESSOAS_NOME, sum(FINANCEIROS_ORIGINAL) as TOTALPESSOA
                     from FINANCEIROS
                   left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                   ${sqlWhere}
                   group by FINANCEIROS_ID_PESSOAS, PESSOAS_NOME
                   order by PESSOAS_NOME`;

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