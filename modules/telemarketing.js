'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');
const api     = require('../modules');

module.exports = {
    read: async params => {
        try {
            const { vendedor, pessoa, cidade, inicio, final, mes, ordem, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            let sql      = '';
            let sqlCount = '';
            let sqlWhere = `where PESSOAS_ID > 0 `;
            let sqlOrder = '';
            
            if(pessoa) {
                sqlWhere += ` and PESSOAS_ID = '${pessoa}' `;
            }

            if(vendedor) {
                sqlWhere += ` and PESSOAS_ID_USUARIOS = '${vendedor}' `;
            }

            if(cidade) {
                sqlWhere += ` and PESSOAS_ID_CIDADES = ${cidade} `;
            }

            if(ordem == 0) {
                sqlWhere += ` and TELEMARKETING_PROXIMO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }
            
            if(ordem == 3) {
                sqlWhere += ` and extract(month from PESSOAS_NASCIMENTO) = ${(parseInt(mes) + 1)}`
                sqlOrder = ' order by PESSOAS_NASCIMENTO, PESSOAS_NOME ';  
            } else {
                sqlOrder = ' order by PESSOAS_NOME ';
            }

            if(ordem == 4) {
                sqlWhere += ` and TELEMARKETING_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }            

            if(ordem == 0 || ordem == 4) {  // Programados ou Realizados
                sqlCount  = `select count(distinct PESSOAS_ID) from PESSOAS
                             join TELEMARKETING on TELEMARKETING_ID_PESSOAS = PESSOAS_ID
                ${sqlWhere} `;                
                sql = `select ${limits} distinct
                        PESSOAS_ID,
                        PESSOAS_STATUS,
                        PESSOAS_NOME,
                        USUARIOS_NOME,
                        CIDADES_NOME,
                        CIDADES_ESTADO,
                        PESSOAS_TELEFONE,
                        PESSOAS_CELULAR,
                        PESSOAS_NASCIMENTO
                    from PESSOAS
                    join TELEMARKETING on TELEMARKETING_ID_PESSOAS = PESSOAS_ID
                    left outer join USUARIOS on USUARIOS_ID = PESSOAS_ID_USUARIOS
                    left outer join CIDADES  on CIDADES_ID  = PESSOAS_ID_CIDADES
                    ${sqlWhere} ${sqlOrder}`;            
            } else {
                sqlCount  = `select count(*) from PESSOAS ${sqlWhere} `;
                sql = `select ${limits}
                        PESSOAS_ID,
                        PESSOAS_STATUS,
                        PESSOAS_NOME,
                        USUARIOS_NOME,
                        CIDADES_NOME,
                        CIDADES_ESTADO,
                        PESSOAS_TELEFONE,
                        PESSOAS_CELULAR,
                        PESSOAS_NASCIMENTO
                    from PESSOAS
                    left outer join USUARIOS on USUARIOS_ID = PESSOAS_ID_USUARIOS
                    left outer join CIDADES  on CIDADES_ID  = PESSOAS_ID_CIDADES
                    ${sqlWhere} ${sqlOrder}`;
            }            


            const total   = await samosFB.count(sqlCount, params);
            const telemarketings = await samosFB.executeSQL(sql, params);

            await Promise.all(telemarketings.map(async telemarketing => {
                const sqlTelemarketings = `
                        select TELEMARKETING.*, PESSOAS_NOME, PESSOAS_TELEFONE, PESSOAS_CELULAR, USUARIOS_LOGIN from TELEMARKETING
                        left outer join PESSOAS on PESSOAS_ID = TELEMARKETING_ID_PESSOAS
                        left outer join USUARIOS on USUARIOS_ID = TELEMARKETING_ID_USUARIOS
                        where TELEMARKETING_ID_PESSOAS = ${telemarketing['PESSOAS_ID']}
                        order by TELEMARKETING_EMISSAO`;
    
                telemarketing['TELEMARKETING_LANCAMENTOS'] = await samosFB.executeSQL(sqlTelemarketings, params);
                telemarketing['TELEMARKETING_REGISTROS'] = telemarketing['TELEMARKETING_LANCAMENTOS'].length
            }))

            return { results: telemarketings, total }
        } catch(error) {
            const msg = 'Falha ao buscar telemarketing';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const sql = `select * from TELEMARKETING where TELEMARKETING_ID = '${id}'`;
            const results = await samosFB.executeSQL(sql, params);
            
            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar telemarketing por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (telemarketing, params) => {
        try {
            telemarketing['TELEMARKETING_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            telemarketing['TELEMARKETING_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;
            
            await samosFB.insert('TELEMARKETING', telemarketing, params);
            await utils.dblog(params); 

            return { results: telemarketing };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar telemarketing' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, telemarketing, params) => {
        try {
            telemarketing['TELEMARKETING_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;

            await samosFB.update(id, 'TELEMARKETING', telemarketing, params);
            await utils.dblog(params);

            return { results: telemarketing };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar telemarketing' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'TELEMARKETING', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar telemarketing';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        create: async (telemarketings, params) => {
            try {
                telemarketings.forEach(async telemarketing => {
                    telemarketing['TELEMARKETING_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
                    telemarketing['TELEMARKETING_LOG'] = `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`;                    
                });

                await samosFB.insert('TELEMARKETING', telemarketings, params);
                await utils.dblog(params);
                return { results: telemarketings };
            } catch(error) {
                const msg = error.message ? 'Falha ao inserir telemarketing por lote' : error;
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }
    }
};

async function criarNotificacao (telemarketing, params) {

    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const hora = moment.tz(params.timezone).format('HH:mm');
    const proximoAtendimento = itens[itens.length - 1];
    const dataAvisar = telemarketing['TELEMARKETING_PROXIMO'];
    const horaAvisar = telemarketing['TELEMARKETING_NUMERO'];

    const notificacao = {
        'NOTIFICACAO_STATUS'      : 'N',
        'NOTIFICACAO_TODOS'       : 'F',
        'NOTIFICACAO_ID_USUARIOS' : params.userId,
        'NOTIFICACAO_ID_DESTINO'  : proximoAtendimento['TELEMARKETINGITENS_ID_USUARIOS'],
        'NOTIFICACAO_NOME'        : 'TELEMARKETING',
        'NOTIFICACAO_DATACRIACAO' : hoje,
        'NOTIFICACAO_HORACRIACAO' : hora,
        'NOTIFICACAO_DATAAVISAR'  : dataAvisar,
        'NOTIFICACAO_HORAAVISAR'  : moment(horaAvisar, 'HH:mm').subtract(5, 'minutes').format('HH:mm'),
        'NOTIFICACAO_DATALEITURA' : '30.12.1899',
        'NOTIFICACAO_HORALEITURA' : '',
        'NOTIFICACAO_MENSAGEM'    : `Fazer telemarketing para ${telemarketing['TELEMARKETING_NOME']} (${proximoAtendimento['TELEMARKETINGITENS_OBSERVACOES'] || ''})`,
        'NOTIFICACAO_SMS'         : 'T'
    };

    const queryNotificacaoExistente = await samosFB.executeSQL(`
        select NOTIFICACAO_ID from NOTIFICACAO where
            NOTIFICACAO_STATUS      = '${notificacao['NOTIFICACAO_STATUS']}'      and
            NOTIFICACAO_ID_USUARIOS = '${notificacao['NOTIFICACAO_ID_USUARIOS']}' and
            NOTIFICACAO_ID_DESTINO  = '${notificacao['NOTIFICACAO_ID_DESTINO']}'  and
            NOTIFICACAO_NOME        = '${notificacao['NOTIFICACAO_NOME']}'        and
            NOTIFICACAO_DATAAVISAR  = '${notificacao['NOTIFICACAO_DATAAVISAR']}'  and
            NOTIFICACAO_HORAAVISAR  = '${notificacao['NOTIFICACAO_HORAAVISAR']}'  and
            NOTIFICACAO_MENSAGEM    = '${notificacao['NOTIFICACAO_MENSAGEM']}'
    `, params);

    //se for para notificar e o registro for futuro, cria a notificação
    if(
        proximoAtendimento['TELEMARKETINGITENS_NOTIFICAR'] == 'T' &&
        queryNotificacaoExistente.length == 0
    ) {
        await api.notificacao().create(notificacao, params)
    }
}