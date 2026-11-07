'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {

        try {
            const { docto, empresa } = params;

            let sqlSearch = '';

            if(params.client.match(/prudenmoveis/) && docto.slice(-4) == '0003' && (params.empresa == 2 || params.empresa == 9)) {  // filial RB + FT usam a mesma sequencia de NF-es
                sqlSearch = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                            declare variable incremento integer;
                            begin
                                select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                                where DOCUMENTOS_ID = 90003 and DOCUMENTOS_ID_EMPRESAS = 9 into incremento,SERIE;
                                if (incremento = 0) then incremento = 1;
                                while (exists(select MOVIMENTOS_ID from MOVIMENTOS where right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and 
                                                                            ((MOVIMENTOS_ID_EMPRESAS = 2) or (MOVIMENTOS_ID_EMPRESAS = 9)) and
                                                                            MOVIMENTOS_NUMERO        = :incremento and
                                                                            MOVIMENTOS_SERIE         = :SERIE)) do
                                begin
                                    incremento = incremento + 1;
                                end
                                ULTIMO = incremento - 1;
                                suspend;
                            end `; 
            } else {
                sqlSearch = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                            declare variable incremento integer;
                            begin
                                select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                                where DOCUMENTOS_ID = ${docto} and DOCUMENTOS_ID_EMPRESAS = ${empresa} into incremento,SERIE;
                                if (incremento = 0) then incremento = 1;
                                while (exists(select MOVIMENTOS_ID from MOVIMENTOS where MOVIMENTOS_ID_EMPRESAS   = ${empresa}  and
                                                                            MOVIMENTOS_ID_DOCUMENTOS = ${docto}    and
                                                                            MOVIMENTOS_NUMERO        = :incremento and
                                                                            MOVIMENTOS_SERIE         = :SERIE)) do
                                begin
                                    incremento = incremento + 1;
                                end
                                ULTIMO = incremento - 1;
                                suspend;
                            end `;
            }

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar último Movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
