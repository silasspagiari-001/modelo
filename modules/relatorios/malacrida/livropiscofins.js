'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
            
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);
		    let docDefinition = {};
            let totalNfe = 0;
            let totalPis  = 0;
            let totalCofins = 0;

            let geralNfe = 0;
            let geralPis  = 0;
            let geralCofins = 0;

            let rows;

            docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [20, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{},{}]},  // 12 cols
                    {
                        style: 'tableExample',
                        table: {   // CD  DES QTD TOT CSP BCP PEP VLP CSC BCC PEC VLC
                            widths:  [40, 130, 20, 60, 20, 30, 25, 30, 20, 30, 25, 30],
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
                        margin: [40, 10]
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

            rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            let docAnt = 0;
            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: `Livro PIS/COFINS - ${params.tipo == 0 ? 'ENTRADAS' : 'SAIDAS'}`,
                        colSpan: 10,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},{},
                    {
                        text: '',
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
                        text: `Período: ${params.mes}/${params.ano} a ${params.ate}/${params.ano}`,
                        colSpan: 9,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ]
            );

            for(let i in dados){
                if(docAnt != dados[i]['MOVIMENTOS_NUMERO']) {

                    if(totalNfe > 0) {
                        rows.push([
                            {
                                text: 'TOTAL NFE:',
                                alignment: 'right',
                                colSpan: 3,
                                bold: true,
                                border: [false, false, false, false]
                            },{},{},
                            {
                                text: utils.number.float2moeda(totalNfe / 100),
                                alignment: 'right',
                                fontSize: 8,                        
                                bold: true,
                                border: [false, false, false, false]                                    
                            },
                            {
                                text: utils.number.float2moeda(totalPis / 100),
                                colSpan: 4,
                                alignment: 'right',
                                fontSize: 8,                        
                                bold: true,
                                border: [false, false, false, false]                                    
                            },{},{},{},
                            {
                                text: utils.number.float2moeda(totalCofins / 100),
                                colSpan: 4,
                                alignment: 'right',
                                fontSize: 8,                        
                                bold: true,
                                border: [false, false, false, false]                                    
                            },{},{},{}
                        ]);   
                        totalNfe = 0;
                        totalPis  = 0;
                        totalCofins = 0;                                                                
                    }

                    rows.push(		
                        [
                            {
                                text: '\n',
                                colSpan: 12,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{}
                        ]
                    );

                    rows.push(
                    [
                        {

                            colSpan: 12,
                            table: {
                                body: [
                                    [{ text: `NUMERO: ${dados[i]['MOVIMENTOS_NUMERO']} Sér: ${dados[i]['MOVIMENTOS_SERIE']} Pessoa: ${dados[i]['MOVIMENTOS_ID_PESSOAS']} ${dados[i]['PESSOAS_NOME'].slice(0, 30)} Emissão: ${moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')} Recepção: ${moment(dados[i]['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY')} Valor NF: ${utils.number.float2moeda(dados[i]['MOVIMENTOS_TOTAL'])}`}],
                                ]
                            },
                            layout: 'noBorders'
                        },{},{},{},{},{},{},{},{},{},{},{}

                    ]);

                    rows.push(		
                        [
                            {
                                text: 'CODIGO',
                                style: 'tableHeader',
                                alignment: 'center'									
                            },
                            {
                                text: 'DESCRICAO',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'QTDE',
                                style: 'tableHeader',
                                alignment: 'center'	
                            },
                            {
                                text: 'TOTAL',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'CstPIS',
                                style: 'tableHeader',
                                fontSize: 5,
                                alignment: 'center'
                            },
                            {
                                text: 'Bc PIS',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% PIS',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'R$ PIS',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'CstCOF',
                                style: 'tableHeader',
                                fontSize: 5,
                                alignment: 'center'
                            },
                            {
                                text: 'Bc COF',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: '% COF',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'R$ COF',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    );

                    docAnt = dados[i]['MOVIMENTOS_NUMERO'];
                }    

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },							
                    {
                        text: dados[i]['PRODUTOS_NOME'].slice(0, 30),
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['TOTAL_LIQUIDO']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_CSTPIS'],
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_BASEPIS']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_ALIQUOTAPIS']),
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_VALORPIS']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_CSTCOFINS'],
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_BASECOFINS']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_ALIQUOTACOFINS']),
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['MOVIMENTOSITENS_VALORCOFINS']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    }
                ]);	

                totalNfe    += cents(dados[i]['TOTAL_LIQUIDO']);
                totalPis    += cents(dados[i]['MOVIMENTOSITENS_VALORPIS']);
                totalCofins += cents(dados[i]['MOVIMENTOSITENS_VALORCOFINS']);
    
                geralNfe    += cents(dados[i]['TOTAL_LIQUIDO']);
                geralPis    += cents(dados[i]['MOVIMENTOSITENS_VALORPIS']);
                geralCofins += cents(dados[i]['MOVIMENTOSITENS_VALORCOFINS']);

            }
            
            rows.push([
                {
                    text: 'TOTAL NFE:',
                    alignment: 'right',
                    colSpan: 3,
                    bold: true,
                    border: [false, false, false, false]
                },{},{},
                {
                    text: utils.number.float2moeda(totalNfe / 100),
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },
                {
                    text: utils.number.float2moeda(totalPis / 100),
                    colSpan: 4,
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },{},{},{},
                {
                    text: utils.number.float2moeda(totalCofins / 100),
                    colSpan: 4,
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },{},{},{}
            ]);   
            
            rows.push([
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    colSpan: 3,
                    bold: true,
                    border: [false, false, false, false]
                },{},{},
                {
                    text: utils.number.float2moeda(geralNfe / 100),
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },
                {
                    text: utils.number.float2moeda(geralPis / 100),
                    colSpan: 4,
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },{},{},{},
                {
                    text: utils.number.float2moeda(geralCofins / 100),
                    colSpan: 4,
                    alignment: 'right',
                    fontSize: 8,                        
                    bold: true,
                    border: [false, false, false, false]                                    
                },{},{},{}
            ]);   

            pdfStream(docDefinition, resolve, reject);
        });
    }
};


