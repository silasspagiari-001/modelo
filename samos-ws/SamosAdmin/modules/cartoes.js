'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { empresa, operadora, inicio, final, ordem, start, limit, status} = params; 
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where CARTOES_ID_EMPRESAS = ${empresa} and CARTOES_ID > 0  `;
            let sqlOrder = '';

            if(operadora) {
                sqlWhere += ` and CARTOES_ID_OPERADORAS = '${operadora}' `;
            }

            sqlWhere += status == 0 ? `and CARTOES_STATUS = 'A' ` : status == 1 ? `and CARTOES_STATUS = 'P' ` : '';

            if (inicio && final && inicio.length > 0 && final.length > 0) {
                sqlWhere += ` and CARTOES_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }
        
            if(ordem == 0) {
                sqlOrder = ' order by CARTOES_EMISSAO, CARTOES_ID ';
            } else if (ordem == 1) {
                sqlOrder = ' order by CARTOES_CONVENIO ';  
            }    

            const sqlCount  = `select count(*) from CARTOES  ${sqlWhere}`;
            const sqlSearch = `select ${limits} CARTOES.*, 
                            ( CARTOES_VALOR - ((CARTOES_VALOR / 100) * CARTOES_TAXA)) as VALORLIQUIDO_CARTOES, 
                            ((CARTOES_VALOR - ((CARTOES_VALOR / 100) * CARTOES_TAXA)) - CARTOES_PAGO) as VALORSALDO_CARTOES,
                            ((CARTOES_VALOR - ((CARTOES_VALOR / 100) * CARTOES_TAXA)) / CARTOES_PARCELAS) as PARCELALIQUIDA_CARTOES,
                             MOVIMENTOS_NOME, OPERADORAS_NOME from CARTOES
                             left outer join MOVIMENTOS on MOVIMENTOS_ID = CARTOES_ID_MOVIMENTOS
                             left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
            ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar cartões';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');

            let sqlWhere = ` where `;

            sqlWhere += ids.reduce((result, id) => {
                return result += ` CARTOES_ID = '${id}' or `
            }, '').slice(0, -3);
            
            const sqlSearch = `select 
                CARTOES.*, 
                OPERADORAS_NOME 
            from CARTOES 
            left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS 
            ${sqlWhere} 
            order by CARTOES_ID  `;

            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async cartao => {
                const sqlItens = `select CARTOESITENS.* from CARTOESITENS
                where CARTOESITENS_ID_CARTOES = ${cartao['CARTOES_ID']}
                order by CARTOESITENS_ID`;

                cartao['CARTOES_ITENS'] = await samosFB.executeSQL(sqlItens, params);
            }));

            return { 
                results, 
                total: results.length 
            };
        } catch(error) {
            const msg = 'Falha ao buscar cartões por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (cartao, params) => { 
        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

            cartao['CARTOES_EMISSAO'] = hoje;

            await samosFB.insert('CARTOES', cartao, params);

            (cartao['CARTOES_ITENS'] || []).forEach(item => {
                item['CARTOESITENS_ID_CARTOES'] = cartao['CARTOES_ID'];
                item['CARTOESITENS_EMISSAO']    = hoje;
            });

            try {
                if((cartao['CARTOES_ITENS'] || []).length > 0) {
                    await samosFB.insert('CARTOESITENS', cartao['CARTOES_ITENS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from CARTOES      where CARTOES_ID              = ${cartao['CARTOES_ID']};
                        delete from CARTOESITENS where CARTOESITENS_ID_CARTOES = ${cartao['CARTOES_ID']};
                    end
                `, params);

                throw error;
            }

            await utils.dblog(params);  
            return { results: cartao };

        } catch(error) {
            const msg = error.message ? 'Falha ao criar cartões' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, cartao, params) => {
        const itens = cartao['CARTOES_ITENS'] || [];

        try {
            await samosFB.update(id, 'CARTOES', cartao, params);

            if(itens.length > 0) {
                const itensOriginais = await samosFB.executeSQL(`select * from CARTOESITENS where CARTOESITENS_ID_CARTOES = ${id}`, params);
                await samosFB.executeSQL(`delete from CARTOESITENS where CARTOESITENS_ID_CARTOES = ${id}`, params);
            
                itens.map(item => item['CARTOESITENS_ID_CARTOES'] = id);
                
                try {
                    await samosFB.insert('CARTOESITENS', cartao['CARTOES_ITENS'], params);
                } catch(error) {
                    if(itensOriginais) {
                        await samosFB.insert('CARTOESITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }
            
            await utils.dblog(params);
            return { results: cartao };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar cartão' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'CARTOES', params);
            await samosFB.delete(id, 'CARTOESITENS', 'CARTOES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar cartão';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        create: async (cartoes, params) => {
            try {
                const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
                const logUser = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');

                const cartoesItems = cartoes.map(cartao => {
                    return {
                        'CARTOESITENS_ID_CARTOES'   : cartao['CARTOES_ID'],
                        'CARTOESITENS_EMISSAO'      : hoje,
                        'CARTOESITENS_VALOR'        : cartao['PARCELALIQUIDA_CARTOES'],
                        'CARTOESITENS_DEBITACREDITA': 'D',
                        'CARTOESITENS_LOG'          : logUser
                    }
                });

                await samosFB.insert('CARTOESITENS', cartoesItems, params);
                
                const sqlUpdateCartao = cartoes.map(cartao => {
                    let vlLancamento = cartao['PARCELALIQUIDA_CARTOES'];
                    let statusCartao = ((cartao['CARTOES_PAGO'] + vlLancamento) >= cartao['VALORLIQUIDO_CARTOES']) ? 'P' : 'A';

                    return `update CARTOES set 
                        CARTOES_PAGO   = (CARTOES_PAGO + ${vlLancamento}),
                        CARTOES_STATUS = '${statusCartao}',
                        CARTOES_LOG    = '${logUser}' 
                    where CARTOES_ID = ${cartao['CARTOES_ID']}`;
                }).join(';')

                await samosFB.executeSQL(`execute block as begin ${sqlUpdateCartao} end;`, params);

                // Passo 3 - Gera o lançamento no controle bancário
                const controles = cartoes.map(cartao => {
                    return {
                        'CONTROLES_STATUS'       : 'T',
                        'CONTROLES_ID_PORTADORES': params.idPortador,
                        'CONTROLES_ID_APLICACOES': 1,
                        'CONTROLES_EMISSAO'      : hoje,
                        'CONTROLES_VENCIMENTO'   : hoje,
                        'CONTROLES_COMPENSADO'   : hoje,
                        'CONTROLES_NOME'         : `Cartao - aut: ${cartao['CARTOES_AUTORIZACAO']}`,
                        'CONTROLES_DOCUMENTO'    : `${cartao['CARTOES_ORIGEM']} ${cartao['CARTOES_SERIE']}`,
                        'CONTROLES_TIPO'         : 'E',
                        'CONTROLES_VALOR'        : cartao['PARCELALIQUIDA_CARTOES'],
                        'CONTROLES_LOG'          : logUser
                    }
                });

                await samosFB.insert('CONTROLES', controles, params);
            } catch(error) {
                const msg = error.message ? 'Falha ao alterar cartões por lote' : error;
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }        
    }
};
