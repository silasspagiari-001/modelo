'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');
const grams     = utils.number.grams.bind(utils.number);

module.exports = { 
    read: async params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [15, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{}]},  // 11 Colunas
                {
                    style: 'tableExample',
                    table: { //   COD  DES CUS GRP NGP UNI PEN  ORC SLD BC1 BC2
                        widths:   [25, 150, 30, 25, 70, 12, 25, 25, 25, 40, 40],
                        headerRows: 2,
                        body: []
                    }
                }
            ],
            footer: function(page, pages) {
                return { 
                    stack: [ 
                        { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                    ],
                    margin: [25, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 6,
                    margin: [0, 0, 0, 0],
                    border: 0
                },
                tableHeader: {
                    bold: true,
                    fontSize: 6,
                    color: 'black'
                }
            }
        };	
        
		return new Promise(async (resolve, reject) => {
			params.noChilds = true;
			
            let rows   = docDefinition.content[1].table.body;
            let forAnt = 0;
            let model;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            const dados = await obterDados(params);

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 100,
                        height: 22,	
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Listagem de Saldos - Produtos por fornecedor',
                        colSpan: 9,
                        fontSize: 12,
                        alignment: 'center',
                        color: 'blue',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        fontSize: 7,
                        alignment: 'right',
                        border: [false, false, false, false]								
                    }
                ]                
            );
            
            rows.push( 
                [
                    {
                        text: 'Código',
                        style: 'tableHeader',
                        alignment: 'center',
                    },
                    {
                        text: 'Descrição',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Custo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Grupo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },			
                    {
                        text: 'Nome',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Uni',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Pend',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Orcs',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Saldo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: '',
                        style: 'tableHeader'
                    },
                    {
                        text: '',
                        style: 'tableHeader'
                    }                    
                ]
            )					

            for(let i in dados){

                model = dados[i]; 
                let qtdPen = model['QTDE_PEN'].length > 0 ? model['QTDE_PEN'][0]['QTDPEN'] : '';
                let qtdOrc = model['QTDE_ORC'].length > 0 ? model['QTDE_ORC'][0]['QTDORC'] : '';

                if(forAnt != model['PRODUTOS_ID_PESSOAS']) {

                    rows.push([
                        {
                            text: 'Fornecedor: ' + model['PESSOAS_NOME'],   
                            fontSize: 12,         
                            bold: true,                
                            alignment: 'center',
                            style: 'tableExample',
                            colSpan: 11,
                            border: [false, false, false, false]									
                        },{},{},{},{},{},{},{},{},{},{}
                    ]);	

                    forAnt = model['PRODUTOS_ID_PESSOAS'];
                } 
                
                rows.push([
                    {
                        text: model['PRODUTOS_ID'],
                        alignment: 'right'
                    },
                    {
                        text: model['PRODUTOS_NOME']
                    },
                    {
                        text: params.precos == 0 ? utils.number.float2moeda(model['SALDOS_CUSTO']) : '',
                        alignment: 'right'
                    },
                    {
                        text: model['PRODUTOS_ID_GRUPOS'],
                        alignment:'right',
                    },
                    {
                        text: model['GRUPOS_NOME'].slice(0, 15)
                    },
                    {
                        text: model['PRODUTOS_UNIDADE']
                    },                    
                    {
                        text: qtdPen,  // Pendencias
                        alignment: 'right',
                        style: {bold: true,	fontSize: 6}
                    },
                    {
                        text: qtdOrc, // Orcs
                        alignment: 'right',
                        style: {bold: true,	fontSize: 6}
                    },
                    {
                        text: ((grams(model['SALDOS_DISPONIVEL']) - grams(qtdPen) - grams(qtdOrc)) / 1000),
                        alignment: 'right',
                        style: {bold: true,	fontSize: 6}
                    },
                    {
                        text: '' // Livre 1
                    },                    
                    {
                        text: '' // Livre 2                        
                    }
                ]);
            }

			pdfStream(docDefinition, resolve, reject);

        });
    }
};

const obterDados = async function(params) {

    let { pessoainicial, grupoinicial} = params;
    let sqlGrupo = '';
    let sqlPessoa = '';
    let sqlSearch = '';
    let SqlOrder  = '';

    if(grupoinicial > 0) {
      sqlGrupo = ` and PRODUTOS_ID_GRUPOS = ${grupoinicial} `;
    }

    if(pessoainicial > 0) {
      sqlPessoa = ` and PRODUTOS_ID_PESSOAS = ${pessoainicial} `;
    }

    SqlOrder = `order by PRODUTOS_NOME`

    sqlSearch = `select PRODUTOS_ID, 
                        PRODUTOS_NOME,
                        PRODUTOS_UNIDADE,
                        PRODUTOS_ID_GRUPOS,
                        GRUPOS_NOME,
                        PRODUTOS_ID_PESSOAS,
                        PESSOAS_NOME,
                        SALDOS_DISPONIVEL,
                        SALDOS_CUSTO
                    from PRODUTOS
                    join SALDOS ON SALDOS_ID_EMPRESAS = ${params.empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                    left outer join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
                    left outer join GRUPOS  on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                    where PRODUTOS_ID > 0  ${sqlGrupo} ${sqlPessoa} ${SqlOrder}`;

    let results = await samosFB.executeSQL(sqlSearch, params);

    await Promise.all(results.map(async result => { 

        const sqlOrc = `select sum(MOVIMENTOSITENS_QUANTIDADE) as QTDORC	from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS      
                        where   MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                                right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0001' and
                                MOVIMENTOSITENS_ID_PRODUTOS = ${result['PRODUTOS_ID']} and        
                                MOVIMENTOS_STATUS <> 'C' and 
                                MOVIMENTOSITENS_ID_OPERACOES = 400000 and
                                MOVIMENTOSITENS_CSTPIS <> 'BA'`;
        result['QTDE_ORC'] = await samosFB.executeSQL(sqlOrc, params);

        const sqlPen = `select sum(MOVIMENTOSITENS_QUANTIDADE) as QTDPEN	from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS      
                        where   MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                                right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and
                                MOVIMENTOS_ID_OPERACOES = 600000 and                            
                                MOVIMENTOSITENS_ID_PRODUTOS = ${result['PRODUTOS_ID']} and        
                                MOVIMENTOS_STATUS <> 'C'`;
        result['QTDE_PEN'] = await samosFB.executeSQL(sqlPen, params);
    }));

    return results;
}