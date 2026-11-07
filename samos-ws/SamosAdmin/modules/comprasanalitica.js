'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa,  grupo, pessoa, inicio, final } = params;
            
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa && empresa > 0) { sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa}`; }
            if(grupo && grupo > 0) { sqlWhere += ` and PRODUTOS_ID_GRUPOS = ${grupo}`; }
            if(pessoa && pessoa > 0) { sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = ${pessoa}`; }

            sqlSearch = `select EMPRESAS_FANTASIA,
                                MOVIMENTOSITENS_ID_PRODUTOS,
                                PRODUTOS_NOME,
                                MOVIMENTOSITENS_QUANTIDADE,
                                MOVIMENTOSITENS_PRECO,
                                MOVIMENTOSITENS_DESCONTOS,
                                MOVIMENTOSITENS_TOTAL,
                                MOVIMENTOSITENS_BASEICMS,
                                MOVIMENTOSITENS_ICMS,
                                MOVIMENTOSITENS_VALORICMS,
                                MOVIMENTOSITENS_VALORST,
                                MOVIMENTOSITENS_IPI,
                                MOVIMENTOSITENS_VALORIPI,
                                MOVIMENTOSITENS_FRETE,
                                MOVIMENTOSITENS_SEGURO,
                                MOVIMENTOSITENS_DESPESAS,
                                MOVIMENTOSITENS_ID_OPERACOES,
                                MOVIMENTOS_NUMERO,
                                MOVIMENTOS_SERIE,
                                MOVIMENTOS_EMISSAO,
                                MOVIMENTOS_ENTRADASAIDA,
                                MOVIMENTOS_ID_PESSOAS,
                                MOVIMENTOS_NOME,
                                CIDADES_ESTADO,
                                MOVIMENTOS_PRODUTOS,
                                MOVIMENTOS_DESCONTOS,
                                MOVIMENTOS_TOTAL,
                                MOVIMENTOS_VALORICMS,
                                MOVIMENTOS_VALORST,
                                MOVIMENTOS_VALORIPI,
                                MOVIMENTOS_FRETE,
                                MOVIMENTOS_SEGURO,
                                MOVIMENTOS_DESPESAS, 
                                SALDOS_PRECO,
                                SALDOS_PRAZO,
                                OPERACOES_ACAO                           
                            from MOVIMENTOSITENS
                                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                join CIDADES    on CIDADES_ID = PESSOAS_ID_CIDADES
                                join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                                join OPERACOES  on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                                join EMPRESAS   on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                            where  right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005' and
                                   MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                   ((OPERACOES_ACAO = 'CN') or (OPERACOES_ACAO = 'BO')) ${sqlWhere}
                                order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_NUMERO, MOVIMENTOSITENS_ID`;
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar compras';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};