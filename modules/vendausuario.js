'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
                const { empresa, clientname, tipo, documento, vendedor, inicio, final} = params;
                const db = await samosFB.conectarBanco(params.client);

                let sqlEmpresa = '';
                let sqlDocumento = '';
                let sqlUsuario = '';
                let sqlSearch = '';

                if(empresa > 0) {
                    sqlEmpresa = ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
                }

                if(documento > 0) {
                    sqlDocumento = ` and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '000${documento}' `;
                }

                if(vendedor > 0) {
                    sqlUsuario = ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
                } 

                if(clientname == 'prudenmoveis') {
                    sqlSearch = `execute block returns (
                        USUARIOS_ID_EMPRESAS integer,
                        EMPRESAS_FANTASIA varchar(50),
                        USUARIOS_ID integer,
                        USUARIOS_NOME varchar(50),
                        MOVIMENTOS_QTDEVENDAS integer,
                        MOVIMENTOS_VALORPARTIDA numeric(14,2),
                        MOVIMENTOS_TOTAL numeric(14, 2),      
                        MOVIMENTOS_PRECOMINIMO numeric(14, 2),
                        MOVIMENTOS_COMISSAO numeric(14, 2)    
                    )
                    as
                    begin
                        for
                            select MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME from MOVIMENTOS
                            join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                            join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                            where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                  right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                                  MOVIMENTOS_STATUS <> 'C' ${sqlEmpresa} ${sqlUsuario}
                            group by MOVIMENTOS_ID_EMPRESAS, EMPRESAS_FANTASIA, MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME
                            into :USUARIOS_ID_EMPRESAS,
                                 :EMPRESAS_FANTASIA,
                                 :USUARIOS_ID,
                                 :USUARIOS_NOME
                        do
                            begin
                                MOVIMENTOS_QTDEVENDAS = 0;
                                MOVIMENTOS_VALORPARTIDA = 0;
                                MOVIMENTOS_TOTAL = 0;
                                MOVIMENTOS_PRECOMINIMO = 0;
                                MOVIMENTOS_COMISSAO = 0;

                                select count(*) from MOVIMENTOS
                                where MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
                                    MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
                                    MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
                                    right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                                    MOVIMENTOS_STATUS <> 'C'
                                into
                                    :MOVIMENTOS_QTDEVENDAS;

                                select sum(MOVIMENTOSITENS_IMPOSTO),
                                       sum(MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS),
                                       sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_VALORPISST),
                                       sum(round(((MOVIMENTOSITENS_IMPOSTO / 100) * SALDOS_COMISSAO), 2))
                                from MOVIMENTOSITENS
                                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                                join SALDOS on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS     
                                where MOVIMENTOS_ID_EMPRESAS = :USUARIOS_ID_EMPRESAS and
                                      MOVIMENTOS_ID_USUARIOS = :USUARIOS_ID and
                                    MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and 
                                    right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                                    MOVIMENTOS_STATUS <> 'C'
                                into
                                    :MOVIMENTOS_VALORPARTIDA,
                                    :MOVIMENTOS_TOTAL,
                                    :MOVIMENTOS_PRECOMINIMO,
                                    :MOVIMENTOS_COMISSAO;
                                if (MOVIMENTOS_VALORPARTIDA > 0) then  suspend;
                            end
                    end;`    
                } else {  // Demais clientes, não existe partida.
                    if(tipo == 0) {  // Sintético
                        sqlSearch = `select MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO, 
                                                sum(MOVIMENTOS_TOTAL - MOVIMENTOS_FRETE - MOVIMENTOS_DESPESAS) as MOVIMENTOS_VALORTOTAL from MOVIMENTOS
                                        join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                        join CIDADES on CIDADES_ID = USUARIOS_ID_CIDADES       
                                                where MOVIMENTOS_EMISSAO between  '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and
                                                ((MOVIMENTOS_STATUS <> 'C') and 
                                                 (MOVIMENTOS_STATUS <> 'D') and
                                                 (MOVIMENTOS_STATUS <> 'R') and
                                                 (MOVIMENTOS_STATUS <> 'V')) ${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
                                        group by MOVIMENTOS_ID_USUARIOS, USUARIOS_NOME, CIDADES_NOME, CIDADES_ESTADO`
                    } else { // Analítico
                        sqlSearch = `select MOVIMENTOS_ID_DOCUMENTOS, 
                                            MOVIMENTOS_NUMERO, 
                                            MOVIMENTOS_SERIE, 
                                            MOVIMENTOS_ID_USUARIOS, 
                                            USUARIOS_NOME, 
                                            MOVIMENTOS_ID_PESSOAS, 
                                            MOVIMENTOS_NOME,
                                            CIDADES_NOME, 
                                            CIDADES_ESTADO, 
                                            MOVIMENTOS_EMISSAO, 
                                            MOVIMENTOS_ENTRADASAIDA,
                                            MOVIMENTOSITENS_ID_PRODUTOS, 
                                            PRODUTOS_NOME, 
                                            MOVIMENTOSITENS_QUANTIDADE, 
                                            MOVIMENTOS_MARGEM,
                                            MOVIMENTOS_SEGURO,
                                            MOVIMENTOSITENS_MARGEM,
                                            MOVIMENTOSITENS_SEGURO,
                                            MOVIMENTOSITENS_CUSTO,
                                            MOVIMENTOSITENS_VALORCOFINSST,
                                            SALDOS_CUSTO,
                                            (MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as MOVIMENTOSITENS_TOTAL
                                    from MOVIMENTOSITENS
                                    left outer join MOVIMENTOS ON MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                    left outer join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                    left outer join SALDOS on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS and SALDOS_ID_EMPRESAS = MOVIMENTOS_ID_EMPRESAS
                                    left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                                    left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                                    left outer join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                                    where ((MOVIMENTOS_STATUS <> 'C') and 
                                           (MOVIMENTOS_STATUS <> 'D') and
                                           (MOVIMENTOS_STATUS <> 'R') and
                                           (MOVIMENTOS_STATUS <> 'V')) and
                                    MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' 
                                    ${sqlEmpresa} ${sqlDocumento} ${sqlUsuario}
                                    ORDER BY MOVIMENTOS_ID_USUARIOS, MOVIMENTOS_EMISSAO, MOVIMENTOS_NUMERO`
                    }
                }

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
