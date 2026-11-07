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
            const devolucoes = await obterDevolucoes(db, params);

            const docDefinition = {
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{},{},{}]},  // 11
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [30, 70, 80, 30, 40, 50, 40, 50, 24, 22, 22],
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
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [15, 10]  // 10, 10
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

            let rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            const cents = utils.number.cents.bind(utils.number);	

            const totalDevolucao = devolucoes.length > 0 ? cents(devolucoes[0]['DEVOLUCAOTOTAL']) : 0
            let venAnt = 0;
            let totalVendedor = 0;

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
                        text: 'Margem de vendas por produto',
                        colSpan: 5,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},
                    {
                        text: '',
                        colSpan: 4,
                        fontSize: 10,
                        alignment: 'right',
                        border: [false, false, false, false]								
                    },{},{},{}
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'left',
                        border: [false, false, false, false]
                    },
                    { 
                        text: 'Período: ' + moment(params.inicio).format('DD/MM/YYYY') + ' a ' + moment(params.final).format('DD/MM/YYYY') + ' Grupo: ' + params.idGrupoi + ' a ' + params.idGrupof + ' Vendedor: ' + params.idUsuarioi + ' a ' + params.idUsuariof,
                        colSpan: 8,
                        fontSize: 8,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{},
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
                        text: 'Descrição do Produto',
                        style: 'tableHeader',
                        colSpan: 2,
                        alignment: 'center'	
                    },{},
                    {
                        text: 'Vendido',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Custo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Total Custo',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Unitário',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Venda',
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

            const totalQtde      = dados.reduce((total, item) => total += cents(item['QUANTIDADE']),  0);
            const totalCusto     = dados.reduce((total, item) => total += cents(item['CUSTOTOTAL']),  0);
            const totalVenda     = dados.reduce((total, item) => total += cents(item['VENDATOTAL']),  0);

            let regua = 0;

            for(let i in dados){
                const venda    = cents(dados[i]['VENDATOTAL']);
                const custo    = cents(dados[i]['CUSTOTOTAL']);

                const margem = (100 - ((custo / venda) * 100));
                const fat    = (venda / totalVenda) * 100;
                
                regua = regua + ((venda / totalVenda) * 100);

                if(cents(params.quebra) > 0) {
                    if(venAnt != dados[i]['MOVIMENTOS_ID_USUARIOS']) {
                        if(totalVendedor > 0) {
                            rows.push([
                                {
                                    text: 'TOTAL DO VENDEDOR:',
                                    fontSize: 9,                                    
                                    colSpan: 7,
                                    bold: true,
                                    alignment: 'right',                                    
                                    border: [false, false, false, false]
                                },{},{},{},{},{},{},
                                {
                                    text: utils.number.float2moeda(totalVendedor / 100),
                                    fontSize: 9,
                                    alignment: 'right',
                                    bold: true,
                                    border: [false, false, false, false]                                    
                                },
                                {
                                    text: '',
                                    colSpan: 3,
                                    border: [false, false, false, false]
                                },{},{}
                            ]);                            
                        }
                        rows.push([
                            {
                                text: '* * * VENDEDOR: ' + dados[i]['MOVIMENTOS_ID_USUARIOS'].toString() + ' - ' + dados[i]['USUARIOS_NOME'].trim() + ' * * *',
                                alignment: 'center',
                                colSpan: 11,
                                fontSize: 12,
                                bold: true,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{}
                        ]);
                        venAnt = dados[i]['MOVIMENTOS_ID_USUARIOS'];
                        totalVendedor = 0;
                    }    
                }

                rows.push([
                    {
                        text: dados[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
                        alignment: 'right',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['PRODUTOS_NOME'],
                        style: 'tableExample',
                        colSpan: 2
                    },{},						
                    {
                        text: dados[i]['QUANTIDADE'],
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((custo / 100) / dados[i]['QUANTIDADE']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(custo / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((venda / 100) / dados[i]['QUANTIDADE']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(venda / 100),
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

                totalVendedor += venda;
            }


            if(cents(params.quebra) > 0) {
                rows.push([
                    {
                        text: 'TOTAL DO VENDEDOR:',
                        fontSize: 9,    
                        alignment: 'right',
                        colSpan: 7,
                        bold: true,
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},
                    {
                        text: utils.number.float2moeda(totalVendedor / 100),
                        alignment: 'right',
                        fontSize: 9,                        
                        bold: true,
                        border: [false, false, false, false]                                    
                    },
                    {
                        text: '',
                        colSpan: 3,
                        border: [false, false, false, false]
                    },{},{}
                ]);                            
            }

            rows.push([
                {
                    text: 'DEVOLUCOES: ' + utils.number.float2moeda(totalDevolucao / 100),
                    alignment: 'left',
                    colSpan: 2,
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},
                {
                    text: 'TOTAIS:',
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },				
                {
                    text: (totalQtde/100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },
                {
                    text: utils.number.float2moeda(totalCusto / 100),
                    alignment: 'right',
                    colSpan: 2,
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},
                {
                    text: utils.number.float2moeda(totalVenda / 100),
                    alignment: 'right',
                    colSpan: 2,                    
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},
                {
                    text: '',
                    alignment: 'right',
                    colSpan: 3,
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{}
            ]);	

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterIdsPessoasPorCNPJBase = async (db, codigoFornecedor) => {
    return new Promise((resolve, reject) => {
        const sqlBase = `
            SELECT FIRST 1 PESSOAS_CPFCNPJ 
            FROM PESSOAS
            WHERE PESSOAS_ID = ${codigoFornecedor}`;

        db.query(sqlBase, (err, result) => {
            if (err || result.length === 0) return reject('Fornecedor não encontrado');
            const cnpjBase = result[0].PESSOAS_CPFCNPJ?.substring(0, 8);

            if (!cnpjBase) return reject('CNPJ não encontrado');

            const sqlIds = `
                SELECT PESSOAS_ID
                FROM PESSOAS
                WHERE SUBSTRING(PESSOAS_CPFCNPJ FROM 1 FOR 8) = '${cnpjBase}'`;

            db.query(sqlIds, (err2, result2) => {
                if (err2) return reject(err2);
                const ids = result2.map(row => row.PESSOAS_ID);
                resolve(ids);
            });
        });
    });
};

const obterDados = async function(db, params) {
    const { 
        documento, 
        inicio, 
        final, 
        empresaLogada, 
        idPessoai, 
        idPessoaf,
        idFornecedori,
        idFornecedorf,
        idUsuarioi,
        idUsuariof,
        idGrupoi,
        idGrupof,
        idProdutoi,
        idProdutof,
        prp,
        quebra
    } = params;

    let idsPessoas = [];

	if (idFornecedori > 0) {
		try {
			idsPessoas = await obterIdsPessoasPorCNPJBase(db, idFornecedori);
		} catch (error) {
			return reject('Erro ao buscar fornecedores por base de CNPJ: ' + error);
		}
	}

    let sqlPessoa  = cents(idPessoai)  > 0 ? `MOVIMENTOS_ID_PESSOAS = ${idPessoai} and ` : '';
    let sqlUsuario = cents(idUsuarioi) > 0 ? `MOVIMENTOS_ID_USUARIOS = ${idUsuarioi} and ` : '';
    let sqlGrupo   = cents(idGrupoi)   > 0 ? `PRODUTOS_ID_GRUPOS = ${idGrupoi} and ` : '';
    let sqlProduto = cents(idProdutoi) > 0 ? `MOVIMENTOSITENS_ID_PRODUTOS = ${idProdutoi} and` : '';

    let sql = '';

        if(quebra > 0) {  // Com quebra
                sql = ` select MOVIMENTOS_ID_USUARIOS, 
                               USUARIOS_NOME,
                               MOVIMENTOSITENS_ID_PRODUTOS, 
                               PRODUTOS_NOME,
                               sum(MOVIMENTOSITENS_QUANTIDADE) as QUANTIDADE,
                               sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as CUSTOTOTAL,
                               sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as VENDATOTAL
                            from MOVIMENTOSITENS
                            left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left outer join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                            left outer join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                            left outer join USUARIOS   on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                            left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            left outer join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                            where  MOVIMENTOS_ID_EMPRESAS  = ${empresaLogada} and 
                                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}  and
                                    ((MOVIMENTOS_STATUS <> 'C') and 
                                    (MOVIMENTOS_STATUS <> 'D') and
                                    (MOVIMENTOS_STATUS <> 'R')) and
                                    OPERACOES_ACAO = 'VN' and        
                                    ${sqlPessoa}
                                    ${idsPessoas.length > 0 ? `PRODUTOS_ID_PESSOAS in (${idsPessoas.join(',')}) and ` : ``}
                                    ${sqlUsuario}
                                    ${sqlGrupo}
                                    ${sqlProduto}
                                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}'
                            group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME`
        } else {
            sql = ` select MOVIMENTOSITENS_ID_PRODUTOS, 
                            PRODUTOS_NOME,
                            sum(MOVIMENTOSITENS_QUANTIDADE) as QUANTIDADE,
                            sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as CUSTOTOTAL,
                            sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as VENDATOTAL
                            from MOVIMENTOSITENS
                            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                            join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                            join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                            where  MOVIMENTOS_ID_EMPRESAS  = ${empresaLogada} and 
                                    MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}  and
                                    ((MOVIMENTOS_STATUS <> 'C') and 
                                    (MOVIMENTOS_STATUS <> 'D') and
                                    (MOVIMENTOS_STATUS <> 'R')) and
                                    OPERACOES_ACAO = 'VN' and        
                                    ${sqlPessoa}
                                    ${idsPessoas.length > 0 ? `PRODUTOS_ID_PESSOAS in (${idsPessoas.join(',')}) and ` : ``}
                                    ${sqlUsuario}
                                    ${sqlGrupo}
                                    ${sqlProduto}
                                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}'
                            group by MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME
                            order by sum(MOVIMENTOSITENS_TOTAL) descending`
        }
    
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

const obterDevolucoes = function(db, params) {
    const { 
        documento, 
        inicio, 
        final, 
        empresaLogada, 
        idPessoai, 
        idPessoaf,
        idUsuarioi,
        idUsuariof,
        idGrupoi,
        idGrupof,
        idProdutoi,
        idProdutof,
        prp
    } = params;

    return new Promise(async (resolve, reject) => {
		let sql = ` select  MOVIMENTOS_ID_EMPRESAS,
                            sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as DEVOLUCAOTOTAL
                    from MOVIMENTOSITENS
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    join OPERACOES  on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                    join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                    join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    join SALDOS     on SALDOS_ID_EMPRESAS = ${empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                    where  MOVIMENTOS_ID_EMPRESAS  = ${empresaLogada} and 
                            MOVIMENTOS_ID_DOCUMENTOS = ${empresaLogada}000${documento}  and
                            ((MOVIMENTOS_STATUS <> 'C') and 
                             (MOVIMENTOS_STATUS <> 'D') and
                             (MOVIMENTOS_STATUS <> 'R')) and
                            OPERACOES_ACAO = 'DV' and
                            MOVIMENTOS_ID_PESSOAS between ${idPessoai} and ${idPessoaf} and
                            ${prp == '1' ? ` PESSOAS_TIPO = 'G' and ` : ''}              
                            MOVIMENTOS_ID_USUARIOS between ${idUsuarioi} and ${idUsuariof} and
                            PRODUTOS_ID_GRUPOS  between ${idGrupoi} and ${idGrupof} and
                            MOVIMENTOSITENS_ID_PRODUTOS between ${idProdutoi} and ${idProdutof} and
                            MOVIMENTOS_EMISSAO between '${inicio}' and '${final}'
                    group by MOVIMENTOS_ID_EMPRESAS`

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