'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            let { empresa, produto, conteudo, inicio, final, ordem, status, start, limit } = params;

            let sqlWhere = ` where LOTES_ID > 0 `;
            let sqlOrder = '';            

            if(ordem == '') {
                ordem = '2';
            }


            if(empresa) {
                sqlWhere += ` and LOTES_ID_EMPRESAS = ${empresa} `;
            }

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and LOTES_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {  
                if(produto) {
                    sqlWhere += ` and LOTES_ID_PRODUTOS = ${produto} `;
                }
    
                if(status == 0) {
                    sqlWhere += ` and LOTES_STATUS = 'T' `;  
                } else if (status == 1) {
                    sqlWhere += ` and LOTES_STATUS = 'F' `;
                }
                  
                if(ordem == 0) {
                    sqlWhere += `and LOTES_NOME like '${conteudo}%' `; 
                } else if (ordem == 1) {
                    sqlWhere += `and LOTES_NOME like '%${conteudo}%' `;
                } else if (ordem == 2) {
                    sqlWhere += `and LOTES_REFERENCIA like '%${(conteudo || '').toUpperCase()}%' `;
                } else if (ordem == 5) {
                    sqlWhere += conteudo > 0 ? `and LOTES_ID = '${conteudo}' ` : '';
                }

                if (inicio && final && inicio != 'Data inválida' && final != 'Data inválida' && inicio.length > 0 && final.length > 0) {
                    if(ordem == 4) {
                        sqlWhere += ` and LOTES_VALIDADE   between '${inicio}' and '${final}' `;
                    } else {
                        sqlWhere += ` and LOTES_FABRICACAO between '${inicio}' and '${final}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ' order by LOTES_NOME ';  

                } else if(ordem == 1) {
                    sqlOrder = ' order by LOTES_NOME ';  

                } else if(ordem == 2) {
                    sqlOrder = ' order by LOTES_REFERENCIA ';
                    
                } else if(ordem == 3) {
                    sqlOrder = ' order by LOTES_FABRICACAO '; 
                    
                } else if(ordem == 4) {
                    sqlOrder = ' order by LOTES_VALIDADE ';  
                    
                } else if(ordem == 5) {
                    sqlOrder = ' order by LOTES_ID ';  
                    
                } else if (ordem == 6) {
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'LOTES',
                        chave: 'LOTES_ID',
                        campos: [
                            'LOTES_REFERENCIA',
                            'LOTES_NOME'
                        ]
                    }, params);

                    sqlWhere += ` and LOTES_ID = '${id}' `;
                    sqlOrder  = ' order by LOTES_ID ';
                }
            }   

            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                LOTES.*, 
                iif(LOTES_FABRICACAO < '01.01.1990', '', (lpad(extract(month from LOTES_FABRICACAO), 2, '0') || '/' || extract(year from LOTES_FABRICACAO))) as FABRICACAO_ABR,
                iif(LOTES_VALIDADE < '01.01.1990', '', (lpad(extract(month from LOTES_VALIDADE),   2, '0') || '/' || extract(year from LOTES_VALIDADE)))     as VALIDADE_ABR,
                PRODUTOS_NOME
            from LOTES
            left outer join PRODUTOS ON PRODUTOS_ID = LOTES_ID_PRODUTOS
            ${sqlWhere} ${sqlOrder}`;

            const sqlCount  = `select count(*) from LOTES  ${sqlWhere}`;
            const total = await samosFB.count(sqlCount, params);
            const lotes = await samosFB.executeSQL(sql, params);
           
            await Promise.all(lotes.map(async lote => { 
                const sqlLotes = `select coalesce(sum(MOVIMENTOSITENS_QUANTIDADE), 0) as SAIDAS from MOVIMENTOSITENS
                                     join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                     join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                     where MOVIMENTOSITENS_ID_PRODUTOS = ${lote['LOTES_ID_PRODUTOS']}
                                       and MOVIMENTOSITENS_ID_LOTES = '${lote['LOTES_ID']}'
                                       and (MOVIMENTOS_STATUS <> 'C' and 
                                            MOVIMENTOS_STATUS <> 'D' and
                                            MOVIMENTOS_STATUS <> 'R')
                                       and OPERACOES_ESTOQUE = 'D' `;

                const saidasLote = await samosFB.executeSQL(sqlLotes, params);                                      

                lote['VENDIDO_LOTES'] = saidasLote[0]['SAIDAS'] || 0;
                lote['SALDO_LOTES'] = (lote['LOTES_SALDO'] - lote['VENDIDO_LOTES']);
            }))

            return { results: lotes, total };
        } catch(error) {
            const msg = 'Falha ao buscar lotes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (lote, params) => {
        try {
            
            lote['LOTES_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            lote['LOTES_LOG']     = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;

            return { 
                results: await samosFB.insert('LOTES', lote, params) 
            };
        } catch(error) {
            const msg = 'Falha ao criar lote';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, lote, params) => {
        try {
            lote['LOTES_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
            
            await samosFB.update(id, 'LOTES', lote, params);
            await utils.dblog(params);
            return { results: lote };
        } catch(error) {
            const msg = 'Falha ao alterar lote';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'LOTES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar lote';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
