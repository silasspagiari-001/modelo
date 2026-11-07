'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const grams   = utils.number.grams.bind(utils.number);

module.exports = {
    read: async params => {
        try {
            const { produto, datasaldo } = params;
            
            const sql = `select OPERACOES_ESTOQUE,sum(MOVIMENTOSITENS_QUANTIDADE)
                           from MOVIMENTOSITENS
                           left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                           left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
            where MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
                MOVIMENTOS_ENTRADASAIDA <= '${datasaldo.replace (/\//ig,'.')}' and
                OPERACOES_ESTOQUE <> 'N' and
                ((MOVIMENTOS_STATUS <> 'C') and 
                 (MOVIMENTOS_STATUS <> 'D') and
                 (MOVIMENTOS_STATUS <> 'R'))
            group by OPERACOES_ESTOQUE`;

            const results = await samosFB.executeSQL(sql, params);

            let saldoProduto = 0;

            for(let i in results) {
                if(results[i]['OPERACOES_ESTOQUE'] == 'C') {
                    saldoProduto += grams(results[i]['SUM']);
                } else {
                    saldoProduto -= grams(results[i]['SUM']);
                }
            }
            return (saldoProduto / 1000);
        } catch(error) {
            const msg = 'Falha ao consultar saldo do produto na data';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};