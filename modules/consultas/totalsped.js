'use strict';

const samosFB = require('../../services/samosFB');
const moment = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { mes, ano, empresas } = params;

            const inicio = moment(`01/${mes}/${ano}`, 'DD/MM/YYYY');
            const final  = moment(inicio).add(1, 'month').subtract(1, 'day');

            const sqlSearch = `select count(*) from MOVIMENTOS where 
                (
                    ${empresas.split(',').map(empresa => {
                        return `MOVIMENTOS_ID_EMPRESAS = ${empresa}`
                    }).join(' or ')}
                ) and (
                    right(MOVIMENTOS_ID_DOCUMENTOS,4) = '0003' or
                    right(MOVIMENTOS_ID_DOCUMENTOS,4) = '0004'
                ) and 
                MOVIMENTOS_EMISSAO between '${inicio.format('YYYY-MM-DD')}' and '${final.format('YYYY-MM-DD')}'
            `;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return results[0]['COUNT'];
        } catch(error) {
            const msg = 'Falha ao verificar total de documentos do SPED';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};