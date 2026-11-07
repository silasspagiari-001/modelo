'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const inicio = moment.tz(params.timezone).startOf('month').format('YYYY-MM-DD');

            const sql = `execute block returns (
                LISTA varchar(256))
                as
                    declare variable V_PRIMEIRA integer;
                    declare variable V_ULTIMA integer;
                begin
                    select min(ORDENS_NUMERO) from ORDENS
                        where ORDENS_ID_EMPRESAS = ${params.empresaLogada} and
                            right(ORDENS_ID_DOCUMENTOS, 4) = '0016' and
                            ORDENS_EMISSAO >= '${inicio}'
                        into
                        :V_PRIMEIRA;
                    select max(ORDENS_NUMERO) from ORDENS
                        where ORDENS_ID_EMPRESAS = ${params.empresaLogada} and
                            right(ORDENS_ID_DOCUMENTOS, 4) = '0016' and
                            ORDENS_EMISSAO >= '${inicio}'
                        into
                        :V_ULTIMA;
        
                    LISTA = '';
                    while (V_PRIMEIRA <= V_ULTIMA) do
                    begin
                        if (
                            not exists(
                                select ORDENS_NUMERO from ORDENS
                                where ORDENS_ID_EMPRESAS = ${params.empresaLogada} and
                                    ORDENS_NUMERO = :V_PRIMEIRA and
                                    right(ORDENS_ID_DOCUMENTOS, 4) = '0016'
                                order by ORDENS_NUMERO
                            )
                        ) then
                        LISTA = LISTA || cast(V_PRIMEIRA as varchar(7)) || ',';
                        V_PRIMEIRA = V_PRIMEIRA + 1;
                    end
                    suspend;
                end`;

            return { 
                results: await samosFB.executeSQL(sql, params)
            };

        } catch(error) {
            const msg = 'Falha ao verificar sequencia de NFs-e';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
