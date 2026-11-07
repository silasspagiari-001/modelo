'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { empresa, pessoa, numero, serie, produto } = params;
            const documento = empresa.toString() + '0004';  // Sempre será requisição

            const sql = `execute block returns (
                CUSTO_REQUISICAO numeric(12,2)
            ) as
            declare variable MOVIMENTOSITENS_TOTAL      numeric(12,4);
            declare variable MOVIMENTOSITENS_QUANTIDADE numeric(12,4);
            declare variable MOVIMENTOSITENS_SEGURO     numeric(12,4);
            declare variable MOVIMENTOSITENS_DESPESAS   numeric(12,4);
            declare variable MOVIMENTOSITENS_DESCONTOS  numeric(12,4);
            
            begin
                CUSTO_REQUISICAO = 0;
            
                for
                    select 
                        MOVIMENTOSITENS_TOTAL,
                        MOVIMENTOSITENS_QUANTIDADE,
                        MOVIMENTOSITENS_SEGURO,
                        MOVIMENTOSITENS_DESPESAS,
                        MOVIMENTOSITENS_DESCONTOS
                    from MOVIMENTOSITENS
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                    where MOVIMENTOS_ID_EMPRESAS      = ${empresa}   and
                          MOVIMENTOS_ID_DOCUMENTOS    = ${documento} and
                          MOVIMENTOS_ID_PESSOAS       = ${pessoa}    and
                          MOVIMENTOS_NUMERO           = ${numero}    and
                          MOVIMENTOS_SERIE            = '${serie}'   and
                          MOVIMENTOSITENS_ID_PRODUTOS = ${produto}
                    into
                        :MOVIMENTOSITENS_TOTAL,
                        :MOVIMENTOSITENS_QUANTIDADE,
                        :MOVIMENTOSITENS_SEGURO,
                        :MOVIMENTOSITENS_DESPESAS,
                        :MOVIMENTOSITENS_DESCONTOS
                 do
                    begin
                        CUSTO_REQUISICAO = CUSTO_REQUISICAO + (
                            (
                                MOVIMENTOSITENS_TOTAL    +
                                MOVIMENTOSITENS_SEGURO   +
                                MOVIMENTOSITENS_DESPESAS -
                                MOVIMENTOSITENS_DESCONTOS 
                            ) / MOVIMENTOSITENS_QUANTIDADE
                        );
                    end
            
                    suspend;
            end`;

            const results = await samosFB.executeSQL(sql, params);

            return results[0]['CUSTO_REQUISICAO'];
        } catch(error) {
            const msg = 'Falha ao consultar custo de item da requisição';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};