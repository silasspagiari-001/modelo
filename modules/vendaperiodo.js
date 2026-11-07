'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {

            const db = await samosFB.conectarBanco(params.client);

            let { 
                empresa,
                empresacnpj,
                tipo,
                status,
                pesinicio,
                pesfinal,
                grpinicio,
                grpfinal,
                proinicio,
                profinal,
                usuinicio,
                usufinal,
                emiinicio,
                emifinal,
                quebra,
                operacao,
                itens,
                vacina,
                start,
                limit
            } = params;            

            let sqlWhere = '';
            let sqlSearch = '';
            let SqlOrder  = '';
            let sqlTipo = '';
            let filtrarCan = '';

            let sqlVacina = vacina == 1; // 0-Com 1-Sem

            pesinicio = pesinicio ? pesinicio : 1;
            pesfinal  = pesfinal  ? pesfinal  : 9999999;
            proinicio = proinicio ? proinicio : 1;
            profinal  = profinal  ? profinal  : 9999999;
            grpinicio = grpinicio ? grpinicio : 1;
            grpfinal  = grpfinal  ? grpfinal  : 9999999;
            usuinicio = usuinicio ? usuinicio : 1;
            usufinal  = usufinal  ? usufinal  : 9999999;            

            if(params.log.match(/prudenaco/)) {
                filtrarCan = ` and MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D' `;
            }    

            sqlWhere += `and MOVIMENTOS_ID_PESSOAS between ${pesinicio} and ${pesfinal} `;
            sqlWhere += `and MOVIMENTOS_ID_USUARIOS between ${usuinicio} and ${usufinal} `;
            sqlWhere += `and MOVIMENTOSITENS_ID_PRODUTOS between ${proinicio} and ${profinal} `;
            sqlWhere += `and PRODUTOS_ID_GRUPOS between ${grpinicio} and ${grpfinal} `;
            sqlWhere += operacao == 1 ? ` and OPERACOES_ACAO = 'VN' ${filtrarCan} ` :
                        operacao == 2 ? ` and left(OPERACOES_ACAO, 1) = 'T' ${filtrarCan} ` :
                        operacao == 3 ? ` and OPERACOES_ACAO = 'DV' ${filtrarCan} ` :
                        operacao == 4 ? ` and MOVIMENTOS_STATUS = 'C' ` : '';
            sqlWhere += sqlVacina ? ` and PRODUTOS_DERIVADO <> 'V' ` : '';
            sqlWhere += status == 1 ? ` and MOVIMENTOS_NUMEROORIGEM > 0 and MOVIMENTOS_SERIEORIGEM = 'NE' ` : // Com nfe
                        status == 2 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' ` : // Sem nfe
                        status == 3 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z'))` : // Baixados
                        status == 4 ? ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` :  // Abertos
                        status == 5 ? ` and MOVIMENTOS_SERIEORIGEM <> 'NE' and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' ` : ''; // Sem nfe Abertos

            SqlOrder = `ORDER BY MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE`

            sqlTipo = tipo == 3 ? `((MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})) or (MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 5)))` // Notas
                                : `MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + ${tipo})`

            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            sqlSearch = `select MOVIMENTOS_ID, 
                               MOVIMENTOS_ID_DOCUMENTOS,
                               DOCUMENTOS_NOME,
                               MOVIMENTOS_EMISSAO, 
                               MOVIMENTOS_STATUS,
                               MOVIMENTOS_ENTRADASAIDA, 
                               MOVIMENTOS_NUMERO, 
                               MOVIMENTOS_SERIE,
                               MOVIMENTOS_ID_EMPRESAORIGEM,
                               MOVIMENTOS_NUMEROORIGEM,
                               MOVIMENTOS_SERIEORIGEM,
                               MOVIMENTOS_ID_PESSOAS, 
                               MOVIMENTOS_ID_USUARIOS, 
                               MOVIMENTOS_ID_OPERACOES,
                               MOVIMENTOS_TOTAL, 
                               MOVIMENTOS_ID_EMPRESAS, 
                               MOVIMENTOS_ID_PRAZOS,
                               MOVIMENTOS_NOME, 
                               CIDADES_NOME, 
                               CIDADES_ESTADO, 
                               OPERACOES_ACAO,
                               PESSOAS_TIPO,
                               PRODUTOS_NOME, 
                               PRODUTOS_DERIVADO, 
                               MOVIMENTOSITENS_ID_PRODUTOS, 
                               MOVIMENTOSITENS_ID_OPERACOES,
                               MOVIMENTOSITENS_QUANTIDADE, 
                               MOVIMENTOSITENS_PRECO, 
                               MOVIMENTOSITENS_TOTAL,
                               PRAZOS_NOME
                         from MOVIMENTOSITENS
                         join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                         join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                         join PRAZOS on PRAZOS_ID = MOVIMENTOS_ID_PRAZOS
                         left outer join PRODUTOS   on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                         left outer join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
                         left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                         left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES

            where ${sqlTipo} and
            MOVIMENTOS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' 
            ${sqlWhere} ${SqlOrder}`;

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