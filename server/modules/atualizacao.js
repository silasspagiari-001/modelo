'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: params => {
        try {
            const { cadastro, atualizacaoinicial, atualizacaofinal, cidade, ordem } = params;
            let sqlWhere = '';
            let sqlSearch = '';
            let sqlOrder = '';

            const idTabela = [
                "EMPRESAS",
                "PESSOAS",
                "USUARIOS",
                "PORTADORES",
                "TRANSPORTES",
                "APLICACOES",
                "BANCOS",
                "OPERADORAS",
                "NCMS",
                "DOCUMENTOS",
                "OPERACOES",
                "PRAZOS",
                "GRUPOS",
                "RELACOES",
                "PRODUTOS",
                "SERVICOS"
            ];        

            if(cadastro < 5) {  // 0-Empresas, 1-Pessoas, 2-Usuários 3-Portadores 4-Transportes(campos em comum)
                if(ordem == 0) {
                    sqlWhere = ` where  ${idTabela[cadastro]}_NOME like '${atualizacaoinicial}%'`
                    sqlOrder = ` order by ${idTabela[cadastro]}_NOME`;
                } else {
                    sqlWhere = ` where  ${idTabela[cadastro]}_ID between ${atualizacaoinicial} and ${atualizacaofinal}`
                    sqlOrder = ` order by ${idTabela[cadastro]}_ID`;
                }          
                if(cidade > 0) {
                    sqlWhere += ` and ${idTabela[cadastro]}_ID_CIDADES = ${cidade} `;
                }    
                sqlSearch = `select ${idTabela[cadastro]}.*, CIDADES_NOME, CIDADES_ESTADO from ${idTabela[cadastro]}
                left outer join CIDADES on CIDADES_ID = ${idTabela[cadastro]}_ID_CIDADES
                ${sqlWhere} ${sqlOrder}`;
            } else {
                if(cadastro >= 5 && cadastro < 14) { // 5-Aplicacoes, 6-Bancos, 7-Operadoras 8-NCMs 9-Documentos...(campos em comum)
                    if(ordem == 0) {
                        sqlWhere = ` where  ${idTabela[cadastro]}_NOME like '${atualizacaoinicial}%'`
                        sqlOrder = ` order by ${idTabela[cadastro]}_NOME`;
                    } else {
                        sqlWhere = ` where  ${idTabela[cadastro]}_ID between ${atualizacaoinicial} and ${atualizacaofinal}`
                        sqlOrder = ` order by ${idTabela[cadastro]}_ID`;
                    }          
                    sqlSearch = `select ${idTabela[cadastro]}.* from ${idTabela[cadastro]}
                    ${sqlWhere} ${sqlOrder}`;
                }
            }
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar atualizações';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
