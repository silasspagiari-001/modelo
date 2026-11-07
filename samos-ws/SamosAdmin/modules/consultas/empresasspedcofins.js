'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, simples } = params || {};
            let sqlWhere = `where EMPRESAS_ID > 0 and EMPRESAS_STATUS = 'T' `;
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and EMPRESAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and EMPRESAS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by EMPRESAS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and EMPRESAS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by EMPRESAS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += `and EMPRESAS_FANTASIA like '%${conteudo}%' `;
                    sqlOrder = ' order by EMPRESAS_FANTASIA ';  
                } else if (ordem == 3) {
                    sqlWhere += `and EMPRESAS_CPFCNPJ like '%${conteudo}%' `;
                    sqlOrder = ' order by EMPRESAS_CPFCNPJ ';  
                } else if (ordem == 4) {
                    sqlWhere += conteudo > 0 ? `and EMPRESAS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by EMPRESAS_ID ';  
                } else if(ordem == 5){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'EMPRESAS',
                        chave: 'EMPRESAS_ID',
                        campos: [
                            'EMPRESAS_ID',                                
                            'EMPRESAS_NOME',
                            'EMPRESAS_FANTASIA',
                            'EMPRESAS_CPFCNPJ',
                            'EMPRESAS_LOGIN',
                            'EMPRESAS_EMAIL',
                            'EMPRESAS_INSCRICAO'
                        ]
                    }, params);

                    sqlWhere += `and EMPRESAS_ID = '${id}' `;
                    sqlOrder = ' order by EMPRESAS_ID '; 
                }
            }    

            const sqlSearch = `select 
                EMPRESAS.*, 
                CIDADES_NOME, 
                CIDADES_ESTADO 
            from EMPRESAS
            left outer join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
            ${sqlWhere} ${sqlOrder}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar empresas sped/cofins';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
