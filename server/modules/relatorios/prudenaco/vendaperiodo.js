'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');
const samosFirebird = require('../../../services/samosFirebird');
const cents     = utils.number.cents.bind(utils.number);

/* BUSCA A FORMA DE PAGAMENTO */
const getPagamento = async function(db, empresa, numero, serie, params){
    const sqlMovimentos = `
    select  MOVIMENTOS_ID,
            MOVIMENTOSCAIXA_DINHEIRO,
            MOVIMENTOSCAIXA_CHEQUE,
            MOVIMENTOSCAIXA_CREDITO,
            MOVIMENTOSCAIXA_DEBITO,
            MOVIMENTOSCAIXA_DUPLICATA,
            MOVIMENTOSCAIXA_TRANSFERENCIAS,
            MOVIMENTOSCAIXA_OUTRO
        from MOVIMENTOS
        join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
        where MOVIMENTOS_ID_EMPRESAS    = ${empresa}     and
        MOVIMENTOS_ID_DOCUMENTOS        = ${empresa}0003 and
        MOVIMENTOS_NUMERO               = ${numero} and
        MOVIMENTOS_SERIE                = '${serie}' 
    `

    const results = (await samosFB.executeSQL(sqlMovimentos, params));
        
    return results[0] || [];
    
}

const getBaixasParciais = async function(idMovimento, params) {
    return new Promise(async (resolve, reject) => {

        const db = await samosFB.conectarBanco(params.client);

        const sqlSearch = 
             `
              select sum(CREDITOS_VALOR) as CREDITOSMOVIMENTO
              from CREDITOS
              where CREDITOS_ID_MOVIMENTOS = ${idMovimento} and
                    CREDITOS_TIPO = 'B'
             `;
        
        db.query(sqlSearch, (error, results) => {
            if (error) {
                samosFirebird.enviarRespostaErro(`Falha ao buscar parciais movimento`, db, error, reject, sqlSearch);
            } else {
                samosFirebird.processarLeitura({db, results, total: results.length, resolve, reject});
            }
        });
    });
}

const getBaixasPeriodo = async function(params) {
    return new Promise(async (resolve, reject) => {

        const db = await samosFB.conectarBanco(params.client);

        const sqlSearch = `
            select CREDITOS_ID,
                   CREDITOS_VALOR,
                   CREDITOS_EMISSAO,
                   CREDITOS_ID_MOVIMENTOS,
                   MOVIMENTOS_NUMERO,
                   MOVIMENTOS_SERIE, 
                   MOVIMENTOS_NUMEROORIGEM,
                   MOVIMENTOS_SERIEORIGEM,
                   MOVIMENTOS_ID_OPERACOES,
                   MOVIMENTOS_ID_PESSOAS,
                   MOVIMENTOS_TOTAL,
                   PESSOAS_NOME,
                   PESSOAS_ID_CIDADES,
                   CIDADES_NOME,
                   CIDADES_ESTADO
            from CREDITOS
            left outer join MOVIMENTOS on CREDITOS_ID_MOVIMENTOS = MOVIMENTOS_ID
            left outer join PESSOAS    on MOVIMENTOS_ID_PESSOAS  = PESSOAS_ID
            left outer join CIDADES    on PESSOAS_ID_CIDADES     = CIDADES_ID
            where CREDITOS_EMISSAO between '${params.emiinicio.replace (/\//ig,'.')}' and '${params.emifinal.replace (/\//ig,'.')}' and
                MOVIMENTOS_STATUS <> 'X' and
                ((MOVIMENTOS_EMISSAO < '${params.emiinicio.replace (/\//ig,'.')}') or (MOVIMENTOS_EMISSAO > '${params.emifinal.replace (/\//ig,'.')}')) and
                CREDITOS_TIPO = 'B'
            order by CREDITOS_EMISSAO
        `;

        db.query(sqlSearch, (error, results) => {
            if (error) {
                samosFirebird.enviarRespostaErro(`Falha ao buscar baixas periodo`, db, error, reject, sqlSearch);
            } else {
                samosFirebird.processarLeitura({db, results, total: results.length, resolve, reject});
            }
        });

    });
}

