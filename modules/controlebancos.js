'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { portador, inicio, final, status } = params;
            const db = await samosFB.conectarBanco(params.client);

            let sqlWhere = ``;

            if(status == 0) {
                sqlWhere += `  if (CONTROLES_STATUS = 'T') then  suspend; `;
            } else if (status == 1) {
                sqlWhere += `  if (CONTROLES_STATUS = 'F') then  suspend; `;
            } else {
                sqlWhere += ` suspend;  `;
            }

            const sqlSearch = `execute block returns (
                CONTROLES_ID             INTEGER NOT NULL,
                CONTROLES_STATUS         CHAR(1) NOT NULL,
                CONTROLES_ID_PORTADORES  INTEGER NOT NULL,
                CONTROLES_ID_APLICACOES  INTEGER NOT NULL,
                CONTROLES_EMISSAO        DATE NOT NULL,
                CONTROLES_VENCIMENTO     DATE,
                CONTROLES_COMPENSADO     DATE,
                CONTROLES_NOME           VARCHAR(100),
                CONTROLES_DOCUMENTO      VARCHAR(20),
                CONTROLES_TIPO           CHAR(1),
                CONTROLES_VALOR          NUMERIC(12,2),
                VALORSALDO_CONTROLES     NUMERIC(12,2),
                CONTROLES_LOG            VARCHAR(50),
                APLICACOES_NOME          VARCHAR(50),
                PORTADORES_NOME          VARCHAR(50),
                PORTADORES_AGENCIA       VARCHAR(6),
                PORTADORES_CONTA         VARCHAR(15)
              ) as
                declare variable V_SALDO NUMERIC(12,2);
                begin
                  V_SALDO = 0;
                  for
                    select
                      CONTROLES_ID,
                      CONTROLES_STATUS,
                      CONTROLES_ID_PORTADORES,
                      CONTROLES_ID_APLICACOES,
                      CONTROLES_EMISSAO,
                      CONTROLES_VENCIMENTO,
                      CONTROLES_COMPENSADO,
                      CONTROLES_NOME,
                      CONTROLES_DOCUMENTO,
                      CONTROLES_TIPO,
                      CONTROLES_VALOR,
                      CONTROLES_LOG,
                      APLICACOES_NOME,
                      PORTADORES_NOME,
                      PORTADORES_AGENCIA,
                      PORTADORES_CONTA
                    from controles
                    left outer join APLICACOES on APLICACOES_ID = CONTROLES_ID_APLICACOES
                    left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
                    where CONTROLES_ID_PORTADORES = '${portador}'
                    order by CONTROLES_ID_PORTADORES,CONTROLES_VENCIMENTO,CONTROLES_ID
                    into
                      :CONTROLES_ID,
                      :CONTROLES_STATUS,
                      :CONTROLES_ID_PORTADORES,
                      :CONTROLES_ID_APLICACOES,
                      :CONTROLES_EMISSAO,
                      :CONTROLES_VENCIMENTO,
                      :CONTROLES_COMPENSADO,
                      :CONTROLES_NOME,
                      :CONTROLES_DOCUMENTO,
                      :CONTROLES_TIPO,
                      :CONTROLES_VALOR,
                      :CONTROLES_LOG,
                      :APLICACOES_NOME,
                      :PORTADORES_NOME,
                      :PORTADORES_AGENCIA,
                      :PORTADORES_CONTA
                  do
                    begin
                        if(CONTROLES_STATUS = 'T') then
                            begin
                                if (CONTROLES_TIPO = 'E' ) then
                                    V_SALDO = V_SALDO + CONTROLES_VALOR;
                                else
                                    V_SALDO = V_SALDO - CONTROLES_VALOR;
                                VALORSALDO_CONTROLES = V_SALDO;
                            end
                      if (CONTROLES_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}') then
                        ${sqlWhere}
                    end
                end;
            `
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject});
                }
            });
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db     = await samosFB.conectarBanco(params.client);
            const lastId = await samosFB.lastId(db, 'CONTROLES', 'GEN_CONTROLES_ID', 'CONTROLES_ID');

            data['CONTROLES_ID']      = lastId;
            data['CONTROLES_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');

            samosFB.removeForeignFields(data, 'CONTROLES');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into CONTROLES (${fields}) values (${values})`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject});
                }
            });
        })
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            samosFB.removeForeignFields(data, 'CONTROLES');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
            const sqlSearch = `update CONTROLES set ${values} where CONTROLES_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from CONTROLES where CONTROLES_ID = ${id}`;
            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarExclusao({db, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });
                }
            });
        });
    },

    lote: {
        create: (dataList, params) => {
            return new Promise(async (resolve, reject) => {
                const db = await samosFB.conectarBanco(params.client);
                
                const sqlListLancamento = dataList.map((data, parentIndex) => {
                    let idLancamento = data['CONTROLES_ID'];
                    let dataCompensacao = params.dataConciliacao;

                    const logUser = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');

                    return `update CONTROLES set CONTROLES_COMPENSADO = '${dataCompensacao}',
                            CONTROLES_STATUS = 'T',
                            CONTROLES_LOG = '${logUser}' 
                            where CONTROLES_ID = ${idLancamento}`;
                })
                .reduce((result, sql) => {
                    return `${result} ${sql}; `;
                }, '');

                const executeBlockLancamento = `execute block as begin ${sqlListLancamento} end;`;

                db.query(executeBlockLancamento, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Falha ao conciliar lançamentos`, db, error, reject, executeBlockLancamento);
                    } else {
                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                    }
                });
            });
        }        
    }
};
