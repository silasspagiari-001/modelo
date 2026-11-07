'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { conteudo, produto, status, ordem, start, limit } = params;
            
            let sqlWhere = `where PRODUCOESFORMULAS_ID > 0`;
            let sqlOrder = '';

            if(status == 0) {
                sqlWhere += ` and PRODUCOESFORMULAS_STATUS = 'F' `;  
            } else if (status == 1) {
                sqlWhere += ` and PRODUCOESFORMULAS_STATUS = 'I' `;
            }

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PRODUCOESFORMULAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {   
                if(produto) {
                    sqlWhere += ` and PRODUCOESFORMULAS_ID_PRODUTOS = ${produto} `;
                }
                         
                if(ordem == 0) {
                    sqlWhere += `and PRODUCOESFORMULAS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by PRODUCOESFORMULAS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and PRODUCOESFORMULAS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUCOESFORMULAS_NOME ';  
                } else if (ordem == 2) {
                    sqlOrder = ' order by PRODUCOESFORMULAS_ID_PRODUTOS ';  
                } else if (ordem == 3) {
                    sqlWhere += conteudo > 0 ? `and PRODUCOESFORMULAS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PRODUCOESFORMULAS_ID ';  
                }
            }

            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                PRODUCOESFORMULAS_ID,
                PRODUCOESFORMULAS_ID_PRODUTOS,
                PRODUTOS_NOME,
                PRODUTOS_UNIDADE,
                PRODUCOESFORMULAS_NOME
            from PRODUCOESFORMULAS
            left outer join PRODUTOS on PRODUCOESFORMULAS_ID_PRODUTOS = PRODUTOS_ID
            ${sqlWhere} ${sqlOrder}`;

            const sqlCount = `select count(*) from PRODUCOESFORMULAS ${sqlWhere} `;

            return { 
                results: await samosFB.executeSQL(sql, params), 
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar formulas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (idProdutoPrincipal, params) => {
        try {
            const sql = `select 
                PRODUCOESFORMULAS.*,
                PRODUTOS_NOME,
                PRODUTOS_UNIDADE
            from PRODUCOESFORMULAS
            left outer join PRODUTOS on PRODUCOESFORMULAS_ID_PRODUTOS = PRODUTOS_ID
            where PRODUCOESFORMULAS_ID_PRODUTOS = ${idProdutoPrincipal}`;

            const isMalacrida = (params.client || 'MALACRIDA').toUpperCase() == 'MALACRIDA';
            const multiplicador = isMalacrida ? 1000000 : 100000;

            const formula   = (await samosFB.executeSQL(sql, params))[0] || {};
            const idFormula = formula['PRODUCOESFORMULAS_ID'];
            const itens     = formula['PRODUCOESFORMULAS_ITENS'] ? formula['PRODUCOESFORMULAS_ITENS'].split(',') : [];
            const produtos  = [];
            
            let total = 0;

            for (let i in itens) {
                const partes     = (itens[i] || '').split('*');
                const idProduto  = partes[0];
                const qtde       = parseInt((partes[1] || 0) * multiplicador); // const qtde       = parseInt((partes[1] || 0) * 100000)
                const percentual = partes[2] || 'F';

                const sql = `select
                    ${parseInt(i) + 1} as FORMULASITENS_ID,
                    ${idFormula}       as FORMULASITENS_ID_FORMULAS,
                    ${idProduto}       as FORMULASITENS_ID_PRODUTOS,
                    ${qtde / multiplicador}   as FORMULASITENS_QUANTIDADE,
                    '${percentual}'    as FORMULASITENS_PERCENTUAL,
                    PRODUTOS_NOME,
                    PRODUTOS_UNIDADE,
                    PRODUTOS_DESCRICAO,
                    SALDOS_TRANSFERENCIA,
                    SALDOS_CUSTO,
                    SALDOS_CUSTO as FORMULASITENS_CUSTO,
                    SALDOS_CUSTO * ${percentual == 'F' ? qtde / multiplicador : qtde / 10000000} as VALOR_TOTAL                    
                from PRODUTOS
                join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and 
                               SALDOS_ID_EMPRESAS = ${params.empresaLogada}
                where PRODUTOS_ID = ${idProduto}`;

                const queryProduto = await samosFB.executeSQL(sql, params);

                if(queryProduto[0]){
                    total += utils.number.grams(queryProduto[0]['VALOR_TOTAL']);
                    produtos.push(queryProduto[0]);
                }
            }

            formula['PRODUCOESFORMULAS_ITENS'] = produtos;
            formula['VALOR_TOTAL'] = total / 1000;

            return { results: [formula] };
        } catch(error) {
            const msg = 'Falha ao buscar fórmula';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (formula, params) => {
        try {
            formula['PRODUCOESFORMULAS_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;

            formula['PRODUCOESFORMULAS_ITENS'] = (formula['PRODUCOESFORMULAS_ITENS'] || [])
                .map(item => {
                    const idProduto  = item['FORMULASITENS_ID_PRODUTOS'];
                    const qtde       = item['FORMULASITENS_QUANTIDADE'];
                    const percentual = item['FORMULASITENS_PERCENTUAL'];
                    return `${idProduto}*${qtde}*${percentual}`
                })
                .join(',');
        
            await samosFB.insert('PRODUCOESFORMULAS', formula, params);
            
            //pra não atrapalhar o front
            delete formula['PRODUCOESFORMULAS_ITENS'];

            return { results: formula };
        } catch(error) {
            const msg = 'Falha ao criar formula';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, formula, params) => {
        try {
            formula['PRODUCOESFORMULAS_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
            
            formula['PRODUCOESFORMULAS_ITENS'] = (formula['PRODUCOESFORMULAS_ITENS'] || [])
                .map(item => {
                    const idProduto  = item['FORMULASITENS_ID_PRODUTOS'];
                    const qtde       = item['FORMULASITENS_QUANTIDADE'];
                    const percentual = item['FORMULASITENS_PERCENTUAL'];
                    return `${idProduto}*${qtde}*${percentual}`
                })
                .join(',');

            await samosFB.update(id, 'PRODUCOESFORMULAS', formula, params);
            await utils.dblog(params);

            //pra não atrapalhar o front
            delete formula['PRODUCOESFORMULAS_ITENS'];

            return { results: formula };
        } catch(error) {
            const msg = 'Falha ao alterar formula';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'PRODUCOESFORMULAS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar formula';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
