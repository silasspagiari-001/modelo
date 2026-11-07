'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa } = params;
            const sqlEmpresa = empresa ? ` and MOVIMENTOSCAIXA_ID_EMPRESAS = '${empresa}' ` : '';

            const sqlValores = ` and (((MOVIMENTOSCAIXA_DINHEIRO       +
                MOVIMENTOSCAIXA_CHEQUE         +
                MOVIMENTOSCAIXA_DEBITO         +
                MOVIMENTOSCAIXA_CREDITO        +
                MOVIMENTOSCAIXA_DUPLICATA      +
                MOVIMENTOSCAIXA_BOLETO         +
                MOVIMENTOSCAIXA_CREDITOPESSOA  +
                MOVIMENTOSCAIXA_CREDITOLOJA    +
                MOVIMENTOSCAIXA_ALIMENTACAO    +
                MOVIMENTOSCAIXA_REFEICAO       +
                MOVIMENTOSCAIXA_PRESENTE       +
                MOVIMENTOSCAIXA_TRANSFERENCIAS + 
                MOVIMENTOSCAIXA_OUTRO          +
                MOVIMENTOSCAIXA_COMBUSTIVEL) > 0) or (MOVIMENTOSCAIXA_EXPORTADO = 'X') or (MOVIMENTOSCAIXA_EXPORTADO = 'Z'))`;

            const sqlSearch = `select first 1 skip 0 
                MOVIMENTOSCAIXA_ID_EMPRESAS, 
                MOVIMENTOSCAIXA_EMISSAO 
            from MOVIMENTOSCAIXA
            where
                MOVIMENTOSCAIXA_EMISSAO = (
                    select max(MOVIMENTOSCAIXA_EMISSAO) from MOVIMENTOSCAIXA 
                        where MOVIMENTOSCAIXA_STATUS = 'A' 
                                ${sqlValores}
                                and MOVIMENTOSCAIXA_EMISSAO < current_date
                                ${sqlEmpresa}
                ) and 
                MOVIMENTOSCAIXA_STATUS = 'A' ${sqlEmpresa}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total = results.length;

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao consultar último caixa aberto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
    