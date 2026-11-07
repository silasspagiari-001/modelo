'use strict';

const samosFB = require('../services/samosFirebird');
const api     = require('../modules');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, status, empresainicial, empresafinal, pessoainicial, pessoafinal, grupoinicial, grupofinal} = params;
            const db = await samosFB.conectarBanco(params.client);

            let parEmpresainicial = (empresainicial > 0 ? empresainicial : 1);
            let parEmpresafinal  = (empresafinal > 0 ? empresafinal : 999);

            let parPessoainicial = (pessoainicial > 0 ? pessoainicial : 1);
            let parPessoafinal  = (pessoafinal > 0 ? pessoafinal : 999999);
            let parGrupoinicial = (grupoinicial > 0 ? grupoinicial : 1);
            let parGrupofinal  = (grupofinal > 0 ? grupofinal : 999999);

            let sqlWhere = '';
            let whereSaldos = ` and ((SALDOS_ID_EMPRESAS between ${parEmpresainicial} and ${parEmpresafinal}) or (SALDOS_ID_EMPRESAS = 1))`;
            let sqlOrder = (parPessoainicial == 1 && parPessoafinal == 999999 ? 'PRODUTOS_NOME' : 'PRODUTOS_ID_PESSOAS, PRODUTOS_NOME');

            sqlWhere += `PRODUTOS_ID > 0 and PRODUTOS_ID_PESSOAS between ${parPessoainicial} and ${parPessoafinal} and 
                         PRODUTOS_ID_GRUPOS between ${parGrupoinicial} and ${parGrupofinal} `

            if(status != '') {
                if((params.client == 'prudenmoveis' || 
                    params.client == 'edular' ||
                    params.client == 'stilomoveis') && status == 'T')  {  // Ativo da Pruden/Stilo traz o fora de linha
                    sqlWhere += ` and ((PRODUTOS_STATUS = 'T') or (PRODUTOS_STATUS = 'L'))`;
                } else  {
                    sqlWhere += ` and PRODUTOS_STATUS = '${status}' `;
                }    
            }

            const sqlIds = `select PRODUTOS_ID from PRODUTOS
                            where ${sqlWhere}`;

            db.query(sqlIds, async (error, resultsIds) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlIds);
                } else {
                    await api['processos/atualizasaldo']().create({ // Tava bloqueado, vamos ver...
                        empresa: empresa,
                        produtos: (resultsIds || []).map(item => item['PRODUTOS_ID']),
                        client  : params.client
                    });

                    let sqlSearch = `execute block returns (
                        PRODUTOS_ID integer,
                        PRODUTOS_STATUS char(1),
                        PRODUTOS_UNIDADE varchar(3),
                        PRODUTOS_NOME varchar(100),
                        PRODUTOS_MARCA varchar(15),
                        PRODUTOS_ID_PESSOAS integer,
                        PESSOAS_NOME varchar(100),
                        PRODUTOS_ID_GRUPOS integer,
                        SALDOS_COMPRA numeric(12, 2),
                        SALDOS_CUSTO numeric(12, 2),
                        SALDOS_PRECO numeric(12, 2),
                        SALDOS_FILIAL01 numeric(12, 2),
                        SALDOS_FILIAL02 numeric(12, 2),
                        SALDOS_FILIAL03 numeric(12, 2),
                        SALDOS_FILIAL04 numeric(12, 2),
                        SALDOS_FILIAL05 numeric(12, 2),
                        SALDOS_FILIAL06 numeric(12, 2),
                        SALDOS_FILIAL07 numeric(12, 2),
                        SALDOS_FILIAL08 numeric(12, 2),
                        SALDOS_FILIAL09 numeric(12, 2)
                    ) as
                        declare variable V_SALDOS_ID_EMPRESAS integer;
                        declare variable V_SALDOS_ID_PRODUTOS integer;
                        declare variable V_SALDOS_DISPONIVEL numeric(12, 2);
                        declare variable V_SALDOS_CUSTO numeric(12, 2);
                        declare variable V_SALDOS_COMPRA numeric(12, 2);
                        declare variable V_SALDOS_PRECO numeric(12, 2);
                        begin
                        for
                        select PRODUTOS_ID,
                               PRODUTOS_STATUS,
                               PRODUTOS_UNIDADE,
                               PRODUTOS_NOME,
                               PRODUTOS_MARCA,
                               PRODUTOS_ID_PESSOAS,
                               PESSOAS_NOME,
                               PRODUTOS_ID_GRUPOS
                        from PRODUTOS
                        join PESSOAS on PESSOAS_ID = PRODUTOS_ID_PESSOAS
                        where ${sqlWhere}
                        order by ${sqlOrder}
                        into
                            :PRODUTOS_ID,
                            :PRODUTOS_STATUS,
                            :PRODUTOS_UNIDADE,
                            :PRODUTOS_NOME,
                            :PRODUTOS_MARCA,
                            :PRODUTOS_ID_PESSOAS,
                            :PESSOAS_NOME,
                            :PRODUTOS_ID_GRUPOS
                        do
                        begin
                        SALDOS_COMPRA   = 0;
                        SALDOS_CUSTO    = 0;
                        SALDOS_PRECO    = 0;
                        SALDOS_FILIAL01 = 0;
                        SALDOS_FILIAL02 = 0;
                        SALDOS_FILIAL03 = 0;
                        SALDOS_FILIAL04 = 0;
                        SALDOS_FILIAL05 = 0;
                        SALDOS_FILIAL06 = 0;
                        SALDOS_FILIAL07 = 0;
                        SALDOS_FILIAL08 = 0;
                        SALDOS_FILIAL09 = 0;
                        for
                        select SALDOS_ID_EMPRESAS,
                               SALDOS_ID_PRODUTOS,
                               SALDOS_COMPRA,
                               SALDOS_CUSTO,
                               SALDOS_PRECO,       
                               SALDOS_DISPONIVEL
                        from SALDOS
                        where SALDOS_ID_PRODUTOS = :PRODUTOS_ID
                              ${whereSaldos}
                        into
                            :V_SALDOS_ID_EMPRESAS,
                            :V_SALDOS_ID_PRODUTOS,
                            :V_SALDOS_COMPRA,
                            :V_SALDOS_CUSTO,
                            :V_SALDOS_PRECO,    
                            :V_SALDOS_DISPONIVEL
                        do
                            begin
                            if(V_SALDOS_ID_EMPRESAS = 1) then
                                begin
                                    SALDOS_COMPRA = :V_SALDOS_COMPRA;
                                    SALDOS_CUSTO = :V_SALDOS_CUSTO;
                                    SALDOS_PRECO = :V_SALDOS_PRECO;
                                end    
                            if (V_SALDOS_ID_EMPRESAS = 1)  then  SALDOS_FILIAL01 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 2)  then  SALDOS_FILIAL02 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 3)  then  SALDOS_FILIAL03 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 4)  then  SALDOS_FILIAL04 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 5)  then  SALDOS_FILIAL05 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 6)  then  SALDOS_FILIAL06 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 7)  then  SALDOS_FILIAL07 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 8)  then  SALDOS_FILIAL08 = :V_SALDOS_DISPONIVEL;
                            if (V_SALDOS_ID_EMPRESAS = 9)  then  SALDOS_FILIAL09 = :V_SALDOS_DISPONIVEL;
                            end
                        suspend;
                        end
                    end`;   
                    
                    db.query(sqlSearch, (error, results) => {
                        if (error) {
                            samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                        } else {
                            samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                        }
                    });
                }
            });                
        });
    }
};