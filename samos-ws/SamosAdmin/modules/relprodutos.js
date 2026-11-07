'use strict';

const fs      = require('fs');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const cents = utils.number.cents.bind(utils.number);

module.exports = {
    read: async params => {
        try {
            const { ordem, 
                    inicio, 
                    final, 
                    grupoinicial,
                    grupofinal,
                    status } = params;

            let sqlWhere = `where PRODUTOS_ID > 0 `;
            let sqlOrder = '';
               
            if(status) {
                sqlWhere += `and PRODUTOS_STATUS = '${status}' `
            }

            if(ordem == 0) {  // Grupo
                sqlWhere += (cents(grupoinicial) && cents(grupofinal)) ? `and PRODUTOS_ID_GRUPOS between ${grupoinicial} and ${grupofinal}` : '';
                sqlOrder = ' order by PRODUTOS_ID_GRUPOS, PRODUTOS_NOME ';  
            } else if (ordem == 1) { // Código
                sqlOrder = ' order by PRODUTOS_ID ';  
            } else if (ordem == 2) {  // Alfabética
                sqlOrder = ' order by PRODUTOS_NOME ';
            }

           const sql = `select PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_UNIDADE, NCMS_NCM, SALDOS_DISPONIVEL, SALDOS_PRECO, PRODUTOS_ID_GRUPOS, GRUPOS_NOME
                from PRODUTOS
                left outer join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID and SALDOS_ID_EMPRESAS = ${params.empresaLogada}
                left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                left outer join NCMS   on NCMS_ID = PRODUTOS_ID_NCMS
                ${sqlWhere} ${sqlOrder}`;

            const results = await samosFB.executeSQL(sql, params);

            return { results }
        } catch(error) {
            const msg = 'Falha ao buscar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
}