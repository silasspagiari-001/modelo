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
            const quebraPorPessoa = params.quebra == 1;

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [20, 12, 60, 40, '*', 32, 35],
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
                        colSpan: 2,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: `Relação de Vendas por Pessoa Analítica`,
                        colSpan: 5,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{}
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 3,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}
                ],												
                [
                    {
                        text: 'Docto',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'SE',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Vendedor',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Descrição',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalDocumento = 0;
            let totalPessoa = 0;
            let totalGeral = 0;

            for(let i in dados){
                totalDocumento += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                totalPessoa    += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                totalGeral     += cents(dados[i]['MOVIMENTOSITENS_TOTAL']);
                
                if(quebraPorPessoa && (dados[i]['MOVIMENTOS_ID_PESSOAS'] != (dados[parseInt(i) - 1] || {})['MOVIMENTOS_ID_PESSOAS'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 7,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** CLIENTE: ${dados[i]['MOVIMENTOS_ID_PESSOAS']} ${dados[i]['PESSOAS_NOME']} Município: ${dados[i]['CIDADES_NOME']}, ${dados[i]['CIDADES_ESTADO']} Operação: ${dados[i]['OPERACACOES_NOME'].slice(0, 20)} ******`,
                            alignment: 'center',
                            colSpan: 7,
                            fontSize: 8,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{}
                    ]);	
                }

                const docAnterior = dados[parseInt(i) - 1];

                rows.push([
                    {
                        text: docAnterior && docAnterior['MOVIMENTOS_NUMERO'] == dados[i]['MOVIMENTOS_NUMERO'] ? '' : dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: docAnterior && docAnterior['MOVIMENTOS_NUMERO'] == dados[i]['MOVIMENTOS_NUMERO'] ? '' : dados[i]['MOVIMENTOS_SERIE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: (docAnterior && docAnterior['MOVIMENTOS_NUMERO'] == dados[i]['MOVIMENTOS_NUMERO'] ? '' : dados[i]['USUARIOS_NOME']).slice(0, 13),
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: docAnterior && docAnterior['MOVIMENTOS_NUMERO'] == dados[i]['MOVIMENTOS_NUMERO'] ? '' : moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['MOVIMENTOSITENS_QUANTIDADE']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(cents(dados[i]['MOVIMENTOSITENS_TOTAL']) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	

                if(dados[i]['MOVIMENTOS_NUMERO'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_NUMERO']) {
                    rows.push([
                        {
                            text: '',
                            alignment: 'right',
                            colSpan: 4,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},						
                        {
                            text: 'Total do Documento',
                            colSpan: 2,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},
                        {
                            text: utils.number.float2moeda(totalDocumento / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);	

                    totalDocumento = 0;
                }

                if(quebraPorPessoa && (dados[i]['MOVIMENTOS_ID_PESSOAS'] != (dados[parseInt(i) + 1] || {})['MOVIMENTOS_ID_PESSOAS'])) {
                    rows.push([
                        {
                            text: '',
                            alignment: 'right',
                            colSpan: 4,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},							
                        {
                            text: 'Total da Pessoa',
                            colSpan: 2,
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},
                        {
                            text: utils.number.float2moeda(totalPessoa / 100),
                            alignment: 'right',
                            bold: true,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        }
                    ]);

                    totalPessoa = 0;
                }
            }

            rows.push([
                {
                    text: '',
                    alignment: 'right',
                    colSpan: 4,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},{},{},							
                {
                    text: 'Total Geral',
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    border: [false, false, false, false],
                    style: 'tableExample'
                },{},
                {
                    text: utils.number.float2moeda(totalGeral / 100),
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
        documento, 
        cidade,
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
            MOVIMENTOS_NUMERO INTEGER,
            MOVIMENTOS_SERIE VARCHAR(2),
            MOVIMENTOS_EMISSAO DATE,
            MOVIMENTOS_ID_PESSOAS INTEGER,
            PESSOAS_NOME VARCHAR(50),
            CIDADES_NOME VARCHAR(50),
            CIDADES_ESTADO VARCHAR(2),
            MOVIMENTOS_ID_USUARIOS INTEGER,
            USUARIOS_NOME VARCHAR(50),
            MOVIMENTOS_ID_PRAZOS INTEGER,
            PRAZOS_NOME VARCHAR(50),
            MOVIMENTOS_ID_OPERACOES INTEGER,
            OPERACACOES_NOME VARCHAR(50),
            MOVIMENTOSITENS_ID_PRODUTOS INTEGER,
            PRODUTOS_NOME VARCHAR(100),
            MOVIMENTOSITENS_QUANTIDADE numeric(12,2),
            SALDOS_CUSTO numeric(12,2),
            MOVIMENTOSITENS_PRECO numeric(12,2),
            MOVIMENTOSITENS_TOTAL numeric(12,2)
        ) as
        begin
            for
                select MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ID_PESSOAS,
                    PESSOAS_NOME,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    MOVIMENTOS_ID_USUARIOS,
                    USUARIOS_NOME,
                    MOVIMENTOS_ID_PRAZOS,
                    PRAZOS_NOME,
                    MOVIMENTOS_ID_OPERACOES,
                    OPERACOES_NOME,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_NOME,
                    MOVIMENTOSITENS_QUANTIDADE,
                    SALDOS_CUSTO,
                    MOVIMENTOSITENS_PRECO,
                    MOVIMENTOSITENS_TOTAL
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                join SALDOS on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    MOVIMENTOS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                    MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                    MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                    PRODUTOS_ID_GRUPOS between ${idGrupoi} and ${idGrupof} and
                    OPERACOES_ACAO = 'VN' and
                    ${cidade ? ` CIDADES_NOME LIKE '%${cidade}%' and ` : ''}
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                order by MOVIMENTOS_ID_USUARIOS,MOVIMENTOS_EMISSAO,MOVIMENTOS_NUMERO
                into
                    :MOVIMENTOS_NUMERO,
                    :MOVIMENTOS_SERIE,
                    :MOVIMENTOS_EMISSAO,
                    :MOVIMENTOS_ID_PESSOAS,
                    :PESSOAS_NOME,
                    :CIDADES_NOME,
                    :CIDADES_ESTADO,
                    :MOVIMENTOS_ID_USUARIOS,
                    :USUARIOS_NOME,
                    :MOVIMENTOS_ID_PRAZOS,
                    :PRAZOS_NOME,
                    :MOVIMENTOS_ID_OPERACOES,
                    :OPERACACOES_NOME,
                    :MOVIMENTOSITENS_ID_PRODUTOS,
                    :PRODUTOS_NOME,
                    :MOVIMENTOSITENS_QUANTIDADE,
                    :SALDOS_CUSTO,
                    :MOVIMENTOSITENS_PRECO,
                    :MOVIMENTOSITENS_TOTAL
            do
                begin
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