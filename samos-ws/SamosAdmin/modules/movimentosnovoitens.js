'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => { 
        return new Promise(async (resolve, reject) => {
            const { idmovimento } = params;
            const db = await samosFB.conectarBanco(params.client);

            const sqlSearch = `execute block
            returns (
                MOVIMENTOSITENS_ID integer,
                MOVIMENTOSITENS_ID_PRODUTOS integer,
                PRODUTOS_NOME varchar(100),
                MOVIMENTOSITENS_QUANTIDADE numeric(14,3),
                MOVIMENTOSITENS_IMEDIATA numeric(14,3),                                                
                MOVIMENTOSITENS_ENTREGUE numeric(14,3),
                MOVIMENTOSITENS_DEPOSITO numeric(14,3),
                MOVIMENTOSITENS_EMROMANEIO numeric(14,3),
                ITENS_ENTREGAR numeric(14,3))
            as
            begin
            for
                select MOVIMENTOSITENS_ID,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_NOME,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_IMEDIATA,
                    MOVIMENTOSITENS_ENTREGUE,
                    MOVIMENTOSITENS_DEPOSITO
                from MOVIMENTOSITENS
                left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idmovimento}
                order by MOVIMENTOSITENS_ID
                into :MOVIMENTOSITENS_ID,
                     :MOVIMENTOSITENS_ID_PRODUTOS,
                     :PRODUTOS_NOME,
                     :MOVIMENTOSITENS_QUANTIDADE,
                     :MOVIMENTOSITENS_IMEDIATA,
                     :MOVIMENTOSITENS_ENTREGUE,
                     :MOVIMENTOSITENS_DEPOSITO
            do
                begin
                select sum(ROMANEIOSITENS_QUANTIDADE)  from ROMANEIOSITENS
                where ROMANEIOSITENS_ID_MOVIMENTOS = ${idmovimento} and ROMANEIOSITENS_ID_ITEM = :MOVIMENTOSITENS_ID
                into
                    :MOVIMENTOSITENS_EMROMANEIO;
                if (MOVIMENTOSITENS_EMROMANEIO is null) then MOVIMENTOSITENS_EMROMANEIO = 0;
                ITENS_ENTREGAR = (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_ENTREGUE - MOVIMENTOSITENS_DEPOSITO - MOVIMENTOSITENS_EMROMANEIO);
                if (ITENS_ENTREGAR > 0) then suspend;
                end
            end;`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
}
