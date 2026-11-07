'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, tipo, inicio} = params;

            const isPrudenArt  = (params.client || 'PRUDENART').toUpperCase() == 'PRUDENART';

            let sqlSearch = '';
            let sqlCfop   = isPrudenArt ? `left(MOVIMENTOS_ID_OPERACOES, 4) in ('1101', '2101')` : 'MOVIMENTOS_ID_OPERACOES < 500000';

            if(tipo == 0 || tipo == 2 || tipo == 3) {// estoque físico ou físico sem icms (analítico e sintético)
                sqlSearch = `select 
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_ID_GRUPOS, 
                    GRUPOS_NOME,
                    PRODUTOS_NOME,
                    PRODUTOS_MARCA,
                    PRODUTOS_APLICACAO,
                    PRODUTOS_UNIDADE,
                    NCMS_NCM,
                    SALDOS_CUSTO,
                    SALDOS_COMPRA,
                    SALDOS_RESERVADO,
                    SALDOS_PRECO,
                    SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
                    NCMS_CSTPIS, NCMS_CSTCOFINS,
                    sum(case when OPERACOES_ESTOQUE = 'C' and ((MOVIMENTOS_STATUS <> 'C') and 
                                                               (MOVIMENTOS_STATUS <> 'D') and
                                                               (MOVIMENTOS_STATUS <> 'R'))
                            then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
                    sum(case when OPERACOES_ESTOQUE = 'D' and ((MOVIMENTOS_STATUS <> 'C') and 
                                                               (MOVIMENTOS_STATUS <> 'D') and
                                                               (MOVIMENTOS_STATUS <> 'R'))
                            then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
                from MOVIMENTOSITENS                                    
                join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
                join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
                join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
                where MOVIMENTOS_ID_EMPRESAS = ${empresa}  and 
                    ((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${inicio.replace (/\//ig,'.')}') or
                    (${sqlCfop} and MOVIMENTOS_ENTRADASAIDA <= '${inicio.replace (/\//ig,'.')}')) and
                    PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and
                    (OPERACOES_ESTOQUE = 'C' or OPERACOES_ESTOQUE = 'D') and
                    PRODUTOS_INVENTARIO = 'T'
                group by MOVIMENTOSITENS_ID_PRODUTOS, 
                    PRODUTOS_ID_GRUPOS, 
                    GRUPOS_NOME,
                    PRODUTOS_NOME,
                    PRODUTOS_MARCA,
                    PRODUTOS_APLICACAO, 
                    PRODUTOS_UNIDADE,
                    NCMS_NCM,
                    SALDOS_CUSTO, 
                    SALDOS_COMPRA,
                    SALDOS_RESERVADO,
                    SALDOS_PRECO,
                    SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
                    NCMS_CSTPIS, NCMS_CSTCOFINS
                order by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS`;

            } else {  // Estoque contábil
                sqlSearch = `select 
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_ID_GRUPOS, 
                    GRUPOS_NOME,
                    PRODUTOS_NOME,
                    PRODUTOS_MARCA,
                    PRODUTOS_APLICACAO,
                    PRODUTOS_UNIDADE,
                    NCMS_NCM,
                    SALDOS_CUSTO,
                    SALDOS_COMPRA,
                    SALDOS_PRECO,
                    SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
                    NCMS_CSTPIS, NCMS_CSTCOFINS,
                    sum(case when MOVIMENTOSITENS_ID_OPERACOES < 500000 and ((MOVIMENTOS_STATUS <> 'C') and 
                                                                             (MOVIMENTOS_STATUS <> 'D') and
                                                                             (MOVIMENTOS_STATUS <> 'R'))
                            then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_ENTRADAS,
                    sum(case when MOVIMENTOSITENS_ID_OPERACOES >= 500000 and ((MOVIMENTOS_STATUS <> 'C') and 
                                                                              (MOVIMENTOS_STATUS <> 'D') and
                                                                              (MOVIMENTOS_STATUS <> 'R'))
                            then MOVIMENTOSITENS_QUANTIDADE ELSE 0 END) MOVIMENTOSITENS_SAIDAS
                from MOVIMENTOSITENS                                    
                join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                join DOCUMENTOS on DOCUMENTOS_ID      = MOVIMENTOS_ID_DOCUMENTOS
                join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
                join GRUPOS     on GRUPOS_ID          = PRODUTOS_ID_GRUPOS
                join SALDOS     on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS AND SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                where MOVIMENTOS_ID_EMPRESAS = ${empresa}  and 
                    ((MOVIMENTOS_ID_OPERACOES > 499999 and MOVIMENTOS_EMISSAO <= '${inicio.replace (/\//ig,'.')}') or
                    (MOVIMENTOS_ID_OPERACOES < 500000 and MOVIMENTOS_ENTRADASAIDA <= '${inicio.replace (/\//ig,'.')}')) and
                    PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal} and                                        
                    PRODUTOS_INVENTARIO = 'T' and
                    ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003') or (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005'))
                group by MOVIMENTOSITENS_ID_PRODUTOS, 
                    PRODUTOS_ID_GRUPOS, 
                    GRUPOS_NOME,
                    PRODUTOS_NOME, 
                    PRODUTOS_MARCA,
                    PRODUTOS_APLICACAO,
                    PRODUTOS_UNIDADE,
                    NCMS_NCM,
                    SALDOS_CUSTO, 
                    SALDOS_COMPRA,
                    SALDOS_PRECO,
                    SALDOS_CSTLOCAL, SALDOS_CSTOUTROS, 
                    NCMS_CSTPIS, NCMS_CSTCOFINS                    
                order by PRODUTOS_ID_GRUPOS, MOVIMENTOSITENS_ID_PRODUTOS`;
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar inventário';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
