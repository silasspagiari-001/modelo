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
                        table: {
                            widths:  [30, 25, 100, 100, 20, 70, 70, 30, 30],
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
                        fontSize: 8,
                        margin: [0, 0, 0, 0],
                        border: 0
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 8,
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
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Relação de Vendas por Vendedor Sintética',
                        colSpan: 5,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false]
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
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 5,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],												
                [
                    {
                        text: 'Código',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Nome do Vendedor',
                        colSpan: 2,
                        style: 'tableHeader',
                        alignment: 'center'	
                    },{},
                    {
                        text: 'Cidade',
                        style: 'tableHeader',
                        alignment: 'center',
                    },
                    {
                        text: 'Uf',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor ST',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: '% SFAT',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Régua',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            const totalVista     = dados.reduce((total, item) => total += cents(item['AVISTA']),    0);
            const totalPrazo     = dados.reduce((total, item) => total += cents(item['APRAZO']),    0);
            const totalVendido   = totalVista + totalPrazo;
            const totalSt        = dados.reduce((total, item) => total += cents(item['ST']),        0);

            let regua = 0;

            for(let i in dados){
                const avista    = cents(dados[i]['AVISTA']);
                const aprazo    = cents(dados[i]['APRAZO']);
                const vendido   = avista + aprazo;
                const st        = cents(dados[i]['ST']);

                const margem = (100 - ((vendido / totalVendido) * 100));
                const fat    = (vendido / totalVendido) * 100;
                
                regua = regua + ((vendido / totalVendido) * 100);

                rows.push([
                    {
                        text: dados[i]['CODIGO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['NOME'],
                        colSpan: 2,
                        alignment: 'left',
                        style: 'tableExample'
                    },{},
                    {
                        text: dados[i]['MUNICIPIO'],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['UF'],
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(vendido / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(st / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(fat),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(regua),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	
            }

            rows.push([
                {
                    text: 'Total',
                    alignment: 'right',
                    bold: true,
                    colSpan: 5,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},{},
                {
                    text: utils.number.float2moeda(totalVendido / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: utils.number.float2moeda(totalSt / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: utils.number.float2moeda(0),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: utils.number.float2moeda(0),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                }
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        documento, 
        status,
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

    let sqlNfe = params.nfe == 1 ? `MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' and ` :      // Com nfe
    params.nfe == 2 ? `MOVIMENTOS_SERIEORIGEM <> 'NE' and ` : ' '  // Sem nfe


    return new Promise(async (resolve, reject) => {
		let sql = `execute block returns (
            CODIGO INTEGER,
            NOME VARCHAR(50),
            MUNICIPIO VARCHAR(50),
            UF VARCHAR(2),
            AVISTA numeric(12,2),
            APRAZO numeric(12,2),
            ST numeric(12,2),
            TOTAL numeric(12,2)
          ) as
          declare variable V_CODIGO integer;
          declare variable V_NOME varchar(50);
          declare variable V_MUNICIPIO varchar(50);
          declare variable V_UF varchar(2);
          declare variable V_OPERACOESACAO varchar(2);
          declare variable V_MOVIMENTOSITENSTOTAL numeric(12,2);
          declare variable V_AVISTA numeric(12,2);
          declare variable V_APRAZO numeric(12,2);
          declare variable V_PRAZO integer;
          declare variable V_ST numeric(12,2);
          begin 
            V_AVISTA    = 0;
            V_APRAZO    = 0;
            V_ST        = 0;
            for
              select USUARIOS_ID, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO from USUARIOS
              join CIDADES on CIDADES_ID = USUARIOS_ID_CIDADES
              where  USUARIOS_ID between ${idUsuarioi} and ${idUsuariof}
              order by USUARIOS_ID
            into
              :V_CODIGO,
              :V_NOME,
              :V_MUNICIPIO,
              :V_UF
            do
              begin
              select sum(MOVIMENTOSITENS_TOTAL) as MOVIMENTOSITENS_TOTAL
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
              where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                    PRODUTOS_ID_GRUPOS between ${idGrupoi} and ${idGrupof} and
                    ${sqlNfe}                    
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                    MOVIMENTOS_ID_USUARIOS = :V_CODIGO and
                    MOVIMENTOS_ID_PRAZOS < 3 and
                    OPERACOES_ACAO = 'VN'
                into : V_AVISTA;
          
              select sum(MOVIMENTOSITENS_TOTAL) as MOVIMENTOSITENS_TOTAL
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
              where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                    PRODUTOS_ID_GRUPOS between ${idGrupoi} and ${idGrupof} and
                    ${sqlNfe}
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                    MOVIMENTOS_ID_USUARIOS = :V_CODIGO and
                    MOVIMENTOS_ID_PRAZOS > 9 and
                    OPERACOES_ACAO = 'VN'
                into : V_APRAZO;

              select sum(MOVIMENTOSITENS_VALORST) as MOVIMENTOSITENS_VALORST
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
              where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                    PRODUTOS_ID_GRUPOS between ${idGrupoi} and ${idGrupof} and
                    ${sqlNfe}
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                    MOVIMENTOS_ID_USUARIOS = :V_CODIGO and
                    MOVIMENTOS_ID_PRAZOS > 9 and
                    OPERACOES_ACAO = 'VN'
                into : V_ST;
                    
                CODIGO      = V_CODIGO;
                NOME        = V_NOME;
                MUNICIPIO   = V_MUNICIPIO;
                UF          = V_UF;
                AVISTA      = coalesce(V_AVISTA,0);
                APRAZO      = coalesce(V_APRAZO,0);
                ST          = coalesce(V_ST,0);
                TOTAL       = coalesce((AVISTA+APRAZO),0);
                if ((AVISTA + APRAZO) > 0)  then
                  suspend;
              end
          end ;`

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