'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const api     = require('../..');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const motivo = data['motivo'];

            const sql = `execute block as
            begin
                delete from MOVIMENTOSCAIXA   where MOVIMENTOSCAIXA_ID_MOVIMENTOS   = ${id};
                delete from CARTOES           where CARTOES_ID_MOVIMENTOS           = ${id};
                delete from CHEQUES           where CHEQUES_ID_MOVIMENTOS           = ${id};
                delete from FINANCEIROS       where FINANCEIROS_ID_MOVIMENTOS       = ${id};
                delete from MOVIMENTOSENVIO   where MOVIMENTOSENVIO_ID_MOVIMENTOS   = ${id};
                delete from MOVIMENTOSCARTAS  where MOVIMENTOSCARTAS_ID_MOVIMENTOS  = ${id};
                delete from RELACOESITENS     where RELACOESITENS_ID_MOVIMENTOS     = ${id};
            end;`;

            await samosFB.executeSQL(sql, params);

            try{
                console.log(
                    'CANCELAMENTO MOVIMENTO: ' + 
                    params.log + ' ' + 
                    'Usuario: ' + params.userId + ' - ' + 
                    moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                );
            } catch(error){
                console.log(error)
                console.log('CANCELAMENTO MOVIMENTO: ' + id)
            }

            const logUser = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');

            // depois atualiza o status do movimento
            const movimento = {
                'MOVIMENTOS_ID'          : id,
                'MOVIMENTOS_ENTRADASAIDA': '1899-12-30',
                'MOVIMENTOS_STATUS'      : 'C',
                'MOVIMENTOS_LOG'         : logUser,
                'MOVIMENTOS_OBSERVACOES' : `CANCELADO|Motivo: ${motivo}|||||||||`
            };

            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            await utils.dblog(params);

            // Por último, recalculo os saldos dos itens do movimento cancelado
            const sqlItens = `select MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOS_ID_EMPRESAS
                                from MOVIMENTOSITENS 
                                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`;

            const results = await samosFB.executeSQL(sqlItens, params);

            if(results.length > 0) {
                await api['processos/atualizasaldo']().create({
                    empresa : results[0]['MOVIMENTOS_ID_EMPRESAS'],
                    produtos: (results || []).map(item => item['MOVIMENTOSITENS_ID_PRODUTOS']),
                    client  : params.client
                });    
            }

            return movimento;
        } catch(error) {
            const msg = 'Falha ao atualizar status do movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};