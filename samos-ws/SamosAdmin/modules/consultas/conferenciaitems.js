'use strict';

const samosFB = require('../../services/samosFB');
const samosRedis = require('../../services/samosRedis');

module.exports = {
    read: async params => {
        try {
            const { barras, movimento } = params;
            
            let sqlWhere = ` where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento} `;

            if((barras || '').slice(0, 1) == '.') {
                sqlWhere += ` and PRODUTOS_ID = '${barras.slice(1, Infinity)}'`;
            } else {
                sqlWhere += ` and PRODUTOS_BARRA = '${barras}'`
            }

            const sql = `select
                MOVIMENTOSITENS_ID_PRODUTOS
            from MOVIMENTOSITENS
            join produtos on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
            ${sqlWhere}`;

            const results = JSON.parse(await samosRedis.get(`${params.client} ${sql}`)) || await samosFB.executeSQL(sql, params);

            if(results) {
                await samosRedis.set(`${params.client} ${sql}`, JSON.stringify(results), 'ex', 60);
            }
            
            return {
                results: { 
                    'MOVIMENTOSITENS_ID_PRODUTOS': results[0] ? results[0]['MOVIMENTOSITENS_ID_PRODUTOS'] : 0
                }
            }
        } catch(error) {
            const msg = 'Falha ao fazer conferência dos itens do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};