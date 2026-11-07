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

            let results;
                        
            if(checagem == 'T' || checagem == 'P') { //se checagem = 'T' (Autorizado) ou 'P' (Pendente) busca no redis para não sobrecarregar o firebird
                const notificacoes = await readFromRedis(params);

                if(checagem == 'T') {
                    results = notificacoes.results.filter(notificacao => {
                        const statusLiberacao = notificacao['NOTIFICACAO_STATUS'] ;                   
                        return (statusLiberacao == 'T' || statusLiberacao == 'F');
                    });    
                } else { // P
                    results = notificacoes.results.filter(notificacao => {
                        const statusLiberacao = notificacao['NOTIFICACAO_STATUS'];
                        return statusLiberacao == 'P';
                    });    
                }

                return results;
                
            } else {
                return await readFromFirebird(params);
            }

        } catch(error) {
            const msg = 'Falha ao buscar liberações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async function (notificacao, params) {
        try {
            await this.lote.create([notificacao], params);
            return { results: notificacao };        
        } catch(error) {
            const msg = 'Falha ao criar liberação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, notificacao, params) => {
        try {
            const sql = `select NOTIFICACAO_ID_USUARIOS,
                                NOTIFICACAO_ID_DESTINO,
                                NOTIFICACAO_STATUS from NOTIFICACAO where NOTIFICACAO_ID = '${id}'`;
                                
            const notificacaoOriginal = (await samosFB.executeSQL(sql, params))[0];

            await samosFB.update(id, 'NOTIFICACAO', notificacao, params);

            //se status = T (Liberada), insere/altera no redis
            if(notificacao['NOTIFICACAO_STATUS'] == 'T' || notificacao['NOTIFICACAO_STATUS'] == 'F') { // Liberada ou negada
                await samosRedis.insert('NOTIFICACAO', Object.assign(notificacaoOriginal, notificacao), params);
//              await samosRedis.delete(id, 'NOTIFICACAO', params);
            //caso o status seja recusada ou pendente, apaga do redis
            //no redis só ficam liberações autorizadas
//            } else if(notificacao['NOTIFICACAO_STATUS'] == 'P') {
  //              await samosRedis.delete(id, 'NOTIFICACAO', params);*/
            }

            await utils.dblog(params);

            return { results: notificacao };
        } catch(error) {
            const msg = 'Falha ao alterar liberação';
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
            const msg = 'Falha ao deletar liberação';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        create: async (notificacoes, params) => {
            try {
        
                await samosFB.insert('NOTIFICACAO', notificacoes, params);
                await samosRedis.insert('NOTIFICACAO', notificacoes, params);

                return { results: notificacoes };
            } catch(error) {
                const msg = 'Falha ao criar liberações em lote';
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

                const notificacoesLiberadas = notificacoes.filter(notificacao => notificacao['NOTIFICACAO_STATUS'] == 'T')
                const notificacoesPendentes = notificacoes.filter(notificacao => notificacao['NOTIFICACAO_STATUS'] == 'P');

                //se status = T (Liberada), insere/altera no redis
                await samosRedis.insert('NOTIFICACAO', notificacoesLiberadas, params);
                
                //caso o status seja F (Recusada), apaga do redis
                //no redis só ficam notificacoes Pendentes e liberadas
                const idsPendentes = notificacoesPendentes.map(notificacao => notificacao['NOTIFICACAO_ID']);
                await samosRedis.delete(idsPendentes, 'NOTIFICACAO', params);
            } catch(error) {
                const msg = 'Falha ao alterar liberações em lote';
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }
    }
};

async function readFromRedis(params) {

    const where = [{
        key: 'NOTIFICACAO_SMS',
        on: '==',
        value: 'W' // Só os não resolvidos
    }];

    const results = await samosRedis.query('NOTIFICACAO', where, params);

    return { results, total: results.length }
}

async function readFromFirebird(params) {
    const { inicio, final, conteudo, ordem, status, start, limit } = params;

    //traz todas as liberações resolvidas e a resolver
    let sqlWhere = `where (
        (NOTIFICACAO_SMS  = 'W') or 
        (NOTIFICACAO_SMS = 'R')
    ) `;

    let sqlWhereSearch = '';
    let sqlOrder = '';

    if(status == 0) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'P' `;
    } else if(status == 1) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'T' `;
    } else if(status == 2) {
        sqlWhere += ` and NOTIFICACAO_STATUS = 'F' `;
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