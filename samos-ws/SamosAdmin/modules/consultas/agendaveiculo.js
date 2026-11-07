'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, veiculo, agendado } = params;

            const sqlSearch = `select ORDENS_NOME,
                                      substring(ORDENSSERVICOS_DESCRITIVO from 1 for 10) as DATA_AGENDADA, 
                                      substring(ORDENSSERVICOS_DESCRITIVO from 14 for 5) as HORA_AGENDADA
                               from ORDENSSERVICOS
                               join ORDENS on ORDENS_ID = ORDENSSERVICOS_ID_ORDENS
                    where ORDENS_ID_EMPRESAS = ${empresa} and
                          ORDENSSERVICOS_ID_SERVICOS = ${veiculo} and
                          substring(ORDENSSERVICOS_DESCRITIVO from 1 for 10) = '${agendado}' `;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar agendamento veículo';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
