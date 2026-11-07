'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, inicio, final} = params;
            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if (tipo == '0') {  // Relatório Sintético
                sqlSearch = `SELECT MOVIMENTOS_ID_EMPRESAS, EMPRESAS_NOME,
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA = 0
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
                                                                                                                    
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                                                        and ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and MOVIMENTOSCAIXA_DUPLICATA <> 0
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
                                        
                                                sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                                                        and MOVIMENTOS_STATUS <> 'C'
                                                        THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO
                                        FROM MOVIMENTOSITENS                                        
                                        left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                        left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                                        left outer join MOVIMENTOSCAIXA ON MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
                                        where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                        ${sqlWhere}
                                        GROUP BY MOVIMENTOS_ID_EMPRESAS, EMPRESAS_NOME
                                        `
            } else {    // Analítico
                sqlSearch = `select MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE, MOVIMENTOS_EMISSAO, MOVIMENTOS_NOME,
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA = 0
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEVISTA,
                                          
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2)
                              and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOSCAIXA_DUPLICATA <> 0
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEPRAZO,
              
                      sum(case when MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)
                              and MOVIMENTOS_STATUS <> 'C'
                              THEN (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) ELSE 0 END) MOVIMENTOS_BASEDEVOLUCAO
                              
              FROM MOVIMENTOSITENS                                    
              left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
              left outer join MOVIMENTOSCAIXA ON MOVIMENTOSCAIXA_ID_MOVIMENTOS = MOVIMENTOSITENS_ID_MOVIMENTOS
              where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                and (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 12)))
              ${sqlWhere}                
              GROUP BY MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_DOCUMENTOS, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE,
                       MOVIMENTOS_EMISSAO, MOVIMENTOS_NOME`
            }

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};
