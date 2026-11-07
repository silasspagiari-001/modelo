'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const api     = require('../');
const moment  = require('moment-timezone');

module.exports = {
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {

            const db = await samosFB.conectarBanco(params.client) ;

            try {

                const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
                const pendentes = await checarBoletosPendentes(params, db);
                const notificado = await checarSeJaNotificado(params, hoje, db);

                if(pendentes.length > 0 && notificado.length == 0){
                    const novaNotificacao = {
                        'NOTIFICACAO_ID'          : 0,
                        'NOTIFICACAO_STATUS'      : 'N',
                        'NOTIFICACAO_TODOS'       : 'F',
                        'NOTIFICACAO_ID_USUARIOS' : 1,    // Supervisor
                        'NOTIFICACAO_ID_DESTINO'  : 5,    // JD
                        'NOTIFICACAO_NOME'        : 'TITULOS PENDENTES - GERAR BOLETO',
                        'NOTIFICACAO_DATACRIACAO' : hoje,
                        'NOTIFICACAO_HORACRIACAO' : '05:00',
                        'NOTIFICACAO_DATAAVISAR'  : hoje,
                        'NOTIFICACAO_HORAAVISAR'  : '14:00',
                        'NOTIFICACAO_DATALEITURA' : '28.12.1899',
                        'NOTIFICACAO_HORALEITURA' : '',
                        'NOTIFICACAO_MENSAGEM'    : 'CONSTAM TITULOS PARA GERAR BOLETOS, PENDENTES A MAIS DE 15 DIAS - VERIFICAR',
                        'NOTIFICACAO_SMS'         : 'F'
                    };

                    api.notificacao().create(novaNotificacao, params);
                    db.detach();
                }
            } catch(error) { 
                samosFB.enviarRespostaErro(`Erro gerando notificação`, db, error, reject);
            }
        });
    }
};

const checarBoletosPendentes = async function(params, db) { 
    try {
        const sqlSearch = `select FINANCEIROS_ID from FINANCEIROS
                            where FINANCEIROS_TIPO = 'R' and
                                FINANCEIROS_ID_EMPRESAS = 1 and
                                FINANCEIROS_STATUS = 'A' and
                                FINANCEIROS_ID_PORTADORES = 1 and
                                (CURRENT_DATE - FINANCEIROS_EMISSAO) > 15`;
        const results = await samosFB.executeSQL(sqlSearch, params);                                

        return {results};
    } catch(error) {
        const msg = 'Falha ao consultar boletos pendentes';
        console.log(msg);
        console.log(error);
        throw { msg, error };
    }                        
};

const checarSeJaNotificado = async function(params, inicio, db) {
    try {
        const sqlSearch = `select NOTIFICACAO_ID from NOTIFICACAO
                                where NOTIFICACAO_ID_USUARIOS = 1 and
                                    NOTIFICACAO_ID_DESTINO = 5 and
                                    NOTIFICACAO_HORACRIACAO = '05:00' and
                                    NOTIFICACAO_DATACRIACAO = '${inicio.replace (/\//ig,'.')}'`;

        const results = await samosFB.executeSQL(sqlSearch, params);

        return { results };
    } catch(error) {
        const msg = 'Falha ao consultar notificação existente';
        console.log(msg);
        console.log(error);
        throw { msg, error };
    }

};