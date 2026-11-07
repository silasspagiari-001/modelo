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
                            widths:  [30, 38, 60, 150, 150, 35, 25, 30],
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
                        text: 'Relação de Vacinas',
                        colSpan: 3,
                        bold: true,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
                    {
                        text: '',
                        fontSize: 10,
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false],
                    },{}

                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'left',
                        fontSize: 10,
                        border: [false, false, false, false],
                    },{},
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY'),
                        colSpan: 3,
                        fontSize: 10,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        fontSize: 10,
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
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'CPF/CNPJ',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Nome',
                        style: 'tableHeader',
                        alignment: 'left'
                    },
                    {
                        text: 'Vacina',
                        style: 'tableHeader',
                        alignment: 'left'
                    },
                    {
                        text: 'Partida',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Qtde',
                        style: 'tableHeader',
                        alignment: 'center'
                    }                    
                ]
            );

            let emissaoant;
            let LinhaS = '';
            let campos;
            let somenteNumeros;
            const regexSomenteNumerosEBarra = /^[0-9/]+$/;
            const regexCodigo = /\b\d+\/\d+\b/;
            let codigo = null;

            for(let i in dados){

               LinhaS = dados[i]['MOVIMENTOS_OBSERVACOES'];
               campos = LinhaS.split("|").filter(c => c.trim() !== '');
               somenteNumeros = campos.filter(campo => regexSomenteNumerosEBarra.test(campo));

                for (const campo of campos) {
                const match = campo.match(regexCodigo);
                if (match) {
                    codigo = match[0];
                    break; // para no primeiro encontrado (a segunda posição, no caso)
                }
                }

               if(dados[i]['MOVIMENTOS_EMISSAO'] != emissaoant) {
                   emissaoant = dados[i]['MOVIMENTOS_EMISSAO'];    
                }                
                
                rows.push([
                    {
                        text: dados[i]['MOVIMENTOS_NUMERO'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {                              
                        text: moment(dados[i]['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PROPRIEDADES_CPFCNPJ'],
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: dados[i]['PESSOAS_NOME'].slice(0, 30),
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        alignment: 'left',
                        style: 'tableExample'
                    },
                    {
                        text: codigo.slice(-6),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['MOVIMENTOSITENS_QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample'
                    },

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
        nota,
        empresaLogada
    } = params;

    return new Promise(async (resolve, reject) => {
        const Notainicio = nota > 0 ? ` MOVIMENTOS_NUMERO >= ${nota} and ` : `` ;

        let sql = `execute block returns (
             MOVIMENTOS_NUMERO INTEGER,
            MOVIMENTOS_OBSERVACOES VARCHAR(512),
            MOVIMENTOS_EMISSAO DATE,
            MOVIMENTOS_ID_PESSOAS INTEGER,
            PESSOAS_NOME VARCHAR(50),
            PROPRIEDADES_CPFCNPJ VARCHAR(15),
            MOVIMENTOS_ID_OPERACOES INTEGER,
            OPERACACOES_NOME VARCHAR(50),
            MOVIMENTOSITENS_ID_PRODUTOS INTEGER,
            PRODUTOS_NOME VARCHAR(100),
            MOVIMENTOSITENS_QUANTIDADE numeric(12,2)
        ) as
        begin
            for
                select MOVIMENTOS_NUMERO,
                    MOVIMENTOS_OBSERVACOES,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ID_PESSOAS,
                    PESSOAS_NOME,
                    PROPRIEDADES_CPFCNPJ,
                    MOVIMENTOS_ID_OPERACOES,
                    OPERACOES_NOME,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_NOME,
                    MOVIMENTOSITENS_QUANTIDADE
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                left outer join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
                join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                where MOVIMENTOS_ID_EMPRESAS = ${empresaLogada} and
                    ${Notainicio}
                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}0003   and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                    PRODUTOS_DERIVADO =  'V' and 
                    ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D') and (MOVIMENTOS_STATUS <> 'R'))
                order by MOVIMENTOS_EMISSAO,MOVIMENTOS_NUMERO
                into
                    :MOVIMENTOS_NUMERO,
                    :MOVIMENTOS_OBSERVACOES,
                    :MOVIMENTOS_EMISSAO,
                    :MOVIMENTOS_ID_PESSOAS,
                    :PESSOAS_NOME,
                    :PROPRIEDADES_CPFCNPJ,
                    :MOVIMENTOS_ID_OPERACOES,
                    :OPERACACOES_NOME,
                    :MOVIMENTOSITENS_ID_PRODUTOS,
                    :PRODUTOS_NOME,
                    :MOVIMENTOSITENS_QUANTIDADE
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