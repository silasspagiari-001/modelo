'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, produto, inicio, final } = params;
            const estoqueMultiEmpresa = process.env[params.client ? ((params.client || '').toUpperCase() + '_ESTOQUE') : 'ESTOQUE'] == 'MULTIEMPRESA';
            const whereEmpresas = estoqueMultiEmpresa ? '' : ` MOVIMENTOS_ID_EMPRESAS = ${empresa} and `;
            const anoInicial = inicio.slice(6, 11);
            const anoFinal = final.slice(6, 11);  
            
            /* Aqui deduzia as devoluções...

            const sqlSearch = `execute block returns (
                ANO integer,
                MES integer,
                VENDAS numeric(12,3),
                COMPRAS numeric(12,3)
            ) as
            declare variable ACAO       varchar(2);
            declare variable QUANTIDADE numeric(12,3);
            declare variable V_MES integer;
            declare variable V_ANO integer;
            begin
                V_ANO = ${anoInicial};
                while ( :V_ANO <= ${anoFinal} ) do
                    begin
                        V_MES = 1;
                        while ( :V_MES <= 12 ) do
                            begin
                                VENDAS  = 0;
                                COMPRAS = 0;
                                MES = :V_MES;
                                ANO = :V_ANO;

                                for
                                    select extract(year from MOVIMENTOS_EMISSAO),
                                            OPERACOES_ACAO,
                                            MOVIMENTOSITENS_QUANTIDADE
                                    from movimentositens
                                    join movimentos on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS      
                                    join produtos on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                    join operacoes on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                                    where   ${whereEmpresas}
                                            MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
                                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                            extract(month from MOVIMENTOS_EMISSAO) = :V_MES and
                                            extract(year from MOVIMENTOS_EMISSAO) = :V_ANO and
                                            ((MOVIMENTOS_STATUS <> 'C') and 
                                             (MOVIMENTOS_STATUS <> 'D') and
                                             (MOVIMENTOS_STATUS <> 'R') and
                                             (MOVIMENTOS_STATUS <> 'V')) and
                                            OPERACOES_ACAO <> '--'
                                    order by MOVIMENTOS_EMISSAO
                                    into
                                        :ANO,
                                        :ACAO,
                                        :QUANTIDADE
                                do
                                    begin
                                        if (ACAO = 'CN') then
                                            begin
                                                COMPRAS = COMPRAS + :QUANTIDADE;
                                            end
                                        else
                                            if (ACAO = 'DC') then
                                                begin
                                                    COMPRAS = COMPRAS - :QUANTIDADE;
                                                end
                                            else
                                                if (ACAO = 'VN') then
                                                    begin
                                                        VENDAS = VENDAS + :QUANTIDADE;
                                                    end
                                                else
                                                    if (ACAO = 'DV') then
                                                        begin
                                                            VENDAS = VENDAS - :QUANTIDADE;
                                                        end

                                    end
                                V_MES = :V_MES + 1;
                                suspend;
                            end
                            V_ANO = :V_ANO + 1;
                    end
            end;`;

            */
                        
            const sqlSearch = `execute block returns (
                ANO integer,
                MES integer,
                VENDAS numeric(12,3),
                COMPRAS numeric(12,3)
            ) as
            declare variable ACAO       varchar(2);
            declare variable QUANTIDADE numeric(12,3);
            declare variable V_MES integer;
            declare variable V_ANO integer;
            begin
                V_ANO = ${anoInicial};
                while ( :V_ANO <= ${anoFinal} ) do
                    begin
                        V_MES = 1;
                        while ( :V_MES <= 12 ) do
                            begin
                                VENDAS  = 0;
                                COMPRAS = 0;
                                MES = :V_MES;
                                ANO = :V_ANO;

                                for
                                    select extract(year from MOVIMENTOS_EMISSAO),
                                            OPERACOES_ACAO,
                                            MOVIMENTOSITENS_QUANTIDADE
                                    from movimentositens
                                    join movimentos on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS      
                                    join produtos on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                    join operacoes on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                                    where   ${whereEmpresas}
                                            MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and
                                            MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                            extract(month from MOVIMENTOS_EMISSAO) = :V_MES and
                                            extract(year from MOVIMENTOS_EMISSAO) = :V_ANO and
                                            ((MOVIMENTOS_STATUS <> 'C') and 
                                             (MOVIMENTOS_STATUS <> 'D') and
                                             (MOVIMENTOS_STATUS <> 'R') and
                                             (MOVIMENTOS_STATUS <> 'V')) and
                                            OPERACOES_ACAO <> '--'
                                    order by MOVIMENTOS_EMISSAO
                                    into
                                        :ANO,
                                        :ACAO,
                                        :QUANTIDADE
                                do
                                    begin
                                        if (ACAO = 'CN') then
                                            begin
                                                COMPRAS = COMPRAS + :QUANTIDADE;
                                            end
                                        else
                                            if (ACAO = 'VN') then
                                                begin
                                                    VENDAS = VENDAS + :QUANTIDADE;
                                                end
                                    end
                                V_MES = :V_MES + 1;
                                suspend;
                            end
                            V_ANO = :V_ANO + 1;
                    end
            end;`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar gráfico do produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
