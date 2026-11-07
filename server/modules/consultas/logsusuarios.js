'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { usuario, inicio, final, tipo, start, limit } = params;

            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            const sqlWhere = ` where LOGS_ID > 0 
                ${usuario ? ` and LOGS_ID_PESSOAS  = '${usuario}' ` : ''}
                ${inicio  ? ` and LOGS_DATA       >= '${inicio}'  ` : ''}
                ${final   ? ` and LOGS_DATA       <= '${final}'   ` : ''}
                ${tipo    ? ` and LOGS_STATUS      = '${tipo}'    ` : ''}
            `;

            const sql = `select ${limits}
                LOGS_ID,
                LOGS_DATA,
                LOGS_HORA,
                LOGS_LOGOUT,
                LOGS_NOME,
                LOGS_STATUS,
                LOGS_ID_PESSOAS,
                USUARIOS_LOGIN,
                EMPRESAS_FANTASIA
            from LOGS
            left outer join USUARIOS on USUARIOS_ID = LOGS_ID_PESSOAS
            left outer join EMPRESAS on EMPRESAS_ID = LOGS_ID_EMPRESAS
            ${sqlWhere}
            order by LOGS_DATA, LOGS_HORA, LOGS_ID `;

            console.log('sql: ', sql)
            
            const sqlCount = `select count(*) from LOGS ${sqlWhere}`;

            const results = await samosFB.executeSQL(sql, params);
            const total   = await samosFB.count(sqlCount, params);

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar logs de usuários';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
