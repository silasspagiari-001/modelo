'use strict';

const samosFB = require('../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    create: async (data, params) => {
        params = params || data;
    
        try {
            let descricao = (params.log + (params.senhaNivel == 'true' ? ' (AUTORIZADO)' : ''));
            
            const metodos = {
                'GET'   : 'Busca',
                'POST'  : 'Inclusão',
                'PUT'   : 'Alteração',
                'DELETE': 'Exclusão '
            };

            Object.keys(metodos).forEach(metodo => {
                descricao = descricao.replace(metodo, metodos[metodo]).slice(0, 100);
            });

            const log = {
                'LOGS_ID_PESSOAS' : params.userId || 0,
                'LOGS_ID_EMPRESAS': params.empresaLogada || 0,
                'LOGS_NOME'       : descricao,
                'LOGS_DATA'       : moment.tz(params.timezone).format('YYYY-MM-DD'),
                'LOGS_HORA'       : moment.tz(params.timezone).format('HH:mm:ss'),
                'LOGS_IP'         : params.ip
            }
            
            await samosFB.insert('LOGS', log, params);
            
        } catch(error) {
            const msg = error.message ? 'Falha ao gerar log' : error;
            console.log(`Erro atualização de saldo ${empresa ? ` - Empresa: ${empresa}` : ''}${produtos ? ` - Produtos: ${produtos.join(',')}` : ''} `);
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
