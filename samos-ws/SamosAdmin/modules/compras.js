'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa,  grupo, pessoa, inicio, final } = params;
            
            let sqlWhere = '';
            let sqlSearch = '';

            if(grupo && grupo > 0) { sqlWhere += ` and PRODUTOS_ID_GRUPOS = ${grupo}`; }
            if(pessoa && pessoa > 0) { sqlWhere += ` and PRODUTOS_ID_PESSOAS = ${pessoa}`; }

            if(params.log.match(/prudenmoveis/)) {
                sqlSearch = `select PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_MARCA, PRODUTOS_ID_GRUPOS, GRUPOS_NOME, PRODUTOS_ID_PESSOAS, PESSOAS_NOME,
                                    SALDOS_DISPONIVEL, SALDOS_MINIMO, SALDOS_CUSTO,
                                    datediff(day from cast('${inicio.replace (/\//ig,'.')}' as date) to cast('${final.replace (/\//ig,'.')}' as date)) as PRODUTOS_PERIODO
                                from PRODUTOS
                                    join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                                    join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
                                    join SALDOS on SALDOS_ID_EMPRESAS = ${empresa || 1} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                    where PRODUTOS_STATUS = 'T' ${sqlWhere}
                                    order by PESSOAS_NOME, PRODUTOS_NOME`;
            } else {
                sqlSearch = `select PRODUTOS_ID, PRODUTOS_NOME, PRODUTOS_UNIDADE, PRODUTOS_MARCA, PRODUTOS_ID_GRUPOS, GRUPOS_NOME, PRODUTOS_ID_PESSOAS, PESSOAS_NOME,
                                    SALDOS_DISPONIVEL, SALDOS_MINIMO, SALDOS_CUSTO,
                                    datediff(day from cast('${inicio.replace (/\//ig,'.')}' as date) to cast('${final.replace (/\//ig,'.')}' as date)) as PRODUTOS_PERIODO
                                from PRODUTOS
                                    join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
                                    join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
                                    join SALDOS on SALDOS_ID_EMPRESAS = ${empresa || 1} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                                    where PRODUTOS_STATUS = 'T' ${sqlWhere}
                                    order by PRODUTOS_ID_GRUPOS, PRODUTOS_ID_PESSOAS, PRODUTOS_NOME`;
            } 
            
            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results };
        } catch(error) {
            const msg = 'Falha ao buscar compras';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};