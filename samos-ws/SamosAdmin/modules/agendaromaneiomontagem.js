'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {
        try {
            const { empresa, pessoa, numero, inicio, final, turno, situacao } = params; 
            let sqlEmpresa = empresa ? `and MOVIMENTOS_ID_EMPRESAS = '${empresa}' ` : '';
            let sqlNumero = numero ? `and MOVIMENTOS_NUMERO = '${numero}' ` : '';            
            let sqlWhere = `where right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                                  (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E') 
                                  ${sqlEmpresa} ${sqlNumero}`;

            let sqlRomaneio = '';
            
            if(pessoa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
            }
            
            if(!numero) {
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and MOVIMENTOSITENS_DATAMONTAGEM between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }    
            }

            if(numero) {  // se numero ignora situação                
                sqlRomaneio += ` 
                    if(
                        (
                            select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                            join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                            join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                            where MOVIMENTOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS
                        ) > 0
                    ) then
                            begin
                            if (left(MOVIMENTOS_NFE, 2) <> 'MO') then
                                MOVIMENTOS_SITUACAO = '0';
                            else
                              if(left(MOVIMENTOS_NFE, 2) = 'MO') then
                                MOVIMENTOS_SITUACAO = '3';
                              else  
                                begin
                                    if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                                        left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                                        where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                                        right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                                        ROMANEIOS_STATUS = 'N')
                                    ) then
                                        MOVIMENTOS_SITUACAO = '1';
                                    else 
                                        MOVIMENTOS_SITUACAO = '2';
                                end
                            suspend; 
                        end `
            } else {
                if(situacao === '0'){  // Montar
                    sqlRomaneio += ` 
                    if(
                        (
                            select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                            join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                            join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                            where MOVIMENTOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                                  MOVIMENTOSITENS_CSTPIS <> 'ML'
                        ) > 0
                    ) then
                        begin
                            if (left(MOVIMENTOS_NFE, 2) <> 'MO')
                              then
                                begin
                                    MOVIMENTOS_SITUACAO = '0';
                                    suspend;
                                end
                        end`; 
                } else if(situacao === '1'){ // Montado
                    sqlRomaneio += ` if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                        left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                        where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                              right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                              ROMANEIOS_STATUS = 'N')
                    ) then
                        begin
                            MOVIMENTOS_SITUACAO = '1';
                            suspend; 
                        end`; 
                } else if(situacao === '2'){ // Não entregue
                    sqlRomaneio += ` if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                        left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                        where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                              right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                              ROMANEIOS_STATUS <> 'N')
                    ) then
                        begin
                            MOVIMENTOS_SITUACAO = '2';
                            suspend;
                        end`; 
                } else if(situacao === '3'){ // Pendente
                    sqlRomaneio += ` if (left(MOVIMENTOS_NFE, 2) = 'MO')
                        then
                            begin
                                MOVIMENTOS_SITUACAO = '3';
                                suspend;
                            end`;    
                } else {  // Todos
                    sqlRomaneio += ` 
                        if(
                            (
                                select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                                join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                                join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                                where MOVIMENTOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS
                            ) > 0
                        ) then
                                begin
                                if (left(MOVIMENTOS_NFE, 2) <> 'MO') then
                                    MOVIMENTOS_SITUACAO = '0';
                                else
                                  if(left(MOVIMENTOS_NFE, 2) = 'MO') then
                                    MOVIMENTOS_SITUACAO = '3';
                                  else  
                                    begin
                                        if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                                            left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                                            where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                                            right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                                            ROMANEIOS_STATUS = 'N')
                                        ) then
                                            MOVIMENTOS_SITUACAO = '1';
                                        else 
                                            MOVIMENTOS_SITUACAO = '2';
                                    end
                                suspend; 
                            end `
                }    
            }
            if(situacao === '0'){  // Montar
                sqlRomaneio += ` 
                if(
                    (
                        select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                        join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                        join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                        where MOVIMENTOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                              MOVIMENTOSITENS_CSTPIS <> 'ML'
                    ) > 0
                ) then
                    begin
                        if (left(MOVIMENTOS_NFE, 2) <> 'MO')
                          then
                            begin
                                MOVIMENTOS_SITUACAO = '0';
                                suspend;
                            end
                    end`; 
            } else if(situacao === '1'){ // Montado
                sqlRomaneio += ` if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                    left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                    where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                          right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                          ROMANEIOS_STATUS = 'N')
                ) then
                    begin
                        MOVIMENTOS_SITUACAO = '1';
                        suspend; 
                    end`; 
            } else if(situacao === '2'){ // Não entregue
                sqlRomaneio += ` if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                    left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                    where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                          right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                          ROMANEIOS_STATUS <> 'N')
                ) then
                    begin
                        MOVIMENTOS_SITUACAO = '2';
                        suspend;
                    end`; 
            } else if(situacao === '3'){ // Pendente
                sqlRomaneio += ` if (left(MOVIMENTOS_NFE, 2) = 'MO')
                    then
                        begin
                            MOVIMENTOS_SITUACAO = '3';
                            suspend;
                        end`;    
            } else {  // Todos
                sqlRomaneio += ` 
                    if(
                        (
                            select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                            join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                            join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                            where MOVIMENTOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS
                        ) > 0
                    ) then
                            begin
                            if (left(MOVIMENTOS_NFE, 2) <> 'MO') then
                                MOVIMENTOS_SITUACAO = '0';
                            else
                              if(left(MOVIMENTOS_NFE, 2) = 'MO') then
                                MOVIMENTOS_SITUACAO = '3';
                              else  
                                begin
                                    if (exists(select ROMANEIOSITENS_ID from ROMANEIOSITENS
                                        left outer join ROMANEIOS  on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                                        where ROMANEIOSITENS_ID_MOVIMENTOS = :MOVIMENTOSITENS_ID_MOVIMENTOS and
                                        right(lpad(ROMANEIOS_ID_DOCUMENTOS, 6, 0), 4) = '0017' and
                                        ROMANEIOS_STATUS = 'N')
                                    ) then
                                        MOVIMENTOS_SITUACAO = '1';
                                    else 
                                        MOVIMENTOS_SITUACAO = '2';
                                end
                            suspend; 
                        end `
            }

            if(turno != 0){
                sqlWhere += ` and MOVIMENTOSITENS_HORAMONTAGEM = '${turno}' `; 
            }
                
            const sqlSearch = `execute block returns (
                    MOVIMENTOSITENS_ID_MOVIMENTOS integer,
                    MOVIMENTOS_ID_EMPRESAS integer,
                    MOVIMENTOS_NUMERO integer,
                    MOVIMENTOS_SERIE varchar(3),
                    MOVIMENTOS_NFE varchar(50),
                    MOVIMENTOS_ID_PESSOAS integer,
                    MOVIMENTOS_NOME varchar(50),
                    CIDADES_NOME varchar(50),
                    CIDADES_ESTADO varchar(2),
                    PESSOAS_CELULAR varchar(15),
                    MOVIMENTOS_EMISSAO date,
                    MOVIMENTOS_TOTAL numeric(14,2),
                    MOVIMENTOSITENS_DATAENTREGA date,
                    MOVIMENTOSITENS_HORAENTREGA varchar(10),
                    MOVIMENTOSITENS_DATAMONTAGEM date,
                    MOVIMENTOSITENS_HORAMONTAGEM varchar(10),
                    MOVIMENTOS_SITUACAO char(1)
                ) as
                begin
                    for 
                        select
                            MOVIMENTOSITENS_ID_MOVIMENTOS,
                            MOVIMENTOS_ID_EMPRESAS, 
                            MOVIMENTOS_NUMERO,
                            MOVIMENTOS_SERIE,
                            MOVIMENTOS_NFE,
                            MOVIMENTOS_ID_PESSOAS, 
                            MOVIMENTOS_NOME,
                            CIDADES_NOME,
                            CIDADES_ESTADO,
                            PESSOAS_CELULAR,
                            MOVIMENTOS_EMISSAO,
                            MOVIMENTOS_TOTAL,
                            MOVIMENTOSITENS_DATAENTREGA,
                            MOVIMENTOSITENS_HORAENTREGA,
                            MOVIMENTOSITENS_DATAMONTAGEM,
                            MOVIMENTOSITENS_HORAMONTAGEM
                        from MOVIMENTOSITENS
                            left outer join MOVIMENTOS on MOVIMENTOS_ID            = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left outer join PESSOAS    on MOVIMENTOS_ID_PESSOAS    = PESSOAS_ID
                            left outer join CIDADES    on PESSOAS_ID_CIDADES       = CIDADES_ID
                        ${sqlWhere} 
                        group by
                            MOVIMENTOSITENS_ID_MOVIMENTOS,
                            MOVIMENTOS_ID_EMPRESAS, 
                            MOVIMENTOS_NUMERO,
                            MOVIMENTOS_SERIE,
                            MOVIMENTOS_NFE,
                            MOVIMENTOS_ID_PESSOAS, 
                            MOVIMENTOS_NOME,
                            CIDADES_NOME,
                            CIDADES_ESTADO,
                            PESSOAS_CELULAR,
                            MOVIMENTOS_EMISSAO,
                            MOVIMENTOS_TOTAL,
                            MOVIMENTOSITENS_DATAENTREGA,
                            MOVIMENTOSITENS_HORAENTREGA,
                            MOVIMENTOSITENS_DATAMONTAGEM,
                            MOVIMENTOSITENS_HORAMONTAGEM
                        order by
                            MOVIMENTOSITENS_ID_MOVIMENTOS,
                            MOVIMENTOS_ID_EMPRESAS, 
                            MOVIMENTOS_NUMERO,
                            MOVIMENTOS_SERIE,
                            MOVIMENTOS_NFE,
                            MOVIMENTOS_ID_PESSOAS, 
                            MOVIMENTOS_NOME,
                            CIDADES_NOME,
                            CIDADES_ESTADO,
                            PESSOAS_CELULAR,
                            MOVIMENTOS_EMISSAO,
                            MOVIMENTOS_TOTAL,
                            MOVIMENTOSITENS_DATAENTREGA,
                            MOVIMENTOSITENS_HORAENTREGA,
                            MOVIMENTOSITENS_DATAMONTAGEM,
                            MOVIMENTOSITENS_HORAMONTAGEM
                        into
                            :MOVIMENTOSITENS_ID_MOVIMENTOS,
                            :MOVIMENTOS_ID_EMPRESAS,
                            :MOVIMENTOS_NUMERO,
                            :MOVIMENTOS_SERIE,
                            :MOVIMENTOS_NFE,
                            :MOVIMENTOS_ID_PESSOAS, 
                            :MOVIMENTOS_NOME,
                            :CIDADES_NOME,
                            :CIDADES_ESTADO,
                            :PESSOAS_CELULAR,
                            :MOVIMENTOS_EMISSAO,
                            :MOVIMENTOS_TOTAL,
                            :MOVIMENTOSITENS_DATAENTREGA,
                            :MOVIMENTOSITENS_HORAENTREGA,
                            :MOVIMENTOSITENS_DATAMONTAGEM,
                            :MOVIMENTOSITENS_HORAMONTAGEM
                    do
                        begin
                            ${sqlRomaneio}
                        end
                end`; 
            
            const results = await samosFB.executeSQL(sqlSearch, params);
            
            await Promise.all(results.map(async movimento => {
                const sqlItens = `select 
                    MOVIMENTOSITENS.*, 
                    PRODUTOS_MARCA, 
                    PRODUTOS_NOME,
                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    (iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SALDOS_PRECO, 
                    SALDOS_PRAZO, 
                    SALDOS_DISPONIVEL, 
                    right(EMPRESAS_FANTASIA, 2) as EMPRESAS_SIGLA
                from MOVIMENTOSITENS
                left join PRODUTOS on PRODUTOS_ID        = MOVIMENTOSITENS_ID_PRODUTOS
                left join SALDOS   on SALDOS_ID_EMPRESAS = MOVIMENTOSITENS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left join EMPRESAS on EMPRESAS_ID        = MOVIMENTOSITENS_ID_EMPRESAS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOSITENS_ID_MOVIMENTOS']} 
                order by MOVIMENTOSITENS_ID`;

                movimento['MOVIMENTOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
            }));
            
            return { results, total: results.length };
        } catch(error) {
            const msg = 'Falha ao buscar romaneios de montagem';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, data, params) => {
        try {
            delete data['MOVIMENTOS_ID'];
            samosFB.removerRelacionamentos('MOVIMENTOSITENS', data);
            const values = JSON.stringify(utils.string.escapeSingleQuotes(data)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'').replace(/'NaN'/g, '0');;
            const sqlSearch = `update MOVIMENTOSITENS set ${values} where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`;
            await samosFB.executeSQL(sqlSearch, params);
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar romaneios de montagem' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    }
};