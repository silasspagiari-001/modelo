'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, emissao, status, id, incluirDuplicata } = params;
            const db = await samosFB.conectarBanco(params.client);
            const sqlId      = id > 0 ? ` and MOVIMENTOSCAIXA_ID = ${id} ` : '';
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
                                        MOVIMENTOSCAIXA_COMBUSTIVEL) > 0) or (MOVIMENTOSCAIXA_EXPORTADO = 'X') or (MOVIMENTOSCAIXA_EXPORTADO = 'Z'))`
            const sqlStatus = status == 0 ? ` and MOVIMENTOSCAIXA_STATUS = 'A' ` : status == 1 ? ` and MOVIMENTOSCAIXA_STATUS = 'F' ` : ''
            const sqlSearch = `execute block returns (
                USUARIOS_LOGIN varchar(50),
                MOVIMENTOSCAIXA_EMISSAO date,
                MOVIMENTOSCAIXA_HORA varchar(10),
                MOVIMENTOSCAIXA_VENCIMENTO date,
                MOVIMENTOSCAIXA_ID integer,
                MOVIMENTOSCAIXA_ID_MOVIMENTOS integer,
                MOVIMENTOSCAIXA_ID_APLICACOES integer,
                MOVIMENTOSCAIXA_NUMERO char(1),
                CONTROLES_ID_PORTADORES integer,
                PORTADORES_NOME varchar(50),
                CONTROLES_DOCUMENTO varchar(20),
                MOVIMENTOSCAIXA_ID_PESSOAS integer,
                MOVIMENTOSCAIXA_NOME varchar(512),
                MOVIMENTOSCAIXA_LOG varchar(50),
                PESSOAS_NOME varchar(50),
                PESSOAS_FANTASIA varchar(50),
                PESSOAS_CPFCNPJ varchar(15),
                PESSOAS_ENDERECO varchar(50),
                PESSOAS_NUMERO varchar(10),                          
                PESSOAS_CEP varchar(8),
                PESSOAS_BAIRRO varchar(50),
                PESSOAS_ID_CIDADES integer,     
                EMPRESAS_NOME varchar(50),
                EMPRESAS_FANTASIA varchar(50),
                EMPRESAS_ENDERECO varchar(50),
                EMPRESAS_NUMERO varchar(10),
                EMPRESAS_BAIRRO varchar(50),
                EMPRESAS_CPFCNPJ varchar(15),
                CIDADES_NOME varchar(50),
                CIDADES_ESTADO varchar(2),      
                APLICACOES_NOME varchar(50),
                DOCUMENTOS_NOME varchar(50),
                MOVIMENTOS_NUMERO integer,
                MOVIMENTOS_SERIE varchar(3),
                MOVIMENTOS_IMPOSTO numeric (12,2),
                MOVIMENTOSCAIXA_TIPO char(1),
                MOVIMENTOSCAIXA_STATUS char(1),
                MOVIMENTOSCAIXA_EXPORTADO char(1),
                MOVIMENTOSCAIXA_DINHEIRO numeric (12,2),
                MOVIMENTOSCAIXA_TRANSFERENCIAS numeric (12,2),
                MOVIMENTOSCAIXA_CHEQUE numeric (12,2),
                MOVIMENTOSCAIXA_CREDITO numeric (12,2),
                MOVIMENTOSCAIXA_DEBITO numeric (12,2),
                MOVIMENTOSCAIXA_CREDITOLOJA numeric (12,2),
                MOVIMENTOSCAIXA_CREDITOPESSOA numeric (12,2),
                MOVIMENTOSCAIXA_ALIMENTACAO numeric (12,2),
                MOVIMENTOSCAIXA_REFEICAO numeric (12,2),
                MOVIMENTOSCAIXA_PRESENTE numeric (12,2),
                MOVIMENTOSCAIXA_COMBUSTIVEL numeric (12,2),
                MOVIMENTOSCAIXA_DUPLICATA numeric (12,2),
                MOVIMENTOSCAIXA_BOLETO numeric (12,2),
                MOVIMENTOSCAIXA_OUTRO numeric (12,2),
                MOVIMENTOSCAIXA_TROCO numeric (12, 2),
                MOVIMENTOSCAIXA_TOTAL numeric (12,2),
                MOVIMENTOSCAIXA_SALDO numeric (12,2),
                SALDOS_DINHEIRO numeric (12,2),
                SALDOS_TRANSFERENCIA numeric(12, 2),
                SALDOS_CHEQUE numeric (12,2),
                SALDOS_CREDITO numeric (12,2),
                SALDOS_DEBITO numeric (12,2),
                SALDOS_CREDITOLOJA numeric (12,2),
                SALDOS_CREDITOPESSOA numeric(12,2),
                SALDOS_ALIMENTACAO numeric (12,2),
                SALDOS_REFEICAO numeric (12,2),
                SALDOS_PRESENTE numeric (12,2),
                SALDOS_COMBUSTIVEL numeric (12,2),                
                SALDOS_DUPLICATA numeric (12,2),
                SALDOS_BOLETO numeric (12,2),
                SALDOS_OUTRO numeric (12,2),
                SALDOS_TROCO numeric (12,2)
            ) as
                declare variable V_SALDO    numeric (12, 2);
                declare variable V_SALDODIN numeric (12, 2);
                declare variable V_SALDOTRA numeric (12, 2);
                declare variable V_SALDOCHE numeric (12, 2);
                declare variable V_SALDOCRE numeric (12, 2);
                declare variable V_SALDODEB numeric (12, 2);
                declare variable V_SALDOCLJ numeric (12, 2);
                declare variable V_SALDOCPE numeric (12, 2);
                declare variable V_SALDOALI numeric (12, 2);
                declare variable V_SALDOREF numeric (12, 2);
                declare variable V_SALDOPRE numeric (12, 2);
                declare variable V_SALDOCMB numeric (12, 2);
                declare variable V_SALDODUP numeric (12, 2);
                declare variable V_SALDOBOL numeric (12, 2);
                declare variable V_SALDOOUT numeric (12, 2);
                declare variable V_SALDOTRO numeric (12, 2);
                begin
                  V_SALDO    = 0;
                  V_SALDODIN = 0;
                  V_SALDOTRA = 0;
                  V_SALDOCHE = 0;
                  V_SALDOCRE = 0;
                  V_SALDODEB = 0;
                  V_SALDOCLJ = 0;
                  V_SALDOCPE = 0;
                  V_SALDOALI = 0;
                  V_SALDOREF = 0;
                  V_SALDOPRE = 0;
                  V_SALDOCMB = 0;
                  V_SALDODUP = 0;
                  V_SALDOBOL = 0;
                  V_SALDOOUT = 0;
                  V_SALDOTRO = 0;
                  for
                    select USUARIOS_LOGIN,
                           MOVIMENTOSCAIXA_EMISSAO,
                           MOVIMENTOSCAIXA_HORA,
                           MOVIMENTOSCAIXA_VENCIMENTO,
                           MOVIMENTOSCAIXA_ID,
                           MOVIMENTOSCAIXA_ID_MOVIMENTOS,
                           MOVIMENTOSCAIXA_ID_APLICACOES,
                           MOVIMENTOSCAIXA_NUMERO,
                           CONTROLES_ID_PORTADORES,
                           PORTADORES_NOME,
                           CONTROLES_DOCUMENTO,
                           MOVIMENTOSCAIXA_ID_PESSOAS,
                           MOVIMENTOSCAIXA_NOME,
                           MOVIMENTOSCAIXA_LOG,
                           PESSOAS_NOME,
                           PESSOAS_FANTASIA,
                           PESSOAS_CPFCNPJ,
                           PESSOAS_ENDERECO,
                           PESSOAS_NUMERO,                          
                           PESSOAS_CEP,
                           PESSOAS_BAIRRO,
                           PESSOAS_ID_CIDADES,                            
                           EMPRESAS_NOME,
                           EMPRESAS_FANTASIA,
                           EMPRESAS_ENDERECO,
                           EMPRESAS_NUMERO,
                           EMPRESAS_BAIRRO,
                           EMPRESAS_CPFCNPJ,
                           CIDADES_NOME,
                           CIDADES_ESTADO,                            
                           APLICACOES_NOME,
                           DOCUMENTOS_NOME,
                           MOVIMENTOS_NUMERO,
                           MOVIMENTOS_SERIE,
                           MOVIMENTOS_IMPOSTO,
                           trim(MOVIMENTOSCAIXA_TIPO),
                           trim(MOVIMENTOSCAIXA_STATUS),
                           trim(MOVIMENTOSCAIXA_EXPORTADO),
                           MOVIMENTOSCAIXA_DINHEIRO,
                           MOVIMENTOSCAIXA_TRANSFERENCIAS,
                           MOVIMENTOSCAIXA_CHEQUE,
                           MOVIMENTOSCAIXA_CREDITO,
                           MOVIMENTOSCAIXA_DEBITO,
                           MOVIMENTOSCAIXA_CREDITOLOJA,
                           MOVIMENTOSCAIXA_CREDITOPESSOA,
                           MOVIMENTOSCAIXA_ALIMENTACAO,
                           MOVIMENTOSCAIXA_REFEICAO,
                           MOVIMENTOSCAIXA_PRESENTE,
                           MOVIMENTOSCAIXA_COMBUSTIVEL,
                           MOVIMENTOSCAIXA_DUPLICATA,
                           MOVIMENTOSCAIXA_BOLETO,
                           MOVIMENTOSCAIXA_OUTRO,
                           MOVIMENTOSCAIXA_TROCO,
                           (MOVIMENTOSCAIXA_DINHEIRO  + MOVIMENTOSCAIXA_TRANSFERENCIAS + MOVIMENTOSCAIXA_CHEQUE     + MOVIMENTOSCAIXA_CREDITO +
                            MOVIMENTOSCAIXA_DEBITO    + MOVIMENTOSCAIXA_CREDITOLOJA + MOVIMENTOSCAIXA_CREDITOPESSOA + MOVIMENTOSCAIXA_ALIMENTACAO +
                            MOVIMENTOSCAIXA_REFEICAO  + MOVIMENTOSCAIXA_PRESENTE    + MOVIMENTOSCAIXA_COMBUSTIVEL +
                            ${incluirDuplicata == "true" ? "MOVIMENTOSCAIXA_DUPLICATA + " : ""} MOVIMENTOSCAIXA_BOLETO + MOVIMENTOSCAIXA_OUTRO - MOVIMENTOSCAIXA_TROCO) as MOVIMENTOSCAIXA_TOTAL
                    from MOVIMENTOSCAIXA
                    left outer join EMPRESAS   on EMPRESAS_ID   = MOVIMENTOSCAIXA_ID_EMPRESAS
                    left outer join CIDADES    on CIDADES_ID    = EMPRESAS_ID_CIDADES
                    left outer join PESSOAS    on PESSOAS_ID    = MOVIMENTOSCAIXA_ID_PESSOAS
                    left outer join APLICACOES on APLICACOES_ID = MOVIMENTOSCAIXA_ID_APLICACOES
                    left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                    left outer join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    left outer join USUARIOS   on USUARIOS_ID   = MOVIMENTOSCAIXA_ID_USUARIOS
                    left outer join CONTROLES  on CONTROLES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS and MOVIMENTOSCAIXA_ID_MOVIMENTOS > 0
                    left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
                    where MOVIMENTOSCAIXA_ID_EMPRESAS = '${empresa}' and
                          MOVIMENTOSCAIXA_EMISSAO     = '${emissao.replace (/\//ig,'.')}'
                          ${sqlId}
                          ${sqlStatus}
                          ${sqlValores}
                          ${incluirDuplicata == "true" ? "" : " and MOVIMENTOSCAIXA_DUPLICATA = 0"}
                    order by MOVIMENTOSCAIXA_EMISSAO, MOVIMENTOSCAIXA_NUMERO, MOVIMENTOSCAIXA_HORA
                    into  :USUARIOS_LOGIN,
                          :MOVIMENTOSCAIXA_EMISSAO,
                          :MOVIMENTOSCAIXA_HORA,
                          :MOVIMENTOSCAIXA_VENCIMENTO,
                          :MOVIMENTOSCAIXA_ID,
                          :MOVIMENTOSCAIXA_ID_MOVIMENTOS,
                          :MOVIMENTOSCAIXA_ID_APLICACOES,
                          :MOVIMENTOSCAIXA_NUMERO,
                          :CONTROLES_ID_PORTADORES,
                          :PORTADORES_NOME,
                          :CONTROLES_DOCUMENTO,
                          :MOVIMENTOSCAIXA_ID_PESSOAS,
                          :MOVIMENTOSCAIXA_NOME,
                          :MOVIMENTOSCAIXA_LOG,
                          :PESSOAS_NOME,
                          :PESSOAS_FANTASIA,
                          :PESSOAS_CPFCNPJ,
                          :PESSOAS_ENDERECO,
                          :PESSOAS_NUMERO,                          
                          :PESSOAS_CEP,
                          :PESSOAS_BAIRRO,
                          :PESSOAS_ID_CIDADES,
                          :EMPRESAS_NOME,
                          :EMPRESAS_FANTASIA,
                          :EMPRESAS_ENDERECO,
                          :EMPRESAS_NUMERO,
                          :EMPRESAS_BAIRRO,
                          :EMPRESAS_CPFCNPJ,
                          :CIDADES_NOME,
                          :CIDADES_ESTADO,
                          :APLICACOES_NOME,
                          :DOCUMENTOS_NOME,
                          :MOVIMENTOS_NUMERO,
                          :MOVIMENTOS_SERIE,    
                          :MOVIMENTOS_IMPOSTO,                     
                          :MOVIMENTOSCAIXA_TIPO,
                          :MOVIMENTOSCAIXA_STATUS,
                          :MOVIMENTOSCAIXA_EXPORTADO,
                          :MOVIMENTOSCAIXA_DINHEIRO,
                          :MOVIMENTOSCAIXA_TRANSFERENCIAS,
                          :MOVIMENTOSCAIXA_CHEQUE,
                          :MOVIMENTOSCAIXA_CREDITO,
                          :MOVIMENTOSCAIXA_DEBITO,
                          :MOVIMENTOSCAIXA_CREDITOLOJA,
                          :MOVIMENTOSCAIXA_CREDITOPESSOA,                          
                          :MOVIMENTOSCAIXA_ALIMENTACAO,
                          :MOVIMENTOSCAIXA_REFEICAO,
                          :MOVIMENTOSCAIXA_PRESENTE,
                          :MOVIMENTOSCAIXA_COMBUSTIVEL,
                          :MOVIMENTOSCAIXA_DUPLICATA,
                          :MOVIMENTOSCAIXA_BOLETO,
                          :MOVIMENTOSCAIXA_OUTRO,
                          :MOVIMENTOSCAIXA_TROCO,
                          :MOVIMENTOSCAIXA_TOTAL
                  do
                    begin
                      if (MOVIMENTOSCAIXA_TIPO = 'E') then
                            begin
                                V_SALDO    = V_SALDO    + :MOVIMENTOSCAIXA_TOTAL;
                                V_SALDODIN = V_SALDODIN + :MOVIMENTOSCAIXA_DINHEIRO;
                                V_SALDOTRA = V_SALDOTRA + :MOVIMENTOSCAIXA_TRANSFERENCIAS;
                                V_SALDOCHE = V_SALDOCHE + :MOVIMENTOSCAIXA_CHEQUE;
                                V_SALDOCRE = V_SALDOCRE + :MOVIMENTOSCAIXA_CREDITO;
                                V_SALDODEB = V_SALDODEB + :MOVIMENTOSCAIXA_DEBITO;
                                V_SALDOCLJ = V_SALDOCLJ + :MOVIMENTOSCAIXA_CREDITOLOJA;
                                V_SALDOCPE = V_SALDOCPE + :MOVIMENTOSCAIXA_CREDITOPESSOA;
                                V_SALDOALI = V_SALDOALI + :MOVIMENTOSCAIXA_ALIMENTACAO;
                                V_SALDOREF = V_SALDOREF + :MOVIMENTOSCAIXA_REFEICAO;
                                V_SALDOPRE = V_SALDOPRE + :MOVIMENTOSCAIXA_PRESENTE;
                                V_SALDOCMB = V_SALDOCMB + :MOVIMENTOSCAIXA_COMBUSTIVEL;                                              
                                V_SALDODUP = V_SALDODUP + :MOVIMENTOSCAIXA_DUPLICATA;
                                V_SALDOBOL = V_SALDOBOL + :MOVIMENTOSCAIXA_BOLETO;
                                V_SALDOOUT = V_SALDOOUT + :MOVIMENTOSCAIXA_OUTRO;
                                V_SALDOTRO = V_SALDOTRO - :MOVIMENTOSCAIXA_TROCO;
                            end
                      else
                        if (MOVIMENTOSCAIXA_TIPO = 'S') then
                            begin
                                V_SALDO    = V_SALDO    - :MOVIMENTOSCAIXA_TOTAL;
                                V_SALDODIN = V_SALDODIN - :MOVIMENTOSCAIXA_DINHEIRO;
                                V_SALDOTRA = V_SALDOTRA - :MOVIMENTOSCAIXA_TRANSFERENCIAS;
                                V_SALDOCHE = V_SALDOCHE - :MOVIMENTOSCAIXA_CHEQUE;
                                V_SALDOCRE = V_SALDOCRE - :MOVIMENTOSCAIXA_CREDITO;
                                V_SALDODEB = V_SALDODEB - :MOVIMENTOSCAIXA_DEBITO;
                                V_SALDOCLJ = V_SALDOCLJ - :MOVIMENTOSCAIXA_CREDITOLOJA;
                                V_SALDOCPE = V_SALDOCPE - :MOVIMENTOSCAIXA_CREDITOPESSOA;
                                V_SALDOALI = V_SALDOALI - :MOVIMENTOSCAIXA_ALIMENTACAO;
                                V_SALDOREF = V_SALDOREF - :MOVIMENTOSCAIXA_REFEICAO;
                                V_SALDOPRE = V_SALDOPRE - :MOVIMENTOSCAIXA_PRESENTE;
                                V_SALDOCMB = V_SALDOCMB - :MOVIMENTOSCAIXA_COMBUSTIVEL;
                                V_SALDODUP = V_SALDODUP - :MOVIMENTOSCAIXA_DUPLICATA;
                                V_SALDOBOL = V_SALDOBOL - :MOVIMENTOSCAIXA_BOLETO;
                                V_SALDOOUT = V_SALDOOUT - :MOVIMENTOSCAIXA_OUTRO;
                                V_SALDOTRO = V_SALDOTRO + :MOVIMENTOSCAIXA_TROCO;
                            end                            
                      MOVIMENTOSCAIXA_SALDO    = :V_SALDO;
                      SALDOS_DINHEIRO       = (:V_SALDODIN + :V_SALDOTRO);
                      SALDOS_TRANSFERENCIA  = :V_SALDOTRA;
                      SALDOS_CHEQUE         = :V_SALDOCHE;
                      SALDOS_CREDITO        = :V_SALDOCRE;
                      SALDOS_DEBITO         = :V_SALDODEB;
                      SALDOS_CREDITOLOJA    = :V_SALDOCLJ;
                      SALDOS_CREDITOPESSOA  = :V_SALDOCPE;
                      SALDOS_ALIMENTACAO    = :V_SALDOALI;
                      SALDOS_REFEICAO       = :V_SALDOREF;
                      SALDOS_PRESENTE       = :V_SALDOPRE;
                      SALDOS_COMBUSTIVEL    = :V_SALDOCMB;
                      SALDOS_DUPLICATA      = :V_SALDODUP;
                      SALDOS_BOLETO         = :V_SALDOBOL;
                      SALDOS_OUTRO          = :V_SALDOOUT;
                      SALDOS_TROCO          = :V_SALDOTRO;
                      if (MOVIMENTOSCAIXA_EMISSAO = '${emissao.replace (/\//ig,'.')}') then
                          suspend;
                    end
                end;`;
             
            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    },
    
    create: (data, params) => {
        return new Promise(async (resolve, reject) => { 
            delete data['MOVIMENTOSCAIXA_EMISSAOANTIGO'];
            delete data['MOVIMENTOSCAIXA_ID_PESSOASANTIGO'];
            delete data['MOVIMENTOSCAIXA_ID_APLICACOESANTIGO'];
            delete data['MOVIMENTOSCAIXA_ID_PORTADORES'];
            delete data['MOVIMENTOSCAIXA_STATUSCAIXA'];
            delete data['MOVIMENTOSCAIXA_DOCUMENTO'];

            const db = await samosFB.conectarBanco(params.client);
            const filhos = samosFB.reservarFilhos(data);
            const lastId = await samosFB.lastId(db, 'MOVIMENTOSCAIXA', 'GEN_MOVIMENTOSCAIXA_ID', 'MOVIMENTOSCAIXA_ID');
            const hoje    = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora    = moment.tz(params.timezone).format('HH:mm:ss');

            data['MOVIMENTOSCAIXA_ID']      = lastId;

            if(!data['MOVIMENTOSCAIXA_EMISSAO']) {
                data['MOVIMENTOSCAIXA_EMISSAO'] = hoje;
            }
            
            data['MOVIMENTOSCAIXA_HORA']    = hora;

            samosFB.removeForeignFields(data, 'MOVIMENTOSCAIXA');
            const fields = Object.keys(data).join(',');
            const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(data)));
            const sqlSearch = `insert into MOVIMENTOSCAIXA (${fields}) values (${values})`;                        

            for(let i in filhos){
                if(i == 'MOVIMENTOSCAIXA_CARTOES') {
                    filhos[i] = filhos[i].map(child => {
                        child['CARTOES_EMISSAO'] = hoje;
                        child['CARTOES_ORIGEM']  = lastId;
                        child['CARTOES_SERIE']   = 'CX';
                        return child;
                    });
                }
            }

            for(let i in filhos){
                if(i == 'MOVIMENTOSCAIXA_CHEQUES') {
                    filhos[i] = filhos[i].map(child => {
                        child['CHEQUES_EMISSAO'] = hoje;
                        child['CHEQUES_ORIGEM']  = lastId;
                        child['CHEQUES_SERIE']   = 'CX';
                        return child;
                    });
                }
            }

            db.query(sqlSearch, (error, results) => { 
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao salvar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarGravacao({db, results: filhos, idRegistroPai: lastId, resolve, reject, sqlFilhos: {
                        MOVIMENTOSCAIXA_CARTOES:     `insert into CARTOES     ['CARTOES_ID_MOVIMENTOS']     values [values]`,
                        MOVIMENTOSCAIXA_CHEQUES:     `insert into CHEQUES     ['CHEQUES_ID_MOVIMENTOS']     values [values]`
                    }, registroPai: data});
                }
            });                            
        });
    },

    update: (id, data, params) => {
        return new Promise(async (resolve, reject) => {

            delete data['MOVIMENTOSCAIXA_EMISSAOANTIGO'];
            delete data['MOVIMENTOSCAIXA_ID_PESSOASANTIGO'];
            delete data['MOVIMENTOSCAIXA_ID_APLICACOESANTIGO'];
            delete data['MOVIMENTOSCAIXA_CARTOES'];
            delete data['MOVIMENTOSCAIXA_CHEQUES'];
            delete data['MOVIMENTOSCAIXA_ID_PORTADORES']; 
            delete data['MOVIMENTOSCAIXA_STATUSCAIXA'];
            
            const db = await samosFB.conectarBanco(params.client);
            samosFB.removeForeignFields(data, 'MOVIMENTOSCAIXA');
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig, '').replace (/"/ig, '\'');
            const sqlSearch = `update MOVIMENTOSCAIXA set ${values} where MOVIMENTOSCAIXA_ID = ${id}`;
            
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
            const sqlSearch = `delete from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID = ${id}`;
            const cleanCartaoSql     = `delete from CARTOES     where CARTOES_ID_MOVIMENTOS = ${id} and CARTOES_ID_DOCUMENTOS = 999`;
            
            db.query(cleanCartaoSql, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao excluir financeiro`, db, error, reject, cleanCartaoSql);
                } else {                                
                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao excluir`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarExclusao({db, resolve, reject}, function() {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    });
                }
            });
        });
    },


    lote: {  
        create: (dataList, params) => { 
            return new Promise(async (resolve, reject) => {
                const db = await samosFB.conectarBanco(params.client);
                const cents = utils.number.cents.bind(utils.number);

                const valorDinheiro = cents(params.dinheiro);
                const valorCheque = cents(params.cheque);
                const valorDebito = cents(params.debito);
                const valorCredito = cents(params.credito);
                const valorTransferencia = cents(params.transferencia);
                const valorTotal = valorDinheiro + valorCheque + valorDebito + valorCredito + valorTransferencia;
               
                const perDinheiro = ((valorDinheiro / valorTotal) * 100);
                const perCheque = ((valorCheque / valorTotal) * 100);
                const perDebito = ((valorDebito / valorTotal) * 100);
                const perCredito = ((valorCredito / valorTotal) * 100);
                const perTransferencia = ((valorTransferencia / valorTotal) * 100);

                let lastId = [];
                let pagoDinheiro = 0;
                let pagoCheque = 0;
                let pagoCredito = 0;
                let pagoDebito = 0;
                let pagoTransferencia = 0;

                for (let i in dataList) {
                    lastId[i] = await samosFB.lastId(db, 'MOVIMENTOSCAIXA', 'GEN_MOVIMENTOSCAIXA_ID', 'MOVIMENTOSCAIXA_ID');
                }

                const sqlListCaixa = dataList.map((caixa, parentIndex) => {

                    if(dataList.length > 1) {
                        pagoDinheiro = ((cents(caixa['FINANCEIROS_PAGO']) / 10000) * perDinheiro);
                        pagoCheque = ((cents(caixa['FINANCEIROS_PAGO']) / 10000) * perCheque);
                        pagoDebito = ((cents(caixa['FINANCEIROS_PAGO']) / 10000) * perDebito);
                        pagoCredito = ((cents(caixa['FINANCEIROS_PAGO']) / 10000) * perCredito);
                        pagoTransferencia = ((cents(caixa['FINANCEIROS_PAGO']) / 10000) * perTransferencia);    
                    } else {
                        pagoDinheiro = valorDinheiro / 100;
                        pagoCheque = valorCheque / 100;
                        pagoDebito = valorDebito / 100;
                        pagoCredito = valorCredito / 100;
                        pagoTransferencia = valorTransferencia / 100;
                    }

                    let idcaixa       = lastId[parentIndex];
                    let idfinanceiro  = caixa['FINANCEIROS_ID'];
                    let idaplicacao   = caixa['FINANCEIROS_ID_APLICACOES'];
                    let empresa       = caixa['FINANCEIROS_ID_EMPRESAS'];
                    let emissao       = caixa['FINANCEIROS_PAGAMENTO'].replace(/\//ig,'.').replace (/\\/ig,'.');
                    let idpessoa      = caixa['FINANCEIROS_ID_PESSOAS'];
                    let historico     = `${caixa['FINANCEIROS_TIPO'] == 'R' ? 'CR ' : 'CP '} ${caixa['FINANCEIROS_NUMERO']} ${caixa['FINANCEIROS_PARCELA']}/${caixa['FINANCEIROS_PARCELAS']} ${caixa['PESSOAS_NOME']}` ;
                    let hora          = moment.tz(params.timezone).format('HH:mm:ss');
                    let tipo          = caixa['FINANCEIROS_TIPO'] == 'R' ? 'E' : 'S';
                    let numero        = 'A';
                    let dinheiro      = pagoDinheiro || 0;
                    let transferencia = pagoTransferencia || 0;
                    let cheque        = pagoCheque   || 0;
                    let credito       = pagoCredito  || 0;
                    let debito        = pagoDebito   || 0;
                    let creditoloja   = 0;
                    let creditopessoa = 0;
                    let alimentacao   = 0;
                    let refeicao      = 0;
                    let presente      = 0;
                    let combustivel   = 0;
                    let duplicata     = 0;
                    let boleto        = 0;
                    let outro         = 0;
                    let troco         = 0;
                    let usuario       = params.userId;
                    let log           = caixa['FINANCEIROS_LOG'];                        

                    return `insert into MOVIMENTOSCAIXA (
                                MOVIMENTOSCAIXA_ID,
                                MOVIMENTOSCAIXA_ID_EMPRESAS,
                                MOVIMENTOSCAIXA_ID_USUARIOS,
                                MOVIMENTOSCAIXA_STATUS,
                                MOVIMENTOSCAIXA_ID_MOVIMENTOS,
                                MOVIMENTOSCAIXA_ID_PESSOAS,
                                MOVIMENTOSCAIXA_ID_APLICACOES,
                                MOVIMENTOSCAIXA_ID_FINANCEIROS,
                                MOVIMENTOSCAIXA_NOME,
                                MOVIMENTOSCAIXA_EMISSAO,
                                MOVIMENTOSCAIXA_HORA,
                                MOVIMENTOSCAIXA_TIPO,
                                MOVIMENTOSCAIXA_NUMERO,
                                MOVIMENTOSCAIXA_DINHEIRO,
                                MOVIMENTOSCAIXA_TRANSFERENCIAS,
                                MOVIMENTOSCAIXA_TROCO,
                                MOVIMENTOSCAIXA_CHEQUE,
                                MOVIMENTOSCAIXA_CREDITO,
                                MOVIMENTOSCAIXA_DEBITO,
                                MOVIMENTOSCAIXA_CREDITOLOJA,
                                MOVIMENTOSCAIXA_CREDITOPESSOA,
                                MOVIMENTOSCAIXA_ALIMENTACAO,
                                MOVIMENTOSCAIXA_REFEICAO,
                                MOVIMENTOSCAIXA_PRESENTE,
                                MOVIMENTOSCAIXA_COMBUSTIVEL,
                                MOVIMENTOSCAIXA_DUPLICATA,
                                MOVIMENTOSCAIXA_BOLETO,
                                MOVIMENTOSCAIXA_OUTRO,
                                MOVIMENTOSCAIXA_LOG,
                                MOVIMENTOSCAIXA_VENCIMENTO,
                                MOVIMENTOSCAIXA_EXPORTADO
                            ) values (${idcaixa},
                                      ${empresa},
                                      ${usuario},
                                      'A',
                                      0,
                                      ${idpessoa},                                      
                                      ${idaplicacao},  
                                      ${idfinanceiro},                                                                          
                                     '${historico}',                                      
                                     '${emissao}',
                                     '${hora}',
                                     '${tipo}',
                                     '${numero}',
                                     ${dinheiro},
                                     ${transferencia},
                                     ${troco},
                                     ${cheque},
                                     ${credito},
                                     ${debito},
                                     ${creditoloja},
                                     ${creditopessoa},                                     
                                     ${alimentacao},
                                     ${refeicao},
                                     ${presente},
                                     ${combustivel},
                                     ${duplicata},
                                     ${boleto},                                     
                                     ${outro},
                                     '${log}',
                                     '${emissao}',
                                     'N')`;
                })
                .reduce((result, sql) => {
                    return `${result} ${sql}; `;
                }, '');

                const executeBlockCaixa = `execute block as begin ${sqlListCaixa} end;`;

                db.query(executeBlockCaixa, (error, results) => {
                    if (error) {
                        samosFB.enviarRespostaErro(`Falha ao gravar lançamento caixa`, db, error, reject, executeBlockCaixa);
                    } else {
                        samosFB.processarGravacao({db, results: dataList, resolve, reject});
                    }
                });
            });
        },        
      
        update: (dataList, params) => {
            return new Promise(async (resolve, reject) => { 
                const db = await samosFB.conectarBanco(params.client);

                const acao          = dataList['acao'];
                const empresa       = dataList['empresa'];
                const portador      = dataList['portador'].toString().slice(-2);
                const emissao       = dataList['emissao'].replace(/\//ig,'.').replace (/\\/ig,'.');
                const hora          = moment.tz(params.timezone).format('HH:mm:ss');
                const dinheiro      = dataList['dinheiro']      || 0;
                const transferencia = dataList['transferencia'] || 0;
                const cheque        = dataList['cheque']        || 0;
                const credito       = dataList['credito']       || 0;
                const debito        = dataList['debito']        || 0;
                const creditoloja   = dataList['creditoloja']   || 0;
                const creditopessoa = dataList['creditopessoa'] || 0;
                const alimentacao   = dataList['alimentacao']   || 0;
                const refeicao      = dataList['refeicao']      || 0;
                const presente      = dataList['presente']      || 0;
                const combustivel   = dataList['combustivel']   || 0;
                const duplicata     = dataList['duplicata']     || 0;
                const boleto        = dataList['boleto']        || 0;
                const outro         = dataList['outro']         || 0;
                const troco         = dataList['troco']         || 0;
                const totDetalhes   = (dinheiro - troco) + transferencia + cheque + credito  + debito + creditoloja + creditopessoa +
                                      alimentacao + refeicao + presente + combustivel + duplicata + boleto + outro;
                const usuario       = dataList['usuario'];
                const log           = dataList['log'];

                if(acao == 'fechar') {
                    const sqlSearch = `update MOVIMENTOSCAIXA set MOVIMENTOSCAIXA_STATUS =  'F'
                    where MOVIMENTOSCAIXA_ID_EMPRESAS = ${empresa} and 
                        MOVIMENTOSCAIXA_EMISSAO = '${emissao}' and
                        MOVIMENTOSCAIXA_STATUS = 'A'`;

                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao atualizar`, db, error, reject, sqlSearch);                        
                        }
                    });

                    if(dataList['transferirSaldoCaixa'] == true) {
                        await transferirSaldoDiaSeguinte(dataList, db);
                    }
                }

                if(totDetalhes > 0) {  // Gera o lançamento de transporte
                    const lastId = await samosFB.lastId(db, 'MOVIMENTOSCAIXA', 'GEN_MOVIMENTOSCAIXA_ID', 'MOVIMENTOSCAIXA_ID');
                    
                    dataList['MOVIMENTOSCAIXA_ID']              = lastId;
                    dataList['MOVIMENTOSCAIXA_ID_EMPRESAS']     = empresa;
                    dataList['MOVIMENTOSCAIXA_ID_USUARIOS']     = usuario;
                    dataList['MOVIMENTOSCAIXA_ID_PESSOAS']      = empresa;
                    dataList['MOVIMENTOSCAIXA_ID_MOVIMENTOS']   = 999999;
                    dataList['MOVIMENTOSCAIXA_ID_FINANCEIROS']  = 0
                    dataList['MOVIMENTOSCAIXA_ID_APLICACOES']   = 2;
                    dataList['MOVIMENTOSCAIXA_EMISSAO']         = emissao;
                    dataList['MOVIMENTOSCAIXA_VENCIMENTO']      = emissao;
                    dataList['MOVIMENTOSCAIXA_HORA']            = hora;
                    dataList['MOVIMENTOSCAIXA_DINHEIRO']        = dinheiro      / 100;
                    dataList['MOVIMENTOSCAIXA_TRANSFERENCIAS']  = transferencia / 100;                    
                    dataList['MOVIMENTOSCAIXA_CHEQUE']          = cheque        / 100;
                    dataList['MOVIMENTOSCAIXA_CREDITO']         = credito       / 100;
                    dataList['MOVIMENTOSCAIXA_DEBITO']          = debito        / 100;
                    dataList['MOVIMENTOSCAIXA_CREDITOLOJA']     = creditoloja   / 100;
                    dataList['MOVIMENTOSCAIXA_CREDITOPESSOA']   = creditopessoa / 100;
                    dataList['MOVIMENTOSCAIXA_ALIMENTACAO']     = alimentacao   / 100;
                    dataList['MOVIMENTOSCAIXA_REFEICAO']        = refeicao      / 100;
                    dataList['MOVIMENTOSCAIXA_PRESENTE']        = presente      / 100;
                    dataList['MOVIMENTOSCAIXA_COMBUSTIVEL']     = combustivel   / 100;
                    dataList['MOVIMENTOSCAIXA_DUPLICATA']       = duplicata     / 100;
                    dataList['MOVIMENTOSCAIXA_BOLETO']          = boleto        / 100;
                    dataList['MOVIMENTOSCAIXA_OUTRO']           = outro         / 100;
                    dataList['MOVIMENTOSCAIXA_TROCO']           = troco         / 100;
                    dataList['MOVIMENTOSCAIXA_LOG']             = log;
                    dataList['MOVIMENTOSCAIXA_TIPO']            = 'S';
                    dataList['MOVIMENTOSCAIXA_STATUS']          = (acao == 'fechar' ? 'F' : 'A');
                    dataList['MOVIMENTOSCAIXA_NOME']            = (acao == 'fechar' ? 'FECHAMENTO ' : 'SANGRIA ') + log + ' ' + portador;
                    dataList['MOVIMENTOSCAIXA_EXPORTADO']       = ((portador == '10' || portador == '11') ? 'X' : 'Z');

                    samosFB.removeForeignFields(dataList, 'MOVIMENTOSCAIXA');
                    const fields   = Object.keys(dataList).join(',');
                    const values   = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(dataList)));
                    const sqlPagto = `insert into MOVIMENTOSCAIXA (${fields}) values (${values})`;

                    db.query(sqlPagto, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao gerar transporte`, db, error, reject, sqlPagto);
                        } else {
                            samosFB.processarGravacao({db, results: dataList, resolve, reject}, function() {
                                api['processos/gerarlog']().create(params);
                            });
                        }
                    });
                } else {
                    samosFB.processarGravacao({db, results: dataList, resolve, reject}, function() {
                        api['processos/gerarlog']().create(params);
                    });                    
                }
            });
        }
    }
};

async function transferirSaldoDiaSeguinte(dataList, db) {
    return new Promise(async (resolve, reject) => { 
        const empresa       = dataList['empresa'];
        const portador      = dataList['portador'].toString().slice(-2);
        const emissao       = dataList['emissao'].replace(/\//ig,'.').replace (/\\/ig,'.');
        const mEmissao      = moment(emissao, 'DD.MM.YYYY');
        const diaSeguinte   = mEmissao.add(mEmissao.day() == 6 ? 2 : 1, 'day').format('YYYY-MM-DD');//do sábado joga para segunda, demais dias normal
        const dinheiro      = (dataList['saldodin'] - dataList['dinheiro']) || 0;
        const cheque        = (dataList['saldoche'] - dataList['cheque']) || 0;
        const totDetalhes   = (dinheiro + cheque);
        const usuario       = dataList['usuario'];
        const log           = dataList['log'];

        if(totDetalhes > 0) {
            const lastId = await samosFB.lastId(db, 'MOVIMENTOSCAIXA', 'GEN_MOVIMENTOSCAIXA_ID', 'MOVIMENTOSCAIXA_ID');
            
            dataList['MOVIMENTOSCAIXA_ID']              = lastId;
            dataList['MOVIMENTOSCAIXA_ID_EMPRESAS']     = empresa;
            dataList['MOVIMENTOSCAIXA_ID_USUARIOS']     = usuario;
            dataList['MOVIMENTOSCAIXA_ID_PESSOAS']      = empresa;
            dataList['MOVIMENTOSCAIXA_ID_MOVIMENTOS']   = 999999;
            dataList['MOVIMENTOSCAIXA_ID_FINANCEIROS']  = 0;
            dataList['MOVIMENTOSCAIXA_ID_APLICACOES']   = 2;
            dataList['MOVIMENTOSCAIXA_EMISSAO']         = diaSeguinte;
            dataList['MOVIMENTOSCAIXA_VENCIMENTO']      = diaSeguinte;
            dataList['MOVIMENTOSCAIXA_HORA']            = '08:00:00';
            dataList['MOVIMENTOSCAIXA_DINHEIRO']        = dinheiro / 100;
            dataList['MOVIMENTOSCAIXA_TRANSFERENCIAS']  = 0;
            dataList['MOVIMENTOSCAIXA_CHEQUE']          = cheque / 100;
            dataList['MOVIMENTOSCAIXA_CREDITO']         = 0;
            dataList['MOVIMENTOSCAIXA_DEBITO']          = 0;
            dataList['MOVIMENTOSCAIXA_CREDITOLOJA']     = 0;
            dataList['MOVIMENTOSCAIXA_CREDITOPESSOA']   = 0;
            dataList['MOVIMENTOSCAIXA_ALIMENTACAO']     = 0;
            dataList['MOVIMENTOSCAIXA_REFEICAO']        = 0;
            dataList['MOVIMENTOSCAIXA_PRESENTE']        = 0;
            dataList['MOVIMENTOSCAIXA_COMBUSTIVEL']     = 0;
            dataList['MOVIMENTOSCAIXA_DUPLICATA']       = 0;
            dataList['MOVIMENTOSCAIXA_BOLETO']          = 0;
            dataList['MOVIMENTOSCAIXA_OUTRO']           = 0;
            dataList['MOVIMENTOSCAIXA_TROCO']           = 0;
            dataList['MOVIMENTOSCAIXA_LOG']             = log;
            dataList['MOVIMENTOSCAIXA_TIPO']            = 'E';
            dataList['MOVIMENTOSCAIXA_STATUS']          = 'A';
            dataList['MOVIMENTOSCAIXA_NOME']            = 'ABERTURA DE CAIXA (Transferido dia anterior)',
            dataList['MOVIMENTOSCAIXA_EXPORTADO']       = ((portador == '10' || portador == '11') ? 'X' : 'Z');

            samosFB.removeForeignFields(dataList, 'MOVIMENTOSCAIXA');
            const fields   = Object.keys(dataList).join(',');
            const values   = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(dataList)));
            const sqlPagto = `insert into MOVIMENTOSCAIXA (${fields}) values (${values})`;

            db.query(sqlPagto, (error, results) => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            });
        } else {
            resolve()
        }
    });
}