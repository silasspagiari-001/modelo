'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, pessoa, produto, acao, inicio, final } = params;

            const sqlEmpresa = empresa ? `MOVIMENTOS_ID_EMPRESAS   = '${empresa}' and` : '';
            const sqlPessoa  = pessoa ? `MOVIMENTOS_ID_PESSOAS = '${pessoa}' and` : '';

            const sqlSearch = `execute block returns (
                MOVIMENTOS_ID_EMPRESAS integer,
                MOVIMENTOSITENS_ID_MOVIMENTOS integer,
                MOVIMENTOS_EMISSAO date,
                MOVIMENTOS_NUMERO integer,
                MOVIMENTOS_SERIE varchar(3),
                MOVIMENTOS_ID_DOCUMENTOS integer,
                DOCUMENTOS_NOME varchar(50),
                MOVIMENTOS_ID_PESSOAS integer,
                PESSOAS_NOME varchar(50),
                MOVIMENTOSITENS_QUANTIDADE numeric(12,3),
                MOVIMENTOSITENS_PRECO numeric(12,2),
                MOVIMENTOSITENS_TOTAL numeric(12,2),
                MOVIMENTOSITENS_TOTALGERAL numeric(12,2)
            ) as
            
            begin
                MOVIMENTOSITENS_TOTALGERAL = 0;
                for
                    select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOSITENS_ID_MOVIMENTOS,
                        MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,
                        MOVIMENTOS_ID_DOCUMENTOS, DOCUMENTOS_NOME,
                        MOVIMENTOS_ID_PESSOAS, PESSOAS_NOME,
                        MOVIMENTOSITENS_QUANTIDADE, MOVIMENTOSITENS_PRECO, 
                        cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PESSOAS    on PESSOAS_ID     = MOVIMENTOS_ID_PESSOAS
                    left outer join DOCUMENTOS on DOCUMENTOS_ID  = MOVIMENTOS_ID_DOCUMENTOS
                    left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                    where ${sqlEmpresa}
                        MOVIMENTOSITENS_ID_PRODUTOS   = '${produto}'  and
                        ${sqlPessoa}
                        MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                        OPERACOES_ACAO = '${acao}' and
                        ((MOVIMENTOS_STATUS <> 'C') and 
                         (MOVIMENTOS_STATUS <> 'D') and
                         (MOVIMENTOS_STATUS <> 'R'))
                    order by MOVIMENTOS_EMISSAO
                    into :MOVIMENTOS_ID_EMPRESAS,
                         :MOVIMENTOSITENS_ID_MOVIMENTOS,
                         :MOVIMENTOS_EMISSAO,
                         :MOVIMENTOS_NUMERO,
                         :MOVIMENTOS_SERIE,
                         :MOVIMENTOS_ID_DOCUMENTOS,
                         :DOCUMENTOS_NOME,
                         :MOVIMENTOS_ID_PESSOAS,
                         :PESSOAS_NOME,
                         :MOVIMENTOSITENS_QUANTIDADE,
                         :MOVIMENTOSITENS_PRECO,
                         :MOVIMENTOSITENS_TOTAL
                do
                    begin
                        MOVIMENTOSITENS_TOTALGERAL = MOVIMENTOSITENS_TOTALGERAL + :MOVIMENTOSITENS_TOTAL;
                        suspend;
                    end
            end;`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar compras/vendas por produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
