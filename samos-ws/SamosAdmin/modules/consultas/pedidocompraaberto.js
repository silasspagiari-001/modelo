'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => { 
        try {
            const { idmovimento } = params;

            const sqlSearch = `select 
                MOVIMENTOSITENS_ID_PRODUTOS,
                MOVIMENTOSITENS_QUANTIDADE,
                MOVIMENTOSITENS_ENTREGUE,
                (MOVIMENTOSITENS_ENTREGUE * MOVIMENTOSITENS_PRECO) as MOVIMENTOSITENS_TOTAL,
                MOVIMENTOSITENS_PRECO,
                round(((MOVIMENTOSITENS_VALORIPI / MOVIMENTOSITENS_QUANTIDADE) * MOVIMENTOSITENS_ENTREGUE), 2) as MOVIMENTOSITENS_VALORIPI,
                round(((MOVIMENTOSITENS_FRETE / MOVIMENTOSITENS_QUANTIDADE) * MOVIMENTOSITENS_ENTREGUE), 2) as MOVIMENTOSITENS_FRETE,
                round(((MOVIMENTOSITENS_SEGURO / MOVIMENTOSITENS_QUANTIDADE) * MOVIMENTOSITENS_ENTREGUE), 2) as MOVIMENTOSITENS_SEGURO,
                round(((MOVIMENTOSITENS_DESPESAS / MOVIMENTOSITENS_QUANTIDADE) * MOVIMENTOSITENS_ENTREGUE), 2) as MOVIMENTOSITENS_DESPESAS
            from MOVIMENTOSITENS 
            where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idmovimento} and
                  MOVIMENTOSITENS_ENTREGUE > 0`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar pedidos de compra em aberto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
