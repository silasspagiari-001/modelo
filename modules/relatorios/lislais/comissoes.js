'use strict';

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, tipo, vendedor, emiinicio, emifinal, vctinicio, vctfinal, ordem, status} = params;

            const db = await samosFB.conectarBanco(params.client);
            let sqlWhere = '';
            let sqlDatas = '';
            let sqlSearch = '';

            if(empresa > 0) {
                sqlWhere += ` and FINANCEIROS_ID_EMPRESAS = ${empresa} `;
            }

            if(status == 0) {   // Pagos
                sqlWhere += ` and FINANCEIROS_STATUS = 'P' `;
            } else if(status == 1) { // Abertos
                sqlWhere += ` and FINANCEIROS_STATUS = 'A' `;
            }

            if(vendedor > 0) {
                sqlWhere += ` and FINANCEIROS_ID_USUARIOS = ${vendedor} `;
            }

            if(ordem == 0) { // Vencimento
                sqlDatas = `FINANCEIROS_VENCIMENTO between '${vctinicio.replace (/\//ig,'.')}' and '${vctfinal.replace (/\//ig,'.')}' and`
            } else { // pagamento
                sqlDatas = `FINANCEIROS_PAGAMENTO between '${vctinicio.replace (/\//ig,'.')}' and '${vctfinal.replace (/\//ig,'.')}' and`
            }
            
			sqlSearch = `select FINANCEIROS_ID_EMPRESAS, FINANCEIROS_ID_USUARIOS, USUARIOS_NOME,
			                    FINANCEIROS_NUMERO, FINANCEIROS_SERIE, FINANCEIROS_PARCELA, FINANCEIROS_STATUS, 
								FINANCEIROS_ORIGINAL, FINANCEIROS_PAGO, FINANCEIROS_ABERTO, FINANCEIROS_EMISSAO, FINANCEIROS_VENCIMENTO, FINANCEIROS_PAGAMENTO,
								PESSOAS_NOME, datediff(day, FINANCEIROS_VENCIMENTO, FINANCEIROS_PAGAMENTO) as FINANCEIROS_ATRASO
                         from FINANCEIROS								
								join USUARIOS on USUARIOS_ID = FINANCEIROS_ID_USUARIOS
								join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
								where FINANCEIROS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' and
                                      ${sqlDatas}
									  FINANCEIROS_TIPO = 'R' ${sqlWhere}
						 order by FINANCEIROS_ID_USUARIOS, PESSOAS_NOME`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};