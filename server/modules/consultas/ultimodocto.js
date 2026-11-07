'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { docto, empresa, tabela } = params;

            const sqlSearch = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                declare variable incremento integer;
                begin
                    select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                    where DOCUMENTOS_ID = ${docto} and DOCUMENTOS_ID_EMPRESAS = ${empresa} into incremento,SERIE;
                    if (incremento = 0) then incremento = 1;
                    while (exists(select * from ${tabela} where ${tabela}_ID_EMPRESAS   = ${empresa}  and
                                                                ${tabela}_ID_DOCUMENTOS = ${docto}    and
                                                                ${tabela}_NUMERO        = :incremento and
                                                                ${tabela}_SERIE         = :SERIE)) do
                    begin
                        incremento = incremento + 1;
                    end
                    ULTIMO = incremento - 1;
                    suspend;
                end `;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar último documento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
