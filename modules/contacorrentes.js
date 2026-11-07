'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { pessoa, aplicacao, inicio, final, status } = params;
            const db = await samosFB.conectarBancoAsync(params.client);
            
            let sqlSearch = '';
            let whereAplicacao = utils.number.cents(aplicacao) > 0 ? ` and CONTACORRENTES_ID_APLICACOES = ${aplicacao} ` : ''
            let whereUsuarios = '';
            let whereFiltro = '';

            if((params.client || '').toUpperCase() == 'HERBIQUIMICA') { //códigos 39 e 121
                if(params.userId  != 1 &&
                   params.userId  != 30 &&
                   params.userId  != 39 &&
                   params.userId  != 117 &&                   
                   params.userId  != 118 &&
                   params.userId  != 121) {
                    whereUsuarios = ` and CONTACORRENTES_ID_APLICACOES <> 104 and 
                                          CONTACORRENTES_ID_APLICACOES <> 207`
                }
            }

            if(params.pesquisa) {
                whereFiltro = ` and CONTACORRENTES_NOME like '%${params.pesquisa.toUpperCase()}%'`
            }

            try {
                let sqlWhere = '';
                let ordemPesquisa = '';

                if((params.client || '').toUpperCase() == 'REDESAT'){
                    ordemPesquisa = `CONTACORRENTES_ID_PESSOAS, CONTACORRENTES_DOCUMENTO`
                } else {
                    ordemPesquisa = `CONTACORRENTES_ID_PESSOAS, CONTACORRENTES_EMISSAO, CONTACORRENTES_ID`
                }
    
                if(status == 0) {
                    sqlWhere += ` if (CONTACORRENTES_CONCILIADO = 'T') then suspend; `;
                } else if (status == 1) {
                    sqlWhere += ` if (CONTACORRENTES_CONCILIADO = 'F') then suspend; `;
                } else {
                    sqlWhere += ` suspend; `;
                }
    
                sqlSearch = `execute block returns (
                    CONTACORRENTES_ID             INTEGER NOT NULL,
                    CONTACORRENTES_ID_EMPRESAS    INTEGER NOT NULL,
                    EMPRESAS_CPFCNPJ              VARCHAR(20),
                    CONTACORRENTES_ID_PESSOAS     INTEGER NOT NULL,
                    PESSOAS_NOME                  VARCHAR(50),
                    CONTACORRENTES_ID_APLICACOES  INTEGER NOT NULL,
                    APLICACOES_NOME               VARCHAR(50),
                    CONTACORRENTES_ID_FINANCEIROS INTEGER NOT NULL,
                    CONTACORRENTES_STATUS         CHAR(1) NOT NULL,
                    CONTACORRENTES_CONCILIADO     CHAR(1) NOT NULL,
                    CONTACORRENTES_EMISSAO        DATE NOT NULL,
                    CONTACORRENTES_VENCIMENTO     DATE,
                    CONTACORRENTES_PAGAMENTO      DATE,
                    CONTACORRENTES_COMPENSADO     DATE,
                    CONTACORRENTES_NOME           VARCHAR(100),
                    CONTACORRENTES_DOCUMENTO      VARCHAR(20),
                    CONTACORRENTES_DEBITOCREDITO  CHAR(1),
                    CONTACORRENTES_FINANCEIRO     CHAR(1),
                    CONTACORRENTES_VALOR          NUMERIC(12,2),
                    CONTACORRENTES_LOG            VARCHAR(50),
                    CONTACORRENTES_OBSERVACOES    VARCHAR(512),
                    SALDOLCTO_CONTACORRENTES      NUMERIC(12,2)
                  ) as
                    declare variable V_SALDO NUMERIC(12,2);
                    begin
                      V_SALDO = 0;
                      for
                        select
                          CONTACORRENTES_ID,
                          CONTACORRENTES_ID_EMPRESAS,
                          EMPRESAS_CPFCNPJ,
                          CONTACORRENTES_ID_PESSOAS,
                          PESSOAS_NOME,
                          CONTACORRENTES_ID_APLICACOES,
                          APLICACOES_NOME,
                          CONTACORRENTES_ID_FINANCEIROS,
                          CONTACORRENTES_STATUS,
                          CONTACORRENTES_CONCILIADO,
                          CONTACORRENTES_EMISSAO,
                          CONTACORRENTES_VENCIMENTO,
                          CONTACORRENTES_PAGAMENTO,
                          CONTACORRENTES_COMPENSADO,
                          trim(CONTACORRENTES_NOME) as CONTACORRENTES_NOME,
                          CONTACORRENTES_DOCUMENTO,
                          CONTACORRENTES_DEBITOCREDITO,
                          CONTACORRENTES_FINANCEIRO,
                          CONTACORRENTES_VALOR,
                          CONTACORRENTES_LOG,
                          CONTACORRENTES_OBSERVACOES
                        from CONTACORRENTES
                        left outer join EMPRESAS   on EMPRESAS_ID = CONTACORRENTES_ID_EMPRESAS
                        left outer join APLICACOES on APLICACOES_ID = CONTACORRENTES_ID_APLICACOES
                        left outer join PESSOAS    on PESSOAS_ID    = CONTACORRENTES_ID_PESSOAS
                        where CONTACORRENTES_ID_PESSOAS = '${pessoa}'
                          and CONTACORRENTES_ID_EMPRESAS = ${params.empresaLogada}
                         ${whereUsuarios}
                         ${whereAplicacao}
                         ${whereFiltro}
                        order by ${ordemPesquisa}
                        into
                          :CONTACORRENTES_ID,
                          :CONTACORRENTES_ID_EMPRESAS,
                          :EMPRESAS_CPFCNPJ,
                          :CONTACORRENTES_ID_PESSOAS,
                          :PESSOAS_NOME,
                          :CONTACORRENTES_ID_APLICACOES,
                          :APLICACOES_NOME,
                          :CONTACORRENTES_ID_FINANCEIROS,
                          :CONTACORRENTES_STATUS,
                          :CONTACORRENTES_CONCILIADO,
                          :CONTACORRENTES_EMISSAO,
                          :CONTACORRENTES_VENCIMENTO,
                          :CONTACORRENTES_PAGAMENTO,
                          :CONTACORRENTES_COMPENSADO,
                          :CONTACORRENTES_NOME,
                          :CONTACORRENTES_DOCUMENTO,
                          :CONTACORRENTES_DEBITOCREDITO,
                          :CONTACORRENTES_FINANCEIRO,
                          :CONTACORRENTES_VALOR,
                          :CONTACORRENTES_LOG,
                          :CONTACORRENTES_OBSERVACOES
                      do
                        begin
                            if (CONTACORRENTES_DEBITOCREDITO = 'C' ) then
                                V_SALDO = V_SALDO + CONTACORRENTES_VALOR;
                            else
                                V_SALDO = V_SALDO - CONTACORRENTES_VALOR;
                            SALDOLCTO_CONTACORRENTES = V_SALDO;
                            if (CONTACORRENTES_EMISSAO between '${params.inicio.replace (/\//ig,'.')}' and '${params.final.replace (/\//ig,'.')}') then
                                ${sqlWhere}
                        end
                    end;`

                const results = await db.query(sqlSearch);

                if(results.length) {
                    sqlSearch = ` execute block returns (
                        SALDOGERAL_CONTACORRENTES numeric(14,2)
                    ) as
                        declare variable CREDITO numeric(14,2);
                        declare variable DEBITO  numeric(14,2);
                    
                        begin
                            select sum(CONTACORRENTES_VALOR) from CONTACORRENTES
                            where  CONTACORRENTES_DEBITOCREDITO = 'C'     and
                                   CONTACORRENTES_ID_PESSOAS    = '32250' and
                                   CONTACORRENTES_STATUS        = 'T'
                            into  :CREDITO;
                        
                            select sum(CONTACORRENTES_VALOR) from CONTACORRENTES
                            where  CONTACORRENTES_DEBITOCREDITO = 'D' and
                                   CONTACORRENTES_ID_PESSOAS    = '32250' and
                                   CONTACORRENTES_STATUS        = 'T'
                            into  :DEBITO;
                        
                            SALDOGERAL_CONTACORRENTES = CREDITO - DEBITO;
                            suspend;
                        end `;
    
                    const querySaldoGeral = await db.query(sqlSearch);
                    const saldoGeral      = querySaldoGeral[0]['SALDOGERAL_CONTACORRENTES'];
                    const saldoInicial    = utils.number.cents(results[0]['SALDOLCTO_CONTACORRENTES']) + 
                        (
                            utils.number.cents(results[0]['CONTACORRENTES_VALOR']) * 
                            (results[0]['CONTACORRENTES_DEBITOCREDITO'] == 'D' ? 1 : -1)
                        );
                    const saldoFinal = results[results.length - 1]['SALDOLCTO_CONTACORRENTES'];
    
                    results.forEach(result => result['SALDOINICIAL_CONTACORRENTES'] = saldoInicial / 100);
                    results.forEach(result => result['SALDOFINAL_CONTACORRENTES']   = saldoFinal);
                    results.forEach(result => result['SALDOGERAL_CONTACORRENTES']   = saldoGeral);
                    results.forEach(result => result['TIPO_DOCUMENTO']   = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[0]);
                    results.forEach(result => result['NUMERO_DOCUMENTO'] = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[1]);
                    results.forEach(result => result['SERIE_DOCUMENTO']  = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[2]);
                } else {
                    if((params.client || 'RACAFORTE').toUpperCase() == 'RACAFORTE') { // Gera os lançamentos com base nos títulos pagos/caixa.
                        await importaFinanceiro(inicio, params);
                    }        
                }
                
                samosFB.processarLeitura({db, results, total: results.length, resolve, reject});

            } catch (error) {
                samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
            }
        });
    },

    readById: (id, params) => {//usado no recibo
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sqlSearch = '';

            try {
                sqlSearch = `select 
                    CONTACORRENTES_ID,
                    CONTACORRENTES_EMISSAO,
                    CONTACORRENTES_STATUS,
                    CONTACORRENTES_CONCILIADO,
                    CONTACORRENTES_ID_PESSOAS,
                    CONTACORRENTES_LOG,
                    CONTACORRENTES_DOCUMENTO,
                    CONTACORRENTES_FINANCEIRO,
                    CONTACORRENTES_NOME,
                    CONTACORRENTES_VALOR,
                    CONTACORRENTES_DEBITOCREDITO,
                    CONTACORRENTES_OBSERVACOES,
                    EMPRESAS_NOME,
                    EMPRESAS_CPFCNPJ,
                    CIDADES_NOME,
                    CIDADES_ESTADO,
                    PESSOAS_NOME,
                    PESSOAS_CPFCNPJ
                from CONTACORRENTES
                left outer join EMPRESAS   on EMPRESAS_ID   = CONTACORRENTES_ID_EMPRESAS
                left outer join PESSOAS    on PESSOAS_ID    = CONTACORRENTES_ID_PESSOAS
                left outer join CIDADES    on CIDADES_ID    = EMPRESAS_ID_CIDADES
                where CONTACORRENTES_ID = '${id}' `;
    
                const results = await db.query(sqlSearch);

                results.forEach(result => result['TIPO_DOCUMENTO']   = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[0]);
                results.forEach(result => result['NUMERO_DOCUMENTO'] = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[1]);
                results.forEach(result => result['SERIE_DOCUMENTO']  = (result['CONTACORRENTES_DOCUMENTO'] || '').split('|')[2]);

                samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
            } catch (error) {
                samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
            }
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sqlSearch = '';

            try {
                const financeiro = '' 
                const lastId     = await samosFB.lastId(db, 'CONTACORRENTES', 'GEN_CONTACORRENTES_ID', 'CONTACORRENTES_ID');
    
                data['CONTACORRENTES_ID']             = lastId;
                data['CONTACORRENTES_DOCUMENTO']      = financeiro ? `${financeiro.results['FINANCEIROS_NUMERO']}|${financeiro.results['FINANCEIROS_SERIE']}` : '';
                data['CONTACORRENTES_ID_FINANCEIROS'] = financeiro ? `${financeiro.results['FINANCEIROS_ID']}` : 0;
                data['CONTACORRENTES_DOCUMENTO']      = data['TIPO_DOCUMENTO'] ? `${data['TIPO_DOCUMENTO']}|${data['NUMERO_DOCUMENTO']}|${data['SERIE_DOCUMENTO']}`
                                                                               : data['CONTACORRENTES_DOCUMENTO'];
    
                samosFB.removeForeignFields(data, 'CONTACORRENTES');
                const fields = Object.keys(data).join(',');
                const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
                
                sqlSearch = `insert into CONTACORRENTES (${fields}) values (${values})`;
    
                await db.query(sqlSearch);

                samosFB.processarGravacao({db, results: data, resolve, reject});
            } catch(error){
                samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
            }
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            let sql = '';

            try {
                const contaQuery  = await db.query(`select * from CONTACORRENTES where CONTACORRENTES_ID = ${id}`);
                const contaAntiga = contaQuery[0];

                //delete o financeiro para recriar com mesmo id

                const idFinanceiro = contaAntiga['CONTACORRENTES_ID_FINANCEIROS'] || 0;

                sql = `execute block as
                    begin
                        delete from FINANCEIROS      where FINANCEIROS_ID                  = ${idFinanceiro};
                        delete from FINANCEIROSITENS where FINANCEIROSITENS_ID_FINANCEIROS = ${idFinanceiro};
                    end
                `;
                
                await db.query(sql);

                const novaConta  = Object.assign(contaAntiga, data);//para atualizar os campos alterados
                const financeiro = ''
    
                novaConta['CONTACORRENTES_DOCUMENTO']      = financeiro ? `${financeiro.results['FINANCEIROS_NUMERO']}|${financeiro.results['FINANCEIROS_SERIE']}` : '';
                novaConta['CONTACORRENTES_ID_FINANCEIROS'] = financeiro ? `${financeiro.results['FINANCEIROS_ID']}` : 0;
    
                novaConta['CONTACORRENTES_DOCUMENTO']      = novaConta['TIPO_DOCUMENTO'] ? `${novaConta['TIPO_DOCUMENTO']}|${novaConta['NUMERO_DOCUMENTO']}|${novaConta['SERIE_DOCUMENTO']}`
                                                                                         : novaConta['CONTACORRENTES_DOCUMENTO'];

                samosFB.removeForeignFields(novaConta, 'CONTACORRENTES');

                const values = JSON.stringify(utils.string.escapeSingleQuotes(novaConta)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');

                sql = `update CONTACORRENTES set ${values} where CONTACORRENTES_ID = ${id}`;
            
                await db.query(sql);

                samosFB.processarGravacao({db, results: novaConta, resolve, reject});
            } catch(error){
                samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sql);
            }
        });
    },

    delete: (id, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);
            
            let sqlDelete = '';

            try {
                const contaQuery = await db.query(`
                    select CONTACORRENTES_ID_FINANCEIROS
                    from   CONTACORRENTES
                    where  CONTACORRENTES_ID = ${id}
                `);

                const idFinanceiro = contaQuery[0]['CONTACORRENTES_ID_FINANCEIROS'];

                //deleta também os financeiros associados
                sqlDelete = `execute block as
                    begin
                        delete from CONTACORRENTES   where CONTACORRENTES_ID               = ${id};
                        delete from FINANCEIROS      where FINANCEIROS_ID                  = ${idFinanceiro};
                        delete from FINANCEIROSITENS where FINANCEIROSITENS_ID_FINANCEIROS = ${idFinanceiro};
                    end
                `;
                
                await db.query(sqlDelete);

                samosFB.processarExclusao({db, resolve, reject}, function() {
                    api['processos/gerarlog']().create(params);
                });
            } catch(error) {
                samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
            }
        });
    }
};

