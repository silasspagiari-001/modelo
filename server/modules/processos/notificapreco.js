'use strict';

const samosFB = require('../../services/samosFirebird');
const utils   = require('../../services/samosUtils');
const api     = require('../');
const moment  = require('moment-timezone');

module.exports = {
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {

            const db = await samosFB.conectarBanco(params.client) ;
            let strPrecos = '';

            try {

                const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
                const alterados = await checarAlteracoesPrecos(hoje, db);

                if(alterados.length > 0){     
                    for(let i in alterados) {
                        strPrecos += `Cód: ${alterados[i]['MOVIMENTOSITENS_ID_PRODUTOS']} - ${alterados[i]['PRODUTOS_NOME']} - ${alterados[i]['PRODUTOS_MARCA']} -  R$ ${utils.number.float2moeda(alterados[i]['SALDOS_PRECO'])}\n`;
                    }

                    const novaNotificacao = {
                        'NOTIFICACAO_ID'          : 0,
                        'NOTIFICACAO_STATUS'      : 'N',
                        'NOTIFICACAO_TODOS'       : 'F',
                        'NOTIFICACAO_ID_USUARIOS' : 2,
                        'NOTIFICACAO_ID_DESTINO'  : 51,
                        'NOTIFICACAO_NOME'        : 'NOVOS PRECOS',
                        'NOTIFICACAO_DATACRIACAO' : hoje,
                        'NOTIFICACAO_HORACRIACAO' : '23:59',
                        'NOTIFICACAO_DATAAVISAR'  : hoje,
                        'NOTIFICACAO_HORAAVISAR'  : '08:00',
                        'NOTIFICACAO_DATALEITURA' : '28.12.1899',
                        'NOTIFICACAO_HORALEITURA' : '',
                        'NOTIFICACAO_MENSAGEM'    : strPrecos.substring(0, 512),
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

const checarAlteracoesPrecos = function(inicio, db) {
    const sqlSearch = `select MOVIMENTOS_ENTRADASAIDA, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, SALDOS_PRECO from MOVIMENTOSITENS
                            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                            join SALDOS on SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                            
                            where MOVIMENTOS_ENTRADASAIDA >= '${inicio.replace (/\//ig,'.')}' and
                            ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0005') or
                            ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0004' and MOVIMENTOSITENS_ID_OPERACOES < 500000)))
                            group by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOSITENS_ID_PRODUTOS, PRODUTOS_NOME, PRODUTOS_MARCA, SALDOS_PRECO
                            order by PRODUTOS_NOME`;

        return new Promise((resolve, reject) => {
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
    })
                        
};