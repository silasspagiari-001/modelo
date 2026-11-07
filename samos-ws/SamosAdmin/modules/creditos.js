'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { pessoa, inicio, final, status, tipo} = params;
            const db = await samosFB.conectarBanco(params.client);

            let sqlWhere = ``;
            let wherePessoa = ``;

            if(pessoa > 0) {
                wherePessoa = `where CREDITOS_ID_PESSOAS = '${pessoa}'`
            }

            if(status == 0) {
                sqlWhere += `  if (CREDITOS_STATUS = 'C') then  suspend; `;
            } else if (status == 1) {
                sqlWhere += `  if (CREDITOS_STATUS = 'N') then  suspend; `;
            } else {
                sqlWhere += ` suspend;  `;
            }

            //Filtra se for baixas parciais(aqui ele tambem utiliza o wherePessoa)
            if(tipo == '2'){
                wherePessoa += `${wherePessoa == '' ? 'where ' : ' and'} CREDITOS_TIPO = 'B' `; 
            }

            //Se o tipo for pessoa ou geral, ele IGNORA AS BAIXAS
            if( tipo != '2' ){
                wherePessoa += `${wherePessoa == '' ? 'where ' : ' and'} CREDITOS_TIPO <> 'B' `; 
            }
            
            const sqlSearch = `execute block returns (
                CREDITOS_ID             INTEGER NOT NULL,
                CREDITOS_STATUS         CHAR(1) NOT NULL,
                CREDITOS_ID_PESSOAS     INTEGER NOT NULL,
                PESSOAS_NOME            VARCHAR(50),
                CREDITOS_EMISSAO        DATE NOT NULL,
                CREDITOS_NOME           VARCHAR(50),
                CREDITOS_TIPO           CHAR(1),
                CREDITOS_VALOR          NUMERIC(12,2),
                CREDITOS_SALDO          NUMERIC(12,2),
                CREDITOS_LOG            VARCHAR(50)
              ) as
                declare variable V_SALDO NUMERIC(12,2);
                begin
                  V_SALDO = 0;
                  for
                    select
                      CREDITOS_ID,
                      CREDITOS_STATUS,
                      CREDITOS_ID_PESSOAS,
                      PESSOAS_NOME,
                      CREDITOS_EMISSAO,
                      CREDITOS_NOME,
                      CREDITOS_TIPO,
                      CREDITOS_VALOR,
                      CREDITOS_LOG
                    from CREDITOS
                    left outer join PESSOAS on PESSOAS_ID = CREDITOS_ID_PESSOAS
                    ${wherePessoa}
                    order by CREDITOS_EMISSAO,CREDITOS_ID
                    into
                      :CREDITOS_ID,
                      :CREDITOS_STATUS,
                      :CREDITOS_ID_PESSOAS,
                      :PESSOAS_NOME,
                      :CREDITOS_EMISSAO,
                      :CREDITOS_NOME,
                      :CREDITOS_TIPO,
                      :CREDITOS_VALOR,
                      :CREDITOS_LOG
                  do
                    begin
                      if (CREDITOS_TIPO = 'E') then
                        V_SALDO = V_SALDO + CREDITOS_VALOR;
                      else
                        if (CREDITOS_TIPO in ('S', 'B')) then
                          V_SALDO = V_SALDO - CREDITOS_VALOR;
                      CREDITOS_SALDO = V_SALDO;
                      if (CREDITOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}') then
                        ${sqlWhere}
                    end
                end;
            `;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject},
                        function(results) {
                            atualizaCredito(pessoa, params);
                        }
                    );
                }
            });
        });
    },

    readById: (id, params) => {
        const { empresa } = params;
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);

            const sqlSearch = `select CREDITOS.*, PESSOAS_NOME, PESSOAS_CPFCNPJ,
                                      EMPRESAS_NOME, EMPRESAS_CPFCNPJ, CIDADES_NOME,
                                      CIDADES_ESTADO from CREDITOS
                                    join PESSOAS on PESSOAS_ID = CREDITOS_ID_PESSOAS
                                    join EMPRESAS on EMPRESAS_ID = ${empresa}
                                    join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES 
                                where CREDITOS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao buscar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject});
                }
            });
        });
    },
    
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {          
            const db     = await samosFB.conectarBanco(params.client);
            const lastId = await samosFB.lastId(db, 'CREDITOS', 'GEN_CREDITOS_ID', 'CREDITOS_ID');

            data['CREDITOS_ID']      = lastId;
            data['CREDITOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            
            samosFB.removeForeignFields(data, 'CREDITOS');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into CREDITOS (${fields}) values (${values})`;            
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject},
                        function(results) {
                            atualizaCredito(data['CREDITOS_ID_PESSOAS'], params);
                        }
                    ); 
                }
            });
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            samosFB.removeForeignFields(data, 'CREDITOS');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update CREDITOS set ${values} where CREDITOS_ID = ${id}`;

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao alterar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: data, resolve, reject}, function(results) {
                        atualizaCredito(data['CREDITOS_ID_PESSOAS'], params)
                            .then(() => {
                                api['processos/gerarlog']().create(params);
                            })
                    });
                }
            });
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const sqlSearch = `delete from CREDITOS where CREDITOS_ID = ${id}`;
            
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
    }
};

const atualizaCredito = async function(pessoa, params) {
    const db = await samosFB.conectarBanco(params.client);

    const executeBlock = `execute block as 
        declare variable V_SALDO numeric(12, 2);
        declare variable V_PESSOA integer;
        declare variable V_ENTRADASAIDA varchar(1);
        declare variable V_VALOR numeric(12, 2);
        
            begin
                V_SALDO        = 0;
                V_PESSOA       = ${pessoa};
                for
                    select CREDITOS_TIPO,sum(CREDITOS_VALOR)
                    from CREDITOS
                    where CREDITOS_ID_PESSOAS = :V_PESSOA
                    group by CREDITOS_TIPO
                    into :V_ENTRADASAIDA,
                        :V_VALOR
                do
                begin
                    if (V_ENTRADASAIDA = 'E') then
                        V_SALDO = V_SALDO + :V_VALOR;
                    else
                        if (V_ENTRADASAIDA = 'S') THEN
                            V_SALDO = V_SALDO - :V_VALOR;
                end
                in autonomous transaction do
                update PESSOAS set PESSOAS_CREDITO = :V_SALDO where PESSOAS_ID = ${pessoa};
            end`;

    return new Promise(async (resolve, reject) => {
        db.query(executeBlock, (error) => {
            resolve();
            if (error) {
                console.log(error)
            }
            db.detach();
        });
    });
};
