'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            await validarProducao(id, params);

            const producao = {
                'PRODUCOES_STATUS': 'C',
                'PRODUCOES_LOG'   : `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`
            }

            await samosFB.update(id, 'PRODUCOES', producao, params);

            await utils.dblog(params);
            return producao;
        } catch(error) {
            const msg = 'Falha ao cancelar a produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function validarProducao(id, params) {
    const queryProducao = await samosFB.executeSQL(`select 
        PRODUCOES_STATUS
    from PRODUCOES 
    where PRODUCOES_ID = ${id}
    `, params);

    const producao = queryProducao[0];
    
    if(producao['PRODUCOES_STATUS'] == 'C') {
        throw 'Produção já cancelada';
    }

    if(producao['PRODUCOES_STATUS'] == 'F') {
        throw 'Produção finalizada não pode ser cancelada';
    }
}