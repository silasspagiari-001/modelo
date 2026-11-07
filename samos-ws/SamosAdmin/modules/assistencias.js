'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { conteudo, ordem, status, start, limit } = params;
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where ORDENS_ID >= 0  `;
                sqlWhere += status == 0 ? `and ORDENS_STATUS = 'T' ` : status == 1 ? `and ORDENS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and ORDENS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {    
                if(ordem == 0) {
                    sqlWhere += `and ORDENS_NOME like '${conteudo}%' `; 
                    sqlOrder = ' order by ORDENS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and ORDENS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by ORDENS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and ORDENS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by ORDENS_ID ';  
                } else if(ordem == 3){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'ORDENS',
                        chave: 'ORDENS_ID',
                        campos: [
                            'ORDENS_ID', 
                            'ORDENS_NOME'
                        ]
                    }, params);

                    sqlWhere += `and ORDENS_ID = '${id}' `;
                    sqlOrder = ' order by ORDENS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from ORDENS  ${sqlWhere}`;
            const sqlSearch = `select ${limits} 
                               ORDENS_ID,
                               ORDENS_NUMERO,
                               ORDENS_SERIE,
                               ORDENS_EMISSAO,
                               ORDENS_REFERENCIA,
                               ORDENS_OBSERVACOES as OBSBRUTA,
                               PESSOAS_ID,
                               PESSOAS_CADASTRO,
                               PESSOAS_TELEFONE,
                               PESSOAS_CELULAR,
                               PESSOAS_NASCIMENTO,
                               PESSOAS_NOME,
                               PESSOAS_CPFCNPJ,
                               PESSOAS_INSCRICAO,
                               PESSOAS_ENDERECO,
                               PESSOAS_NUMERO,
                               PESSOAS_BAIRRO,
                               PESSOAS_CEP,
                               CIDADES_NOME,
                               CIDADES_ESTADO                               
                                from ORDENS             
            join PESSOAS on PESSOAS_ID = ORDENS_ID_PESSOAS
            join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
              ${sqlWhere} ${sqlOrder}`;

            const resultsAssistencias = await samosFB.executeSQL(sqlSearch, params); 

            await Promise.all(resultsAssistencias.map(async resultAssistencia => {
                resultAssistencia['ORDENS_OBSERVACOES'] = resultAssistencia['OBSBRUTA'].replace(/\\n/g, '\n')
            }))    
           
            return { 
                results: resultsAssistencias,
                total  : await samosFB.count(sqlCount, params)
            };
        } catch(error) {
            const msg = 'Falha ao buscar ordens';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async(ordem, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('ORDENS', ordem, params);

            ordem['ORDENS_NUMERO'] = numero;
            ordem['ORDENS_SERIE']  = serie;

            await samosFB.insert('ORDENS', ordem, params);
            await utils.dblog(params);  
            return { results: ordem };
        } catch(error) {
            const msg = 'Falha ao criar assistência';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async(id, ordem, params) => {
        try {
            await samosFB.update(id, 'ORDENS', ordem, params);
            await utils.dblog(params);
            return { results: ordem };
        } catch(error) {
            const msg = 'Falha ao alterar ordem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async(id, params) => {
        try {
            await samosFB.delete(id, 'ORDENS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar ordem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
