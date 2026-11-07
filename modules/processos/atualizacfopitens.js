'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    create: async (data, params) => {
        try {
            const itens = data.itens;
            let sqlListItens = '';

            for(let item of itens){
                sqlListItens += `update MOVIMENTOSITENS set MOVIMENTOSITENS_ID_OPERACOES = 610000,
                 MOVIMENTOSITENS_EXCECAO = 'F' where MOVIMENTOSITENS_ID = ${item['MOVIMENTOSITENS_ID_EMPRESAS']};`
            }
 
            const executeBlock = `execute block as begin ${sqlListItens} end;`;

            await samosFB.executeSQL(executeBlock, params);

            return {
                results: sqlListItens,
                total: 1
            }
        } catch(error) {
            const msg = error.message ? 'Falha ao exportar Pendências' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};