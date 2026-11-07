'use strict';

const samosFB = require('../../services/samosFB');
const moment = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { conteudo } = params;

            const sql = `execute block returns (ULTIMO integer) as
            declare variable incremento integer;
            declare variable ultima_gen integer;      
            declare variable altera_gen varchar(100);  
            begin
                incremento = gen_id(${conteudo}, 1);
                ultima_gen = incremento;
                ultimo = ultima_gen;
                
                altera_gen = 'set generator ${conteudo} to ' || Cast(:incremento as varchar(7));
                execute statement :altera_gen with autonomous transaction;
                suspend;
            end; `;

            const results = await samosFB.executeSQL(sql, params);

            return results[0]['ULTIMO'];
        } catch(error) {
            const msg = 'Falha ao verificar total de documentos do SPED';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};