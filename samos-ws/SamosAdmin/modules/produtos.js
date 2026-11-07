'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const cents   = utils.number.cents.bind(utils.number);  
const grams   = utils.number.grams.bind(utils.number);

module.exports = {
    read: async params => {
        try {
            let { conteudo, pessoa, empresa, ordem, status, start, limit } = params;

            let sqlWhere = `where PRODUTOS_ID > 0  `;
            let sqlOrder = '';
            let ordemCor = '';
            let isRacaforte = (params.client || '').toLowerCase().match(/racaforte/);
            let isBiomart = (params.client || '').toLowerCase().match(/biomart|organoplant/);
            let nomeCliente = (params.client || 'STILOMOVEIS').toLowerCase();
            let usaPromocao = process.env[params.client ? ((params.client || '').toUpperCase() + '_PROMOCAO') : 'PROMOCAO'] == 'TRUE';

            if((params.client || '').toLowerCase() == 'stilomoveis') {
                ordemCor = ', PRODUTOS_APLICACAO';
            }           

            if((params.client || '').toLowerCase().match(/moveis|edular/) && status == 'T')  {
                sqlWhere += ` and ((PRODUTOS_STATUS = 'T') or (PRODUTOS_STATUS = 'L')) `;
            } else if(nomeCliente == 'lislais' && status == 'T')  {
                if(params.empresaLogada != 3) {
                   sqlWhere += ` and not (PRODUTOS_ID_PESSOAS = 27209 and PRODUTOS_ID_GRUPOS = 21) `; // filtra os INSUMOS, se não for empresa 3 na Lislais
                }
            } else if(isBiomart && status == 'T' && params.issaida == 'true') { 
                sqlWhere += ` and PRODUTOS_STATUS <> 'F' and PRODUTOS_ID_GRUPOS = 1 `;
            } else if (status == 'T') {
                sqlWhere += ` and PRODUTOS_STATUS <> 'F' `;
            } else if (status && params.client) {
                sqlWhere += ` and PRODUTOS_STATUS = '${status}' `;
            }    
        
            if (conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PRODUTOS_ID = ${conteudo.replace(/\./ig, '')} `;
                sqlOrder = ' order by PRODUTOS_ID ';
            } else if (conteudo && conteudo.substring(0, 1) == '+') {
                sqlWhere += `and PRODUTOS_NOME like  '${conteudo.replace(/\+/ig, '')}%' `;
                sqlOrder = ' order by PRODUTOS_NOME ';
            } else if (conteudo && conteudo.substring(0, 1) == '#') {
                sqlWhere += `and PRODUTOS_BARRA like  '${conteudo.replace(/\#/ig, '')}%' `;
                sqlOrder = ' order by PRODUTOS_BARRA ';
            } else if (conteudo && conteudo.substring(0, 1) == '@') {
                sqlWhere += `and PRODUTOS_MARCA like '${conteudo.replace(/\@/ig, '')}%' `;
                sqlOrder = ' order by PRODUTOS_MARCA ';
            } else if (conteudo && conteudo.substring(0, 1) == '-') {
                sqlWhere += `and PRODUTOS_FABRICA like  '${conteudo.replace(/\-/ig, '').toUpperCase()}%' `;
            } else {
                if (ordem == 0) {
                    sqlWhere += `and PRODUTOS_NOME like '${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_NOME ';
                } else if (ordem == 1) {
                    sqlWhere += `and PRODUTOS_NOME like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_NOME ';
                } else if (ordem == 2) {
                    sqlWhere += conteudo > 0 ? `and PRODUTOS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by PRODUTOS_ID ';
                } else if (ordem == 3) {
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'PRODUTOS',
                        chave: 'PRODUTOS_ID',
                        campos: [
                            'PRODUTOS_ID',
                            'PRODUTOS_BARRA',
                            'PRODUTOS_NOME'
                        ]
                    }, params);

                    sqlWhere += ` and PRODUTOS_ID = '${id}' `;
                    sqlOrder  = ' order by PRODUTOS_ID ';
                } else if (ordem == 4) {
                    sqlWhere += ` and PRODUTOS_MARCA like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_MARCA ';
                } else if (ordem == 5) {
                    sqlWhere += ` and PRODUTOS_APLICACAO like '%${conteudo}%' `;
                    sqlOrder = ' order by PRODUTOS_APLICACAO, PRODUTOS_NOME ';
                } else if (ordem == 6) {
                    sqlWhere += ` and PRODUTOS_FABRICA like '%${conteudo.toUpperCase()}%' `;
                    sqlOrder = ' order by PRODUTOS_FABRICA, PRODUTOS_NOME ';
                }else if (ordem == 7) {
                    sqlWhere += `and PRODUTOS_NOME like  '%${conteudo.replace('%', '')}%' `;
                    //Se for vista
                    if( params.tipopreco == 'vista' && nomeCliente != 'stilomoveis'){
                        sqlOrder = ` order by SALDOS_PRECO, PRODUTOS_NOME${ordemCor}`;
    
                    }else{
                        sqlOrder = ` order by SALDOS_PRAZO, PRODUTOS_NOME${ordemCor}`;
                    }
                }
            }

            const precoMarkUp = process.env[params.client ? ((params.client || '').toUpperCase() + '_MARKUP') : 'MARKUP'] == 'TRUE';
            const sqlPrecoMontagem = nomeCliente.match(/prudenmoveis|edular/) ? ', MONTAGENS_PRECOS' : '';
            
            const sqlSearch = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''} 
                PRODUTOS.*, 
                GRUPOS_NOME, 
                NCMS_STATUS,
                NCMS_NCM,
                NCMS_NOME, 
                PESSOAS_NOME, 
                PESSOAS_FORMULA,
                SALDOS_PRECO,
                SALDOS_PRAZO,
                SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                SALDOS_PRECOATACADO,
                EMPRESAS_CNAE,
                MONTAGENS_NOME, 
                MONTAGENS_VALOR${sqlPrecoMontagem}
            from PRODUTOS
            join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
            left outer join GRUPOS    on GRUPOS_ID    = PRODUTOS_ID_GRUPOS
            left outer join NCMS      on NCMS_ID      = PRODUTOS_ID_NCMS
            left outer join PESSOAS   on PESSOAS_ID   = PRODUTOS_ID_PESSOAS
            left outer join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
            left outer join EMPRESAS  on EMPRESAS_ID  = ${empresa}
            ${sqlWhere} ${sqlOrder}`;
            
            const sqlCount = `select count(*) from PRODUTOS 
                              join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                              ${sqlWhere}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);
            
            await Promise.all(results.map(async produto => {
                if(nomeCliente.match(/prudenmoveis|edular/)) { // Muda o preço montagem pra tabela definida na empresa
                    const tabelaMontagem = (produto['EMPRESAS_CNAE'] || '').split('|')[2];
                    let valorMontagem = 0;
                    if(tabelaMontagem == 'A') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[0]};
                    if(tabelaMontagem == 'B') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[1]};
                    if(tabelaMontagem == 'C') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[2]};    
                    produto['PRECO_MONTAGEM'] = cents(valorMontagem) / 100;
                } else {
                    produto['PRECO_MONTAGEM'] = produto['MONTAGENS_VALOR'];
                }

                const sqlSaldos = `select 
                    SALDOS_ID,
                    SALDOS_ID_EMPRESAS,
                    SALDOS_ID_PRODUTOS,
                    SALDOS_MAXIMO,
                    SALDOS_MINIMO,
                    SALDOS_DISPONIVEL,
                    SALDOS_COMPRADO,
                    SALDOS_RESERVADO,
                    SALDOS_COMPRA,
                    SALDOS_CUSTO,
                    SALDOS_PRECO,
                    ${
                        precoMarkUp ? 
                        '(SALDOS_PRECO - round((SALDOS_PRECO * (SALDOS_MARKUP / 100)), 2))': 
                        'SALDOS_PRECOMINIMO'
                    } as SALDOS_PRECOMINIMO,
                    SALDOS_PRECOATACADO,
                    SALDOS_TRANSFERENCIA,
                    SALDOS_PRAZO,
                    SALDOS_MARGEM,
                    SALDOS_MARKUP,
                    SALDOS_MARGEMMINIMA,
                    SALDOS_LOCAL,
                    SALDOS_ESCRITURACAO,
                    SALDOS_COMISSAO,
                    SALDOS_COMISSAOPRAZO,
                    SALDOS_EXCECAO,
                    SALDOS_IPI,
                    SALDOS_ICMSLC,
                    SALDOS_ICMS01,
                    SALDOS_ICMS02,
                    SALDOS_BASELC,
                    SALDOS_BASE01,
                    SALDOS_BASE02,
                    SALDOS_BENEFICIOLC,
                    SALDOS_BENEFICIO01,
                    SALDOS_BENEFICIO02,
                    SALDOS_CSTLOCAL,
                    SALDOS_CSTOUTROS,
                    left(trim(SALDOS_CSTLOCAL), 1) as TABELA_ORIGEM,
                    trim(substring(SALDOS_CSTLOCAL from 2 for 3)) as TABELA_LOCAL,
                    trim(substring(SALDOS_CSTOUTROS from 2 for 3)) as TABELA_OUTROS,
                    SALDOS_CSTSUBST,
                    SALDOS_ALIQUOTACFE,
                    SALDOS_ALIQUOTASUBST,
                    SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                    ${isRacaforte ? `(
                        select sum(MOVIMENTOSITENS_QUANTIDADE)
                        from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        where MOVIMENTOS_STATUS <> 'C' and
                            right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0001' and
                            MOVIMENTOSITENS_CSTPIS <> 'BA' and
                            MOVIMENTOSITENS_ID_OPERACOES = 400000 and
                            MOVIMENTOSITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}) as QTDE_ORCAMENTO, ` : ''}
                    ${isRacaforte ? `(
                        select sum(MOVIMENTOSITENS_QUANTIDADE)
                        from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                         where MOVIMENTOS_STATUS <> 'C' and
                               right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0004' and
                               MOVIMENTOSITENS_ID_OPERACOES = 600000 and
                               MOVIMENTOSITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}) as QTDE_PENDENTE, ` : ''}
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALOR from PROMOCOESITENS
                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                              PROMOCOES_EMISSAO  <= current_date and
                              PROMOCOES_VALIDADE >= current_date and
                              ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                              PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                    ) as VALOR_PROMOCAO,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORA from PROMOCOESITENS
                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                              PROMOCOES_EMISSAO  <= current_date and
                              PROMOCOES_VALIDADE >= current_date and
                              ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                              PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                    ) as VALOR_PROMOCAOA,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORB from PROMOCOESITENS
                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                              PROMOCOES_EMISSAO  <= current_date and
                              PROMOCOES_VALIDADE >= current_date and
                              ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                              PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                    ) as VALOR_PROMOCAOB,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORC from PROMOCOESITENS
                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                              PROMOCOES_EMISSAO  <= current_date and
                              PROMOCOES_VALIDADE >= current_date and
                              ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                              PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                    ) as VALOR_PROMOCAOC,
                    (
                        select first 1 skip 0 PROMOCOESITENS_CUSTOTECNICO from PROMOCOESITENS
                        join PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                              PROMOCOES_EMISSAO  <= current_date and
                              PROMOCOES_VALIDADE >= current_date and
                              ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                              PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                    ) as QTDE_PROMOCAO
                from SALDOS 
                where SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}
                      ${empresa ? ` and SALDOS_ID_EMPRESAS = ${empresa}` : ''}`;
        
                produto['SALDOS'] = await samosFB.executeSQL(sqlSaldos, params);

                //entra aqui para verificar se tem preço específico para este cliente
                if(pessoa) {
                    const queryPessoa = await samosFB.executeSQL(`select PESSOAS_FORMULA from PESSOAS where PESSOAS_ID = ${pessoa}`, params);
                    
                    await Promise.all((produto['SALDOS'] || []).map(async saldo => {
                        try {
                            //caso encontre preço específico, atribui ao campo SALDOS_PRECO
                            (JSON.parse(queryPessoa[0]['PESSOAS_FORMULA']) || [])
                                .filter(produto => produto['ID'] == saldo['SALDOS_ID_PRODUTOS'])
                                .map(produto => {
                                    saldo['SALDOS_PRECO'] = produto['RS'] || saldo['SALDOS_PRECO'];
                                    saldo['SALDOS_PRAZO'] = produto['RS'] || saldo['SALDOS_PRAZO'];

                                    if(produto['RS'] < saldo['SALDOS_PRECOMINIMO']) {
                                        saldo['SALDOS_PRECOMINIMO'] = produto['RS'] || saldo['SALDOS_PRECOMINIMO'];
                                    }
                                })
                        } catch (e) {/*caso nao tenha formula cai aqui e prossegue normalmente*/}
                    }));
                }

                if(isRacaforte) { // Raçaforte gera um campo adicional, com o saldo líquido (sem orc/pen)
                    await Promise.all((produto['SALDOS'] || []).map(async saldo => {
                        saldo['LIQUIDO_ESTOQUE'] = (grams(saldo['SALDOS_DISPONIVEL']) - grams(saldo['QTDE_ORCAMENTO']) - grams(saldo['QTDE_PENDENTE'])) / 1000;
                    }));
                }

                if(usaPromocao) {                    
                    const sqlPromocoes = `select 
                                            PROMOCOES_NOME, 
                                            PROMOCOES_VALIDADE, 
                                            PROMOCOESITENS_VALOR, 
                                            PROMOCOESITENS_VALORA, 
                                            PROMOCOESITENS_VALORB, 
                                            PROMOCOESITENS_VALORC,
                                            PROMOCOESITENS_DESCONTO,                     
                                            round((100 - (PROMOCOESITENS_VALOR / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADO,                    
                                            PROMOCOESITENS_PARCELAS, 
                                            cast((PROMOCOESITENS_INDICE * PROMOCOESITENS_PARCELAS * PROMOCOESITENS_VALOR) as integer) as TOTALPARCELAS_ITENS
                                        from PROMOCOESITENS
                                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                                        left outer join SALDOS   on SALDOS_ID_PRODUTOS = PROMOCOESITENS_ID_PRODUTOS and 
                                                                    SALDOS_ID_EMPRESAS = ${empresa ? empresa : 1}
                                        
                                        where PROMOCOES_STATUS = 'T'             and
                                            PROMOCOES_EMISSAO  <= current_date and
                                            PROMOCOES_VALIDADE >= current_date and
                                            ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                                            PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}`;

                    produto['PROMOCOES'] = await samosFB.executeSQL(sqlPromocoes, params);
                } else {
                    produto['PROMOCOES'] = [];
                }

                const sqlSaldosGeral = `select 
                    SALDOS_DISPONIVEL, 
                    SALDOS_RESERVADO, 
                    SALDOS_COMPRADO, 
                    EMPRESAS_ID, 
                    EMPRESAS_NOME, 
                    EMPRESAS_FANTASIA
                from SALDOS 
                left outer join EMPRESAS on EMPRESAS_ID = SALDOS_ID_EMPRESAS
                where EMPRESAS_ID > 0 and
                      SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}`;
                      
                produto['SALDOSGERAL'] = await samosFB.executeSQL(sqlSaldosGeral, params);

                const sqlNcms = `select
                    NCMS_STATUS,
                    NCMS_NCM, 
                    NCMS_ALIQUOTANACIONAL, 
                    NCMS_ALIQUOTAESTADUAL,
                    NCMS_ALIQUOTAIMPORTADO, 
                    NCMS_ALIQUOTAMUNICIPAL,
                    NCMS_CSTPIS,
                    NCMS_CSTCOFINS,
                    NCMS_ALIQUOTAPIS,
                    NCMS_ALIQUOTACOFINS,
                    NCMS_ALIQUOTAFCP,
                    NCMS_DIFAL
                from NCMS 
                where NCMS_ID = ${produto['PRODUTOS_ID_NCMS']}`;

                produto['NCMS'] = await samosFB.executeSQL(sqlNcms, params);
                
                const sqlLotes = `select first 1 skip 0
                    LOTES_ID,
                    LOTES_REFERENCIA,
                    LOTES_FABRICACAO,
                    LOTES_VALIDADE
                from LOTES
                where LOTES_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                  and LOTES_STATUS = 'T'
                  and LOTES_VALIDADE > 'now'
                order by LOTES_VALIDADE`;

                produto['LOTES'] = await samosFB.executeSQL(sqlLotes, params);

                const letrasConvenios = produto['SALDOS'][0]['SALDOS_LOCAL'] || ''; // Aqui grava Convenio local, RG12 e outros
                
                produto['CONVENIO_LOCAL']     = (letrasConvenios || '').split('|')[0] || '';
                produto['CONVENIO_OUTROS']    = (letrasConvenios || '').split('|')[1] || '';
                produto['CONVENIO_REGIAO12']  = (letrasConvenios || '').split('|')[2] || '';

            }));

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao buscar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    //pode ser um id ou uma lista de ids separada por vírgula
    readById: async (id, params) => {
        try {
            const ids = id.toString().split(',');

            let sqlWhere = ` where `;

            sqlWhere += ids.map(id => ` PRODUTOS_ID = '${id}' `).join(' or ');
            
            const sqlSearch = `select 
                PRODUTOS_ID,
                PRODUTOS_NOME,
                PRODUTOS_APLICACAO,
                SALDOS_PRECO
            from PRODUTOS
            left outer join SALDOS on SALDOS_ID_EMPRESAS = ${params.empresa} and 
                                      SALDOS_ID_PRODUTOS = PRODUTOS_ID
            ${sqlWhere}`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results: results.length, total };
        } catch(error) {
            const msg = 'Falha ao buscar produtos por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (produto, params) => {
        try {

            await samosFB.insert('PRODUTOS', produto, params);

            (produto['SALDOS'] || []).forEach(item => {
                item['SALDOS_ID_PRODUTOS'] = produto['PRODUTOS_ID'];
            });

            try {
                if((produto['SALDOS'] || []).length > 0) {
                    await samosFB.insert('SALDOS', produto['SALDOS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from PRODUTOS where PRODUTOS_ID        = ${produto['PRODUTOS_ID']};
                        delete from SALDOS   where SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']};
                    end
                `, params);

                throw error;
            }

            const empresaAtual = produto['SALDOS'][0]['SALDOS_ID_EMPRESAS'];
            await atualizaSaldos(empresaAtual, produto['PRODUTOS_ID'], params);
            await utils.dblog(params); 
            return { results: produto };

        } catch(error) {
            const msg = error.message ? 'Falha ao criar produto' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, produto, params) => {
        const saldos = produto['SALDOS'] || [];
        
        try {
            await samosFB.update(id, 'PRODUTOS', produto, params);

            let custoAnt = 0;
            let custoAtu = 0;

            const precosMulti = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRECOS') : 'PRECOS'] == 'MULTIEMPRESA';

            //SALDOS
            if(saldos.length > 0) {

                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`
                    select * from SALDOS 
                    where SALDOS_ID_PRODUTOS = ${id} and 
                          SALDOS_ID_EMPRESAS = ${saldos[0]['SALDOS_ID_EMPRESAS']}
                `, params);

                custoAnt = cents(itensOriginais[0]['SALDOS_CUSTO']);
                custoAtu = cents(saldos[0]['SALDOS_CUSTO']);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from SALDOS where 
                    SALDOS_ID_PRODUTOS = ${id} and 
                    SALDOS_ID_EMPRESAS = ${saldos[0]['SALDOS_ID_EMPRESAS']}
                `, params);
            
                //atribui o id do cabecalho
                saldos.map(item => { item['SALDOS_ID_PRODUTOS'] = id });
                
                try {
                    //grava os itens
                    await samosFB.insert('SALDOS', produto['SALDOS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('SALDOS', itensOriginais, params);
                    }

                    throw error;
                }

                if(precosMulti) {
                    let sqlPrecos = '';
                    let modelPrecos = produto['SALDOS'][0] || [];

                    if(cents(modelPrecos['SALDOS_PRECO'])         > 0) {sqlPrecos += `SALDOS_PRECO         = ${modelPrecos['SALDOS_PRECO']},`};
                    if(cents(modelPrecos['SALDOS_PRAZO'])         > 0) {sqlPrecos += `SALDOS_PRAZO         = ${modelPrecos['SALDOS_PRAZO']},`};
                    if(cents(modelPrecos['SALDOS_COMPRA'])        > 0) {sqlPrecos += `SALDOS_COMPRA        = ${modelPrecos['SALDOS_COMPRA']},`};
                    if(cents(modelPrecos['SALDOS_CUSTO'])         > 0) {sqlPrecos += `SALDOS_CUSTO         = ${modelPrecos['SALDOS_CUSTO']},`};
                    if(cents(modelPrecos['SALDOS_MARGEM'])        > 0) {sqlPrecos += `SALDOS_MARGEM        = ${modelPrecos['SALDOS_MARGEM']},`};
                    if(cents(modelPrecos['SALDOS_MARGEMMINIMA'])  > 0) {sqlPrecos += `SALDOS_MARGEMMINIMA  = ${modelPrecos['SALDOS_MARGEMMINIMA']},`};
                    if(cents(modelPrecos['SALDOS_TRANSFERENCIA']) > 0) {sqlPrecos += `SALDOS_TRANSFERENCIA = ${modelPrecos['SALDOS_TRANSFERENCIA']},`};
                    if(cents(modelPrecos['SALDOS_PRECOMINIMO'])   > 0) {sqlPrecos += `SALDOS_PRECOMINIMO   = ${modelPrecos['SALDOS_PRECOMINIMO']},`};
                    if(cents(modelPrecos['SALDOS_PRECOATACADO'])  > 0) {sqlPrecos += `SALDOS_PRECOATACADO  = ${modelPrecos['SALDOS_PRECOATACADO']},`};
                    if(cents(modelPrecos['SALDOS_COMISSAO'])      > 0) {sqlPrecos += `SALDOS_COMISSAO      = ${modelPrecos['SALDOS_COMISSAO']},`};
                    if(cents(modelPrecos['SALDOS_COMISSAOPRAZO']) > 0) {sqlPrecos += `SALDOS_COMISSAOPRAZO = ${modelPrecos['SALDOS_COMISSAOPRAZO']},`};

                    if(sqlPrecos) {
                        const updatePrecosSql = `update SALDOS set ${sqlPrecos.slice(0, -1)} 
                                                  where SALDOS_ID_EMPRESAS <> ${params.empresa} and SALDOS_ID_PRODUTOS = ${id}`;
                        await samosFB.executeSQL(updatePrecosSql, params);
                    }
                }
            }

            const estoqueMultiEmpresa = process.env[params.client ? ((params.client || '').toUpperCase() + '_ESTOQUE') : 'ESTOQUE'] == 'MULTIEMPRESA';

            if(!estoqueMultiEmpresa && saldos.length > 0) {
                const valuesFilhos = JSON.stringify(saldos[0]).replace(/{"/ig,'').replace(/":/ig, '=').replace(/","/ig, '\',').replace(/,"/ig, ',').replace(/}/ig, '').replace(/="/ig, '=\'');
                const updateChildSql = `update SALDOS set ${valuesFilhos} where SALDOS_ID_EMPRESAS = ${params.empresa} and SALDOS_ID_PRODUTOS = ${id}`;
                await samosFB.executeSQL(updateChildSql, params);
            }            

            const empresaAtual = (params.empresaLogada || 1);
            await atualizaSaldos(empresaAtual, id, params);

            if(params.client.toUpperCase().match(/OZONIOBRAS/) && custoAtu != custoAnt) {
                await atualizaCustoFormulas(params); // se custo mudou, Percorre as fórmulas atualizando
            }

            await utils.dblog(params); 

            return { results: produto };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar produto' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            const sql = `execute block as
                begin
                    delete from PRODUTOS where PRODUTOS_ID        = ${id};
                    delete from SALDOS   where SALDOS_ID_PRODUTOS = ${id};
                end;`;
            
            await samosFB.executeSQL(sql, params);
            utils.dblog(params);

        } catch(error) {
            const msg = 'Falha ao deletar produtos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function atualizaSaldos(idEmpresa, idProduto, params) {
    const client = params.client;
    const estoqueMultiEmpresa = process.env[client ? ((client || '').toUpperCase() + '_ESTOQUE') : 'ESTOQUE'] == 'MULTIEMPRESA';
    const precosMultiEmpresa  = process.env[client ? ((client || '').toUpperCase() + '_PRECOS')  : 'PRECOS']  == 'MULTIEMPRESA';

    let whereSaldos     = precosMultiEmpresa  ? `SALDOS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS;` : `SALDOS_ID_EMPRESAS = :V_EMPRESAS_ID and  SALDOS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS;`;
    let whereDisponivel = estoqueMultiEmpresa ? `SALDOS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS and SALDOS_ESCRITURACAO <> '9';` : `SALDOS_ID_EMPRESAS = :V_EMPRESAS_ID and  SALDOS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS and SALDOS_ESCRITURACAO <> '9';`;
    let whereEmpresas   = estoqueMultiEmpresa ? `MOVIMENTOSITENS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS and ` : `MOVIMENTOS_ID_EMPRESAS = :V_EMPRESAS_ID and MOVIMENTOSITENS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS and `;
    const sqlFiltro     = params.client.toUpperCase().match(/BELLAR/) ? ` and ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) <> '0003')
                                                                          or   (MOVIMENTOS_EMISSAO >= '19.02.2013' and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003'))` : ``    

    const executeBlock = `execute block as
        declare variable V_EMPRESAS_ID           integer;
        declare variable V_SALDOS_ID             integer;
        declare variable V_SALDOS_ID_EMPRESAS    integer;
        declare variable V_SALDOS_ID_PRODUTOS    integer;
        declare variable V_SALDOS_MAXIMO         numeric(12,3);
        declare variable V_SALDOS_MINIMO         numeric(12,3);
        declare variable V_SALDOS_DISPONIVEL     numeric(12,3);
        declare variable V_SALDOS_COMPRADO       numeric(12,3);
        declare variable V_SALDOS_RESERVADO      numeric(12,3);
        declare variable V_SALDOS_COMPRA         numeric(12,2);
        declare variable V_SALDOS_CUSTO          numeric(12,2);
        declare variable V_SALDOS_MARGEM         numeric(12,2);
        declare variable V_SALDOS_MARGEMMINIMA   numeric(12,2);        
        declare variable V_SALDOS_PRECO          numeric(12,2);
        declare variable V_SALDOS_PRECOMINIMO    numeric(12,2);
        declare variable V_SALDOS_PRECOATACADO   numeric(12,2);
        declare variable V_SALDOS_PRAZO          numeric(12,2);
        declare variable V_SALDOS_LOCAL          varchar(15);
        declare variable V_SALDOS_ESCRITURACAO   char(1);
        declare variable V_SALDOS_COMISSAO       numeric(6,3);
        declare variable V_SALDOS_COMISSAOPRAZO  numeric(6,3);        
        declare variable V_SALDOS_EXCECAO        char(1);
        declare variable V_SALDOS_IPI            numeric(6,3);
        declare variable V_SALDOS_ICMSLC         numeric(6,3);
        declare variable V_SALDOS_ICMS01         numeric(6,3);
        declare variable V_SALDOS_ICMS02         numeric(6,3);
        declare variable V_SALDOS_BASELC         numeric(6,3);
        declare variable V_SALDOS_BASE01         numeric(6,3);
        declare variable V_SALDOS_BASE02         numeric(6,3);
        declare variable V_SALDOS_BENEFICIOLC    varchar(10);
        declare variable V_SALDOS_BENEFICIO01    varchar(10);
        declare variable V_SALDOS_BENEFICIO02    varchar(10);
        declare variable V_SALDOS_CSTLOCAL       varchar(4);
        declare variable V_SALDOS_CSTOUTROS      varchar(4);
        declare variable V_SALDOS_CSTSUBST       varchar(10);
        declare variable V_SALDOS_ALIQUOTACFE    numeric(6,3);
        declare variable V_SALDOS_ALIQUOTASUBST  numeric(6,3);
        declare variable V_SALDOS_TRANSFERENCIA  numeric(12, 2);
        declare variable V_SALDOS_MARKUP         numeric(6, 3);
        declare variable V_ESTOQUE               char(1);
        declare variable V_QUANTIDADE            numeric(12,3);
        declare variable V_SALDO                 numeric(12,3);
    begin
        select 
            SALDOS_ID,
            SALDOS_ID_EMPRESAS,
            SALDOS_ID_PRODUTOS,
            SALDOS_MAXIMO,
            SALDOS_MINIMO,
            SALDOS_DISPONIVEL,
            SALDOS_COMPRADO,
            SALDOS_RESERVADO,
            SALDOS_COMPRA,
            SALDOS_CUSTO,
            SALDOS_PRECO,
            SALDOS_PRECOMINIMO,
            SALDOS_PRECOATACADO,
            SALDOS_PRAZO,
            SALDOS_MARGEM,
            SALDOS_MARGEMMINIMA,
            SALDOS_LOCAL,
            SALDOS_ESCRITURACAO,
            SALDOS_COMISSAO,
            SALDOS_COMISSAOPRAZO,
            SALDOS_EXCECAO,
            SALDOS_IPI,
            SALDOS_ICMSLC,
            SALDOS_ICMS01,
            SALDOS_ICMS02,
            SALDOS_BASELC,
            SALDOS_BASE01,
            SALDOS_BASE02,
            SALDOS_BENEFICIOLC,
            SALDOS_BENEFICIO01,
            SALDOS_BENEFICIO02,
            SALDOS_CSTLOCAL,
            SALDOS_CSTOUTROS,
            SALDOS_CSTSUBST,
            SALDOS_ALIQUOTACFE,
            SALDOS_ALIQUOTASUBST,
            SALDOS_TRANSFERENCIA,
            SALDOS_MARKUP
        from SALDOS
        where SALDOS_ID_EMPRESAS = ${idEmpresa} and SALDOS_ID_PRODUTOS = ${idProduto}
        order by SALDOS_ID_EMPRESAS,
                SALDOS_ID_PRODUTOS
        into
            :V_SALDOS_ID,
            :V_SALDOS_ID_EMPRESAS,
            :V_SALDOS_ID_PRODUTOS,
            :V_SALDOS_MAXIMO,
            :V_SALDOS_MINIMO,
            :V_SALDOS_DISPONIVEL,
            :V_SALDOS_COMPRADO,
            :V_SALDOS_RESERVADO,
            :V_SALDOS_COMPRA,
            :V_SALDOS_CUSTO,
            :V_SALDOS_PRECO,
            :V_SALDOS_PRECOMINIMO,
            :V_SALDOS_PRECOATACADO,
            :V_SALDOS_PRAZO,
            :V_SALDOS_MARGEM,
            :V_SALDOS_MARGEMMINIMA,
            :V_SALDOS_LOCAL,
            :V_SALDOS_ESCRITURACAO,
            :V_SALDOS_COMISSAO,
            :V_SALDOS_COMISSAOPRAZO,
            :V_SALDOS_EXCECAO,
            :V_SALDOS_IPI,
            :V_SALDOS_ICMSLC,
            :V_SALDOS_ICMS01,
            :V_SALDOS_ICMS02,
            :V_SALDOS_BASELC,
            :V_SALDOS_BASE01,
            :V_SALDOS_BASE02,
            :V_SALDOS_BENEFICIOLC,
            :V_SALDOS_BENEFICIO01,
            :V_SALDOS_BENEFICIO02,
            :V_SALDOS_CSTLOCAL,
            :V_SALDOS_CSTOUTROS,
            :V_SALDOS_CSTSUBST,
            :V_SALDOS_ALIQUOTACFE,
            :V_SALDOS_ALIQUOTASUBST,
            :V_SALDOS_TRANSFERENCIA,
            :V_SALDOS_MARKUP;
        for
            select EMPRESAS_ID from EMPRESAS
            order by EMPRESAS_ID
            into :V_EMPRESAS_ID
        do
            begin
                if (V_SALDOS_ID_EMPRESAS <> V_EMPRESAS_ID) then
                begin
                    if(
                        not exists(
                            select SALDOS_ID_PRODUTOS from SALDOS
                            where  SALDOS_ID_EMPRESAS = :V_EMPRESAS_ID and
                                   SALDOS_ID_PRODUTOS = :V_SALDOS_ID_PRODUTOS
                            order by SALDOS_ID_EMPRESAS, SALDOS_ID_PRODUTOS
                        )
                    ) then
                    begin
                        V_SALDOS_ID = gen_id(GEN_SALDOS_ID, 1);
                        while (
                            exists(
                                select SALDOS_ID from SALDOS
                                where SALDOS_ID =  :V_SALDOS_ID
                                order by SALDOS_ID
                            )
                        ) do
                            begin
                                V_SALDOS_ID = gen_id(GEN_SALDOS_ID, 1);
                            end

                        insert into SALDOS (
                            SALDOS_ID, 
                            SALDOS_ID_EMPRESAS, 
                            SALDOS_ID_PRODUTOS, 
                            SALDOS_MAXIMO, 
                            SALDOS_MINIMO, 
                            SALDOS_DISPONIVEL, 
                            SALDOS_COMPRADO, 
                            SALDOS_RESERVADO, 
                            SALDOS_COMPRA, 
                            SALDOS_CUSTO, 
                            SALDOS_MARGEM,
                            SALDOS_MARGEMMINIMA,
                            SALDOS_PRECO,
                            SALDOS_PRECOMINIMO,
                            SALDOS_PRECOATACADO,
                            SALDOS_PRAZO,
                            SALDOS_LOCAL,
                            SALDOS_ESCRITURACAO, 
                            SALDOS_COMISSAO,
                            SALDOS_COMISSAOPRAZO,
                            SALDOS_EXCECAO, 
                            SALDOS_IPI, 
                            SALDOS_ICMSLC, 
                            SALDOS_ICMS01, 
                            SALDOS_ICMS02, 
                            SALDOS_BASELC, 
                            SALDOS_BASE01,  
                            SALDOS_BASE02,
                            SALDOS_BENEFICIOLC,
                            SALDOS_BENEFICIO01,
                            SALDOS_BENEFICIO02,
                            SALDOS_CSTLOCAL,
                            SALDOS_CSTOUTROS,
                            SALDOS_CSTSUBST,
                            SALDOS_ALIQUOTACFE,
                            SALDOS_ALIQUOTASUBST,
                            SALDOS_TRANSFERENCIA,
                            SALDOS_MARKUP
                        ) values (
                            :V_SALDOS_ID,
                            :V_EMPRESAS_ID,
                            :V_SALDOS_ID_PRODUTOS,
                            :V_SALDOS_MAXIMO,
                            :V_SALDOS_MINIMO,
                            :V_SALDOS_DISPONIVEL,
                            :V_SALDOS_COMPRADO,
                            :V_SALDOS_RESERVADO,
                            :V_SALDOS_COMPRA,
                            :V_SALDOS_CUSTO,
                            :V_SALDOS_MARGEM,
                            :V_SALDOS_MARGEMMINIMA,
                            :V_SALDOS_PRECO,
                            :V_SALDOS_PRECOMINIMO,
                            :V_SALDOS_PRECOATACADO,
                            :V_SALDOS_PRAZO,
                            :V_SALDOS_LOCAL,
                            :V_SALDOS_ESCRITURACAO,
                            :V_SALDOS_COMISSAO,
                            :V_SALDOS_COMISSAOPRAZO,
                            :V_SALDOS_EXCECAO,
                            :V_SALDOS_IPI,
                            :V_SALDOS_ICMSLC,
                            :V_SALDOS_ICMS01,
                            :V_SALDOS_ICMS02,
                            :V_SALDOS_BASELC,
                            :V_SALDOS_BASE01,
                            :V_SALDOS_BASE02,
                            :V_SALDOS_BENEFICIOLC,
                            :V_SALDOS_BENEFICIO01,
                            :V_SALDOS_BENEFICIO02,               
                            :V_SALDOS_CSTLOCAL,
                            :V_SALDOS_CSTOUTROS,
                            :V_SALDOS_CSTSUBST,
                            :V_SALDOS_ALIQUOTACFE,
                            :V_SALDOS_ALIQUOTASUBST,
                            :V_SALDOS_TRANSFERENCIA,
                            :V_SALDOS_MARKUP
                        );
                    end
                end
            else
                begin
                    update SALDOS  set
                        SALDOS_MAXIMO        = :V_SALDOS_MAXIMO,
                        SALDOS_MINIMO        = :V_SALDOS_MINIMO,
                        /*SALDOS_DISPONIVEL  = :V_SALDOS_DISPONIVEL, atualizado separadamente abaixo*/
                        SALDOS_COMPRADO      = :V_SALDOS_COMPRADO,
                        SALDOS_RESERVADO     = :V_SALDOS_RESERVADO,
                        SALDOS_COMPRA        = :V_SALDOS_COMPRA,
                        SALDOS_CUSTO         = :V_SALDOS_CUSTO,
                        SALDOS_MARGEM        = :V_SALDOS_MARGEM,
                        SALDOS_MARGEMMINIMA  = :V_SALDOS_MARGEMMINIMA,
                        SALDOS_PRECO         = :V_SALDOS_PRECO,
                        SALDOS_PRECOMINIMO   = :V_SALDOS_PRECOMINIMO,
                        SALDOS_PRECOATACADO  = :V_SALDOS_PRECOATACADO,
                        SALDOS_PRAZO         = :V_SALDOS_PRAZO,
                        SALDOS_LOCAL         = :V_SALDOS_LOCAL,
                        SALDOS_ESCRITURACAO  = :V_SALDOS_ESCRITURACAO,
                        SALDOS_COMISSAO      = :V_SALDOS_COMISSAO,
                        SALDOS_COMISSAOPRAZO = :V_SALDOS_COMISSAOPRAZO,
                        SALDOS_EXCECAO       = :V_SALDOS_EXCECAO,
                        SALDOS_IPI           = :V_SALDOS_IPI,
                        SALDOS_ICMSLC        = :V_SALDOS_ICMSLC,
                        SALDOS_ICMS01        = :V_SALDOS_ICMS01,
                        SALDOS_ICMS02        = :V_SALDOS_ICMS02,
                        SALDOS_BASELC        = :V_SALDOS_BASELC,
                        SALDOS_BASE01        = :V_SALDOS_BASE01,
                        SALDOS_BASE02        = :V_SALDOS_BASE02,
                        SALDOS_BENEFICIOLC   = :V_SALDOS_BENEFICIOLC,
                        SALDOS_BENEFICIO01   = :V_SALDOS_BENEFICIO01,
                        SALDOS_BENEFICIO02   = :V_SALDOS_BENEFICIO02,
                        SALDOS_CSTLOCAL      = :V_SALDOS_CSTLOCAL,
                        SALDOS_CSTOUTROS     = :V_SALDOS_CSTOUTROS,
                        SALDOS_CSTSUBST      = :V_SALDOS_CSTSUBST,
                        SALDOS_ALIQUOTACFE   = :V_SALDOS_ALIQUOTACFE,
                        SALDOS_ALIQUOTASUBST = :V_SALDOS_ALIQUOTASUBST,
                        SALDOS_TRANSFERENCIA = :V_SALDOS_TRANSFERENCIA,
                        SALDOS_MARKUP        = :V_SALDOS_MARKUP
                    where ${whereSaldos}
                end
            
            V_SALDO = 0;
            for
                select OPERACOES_ESTOQUE,sum(MOVIMENTOSITENS_QUANTIDADE)
                from MOVIMENTOSITENS
                left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                where ${whereEmpresas}
                    ((MOVIMENTOS_STATUS <> 'C') and 
                     (MOVIMENTOS_STATUS <> 'D') and
                     (MOVIMENTOS_STATUS <> 'R'))
                      ${sqlFiltro}
                group by OPERACOES_ESTOQUE
                into :V_ESTOQUE,:V_QUANTIDADE
            do
                begin
                    if (V_ESTOQUE = 'C') then
                        V_SALDO = V_SALDO + :V_QUANTIDADE;
                    else
                        if (V_ESTOQUE = 'D') then
                            V_SALDO = V_SALDO - :V_QUANTIDADE;
                end

            update SALDOS set SALDOS_DISPONIVEL = :V_SALDO
            where ${whereDisponivel}
        end
    end;`;

    try {
        await samosFB.executeSQL(executeBlock, params)
    } catch (error) {
        console.log(error);
    }
};

const atualizaCustoFormulas = async function(params) {  // Atualiza o custo de todas as fórmulas de acordo com os produtos utilizados
    
    const sqlProdutos = `select PRODUCOESFORMULAS_ID_PRODUTOS from PRODUCOESFORMULAS`;

    const produtos = await samosFB.executeSQL(sqlProdutos, params); 

    for(let i in produtos) {

        const produtoFormula = produtos[i]['PRODUCOESFORMULAS_ID_PRODUTOS'];

        const queryFormula = await api.ordensproducaoformulas().readById(produtoFormula, params);

        if(queryFormula.results.length > 0) {
            const custoAtualizado = queryFormula.results[0]['VALOR_TOTAL'] || 0;
            if(custoAtualizado > 0) {
                const sql = `update SALDOS set SALDOS_CUSTO = ${custoAtualizado}
                             where SALDOS_ID_PRODUTOS = ${produtoFormula}`;
                try { 
                        await samosFB.executeSQL(sql, params);
                } catch(error) {
                    //apenas lança o erro nos logs, não para a aplicação
                    console.log(error);
                }
            }
        }
    }

};
