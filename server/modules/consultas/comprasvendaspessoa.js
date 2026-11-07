'use strict';

const samosFB = require('../../services/samosFB');
const utils = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { pessoa, produto, acao, inicio, final } = params;


            const sqlEmpresa = params.empresa ? ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and ` : '';
            const sqlProduto = produto ? ` MOVIMENTOSITENS_ID_PRODUTOS = '${produto}' and ` : '';
            const sqlDescend = params.ordem == 'D' ? 'descending' : '';

            const sqlSearch = `select 
                MOVIMENTOS_ID_EMPRESAS, 
                MOVIMENTOSITENS_ID_MOVIMENTOS,
                MOVIMENTOS_EMISSAO, 
                MOVIMENTOS_NUMERO, 
                MOVIMENTOS_SERIE,
                MOVIMENTOS_ID_DOCUMENTOS, 
                DOCUMENTOS_NOME,
                MOVIMENTOSITENS_ID_PRODUTOS, 
                PRODUTOS_NOME,
                PRODUTOS_MARCA,
                PRODUTOS_UNIDADE,
                MOVIMENTOSITENS_QUANTIDADE, 
                MOVIMENTOSITENS_PRECO, 
                MOVIMENTOSITENS_TOTAL
            from MOVIMENTOSITENS
            join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
            join DOCUMENTOS on DOCUMENTOS_ID  = MOVIMENTOS_ID_DOCUMENTOS
            join PRODUTOS   on PRODUTOS_ID    = MOVIMENTOSITENS_ID_PRODUTOS
            join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
            where MOVIMENTOS_ID_PESSOAS = '${pessoa}'  and
                OPERACOES_ACAO = '${acao}' and
                MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                ${sqlEmpresa}
                ${sqlProduto}
                ((MOVIMENTOS_STATUS <> 'C') and 
                 (MOVIMENTOS_STATUS <> 'D') and
                 (MOVIMENTOS_STATUS <> 'R') and
                 (MOVIMENTOS_STATUS <> 'V'))
            order by MOVIMENTOS_EMISSAO ${sqlDescend}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            //soma os totais em MOVIMENTOSITENS_TOTALGERAL
            const totalGeral = results.reduce((total, movimento) => {
                return total += utils.number.cents(movimento['MOVIMENTOSITENS_TOTAL'])
            }, 0);

            results.forEach(movimento => {
                movimento['MOVIMENTOSITENS_TOTALGERAL'] = totalGeral / 100
            });

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar compras/vendas por pessoa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
