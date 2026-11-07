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
            const parciais = await obterParciais(db, params);

            const quebraPorUsuario = params.quebra == 1;

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: { //      NUM SER ORD  PES NOM APL VCT DTP DSC JUR TAX REC // 13 Cols
                            widths:  [1, 25, 18, 18, 20, 100, 50, 40, 40, 35, 35, 35, 40],
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
                    },{},{},
                    { 
                        text: 'Relação de Baixas - ' + (params.financeiro == 1 ? 'Receber' : 'Pagar'),
                        colSpan: 8,
                        fontSize: 14,
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
                        text: 'Referencia: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 9,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},{},{},
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
                        text: 'Ord',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Pes',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome Pessoa',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Aplicação',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Vencto',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Pagto',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Desc',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Juros',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Taxas',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Recebido',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totDescUsu = 0;
            let totDescGer = 0;
            let totJurUsu = 0;
            let totJurGer = 0;
            let totTaxUsu = 0;
            let totTaxGer = 0;            
            let totRecUsu = 0;
            let totRecGer = 0;

            for(let i in dados){

                const temParciais = await checarParciais(db, dados[i]['FINANCEIROS_ID'], params);

                if(temParciais.length > 1) { // Se tiver mais de uma lançamento parcial, imprime só as parciais
                    continue;
                }

                totDescUsu += cents(dados[i]['FINANCEIROS_DESCONTOS']);
                totDescGer += cents(dados[i]['FINANCEIROS_DESCONTOS']);
                totJurUsu  += cents(dados[i]['FINANCEIROS_JUROS']);
                totJurGer  += cents(dados[i]['FINANCEIROS_JUROS']);
                totTaxUsu  += cents(dados[i]['FINANCEIROS_TAXAS']);
                totTaxGer  += cents(dados[i]['FINANCEIROS_TAXAS']);            
                totRecUsu  += cents(dados[i]['FINANCEIROS_PAGO']);
                totRecGer  += cents(dados[i]['FINANCEIROS_PAGO']);                    

                if(quebraPorUsuario && (dados[i]['FINANCEIROS_ID_USUARIOS'] != (dados[parseInt(i) - 1] || {})['FINANCEIROS_ID_USUARIOS'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 13,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** VENDEDOR: ${dados[i]['FINANCEIROS_ID_USUARIOS']} - ${dados[i]['USUARIOS_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 13,
                            fontSize: 10,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: dados[i]['FINANCEIROS_NUMERO'],
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample'
                    },{},
                    {
                        text: dados[i]['FINANCEIROS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['FINANCEIROS_PARCELA'],
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: dados[i]['FINANCEIROS_ID_PESSOAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: dados[i]['PESSOAS_NOME'].slice(0, 23),
                        alignment: 'left',
                        style: 'tableExample'
                    },			
                    {
                        text: dados[i]['APLICACOES_NOME'].slice(0, 10),
                        alignment: 'left',
                        style: 'tableExample'
                    },			
                    {
                        text: moment(dados[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },	
                    {
                        text: moment(dados[i]['FINANCEIROS_PAGAMENTO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },	
                    {
                        text: utils.number.float2moeda(cents(dados[i]['FINANCEIROS_DESCONTOS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['FINANCEIROS_JUROS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['FINANCEIROS_TAXAS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['FINANCEIROS_PAGO']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                if(quebraPorUsuario && (dados[i]['FINANCEIROS_ID_USUARIOS'] != (dados[parseInt(i) + 1] || {})['FINANCEIROS_ID_USUARIOS'])) {
                    rows.push([
                        {
                            text: 'Total do Vendedor',
                            colSpan: 9,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totDescUsu / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totJurUsu / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totTaxUsu / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },
                        {
                            text: utils.number.float2moeda(totRecUsu / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }

                    ]);

                    totDescUsu = 0;
                    totJurUsu = 0;
                    totTaxUsu = 0;
                    totRecUsu = 0;
                }
            }

// Baixas parciais

            rows.push([
                {
                    text: `BAIXAS PARCIAIS`,
                    alignment: 'left',
                    colSpan: 13,
                    fontSize: 10,
                    bold: true,
                    border: [false, true, false, true],
                    style: 'tableExample'
                },{},{},{},{},{},{},{},{},{},{},{},{}
            ]);	

            for(let i in parciais){

                const valorLancamento = cents(parciais[i]['FINANCEIROSITENS_VALOR']) +
                                        cents(parciais[i]['FINANCEIROSITENS_JUROS']) - 
                                        cents(parciais[i]['FINANCEIROSITENS_TAXAS']) -
                                        cents(parciais[i]['FINANCEIROSITENS_DESCONTOS']);

                totDescGer += cents(parciais[i]['FINANCEIROSITENS_DESCONTOS']);
                totJurGer  += cents(parciais[i]['FINANCEIROSITENS_JUROS']);
                totTaxGer  += cents(parciais[i]['FINANCEIROSITENS_TAXAS']);            
                totRecGer  += valorLancamento;                    
                
                rows.push([
                    {
                        text: parciais[i]['FINANCEIROS_NUMERO'],
                        alignment: 'right',
                        colSpan: 2,
                        style: 'tableExample'
                    },{},
                    {
                        text: parciais[i]['FINANCEIROS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: parciais[i]['FINANCEIROS_PARCELA'],
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: parciais[i]['FINANCEIROS_ID_PESSOAS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: parciais[i]['PESSOAS_NOME'].slice(0, 23),
                        alignment: 'left',
                        style: 'tableExample'
                    },			
                    {
                        text: parciais[i]['APLICACOES_NOME'].slice(0, 10),
                        alignment: 'left',
                        style: 'tableExample'
                    },			
                    {
                        text: moment(parciais[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },	
                    {
                        text: moment(parciais[i]['FINANCEIROSITENS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },	
                    {
                        text: utils.number.float2moeda(cents(parciais[i]['FINANCEIROSITENS_DESCONTOS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(parciais[i]['FINANCEIROSITENS_JUROS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(parciais[i]['FINANCEIROSITENS_TAXAS']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(valorLancamento / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);
            }

// Fim das parciais

            rows.push([
                {
                    text: 'Total Geral',
                    colSpan: 9,
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totDescGer / 100),
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totJurGer / 100),
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totTaxGer / 100),
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totRecGer / 100),
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
                select FINANCEIROS_ID,
                       FINANCEIROS_NUMERO,
                       FINANCEIROS_SERIE,
                       FINANCEIROS_PARCELA,
                       FINANCEIROS_PAGO,                       
                       FINANCEIROS_VENCIMENTO,
                       FINANCEIROS_PAGAMENTO,
                       FINANCEIROS_DESCONTOS,
                       FINANCEIROS_JUROS,
                       FINANCEIROS_TAXAS,
                       FINANCEIROS_PAGO,
                       FINANCEIROS_ID_PESSOAS,
                       PESSOAS_NOME,
                       FINANCEIROS_ID_USUARIOS,
                       USUARIOS_NOME,
                       FINANCEIROS_ID_APLICACOES,
                       APLICACOES_NOME

                from FINANCEIROS
                join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                join USUARIOS on USUARIOS_ID = FINANCEIROS_ID_USUARIOS
                join APLICACOES on APLICACOES_ID = FINANCEIROS_ID_APLICACOES
                where FINANCEIROS_ID_EMPRESAS = ${empresaLogada} and
                    FINANCEIROS_TIPO = '${sqlTipo}' and
                    FINANCEIROS_PAGAMENTO between '${inicio}' and '${final}' and
                    FINANCEIROS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                    FINANCEIROS_ID_PORTADORES between ${idPortadori} and ${idPortadorf}
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