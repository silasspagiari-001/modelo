'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { pessoa, produto, inicio, final } = params;

            const sqlProduto = produto ? `MOVIMENTOSITENS_ID_PRODUTOS = '${produto}' and` : '';

            const sqlSearch = `execute block returns (
                MOVIMENTOS_ID_EMPRESAS integer,
                MOVIMENTOS_EMISSAO date,
                MOVIMENTOS_NUMERO integer,
                MOVIMENTOS_SERIE varchar(3),
                MOVIMENTOSITENS_ID integer,
                MOVIMENTOSITENS_ID_PRODUTOS integer,
                PRODUTOS_NOME varchar(100),
                MOVIMENTOSITENS_QUANTIDADE numeric(12,3),
                MOVIMENTOSITENS_ENTREGUE numeric(12,3),
                ENTREGUE_ROMANEIO numeric(12,3)
            ) as
               declare variable V_QUANTIDADE numeric(12, 3);
            begin
                for
                    select MOVIMENTOS_ID_EMPRESAS,
                        MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOSITENS_ID,
                        MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME,
                        MOVIMENTOSITENS_QUANTIDADE, (MOVIMENTOSITENS_ENTREGUE + MOVIMENTOSITENS_DEPOSITO)
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PRODUTOS   on PRODUTOS_ID     = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join DOCUMENTOS on DOCUMENTOS_ID  = MOVIMENTOS_ID_DOCUMENTOS
                    where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                          MOVIMENTOS_SITUACAO = 1 and
                          MOVIMENTOS_ID_PESSOAS = ${pessoa} and
                          ${sqlProduto}
                          DOCUMENTOS_NOME = 'Pedidos' and
                        ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                    order by MOVIMENTOS_EMISSAO
                    into :MOVIMENTOS_ID_EMPRESAS,
                         :MOVIMENTOS_EMISSAO,
                         :MOVIMENTOS_NUMERO,
                         :MOVIMENTOS_SERIE,
                         :MOVIMENTOSITENS_ID,
                         :MOVIMENTOSITENS_ID_PRODUTOS,
                         :PRODUTOS_NOME,
                         :MOVIMENTOSITENS_QUANTIDADE,
                         :MOVIMENTOSITENS_ENTREGUE
                do
                    begin
                        ENTREGUE_ROMANEIO = 0;
                        V_QUANTIDADE = 0;
                        for
                          select ROMANEIOSITENS_ID_ITEM, ROMANEIOSITENS_QUANTIDADE
                          from ROMANEIOSITENS where ROMANEIOSITENS_ID_ITEM = :MOVIMENTOSITENS_ID
                        into :MOVIMENTOSITENS_ID,
                             :V_QUANTIDADE
                        do
                          begin
                             ENTREGUE_ROMANEIO = ENTREGUE_ROMANEIO + V_QUANTIDADE;
                          end
                        if ((ENTREGUE_ROMANEIO + :MOVIMENTOSITENS_ENTREGUE) < :MOVIMENTOSITENS_QUANTIDADE) then suspend;
                    end
            end;`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar pendências romaneio construção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
