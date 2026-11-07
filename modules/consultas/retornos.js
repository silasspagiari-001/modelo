'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, portador, inicio, empresanome } = params; 

            let sqlTitulos = '';

            if((empresanome || 'RACAFORTE').toUpperCase().match(/RACAFORTE/)) {
               sqlTitulos = `select FINANCEIROS_NUMERO,
                                    FINANCEIROS_SERIE,
                                    FINANCEIROS_STATUS, 
                                    FINANCEIROS_EXPORTADO,
                                    FINANCEIROS_PARCELA,
                                    PESSOAS_NOME,
                                    FINANCEIROS_ID_PORTADORES,
                                    FINANCEIROS_ID_PESSOAS,
                                    FINANCEIROS_NOSSONUMERO,
                                    FINANCEIROS_EMISSAO,
                                    FINANCEIROS_VENCIMENTO,
                                    FINANCEIROS_PAGAMENTO,
                                    FINANCEIROS_ORIGINAL,
                                    FINANCEIROS_ABERTO,
                                    FINANCEIROS_PAGO,
                                    FINANCEIROS_JUROS,
                                    FINANCEIROS_DESCONTOS,
                                    '06-Liquidação Normal' as FINANCEIROS_OBSERVACOES
                                  from FINANCEIROS
                                  left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                                  where FINANCEIROS_ID_EMPRESAS = ${empresa}
                                    and FINANCEIROS_TIPO = 'R'
                                    and FINANCEIROS_ID_PORTADORES = ${portador} 
                                    and FINANCEIROS_NOSSONUMERO > 0 
                                    and FINANCEIROS_BAIXA = '${inicio}'
                                    and left(FINANCEIROS_CHAVE, 2) = '06'`
            } else {
               sqlTitulos = `select FINANCEIROS_NUMERO,
                                    FINANCEIROS_SERIE,
                                    FINANCEIROS_STATUS, 
                                    FINANCEIROS_EXPORTADO,
                                    FINANCEIROS_PARCELA,
                                    PESSOAS_NOME,
                                    FINANCEIROS_ID_PORTADORES,
                                    FINANCEIROS_ID_PESSOAS,
                                    FINANCEIROS_NOSSONUMERO,
                                    FINANCEIROS_EMISSAO,
                                    FINANCEIROS_VENCIMENTO,
                                    FINANCEIROS_PAGAMENTO,
                                    FINANCEIROS_ORIGINAL,
                                    FINANCEIROS_ABERTO,
                                    FINANCEIROS_PAGO,
                                    FINANCEIROS_JUROS,
                                    FINANCEIROS_DESCONTOS,
                                    FINANCEIROS_OBSERVACOES
                                  from FINANCEIROS
                                  left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                                  where FINANCEIROS_ID_EMPRESAS = ${empresa}
                                    and FINANCEIROS_TIPO = 'R'
                                    and FINANCEIROS_ID_PORTADORES = ${portador} 
                                    and FINANCEIROS_NOSSONUMERO > 0 
                                    and (
                                         FINANCEIROS_EMISSAO = DATE '${inicio}' 
                                         or (
                                             EXTRACT(WEEKDAY FROM DATE '${inicio}') = 1
                                             AND FINANCEIROS_EMISSAO = DATE '${inicio}' - 2
                                         ) 
                                        or (
                                            FINANCEIROS_PAGAMENTO = '${inicio}'
                                            AND NOT EXISTS (
                                                SELECT 1
                                                FROM FINANCEIROSITENS
                                                WHERE FINANCEIROSITENS_ID_FINANCEIROS = FINANCEIROS_ID
                                            )
                                        )
                                    )`;
            }

            const results = await samosFB.executeSQL(sqlTitulos, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar retorno de títulos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
