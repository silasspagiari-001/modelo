'use strict'; // Reservas CD Prudenmóveis (Empresa 1)

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

module.exports = {
    read: async params => {
        try {
            const { produto } = params;
            
            const sql = `select sum(MOVIMENTOSITENS_ENTREGUE) as QTDE_RESERVADA
                          from MOVIMENTOSITENS
                          join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                          left outer join ROMANEIOSITENS on ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and ROMANEIOSITENS_STATUS = 'E'
                           where MOVIMENTOS_STATUS <> 'C' and
                                 right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0002' and
                                 MOVIMENTOSITENS_ID_OPERACOES = 500000 and
                                 MOVIMENTOSITENS_ID_EMPRESAS = 1 and
                                 ROMANEIOSITENS_ID_MOVIMENTOS is null and
                                 MOVIMENTOS_EMISSAO >= DATEADD(-4 MONTH TO CURRENT_DATE) and
                                 MOVIMENTOSITENS_ID_PRODUTOS = ${produto}`;


            const results = await samosFB.executeSQL(sql, params);

            return results[0]['QTDE_RESERVADA'] || 0;
        } catch(error) {
            const msg = 'Falha ao consultar reservas do produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};