const obterDados = async function(db, params) {

    const { 
        tipo,
        mes, 
        ate,
        ano, 
        empresaLogada 
    } = params;

//  let sqlDocumento    = tipo == 0 ? ` and right(MOVIMENTOS_ID_DOCUMENTOS, 2) IN ('03', '05') and MOVIMENTOS_ID_OPERACOES < 500000 ` : ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3) and MOVIMENTOS_ID_OPERACOES > 500000  `;


    let inicio = moment(`${ano}-${mes}-01`).format('YYYY-MM-DD'); // ajustar datas
    let final  = moment(`${ano}-${ate}-01`).endOf('month').format('YYYY-MM-DD');;
    let sqlDocumento = tipo == 0 ? `right(MOVIMENTOS_ID_DOCUMENTOS, 2) IN ('03', '05') and MOVIMENTOS_ID_OPERACOES < 500000 and ` : // Entrada
                                   `right(MOVIMENTOS_ID_DOCUMENTOS, 2) IN ('03', '05') and MOVIMENTOS_ID_OPERACOES > 500000 and `   // Saída

    let campoData = tipo == 0 ? `MOVIMENTOS_ENTRADASAIDA` : // Entrada
                                `MOVIMENTOS_EMISSAO`        // Saída


// antes da alteracao estava assim, mas nao estava batendo os valores                    
//                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,

   let sqlCstpis = ''
   if (tipo == 0) {
        sqlCstpis = `MOVIMENTOSITENS_CSTPIS`
   } else {
    sqlCstpis = `
    CASE 
      WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
      THEN '49'
      WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%' 
      THEN SUBSTRING(PRODUTOS_DESCRICAO FROM 1 FOR POSITION('|' IN PRODUTOS_DESCRICAO) - 1)
      ELSE ''
    END AS MOVIMENTOSITENS_CSTPIS`
   }

   let sqlCstcofins = ''
   if (tipo == 0) {
        sqlCstcofins = `MOVIMENTOSITENS_CSTCOFINS`
   } else {
    sqlCstcofins = `
    CASE 
        WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
        THEN '49'
        WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%|%'
        THEN SUBSTRING(
        PRODUTOS_DESCRICAO
        FROM POSITION('|' IN PRODUTOS_DESCRICAO) +
            POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1
        FOR POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM
                POSITION('|' IN PRODUTOS_DESCRICAO) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1)) - 1
        )
        ELSE ''
    END AS MOVIMENTOSITENS_CSTCOFINS`
   }

   let sqlAliqpis = ''
   if (tipo == 0) {
        sqlAliqpis = `MOVIMENTOSITENS_ALIQUOTAPIS`
   } else {
    sqlAliqpis = `
      CAST(
        CASE
            WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
            THEN '0'
            WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%|%'
            THEN SUBSTRING(
                PRODUTOS_DESCRICAO
                FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1
                FOR POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) - 1
                )
            ELSE '0'
        END
        AS NUMERIC(10,2)) AS MOVIMENTOSITENS_ALIQUOTAPIS`
   }
           
   let sqlAliqcofins = ''
   if (tipo == 0) {
        sqlAliqcofins = `MOVIMENTOSITENS_ALIQUOTACOFINS`
   } else {
    sqlAliqcofins = `
    CAST(
    CASE
        WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
        THEN '0'
        WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%|%'
        THEN
        SUBSTRING(
            PRODUTOS_DESCRICAO
            FROM POSITION('|' IN PRODUTOS_DESCRICAO) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM
                POSITION('|' IN PRODUTOS_DESCRICAO) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1)) + 1
            FOR POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM
                POSITION('|' IN PRODUTOS_DESCRICAO) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM
                POSITION('|' IN PRODUTOS_DESCRICAO) +
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1)) + 1
            )) - 1
        )
        ELSE '0'
    END
    AS NUMERIC(10,2)) AS MOVIMENTOSITENS_ALIQUOTACOFINS`
   }

   let sqlValorpis = ''
   if (tipo == 0) {
        sqlValorpis = `MOVIMENTOSITENS_VALORPIS`
   } else {
    sqlValorpis = `
    CAST(
        (CAST(
        CASE 
            WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
            THEN '0'
            WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%|%' 
            THEN SUBSTRING(
            PRODUTOS_DESCRICAO
            FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1
            FOR POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) - 1
            )
            ELSE '0'
        END
        AS NUMERIC(10,4)) / 100.0)
        *
        (CAST(((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS + MOVIMENTOSITENS_VALORIPI) - MOVIMENTOSITENS_DESCONTOS) AS NUMERIC(12,2))
        - COALESCE(MOVIMENTOSITENS_VALORICMS, 0))
        AS NUMERIC(12,2)) AS MOVIMENTOSITENS_VALORPIS`
   }


   let sqlValorcofins = ''
   if (tipo == 0) {
        sqlValorcofins = `MOVIMENTOSITENS_VALORCOFINS`
   } else {
    sqlValorcofins = `
    CAST(
    (CAST(
        CASE 
        WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
        THEN '0'
        WHEN COALESCE(PRODUTOS_DESCRICAO, '') LIKE '%|%|%|%|%' 
        THEN SUBSTRING(
            PRODUTOS_DESCRICAO
            FROM 
            POSITION('|' IN PRODUTOS_DESCRICAO) +
            POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 
            POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM 
                POSITION('|' IN PRODUTOS_DESCRICAO) + 
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1)) + 1
            FOR 
            POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM 
                POSITION('|' IN PRODUTOS_DESCRICAO) + 
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM 
                POSITION('|' IN PRODUTOS_DESCRICAO) + 
                POSITION('|' IN SUBSTRING(PRODUTOS_DESCRICAO FROM POSITION('|' IN PRODUTOS_DESCRICAO) + 1)) + 1)) + 1
            )) - 1
        )
        ELSE '0'
        END
        AS NUMERIC(10,4)) / 100.0)
        *
        (CAST(((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS + MOVIMENTOSITENS_VALORIPI) - MOVIMENTOSITENS_DESCONTOS) AS NUMERIC(12,2))
        - COALESCE(MOVIMENTOSITENS_VALORICMS, 0))
        AS NUMERIC(12,2)) AS MOVIMENTOSITENS_VALORCOFINS`
   }

            
   let sqlBasepis = ''
   if (tipo == 0) {
        sqlBasepis = `MOVIMENTOSITENS_BASEPIS`
   } else {
    sqlBasepis = `
    CASE
    WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
    THEN '0'
    ELSE
    CAST((CAST(((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS + MOVIMENTOSITENS_VALORIPI) - MOVIMENTOSITENS_DESCONTOS) AS NUMERIC(12,2))
        - COALESCE(MOVIMENTOSITENS_VALORICMS, 0))
        AS NUMERIC(12,2)) 
    END AS MOVIMENTOSITENS_BASEPIS`
   }

   let sqlBasecofins = ''
   if (tipo == 0) {
        sqlBasecofins = `MOVIMENTOSITENS_BASECOFINS`
   } else {
    sqlBasecofins = `
    CASE
    WHEN SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) SIMILAR TO '(5949|6949|6556|5918|5917|5552|6551|5910|5556|5406|5551)'
    THEN '0'
    ELSE
    CAST((CAST(((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS + MOVIMENTOSITENS_VALORIPI) - MOVIMENTOSITENS_DESCONTOS) AS NUMERIC(12,2))
        - COALESCE(MOVIMENTOSITENS_VALORICMS, 0))
        AS NUMERIC(12,2)) 
    END AS MOVIMENTOSITENS_BASECOFINS`
   }

    let sql = `
            SELECT ${sqlCstpis},${sqlCstcofins},${sqlAliqpis},${sqlAliqcofins},${sqlValorpis},${sqlValorcofins},${sqlBasepis},${sqlBasecofins},
            SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) AS MOVIMENTOSITENS_ID_OPERACOES,
            MOVIMENTOS_ID_USUARIOS,
            USUARIOS_NOME,
            MOVIMENTOS_NUMERO,
            MOVIMENTOS_SERIE,
            MOVIMENTOS_EMISSAO,
            MOVIMENTOS_ENTRADASAIDA,
            MOVIMENTOS_ID_PESSOAS,
            MOVIMENTOS_TOTAL,
            MOVIMENTOSITENS_ID_PRODUTOS,
            PRODUTOS_NOME,
            MOVIMENTOSITENS_QUANTIDADE,
            cast((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_FRETE + MOVIMENTOSITENS_SEGURO + MOVIMENTOSITENS_DESPESAS + MOVIMENTOSITENS_VALORIPI - MOVIMENTOSITENS_DESCONTOS + MOVIMENTOSITENS_VALORST) as numeric(12,2)) as TOTAL_LIQUIDO,            
            PESSOAS_NOME
            FROM MOVIMENTOS
            LEFT JOIN MOVIMENTOSITENS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            LEFT JOIN PESSOAS ON PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            LEFT JOIN USUARIOS ON USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
            LEFT JOIN PRODUTOS ON PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
            WHERE MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                MOVIMENTOS_STATUS NOT IN ('C', 'D', 'R') and                
                ${sqlDocumento}
                ${campoData} between '${inicio}' AND '${final}'
            order by 
            ${campoData},
            MOVIMENTOS_NUMERO,
            MOVIMENTOS_SERIE,
            MOVIMENTOS_ID_PESSOAS,
            PESSOAS_NOME`;

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