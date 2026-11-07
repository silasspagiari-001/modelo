'use strict';

const samosFB = require('../services/samosFirebird');
const utils   = require('../services/samosUtils');
const api     = require('.');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { usuario, empresa } = params;
            const db = await samosFB.conectarBancoAsync(params.client);

            try {
                const sql = `execute block returns (
                    PRODUTOS_ID         integer,
                    PRODUTOS_NOME       varchar(50),
                    SALDOS_PRECO        numeric(12,2),
                    SALDOS_CUSTO        numeric(12,2),
                    SALDO_MASTER        integer,
                    SALDO_TECNICO       integer,
                    QTDE_AVANCAR        integer
                ) as

                declare variable V_OPERACAO_ESTOQUE          char(1);
                declare variable V_QUANTIDADE_MASTER         integer;
                declare variable V_QUANTIDADE_TECNICOENTRADA integer;
                declare variable V_QUANTIDADE_TECNICOSAIDA   integer;

                begin
                    for
                        select
                            PRODUTOS_ID,
                            PRODUTOS_NOME,
                            SALDOS_PRECO,
                            SALDOS_CUSTO
                        from PRODUTOS
                        join SALDOS on SALDOS_ID_PRODUTOS = PRODUTOS_ID
                        where PRODUTOS_LISTAPRECO = 'T' and 
                              SALDOS_ID_EMPRESAS = ${empresa}
                        into :PRODUTOS_ID,
                             :PRODUTOS_NOME,
                             :SALDOS_PRECO,
                             :SALDOS_CUSTO
                    do
                        begin
                            SALDO_MASTER  = 0;
                            SALDO_TECNICO = 0;

                            for
                                select OPERACOES_ESTOQUE, sum(MOVIMENTOSITENS_QUANTIDADE)
                                from MOVIMENTOSITENS
                                left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                left outer join OPERACOES  on OPERACOES_ID  = MOVIMENTOSITENS_ID_OPERACOES
                                where MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID and
                                      MOVIMENTOS_ID_EMPRESAS      = '${empresa}' and
                                      ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D'))
                                group by OPERACOES_ESTOQUE
                                into :V_OPERACAO_ESTOQUE,
                                     :V_QUANTIDADE_MASTER
                            do
                                begin
                                    if(V_QUANTIDADE_MASTER is null) then V_QUANTIDADE_MASTER = 0;
                                    if (V_OPERACAO_ESTOQUE = 'C') then
                                        SALDO_MASTER = SALDO_MASTER + :V_QUANTIDADE_MASTER;
                                    else if (V_OPERACAO_ESTOQUE = 'D') then
                                        SALDO_MASTER = SALDO_MASTER - :V_QUANTIDADE_MASTER;
                                end

                            for
                                select sum(MOVIMENTOSITENS_QUANTIDADE)
                                from MOVIMENTOSITENS
                                left outer join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                where MOVIMENTOS_ID_PESSOAS       = '${usuario}' and
                                      MOVIMENTOS_ID_EMPRESAS      = '${empresa}' and
                                      MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID and
                                    (
                                        (MOVIMENTOS_STATUS <> 'C') and
                                        (MOVIMENTOS_STATUS <> 'D')
                                    )
                                into :V_QUANTIDADE_TECNICOENTRADA
                            do
                                begin
                                    if(V_QUANTIDADE_TECNICOENTRADA is null) then V_QUANTIDADE_TECNICOENTRADA = 0;
                                    SALDO_TECNICO = SALDO_TECNICO + :V_QUANTIDADE_TECNICOENTRADA;
                                end

                            for
                                select sum(ORDENSPRODUTOS_QUANTIDADE)
                                from ORDENSPRODUTOS
                                left outer join ORDENS on ORDENS_ID = ORDENSPRODUTOS_ID_ORDENS
                                where ORDENSPRODUTOS_ID_PRODUTOS = :PRODUTOS_ID and 
                                      ORDENS_ID_EMPRESAS = '${empresa}' and (
                                          (ORDENS_STATUS >= 0) and
                                          (ORDENS_STATUS <= 7)
                                      ) and (
                                            ORDENS_ID_USUARIOS = '${usuario}' and
                                            (ORDENS_ID_TECNICO = '0' or ORDENS_ID_TECNICO is null)
                                      ) or (
                                            ORDENS_ID_TECNICO  = '${usuario}'
                                      )
                                into :V_QUANTIDADE_TECNICOSAIDA
                            do
                                begin
                                    if(V_QUANTIDADE_TECNICOSAIDA is null) then V_QUANTIDADE_TECNICOSAIDA = 0;
                                    SALDO_TECNICO = SALDO_TECNICO - :V_QUANTIDADE_TECNICOSAIDA;
                                end

                            if (SALDO_MASTER  = 0) then SALDO_MASTER  = null;
                            if (SALDO_TECNICO = 0) then SALDO_TECNICO = null;
                            suspend;
                        end
                end`;

                const results = await db.query(sql);

                samosFB.processarLeitura({ db, results, total: results.length, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro ordensavanco/read`, db, error, reject);
            }
        });
    },

    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBancoAsync(params.client);

            try {
                const tecnicoQuery = await db.query(`
                    select 
                        USUARIOS_NOME,
                        USUARIOS_LOGIN,
                        USUARIOS_EMAIL,
                        USUARIOS_CPFCNPJ 
                    from USUARIOS
                    where USUARIOS_ID = '${params.usuario}'
                `);

                const tecnico = tecnicoQuery[0];
                
                const produtos = data.map((produto, index) => {
                    return {
                        'MOVIMENTOSITENS_ID'          : (index + 1) * -1,
                        'MOVIMENTOSITENS_ID_EMPRESAS' : params.empresa,
                        'MOVIMENTOSITENS_ID_PRODUTOS' : produto['PRODUTOS_ID'],
                        'MOVIMENTOSITENS_QUANTIDADE'  : produto['QTDE_AVANCAR'],
                        'MOVIMENTOSITENS_PRECO'       : produto['SALDOS_PRECO'],
                        'MOVIMENTOSITENS_CUSTO'       : produto['SALDOS_CUSTO'],
                        'MOVIMENTOSITENS_PERCENTUAL'  : 0,
                        'MOVIMENTOSITENS_DESCONTOS'   : 0,
                        'MOVIMENTOSITENS_FRETE'       : 0,
                        'MOVIMENTOSITENS_SEGURO'      : 0,
                        'MOVIMENTOSITENS_DESPESAS'    : 0,
                        'MOVIMENTOSITENS_IMPOSTO'     : 0,
                        'MOVIMENTOSITENS_ENTREGUE'    : 0,
                        'MOVIMENTOSITENS_DEPOSITO'    : 0,
                        'MOVIMENTOSITENS_IMEDIATA'    : 0,
                        'MOVIMENTOSITENS_TOTAL'       : (
                            utils.number.cents(produto['SALDOS_PRECO']) * produto['QTDE_AVANCAR']
                        ) / 100,
                        'MOVIMENTOSITENS_ID_OPERACOES': 500000
                    }
                });

                const total = produtos.reduce((total, produto) => {
                    return total += utils.number.cents(produto['MOVIMENTOSITENS_TOTAL']);
                }, 0) / 100;

                const pedido = {
                    'MOVIMENTOS_ID_PESSOAS'   : params.usuario,
                    'MOVIMENTOS_NOME'         : tecnico['USUARIOS_NOME'],
                    'USUARIOS_LOGIN'          : tecnico['USUARIOS_LOGIN'],//para o log
                    'MOVIMENTOS_CPFCNPJ'      : tecnico['USUARIOS_CPFCNPJ'],
                    'MOVIMENTOS_EMAIL'        : tecnico['USUARIOS_EMAIL'],
                    'MOVIMENTOS_ID_EMPRESAS'  : params.empresa,
                    'MOVIMENTOS_ID_DOCUMENTOS': params.empresa + '0002',
                    'MOVIMENTOS_ID_OPERACOES' : 500000,
                    'MOVIMENTOS_ID_PRAZOS'    : 1,
                    'MOVIMENTOS_ID_USUARIOS'  : 1,
                    'MOVIMENTOS_STATUS'       : 'N',
                    'MOVIMENTOS_SITUACAO'     : 0,
                    'MOVIMENTOS_PRODUTOS'     : total,
                    'MOVIMENTOS_TOTAL'        : total,
                    'MOVIMENTOS_IMPOSTO'      : 0,
                    'MOVIMENTOS_FRETE'        : 0,
                    'MOVIMENTOS_DESCONTOS'    : 0,
                    'MOVIMENTOS_PERCENTUAL'   : 0,
                    'MOVIMENTOS_SEGURO'       : 0,
                    'MOVIMENTOS_DESPESAS'     : 0,
                    'MOVIMENTOS_MARGEM'       : 0,
                    'MOVIMENTOS_OBSERVACOES'  : '||||||||||',
                    'MOVIMENTOS_ENTRADASAIDA' : '1899-12-30',
                    'MOVIMENTOS_ITENS'        : produtos
                }

                const pedidoGravado = await api.movimentos().create(pedido, params);
                const objAvanco     = await api.ordensavanco().read(params);
                const results       = objAvanco.results;

                results[0]['MOVIMENTOS_ID'] = pedidoGravado.results['MOVIMENTOS_ID'];//para recuperar no front

                samosFB.processarLeitura({ db, results, total: results.length, resolve, reject });
            } catch(error) {
                samosFB.enviarRespostaErro(`Erro ordensavanco/create`, db, error, reject);
            }
        })
    }
};