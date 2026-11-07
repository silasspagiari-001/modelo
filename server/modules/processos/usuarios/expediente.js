'use strict';

const samosFB = require('../../../services/samosFB');
const moment = require('moment-timezone');

module.exports = {
    readById: async (idUsuario, params) => {
        try {
            const agora = moment.tz(params.timezone);
            const diaSem = agora.day();  // Dia da semana (1-Seg, 6-Sáb)

            const sql = `select 
                USUARIOS_ULTIMOLOG,
                USUARIOS_EXPEDIENTE,
                USUARIOS_INTERVALO,
                USUARIOS_SKYPE,
                USUARIOS_DIASATIVO,
                USUARIOS_NASCIMENTO,
                LOGS_NOME
            from USUARIOS
            left outer join LOGS on LOGS_ID_PESSOAS = USUARIOS_ID and 
                                    LOGS_STATUS     = 'P' and
                                    LOGS_DATA       = current_date
            where USUARIOS_ID = ${idUsuario}`;

            const results = await samosFB.executeSQL(sql, params);

            const logouHoje = moment(results[0]['USUARIOS_ULTIMOLOG'], 'YYYY-MM-DD').isSameOrAfter(agora.format('YYYY-MM-DD'));
            
            const diaAtivo = (results[0]['USUARIOS_DIASATIVO'] || '')[agora.day()] == 'T';
            
            const partesExpediente = (results[0]['USUARIOS_EXPEDIENTE'] || '00:00|23:59').split('|')
            const partesIntervalo  = (results[0]['USUARIOS_INTERVALO']  || '12:00|12:00').split('|')
            const partesInterSaba  = (results[0]['USUARIOS_SKYPE']      || '12:00|12:00').split('|')  // Intervalo do sábado

            const expediente = {
                entradaManha     : partesExpediente[0],
                saidaAlmoco      : (diaSem == 6 ? partesInterSaba[0] : partesIntervalo[0]),
                retornoAlmoco    : (diaSem == 6 ? partesInterSaba[1] : partesIntervalo[1]),
                saidaTarde       : partesExpediente[1]
            }
                        
            const dentroDoExpediente = (
                moment(expediente.entradaManha, 'H:m').isSameOrBefore(agora) &&
                moment(expediente.saidaAlmoco, 'H:m').isSameOrAfter(agora)
            ) || (
                moment(expediente.retornoAlmoco, 'H:m').isSameOrBefore(agora) &&
                moment(expediente.saidaTarde, 'H:m').isSameOrAfter(agora)
            )

            const partesPonto = (results[0]['LOGS_NOME'] || '00:00|00:00|00:00|00:00').split('|');

            const ponto = {
                entradaManha : partesPonto[0],
                saidaAlmoco  : partesPonto[1],
                retornoAlmoco: partesPonto[2],
                saidaTarde   : partesPonto[3]
            }

            if(ponto.entradaManha == '00:00') {
                ponto.obrigatorio = 'entradaManha';
                ponto.proximo = 'saidaAlmoco';

            } else if(
                ponto.entradaManha  !== '00:00' && 
                ponto.saidaAlmoco === '00:00'
            ){
                if(moment(expediente.saidaAlmoco, 'H:m').isSameOrBefore(agora)) {
                    ponto.obrigatorio = 'saidaAlmoco';
                } else {
                    ponto.proximo = 'saidaAlmoco';
                }

            } else if(
                ponto.entradaManha  !== '00:00' &&
                ponto.saidaAlmoco   !== '00:00' && 
                ponto.retornoAlmoco === '00:00'
            ){
                ponto.obrigatorio = 'retornoAlmoco';
                ponto.proximo = 'saidaTarde';

            } else if(
                ponto.entradaManha  !== '00:00' &&  
                ponto.saidaAlmoco   !== '00:00' &&  
                ponto.retornoAlmoco !== '00:00' &&  
                ponto.saidaTarde    === '00:00'
            ){
                if(moment(expediente.saidaTarde, 'H:m').isSameOrBefore(agora)) {
                    ponto.obrigatorio = 'saidaTarde';
                } else {
                    ponto.proximo = 'saidaTarde';
                }
            }

            return { 
                logouHoje, 
                emExpediente: diaAtivo && dentroDoExpediente,
                nascimentoCadastrado: results[0]['USUARIOS_NASCIMENTO'] && !results[0]['USUARIOS_NASCIMENTO'].match(/1899/),
                ponto,
                expediente
            };
        } catch(error) {
            const msg = 'Falha ao validar expediente';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (idUsuario, data, params) => {
        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const nascimentoDigitado = (params.nascimentoDigitado || '').replace(/\D/ig, '');
            const nascimentoCadastrado = params.nascimentoCadastrado;
            const ponto = data.ponto;

            if(ponto) {
                if(ponto == 'update') {
                    await samosFB.update(data['LOGS_ID'], 'LOGS', data, params);
                    return { results: [data], total: 1 }

                } else if(ponto == 'entradaManha') {
                    const log = {
                        'LOGS_STATUS'       : 'P',
                        'LOGS_IP'           : params.ip,
                        'LOGS_ID_PESSOAS'   : idUsuario,
                        'LOGS_DATA'         : hoje,
                        'LOGS_HORA'         : moment.tz(params.timezone).format('HH:mm:ss'),
                        'LOGS_NOME'         : `${moment.tz(params.timezone).format('HH:mm')}|00:00|00:00|00:00`
                    }

                    await samosFB.insert('LOGS', log, params);

                } else if(ponto == 'saidaAlmoco') {
                    const queryPonto = await samosFB.executeSQL(`
                        select * from LOGS 
                        where LOGS_ID_PESSOAS = '${idUsuario}' and 
                              LOGS_STATUS     = 'P' and
                              LOGS_DATA       = current_date
                    `, params);

                    const logId  = queryPonto[0]['LOGS_ID'];
                    const partes = (queryPonto[0]['LOGS_NOME'] || '|||').split('|');

                    const log = {
                        'LOGS_IP'  : params.ip,
                        'LOGS_NOME': `${partes[0]}|${moment.tz(params.timezone).format('HH:mm')}|00:00|00:00`
                    }

                    await samosFB.update(logId, 'LOGS', log, params);

                } else if(ponto == 'retornoAlmoco') {
                    const queryPonto = await samosFB.executeSQL(`
                        select * from LOGS 
                        where LOGS_ID_PESSOAS = '${idUsuario}' and 
                              LOGS_STATUS     = 'P' and
                              LOGS_DATA       = current_date
                    `, params);

                    const logId  = queryPonto[0]['LOGS_ID'];
                    const partes = (queryPonto[0]['LOGS_NOME'] || '|||').split('|');

                    const log = {
                        'LOGS_IP'  : params.ip,
                        'LOGS_NOME': `${partes[0]}|${partes[1]}|${moment.tz(params.timezone).format('HH:mm')}|00:00`
                    }

                    await samosFB.update(logId, 'LOGS', log, params);

                } else if(ponto == 'saidaTarde') {
                    const queryPonto = await samosFB.executeSQL(`
                        select * from LOGS 
                        where LOGS_ID_PESSOAS = '${idUsuario}' and 
                              LOGS_STATUS     = 'P' and
                              LOGS_DATA       = current_date
                    `, params);

                    const logId  = queryPonto[0]['LOGS_ID'];
                    const partes = (queryPonto[0]['LOGS_NOME'] || '|||').split('|');

                    const log = {
                        'LOGS_IP'  : params.ip,
                        'LOGS_NOME': `${partes[0]}|${partes[1]}|${partes[2]}|${moment.tz(params.timezone).format('HH:mm')}`
                    }

                    await samosFB.update(logId, 'LOGS', log, params);
                }

            } else if(nascimentoCadastrado == 'T') {
                const sql = `select USUARIOS_NASCIMENTO from USUARIOS where USUARIOS_ID = ${idUsuario}`;
                const results = await samosFB.executeSQL(sql, params);
    
                if(!results[0]['USUARIOS_NASCIMENTO']) {
                    throw 'Data de nascimento não cadastrada';
                }
    
                if(moment(results[0]['USUARIOS_NASCIMENTO'], 'YYYY-MM-DD').isSame(moment(nascimentoDigitado, 'DDMMYYYY'))) {
                    const sql = `update USUARIOS 
                    set USUARIOS_ULTIMOLOG = '${hoje}'
                    where USUARIOS_ID = ${idUsuario}`;
        
                    await samosFB.executeSQL(sql, params);
                } else {
                    throw 'Credenciais inválidas';
                }

            } else {
                const sql = `update USUARIOS set 
                    USUARIOS_ULTIMOLOG = '${hoje}',
                    USUARIOS_NASCIMENTO = '${moment(nascimentoDigitado, 'DDMMYYYY').format('YYYY-MM-DD')}'
                where USUARIOS_ID = ${idUsuario}`;

                await samosFB.executeSQL(sql, params);
            }

        } catch(error) {
            const msg = 'Falha ao atualizar expediente';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
