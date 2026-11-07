'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, pessoa, diasAtraso } = params;

            let sqlEmpresa = '';

            if(empresa && empresa > 0) {
                sqlEmpresa = `FINANCEIROS_ID_EMPRESAS = ${empresa} and `;
            }

            const executeBlock = `execute block returns (
                FINANCEIROS_ID_EMPRESAS    INTEGER ,
                FINANCEIROS_NUMERO         INTEGER,
                FINANCEIROS_SERIE          VARCHAR(3),
                FINANCEIROS_PARCELA        INTEGER,
                FINANCEIROS_EMISSAO        DATE,
                FINANCEIROS_VENCIMENTO     DATE,
                FINANCEIROS_ABERTO         NUMERIC(12,2),
                PRAZOCALCULADO_FINANCEIRO          INTEGER
            ) as
            begin
                for
                    select
                        FINANCEIROS_ID_EMPRESAS,
                        FINANCEIROS_NUMERO,
                        FINANCEIROS_SERIE,
                        FINANCEIROS_PARCELA,
                        FINANCEIROS_EMISSAO,
                        FINANCEIROS_VENCIMENTO,
                        FINANCEIROS_ABERTO
                    from FINANCEIROS
                        where FINANCEIROS_TIPO       = 'R' and
                              FINANCEIROS_STATUS     = 'A' and
                              ${sqlEmpresa}
                              FINANCEIROS_ID_PESSOAS = '${pessoa}'
                        into
                        :FINANCEIROS_ID_EMPRESAS,
                        :FINANCEIROS_NUMERO,
                        :FINANCEIROS_SERIE,
                        :FINANCEIROS_PARCELA,
                        :FINANCEIROS_EMISSAO,
                        :FINANCEIROS_VENCIMENTO,
                        :FINANCEIROS_ABERTO
                do
                    begin
                        :PRAZOCALCULADO_FINANCEIRO = datediff(day from current_date to FINANCEIROS_VENCIMENTO);
                        if(PRAZOCALCULADO_FINANCEIRO < -${diasAtraso}) then suspend;
                    end
            end`;

            const results = await samosFB.executeSQL(executeBlock, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar débitos por pessoa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