const getVendaPeriodo = async function(params) {
    return new Promise(async (resolve, reject) => {

        const db = await samosFB.conectarBanco(params.client);

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
            quebra,
            operacao,
            itens,
            vacina,
            start,
            limit
        } = params;            

        let sqlWhere = '';
        let sqlSearch = '';
        let SqlOrder  = '';
        let sqlTipo = '';

        let sqlVacina = vacina == 1; // 0-Com 1-Sem

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
        sqlWhere += operacao == 0 ? ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' ` :
                    operacao == 1 ? ` and OPERACOES_ACAO = 'VN' and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' ` :
                    operacao == 2 ? ` and left(OPERACOES_ACAO, 1) = 'T' and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' ` :
                    operacao == 3 ? ` and OPERACOES_ACAO = 'DV' and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' ` :
                    operacao == 4 ? ` and MOVIMENTOS_STATUS = 'C' ` : '';
        sqlWhere += sqlVacina ? ` and PRODUTOS_DERIVADO <> 'V' ` : '';
        sqlWhere += status == 1 ? ` and MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' ` : // Com nfe
                    status == 2 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' ` : // Sem nfe
                    status == 3 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z'))` : // Baixados
                    status == 4 ? ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' and MOVIMENTOS_STATUS <> 'F' and MOVIMENTOS_STATUS <> 'C'` :  // Abertos 
                    status == 5 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` : ''; // Sem nfe Abertos

        SqlOrder = `order by MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`

        sqlTipo = tipo == 3 ? `((MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5)))` // Notas
                            : `MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})`

        if(empresa > 0) {
            sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
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
                           MOVIMENTOS_NOME, 
                           CIDADES_NOME, 
                           CIDADES_ESTADO, 
                           OPERACOES_ACAO,
                           PESSOAS_TIPO,
                           PRODUTOS_NOME, 
                           PRODUTOS_DERIVADO, 
                           MOVIMENTOSITENS_ID_PRODUTOS, 
                           MOVIMENTOSITENS_ID_OPERACOES,
                           MOVIMENTOSITENS_QUANTIDADE, 
                           MOVIMENTOSITENS_PRECO, 
                           MOVIMENTOSITENS_TOTAL,
                           PRAZOS_NOME
                     from MOVIMENTOSITENS
                     join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                     join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                     join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                     left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                     left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                     left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                     left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES

        where ${sqlTipo} and
        MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' 
        ${sqlWhere} ${SqlOrder}`;

        db.query(sqlSearch, (error, results) => {
            if (error) {
                samosFirebird.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
            } else {
                samosFirebird.processarLeitura({db, results, total: results.length, resolve, reject});
            }
        });
    });
}

