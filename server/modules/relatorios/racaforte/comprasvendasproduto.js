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
            let rows;

                docDefinition = {
                    pageOrientation : 'portrait',
                    pageSize: 'A4',
                    pageMargins: [20, 40, 15, 35],  // E S D I 
                    content: [
                        {columns: [{},{},{},{},{},{},{},{},{}]},  // 9
                        {
                            style: 'tableExample',
                            table: {
                                widths:  [40, 15, 40, 80, 90, 40, 50, 50, 50],
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
                                { text: 'PáginaS: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                            ],
                            margin: [40, 10]  // 10, 10
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
                rows.push(		
                    [
                        {							
                            image: pathLogo,
                            width: 80,
                            alignment: 'left',
                            border: [false, false, false, false]
                        },
                        { 
                            text: 'Vendas por Produto',
                            colSpan: 7,
                            bold: true,
                            fontSize: 13,
                            alignment: 'center',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},
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
                            text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + params.final,
                            colSpan: 7,
                            fontSize: 8,
                            alignment: 'center',
                            border: [false, false, false, false],



                        },{},{},{},{},{},{},
                        {
                            text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                            alignment: 'right',
                            border: [false, false, false, false]
                        }
                    ],												

                    [
                        {							
                            text: '',
                            border: [false, false, false, false]
                        },
                        { 
                            text: dados[0]['USUARIOS_NOME'],
                            bold: true,
                            colSpan: 7,
                            fontSize: 10,
                            alignment: 'center',
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},
                        {
                            text: '',
                            border: [false, false, false, false]
                        }
                    ]												
                );

                rows.push([
                { text: 'NUMERO', style: 'tableHeader', alignment: 'center' },
                { text: 'SR', style: 'tableHeader', alignment: 'center' },
                { text: 'CODIGO', style: 'tableHeader', alignment: 'center' },
                { text: 'CLIENTE', style: 'tableHeader', alignment: 'center', colSpan: 3 }, {}, {},
                { text: 'EMISSAO', style: 'tableHeader', alignment: 'center' },
                { text: 'VALOR NF', style: 'tableHeader', alignment: 'center' },
                { text: 'COMISSÃO', style: 'tableHeader', alignment: 'center' }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

// alterando

const obterDados = async function(db, params) {
    const { empresa, pessoa, produto, acao, inicio, final } = params;

    let sql = '';

            const sqlEmpresa = empresa ? `MOVIMENTOS_ID_EMPRESAS   = '${empresa}' and` : '';
            const sqlPessoa  = pessoa ? `MOVIMENTOS_ID_PESSOAS = '${pessoa}' and` : '';

            sql = `execute block returns (
                MOVIMENTOS_ID_EMPRESAS integer,
                MOVIMENTOSITENS_ID_MOVIMENTOS integer,
                MOVIMENTOS_EMISSAO date,
                MOVIMENTOS_NUMERO integer,
                MOVIMENTOS_SERIE varchar(3),
                MOVIMENTOS_ID_DOCUMENTOS integer,
                DOCUMENTOS_NOME varchar(50),
                MOVIMENTOS_ID_PESSOAS integer,
                PESSOAS_NOME varchar(50),
                MOVIMENTOSITENS_QUANTIDADE numeric(12,3),
                MOVIMENTOSITENS_PRECO numeric(12,2),
                MOVIMENTOSITENS_TOTAL numeric(12,2),
                MOVIMENTOSITENS_TOTALGERAL numeric(12,2)
            ) as
            
            begin
                MOVIMENTOSITENS_TOTALGERAL = 0;
                for
                    select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOSITENS_ID_MOVIMENTOS,
                        MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,
                        MOVIMENTOS_ID_DOCUMENTOS, DOCUMENTOS_NOME,
                        MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME,
                        MOVIMENTOSITENS_QUANTIDADE, MOVIMENTOSITENS_PRECO, 
                        cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PESSOAS    on PESSOAS_ID     = MOVIMENTOS_ID_PESSOAS
                    left outer join DOCUMENTOS on DOCUMENTOS_ID  = MOVIMENTOS_ID_DOCUMENTOS
                    left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                    where ${sqlEmpresa}
                        MOVIMENTOSITENS_ID_PRODUTOS   = '${produto}'  and
                        ${sqlPessoa}
                        MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        OPERACOES_ACAO = '${acao}' and
                        ((MOVIMENTOS_STATUS <> 'C') and 
                         (MOVIMENTOS_STATUS <> 'D') and
                         (MOVIMENTOS_STATUS <> 'R'))
                    order by MOVIMENTOS_EMISSAO
                    into :MOVIMENTOS_ID_EMPRESAS,
                         :MOVIMENTOSITENS_ID_MOVIMENTOS,
                         :MOVIMENTOS_EMISSAO,
                         :MOVIMENTOS_NUMERO,
                         :MOVIMENTOS_SERIE,
                         :MOVIMENTOS_ID_DOCUMENTOS,
                         :DOCUMENTOS_NOME,
                         :MOVIMENTOS_ID_PESSOAS,
                         :PESSOAS_NOME,
                         :MOVIMENTOSITENS_QUANTIDADE,
                         :MOVIMENTOSITENS_PRECO,
                         :MOVIMENTOSITENS_TOTAL
                do
                    begin
                        MOVIMENTOSITENS_TOTALGERAL = MOVIMENTOSITENS_TOTALGERAL + :MOVIMENTOSITENS_TOTAL;
                        suspend;
                    end
            end;`;
    
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


