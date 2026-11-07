'use strict';

const utils      = require('../services/samosUtils');
const samosFB    = require('../services/samosFB');
const moment     = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { status } = params;            
            return await readFromFirebird(params);
        } catch(error) {
            const msg = 'Falha ao buscar etiquetas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {

            const sql     = `select * from ETIQUETAS where ETIQUETAS_ID = '${id}'`;
            const results = await samosFB.executeSQL(sql, params);

            for (let etiqueta of results) {
                const partes = etiqueta['ETIQUETAS_ITENS'] ? etiqueta['ETIQUETAS_ITENS'].split('|') : [];

                etiqueta['TABELA']     = partes[0] || '';
                etiqueta['TIPO']       = partes[1] || '';
                etiqueta['IMPRESSORA'] = partes[2] || '';

                if(etiqueta['TABELA'] == 'PRODUTOS') {
                    const produtos = [];
                    const itens = partes[3] ? partes[3].split(',') : [];

                    if(etiqueta['TIPO'].toUpperCase() == 'APLICACAO') {
                        for (let i in itens) {
                            const partesItens = (itens[i] || '').split('*');
                            const idProduto   = partesItens[0];
                            const nomeProduto = (partesItens[1] || '').trim();
                            const modelo      = partesItens[2];
                            const aplicacao   = partesItens[3];
                            const preco       = partesItens[4];
                            const qtde        = partesItens[5];
        
                            //faz query de produtos apenas se for uma string de produtoS
                            if(qtde !== undefined) {
                                const sql = `select
                                    ${parseInt(i) + 1} as ETIQUETASITENS_ID,
                                    ${id}            as ETIQUETASITENS_ID_ETIQUETAS,
                                    PRODUTOS_ID      as ETIQUETASITENS_ID_PRODUTOS,
                                    PRODUTOS_NOME || ' ' || PRODUTOS_MARCA as PRODUTOS_ETIQUETA,
                                    PRODUTOS_UNIDADE,
                                    SALDOS_PRAZO,
                                    PRODUTOS_BARRA,
                                    '${nomeProduto}' as PRODUTOS_NOME,
                                    ${preco}         as SALDOS_PRECO,
                                    ${qtde}          as ETIQUETASITENS_QUANTIDADE,
                                    '${modelo}'      as ETIQUETASITENS_MODELO,
                                    '${aplicacao}'   as ETIQUETASITENS_APLICACAO
                                from PRODUTOS
                                join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and 
                                               SALDOS_ID_EMPRESAS = ${etiqueta['ETIQUETAS_ID_EMPRESAS']}
                                where PRODUTOS_ID = ${idProduto}`;
                
                                const queryProduto = await samosFB.executeSQL(sql, params);
                
                                if(queryProduto[0]){
                                    produtos.push(queryProduto[0]);
                                }
                            }
                        }
                    } else {
                        for (let i in itens) {
                            const partesItens = (itens[i] || '').split('*');
                            const idProduto   = partesItens[0];
                            const isAtuPrecos = results[0]['ETIQUETAS_NOME'].match(/ATUALIZACAO/); // Se é etiquetas de atualização de preços...
                            const qtde        = isAtuPrecos ? 'SALDOS_DISPONIVEL' : partesItens[1];        

                            //faz query de produtos apenas se for uma string de produtos
                            if(qtde !== undefined) {
                                const sql = `select
                                    ${parseInt(i) + 1}  as ETIQUETASITENS_ID,
                                    ${id} as ETIQUETASITENS_ID_ETIQUETAS,
                                    PRODUTOS_ID as ETIQUETASITENS_ID_PRODUTOS,
                                    PRODUTOS_NOME,
                                    (PRODUTOS_NOME || ' ' || PRODUTOS_MARCA) as PRODUTOS_ETIQUETA,
                                    PRODUTOS_UNIDADE,
                                    PRODUTOS_FABRICA,
                                    PRODUTOS_BARRA,
                                    (PRODUTOS_APLICACAO || ' ' || PRODUTOS_MARCA) as PRODUTOS_APLICACAO,
                                    SALDOS_PRAZO,                                    
                                    SALDOS_PRECO,
                                    ${qtde} as ETIQUETASITENS_QUANTIDADE,
                                    (
                                        select first 1 skip 0 
                                        cast((PROMOCOESITENS_INDICE * PROMOCOESITENS_PARCELAS * PROMOCOESITENS_VALOR) as integer) as TOTALPARCELAS_ITENS
                                        from PROMOCOESITENS
                                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                                        where PROMOCOES_STATUS   = 'T'           and
                                              PROMOCOES_EMISSAO  <= current_date and
                                              PROMOCOES_VALIDADE >= current_date and
                                              ${params.empresaLogada ? ` position('${params.empresaLogada}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                                              PROMOCOESITENS_ID_PRODUTOS = PRODUTOS_ID 
                                    ) as VALOR_PROMOCAO                
                                from PRODUTOS
                                join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and 
                                               SALDOS_ID_EMPRESAS = ${etiqueta['ETIQUETAS_ID_EMPRESAS']}
                                where PRODUTOS_ID = ${idProduto}`;
                
                                const queryProduto = await samosFB.executeSQL(sql, params);
                
                                if(queryProduto[0] && queryProduto[0]['ETIQUETASITENS_QUANTIDADE'] > 0){
                                    produtos.push(queryProduto[0]);
                                }
                            }
                        }
                    }
        
                    etiqueta['ETIQUETAS_ITENS'] = produtos;

                } else if(etiqueta['TABELA'] == 'PESSOAS') {
                    const pessoas = [];
                    const itens = partes[3] ? partes[3].split(',') : [];

                    for (let i in itens) {
                        const partesItens = (itens[i] || '').split('*');
                        const idPessoa    = partesItens[0];
                        const qtde        = partesItens[1];
    
                        //faz query de pessoas apenas se for uma string de pessoas
                        if(qtde !== undefined) {
                            const sql = `select
                                ${parseInt(i) + 1}  as ETIQUETASITENS_ID,
                                ${id} as ETIQUETASITENS_ID_ETIQUETAS,
                                PESSOAS_ID as ETIQUETASITENS_ID_PESSOAS,
                                PESSOAS_NOME,
                                ${qtde} as ETIQUETASITENS_QUANTIDADE
                            from  PESSOAS
                            where PESSOAS_ID = ${idPessoa}`;
            
                            const queryPessoa = await samosFB.executeSQL(sql, params);
            
                            if(queryPessoa[0]){
                                pessoas.push(queryPessoa[0]);
                            }
                        }
                    }
        
                    etiqueta['ETIQUETAS_ITENS'] = pessoas;
                }
            }
            
            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar etiquetas por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (etiqueta, params) => {
        try {
            etiqueta['ETIQUETAS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            etiqueta['ETIQUETAS_LOG']     = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
            
            const tabela     = (etiqueta['TABELA']     || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
            const tipo       = (etiqueta['TIPO']       || '').replace(/\*|\|/g, '');
            const impressora = (etiqueta['IMPRESSORA'] || '').replace(/\*|\|/g, '');

            if(tabela == 'PRODUTOS' && etiqueta['ETIQUETAS_ITENS'] instanceof Array) {
                let strProdutos;

                if(tipo.toUpperCase() == 'APLICACAO') {
                    strProdutos = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                        const idProduto = item['ETIQUETASITENS_ID_PRODUTOS'];
                        const nome      = (item['PRODUTOS_NOME']            || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                        const modelo    = (item['ETIQUETASITENS_MODELO']    || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                        const aplicacao = (item['ETIQUETASITENS_APLICACAO'] || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                        const preco     = item['SALDOS_PRECO']              || 0;
                        const qtde      = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                        return `${idProduto}*${nome}*${modelo}*${aplicacao}*${preco}*${qtde}`
                    }).join(',');
                } else {
                    strProdutos = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                        const idProduto = item['ETIQUETASITENS_ID_PRODUTOS'];
                        const qtde      = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                        return `${idProduto}*${qtde}`
                    }).join(',');
                }

                etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${strProdutos}`
            
            } else if(tabela == 'PESSOAS' && etiqueta['ETIQUETAS_ITENS'] instanceof Array) {
                const strPessoas = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                    const idPessoa = item['ETIQUETASITENS_ID_PESSOAS'];
                    const qtde     = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                    return `${idPessoa}*${qtde}`
                }).join(',');

                etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${strPessoas}`
            }
            
            await samosFB.insert('ETIQUETAS', etiqueta, params);
            
            //nao devove a string gerada pra não atrapalhar a grid do front
            delete etiqueta['ETIQUETAS_ITENS'];

            return { results: etiqueta };
        } catch(error) {
            const msg = 'Falha ao criar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, etiqueta, params) => {
        try {
            const sql = `select * from ETIQUETAS where ETIQUETAS_ID = '${id}'`;
            const etiquetaOriginal = (await samosFB.executeSQL(sql, params))[0];

            const partes     = etiquetaOriginal['ETIQUETAS_ITENS'] ? etiquetaOriginal['ETIQUETAS_ITENS'].split('|') : [];
            const tabela     = (etiqueta['TABELA']          || partes[0] || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
            const tipo       = (etiqueta['TIPO']            || partes[1] || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
            const impressora = (etiqueta['IMPRESSORA']      || partes[2] || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
            const itens      = etiqueta['ETIQUETAS_ITENS']  || partes[3] || [];

            if(tabela == 'PRODUTOS') {
                let strProdutos = '';

                if(itens instanceof Array) {
                    if(tipo.toUpperCase() == 'APLICACAO') {
                        strProdutos = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                            const idProduto = item['ETIQUETASITENS_ID_PRODUTOS'];
                            const nome      = (item['PRODUTOS_NOME']            || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                            const modelo    = (item['ETIQUETASITENS_MODELO']    || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                            const aplicacao = (item['ETIQUETASITENS_APLICACAO'] || '').replace(/\*|\|/g, '');//tira "*" e "|" (coringas de split)
                            const preco     = item['SALDOS_PRECO']              || 0;
                            const qtde      = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                            return `${idProduto}*${nome}*${modelo}*${aplicacao}*${preco}*${qtde}`
                        }).join(',');
                    } else {
                        strProdutos = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                            const idProduto = item['ETIQUETASITENS_ID_PRODUTOS'];
                            const qtde      = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                            return `${idProduto}*${qtde}`
                        }).join(',');
                    }

                    etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${strProdutos}`
    
                } else if(typeof itens == 'string') {
                    if(itens.split('|').length > 1) {
                        etiqueta['ETIQUETAS_ITENS'] = itens;
                    } else {
                        etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${itens}`;
                    }
                }

            } else if(tabela == 'PESSOAS') {
                let strPessoas = '';

                if(itens instanceof Array) {
                    strPessoas = (etiqueta['ETIQUETAS_ITENS'] || []).map(item => {
                        const idPessoa = item['ETIQUETASITENS_ID_PESSOAS'];
                        const qtde     = item['ETIQUETASITENS_QUANTIDADE'] || 1;
                        return `${idPessoa}*${qtde}`
                    }).join(',');

                    etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${strPessoas}`
    
                } else if(typeof itens == 'string') {
                    if(itens.split('|').length > 1) {
                        etiqueta['ETIQUETAS_ITENS'] = itens;
                    } else {
                        etiqueta['ETIQUETAS_ITENS'] = `${tabela}|${tipo}|${impressora}|${itens}`;
                    }
                }
            }
            
            await samosFB.update(id, 'ETIQUETAS', etiqueta, params);            
            await utils.dblog(params);

            //nao devove a string gerada pra não atrapalhar a grid do front
            delete etiqueta['ETIQUETAS_ITENS'];

            return { results: etiqueta };
        } catch(error) {
            const msg = 'Falha ao alterar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'ETIQUETAS', params);            
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar etiqueta';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function readFromFirebird(params) {
    const { conteudo, tabela, empresa, status, ordem, inicio, final, start, limit } = params;
    
    let sqlWhere = `where ETIQUETAS_ID > 0`;
    let sqlOrder = '';

    if(status == 0 || status == 'F') {
        sqlWhere += ` and ETIQUETAS_STATUS = 'F' `;  
    } else if (status == 2 || status == 'T') {
        sqlWhere += ` and ETIQUETAS_STATUS = 'T' `;
    }

    if(empresa) {
        sqlWhere += ` and ETIQUETAS_ID_EMPRESAS = ${empresa} `;
    }

    if(conteudo && conteudo.substring(0, 1) == '.') {
        sqlWhere += `and ETIQUETAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
    } else {            
        if(ordem == 0) {
            sqlWhere += `and ETIQUETAS_NOME like '${conteudo}%' `; 
            sqlOrder = ' order by ETIQUETAS_NOME ';  
        } else if (ordem == 1) {
            sqlWhere += `and ETIQUETAS_NOME like '%${conteudo}%' `;
            sqlOrder = ' order by ETIQUETAS_NOME ';  
        } else if (ordem == 2) {
            sqlWhere += `and ETIQUETAS_LAYOUT like '%${conteudo}%' `;
            sqlOrder = ' order by ETIQUETAS_LAYOUT ';  
        } else if (ordem == 3) {
            sqlWhere += conteudo > 0 ? `and ETIQUETAS_ID = '${conteudo}' ` : '';
            sqlOrder = ' order by ETIQUETAS_ID ';  
        }
    }  
    
    if (inicio && final && inicio.length > 0 && final.length > 0) {
        sqlWhere += ` and ETIQUETAS_EMISSAO between '${inicio}' and '${final}' `;
    }

    if(tabela) {
        sqlWhere += ` and substring(ETIQUETAS_ITENS from 1 for ${tabela.length}) = '${tabela}' `;
    }
    
    const sql = `select 
        ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
        * from ETIQUETAS
    ${sqlWhere} ${sqlOrder}`;

    const sqlCount = `select count(*) from ETIQUETAS ${sqlWhere} `;

    return { 
        results: await samosFB.executeSQL(sql, params), 
        total  : await samosFB.count(sqlCount, params)
    };
}