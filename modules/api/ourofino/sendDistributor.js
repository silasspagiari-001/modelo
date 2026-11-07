'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');

module.exports = {
    readById: async (id, params) => {
        try {

//         console.log(params);

            const sqlSearch = `
                select
                cast(EMPRESAS_ID as VARCHAR(20)) as  codi_rev,
                Left(EMPRESAS_NOME,60) as reza_rev,
                Left(EMPRESAS_FANTASIA,60) as fant_rev,
                left(EMPRESAS_CPFCNPJ,14) as cnpj_rev,
                CIDADES_IBGE as muni_rev
                from EMPRESAS
                join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
                where EMPRESAS_ID = ${id}`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            for(let i in results) {
                results[i] = lowerCaseKeys(results[i]);
            }

            const data = results.map(lowerCaseKeys);
            
            return data;
            
        } catch(error) {
            const msg = 'Falha ao buscar distributor';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }

        function lowerCaseKeys(obj) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
            );

        }

    }
};

function lowerCaseKeys(obj) {  
    if (!isObject(obj)) {
      throw new Error(`VocÃª deve enviar um objeto para a funÃ§Ã£o "lowerCaseKeys". Recebi "${typeof obj}"`)
    }
  
    return Object
      .entries(obj)
      .reduce((carry, [key, value]) => {
        carry[key.toLowerCase()] = value;
  
        return carry;
      }, {});
};

function isObject (value) {  
    return Object.prototype.toString.call(value) === '[object Object]'
};