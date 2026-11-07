'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, produtoinicial, produtofinal, grupoinicial, grupofinal, inicio, final } = params;

            let parProdutoinicial = (produtoinicial > 0 ? produtoinicial : 1);
            let parProdutofinal  = (produtofinal > 0 ? produtofinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);
            let whereEmpresa = (empresa ? `MOVIMENTOS_ID_EMPRESAS = ${empresa} and ` : '');
            let sqlOrder =  params.log.match(/prudenaco/) ? 'order by MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOS_ENTRADASAIDA' : 
                                                            'order by PRODUTOS_NOME, MOVIMENTOS_ENTRADASAIDA';

            let sqlSearch = '';

            if(params.tipo == 3) { // Sem vendas no período
                sqlSearch = `select PRODUTOS_ID, 
                                    PRODUTOS_NOME, 
                                    PRODUTOS_UNIDADE,
                                    PRODUTOS_PESOLIQUIDO,
                                    NCMS_NCM, 
                                    SALDOS_RESERVADO,
                                    SALDOS_DISPONIVEL
                            from PRODUTOS
                            left outer join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                            left outer join NCMS   on NCMS_ID = PRODUTOS_ID_NCMS
                            where PRODUTOS_ID between ${parProdutoinicial} and ${parProdutofinal} and 
                                  PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} and
                                SALDOS_DISPONIVEL > 0 and
                                not exists(
                                select MOVIMENTOSITENS_ID from MOVIMENTOSITENS
                                left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                                where MOVIMENTOSITENS_ID_PRODUTOS = PRODUTOS_ID and
                                      OPERACOES_ESTOQUE = 'D' and 
                                      MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                      ((MOVIMENTOS_STATUS <> 'C') and 
                                      (MOVIMENTOS_STATUS <> 'D') and
                                      (MOVIMENTOS_STATUS <> 'R')) )
                               order by PRODUTOS_NOME`;
            } else {
                sqlSearch = `select MOVIMENTOSITENS_ID_PRODUTOS, 
                                    PRODUTOS_ID,
                                    PRODUTOS_NOME, 
                                    PRODUTOS_UNIDADE,
                                    PRODUTOS_PESOLIQUIDO,
                                    MOVIMENTOS_ID_DOCUMENTOS,
                                    MOVIMENTOS_EMISSAO, 
                                    MOVIMENTOS_ENTRADASAIDA,
                                    MOVIMENTOSITENS_ID_OPERACOES, 
                                    OPERACOES_NOME, 
                                    OPERACOES_ESTOQUE, 
                                    NCMS_NCM, 
                                    SALDOS_RESERVADO,
                                    SALDOS_DISPONIVEL,
                                    MOVIMENTOS_NUMERO, 
                                    MOVIMENTOS_SERIE, 
                                    MOVIMENTOSITENS_QUANTIDADE, 
                                    MOVIMENTOSITENS_PRECO,
                                    MOVIMENTOSITENS_TOTAL,
                                    MOVIMENTOSITENS_IPI,
                                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2))
                            from MOVIMENTOSITENS
                            left outer join MOVIMENTOS on MOVIMENTOS_ID      = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left outer join OPERACOES  on OPERACOES_ID       = MOVIMENTOSITENS_ID_OPERACOES
                            left outer join PRODUTOS   on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                            left outer join NCMS       on NCMS_ID            = PRODUTOS_ID_NCMS
                            left outer join SALDOS     on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                            where (
                                    (OPERACOES_ESTOQUE = 'C' and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}') or 
                                    (OPERACOES_ESTOQUE = 'D' and MOVIMENTOS_EMISSAO      between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}')
                                ) and
                                ${whereEmpresa}
                                MOVIMENTOSITENS_ID_PRODUTOS between ${parProdutoinicial} and ${parProdutofinal} and 
                                PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} and 
                                ((MOVIMENTOS_STATUS <> 'C') and 
                                (MOVIMENTOS_STATUS <> 'D') and
                                (MOVIMENTOS_STATUS <> 'R')) and
                                OPERACOES_ESTOQUE <> 'N' ${sqlOrder}`;
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar movimento produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
  