const importaFinanceiro = async (inicio, params) => {

    const db   = await samosFB.conectarBancoAsync(params.client);
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const hora = moment.tz(params.timezone).format('HH:mm:ss');

       //importa o financeiro (pagar)
        const financeiroQuery = await db.query(`
            select FINANCEIROS_ID, 
                   FINANCEIROS_ID_EMPRESAS,
                   FINANCEIROS_TIPO,
                   FINANCEIROS_NUMERO,
                   FINANCEIROS_EMISSAO,
                   FINANCEIROS_PAGAMENTO,
                   FINANCEIROS_PARCELA,
                   FINANCEIROS_PAGO,
                   PESSOAS_NOME 
            from   FINANCEIROS 
            left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
            where  FINANCEIROS_PAGAMENTO = '${inicio.replace (/\//ig,'.')}'
               and FINANCEIROS_TIPO = 'P'
               and FINANCEIROS_ID_EMPRESAS = ${params.empresaLogada}`);

        if(financeiroQuery.length > 0){
            for(let i in financeiroQuery) {
                const model = financeiroQuery[i];
                const objContacorrente = {
                    'CONTACORRENTES_ID_EMPRESAS'   : model['FINANCEIROS_ID_EMPRESAS'],
                    'CONTACORRENTES_ID_PESSOAS'    : 100,  // Sempre será a conta caixa
                    'CONTACORRENTES_ID_FINANCEIROS': model['FINANCEIROS_ID'],
                    'CONTACORRENTES_ID_APLICACOES' : (model['FINANCEIROS_TIPO'] == 'R' ? 3 : 4),
                    'CONTACORRENTES_ID_CUSTOS'     : 0,
                    'CONTACORRENTES_STATUS'        : 'T',
                    'CONTACORRENTES_EMISSAO'       : model['FINANCEIROS_PAGAMENTO'],
                    'CONTACORRENTES_VENCIMENTO'    : model['FINANCEIROS_PAGAMENTO'],
                    'CONTACORRENTES_PAGAMENTO'     : model['FINANCEIROS_PAGAMENTO'],
                    'CONTACORRENTES_COMPENSADO'    : model['FINANCEIROS_PAGAMENTO'],
                    'CONTACORRENTES_NOME'          : ((model['FINANCEIROS_TIPO'] == 'R' ? 'REF REC ' : 'REF PAG ') + model['FINANCEIROS_NUMERO'].toString() + '/' + model['FINANCEIROS_PARCELA'] + ' ' + model['PESSOAS_NOME']).slice(0, 100),
                    'CONTACORRENTES_DEBITOCREDITO' : (model['FINANCEIROS_TIPO'] == 'R' ? 'C' : 'D'),
                    'CONTACORRENTES_FINANCEIRO'    : '7', // Títulos
                    'CONTACORRENTES_VALOR'         : model['FINANCEIROS_PAGO'],
                    'CONTACORRENTES_LOG'           : 'IMPORTACAO ' + hoje + ' ' + hora
                }
        
                await api.contacorrentes().create(objContacorrente, params);
            }
        }    

        // Depois importa o caixa
        const caixaQuery = await db.query(`
               select MOVIMENTOSCAIXA_ID, 
                      MOVIMENTOSCAIXA_ID_EMPRESAS,
                      MOVIMENTOSCAIXA_TIPO,
                      MOVIMENTOSCAIXA_NOME,
                      MOVIMENTOSCAIXA_EMISSAO,
                      (MOVIMENTOSCAIXA_DINHEIRO + MOVIMENTOSCAIXA_CHEQUE + 
                       MOVIMENTOSCAIXA_DEBITO + MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_TRANSFERENCIAS) AS VALOR_LANCAMENTO
               from MOVIMENTOSCAIXA
               where  MOVIMENTOSCAIXA_EMISSAO = '${inicio.replace (/\//ig,'.')}'
                  and ((MOVIMENTOSCAIXA_NOME like 'NE%') or (MOVIMENTOSCAIXA_NOME like 'OR%'))
                  and MOVIMENTOSCAIXA_DUPLICATA = 0
                  and MOVIMENTOSCAIXA_ID_EMPRESAS = ${params.empresaLogada}`);

           if(caixaQuery.length > 0){
               for(let i in caixaQuery) {
                   const model = caixaQuery[i];
                   const objContacorrente = {
                       'CONTACORRENTES_ID_EMPRESAS'   : model['MOVIMENTOSCAIXA_ID_EMPRESAS'],
                       'CONTACORRENTES_ID_PESSOAS'    : 100,  // Sempre será a conta caixa
                       'CONTACORRENTES_ID_FINANCEIROS': 0,
                       'CONTACORRENTES_ID_APLICACOES' : (model['MOVIMENTOSCAIXA_TIPO'] == 'E' ? 3 : 4),
                       'CONTACORRENTES_ID_CUSTOS'     : 0,
                       'CONTACORRENTES_STATUS'        : 'T',
                       'CONTACORRENTES_EMISSAO'       : model['MOVIMENTOSCAIXA_EMISSAO'],
                       'CONTACORRENTES_VENCIMENTO'    : model['MOVIMENTOSCAIXA_EMISSAO'],
                       'CONTACORRENTES_PAGAMENTO'     : model['MOVIMENTOSCAIXA_EMISSAO'],
                       'CONTACORRENTES_COMPENSADO'    : model['MOVIMENTOSCAIXA_EMISSAO'],
                       'CONTACORRENTES_NOME'          : ((model['MOVIMENTOSCAIXA_TIPO'] == 'E' ? 'REF REC ' : 'REF PAG ') + model['MOVIMENTOSCAIXA_NOME']).slice(0, 100),
                       'CONTACORRENTES_DEBITOCREDITO' : (model['MOVIMENTOSCAIXA_TIPO'] == 'E' ? 'C' : 'D'),
                       'CONTACORRENTES_FINANCEIRO'    : '2', // A prazo
                       'CONTACORRENTES_VALOR'         : model['VALOR_LANCAMENTO'],
                       'CONTACORRENTES_LOG'           : 'IMPORTACAO ' + hoje + ' ' + hora
                   }
           
                   await api.contacorrentes().create(objContacorrente, params);
               }
           }    
}