module.exports = { 
    read: params => {
		let docDefinition = {};
        docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [10, 20, 20, 35],  // E S D I
            content: [
                {columns: [{},{},{},{},{},{},{},{},{},{},{},{},{},{}]},  // 14 Colunas
                {
                    style: 'tableExample',
                    table: { //   DOC SER EMI EMP CPG VEN CLI  NOM MUN  UF VIS PRZ OUT
                        widths:   [25, 13, 32, 25, 13, 12, 25, 85, 70, 13, 20, 20, 50, 50],
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

			try{
                    const vendasPeriodo = await getVendaPeriodo(params);
                    let res = vendasPeriodo;

					let rows            = docDefinition.content[1].table.body;                    
                    let itens           = params.itens;   // 0-Sem 1-Com
                    let descriStatus = params.status == 1 ? ' - Com NF-e' :
                                       params.status == 2 ? ' - Sem NF-e' : 
                                       params.status == 3 ? ' - Baixados' :  '';
                    let totalDevolucoes = 0;                   
                    let totalGeral      = 0;
                    let totalPagos    = 0;

					let docAnt = '';
					let model;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					const db = await samosFB.conectarBanco(params.client); 

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
                                colSpan: 3,
                                fontSize: 8,
                                alignment: 'right',
                                border: [false, false, false, false]								
                            },{},{}
                        ],
                        [
                            {							
                                text: ' ',
                                colSpan: 2,
                                alignment: 'left',
                                border: [false, false, false, false]
                            },{},
                            { 
                                text: 'Período: ' + params.emiinicio + ' a ' + params.emifinal + descriStatus,
                                fontSize: 10,
                                colSpan: 9,
                                alignment: 'center',
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},
                            {
                                text: moment.tz(params.timezone).format('HH:mm:ss'),
                                colSpan: 3,
                                alignment: 'right',
                                border: [false, false, false, false]
                            },{},{}
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
                                text: 'Origem',
                                style: 'tableHeader',
                                alignment: 'center'
                            },	
                            {
                                text: 'Ser',
                                style: 'tableHeader',
                                alignment: 'center'
                            },				
                            {
                                text: 'Cfo',
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
                                text: 'Pagamento',
                                style: 'tableHeader',
                                alignment: 'center',
                                colSpan: 2
                            },{},
                            {
                                text: 'Total',
                                style: 'tableHeader',
                                alignment: 'center'
                            },
                            {
                                text: 'Pagos',
                                style: 'tableHeader',
                                alignment: 'center'
                            }
                        ]
                    )					

                    for(let i in res.results){

                        let checarCondicaoPagamento = {};
                        let model = res.results[i]; 
                        let movTotal = 0;
                        let condicaoPagamento = '';

                        if((model['MOVIMENTOS_ID_DOCUMENTOS']|| '').toString().slice(-4) == '0005') { // Filtra Notas de entrada
                            continue;
                        }
                        
                        if( model['MOVIMENTOS_STATUS'] == 'C' ) {
                            condicaoPagamento = 'CANCELADO';
                        }else{
                            if( model['MOVIMENTOS_NUMEROORIGEM'] > 0 && model['MOVIMENTOS_SERIEORIGEM'].match(/PE|NE/)){
                                if((model['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4) == '0003') {
                                    checarCondicaoPagamento = await getPagamento( 
                                        db, 
                                        model['MOVIMENTOS_ID_EMPRESAS'], 
                                        model['MOVIMENTOS_NUMERO'], 
                                        model['MOVIMENTOS_SERIE'],
                                        params
                                    );    
                                } else {
                                    checarCondicaoPagamento = await getPagamento( 
                                        db, 
                                        model['MOVIMENTOS_ID_EMPRESAORIGEM'], 
                                        model['MOVIMENTOS_NUMEROORIGEM'], 
                                        model['MOVIMENTOS_SERIEORIGEM'],
                                        params
                                    );    
                                }

                                if(checarCondicaoPagamento != undefined){
                                    let pagamentos = '';
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_DINHEIRO']       > 0        ){ pagamentos += 'DINHEIRO + ' };
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_CHEQUE']         > 0        ){ pagamentos += 'CHEQUE + ' };
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_DUPLICATA']      > 0        ){ pagamentos += 'DUPLICATA + ' };                                    
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_CREDITO']        > 0        ){ pagamentos += 'CARTAO CREDITO + ' };
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_DEBITO']         > 0        ){ pagamentos += 'CARTAO DEBITO + ' };
                                    if( checarCondicaoPagamento['MOVIMENTOSCAIXA_TRANSFERENCIAS'] > 0        ){ pagamentos += 'PIX/TRANSF ' };
                                    condicaoPagamento = (pagamentos || '').slice(0, pagamentos.length-2);
                                }else{
                                    condicaoPagamento = model['PRAZOS_NOME'];
                                }

                            }else{
                                condicaoPagamento = model['PRAZOS_NOME'];
                            } 
                        }

                        if(itens == 1) {  // Se imprime os itens do movimento

                            if(docAnt != model['MOVIMENTOS_NUMERO']) {
                                if(docAnt) {
                                    rows.push([
                                        {
                                            text: '- '.repeat(160),
                                            colSpan: 14,
                                            bold: true,
                                            style: 'tableExample',
                                            border: [false, false, false, false]											
                                        },{},{},{},{},{},{},{},{},{},{},{},{},{}
                                    ]);
                                }
                            }    
                        }

                        if(docAnt != model['MOVIMENTOS_NUMERO']) {
                            if(model['OPERACOES_ACAO'] == 'DC' || model['OPERACOES_ACAO'] == 'DV') { // Devolução de compra ou venda
                                totalDevolucoes += model['MOVIMENTOS_TOTAL'];
                                movTotal = model['MOVIMENTOS_TOTAL'];                                
                            } else {
                                movTotal = model['MOVIMENTOS_TOTAL'];
                            }

                            if(model['MOVIMENTOS_STATUS'] == 'C') { // Canceladas
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
                                        text: (model['MOVIMENTOS_NUMEROORIGEM'] == '0') ? '' : model['MOVIMENTOS_NUMEROORIGEM'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_SERIEORIGEM'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: (model['MOVIMENTOS_ID_OPERACOES'] || '').toString().slice(0, 4),
                                        fontSize: 5,
                                        alignment: 'center',
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
                                        text: (model['MOVIMENTOS_NOME'] || '').slice(0, 25),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: (model['CIDADES_NOME'] || '').slice(0, 25),
                                        style: 'tableExample',
                                        border: [false, false, false, false]
                                    },
                                    {
                                        text: model['CIDADES_ESTADO'],
                                        style: 'tableExample',
                                        alignment: 'center',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: '*** CANCELADA ***',
                                        bold: true,
                                        alignment: 'center',
                                        colSpan: 4,
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },{},{},{}
                                ]);	
                            } else {
                                const parciaisMovimento = params.tipo == 2 ? cents(
                                                            (await getBaixasParciais( model['MOVIMENTOS_ID'], params )).results[0]['CREDITOSMOVIMENTO']
                                                          ) : 0;

                                //const restaAberto = cents(movTotal) - parciaisMovimento;

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
                                        text: (model['MOVIMENTOS_NUMEROORIGEM'] == '0') ? '' : model['MOVIMENTOS_NUMEROORIGEM'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: model['MOVIMENTOS_SERIEORIGEM'],
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: (model['MOVIMENTOS_ID_OPERACOES'] || '').toString().slice(0, 4),
                                        fontSize: 5,
                                        alignment: 'center',
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
                                        text: (model['MOVIMENTOS_NOME'] || '').slice(0, 25),
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: (model['CIDADES_NOME'] || '').slice(0, 19),
                                        style: 'tableExample',
                                        border: [false, false, false, false]
                                    },
                                    {
                                        text: model['CIDADES_ESTADO'],
                                        style: 'tableExample',
                                        alignment: 'center',
                                        border: [false, false, false, false]									
                                    },
                                    //CAMPO PAGAMENTO
                                    {
                                        text: (condicaoPagamento || '').slice(0, 15),
                                        alignment: 'left',
                                        style: 'tableExample',
                                        border: [false, false, false, false],
                                        colSpan: 2							
                                    },{},
                                    {
                                        text: utils.number.float2moeda(movTotal),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]									
                                    },
                                    {
                                        text: (model['MOVIMENTOS_STATUS'] == 'X' || model['MOVIMENTOS_STATUS'] == 'Z') ? utils.number.float2moeda(movTotal) : utils.number.float2moeda(parciaisMovimento/100),
                                        alignment: 'right',
                                        style: 'tableExample',
                                        border: [false, false, false, false]		
                                    }
                                ]);	

                                if(itens == 1) {  // Se imprime os itens do movimento)
                                    rows.push([
                                        {
                                            colSpan: 14,
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
                                        },{},{},{},{},{},{},{},{},{},{},{},{},{}
                                    ]);
                                }

                                totalGeral += movTotal;

                                //Integral ou parcial
                                if( model['MOVIMENTOS_STATUS'] == 'X' || model['MOVIMENTOS_STATUS'] == 'Z' ){
                                    totalPagos += movTotal;
                                }else{
                                    totalPagos += (parciaisMovimento/100);
                                }

                            }
        
                            docAnt = model['MOVIMENTOS_NUMERO'];
                        }
                        
                        if(itens == 1) {  // Se imprime os itens do movimento)                                
                            rows.push([
                                {
                                    colSpan: 14,
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
                                                    style: {bold: true,	fontSize: 6},
                                                    colSpan: 2
                                                },{}
                                            ]
                                        ]
                                    },
                                    layout: 'noBorders'        
                                },{},{},{},{},{},{},{},{},{},{},{},{},{}
                            ]);
                        }

                    }

                    //Soma tambem os parciais do periodo
                    const baixasPeriodo = await getBaixasPeriodo(params);
                    
                    //Somente se tiver baixas e se for imprimir de pedido
                    if(baixasPeriodo.results.length > 0 && params.tipo == '2')  // Vai ser aqui o ajuste
                    {
                        //Imprimir cabecalho das baixas
                        rows.push(		
                            [
                                {		
                                    text: '',					
                                    border: [false, false, false, false],
                                    colSpan: 2
                                },{},
                                { 
                                    text: 'Baixas Parciais no Período',
                                    colSpan: 9,
                                    fontSize: 12,
                                    alignment: 'center',
                                    color: 'blue',
                                    border: [false, false, false, false]
                                },{},{},{},{},{},{},{},{},
                                {
                                    text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                                    colSpan: 3,
                                    fontSize: 8,
                                    alignment: 'right',
                                    border: [false, false, false, false]								
                                },{},{}
                            ]
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
                                    text: 'Pagamento',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Origem',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },	
                                {
                                    text: 'Ser',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },				
                                {
                                    text: 'Cfo',
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
                                    text: 'Tipo',
                                    style: 'tableHeader',
                                    alignment: 'center',
                                    colSpan: 2
                                },{},
                                {
                                    text: 'Valor Pedido',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Pagos',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                }
                            ]
                        )	

                        //Imprime as baixas
                        for(let i in baixasPeriodo.results){
                            const baixa = baixasPeriodo.results[i];

                            rows.push([
                                {
                                    text: baixa['MOVIMENTOS_NUMERO'],
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: baixa['MOVIMENTOS_SERIE'],
                                    alignment: 'center',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: moment(baixa['CREDITOS_EMISSAO']).format('DD/MM/YYYY'),
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: (baixa['MOVIMENTOS_NUMEROORIGEM'] == '0') ? '' : baixa['MOVIMENTOS_NUMEROORIGEM'],
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: baixa['MOVIMENTOS_SERIEORIGEM'],
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: (baixa['MOVIMENTOS_ID_OPERACOES']|| '').toString().slice(0, 4),
                                    fontSize: 5,
                                    alignment: 'center',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: baixa['MOVIMENTOS_ID_PESSOAS'],
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: String(baixa['PESSOAS_NOME']).slice(0, 25),
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: String(baixa['CIDADES_NOME']).slice(0, 19),
                                    style: 'tableExample',
                                    border: [false, false, false, false]
                                },
                                {
                                    text: baixa['CIDADES_ESTADO'],
                                    style: 'tableExample',
                                    alignment: 'center',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: 'BAIXA PARCIAL',
                                    alignment: 'left',
                                    style: 'tableExample',
                                    border: [false, false, false, false],
                                    colSpan: 2							
                                },{},
                                {
                                    text: utils.number.float2moeda(baixa['MOVIMENTOS_TOTAL']),
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]									
                                },
                                {
                                    text: utils.number.float2moeda(baixa['CREDITOS_VALOR']),
                                    alignment: 'right',
                                    style: 'tableExample',
                                    border: [false, false, false, false]		
                                }
                            ]);	

                            totalPagos += baixa['CREDITOS_VALOR'];
                        }
                    };

                    rows.push([
                        {
                            text: 'Totais',
                            colSpan: 11,
                            alignment: 'right',
                            bold: true,
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },{},{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalGeral),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false],
                            colSpan: 2							
                        },{},
                        {
                            text: utils.number.float2moeda(totalPagos),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        }
                    ]);						

                    rows.push([
                        {
                            text: 'Devoluções',
                            colSpan: 11,
                            alignment: 'right',
                            bold: true,
                            style: 'tableExample',
                            border: [false, false, false, false]											
                        },{},{},{},{},{},{},{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalDevolucoes),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false],
                            colSpan: 3								
                        },{},{}
                    ]);						

					pdfStream(docDefinition, resolve, reject);
					db.detach();		

				}catch(erroCatch){
                    reject(erroCatch);
                }
        });
    }
};