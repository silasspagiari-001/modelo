'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { tabela, campo, conteudo, tipo } = params;
            let sqlSearch = `select ${tabela}_ID, ${campo} from ${tabela} where ${campo} = '${conteudo}'`;
            
            if((params.client || '').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {
                if(tabela == 'PESSOAS' && tipo) {
                    sqlSearch += ` and PESSOAS_TIPO = '${tipo}' `
                }
            } 

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar se existe';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};