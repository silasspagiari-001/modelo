'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);

const samosFB = require('../../../services/samosFB');
const samosRedis = require('../../../services/samosRedis')

module.exports = {
    read: params => {
        let pathLogo;

        console.log('params: ', params)

        try {
            pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
        } catch(error) {
            pathLogo = `${appRoot}/resources/images/headers/default.png`;
        }

        let docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 35],
            header: function(page, pages) { 
                return { 
                    alignment: 'justify',
                    columns: [
                        {
                            image: pathLogo,
                            width: 100,
                            height: 22,
                        },
                        {
                            text: [
                                {
                                    text: `Inventario de Produtos em ${moment(params.inicio).format('DD/MM/YYYY')} - ${(
                                        params.preco == 0 ? 'Preço de Custo\n'  : 
                                        params.preco == 1 ? 'Preço de Compra\n' : 
                                        params.preco == 2 ? 'Preço de Venda\n' : 
                                        'Custo Médio\n')}`,
                                    width: '*',
                                    style: {
                                        fontSize: 11,
                                        alignment: 'center',
                                        color: 'blue'
                                    }
                                }
                            ]
                        },
                        {
                            stack: [
                                moment.tz(params.timezone).format('DD/MM/YYYY'),
                                moment.tz(params.timezone).format('HH:mm:ss')
                            ],
                            width: 100,
                            style: {
                                fontSize: 6,
                                alignment: 'right',
                                bold: true
                            }
                        }
                    ],
                    margin: [40, 10]
                }
            },
            styles: {
                tableExample: {
                    fontSize: 8,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            },
            content: [
                {columns: [{},{},{},{},{},{}]},
                {
                    style: 'tableExample',
                    table: {   //COD NOM UNI SLD PRC TOT // 6 Cols.
                        widths: [30, '*', 15, 40, 55, 50],
                        headerRows: 1,                        
                        body: [
                            [
                                {
                                    text: 'Código',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Descrição do Produto',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Uni',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Qtde',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text:'Preço',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                },
                                {
                                    text: 'Total',
                                    style: 'tableHeader',
                                    alignment: 'center'
                                }
                            ]
                        ]
                    },
                    layout: {
                        fillColor: function (i) {
                            return (i % 2 === 0) ? '#E3E3E3' : null;
                        }
                    }
                }
            ],
            footer: function(page, pages) {
                return { 
                    stack: [ 
                        '_'.repeat(95),
                        { text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
                    ],
                    margin: [40, 10]
                };
            },
            styles: {
                tableExample: {
                    fontSize: 8,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            }
        };

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);

            let rows = docDefinition.content[1].table.body;
            
            let totalGeral = 0;
            let totalGrupo = 0;

            for(let i in dados){

				if(params.tiposaldo == '0') {  // Matéria Prima
					if(!dados[i]['SALDOS_CSTSUBST'].trim().match(/MPU/)) {
						continue;
					}
				}

				if(params.tiposaldo == '1') {  // Embalagens
					if(!dados[i]['SALDOS_CSTSUBST'].trim().match(/EMB/)) {
						continue;
					}
				}

				if(params.tiposaldo == '2') {  // Produtos Acabados
					if(!dados[i]['SALDOS_CSTSUBST'].trim().match(/INOS|OUTR|PAST|PROC|PROV|REVU/)) {
						continue;
					}
				}

				if(params.tiposaldo == '3') {  // Todos produtos a inventariar
					if(!dados[i]['SALDOS_CSTSUBST'].trim().match(/MPU|EMB|INOS|OUTR|PAST|PROC|PROV|REVU/)) {
						continue;
					}
				}

				const qtde  = (grams(dados[i]['MOVIMENTOSITENS_ENTRADAS']) - grams(dados[i]['MOVIMENTOSITENS_SAIDAS']));
                const total = cents(dados[i]['SALDOS_RESERVADO']) * qtde;

                totalGeral += total;
                totalGrupo += total;

                if(!dados[parseInt(i) - 1] || dados[parseInt(i) - 1]['SALDOS_CSTSUBST'] != dados[i]['SALDOS_CSTSUBST']) {
					rows.push([
                        {
                            text: `* * * ${getDescricaoClassificacao(dados[i]['SALDOS_CSTSUBST']).toUpperCase()} * * *`,
                            alignment: 'center',
                            style: 'tableExample',
                            fontSize: 12,
                            bold: true,
                            colSpan: 6,
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);
                }
            
                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },                            
                    {
                        text: dados[i]['PRODUTOS_NOME'] ,
                        alignment: 'left',
                        style: 'tableExample',
                        border: [false, false, false, false]
                    },
                    {
                        text: dados[i]['PRODUTOS_UNIDADE'],
                        alignment: 'center',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: (qtde / 1000),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(dados[i]['SALDOS_RESERVADO']),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    },
                    {
                        text: utils.number.float2moeda(total / 100000),
                        alignment: 'right',
                        style: 'tableExample',
                        border: [false, false, false, false]                                
                    }
                ]);

                if(!dados[parseInt(i) + 1] || dados[parseInt(i) + 1]['SALDOS_CSTSUBST'] != dados[i]['SALDOS_CSTSUBST']) {
                    rows.push([
                        {
                            text: `TOTAL`,
                            alignment: 'right',
                            style: 'tableExample',
                            bold: true,
                            colSpan: 5,
                            border: [false, false, false, false]
                        },{},{},{},{},
                        {
                            text: utils.number.float2moeda(totalGrupo / 100000),
                            alignment: 'right',
                            style: 'tableExample',
                            border: [false, false, false, false]
                        }
                    ]);
                    
					rows.push([
                        {
                            text: '..', 
                            color: 'white',
                            colSpan: 6,
                            style: 'tableExample',
                            border: [false, false, false, false]
                        },{},{},{},{},{}
                    ]);

                    totalGrupo = 0;
                }
            }

            rows.push([
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    style: 'tableExample',
                    bold: true,
                    colSpan: 5,
                    border: [false, false, false, false]
                },{},{},{},{},
                {
                    text: utils.number.float2moeda(totalGeral / 100000),
                    alignment: 'right',
                    style: 'tableExample',
                    border: [false, false, false, false]
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {

	const { empresa, tipo, inicio} = params;

	let sqlSearch = '';
	let sqlCfop   = 'MOVIMENTOS_ID_OPERACOES < 500000';

	sqlSearch = `select 
		MOVIMENTOSITENS_ID_PRODUTOS,
		PRODUTOS_ID_GRUPOS, 
		GRUPOS_NOME,
		PRODUTOS_NOME,
		PRODUTOS_MARCA,
		PRODUTOS_APLICACAO,
		PRODUTOS_UNIDADE,
		NCMS_NCM,
		SALDOS_CUSTO,
		SALDOS_COMPRA,
		SALDOS_RESERVADO,
		SALDOS_CSTSUBST,
		SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
		NCMS_CSTPIS, NCMS_CSTCOFINS,
		sum(case when OPERACOES_ESTOQUE = 'C' and ((MOVIMENTOS_STATUS <> 'C') and 
												(MOVIMENTOS_STATUS <> 'D') and
												(MOVIMENTOS_STATUS <> 'R'))
				then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
		sum(case when OPERACOES_ESTOQUE = 'D' and ((MOVIMENTOS_STATUS <> 'C') and 
												(MOVIMENTOS_STATUS <> 'D') and
												(MOVIMENTOS_STATUS <> 'R'))
				then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
	from MOVIMENTOSITENS                                    
	join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
	join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
	join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
	join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
	join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
	join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
	where MOVIMENTOS_ID_EMPRESAS = ${empresa}  and 
		((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${inicio.replace (/\//ig,'.')}') or
		(${sqlCfop} and MOVIMENTOS_ENTRADASAIDA <= '${inicio.replace (/\//ig,'.')}')) and
		PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and
		(OPERACOES_ESTOQUE = 'C' or OPERACOES_ESTOQUE = 'D') and
		PRODUTOS_INVENTARIO = 'T'
	group by MOVIMENTOSITENS_ID_PRODUTOS, 
		PRODUTOS_ID_GRUPOS, 
		GRUPOS_NOME,
		PRODUTOS_NOME,
		PRODUTOS_MARCA,
		PRODUTOS_APLICACAO, 
		PRODUTOS_UNIDADE,
		NCMS_NCM,
		SALDOS_CUSTO, 
		SALDOS_COMPRA,
		SALDOS_RESERVADO,
		SALDOS_CSTSUBST,
		SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
		NCMS_CSTPIS, NCMS_CSTCOFINS
	order by SALDOS_CSTSUBST, MOVIMENTOSITENS_ID_PRODUTOS`;

    const results = await samosFB.executeSQL(sqlSearch, params);

    return results;

}

function getDescricaoClassificacao(codigo) {
    const cstsubst = [
        ["","Sem Classificação"],
        ["EMB1","Embalagem Unidade 1"],
        ["EMB2","Embalagem Unidade 2"],
        ["EMB3","Embalagem Unidade 3"],
        ["INOS","Inoculantes Silagens"],
        ["MPU1","Matéria Prima Unidade 1"],
        ["MPU2","Matéria Prima Unidade 2"],
        ["OUTR","Outros"],
        ["PAST","Pastas"],
        ["PROC","Probióticos Concentrados"],
        ["PROV","Probióticos Convencionais"],
        ["REVU","Revestimento Ureia"]
    ];

    const item = cstsubst.find(function(registro) {
        return registro[0] === codigo;
    });

    return item ? item[1] : '';
}