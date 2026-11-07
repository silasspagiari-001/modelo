'use strict';

const fs      = require('fs');
const path    = require('path');
const appRoot = path.dirname(require.main.filename);
const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { tipo, 
                    ordem, 
                    inicio, 
                    final, 
                    relacao,
                    datainicio,
                    datafinal,
                    status } = params;

            let sqlWhere = `where PESSOAS_ID > 0 `;
            let sqlOrder = '';
            let sqlDatas = '';

            if(tipo && tipo != 0){
                sqlWhere += `and PESSOAS_TIPO = '${tipo}' `;
            }
                
            if(status && status != 2) {
                sqlWhere += `and PESSOAS_STATUS = '${status == 0 ? 'T' : 'F'}' `
            }

            if(parseInt(relacao) > 0 && datainicio && datafinal && datainicio != 'Data inválida' && datafinal != 'Data inválida') {
                if(relacao == '1') {  // Sem movimento
                   sqlWhere += `and not exists(
                                                select MOVIMENTOS_ID from MOVIMENTOS
                                                where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
                                                MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and
                                                ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                                                (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
                                                ((MOVIMENTOS_STATUS <> 'C') and
                                                 (MOVIMENTOS_STATUS <> 'D') and
                                                 (MOVIMENTOS_STATUS <> 'R') and
                                                 (MOVIMENTOS_STATUS <> 'V')) `
                } else {  // Com movimento
                    sqlWhere += `and exists(
                        select MOVIMENTOS_ID from MOVIMENTOS
                        where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
                        MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and
                        ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                        (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
                        ((MOVIMENTOS_STATUS <> 'C') and
                        (MOVIMENTOS_STATUS <> 'D') and
                        (MOVIMENTOS_STATUS <> 'R') and
                        (MOVIMENTOS_STATUS <> 'V')) `
                }
            }

            if(parseInt(relacao) > 0 && datainicio && datafinal && datainicio != 'Data inválida' && datafinal != 'Data inválida') {
               sqlDatas = `MOVIMENTOS_EMISSAO between '${datainicio.replace (/\//ig,'.')}' and '${datafinal.replace (/\//ig,'.')}' and `
            }

            if(ordem == 0) {
                sqlWhere += `and PESSOAS_NOME like '${inicio}%' `; 
                sqlOrder = ' order by PESSOAS_NOME ';  
            } else if (ordem == 9) {
                sqlWhere += `and PESSOAS_FANTASIA like '${inicio}%' `;
                sqlOrder = ' order by PESSOAS_NOME ';  
            } else if (ordem == 4) {
                sqlWhere += `and PESSOAS_CPFCNPJ = '${inicio}' `;
                sqlOrder = ' order by PESSOAS_ID ';  
            } else if (ordem == 5) {
                sqlWhere += (inicio && final) ? `and PESSOAS_ID between ${inicio} and ${final}` : '';
                sqlOrder = ' order by PESSOAS_ID ';  
            } else if (ordem == 7) {
                sqlWhere += `and (
                    CIDADES.CIDADES_NOME         like '%${inicio}%' or
                    CIDADESCOBRANCA.CIDADES_NOME like '%${inicio}%'
                )`;
                sqlOrder = ' order by CIDADES.CIDADES_NOME, PESSOAS_NOME ';  
            }

            const sql = `select PESSOAS.*, 
            coalesce((select max(MOVIMENTOS_EMISSAO) from MOVIMENTOS
            where MOVIMENTOS_ID_PESSOAS = PESSOAS_ID and
                                    ${sqlDatas}
                                    ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002') or
                                    (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
                                    MOVIMENTOS_STATUS <> 'C'), '1899-12-30') as PESSOAS_ULTIMA,            
                    CIDADES.CIDADES_NOME,CIDADES.CIDADES_ESTADO,CIDADES.CIDADES_IBGE,
                    CIDADESCOBRANCA.CIDADES_NOME as CIDADES_NOMECOBRANCA,
                    CIDADESCOBRANCA.CIDADES_ESTADO as CIDADES_ESTADOCOBRANCA,
                    CIDADESCOBRANCA.CIDADES_IBGE   as CIDADES_IBGECOBRANCA,
                    USUARIOS_NOME 
                from PESSOAS
                left outer join USUARIOS                   on USUARIOS_ID = PESSOAS_ID_USUARIOS
                left outer join CIDADES                    on CIDADES.CIDADES_ID         = PESSOAS.PESSOAS_ID_CIDADES
                left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
                ${sqlWhere} ${sqlOrder}`;

            const results = await samosFB.executeSQL(sql, params);

            return { results }
        } catch(error) {
            const msg = 'Falha ao buscar pessoas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
}