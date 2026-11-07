'use strict';

const samosFB = require('../services/samosFB');
const moment = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { empresa, livro, tipo, inicio, final} = params;

            let sqlEmpresa = ''; 

            if((params.empresacnpj || '') == '45118377000188') { // Junção RB FT
                sqlEmpresa = `((MOVIMENTOS_ID_EMPRESAS = 2) or (MOVIMENTOS_ID_EMPRESAS = 9))`                
            } else {
                sqlEmpresa = `MOVIMENTOS_ID_EMPRESAS = ${empresa}`                
            }

            let sqlDocumento    = tipo == 0 ? ` and right(MOVIMENTOS_ID_DOCUMENTOS, 2) IN ('03', '05') and MOVIMENTOS_ID_OPERACOES < 500000 ` : ` and MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3) and MOVIMENTOS_ID_OPERACOES > 500000  `;
            let sqlDataContabil = tipo == 0 ? ` MOVIMENTOS_ENTRADASAIDA ` : ` MOVIMENTOS_EMISSAO `;
            let sqlSearch = '';

            if(livro == 3) {
                sqlSearch = `select 
                    PRODUTOS_ID,
                    PRODUTOS_NOME,
                    CIDADES_ESTADO,
                    CIDADES_NOME,
                    MOVIMENTOSITENS_ICMS,
                    sum(MOVIMENTOSITENS_QUANTIDADE) as MOVIMENTOSITENS_QUANTIDADE,
                    sum(MOVIMENTOSITENS_TOTAL)      as MOVIMENTOSITENS_TOTAL,
                    sum(MOVIMENTOSITENS_VALORICMS)  as MOVIMENTOSITENS_VALORICMS
                from MOVIMENTOSITENS
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                where MOVIMENTOS_ID_DOCUMENTOS  = 10003 and
                      ${sqlDataContabil} between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                group by 
                    PRODUTOS_ID,
                    PRODUTOS_NOME,
                    CIDADES_ESTADO,
                    CIDADES_NOME,
                    MOVIMENTOSITENS_ICMS
                order by 
                    CIDADES_ESTADO,
                    CIDADES_NOME,
                    PRODUTOS_NOME`;

            } else if(livro == 2) {
                sqlSearch = `select 
                    MOVIMENTOS_ID, 
                    MOVIMENTOS_NUMERO, 
                    MOVIMENTOS_SERIE 
                from MOVIMENTOS
                where MOVIMENTOS_ID > 0 and 
                      ${sqlEmpresa} 
                      ${sqlDocumento} and 
                      ${sqlDataContabil} between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                      
            } else {
                sqlSearch = `select 
                    ${sqlDataContabil} as MOVIMENTOS_DATACONTABIL, 
                    MOVIMENTOS_ID, 
                    MOVIMENTOS_NUMERO, 
                    MOVIMENTOS_SERIE,
                    SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4) as MOVIMENTOSITENS_ID_OPERACOES, 
                    CIDADES_ESTADO as MOVIMENTOS_ESTADO,
                    CIDADES_NOME   as MOVIMENTOS_CIDADES,
                    MOVIMENTOS_NOME, 
                    MOVIMENTOS_STATUS, 
                    MOVIMENTOSITENS_ICMS,
                    EMPRESAS_SIMPLES,
                    sum(
                        MOVIMENTOSITENS_TOTAL + 
                        MOVIMENTOSITENS_FRETE + 
                        MOVIMENTOSITENS_SEGURO + 
                        MOVIMENTOSITENS_DESPESAS +
                        MOVIMENTOSITENS_VALORIPI - 
                        MOVIMENTOSITENS_DESCONTOS +
                        MOVIMENTOSITENS_VALORST
                    ) as MOVIMENTOS_TOTAL,
                    sum(MOVIMENTOSITENS_BASEICMS)  as MOVIMENTOS_BASEICMS,
                    sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS,
                    sum(MOVIMENTOSITENS_VALORIPI)  as MOVIMENTOS_VALORIPI,                                    
                    sum(case when
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '30') or 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '40') or 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '41')
                    then (
                        MOVIMENTOSITENS_TOTAL + 
                        MOVIMENTOSITENS_FRETE + 
                        MOVIMENTOSITENS_SEGURO + 
                        MOVIMENTOSITENS_DESPESAS +
                        MOVIMENTOSITENS_VALORIPI - 
                        MOVIMENTOSITENS_DESCONTOS +
                        MOVIMENTOSITENS_VALORST
                    ) ELSE 0 END) MOVIMENTOS_ISENTAS,
                    sum(case when 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '20') or 
                        (right(trim(MOVIMENTOSITENS_CST), 2) = '70')
                    then (
                        abs(
                            MOVIMENTOSITENS_BASEICMS - 
                            MOVIMENTOSITENS_TOTAL + 
                            MOVIMENTOSITENS_FRETE + 
                            MOVIMENTOSITENS_SEGURO + 
                            MOVIMENTOSITENS_DESPESAS +
                            MOVIMENTOSITENS_VALORIPI - 
                            MOVIMENTOSITENS_DESCONTOS +
                            MOVIMENTOSITENS_VALORST
                        )
                    ) ELSE 0 END) MOVIMENTOS_REDUCAO

                    from MOVIMENTOSITENS
                        join MOVIMENTOS         on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                        left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                        join DOCUMENTOS         on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                        join EMPRESAS           on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
                    where MOVIMENTOS_ID > 0 and 
                          ${sqlEmpresa} 
                          ${sqlDocumento} and
                          ${sqlDataContabil} between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                    group by ${sqlDataContabil},
                            MOVIMENTOS_ID,
                            MOVIMENTOS_NUMERO,
                            MOVIMENTOS_SERIE,
                            SUBSTRING(CAST(MOVIMENTOSITENS_ID_OPERACOES AS VARCHAR(6)) FROM 1 FOR 4),
                            CIDADES_NOME,
                            CIDADES_ESTADO,
                            MOVIMENTOS_NOME,
                            MOVIMENTOS_STATUS,
                            MOVIMENTOSITENS_ICMS,
                            EMPRESAS_SIMPLES
                    order by ${sqlDataContabil}, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`;
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar livro icms';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
