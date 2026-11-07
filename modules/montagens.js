'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where MONTAGENS_ID > 0  `;
                sqlWhere += status == 0 ? `and MONTAGENS_STATUS = 'T' ` : status == 1 ? `and MONTAGENS_STATUS = 'F' ` : '';

            let sqlSearch = '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and MONTAGENS_ID = ${conteudo.replace(/\./ig,'')} `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and MONTAGENS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by MONTAGENS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and MONTAGENS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by MONTAGENS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and MONTAGENS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by MONTAGENS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'MONTAGENS',
                        chave: 'MONTAGENS_ID',
                        campos: [
                            'MONTAGENS_ID', 
                            'MONTAGENS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and MONTAGENS_ID = '${id}' `;
                    sqlOrder = ' order by MONTAGENS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from MONTAGENS  ${sqlWhere}`;

            sqlSearch = `select ${limits} * from MONTAGENS  ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            if((params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {
                await Promise.all(results.map(async result => {  // Explode os preços

                    const arrPrecos = (result['MONTAGENS_PRECOS'] || '||').split('|');
                    const precoA = arrPrecos[0];
                    const precoB = arrPrecos[1];
                    const precoC = arrPrecos[2];

                    result['VALOR_MONTAGEMA'] = precoA;
                    result['VALOR_MONTAGEMB'] = precoB;
                    result['VALOR_MONTAGEMC'] = precoC;                    
                }))
            }
            
            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar MONTAGENS';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (montagem, params) => {
        try {

            if((params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {
                montagem['MONTAGENS_PRECOS'] = `${montagem['VALOR_MONTAGEMA']}|${montagem['VALOR_MONTAGEMB']}|${montagem['VALOR_MONTAGEMC']}`;
            }

            await samosFB.insert('MONTAGENS', montagem, params);
            await utils.dblog(params);  
            return { results: montagem };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar montagem' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, montagem, params) => { 
        try {

            if((params.client.toUpperCase() || 'PRUDENMOVEIS').match(/PRUDENMOVEIS|EDULAR/)) {
                montagem['MONTAGENS_PRECOS'] = `${montagem['VALOR_MONTAGEMA']}|${montagem['VALOR_MONTAGEMB']}|${montagem['VALOR_MONTAGEMC']}`;
            }
            await samosFB.update(id, 'MONTAGENS', montagem, params);
            await utils.dblog(params);
            return { results: montagem };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar montagem' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'MONTAGENS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar montagem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
