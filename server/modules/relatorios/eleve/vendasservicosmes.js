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
            const dadosEq = await obterDadosEquip(db, params); // Resumo por equipamento
            const dadosOp = await obterDadosOpera(db, params); // Resumo por Operador

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [  // OS DT EQ OP PE VS NF IR IS VL // 10 Cols
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [40, 60, 70, 60, '*', 60, 60, 50, 50, 50],
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
                        margin: [15, 10]
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 9,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 9,
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
                        text: `VENDA DE SERVIÇOS MÊS`,
                        colSpan: 6,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        colSpan: 2,
                        border: [false, false, false, false]
                    },{}
                ],
                [
                    {							
                        text: '',
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 6,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],
                [
                    {
                        text: 'Nº OS',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Data',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Equipamento',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Cliente',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor Serviço',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Nº N.FISCAL',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: '$ Liquido',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Observações',
                        style: 'tableHeader',
                        alignment: 'center',
                        colSpan: 2
                    },{}
                ]
            );

            rows.push([
                {
                    text: '\n',
                    colSpan: 10,
                    border: [false, false, false, false]
                },{},{},{},{},{},{},{},{},{}
            ]);

            rows.push([
                {
                    text: 'RESUMO EQUIPAMENTOS',
                    fontSize: 12,
                    bold: true,
                    colSpan: 4,
                    alignment: 'center',
                    style: 'tableExample'
                },{},{},{},
                {
                    text: '',
                    border: [false, false, false, false]
                },
                {
                    text: 'RESUMO OPERADORES',
                    colSpan: 4,
                    fontSize: 12,
                    bold: true,
                    alignment: 'center',
                    style: 'tableExample'
                },{},{},{},
                {
                    text: '',
                    border: [false, false, false, false]
                }
            ])      
            
            let totalEquip = 0;
            let totalOpera = 0;

            let iterarModel = (dadosEq || []).length > (dadosOp || []).length ? dadosEq : dadosOp;

            for(let i in iterarModel) {

                let modelEq = dadosEq[i];
                let modelOp = dadosOp[i];

                rows.push([
                    {
                        text: modelEq ? modelEq['SERVICOS_NOME'] : '',
                        colSpan: 2,
                        alignment: 'left',
                        style: 'tableExample'
                    },{},						
                    {
                        text: modelEq ? utils.number.float2moeda(modelEq['SERVICOS_TOTAL']) : '',
                        colSpan: 2,
                        alignment: 'right',
                        style: 'tableExample'
                    },{},
                    {
                        text: '',
                        border: [false, false, false, false]
                    },
                    {
                        text: modelOp ? modelOp['USUARIOS_NOME'].split(' ')[0] : '',
                        colSpan: 2,
                        alignment: 'left',
                        style: 'tableExample'
                    },{},						
                    {
                        text: modelOp ? utils.number.float2moeda(modelOp['USUARIOS_TOTAL']) : '',
                        colSpan: 2,
                        alignment: 'right',
                        style: 'tableExample'
                    },{},
                    {
                        text: '',
                        border: [false, false, false, false]
                    }
                ]);

                totalEquip += modelEq ? cents(modelEq['SERVICOS_TOTAL']) : 0;
                totalOpera += modelOp ? cents(modelOp['USUARIOS_TOTAL']) : 0;
    
            }

            rows.push([
                {
                    text: 'TOTAL EQUIPAMENTOS',
                    fontSize: 10,
                    bold: true,
                    colSpan: 2,
                    alignment: 'right',
                    style: 'tableExample'
                },{},						
                {
                    text: utils.number.float2moeda(totalEquip / 100),
                    fontSize: 12,
                    bold: true,
                    colSpan: 2,
                    alignment: 'right',
                    style: 'tableExample'
                },{},
                {
                    text: '',
                    border: [false, false, false, false]
                },
                {
                    text: 'TOTAL OPERADORES',
                    fontSize: 10,
                    bold: true,
                    colSpan: 2,
                    alignment: 'right',
                    style: 'tableExample'
                },{},						
                {
                    text: utils.number.float2moeda(totalOpera / 100),
                    fontSize: 12,
                    bold: true,
                    colSpan: 2,
                    alignment: 'right',
                    style: 'tableExample'
                },{},
                {
                    text: '',
                    border: [false, false, false, false]
                }
            ]);

            rows.push([
                {
                    text: '\n',
                    colSpan: 10,
                    border: [false, false, false, false]
                },{},{},{},{},{},{},{},{},{}
            ]);
            // inversão - o começo agora vai ficar aqui embaixo

            rows.push([
                {
                    text: 'Nº OS',
                    style: 'tableHeader',
                    alignment: 'center'									
                },
                {
                    text: 'Data',
                    style: 'tableHeader',
                    alignment: 'center'	
                },
                {
                    text: 'Equipamento',
                    style: 'tableHeader',
                    alignment: 'center'	
                },
                {
                    text: 'Nome',
                    style: 'tableHeader',
                    alignment: 'center'	
                },
                {
                    text: 'Cliente',
                    style: 'tableHeader',
                    alignment: 'center'
                },
                {
                    text: 'Valor Serviço',
                    style: 'tableHeader',
                    alignment: 'center'
                },
                {
                    text: 'Nº N.FISCAL',
                    style: 'tableHeader',
                    alignment: 'center'									
                },
                {
                    text: '$ Liquido',
                    style: 'tableHeader',
                    alignment: 'center'
                },
                {
                    text: 'Observações',
                    style: 'tableHeader',
                    alignment: 'center',
                    colSpan: 2
                },{}
            ]);

            for(let i in dados){
                let model = dados[i];

                let temNFS        = cents(model['ORDENS_NUMEROORIGEM']) > 0;
                let valorServico  = (cents(dados[i]['ORDENSSERVICOS_TOTAL']) / 100);
                let valorRetencao = temNFS ? (((cents(dados[i]['ORDENSSERVICOS_TOTAL']) * cents(dados[i]['PESSOAS_CREDITO'])) * 11) / 100000000) : 0;
                let valorISS      = temNFS ? ((cents(dados[i]['ORDENSSERVICOS_TOTAL']) * 5) / 10000) : 0;
                let valorLiquido  = valorServico - valorRetencao - valorISS;

                rows.push([
                    {
                        text: model['ORDENS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: moment(model['ORDENS_REABERTURA']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: model['SERVICOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: model['USUARIOS_NOME'].split(' ')[0],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: model['PESSOAS_NOME'].slice(0, 40),
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(valorServico),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: model['ORDENS_NUMEROORIGEM'],
                        alignment: 'right',
                        style: 'tableExample'                        
                    },
                    {
                        text: utils.number.float2moeda(valorLiquido),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: model['FINANCEIROS_OBSERVACOES'],
                        colSpan: 2,
                        style: 'tableExample'                        
                    },{}
                ]);	                
            }

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        inicio, 
        final, 
        empresaLogada, 
        idPessoai
    } = params;

    let sqlPessoa = idPessoai > 0 ? `ORDENS_ID_PESSOAS = ${idPessoai} and ` : '';

    return new Promise(async (resolve, reject) => {
		let sql = `
                select ORDENS_NUMERO,
                       ORDENS_SERIE,
                       ORDENS_EMISSAO,
                       ORDENS_REABERTURA,
                       ORDENS_NUMEROORIGEM,
                       ORDENS_ID_PESSOAS,                       
                       PESSOAS_NOME,
                       PESSOAS_CREDITO,
                       USUARIOS_NOME,
                       ORDENSSERVICOS_TOTAL,
                       ORDENSSERVICOS_ISS,
                       ORDENSSERVICOS_ID_USUARIOS,
                       ORDENS_OBSERVACOES,
                       SERVICOS_NOME, 
                       FINANCEIROS_OBSERVACOES
                from ORDENS
                join PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                join ORDENSSERVICOS on ORDENSSERVICOS_ID_ORDENS = ORDENS_ID
                left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                left outer join FINANCEIROS on FINANCEIROS_ID_ORDENS = ORDENS_ID
                join USUARIOS on USUARIOS_ID = ORDENSSERVICOS_ID_USUARIOS
                where ORDENS_ID_EMPRESAS = ${empresaLogada} and
                    ORDENS_ID_DOCUMENTOS = ${empresaLogada}0007 and
                    ORDENS_REABERTURA between '${inicio}' and '${final}' and
                    ${sqlPessoa}
                    ORDENS_STATUS <> 'C'
                order by ORDENS_NUMERO`

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

const obterDadosEquip = function(db, params) { // Resumo por equipamento
    const { 
        inicio, 
        final, 
        empresaLogada, 
        idPessoai
    } = params;

    let sqlPessoa = idPessoai > 0 ? `ORDENS_ID_PESSOAS = ${idPessoai} and ` : '';

    return new Promise(async (resolve, reject) => {
		let sql = `
                select ORDENSSERVICOS_ID_SERVICOS,
                       SERVICOS_NOME,
                       sum(ORDENSSERVICOS_TOTAL) as SERVICOS_TOTAL
                from ORDENS
                join PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                join ORDENSSERVICOS on ORDENSSERVICOS_ID_ORDENS = ORDENS_ID
                left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                join USUARIOS on USUARIOS_ID = ORDENSSERVICOS_ID_USUARIOS
                where ORDENS_ID_EMPRESAS = ${empresaLogada} and
                    ORDENS_ID_DOCUMENTOS = ${empresaLogada}0007 and
                    ORDENS_REABERTURA between '${inicio}' and '${final}' and
                    ${sqlPessoa}
                    ORDENS_STATUS <> 'C'
                group by ORDENSSERVICOS_ID_SERVICOS, SERVICOS_NOME`

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

const obterDadosOpera = function(db, params) { // Resumo por operador
    const { 
        inicio, 
        final, 
        empresaLogada, 
        idPessoai
    } = params;

    let sqlPessoa = idPessoai > 0 ? `ORDENS_ID_PESSOAS = ${idPessoai} and ` : '';

    return new Promise(async (resolve, reject) => {

        let sql = `
                select ORDENSSERVICOS_ID_USUARIOS,
                    USUARIOS_NOME,
                    sum(ORDENSSERVICOS_TOTAL) as USUARIOS_TOTAL
                from ORDENS
                join PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
                join ORDENSSERVICOS on ORDENSSERVICOS_ID_ORDENS = ORDENS_ID
                left outer join SERVICOS on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                join USUARIOS on USUARIOS_ID = ORDENSSERVICOS_ID_USUARIOS
                where ORDENS_ID_EMPRESAS = ${empresaLogada} and
                    ORDENS_ID_DOCUMENTOS = ${empresaLogada}0007 and
                    ORDENS_REABERTURA between '${inicio}' and '${final}' and
                    ${sqlPessoa}
                    ORDENS_STATUS <> 'C'
                group by ORDENSSERVICOS_ID_USUARIOS, USUARIOS_NOME`

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