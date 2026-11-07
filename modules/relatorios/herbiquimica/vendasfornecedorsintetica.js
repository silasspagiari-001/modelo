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
            const statusBonificacao = params.bonificacao == '1' ? ' - Com Bonificação/Amostra' : ' - Sem Bonificação/Amostra'

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [30, '*', '*', 35, 35, 250, 30, 40, 40],
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
                            '_'.repeat(150),
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
            const grams = utils.number.grams.bind(utils.number);

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
                        text: `Relação de Vendas por Fornecedor Sintética ${statusBonificacao}`,
                        colSpan: 5,
                        bold: true,
                        fontSize: 13,
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
                        text: 'Nome do Produto',
                        colSpan: 2,
                        style: 'tableHeader',
                        alignment: 'center'	
                    },{},
                    {
                        text: 'Unidade',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Saldo',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: params.ordem == 1 ? 'Fornecedor' : 'Grupo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Vendido',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: params.preco == 1 ? 'R$ Compra' : 
                              params.preco == 2 ? 'R$ Custo'  : 
                                                  'R$ Venda',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'OBS',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            let totalQtde = 0;

            for(let i in dados){
                const compra = cents(dados[i]['SALDOS_CUSTO']);
                const custo  = cents(dados[i]['SALDOS_COMPRA']);
                const venda  = cents(dados[i]['SALDOS_PRECO']);
                totalQtde    += grams(dados[i]['SALDOS_VENDIDO']);

                if(params.ordem == 1 && (dados[i]['GRUPOS_NOME'] != (dados[parseInt(i) - 1] || {})['GRUPOS_NOME'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 9,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** GRUPO: ${dados[i]['GRUPOS_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 9,
                            fontSize: 10,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{}
                    ]);	
                }

                if(params.ordem == 2 && (dados[i]['PESSOAS_NOME'] != (dados[parseInt(i) - 1] || {})['PESSOAS_NOME'])) {
                    rows.push([
						{
							text: 'RC',
							color: 'white',
							colSpan: 9,
							style: 'tableExample',
							border: [false, false, false, false]
						},{},{},{},{},{},{},{},{}
					]);
                    
                    rows.push([
                        {
                            text: `****** FORNECEDOR: ${dados[i]['PESSOAS_NOME']} ******`,
                            alignment: 'center',
                            colSpan: 9,
                            fontSize: 10,
                            border: [false, false, false, false],
                            style: 'tableExample'
                        },{},{},{},{},{},{},{},{}
                    ]);	
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        colSpan: 2,
                        alignment: 'left',
                        style: 'tableExample'
                    },{},					
                    {
                        text: dados[i]['PRODUTOS_UNIDADE'],
                        alignment: 'center',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['SALDOS_DISPONIVEL'],
                        alignment: 'right',
                        style: 'tableExample'
                    },						
                    {
                        text: params.ordem == 1 ? dados[i]['PESSOAS_NOME'] : dados[i]['GRUPOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['SALDOS_VENDIDO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((
                            params.preco == 1 ? compra : 
                            params.preco == 2 ? custo  : 
                                                venda
                        ) / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },						
                    {
                        text: '',
                        alignment: 'right',
                        style: 'tableExample'
                    }
                ]);	
            }

            rows.push([
                {
                    text: 'TOTAL: ',
                    colSpan: 6,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},{},{},
                {
                    text: (totalQtde / 1000),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },						
                {
                    text: '',
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                }
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {
    let { 
        ordem,
        inicio, 
        final, 
        empresaLogada, 
        idPessoai, 
        idPessoaf, 
        idGrupoi, 
        idGrupof,
        bonificacao 
    } = params;

    idPessoai = idPessoai > 0 ? idPessoai : 1;
    idPessoaf = idPessoaf > 0 ? idPessoaf : 999999; 

    idGrupoi = idGrupoi > 0 ? idGrupoi : 1;
    idGrupof = idGrupof > 0 ? idGrupof : 999999; 

    return new Promise(async (resolve, reject) => {
		let sql = `execute block returns(
            MOVIMENTOSITENS_ID_PRODUTOS integer,
            PRODUTOS_NOME     varchar(100),
            PRODUTOS_UNIDADE  varchar(03),  
            PESSOAS_NOME      varchar(50),
            GRUPOS_NOME       varchar(50),
            SALDOS_CUSTO      numeric(12,2),
            SALDOS_COMPRA     numeric(12,2),
            SALDOS_PRECO      numeric(12,2),
            SALDOS_DISPONIVEL numeric(12,3),
            SALDOS_VENDIDO   numeric(12,3))
            as
            begin
            for
                select                                            
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_NOME,                                  
                    PRODUTOS_UNIDADE,                               
                    PESSOAS_NOME,
                    GRUPOS_NOME,
                    SALDOS_CUSTO,
                    SALDOS_COMPRA,                                  
                    SALDOS_PRECO,
                    SALDOS_DISPONIVEL,
                    sum(MOVIMENTOSITENS_QUANTIDADE)
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
                join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                join PESSOAS    on PESSOAS_ID         = PRODUTOS_ID_PESSOAS
                join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
                join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                where
                    MOVIMENTOS_EMISSAO    between '${inicio}' and '${final}' and
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D') and (MOVIMENTOS_STATUS <> 'R')) and                    
                    PRODUTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                    ${bonificacao == '1' ? `((OPERACOES_ACAO = 'VN') or (OPERACOES_ACAO = 'BO')) and` : `OPERACOES_ACAO = 'VN' and`}
                    PRODUTOS_ID_GRUPOS    between ${idGrupoi}  and ${idGrupof}
                group by MOVIMENTOSITENS_ID_PRODUTOS,
                        PRODUTOS_NOME,
                        PRODUTOS_UNIDADE,
                        PESSOAS_NOME,
                        GRUPOS_NOME,
                        SALDOS_CUSTO,
                        SALDOS_COMPRA,
                        SALDOS_PRECO,
                        SALDOS_DISPONIVEL
                order by ${ordem == 1 ? 'GRUPOS_NOME' : 'PESSOAS_NOME'},
                        PRODUTOS_NOME
                into
                    :MOVIMENTOSITENS_ID_PRODUTOS,
                    :PRODUTOS_NOME,                                 
                    :PRODUTOS_UNIDADE,                              
                    :PESSOAS_NOME,
                    :GRUPOS_NOME,
                    :SALDOS_CUSTO,
                    :SALDOS_COMPRA,                                 
                    :SALDOS_PRECO,                                   
                    :SALDOS_DISPONIVEL,
                    :SALDOS_VENDIDO
                do
                suspend;
            end`
            
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