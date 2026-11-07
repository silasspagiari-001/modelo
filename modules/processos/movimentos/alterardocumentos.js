'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (data, params) => {
        try {
            const ids = data['ids'];
            const novaEmissao = data['novaemissao'];

            const sql = `execute block as 
                declare variable ID              integer;
                declare variable OBSERVACOES     varchar(1024);
                declare variable EMISSAOANTERIOR date;
                begin
                    for
                        select MOVIMENTOS_ID, MOVIMENTOS_EMISSAO, MOVIMENTOS_OBSERVACOES 
                        from MOVIMENTOS
                        where ${ids.map(id => ` (MOVIMENTOS_ID = ${id}) `).join(' or ')}
                        into :ID, :EMISSAOANTERIOR, :OBSERVACOES
                    do
                        begin
                            update MOVIMENTOS set 
                                MOVIMENTOS_EMISSAO     = '${novaEmissao}',
                                MOVIMENTOS_OBSERVACOES = right(('Emissão Anterior: ' || extract(day from :EMISSAOANTERIOR) || '/'  || extract(month from :EMISSAOANTERIOR) || '/' || extract(year from :EMISSAOANTERIOR) || '|' || :OBSERVACOES), 510)
                            where MOVIMENTOS_ID = :ID;
                        end
                end
            `;

            await samosFB.executeSQL(sql, params);
            await utils.dblog(params);

            return data;
        } catch(error) {
            const msg = 'Falha ao atualizar emissão das requisições';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};