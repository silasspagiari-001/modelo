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
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: { //   NUM SER EMI OPE D/C QTP VLP VLT PES // 9 Cols
                            widths:  [25, 15, 18, 18, 20, 20, 50, 40, 40],
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
                        colSpan: 3,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Relação de Recebimento em cartão',
                        colSpan: 5,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},
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
                        text: 'Periodo: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 5,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],
                [
                    {
                        text: 'Numero',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 2	
                    },{},
                    {
                        text: 'Sér',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Operadora',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },                  
                    {
                        text: 'Déb/Cre',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Parcelas',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Valor Parcela',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Valor Total',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                ]
            );

            let totalDebito  = 0;
            let totalCredito = 0;

            for(let i in dados){

                rows.push([
                    {
                        text: dados[i]['CARTOES_ORIGEM'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['CARTOES_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: moment(dados[i]['CARTOES_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },	
                    {
                        text: dados[i]['OPERADORAS_NOME'].slice(0, 30),
                        alignment: 'left',
                        style: 'tableExample'
                    },			
                    {
                        text: dados[i]['CARTOES_PARCELAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },			
                    {
                        text: utils.number.float2moeda(((cents(dados[i]['CARTOES_VALOR']) / dados[i]['CARTOES_PARCELAS'])/100)),
                        alignment: 'right',
                        style: 'tableExample'
                    },			
                    {
                        text: utils.number.float2moeda(dados[i]['CARTOES_VALOR']),
                        alignment: 'right',
                        style: 'tableExample'
                    },			
                    {
                        text: dados[i]['PESSOAS_NOME'].slice(0, 23),
                        alignment: 'left',
                        style: 'tableExample'
                    }
                ]);
            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    const { 
        operadora, 
        inicio, 
        final, 
        status,
        empresaLogada, 
    } = params;

    return new Promise(async (resolve, reject) => {

/*
                        table: { //   NUM SER EMI OPE D/C QTP VLP VLT PES // 9 Cols
                            widths:  [25, 15, 18, 18, 20, 20, 50, 40, 40],


*/

		let sql = `
                select CARTOES_ID,
                       CARTOES_ORIGEM,
                       CARTOES_SERIE,
                       CARTOES_PARCELAS,
                       CARTOES_EMISSAO,
                       OPERADORAS_NOME,
                       CARTOES_TIPO,
                       CARTOES_PARCELAS,
                       CARTOES_VALOR,
                       PESSOAS_NOME

                from CARTOES
                left outer join MOVIMENTOS on MOVIMENTOS_ID = CARTOES_ID_MOVIMENTOS
                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
                where CARTOES_ID_EMPRESAS = ${empresaLogada} and
                    CARTOES_EMISSAO between '${inicio}' and '${final}' and
                    ${sqlCartao}
                order by ${sqlOrder}`

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

const obterParciais = function(db, params) {
    const { 
        financeiro, 
        inicio, 
        final, 
        empresaLogada, 
        idUsuarioi, 
        idUsuariof, 
        idPortadori, 
        idPortadorf, 
        quebra
    } = params;

    return new Promise(async (resolve, reject) => {
        const sqlTipo = financeiro == 1 ? 'R' : 'P' ;
        const sqlOrder = quebra == 1 ? `FINANCEIROS_ID_USUARIOS,FINANCEIROS_PAGAMENTO,FINANCEIROS_NUMERO` 
                                     : `FINANCEIROS_PAGAMENTO,FINANCEIROS_NUMERO`;
		let sql = `
                select FINANCEIROS_NUMERO,
                       FINANCEIROS_SERIE,
                       FINANCEIROS_PARCELA,
                       FINANCEIROS_PAGO,                       
                       FINANCEIROS_VENCIMENTO,
                       FINANCEIROS_PAGAMENTO,
                       FINANCEIROSITENS_EMISSAO,
                       FINANCEIROSITENS_DESCONTOS,
                       FINANCEIROSITENS_JUROS,
                       FINANCEIROSITENS_TAXAS,
                       FINANCEIROSITENS_VALOR,
                       FINANCEIROSITENS_DEBITACREDITA,
                       FINANCEIROS_ID_PESSOAS,
                       PESSOAS_NOME,
                       FINANCEIROS_ID_USUARIOS,
                       USUARIOS_NOME,
                       FINANCEIROS_ID_APLICACOES,
                       APLICACOES_NOME

                from FINANCEIROSITENS
                join FINANCEIROS on FINANCEIROS_ID = FINANCEIROSITENS_ID_FINANCEIROS
                join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                join USUARIOS on USUARIOS_ID = FINANCEIROS_ID_USUARIOS
                join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
                where FINANCEIROS_ID_EMPRESAS = ${empresaLogada} and
                    FINANCEIROS_TIPO = '${sqlTipo}' and
                    FINANCEIROSITENS_EMISSAO between '${inicio}' and '${final}' and
                    FINANCEIROS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                    FINANCEIROS_ID_PORTADORES between ${idPortadori} and ${idPortadorf} and
                    FINANCEIROS_ORIGINAL <> (FINANCEIROSITENS_VALOR + FINANCEIROSITENS_TAXAS)
                order by ${sqlOrder}`

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

const checarParciais = function(db, id) {

    return new Promise(async (resolve, reject) => {
		let sql = `
                select FINANCEIROSITENS_ID from FINANCEIROSITENS
                where FINANCEIROSITENS_ID_FINANCEIROS = ${id}`

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