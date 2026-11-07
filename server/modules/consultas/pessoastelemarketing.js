'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { inicio, final, mes, ordem } = params;

            let sqlWhere = '';

            //Aniversariantes
            if(ordem == 0) {
                sqlWhere = `where (
                    extract(month from PESSOAS_NASCIMENTO) = '${parseInt(mes) + 1}' or 
                    (
                         DOCUMENTOS_NOME = 'Pedidos' and 
                         extract(month from PESSOAS_NASCIMENTO) = '${parseInt(mes) + 1}'
                    )
                )`;
                
            //Última Compra
            } else if(ordem == 1) {
                sqlWhere = `where 
                    DOCUMENTOS_NOME = 'Pedidos' and
                    MOVIMENTOS_EMISSAO between '${inicio}' and '${final}'`;
            }

            const sql = `select 
                PESSOAS_ID,
                PESSOAS_NOME,
                PESSOAS_CPFCNPJ,
                PESSOAS_INSCRICAO,
                PESSOAS_CEP,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_ID_CIDADES,
                PESSOAS_TELEFONE,
                PESSOAS_CELULAR,
                coalesce(PESSOAS_NASCIMENTO, '1899.12.30')      as PESSOAS_NASCIMENTO,
                coalesce(max(MOVIMENTOS_EMISSAO), '1899.12.30') as MOVIMENTOS_EMISSAO
            from PESSOAS 
            left outer join MOVIMENTOS on PESSOAS_ID    = MOVIMENTOS_ID_PESSOAS
            left outer join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            ${sqlWhere}
            group by PESSOAS_ID,
                     PESSOAS_NOME, 
                     PESSOAS_CPFCNPJ,
                     PESSOAS_INSCRICAO,
                     PESSOAS_CEP,
                     PESSOAS_ENDERECO,
                     PESSOAS_NUMERO,
                     PESSOAS_BAIRRO,
                     PESSOAS_ID_CIDADES,
                     PESSOAS_TELEFONE,
                     PESSOAS_CELULAR,
                     PESSOAS_NASCIMENTO
            order by MOVIMENTOS_EMISSAO desc`

            const results = await samosFB.executeSQL(sql, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar pessoas para telemarketing';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};