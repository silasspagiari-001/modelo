'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { numero, conteudo, inicio, final, ordem, status, start, limit } = params;
            
            let sqlOrder = '';
            let sqlWhere = `where position('${params.empresaLogada}', PROMOCOES_EMPRESAS) <> 0 `;

            if(conteudo){
                sqlWhere += `and PROMOCOES_NOME like '%${conteudo}%' `;
            }

            if(numero > 0) {
                sqlWhere += ` and PROMOCOES_ID = '${numero}'`;
                sqlOrder = ` order by PROMOCOES_ID `;
            } else {
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and PROMOCOES_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }

                if(ordem == 0) {
                    sqlOrder = ` order by PROMOCOES_EMISSAO, PROMOCOES_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by PROMOCOES_ID`;
                }

                if(status == 0) {
                    sqlWhere += ` and PROMOCOES_STATUS = 'T' `; 
                } else if(status == 1) {
                    sqlWhere += ` and PROMOCOES_STATUS = 'F' `; 
                }         
            }
                    
            const sqlCount  = `select count(PROMOCOES_ID) from PROMOCOES ${sqlWhere}`;

            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                PROMOCOES_ID,
                PROMOCOES_NOME,
                PROMOCOES_EMISSAO,
                PROMOCOES_VALIDADE    
            from PROMOCOES ${sqlWhere} ${sqlOrder}`; 
            
            const results = await samosFB.executeSQL(sql, params);
            const total = await samosFB.count(sqlCount, params);
            
            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar promoções';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select PROMOCOES.*,
                EMPRESAS_FANTASIA, EMPRESAS_NOME, CIDADES_NOME
            from PROMOCOES 
            left outer join EMPRESAS on EMPRESAS_ID = ${params.empresaLogada}
            left outer join CIDADES  on CIDADES_ID  = EMPRESAS_ID_CIDADES
            where PROMOCOES_ID = '${id}' `; 

            const results = await samosFB.executeSQL(sql, params);

            //procura os itens da promocao
            for (let promocao of results) {
                const sqlItens = `select 
                    PROMOCOESITENS.*, 
                    PRODUTOS_NOME, 
                    PRODUTOS_MARCA,
                    PRODUTOS_FABRICA, 
                    PRODUTOS_APLICACAO,
                    SALDOS_PRECOMINIMO, 
                    SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                    SALDOS_PRECO,
                    round((100 - (PROMOCOESITENS_VALOR / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADO,
                    round((100 - (PROMOCOESITENS_VALORA / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOA,
                    round((100 - (PROMOCOESITENS_VALORB / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOB,
                    round((100 - (PROMOCOESITENS_VALORC / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOC,
                    cast((PROMOCOESITENS_INDICE * PROMOCOESITENS_PARCELAS * PROMOCOESITENS_VALOR) as integer) as TOTALPARCELAS_ITENS
                from PROMOCOESITENS
                left outer join PRODUTOS on PRODUTOS_ID = PROMOCOESITENS_ID_PRODUTOS
                left outer join SALDOS   on PRODUTOS_ID = SALDOS_ID_PRODUTOS and 
                                            SALDOS_ID_EMPRESAS = ${params.empresaLogada}
                where PROMOCOESITENS_ID_PROMOCOES = ${promocao['PROMOCOES_ID']} 
                order by PROMOCOESITENS_ID`

                promocao['PROMOCOES_ITENS'] = await samosFB.executeSQL(sqlItens, params);
            }

            return { results };

        } catch(error) {
            const msg = 'Falha ao buscar promoção por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (promocao, params) => {
        try {
            await samosFB.insert('PROMOCOES', promocao, params);

            (promocao['PROMOCOES_ITENS'] || []).forEach(item => {
                item['PROMOCOESITENS_ID_PROMOCOES'] = promocao['PROMOCOES_ID'];
                item['PROMOCOESITENS_VALORA']       = item['PROMOCOESITENS_VALORA'] || 0;
                item['PROMOCOESITENS_VALORB']       = item['PROMOCOESITENS_VALORB'] || 0;
                item['PROMOCOESITENS_VALORC']       = item['PROMOCOESITENS_VALORC'] || 0;
                item['PROMOCOESITENS_DESCONTOA']    = item['PROMOCOESITENS_DESCONTOA'] || 0;
                item['PROMOCOESITENS_DESCONTOB']    = item['PROMOCOESITENS_DESCONTOB'] || 0;
                item['PROMOCOESITENS_DESCONTOC']    = item['PROMOCOESITENS_DESCONTOC'] || 0;
            });

            try {
                await samosFB.insert('PROMOCOESITENS', promocao['PROMOCOES_ITENS'], params);
            } catch(error) {
                //se der erro ao inserir itens tenta apagar o cabecalho
                await samosFB.executeSQL(`delete from PROMOCOES where PROMOCOES_ID = ${promocao['PROMOCOES_ID']} `, params);
                throw error;
            }

            return { results: promocao };
        } catch(error) {
            const msg = 'Falha ao criar promocao';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, promocao, params) => {

        try {
            //atualiza o cabecalho
            await samosFB.update(id, 'PROMOCOES', promocao, params);
            
            //se vierem itens...
            if((promocao['PROMOCOES_ITENS'] || []).length > 0) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from PROMOCOESITENS where PROMOCOESITENS_ID_PROMOCOES = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from PROMOCOESITENS where PROMOCOESITENS_ID_PROMOCOES = ${id}`, params);
            
                ((promocao['PROMOCOES_ITENS'] || [])).forEach((item, index) => {
                    item['PROMOCOESITENS_ID_PROMOCOES'] = promocao['PROMOCOES_ID']
                    item['PROMOCOESITENS_VALORA']       = item['PROMOCOESITENS_VALORA'] || 0;
                    item['PROMOCOESITENS_VALORB']       = item['PROMOCOESITENS_VALORB'] || 0;
                    item['PROMOCOESITENS_VALORC']       = item['PROMOCOESITENS_VALORC'] || 0;
                    item['PROMOCOESITENS_DESCONTOA']    = item['PROMOCOESITENS_DESCONTOA'] || 0;
                    item['PROMOCOESITENS_DESCONTOB']    = item['PROMOCOESITENS_DESCONTOB'] || 0;
                    item['PROMOCOESITENS_DESCONTOC']    = item['PROMOCOESITENS_DESCONTOC'] || 0;

                })

                let itens = promocao['PROMOCOES_ITENS'] || [];

                try {
                    //grava os itens
                    await samosFB.insert('PROMOCOESITENS', itens, params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('PROMOCOESITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }
            
            await utils.dblog(params);    

            return { results: promocao };
        } catch(error) {
            const msg = 'Falha ao alterar a promoção';
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'PROMOCOES', params);
            await samosFB.delete(id, 'PROMOCOESITENS', 'PROMOCOES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar promoção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};