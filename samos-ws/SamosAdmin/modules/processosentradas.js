'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {

        try {
            const { 
                empresa, 
                numero, 
                pessoa,
                lote, 
                inicio, 
                final, 
                ordem, 
                start, 
                limit
            } = params;

            let sqlEmpresa = '';
            let sqlDocumento = '';

            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

            sqlDocumento = `and ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and OPERACOES_ESTOQUE = 'C') or 
                                 (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005' and OPERACOES_ESTOQUE = 'C') or
                                 (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and (PRODUTOS_DERIVADO <> 'T' and PRODUTOS_DERIVADO <> 'F')))`;  // Só documentos de entrada ou saída com lotes
            sqlEmpresa   = empresa ? `and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
            
            let sqlOrder = '';
            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento}`;

            if(numero) {
                if(numero > 0) {
                    sqlWhere += ` and MOVIMENTOS_NUMERO = ${numero}`;
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;  
                }
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
                }
                if(lote > 0) {
                    sqlWhere += ` and MOVIMENTOSITENS_ID_LOTES = ${lote} `; 
                }

                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 3) { // Entrada/Saida
                        sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else {
                        sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ` order by MOVIMENTOS_ID_EMPRESAS,MOVIMENTOS_ID_DOCUMENTOS,MOVIMENTOS_EMISSAO,MOVIMENTOS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
                }
            }
                    
            const sqlCount  = `select count(MOVIMENTOSITENS_ID) from MOVIMENTOSITENS
                               join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                               left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                               left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                               ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits}
                    MOVIMENTOSITENS_ID, 
                    MOVIMENTOS_ID_EMPRESAS,
                    MOVIMENTOS_ID_PESSOAS,
                    MOVIMENTOS_ID,
                    MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ENTRADASAIDA,
                    MOVIMENTOS_NOME,
                    MOVIMENTOS_ID_OPERACOES,
                    OPERACOES_ESTOQUE,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    MOVIMENTOSITENS_ID_LOTES,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_ID_OPERACOES,
                    LOTES_ID,
                    LOTES_ID_PRODUTOS,
                    LOTES_REFERENCIA,
                    LOTES_FABRICACAO,
                    LOTES_VALIDADE,
                    PRODUTOS_NOME,
                    PRODUTOS_UNIDADE,
                    PRODUTOS_DERIVADO
                from MOVIMENTOSITENS 
                    join MOVIMENTOS     on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
                    left outer join PESSOAS   on PESSOAS_ID  = MOVIMENTOS_ID_PESSOAS
                    left outer join PRODUTOS  on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                    left outer join LOTES     on LOTES_ID    = MOVIMENTOSITENS_ID_LOTES
                    left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            return { results: movimentos, total };

        } catch(error) {
            const msg = 'Falha ao buscar movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (movimento, params) => {

        let idsProdutos = [];

        idsProdutos.push(movimento['MOVIMENTOSITENS_ID_PRODUTOS']);

        try {
            await samosFB.insert('MOVIMENTOSITENS', movimento, params);
            if(idsProdutos.length > 0){
                await api['processos/atualizasaldo']().create({
                    empresa: movimento['MOVIMENTOS_ID_EMPRESAS'],
                    produtos: idsProdutos,
                    client  : params.client
                });
            }
            await utils.dblog(params);  
            return { results: movimento };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar lançamento' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
 
    update: async (id, movimento, params) => {

        let idsProdutos = [];

        idsProdutos.push(movimento['MOVIMENTOSITENS_ID_PRODUTOSANTIGO']);
        idsProdutos.push(movimento['MOVIMENTOSITENS_ID_PRODUTOS']);

        delete movimento['MOVIMENTOSITENS_ID_PRODUTOSANTIGO'];

        try {
            //atualiza o item antigo e o novo
            await samosFB.update(id, 'MOVIMENTOSITENS', movimento, params);
            if(idsProdutos.length > 0){
                await api['processos/atualizasaldo']().create({
                    empresa: movimento['MOVIMENTOS_ID_EMPRESAS'],
                    produtos: idsProdutos,
                    client  : params.client
                });
            }

            return { results: movimento };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar entrada' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    }
};