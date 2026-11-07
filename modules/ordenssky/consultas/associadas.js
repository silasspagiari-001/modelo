'use strict';

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { 
                rota,
                start, 
                limit
            } = params;

            const db = await samosFB.conectarBanco(params.client);
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            const sqlWhere = ` where ORDENS_ID_ORDENSROTAS = ${rota} `;
            const sqlCount = ` select count(*) from ORDENS ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits} 
                    distinct ORDENS_ID,
                    ORDENSAVARIADOS_AGENDADA,
                    ORDENS_NUMERO,
                    ORDENS_NOME,
                    ORDENS_IDENTIFICACAO,
                    ORDENS_STATUS
                from ORDENS 
                left join ORDENSAVARIADOS on ORDENS_ID = ORDENSAVARIADOS_ID_ORDENS
                ${sqlWhere} 
                order by ORDENS_NUMERO `; 

            const total = await samosFB.count(db, sqlCount);

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({ db, results, total, resolve, reject });
                }
            });
        });
    }
};