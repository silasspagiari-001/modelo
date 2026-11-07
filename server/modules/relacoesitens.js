'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    create: async (data, params) => {
        try {
            const { idmovimento, itens } = data;

            //primeiro limpa as relaçoes existentes existentes
            await samosFB.executeSQL(`
                delete from RELACOESITENS where 
                RELACOESITENS_ID_MOVIMENTOS = ${idmovimento}
            `, params);

            if(itens.length == 0) {
                return;
            }

            //depois recria, se tiver algum
            const relacoesitens = itens.map(item => {
                return {
                    'RELACOESITENS_ID_MOVIMENTOS': idmovimento,
                    'RELACOESITENS_ID_ITENS'     : item['MOVIMENTOSITENS_ID'],
                    'RELACOESITENS_NOME'         : (item['PRODUTOS_NOME'] || '').slice(0, 100)
                }
            });

            await samosFB.insert('RELACOESITENS', relacoesitens, params);

        } catch(error) {
            const msg = 'Falha ao gravar descricao editavel';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};