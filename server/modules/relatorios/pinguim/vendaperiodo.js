'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

module.exports = { 
    read: params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [15, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 13 Colunas
                {
                    style: 'tableExample',
                    table: { //   DOC SER EMI EMP CPG VEN CLI  NOM MUN  UF VIS PRZ OUT
                        widths:   [25, 13, 32, 12, 12, 12, 20, 100, 70, 10, 50, 50, 50],
                        headerRows: 3,
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
			
            let rows            = docDefinition.content[1].table.body;

            let movVista  = 0; 
            let movPrazo  = 0;
            let movOutras = 0;
            let itens     = params.itens;   // 0-Sem 1-Com

            let totalAvista     = 0;
            let totalAprazo     = 0;
            let totalOutras     = 0;
            let totalDevolucoes = 0; 

            let docAnt = '';
            let model;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }


            console.log(params);

            const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            let infoVendedor = (cents(params.usuinicio) == cents(params.usufinal) && cents(params.usuinicio) > 0) ?
                              ('Vendedor: ' + dados[0]['MOVIMENTOS_ID_USUARIOS']  + ' - ' + dados[0]['USUARIOS_NOME']) : '';

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 100,
                        height: 22,	
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: 'Relatório de Vendas por Período',
                        colSpan: 9,
                        fontSize: 12,
                        alignment: 'center',
                        color: 'blue',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        colSpan: 2,
                        fontSize: 8,
                        alignment: 'right',
                        border: [false, false, false, false]								
                    },{}
                ],
                [
                    {							
                        text: params.empresaLogada == '1' ? 'PINGUIM' : 'COLOMBO',
                        fontSize: 9,
                        bold: true,
                        colSpan: 2,
                        alignment: 'left',
                        border: [false, false, false, false]
                    },{},
                    { 
                        text: infoVendedor + ' Referencia: ' + params.emiinicio + ' a ' + params.emifinal,
                        fontSize: 8,
                        colSpan: 9,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        colSpan: 2,
                        alignment: 'right',
                        border: [false, false, false, false]
                    },{}
                ],	
            );
            
            rows.push( 
                [
                    {
                        text: 'Numero',
                        style: 'tableHeader',
                        alignment: 'center',
                    },
                    {
                        text: 'Ser',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Emp',
                        style: 'tableHeader',
                        alignment: 'center'
                    },			
                    {
                        text: 'Cpg',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Ven',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Cli',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Nome do Cliente',
                        style: 'tableHeader',
                        alignment: 'center'
                    },		
                    {
                        text: 'Município',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'UF',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'A Vista',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'A Prazo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Outras',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            )					

            for(let i in dados){

                model = dados[i]; 

                movVista  = 0;
                movPrazo  = 0;
                movOutras = 0;

                if(itens == 1) {  // Se imprime os itens do movimento

                    if(docAnt != model['MOVIMENTOS_NUMERO']) {
                        if(docAnt) {
                            rows.push([
                                {
                                    text: '- '.repeat(160),
                                    colSpan: 13,
                                    bold: true,
                                    style: 'tableExample',
                                    border: [false, false, false, false]											
                                },{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }
                    }    
                }

                if(docAnt != model['MOVIMENTOS_NUMERO']) {
                    if(model['OPERACOES_ACAO'] == 'DC' || model['OPERACOES_ACAO'] == 'DV') { // Devolução de compra ou venda
                        totalDevolucoes += model['MOVIMENTOS_TOTAL'];
                        movOutras = model['MOVIMENTOS_TOTAL'];                                
                    } else {
                        if(model['OPERACOES_ACAO'] != 'VN') { // Se não for venda normal, vai em outras
                            movOutras = model['MOVIMENTOS_TOTAL'];
                        } else {
                            if(model['MOVIMENTOS_ID_PRAZOS'] < 3) {
                                movVista = model['MOVIMENTOS_TOTAL'];
                            } else {
                                if(model['MOVIMENTOS_ID_PRAZOS'] > 9) {
                                    movPrazo = model['MOVIMENTOS_TOTAL'];
                                }
                            }    
                        }    
                    }

                    if(model['MOVIMENTOS_STATUS'].match(/C|D|R/) == 'C') { // Canceladas/Denegadas/Recusadas
                        rows.push([
                            {
                                text: model['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_SERIE'],
                                alignment: 'center',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_EMPRESAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PRAZOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_USUARIOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PESSOAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: ( model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_NOMEPROPRIEDADE'] : model['CIDADES_NOME']).slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_ESTADOPROPRIEDADE'] : model['CIDADES_ESTADO'],
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: (model['MOVIMENTOS_STATUS'] == 'C' ? '*** CANCELADA ***' :
                                        model['MOVIMENTOS_STATUS'] == 'D' ? '*** DENEGADA ***' : 'RECUSADA'),
                                bold: true,
                                alignment: 'center',
                                colSpan: 3,
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },{},{}
                        ]);	
                    } else {

                        rows.push([
                            {
                                text: model['MOVIMENTOS_NUMERO'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_SERIE'],
                                alignment: 'center',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY'),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_EMPRESAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PRAZOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_USUARIOS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_ID_PESSOAS'],
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: model['MOVIMENTOS_NOME'].slice(0, 25),
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: ( model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_NOMEPROPRIEDADE'] : model['CIDADES_NOME']).slice(0, 20),
                                style: 'tableExample',
                                border: [false, false, false, false]
                            },
                            {
                                text: model['MOVIMENTOS_ID_PROPRIEDADES'] > 0 ? model['CIDADES_ESTADOPROPRIEDADE'] : model['CIDADES_ESTADO'],
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movVista),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movPrazo),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            },
                            {
                                text: utils.number.float2moeda(movOutras),
                                alignment: 'right',
                                style: 'tableExample',
                                border: [false, false, false, false]									
                            }
                        ]);	

                        if(itens == 1) {  // Se imprime os itens do movimento)
                            rows.push([
                                {
                                    colSpan: 13,
                                    border: [false, false, false, false, false],
                                    table: {
                                        widths: [30, 30, 150, 60, 80, 80],
                                        body: [
                                            [
                                                {
                                                    text: 'Cfop',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Cód',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}                                                            
                                                },
                                                {
                                                    text: 'Descrição',
                                                    alignment: 'left',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Qtde',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Preço',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                },
                                                {
                                                    text: 'Total',
                                                    alignment: 'right',
                                                    style: {bold: true,	fontSize: 6}
                                                }
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }
                        totalAvista += movVista;
                        totalAprazo += movPrazo;
                        totalOutras += movOutras;

                        // imprime os itens

                    }

                    docAnt = model['MOVIMENTOS_NUMERO'];
                }
                
                if(itens == 1) {  // Se imprime os itens do movimento)                                
                    rows.push([
                        {
                            colSpan: 13,
                            border: [false, false, false, false, false],
                            table: {
                                widths: [30, 30, 150, 60, 80, 80],
                                body: [
                                    [
                                        {
                                            text: model['MOVIMENTOSITENS_ID_OPERACOES'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}                                                            
                                        },
                                        {
                                            text: model['MOVIMENTOSITENS_ID_PRODUTOS'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}                                                            
                                        },
                                        {
                                            text: model['PRODUTOS_NOME'],
                                            alignment: 'left',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: model['MOVIMENTOSITENS_QUANTIDADE'],
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: utils.number.float2moeda(model['MOVIMENTOSITENS_PRECO']),
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        },
                                        {
                                            text: utils.number.float2moeda(model['MOVIMENTOSITENS_TOTAL']),
                                            alignment: 'right',
                                            style: {bold: true,	fontSize: 6}
                                        }
                                    ]
                                ]
                            },
                            layout: 'noBorders'        
                        },{},{},{},{},{},{},{},{},{},{},{},{}
                    ]);
                }

            }

            rows.push([
                {
                    text: 'Totais',
                    colSpan: 10,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},{},{},{},{},{},{},{},{},
                {
                    text: utils.number.float2moeda(totalAvista),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },
                {
                    text: utils.number.float2moeda(totalAprazo),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },
                {
                    text: utils.number.float2moeda(totalOutras),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                }
            ]);						

            rows.push([
                {
                    text: '(A vista + A prazo):',
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: utils.number.float2moeda(totalAvista + totalAprazo),
                    colSpan: 2,
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: '',
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: '',
                    colSpan: 2,
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]											
                },{},
                {
                    text: '',
                    colSpan: 5,
                    border: [false, false, false, false]
                },{},{},{},{}
            ]);						


			pdfStream(docDefinition, resolve, reject);
			db.detach();					
        });
    }
};

const obterDados = function(db, params) {
    let { 
        empresa,
        empresacnpj,
        tipo,
        status,
        pesinicio,
        pesfinal,
        grpinicio,
        grpfinal,
        proinicio,
        profinal,
        usuinicio,
        usufinal,
        emiinicio,
        emifinal,
        operacao
    } = params;

    return new Promise(async (resolve, reject) => {
        let sqlWhere = '';
        let sqlSearch = '';
        let SqlOrder  = '';
        let sqlTipo = '';
        let filtrarCan = '';

        pesinicio = pesinicio ? pesinicio : 1;
        pesfinal  = pesfinal  ? pesfinal  : 9999999;
        proinicio = proinicio ? proinicio : 1;
        profinal  = profinal  ? profinal  : 9999999;
        grpinicio = grpinicio ? grpinicio : 1;
        grpfinal  = grpfinal  ? grpfinal  : 9999999;
        usuinicio = usuinicio ? usuinicio : 1;
        usufinal  = usufinal  ? usufinal  : 9999999;            

        sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${pesinicio} and ${pesfinal} `;
        sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${usuinicio} and ${usufinal} `;
        sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${proinicio} and ${profinal} `;
        sqlWhere += `and PRODUTOS_ID_GRUPOS between ${grpinicio} and ${grpfinal} `;
        sqlWhere += operacao == 1 ? ` and OPERACOES_ACAO = 'VN' ${filtrarCan} ` :
                    operacao == 2 ? ` and left(OPERACOES_ACAO, 1) = 'T' ${filtrarCan} ` :
                    operacao == 3 ? ` and OPERACOES_ACAO = 'DV' ${filtrarCan} ` :
                    operacao == 4 ? ` and MOVIMENTOS_STATUS = 'C' ` : '';
        sqlWhere += status == 1 ? ` and MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' ` : // Com nfe
                    status == 2 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' ` : // Sem nfe
                    status == 3 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z'))` : // Baixados
                    status == 4 ? ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` :  // Abertos
                    status == 5 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` : ''; // Sem nfe Abertos

        SqlOrder = `ORDER BY MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`

        sqlTipo = tipo == 3 ? `((MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5)))` :// Notas
                  tipo == 4 ? `MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo}) and MOVIMENTOS_ID_OPERACOES <> 610000` // Só reqs não faturadas
                            : `MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})`

        if(params.empresaLogada > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} `;
        }

        sqlSearch = `select MOVIMENTOS_ID, 
                            MOVIMENTOS_ID_DOCUMENTOS,
                            DOCUMENTOS_NOME,
                            MOVIMENTOS_EMISSAO, 
                            MOVIMENTOS_STATUS,
                            MOVIMENTOS_ENTRADASAIDA, 
                            MOVIMENTOS_NUMERO, 
                            MOVIMENTOS_SERIE,
                            MOVIMENTOS_ID_EMPRESAORIGEM,
                            MOVIMENTOS_NUMEROORIGEM,
                            MOVIMENTOS_SERIEORIGEM,
                            MOVIMENTOS_ID_PESSOAS, 
                            MOVIMENTOS_ID_USUARIOS, 
                            MOVIMENTOS_ID_OPERACOES,
                            MOVIMENTOS_TOTAL, 
                            MOVIMENTOS_ID_EMPRESAS, 
                            MOVIMENTOS_ID_PRAZOS,
                            coalesce(MOVIMENTOS_NOME, '') as MOVIMENTOS_NOME, 
                            coalesce(CIDADES.CIDADES_NOME, '') as CIDADES_NOME,
                            CIDADES.CIDADES_ESTADO as CIDADES_ESTADO, 
                            MOVIMENTOS_ID_PROPRIEDADES,
                            CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
                            CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                            OPERACOES_ACAO,
                            PESSOAS_TIPO,
                            PRODUTOS_NOME, 
                            PRODUTOS_DERIVADO, 
                            MOVIMENTOSITENS_ID_PRODUTOS, 
                            MOVIMENTOSITENS_ID_OPERACOES,
                            MOVIMENTOSITENS_QUANTIDADE, 
                            MOVIMENTOSITENS_PRECO, 
                            MOVIMENTOSITENS_TOTAL,
                            PRAZOS_NOME,
                            USUARIOS_NOME
                        from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                        join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                        left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                        left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                        left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                        left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                        left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                        left outer join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
                        left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES

        where ${sqlTipo} and
        MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' 
        ${sqlWhere} ${SqlOrder}`;

        console.log('sqlSearch: ', sqlSearch);

        db.query(sqlSearch, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
}