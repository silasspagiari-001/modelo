'use strict';

//metodo chamado pelo lazarus para fazer o sped

const samosFB = require('../../services/samosFB');
const samosRedis = require('../../services/samosRedis');

module.exports = {
    read: async params => {
        try {
            const { empresa, datafinal } = params;

            const sqlSearch = `execute block returns(
                PRODUTOS_ID       integer,      
                PRODUTOS_NOME     varchar(100),
                PRODUTOS_UNIDADE  varchar(03),  
                PRODUTOS_BARRA    varchar(15),  
                NCMS_NCM          varchar(10),  
                NCMS_CEST         varchar(10),  
                GRUPOS_NOME       varchar(50),  
                SALDOS_CSTLOCAL   varchar(4),   
                SALDOS_ICMSLC     numeric(7,3), 
                SALDOS_QUANTIDADE numeric(12,3),
                SALDOS_CUSTO      numeric(12,2),
                SALDOS_COMPRA     numeric(12,2),
                SALDOS_PRECO      numeric(12,2),
                SALDOS_MEDIO      numeric(12,2),
                SALDOS_RESERVADO  numeric(12,2))
            as                                                    
            declare variable V_SALDO         numeric(12,3);       
            declare variable V_SITUACAO      char(1);       
            declare variable V_PRODUTO       varchar(10);         
            declare variable V_ESTOQUE       varchar(1);          
            declare variable V_QUANTIDADE    numeric(12,3);       
            declare variable V_TOTAL         numeric(12,2);           
            declare variable V_CUSTOATUAL    numeric(12,2);
            declare variable V_CUSTOANTERIOR numeric(12,2);
            declare variable V_MEDIO         numeric(12,2); 
            declare variable V_EMISSAO       date;
            declare variable V_ENTRADASAIDA  date;
            begin                                                 
            for
            select                                            
                PRODUTOS_ID,                                    
                PRODUTOS_NOME,                                  
                PRODUTOS_UNIDADE,                               
                PRODUTOS_BARRA,                                 
                NCMS_NCM,                                       
                NCMS_CEST,                                      
                GRUPOS_NOME,                                    
                SALDOS_CSTLOCAL,                                
                SALDOS_ICMSLC,                                  
                SALDOS_CUSTO,                                   
                SALDOS_COMPRA,                                  
                SALDOS_PRECO,
                SALDOS_RESERVADO                                 
            from PRODUTOS                                     
            join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS     
            join NCMS on NCMS_ID = PRODUTOS_ID_NCMS           
            join SALDOS on SALDOS_ID_EMPRESAS = '${params.empresaLogada}' and SALDOS_ID_PRODUTOS = PRODUTOS_ID
            where PRODUTOS_INVENTARIO = 'T' and
                  PRODUTOS_ID_GRUPOS between ${params.grupoinicial || 0} and ${params.grupofinal || 99999}
                  order by GRUPOS_NOME, PRODUTOS_NOME                            
            into                                              
                :PRODUTOS_ID,                                   
                :PRODUTOS_NOME,                                 
                :PRODUTOS_UNIDADE,                              
                :PRODUTOS_BARRA,                                
                :NCMS_NCM,                                      
                :NCMS_CEST,                                     
                :GRUPOS_NOME,                                   
                :SALDOS_CSTLOCAL,                               
                :SALDOS_ICMSLC,                                 
                :SALDOS_CUSTO,                                  
                :SALDOS_COMPRA,                                 
                :SALDOS_PRECO,                                   
                :SALDOS_RESERVADO
            do                                                
            begin
                V_SALDO = 0;
                V_MEDIO = iif(SALDOS_RESERVADO = 0, SALDOS_CUSTO, SALDOS_RESERVADO);
                
                for
                    select MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, OPERACOES_ESTOQUE, sum(MOVIMENTOSITENS_QUANTIDADE)
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
                    left outer join SALDOS     on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                    where MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID and
                        MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada} and
                        ((MOVIMENTOS_STATUS <> 'C') and 
                         (MOVIMENTOS_STATUS <> 'D') and
                         (MOVIMENTOS_STATUS <> 'R')) and
                        OPERACOES_ESTOQUE <> 'N'
                    group by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
                    order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
                    into :V_EMISSAO, :V_ENTRADASAIDA, :V_ESTOQUE,:V_QUANTIDADE
                do
                    begin
                        if ((V_EMISSAO <= '${datafinal}') and (V_ENTRADASAIDA <= '${datafinal}')) then
                            begin
                                if (V_ESTOQUE = 'C') then
                                    V_SALDO = V_SALDO + :V_QUANTIDADE;
                                else if (V_ESTOQUE = 'D') then
                                    V_SALDO = V_SALDO - :V_QUANTIDADE;
                            end
                    end
                
                if (V_SALDO > 0) then
                    begin
                      SALDOS_QUANTIDADE = V_SALDO;
                      SALDOS_MEDIO      = V_MEDIO; 
                      suspend;  
                    end
                end
            end`;
        
/*            
            const sqlSearch = `execute block returns(
                PRODUTOS_ID       integer,      
                PRODUTOS_NOME     varchar(100),
                PRODUTOS_UNIDADE  varchar(03),  
                PRODUTOS_BARRA    varchar(15),  
                NCMS_NCM          varchar(10),  
                NCMS_CEST         varchar(10),  
                GRUPOS_NOME       varchar(50),  
                SALDOS_CSTLOCAL   varchar(4),   
                SALDOS_ICMSLC     numeric(7,3), 
                SALDOS_QUANTIDADE numeric(12,3),
                SALDOS_CUSTO      numeric(12,2),
                SALDOS_COMPRA     numeric(12,2),
                SALDOS_PRECO      numeric(12,2),
                SALDOS_MEDIO      numeric(12,2),
                SALDOS_RESERVADO  numeric(12,2))
            as                                                    
            declare variable V_SALDO         numeric(12,3);       
            declare variable V_SITUACAO      char(1);       
            declare variable V_PRODUTO       varchar(10);         
            declare variable V_ESTOQUE       varchar(1);          
            declare variable V_QUANTIDADE    numeric(12,3);       
            declare variable V_TOTAL         numeric(12,2);           
            declare variable V_CUSTOATUAL    numeric(12,2);
            declare variable V_CUSTOANTERIOR numeric(12,2);
            declare variable V_MEDIO         numeric(12,2); 
            declare variable V_EMISSAO       date;
            declare variable V_ENTRADASAIDA  date;
            begin                                                 
            for
            select                                            
                PRODUTOS_ID,                                    
                PRODUTOS_NOME,                                  
                PRODUTOS_UNIDADE,                               
                PRODUTOS_BARRA,                                 
                NCMS_NCM,                                       
                NCMS_CEST,                                      
                GRUPOS_NOME,                                    
                SALDOS_CSTLOCAL,                                
                SALDOS_ICMSLC,                                  
                SALDOS_CUSTO,                                   
                SALDOS_COMPRA,                                  
                SALDOS_PRECO,
                SALDOS_RESERVADO                                 
            from PRODUTOS                                     
            join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS     
            join NCMS on NCMS_ID = PRODUTOS_ID_NCMS           
            join SALDOS on SALDOS_ID_EMPRESAS = '${empresa || params.empresaLogada}' and SALDOS_ID_PRODUTOS = PRODUTOS_ID
            where PRODUTOS_INVENTARIO = 'T' and
                  PRODUTOS_ID_GRUPOS between ${params.grupoinicial || 0} and ${params.grupofinal || 99999}
                  order by GRUPOS_NOME, PRODUTOS_NOME                            
            into                                              
                :PRODUTOS_ID,                                   
                :PRODUTOS_NOME,                                 
                :PRODUTOS_UNIDADE,                              
                :PRODUTOS_BARRA,                                
                :NCMS_NCM,                                      
                :NCMS_CEST,                                     
                :GRUPOS_NOME,                                   
                :SALDOS_CSTLOCAL,                               
                :SALDOS_ICMSLC,                                 
                :SALDOS_CUSTO,                                  
                :SALDOS_COMPRA,                                 
                :SALDOS_PRECO,                                   
                :SALDOS_RESERVADO
            do                                                
            begin
                V_SALDO = 0;
                V_MEDIO = iif(SALDOS_RESERVADO = 0, SALDOS_CUSTO, SALDOS_RESERVADO);
                
                for
                    select MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA, OPERACOES_ESTOQUE, sum(MOVIMENTOSITENS_QUANTIDADE)
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
                    left outer join SALDOS     on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                    where MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID and
                        MOVIMENTOS_ID_EMPRESAS = ${empresa || params.empresaLogada} and
                        ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                        OPERACOES_ESTOQUE <> 'N'
                    group by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
                    order by MOVIMENTOS_EMISSAO, MOVIMENTOS_ENTRADASAIDA,OPERACOES_ESTOQUE
                    into :V_EMISSAO, :V_ENTRADASAIDA, :V_ESTOQUE,:V_QUANTIDADE
                do
                    begin
                        if ((V_EMISSAO <= '${datafinal}') and (V_ENTRADASAIDA <= '${datafinal}')) then
                            begin
                                if (V_ESTOQUE = 'C') then
                                    V_SALDO = V_SALDO + :V_QUANTIDADE;
                                else if (V_ESTOQUE = 'D') then
                                    V_SALDO = V_SALDO - :V_QUANTIDADE;
                            end
                    end
                
                if (V_SALDO > 0) then
                    begin
                      SALDOS_QUANTIDADE = V_SALDO;
                      SALDOS_MEDIO      = V_MEDIO; 
                      suspend;  
                    end
                end
            end`;
*/


            //const cacheData = await samosRedis.get(sqlSearch);
            const results = /*cacheData ? JSON.parse(cacheData) : */await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            //await samosRedis.set(sqlSearch, JSON.stringify(results), 'EX', 60 * 60 * 24);

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar inventário';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
