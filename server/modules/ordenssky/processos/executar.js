'use strict';

const samosFB = require('../../../services/samosFirebird');
const moment  = require('moment-timezone');

module.exports = {
    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                //primeiro atualiza o log e status no cabecalho
                const log = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
                
                sql = `update ORDENS set
                    ORDENS_LOG    = '${log}',
                    ORDENS_STATUS = '7'
                where ORDENS_ID = '${id}'
                `
                await db.query(sql);

                //depois atualiza os itens

                sql = `update ORDENSAVARIADOS set
                    ORDENSAVARIADOS_EXECUCAO     = '${moment.tz(params.timezone).format('YYYY-MM-DD')}',
                    ORDENSAVARIADOS_HORAEXECUCAO = '${moment.tz(params.timezone).format('HH:mm:ss')}'
                where ORDENSAVARIADOS_ID_ORDENS = '${id}' `;
                
                await db.query(sql);
            
                samosFB.processarGravacao({db, results: [data], resolve, reject});
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro ordenssky/processos/executar`, db, error, reject);
            }
        });
    }
};