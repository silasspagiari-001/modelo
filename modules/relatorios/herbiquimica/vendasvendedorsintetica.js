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
                    {columns: [{},{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [15, '*', '*', 50, 60, 60, 60, 35, 35, 35],
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
                        colSpan: 6,
                        bold: true,
                        fontSize: 18,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},
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
                        colSpan: 6,
                        fontSize: 8,
                        alignment: 'center',
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
                        text: 'Cód',
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
                        text: 'Devolvido',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'À Vista',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'À Prazo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Margem',
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
            const totalDevolvido = dados.reduce((total, item) => total += cents(item['DEVOLUCAO']), 0);
            const totalVendido   = totalVista + totalPrazo;

            let regua = 0;

            for(let i in dados){
                const avista    = cents(dados[i]['AVISTA']);
                const aprazo    = cents(dados[i]['APRAZO']);
                const devolvido = cents(dados[i]['DEVOLUCAO']);
                const vendido   = avista + aprazo;

                const margem = (100 - ((((vendido - devolvido)) / (totalVendido - totalDevolvido)) * 100));
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
                        text: utils.number.float2moeda(devolvido / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(avista / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(aprazo / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(vendido / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(margem),
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
                    text: 'Líquido',
                    alignment: 'right',
                    bold: true,
                    colSpan: 2,
                    style: 'tableExample'
                },{},					
                {
                    text: utils.number.float2moeda(totalVendido / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalDevolvido / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalVista / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalPrazo / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalVendido / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda((100 -((((totalVendido - totalDevolvido)) / (totalVendido - totalDevolvido)) * 100))),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(0),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(0),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample'
                }
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    const { 
        documento, 
        vacina,
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

    return new Promise(async (resolve, reject) => {
		let sql = `execute block returns (
            CODIGO INTEGER,
            NOME VARCHAR(50),
            DEVOLUCAO numeric(12,2),
            AVISTA numeric(12,2),
            APRAZO numeric(12,2),
            TOTAL numeric(12,2)
          ) as
          declare variable V_CODIGO integer;
          declare variable V_NOME varchar(50);
          declare variable V_OPERACOESACAO varchar(2);
          declare variable V_MOVIMENTOSITENSTOTAL numeric(12,2);
          declare variable V_AVISTA numeric(12,2);
          declare variable V_APRAZO numeric(12,2);
          declare variable V_DEVOLUCAO numeric(12,2);
          declare variable V_PRAZO integer;
          begin 
            V_AVISTA    = 0;
            V_APRAZO    = 0;
            V_DEVOLUCAO = 0;
            for
              select USUARIOS_ID,USUARIOS_NOME from USUARIOS
              where  USUARIOS_ID between ${idUsuarioi} and ${idUsuariof}
              order by USUARIOS_ID
            into
              :V_CODIGO,
              :V_NOME
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
                    ((MOVIMENTOS_STATUS <> 'C') and 
                     (MOVIMENTOS_STATUS <> 'D') and 
                     (MOVIMENTOS_STATUS <> 'R')) and
                    ${vacina == '1' ? ` PRODUTOS_DERIVADO <> 'V' and ` : ''}
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
                    ((MOVIMENTOS_STATUS <> 'C') and 
                     (MOVIMENTOS_STATUS <> 'D') and
                     (MOVIMENTOS_STATUS <> 'R')) and
                    ${vacina == '1' ? ` PRODUTOS_DERIVADO <> 'V' and ` : ''}
                    MOVIMENTOS_ID_USUARIOS = :V_CODIGO and
                    MOVIMENTOS_ID_PRAZOS > 9 and
                    OPERACOES_ACAO = 'VN'
                into : V_APRAZO;
          
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
                    ((MOVIMENTOS_STATUS <> 'C') and 
                     (MOVIMENTOS_STATUS <> 'D') and
                     (MOVIMENTOS_STATUS <> 'R')) and
                    ${vacina == '1' ? ` PRODUTOS_DERIVADO <> 'V' and ` : ''}
                    MOVIMENTOS_ID_USUARIOS = :V_CODIGO and
                    OPERACOES_ACAO = 'DC'
                into : V_DEVOLUCAO;
          
                CODIGO      = V_CODIGO;
                NOME        = V_NOME;
                DEVOLUCAO   = coalesce(V_DEVOLUCAO,0);
                AVISTA      = coalesce(V_AVISTA,0);
                APRAZO      = coalesce(V_APRAZO,0);
                TOTAL       = coalesce((AVISTA+APRAZO)-DEVOLUCAO,0);
                if ((DEVOLUCAO + AVISTA + APRAZO) > 0)  then
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