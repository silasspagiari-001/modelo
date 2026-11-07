'use strict';

const samosFB = require('../services/samosFirebird');
const moment = require('moment-timezone')

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, inicio, final} = params;

            const db = await samosFB.conectarBanco(params.client);
            let sqlEmpresa = '';

            if((params.empresacnpj || '') == '45118377000188') { // Junção RB FT
                sqlEmpresa = `((MOVIMENTOS_ID_EMPRESAS = 2) or (MOVIMENTOS_ID_EMPRESAS = 9))`                
            } else {
                sqlEmpresa = `MOVIMENTOS_ID_EMPRESAS = ${empresa}`                
            }

            let sqlDocumento = ` and (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5) or MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 3)) `;
               
            const sqlSearch = `select 
                CIDADES_ESTADO, 
                MOVIMENTOSITENS_ID_OPERACOES, 
                MOVIMENTOSITENS_ICMS,
                sum(
                    MOVIMENTOSITENS_TOTAL + 
							  MOVIMENTOSITENS_FRETE + 
						      MOVIMENTOSITENS_SEGURO + 
							  MOVIMENTOSITENS_DESPESAS +
							  MOVIMENTOSITENS_VALORIPI - 
                              MOVIMENTOSITENS_DESCONTOS + 
                              MOVIMENTOSITENS_VALORST
                ) as MOVIMENTOS_TOTAL,
                sum(MOVIMENTOSITENS_BASEICMS) as MOVIMENTOS_BASEICMS,
                sum(MOVIMENTOSITENS_VALORICMS) as MOVIMENTOS_VALORICMS
            from MOVIMENTOSITENS
            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
            join PESSOAS    on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            join CIDADES    on CIDADES_ID = PESSOAS_ID_CIDADES
            where MOVIMENTOS_ID > 0 and 
                  ${sqlEmpresa} ${sqlDocumento} and 
                  (
                    MOVIMENTOS_STATUS <> 'C' and 
                    MOVIMENTOS_STATUS <> 'D' and
                    MOVIMENTOS_STATUS <> 'R' and
                    MOVIMENTOS_STATUS <> 'V'
                  ) and 
                  MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
            group by CIDADES_ESTADO, MOVIMENTOSITENS_ID_OPERACOES, MOVIMENTOSITENS_ICMS
            order by MOVIMENTOSITENS_ID_OPERACOES, CIDADES_ESTADO`;

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