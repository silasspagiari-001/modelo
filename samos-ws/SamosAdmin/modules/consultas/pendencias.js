'use strict';

const samosFB = require('../../services/samosFB');
const utils = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { pessoa } = params;
        
            const sqlSearch = `select 
                MOVIMENTOS_ID_EMPRESAS, 
                MOVIMENTOSITENS_ID,
                MOVIMENTOSITENS_ID_MOVIMENTOS,
                MOVIMENTOS_ID_PESSOAS,
                MOVIMENTOS_NOME,
                PESSOAS_CPFCNPJ,
                PESSOAS_ENDERECO,
                CIDADES_NOME,
                CIDADES_ESTADO,
                MOVIMENTOS_EMISSAO, 
                MOVIMENTOS_NUMERO, 
                MOVIMENTOS_SERIE,
                MOVIMENTOS_PROTOCOLO,
                MOVIMENTOS_ID_DOCUMENTOS, 
                MOVIMENTOSITENS_CST,
                MOVIMENTOSITENS_ID_PRODUTOS, 
                PRODUTOS_NOME,
                PRODUTOS_MARCA,
                PRODUTOS_UNIDADE,
                MOVIMENTOSITENS_QUANTIDADE, 
                MOVIMENTOSITENS_PRECO, 
                MOVIMENTOSITENS_TOTAL,
                MOVIMENTOSITENS_DESCONTOS,
                MOVIMENTOSITENS_PERCENTUAL,
                MOVIMENTOSITENS_CUSTO,
                cast((((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) / MOVIMENTOSITENS_QUANTIDADE) as numeric(12,2)) as VALOR_LIQUIDO,
                cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO
            from MOVIMENTOS
            join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
            join MOVIMENTOSITENS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
            join PRODUTOS   on PRODUTOS_ID    = MOVIMENTOSITENS_ID_PRODUTOS
            where MOVIMENTOS_ID_PESSOAS = ${pessoa} and
                right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and
                MOVIMENTOSITENS_ID_OPERACOES = 600000 and
                ((MOVIMENTOS_STATUS <> 'C') and 
                 (MOVIMENTOS_STATUS <> 'D') and
                 (MOVIMENTOS_STATUS <> 'R') and
                 (MOVIMENTOS_STATUS <> 'V'))
            order by MOVIMENTOS_EMISSAO, PRODUTOS_NOME`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            //soma os totais em MOVIMENTOSITENS_TOTALGERAL
            const totalGeral = results.reduce((total, movimento) => {
                return total += utils.number.cents(movimento['TOTAL_LIQUIDO'])
            }, 0);

            results.forEach(movimento => {
                movimento['MOVIMENTOSITENS_TOTALGERAL'] = totalGeral / 100
            });

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar pendências por pessoa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
