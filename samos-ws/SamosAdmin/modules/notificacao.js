'use strict';

const utils      = require('../services/samosUtils');
const samosFB    = require('../services/samosFB');
const samosRedis = require('../services/samosRedis');
const api        = require('../modules');
const moment     = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { checagem } = params;
            
            //se checagem = 'T' busca no redis para não sobrecarregar o firebird
            if(checagem == 'T') {
                const notificacoes = await readFromRedis(params);

                const results = notificacoes.results.filter(notificacao => {
                    const data = notificacao['NOTIFICACAO_DATAAVISAR'];
                    const hora = notificacao['NOTIFICACAO_HORAAVISAR'];

                    return moment.tz(`${data} ${hora}`, params.timezone).isSameOrBefore();
                });

                validarOnline(params);

                return {
                    results,
                    total: results.length
                }
                
            } else {
                return await readFromFirebird(params);
            }

        } catch(error) {
            const msg = 'Falha ao buscar notificações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async function (notificacao, params) {
        try {
            const tipo = notificacao['NOTIFICACAO_TODOS'];

            if(tipo == 'F'){
                //tipo F (envia apenaspara o usuario especificado)
                await this.lote.create([notificacao], params);
                return { results: notificacao };
            
            } else {
                //se tipo == 'T' manda pra todo mundo, senão filtra pelo tipo
                const queryUsuarios = await samosFB.executeSQL(`select 
                    USUARIOS_ID, USUARIOS_CELULAR 
                from USUARIOS
                where (USUARIOS_STATUS = 'T' or USUARIOS_STATUS = 'I' or USUARIOS_STATUS = 'E')
                ${tipo == 'T' ? '' : `  and USUARIOS_TIPO = '${tipo}' `}`, params);

                const notificacoes = queryUsuarios.map(usuario => {
                    const model = Object.assign({}, notificacao);
                    model['NOTIFICACAO_ID_DESTINO']  = usuario['USUARIOS_ID'];
                    model['USUARIOS_CELULARDESTINO'] = usuario['USUARIOS_CELULAR'];
                    return model;
                });

                await this.lote.create(notificacoes, params);
                return { results: notificacoes };
            }

        } catch(error) {
            const msg = 'Falha ao criar notificação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, notificacao, params) => {
        try {
            const sql = `select NOTIFICACAO_STATUS from NOTIFICACAO where NOTIFICACAO_ID = '${id}'`;
            const notificacaoOriginal = (await samosFB.executeSQL(sql, params))[0];

            await samosFB.update(id, 'NOTIFICACAO', notificacao, params);

            //se status = N (Não lida) ou R (Reagendada), insere/altera no redis
            if(notificacao['NOTIFICACAO_STATUS'] != 'L') {
                await samosRedis.insert('NOTIFICACAO', Object.assign(notificacaoOriginal, notificacao), params);
            
            //caso o status seja L (Lida), apaga do redis
            //no redis só ficam notificacoes não lidas e reagendadas
            } else if(notificacao['NOTIFICACAO_STATUS'] == 'L') {
                await samosRedis.delete(id, 'NOTIFICACAO', params);
            }

            await utils.dblog(params);

            return { results: notificacao };
        } catch(error) {
            const msg = 'Falha ao alterar notificacao';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'NOTIFICACAO', params);
            await samosRedis.delete(id, 'NOTIFICACAO', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar notificação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        create: async (notificacoes, params) => {
            try {
                const numeros = notificacoes.map(notificacao => notificacao['USUARIOS_CELULARDESTINO']);
        
                await samosFB.insert('NOTIFICACAO', notificacoes, params);
                await samosRedis.insert('NOTIFICACAO', notificacoes, params);

                //se for pra enviar SMS entra aqui
                if(notificacoes[0]['NOTIFICACAO_SMS'] == 'T'){
                    const numerosValidos = numeros.filter(numero => !!numero).map(numero => {
                        let numeroValido = utils.string.onlyNumbers(numero);

                        if(numeroValido.length == 8){
                            numeroValido = '55189' + numeroValido;
                        } else if(numeroValido.length == 9){
                            numeroValido = '5518' + numeroValido;
                        } else if(numeroValido.length == 10){
                            numeroValido = '55' + numeroValido.slice(0,2) + '9' + numeroValido.slice(2,10);
                        } else if(numeroValido.length == 11){
                            numeroValido = '55' + numeroValido;
                        }

                        return numeroValido;
                    })

                    if(numerosValidos.length > 0) {
                        api.sms().create({
                            nomeEmpresa: params.nomeEmpresa,
                            numeros    : numerosValidos.join('|'), 
                            msg        : notificacoes[0]['NOTIFICACAO_MENSAGEM'], 
                            datahora   : `${notificacoes[0]['NOTIFICACAO_DATAAVISAR']} ${notificacoes[0]['NOTIFICACAO_HORAAVISAR']}`
                        }, params);
                    }
                }

                return { results: notificacoes };
            } catch(error) {
                const msg = 'Falha ao criar notificações em lote';
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        },

        update: async (notificacoes, params) => {
            try {
                notificacoes = notificacoes.map(notificacao => {
                    return {
                        'NOTIFICACAO_ID'         : notificacao['NOTIFICACAO_ID'],
                        'NOTIFICACAO_STATUS'     : notificacao['NOTIFICACAO_STATUS']      || 'N',
                        'NOTIFICACAO_TODOS'      : notificacao['NOTIFICACAO_TODOS']       || 'F',
                        'NOTIFICACAO_SMS'        : notificacao['NOTIFICACAO_SMS']         || 'F',
                        'NOTIFICACAO_ID_USUARIOS': notificacao['NOTIFICACAO_ID_USUARIOS'] || 0,
                        'NOTIFICACAO_ID_DESTINO' : notificacao['NOTIFICACAO_ID_DESTINO']  || 0,
                        'NOTIFICACAO_NOME'       : notificacao['NOTIFICACAO_NOME']        || '' ,
                        'NOTIFICACAO_DATACRIACAO': notificacao['NOTIFICACAO_DATACRIACAO'] || '1899-12-30',
                        'NOTIFICACAO_DATAAVISAR' : notificacao['NOTIFICACAO_DATAAVISAR']  || '1899-12-30',
                        'NOTIFICACAO_DATALEITURA': notificacao['NOTIFICACAO_DATALEITURA'] || '1899-12-30',
                        'NOTIFICACAO_HORACRIACAO': notificacao['NOTIFICACAO_HORACRIACAO'] || '',
                        'NOTIFICACAO_HORAAVISAR' : notificacao['NOTIFICACAO_HORAAVISAR']  || '',
                        'NOTIFICACAO_HORALEITURA': notificacao['NOTIFICACAO_HORALEITURA'] || '',
                        'NOTIFICACAO_MENSAGEM'   : notificacao['NOTIFICACAO_MENSAGEM']    || ''
                    }
                });

                await samosFB.update('NOTIFICACAO', notificacoes, params);

                const notificacoesLidas = notificacoes.filter(notificacao => notificacao['NOTIFICACAO_STATUS'] == 'L')
                const notificacoesPendentes = notificacoes.filter(notificacao => notificacao['NOTIFICACAO_STATUS'] != 'L');

                //se status = N (Não lida) ou R (Reagendada), insere/altera no redis
                await samosRedis.insert('NOTIFICACAO', notificacoesPendentes, params);
                
                //caso o status seja L (Lida), apaga do redis
                //no redis só ficam notificacoes não lidas e reagendadas
                const idsLidas = notificacoesLidas.map(notificacao => notificacao['NOTIFICACAO_ID']);
                await samosRedis.delete(idsLidas, 'NOTIFICACAO', params);
            } catch(error) {
                const msg = 'Falha ao alterar notificações em lote';
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }
    }
};

async function validarOnline(params) {
    const { client, userId, token, device } = params;

    //gera uma chave única baseada no cliente, usuário e token de sessão
    const KEY = `LOGIN|${(client || '').toUpperCase()}|${userId}|${token.split('.').pop()}`;

    //checa se está online
    const queryOnline = await samosRedis.get(KEY);
    
    //se não tiver online lança LOG de LOGON no firebird
    if(!queryOnline) {
        await utils.dblog(Object.assign(params, {
            log: `LOGIN|${device}|${token.split('.').pop()}`,
            logstatus: 'L'
        }))
    }

    //renova o status online para mais 1m30s
    await samosRedis.set(KEY, 'online', 'EX', 90);

    //aguarda 2 minutos (tempo suficiente para renovar se o usuario não sair do sistema)
    await utils.sleep(2 * 60 * 1000);

    //verifica se ainda está online
    const queryAindaOnline = await samosRedis.get(KEY);

    //senão estiver mais lança LOG de LOGOUT no firebird
    if(!queryAindaOnline) {
        await samosFB.executeSQL(`
            update LOGS set LOGS_LOGOUT = '${moment().subtract(30, 'seconds').format('HH:mm:ss')}'
            where LOGS_NOME = 'LOGIN|${token.split('.').pop()}'
        `, params)
    }
}

async function readFromRedis(params) {
    const where = [{
        key: 'NOTIFICACAO_ID_DESTINO',
        on: '==',
        value: params.userId
    }];

    const results = await samosRedis.query('NOTIFICACAO', where, params);

    return { results, total: results.length }
}

async function readFromFirebird(params) {
    const { inicio, final, conteudo, ordem, status, start, limit } = params;

    //traz todas notificações que o usuário criou e recebeu
    let sqlWhere = `where (
        NOTIFICACAO_ID_DESTINO  = '${params.userId}' or 
        NOTIFICACAO_ID_USUARIOS = '${params.userId}'
    ) `;

    let sqlWhereSearch = '';
    let sqlOrder = '';

    if(status == 0) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'N' `;
    } else if(status == 1) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'L' `;
    } else if(status == 2) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'R' `;
    } else if(status == 3) {
        sqlWhere += ` and NOTIFICACAO_ID_USUARIOS = '${params.userId}' `;
    } else if(status == 4) {
        sqlWhere += ` and NOTIFICACAO_ID_DESTINO = '${params.userId}' `;
    } else if(status == 6) {
        sqlWhere += ` and (NOTIFICACAO_STATUS = 'N' or NOTIFICACAO_STATUS = 'R') `;
    }

    if(conteudo && conteudo.substring(0, 1) == '.') {
        sqlWhere += `and NOTIFICACAO_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
    } else {    
        if(ordem == 0) {
            sqlWhere += `and NOTIFICACAO_NOME like '%${conteudo}%' `; 
            sqlOrder = ' order by NOTIFICACAO_NOME, NOTIFICACAO_DATAAVISAR ';  
        } else if (ordem == 1) {
            sqlWhere += `and NOTIFICACAO_MENSAGEM like '%${conteudo}%' `;
            sqlOrder = ' order by NOTIFICACAO_ID, NOTIFICACAO_DATAAVISAR ';  
        } else if (ordem == 2) {
            sqlWhereSearch += `and ORIGEM.USUARIOS_NOME like '%${conteudo}%' `;
            sqlOrder = ' order by NOTIFICACAO_DATAAVISAR ';
        } else if (ordem == 3) {
            sqlWhereSearch += `and DESTINO.USUARIOS_NOME like '%${conteudo}%' `;
            sqlOrder = ' order by NOTIFICACAO_DATAAVISAR ';  
        } else if(ordem == 4){
            const id = await samosFB.buscaMultipla({
                conteudo,
                tabela: 'NOTIFICACAO',
                chave: 'NOTIFICACAO_ID',
                campos: [
                    'NOTIFICACAO_ID', 
                    'NOTIFICACAO_NOME',
                    'NOTIFICACAO_MENSAGEM'
                ]
            }, params);

            sqlWhere += `and NOTIFICACAO_ID = '${id}' `;
            sqlOrder = ' order by NOTIFICACAO_ID '; 
        }
    }    
    
    if (inicio && final && inicio.length > 0 && final.length > 0) {
        if(ordem == 5) {  // Filtra pela criação
            sqlWhere += ` and NOTIFICACAO_DATACRIACAO between '${inicio}' and '${final}' `;
            sqlOrder = ' order by NOTIFICACAO_DATACRIACAO '; 
        } else { // Mantém o padrão, data avisar
            sqlWhere += ` and NOTIFICACAO_DATAAVISAR between '${inicio}' and '${final}' `;
            if(ordem == 6) {
                sqlOrder = ' order by NOTIFICACAO_DATAAVISAR';
            }
        }

    }

    const sql = `select 
        ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
        NOTIFICACAO.*, 
        ORIGEM.USUARIOS_NOME     as USUARIOS_NOMEORIGEM,
        DESTINO.USUARIOS_NOME    as USUARIOS_NOMEDESTINO,
        DESTINO.USUARIOS_CELULAR as USUARIOS_CELULARDESTINO
    from NOTIFICACAO
    left outer join USUARIOS as ORIGEM  on ORIGEM.USUARIOS_ID   = NOTIFICACAO.NOTIFICACAO_ID_USUARIOS
    left outer join USUARIOS as DESTINO on DESTINO.USUARIOS_ID  = NOTIFICACAO.NOTIFICACAO_ID_DESTINO
    ${sqlWhere} ${sqlWhereSearch} ${sqlOrder}`;

    const sqlCount  = `select count(*) from NOTIFICACAO ${sqlWhere}`;

    return { 
        results: await samosFB.executeSQL(sql, params), 
        total  : await samosFB.count(sqlCount, params)
    };
}