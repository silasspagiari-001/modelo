'use strict';

const samosFB = require('../../../services/samosFirebird');
const moment  = require('moment-timezone');

module.exports = {
    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';
            
            try {
                //primeiro atualiza o log no cabecalho
                const log = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
                
                sql = `update ORDENS set
                    ORDENS_LOG = '${log}'
                where ORDENS_ID = '${data['ORDENSAVARIADOS_ID_ORDENS']}'
                `
                await db.query(sql);

                //depois atualiza o item

                sql = `update ORDENSAVARIADOS set
                    ORDENSAVARIADOS_REFERENCIA   = '${data['ORDENSAVARIADOS_REFERENCIA']}',
                    ORDENSAVARIADOS_SIGLA        = '${data['ORDENSAVARIADOS_SIGLA']}',
                    ORDENSAVARIADOS_MODELO       = '${data['ORDENSAVARIADOS_MODELO']}',
                    ORDENSAVARIADOS_DESCRICAO    = '${data['ORDENSAVARIADOS_DESCRICAO']}',
                    ORDENSAVARIADOS_SERIAL       = '${data['ORDENSAVARIADOS_SERIAL']}',
                    ORDENSAVARIADOS_CARTAO       = '${data['ORDENSAVARIADOS_CARTAO']}',
                    ORDENSAVARIADOS_AGENDADA     = '${data['ORDENSAVARIADOS_AGENDADA'] || '1899-12-30'}',
                    ORDENSAVARIADOS_HORAAGENDADA = '${data['ORDENSAVARIADOS_HORAAGENDADA']}',
                    ORDENSAVARIADOS_LOCACAO      = '${data['ORDENSAVARIADOS_LOCACAO'] || '1899-12-30'}',
                    ORDENSAVARIADOS_HORALOCACAO  = '${data['ORDENSAVARIADOS_HORALOCACAO']}',
                    ORDENSAVARIADOS_LIMITE       = '${data['ORDENSAVARIADOS_LIMITE'] || '1899-12-30'}',
                    ORDENSAVARIADOS_HORALIMITE   = '${data['ORDENSAVARIADOS_HORALIMITE']}',
                    ORDENSAVARIADOS_EXECUCAO     = '${data['ORDENSAVARIADOS_EXECUCAO'] || '1899-12-30'}',
                    ORDENSAVARIADOS_HORAEXECUCAO = '${data['ORDENSAVARIADOS_HORAEXECUCAO']}',
                    ORDENSAVARIADOS_SITUACAO     = '${data['ORDENSAVARIADOS_SITUACAO'] === true ? 'T' : 'F'}'
                where ORDENSAVARIADOS_ID = '${data['ORDENSAVARIADOS_ID']}' `;
                
                await db.query(sql);
            
                samosFB.processarGravacao({db, results: [data], resolve, reject});
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro ordenssky/processos/avariados`, db, error, reject);
            }
        });
    }
};