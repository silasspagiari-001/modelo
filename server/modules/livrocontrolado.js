'use strict';

const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const {empresa, tipo, abertura, encerramento, inicio, final} = params;

            let sqlTipo = tipo == 'TD' ?  '' : `and PRODUTOS_FABRICA = '(${tipo})' `

             let sqlSearch = `select MOVIMENTOS_ID, 
                                     MOVIMENTOS_NUMERO, 
                                     MOVIMENTOS_SERIE,                                     
                                     PESSOAS_ENDERECO,
                                     PESSOAS_NUMERO,
                                     CIDADES_ESTADO,
                                     PESSOAS_CPFCNPJ,
                                     MOVIMENTOSITENS_QUANTIDADE,
                                     MOVIMENTOSITENS_HORAENTREGA,
                                     PRODUTOS_FABRICA,
                                     PRODUTOS_APLICACAO,
                                     PRODUTOS_LISTAPRECO from MOVIMENTOSITENS                                    
                            join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            join PRODUTOS   on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                            join PESSOAS    on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
                            join CIDADES    on CIDADES_ID    = PESSOAS_ID_CIDADES
                            join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES

                            where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa} 
                                and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003'
                                and OPERACOES_ACAO = 'VN'
                                and MOVIMENTOS_STATUS <> 'C'
                                and MOVIMENTOS_STATUS <> 'D'
                                and MOVIMENTOS_STATUS <> 'R'
                                and PRODUTOS_LISTAPRECO = 'T'
                                ${sqlTipo}
                                and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                                order by MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO `;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return {
                results, 
                total  : results.length
            };
        } catch(error) {
            const msg = 'Falha ao buscar livro controlado';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
