'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const cents   = utils.number.cents.bind(utils.number);


module.exports = {
    update: async (id, data, params) => {
        try {    
            
            const dados    = data['formula'];
            const sqlIpi   = cents(dados['ipi']) > 0 ? `SALDOS_IPI = ${dados['ipi']},` : '';
            const perFrete = cents(dados['frete']) > 0 ? (cents(dados['frete']) / 10000) : 0;
                          
            // ALTERAR AQUI
            
            const sqlUpdate = `execute block returns (PRODUTOS_ID integer) as
                                    begin
                                        for
                                            select PRODUTOS_ID from PRODUTOS 
                                            where PRODUTOS_ID_PESSOAS = ${id} and PRODUTOS_STATUS <> 'F'
                                            into :PRODUTOS_ID
                                        do
                                            begin
                                                update SALDOS set ${sqlIpi}
                                                       SALDOS_CUSTO = (SALDOS_COMPRA + 
                                                                      (SALDOS_COMPRA * (SALDOS_IPI / 100)) +
                                                                      ((SALDOS_COMPRA + (SALDOS_COMPRA * (SALDOS_IPI / 100))) * ${perFrete}))
                                                where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                update SALDOS set SALDOS_PRECO = (ceil(((SALDOS_CUSTO + ((SALDOS_CUSTO * .01) * SALDOS_MARGEM))*.1))*10),
                                                       SALDOS_PRECOMINIMO = round((SALDOS_CUSTO + ((SALDOS_CUSTO * 0.01) * SALDOS_MARGEMMINIMA)), 0)
                                                where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                update SALDOS set SALDOS_PRAZO = (ceil(((SALDOS_PRECO + ((SALDOS_PRECO * .01) * SALDOS_ALIQUOTACFE))*.1))*10)
                                                where SALDOS_ID_PRODUTOS = :PRODUTOS_ID;
                                                suspend;
                                            end
                                    end;`;

            await samosFB.executeSQL(sqlUpdate, params);
        } catch(error) {
            const msg = error.message ? 'Falha ao atualizar Parâmetros' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }

};