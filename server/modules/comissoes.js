'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, tipo, vendedor, inicio, final} = params;
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(vendedor > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
            }

            if (tipo == '0') {  // Relatório Sintético
                sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS,
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA = 0
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
                                        
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA = 0
                                                        THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAO) ELSE 0 END) MOVIMENTOS_COMISSAOVISTA,
                                        
                                        
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA <> 0
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
                                        
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA > 0
                                                        THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAOPRAZO) ELSE 0 END) MOVIMENTOS_COMISSAOPRAZO,

                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                                                        and MOVIMENTOS_STATUS <> 'C'
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO,
                                        
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                                                        and MOVIMENTOS_STATUS <> 'C'
                                                        THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAO) ELSE 0 END) MOVIMENTOS_COMISSAODEVOLUCAO
                                                                                            
                                        FROM MOVIMENTOSITENS                                    
                                        left outer join MOVIMENTOS      on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
                                        left outer join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
                                        left outer join SALDOS          on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and 
                                                                           SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                                        left outer join USUARIOS        on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS                                    
                                        where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                        ${sqlWhere}
                                        group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS
                                        order by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS`
            } else {    // Analítico
                sqlSearch = `SELECT MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, MOVIMENTOSITENS_QUANTIDADE,
                 MOVIMENTOSITENS_TOTAL, SALDOS_COMISSAO, SALDOS_COMISSAOPRAZO,
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA = 0
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
              
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA = 0
                              THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAO) ELSE 0 END) MOVIMENTOS_COMISSAOVISTA,
              
              
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA > 0
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
              
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA > 0
                              THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAOPRAZO) ELSE 0 END) MOVIMENTOS_COMISSAOPRAZO,

                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                              and MOVIMENTOS_STATUS <> 'C'
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO,
              
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                              and MOVIMENTOS_STATUS <> 'C'
                              THEN ((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) * 0.01 * SALDOS_COMISSAO) ELSE 0 END) MOVIMENTOS_COMISSAODEVOLUCAO
                
              FROM MOVIMENTOSITENS                                    
              left outer join MOVIMENTOS      on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
              left outer join MOVIMENTOSCAIXA on MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOS_ID
              left outer join PRODUTOS        on MOVIMENTOSITENS_ID_PRODUTOS   = PRODUTOS_ID
              left outer join SALDOS          on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and 
                                                 SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
              left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
              where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                and (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)))
              ${sqlWhere}                
              GROUP BY MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO,
                       MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, MOVIMENTOSITENS_QUANTIDADE, MOVIMENTOSITENS_TOTAL, SALDOS_COMISSAO, SALDOS_COMISSAOPRAZO`
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar comissões';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
