'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { inicio, final } = params;

            const sqlSearch = `execute block returns(
                EMPRESAS_ID integer,
                EMPRESAS_FANTASIA varchar(20),
                EMPRESAS_FATURAMENTO numeric(12,2)
            ) as
                declare variable VENDAS numeric(12,2);
                declare variable DEVOLUCOES numeric(12, 2);
                begin
                    for
                        select EMPRESAS_ID, EMPRESAS_FANTASIA
                        from EMPRESAS
                        where EMPRESAS_ID between 2 and 9
                        into :EMPRESAS_ID, :EMPRESAS_FANTASIA
                    do
                        begin
                            VENDAS = 0;
                            select sum(MOVIMENTOS_IMPOSTO)
                            from MOVIMENTOS
                            where MOVIMENTOS_ID_EMPRESAS = :EMPRESAS_ID and
                                  MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                                  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                                  MOVIMENTOS_STATUS <> 'C'
                            group by MOVIMENTOS_ID_EMPRESAS
                            order by MOVIMENTOS_ID_EMPRESAS
                            into :VENDAS;
                            DEVOLUCOES = 0;
                            select sum(MOVIMENTOS_IMPOSTO)
                            from MOVIMENTOS
                            where MOVIMENTOS_ID_EMPRESAS = :EMPRESAS_ID and
                                  MOVIMENTOS_EMISSAO between '${inicio}' and '${final}' and
                                  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012' and
                                  MOVIMENTOS_STATUS <> 'C'
                            group by MOVIMENTOS_ID_EMPRESAS
                            order by MOVIMENTOS_ID_EMPRESAS
                            into :DEVOLUCOES;
                            :EMPRESAS_FATURAMENTO = (:VENDAS - :DEVOLUCOES);
                            suspend;
                        end
                end;`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar faturamento por empresa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
    