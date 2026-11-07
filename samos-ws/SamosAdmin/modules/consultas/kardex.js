'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, produto, inicio, final } = params;
            const estoqueMultiEmpresa = process.env[params.client ? ((params.client || '').toUpperCase() + '_ESTOQUE') : 'ESTOQUE'] == 'MULTIEMPRESA';
            let  whereEmpresas = estoqueMultiEmpresa ? `MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and ` : `MOVIMENTOS_ID_EMPRESAS = ${empresa} and MOVIMENTOSITENS_ID_PRODUTOS = ${produto} and `;
            const incluiNulos  = process.env[params.client ? ((params.client || '').toUpperCase() + '_KARDEXNULOS') : 'KARDEXNULOS'] == 'TRUE';            
             
            let sqlFiltro = '' ;
            let sqlPreco = params.client.toUpperCase().match(/PRUDENACO/) ? // Soma valor adicional, quando houver
                           'round(((MOVIMENTOSITENS_TOTAL + MOVIMENTOSITENS_DEPOSITO)/MOVIMENTOSITENS_QUANTIDADE), 2) as MOVIMENTOSITENS_PRECO' :
                           '(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) / MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOSITENS_PRECO'
            let sqlTotal = params.client.toUpperCase().match(/PRUDENACO/) ? // Soma valor adicional, quando houver
                           'cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) + MOVIMENTOSITENS_DEPOSITO) as numeric(12, 2)) as MOVIMENTOSITENS_TOTAL ' :
                           'cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL'
            
            if(params.client.toUpperCase().match(/BELLAR/)) {
              sqlFiltro = ` and ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) <> '0003')
                            or (MOVIMENTOS_EMISSAO >= '19.02.2013' and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003'))`
            } else if(params.client.toUpperCase().match(/HERBIQUIMICA/)) { // Filtra Ped/Req Faturado
              sqlFiltro = ` and MOVIMENTOSITENS_ID_OPERACOES <> 510000
                            and MOVIMENTOSITENS_ID_OPERACOES <> 610000 `
            }

            const sqlEstoque = incluiNulos ? '' : ` ((OPERACOES_ESTOQUE = 'C') or (OPERACOES_ESTOQUE = 'D')) and `;

            const sqlSearch = `execute block returns (
                MOVIMENTOSITENS_ID_MOVIMENTOS integer,
                MOVIMENTOS_ID_EMPRESAS integer,
                MOVIMENTOS_EMISSAO date,
                MOVIMENTOS_ENTRADASAIDA date,
                MOVIMENTOS_KARDEX date,
                MOVIMENTOS_NUMERO integer,
                MOVIMENTOS_SERIE varchar(3),
                MOVIMENTOSITENS_ID_OPERACOES integer,
                OPERACOES_NOME varchar(50),
                OPERACOES_ESTOQUE char(1),
                MOVIMENTOSITENS_QUANTIDADE numeric (12,3),
                MOVIMENTOSITENS_PRECO numeric (12,2),
                MOVIMENTOSITENS_TOTAL numeric (12, 2),
                PESSOAS_NOME varchar(50),
                PESSOAS_FANTASIA varchar(50),
                MOVIMENTOSITENS_SALDO  numeric (12,3)
            ) as
                declare variable V_SALDO numeric (12,3);
            
                begin
                  V_SALDO = 0;
                  for
                    select MOVIMENTOSITENS_ID_MOVIMENTOS,
                           MOVIMENTOS_ID_EMPRESAS,
                           MOVIMENTOS_EMISSAO,
                           MOVIMENTOS_ENTRADASAIDA,
                           iif(MOVIMENTOS_ENTRADASAIDA > MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_EMISSAO) as MOVIMENTOS_KARDEX,
                           MOVIMENTOS_NUMERO,
                           MOVIMENTOS_SERIE,
                           MOVIMENTOSITENS_ID_OPERACOES,
                           OPERACOES_NOME,
                           OPERACOES_ESTOQUE,
                           MOVIMENTOSITENS_QUANTIDADE,
                           ${sqlPreco},
                           ${sqlTotal},
                           PESSOAS_NOME,
                           PESSOAS_FANTASIA
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join PESSOAS on PESSOAS_ID        = MOVIMENTOS_ID_PESSOAS
                    left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                    where ${whereEmpresas}
                          ${sqlEstoque}
                          ((MOVIMENTOS_STATUS <> 'C') and 
                           (MOVIMENTOS_STATUS <> 'R') and
                           (MOVIMENTOS_STATUS <> 'D')) ${sqlFiltro}
                    order by MOVIMENTOS_KARDEX
                    into  :MOVIMENTOSITENS_ID_MOVIMENTOS,
                          :MOVIMENTOS_ID_EMPRESAS,
                          :MOVIMENTOS_EMISSAO,
                          :MOVIMENTOS_ENTRADASAIDA,
                          :MOVIMENTOS_KARDEX,
                          :MOVIMENTOS_NUMERO,
                          :MOVIMENTOS_SERIE,
                          :MOVIMENTOSITENS_ID_OPERACOES,
                          :OPERACOES_NOME,
                          :OPERACOES_ESTOQUE,
                          :MOVIMENTOSITENS_QUANTIDADE,
                          :MOVIMENTOSITENS_PRECO,
                          :MOVIMENTOSITENS_TOTAL,
                          :PESSOAS_NOME,
                          :PESSOAS_FANTASIA
                  do
                    begin
                      if (OPERACOES_ESTOQUE = 'C') then
                        begin
                          if (MOVIMENTOS_ENTRADASAIDA is not null) then
                            MOVIMENTOS_EMISSAO = MOVIMENTOS_ENTRADASAIDA;
                          V_SALDO = V_SALDO + :MOVIMENTOSITENS_QUANTIDADE;
                        end                    
                      else
                        if (OPERACOES_ESTOQUE = 'D') THEN
                          V_SALDO = V_SALDO - :MOVIMENTOSITENS_QUANTIDADE;
                        MOVIMENTOSITENS_SALDO = :V_SALDO;
                      if ((MOVIMENTOS_KARDEX >= '${inicio.replace (/\//ig,'.')}') and (MOVIMENTOS_KARDEX <= '${final.replace (/\//ig,'.')}')) then
                          suspend;
                    end
                end;`;

              console.log(sqlSearch);

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar kardex';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
