'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { usuario, criacao, descricao } = params;
            const sqlUsuario = usuario ? ` NOTIFICACAO_ID_DESTINO = '${usuario}' and ` : '';

            const sqlSearch = `select NOTIFICACAO_ID
                from NOTIFICACAO
                where NOTIFICACAO_DATACRIACAO = '${(criacao || '').replace (/\//ig,'.')}' and
                      ${sqlUsuario}
                      NOTIFICACAO_NOME like '%${descricao}%'`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar notificações existentes';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
          