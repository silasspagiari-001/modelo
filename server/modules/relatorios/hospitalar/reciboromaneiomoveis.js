'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB = require('../../../services/samosFirebird');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [30, 30, 30, 30],
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: 'tableReport',
					table: {
						widths: [55, 37, 38, 40, 80, 40, 40, 40, 90],
						body: []
					}
				} 
			],
			styles: {
				tableReport: {
					margin: [0, 0, 0, 0],
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			api.financeiros().readById(params.id, params)
				.then(async res => {
					const db         = await samosFB.conectarBanco(params.client);                     
                    const rows       = docDefinition.content[1].table.body;
                    const titulo     = res.results[0];
                    const pagStatus  = titulo['FINANCEIROS_STATUS'];
                    const emissao    = titulo['FINANCEIROS_EMISSAO'];
                    const vencimento = titulo['FINANCEIROS_VENCIMENTO'];
                    const dataRecibo = (pagStatus == 'A' ? titulo['FINANCEIROS_VENCIMENTO'] : titulo['FINANCEIROS_PAGAMENTO']);
                    const pagTotal   = (pagStatus == 'A' ? titulo['FINANCEIROS_ABERTO'] : titulo['FINANCEIROS_PAGO']);
                    const cpfCnpj    = titulo['PESSOAS_CPFCNPJ'];
                    const obs        = titulo['FINANCEIROS_OBSERVACOES'];
                    const descricaoDocumento = (cpfCnpj.length == 11 ? 'CPF' : 'CNPJ');

                    if(titulo['PESSOAS_TIPO'] == 'O' || titulo['PESSOAS_TIPO'] == 'N') {  // Transportadores próprios ou MEI...
                        const entregas = await agruparEntregas(titulo['FINANCEIROS_ID_MOVIMENTOS'], db);
                        if(entregas.length > 0) {
                            gerarFinanceiroEntregas(params, emissao, vencimento, entregas);
                        } 
                        atualizarTitulo(params.id, titulo['PESSOAS_TIPO'], db);
                    }

                    rows.push([
                        {
                            text: 'RECIBO',
                            fontSize: 20, 
                            border: [true, true, false, true],
                            bold: true,
                            colSpan: 4,
                            alignment: 'left'
                        },{},{},{},
                        {
                            text: `N° ${titulo['FINANCEIROS_NUMERO']}`,
                            alignment: 'center',
                            fontSize: 17, 
                            border: [false, true, false, true],
                            bold: true
                        },
                        {
                            text: 'Valor',
                            colSpan: 3,
                            alignment: 'right',
                            fontSize: 17, 
                            border: [false, true, false, true],
                            bold: true
                        },{},{},
                        {
                            text: `R$ ${utils.number.float2moeda(pagTotal)}\n`,
                            alignment: 'right',
                            fontSize: 17, 
                            border: [false, true, true, true],
                            bold: true
                        }
                    ]);

                    rows.push([
                        {
                            text: '',
                            colSpan: 9,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Recebi(emos) de',
                            colSpan: 2,
                            fontSize: 12, 
                            border: [true, true, false, false],
                            bold: true,
                            alignment: 'left'
                        },{},
                        {
                            table: {
                                widths: [413],
                                body: [
                                    [
                                        {
                                            text: titulo['EMPRESAS_NOME'],
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 7,
                            fontSize: 12, 
                            border: [false, true, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'A quantia de',
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 523 ],
                                body: [
                                    [
                                        {
                                            text: utils.number.ValorPorExtenso(pagTotal),
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Correspondente a:',
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 523 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(0, 102) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 523 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(103, 205) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 523 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(206, 308) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            table: {
                                widths: [ 523 ],
                                heights: 15,
                                body: [
                                    [
                                        {
                                            text: obs && obs.toString ? obs.slice(309, 411) : '',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'e para clareza firmo(amos) o presente',
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: `${titulo['CIDADES_NOME']}, ${titulo['CIDADES_ESTADO']}, ${moment(dataRecibo).format('DD/MM/YYYY')}`,
                            colSpan: 9,
                            fontSize: 12, 
                            border: [true, false, true, false],
                            alignment: 'left'
                        },{},{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Assinatura',
                            fontSize: 11, 
                            border: [true, false, false, false],
                            bold: true,
                            alignment: 'left'
                        },
                        {
                            table: {
                                widths: [458],
                                body: [
                                    [
                                        {
                                            text: 'A\n',
                                            color: 'white',
                                            border: [false, false, false, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 8,
                            fontSize: 12, 
                            border: [false, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Nome',
                            fontSize: 11, 
                            border: [true, false, false, false],
                            bold: true,
                            alignment: 'left'
                        },
                        {
                            table: {
                                widths: [282],
                                body: [
                                    [
                                        {
                                            text: titulo['PESSOAS_NOME'],
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 5,
                            fontSize: 12, 
                            border: [false, false, false, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},
                        {
                            text: descricaoDocumento,
                            fontSize: 11, 
                            border: [false, false, false, false],
                            bold: true,
                            alignment: 'right'
                        },
                        {
                            table: {
                                widths: [128],
                                body: [
                                    [
                                        {
                                            text: utils.string.maskCnp(cpfCnpj),
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 2,
                            fontSize: 12, 
                            border: [false, false, true, false],
                            bold: true,
                            alignment: 'right'
                        },{}
                    ]);

                    rows.push([
                        {
                            text: 'Endereço',
                            fontSize: 11, 
                            border: [true, false, false, false],
                            bold: true,
                            alignment: 'left'
                        },
                        {
                            table: {
                                widths: [458],
                                body: [
                                    [
                                        {
                                            text: 'A',
                                            color: 'white',
                                            border: [true, true, true, true]
                                        }
                                    ]
                                ]
                            },
                            colSpan: 8,
                            fontSize: 12, 
                            border: [false, false, true, false],
                            bold: true,
                            alignment: 'left'
                        },{},{},{},{},{},{},{}
                    ]);											

                    rows.push([ 
                        {
                            text: 'Funcionário que imprimiu o recibo: ' + params.userId,
                            colSpan: 9,
                            border: [true, false, true, true]
                        },{},{},{},{},{},{},{},{}
                    ]);													

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	},
		
};

const agruparEntregas = async function(idOrigem, db) {

    const sqlSearch = `select MOVIMENTOS_ID_EMPRESAS as FINANCEIROS_ID_EMPRESAS,
                              ROMANEIOS_ID_PESSOAS as FINANCEIROS_ID_PESSOAS,
                              ROMANEIOS_ID, 
                              ROMANEIOS_NUMERO,
                              ROMANEIOS_SERIE,
                              ROMANEIOS_LOCAL,
                              sum(ROMANEIOSITENS_TOTAL) as FINANCEIROS_ABERTO from ROMANEIOSITENS                              
                         join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOSITENS_ID_MOVIMENTOS
                         join ROMANEIOS  on ROMANEIOS_ID = ROMANEIOSITENS_ID_ROMANEIOS
                         where ROMANEIOSITENS_ID_ROMANEIOS = ${idOrigem}
                          group by MOVIMENTOS_ID_EMPRESAS,
                                   ROMANEIOS_ID_PESSOAS,
                                   ROMANEIOS_ID,
                                   ROMANEIOS_NUMERO,
                                   ROMANEIOS_SERIE,
                                   ROMANEIOS_LOCAL`;

        return new Promise((resolve, reject) => {
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
    })
                        
};

const gerarFinanceiroEntregas = function(params, emissao, vencimento, entregas) {

    let titulos = [];
    let index = -2;
    let idAplicacao = entregas[0]['ROMANEIOS_LOCAL'].trim() == 'U' ? 561 : 562; 

    for(let i in entregas) {
        const model = entregas[i];
        let titulo = {
            'FINANCEIROS_ID'           : index,
            'FINANCEIROS_NUMERO'       : model['ROMANEIOS_NUMERO'], 
            'FINANCEIROS_SERIE'        : model['ROMANEIOS_SERIE'], 
            'FINANCEIROS_TIPO'         : 'P',
            'FINANCEIROS_ID_EMPRESAS'  : model['FINANCEIROS_ID_EMPRESAS'],
            'FINANCEIROS_ID_MOVIMENTOS': model['ROMANEIOS_ID'], 
            'FINANCEIROS_ID_DOCUMENTOS': parseInt(model['FINANCEIROS_ID_EMPRESAS'] + '0009'),
            'FINANCEIROS_ID_PESSOAS'   : model['FINANCEIROS_ID_PESSOAS'],
            'FINANCEIROS_ID_USUARIOS'  : params.userId,
            'FINANCEIROS_ID_PORTADORES': model['FINANCEIROS_ID_EMPRESAS'],
            'FINANCEIROS_ID_APLICACOES': idAplicacao,
            'FINANCEIROS_ID_PRAZOS':     45,
            'FINANCEIROS_PARCELA':       1,
            'FINANCEIROS_PARCELAS':      1,
            'FINANCEIROS_VENCIMENTO':    vencimento,
            'FINANCEIROS_EMISSAO':       emissao,
            'FINANCEIROS_BAIXA':         '1899-12-30',
            'FINANCEIROS_PAGAMENTO':     '1899-12-30',
            'FINANCEIROS_ORIGINAL':      model['FINANCEIROS_ABERTO'],
            'FINANCEIROS_ABERTO':        model['FINANCEIROS_ABERTO'],
            'FINANCEIROS_PAGO':          0,
            'FINANCEIROS_TOTAL':         model['FINANCEIROS_ABERTO'],
            'FINANCEIROS_STATUS':        'A',
            'FINANCEIROS_EXPORTADO':     'F',
            'FINANCEIROS_BOLETO':        moment(emissao).format('MMYYYY'),
            'FINANCEIROS_NOSSONUMERO':   0,
            'FINANCEIROS_ID_EMPRESAORIGEM': 0,
            'FINANCEIROS_NUMEROORIGEM'    : 0,                        
            'FINANCEIROS_SERIEORIGEM'     : ''
        };

        index--;
        titulos.push(titulo);
    }

    api.financeiros().lote.create(titulos, params);
                        
};

const atualizarTitulo = async function(idTitulo, tipoPessoa, db) {

    const sqlSearch = tipoPessoa == 'O' ? `update FINANCEIROS set FINANCEIROS_ID_EMPRESAS = 99,
                                                FINANCEIROS_ID_DOCUMENTOS = 990008,
                                                FINANCEIROS_SERIE = 'RM',
                                                FINANCEIROS_TIPO = 'R'
                         where FINANCEIROS_ID = ${idTitulo}`
                      :   
                        `delete from FINANCEIROS where FINANCEIROS_ID = ${idTitulo}`;

        return new Promise((resolve, reject) => {
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
    })
                        
};
