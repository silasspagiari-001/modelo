'use strict';

const samosFB = require('../../services/samosFB');

module.exports = {
    create: async (data, params) => {
        params = data || {};
        
        const { empresa, produtos } = params;
        
        try {
            const idsEmpresas = empresa ? [empresa] : await getEmpresas(params);//se nao manda o parametro "empresa" atualiza todas
            const estoqueMultiEmpresa = process.env[params.client ? ((params.client || '').toUpperCase() + '_ESTOQUE') : 'ESTOQUE'] == 'MULTIEMPRESA';

            const deps = {
                listaProdutos       : produtos,
                estoqueMultiEmpresa : estoqueMultiEmpresa,
                idsEmpresas         : idsEmpresas, //estoqueMultiEmpresa ? idsEmpresas : idsEmpresas.slice(0, 1),
                indexEmpresa        : 0,
                indexProduto        : 0,
                intervalo           : 100
            }

            const result = await atualizarSaldoEmpresa(deps, params);

            if(result == 'sucesso'){
                if(produtos && produtos.length == 0) {
                    console.log(`Saldos atualizados ${empresa ? `- Empresa: ${empresa} ` : ''}`);
                }
                return {
                    results: [],
                    total: 0
                }
            } else {
                throw result;
            }
        } catch(error) {
            const msg = error.message ? 'Falha ao atualizar saldos' : error;
            console.log(`Erro atualização de saldo ${empresa ? ` - Empresa: ${empresa}` : ''}${produtos ? ` - Produtos: ${produtos.join(',')}` : ''} `);
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function atualizarSaldoEmpresa(deps, params) {
    deps.produtos = deps.listaProdutos || await getProdutos(deps, params);
    return atualizarSaldoIntervaloDeProdutos(deps, params);
};

async function atualizarSaldoIntervaloDeProdutos(deps, params) {
    const { produtos, indexProduto, intervalo, idsEmpresas, indexEmpresa } = deps;
    const indexFinal = indexProduto + intervalo;
    const produtosSelecionados = produtos.slice(indexProduto, indexFinal);
    
    if(produtosSelecionados.length > 0){
        deps.strIdsProdutos = produtosSelecionados.join(',') + ',0';
    
        await executarAtualizacao(deps, params);
    
        deps.indexProduto = indexFinal;
        return atualizarSaldoIntervaloDeProdutos(deps, params);
    } else if(idsEmpresas[indexEmpresa + 1]) {
        deps.indexEmpresa = indexEmpresa + 1;
        deps.indexProduto = 0;

        return atualizarSaldoEmpresa(deps, params);
    } else {
        return 'sucesso';
    }
};

async function getEmpresas(params) {
    const sql = `select EMPRESAS_ID from EMPRESAS where EMPRESAS_STATUS = 'T'`;
    const results = await samosFB.executeSQL(sql, params)
    
    return (results || []).map(model => model['EMPRESAS_ID']);
};

async function getProdutos(deps, params) {
    const { idsEmpresas, indexEmpresa } = deps;
    const empresa = idsEmpresas[indexEmpresa];
    
    const sql = `select 
        SALDOS_ID_PRODUTOS from SALDOS 
        where SALDOS_ID_EMPRESAS = ${empresa} 
        order by SALDOS_ID_PRODUTOS`;
    
    const results = await samosFB.executeSQL(sql, params);
    
    return (results || []).map(model => model['SALDOS_ID_PRODUTOS']);
};

async function executarAtualizacao(deps, params) {
    const { idsEmpresas, estoqueMultiEmpresa, indexEmpresa, strIdsProdutos } = deps;
    const empresa = idsEmpresas[indexEmpresa];
    const sqlFiltro = params.client.toUpperCase().match(/BELLAR/) ? ` and ((right(MOVIMENTOS_ID_DOCUMENTOS, 4) <> '0003')
                                                                      or   (MOVIMENTOS_EMISSAO >= '19.02.2013' and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003'))` : ``
    
    const executeBlock = `execute block as 
        declare variable P_LISTA varchar(1024);
        declare variable UltimaPosicao integer;
        declare variable ProximaPosicao integer;
        declare variable V_SALDO numeric(12,3);
        declare variable V_SALDOANTERIOR numeric(12,3);
        declare variable V_PRODUTO varchar(10);
        declare variable V_ESTOQUE varchar(1);
        declare variable V_QUANTIDADE numeric(12,3);
        
        begin
            P_LISTA        = '${strIdsProdutos}';
            UltimaPosicao  = 1;
            ProximaPosicao = position(',', :P_LISTA, UltimaPosicao);
            while (:ProximaPosicao > 1) do
            begin
                V_SALDO        = 0;
                V_SALDOANTERIOR= 0;
                V_PRODUTO      = substring(:P_LISTA from :UltimaPosicao for :ProximaPosicao - :UltimaPosicao);
                UltimaPosicao  = :ProximaPosicao + 1;
                ProximaPosicao = position(',', :P_LISTA, UltimaPosicao);

                for
                    select OPERACOES_ESTOQUE,SALDOS_DISPONIVEL,sum(MOVIMENTOSITENS_QUANTIDADE)
                    from MOVIMENTOSITENS
                    left outer join MOVIMENTOS on MOVIMENTOS_ID  = MOVIMENTOSITENS_ID_MOVIMENTOS
                    left outer join OPERACOES  on OPERACOES_ID   = MOVIMENTOSITENS_ID_OPERACOES
                    left outer join SALDOS     on SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                                    ${estoqueMultiEmpresa ? ` and SALDOS_ID_EMPRESAS = 1 ` : ` and SALDOS_ID_EMPRESAS = '${empresa}' `}
                    where MOVIMENTOSITENS_ID_PRODUTOS = :V_PRODUTO and 
                          ${estoqueMultiEmpresa ? '' : ` MOVIMENTOS_ID_EMPRESAS = '${empresa}' and `}
                          ((MOVIMENTOS_STATUS <> 'C') and 
                           (MOVIMENTOS_STATUS <> 'D') and
                           (MOVIMENTOS_STATUS <> 'R')) and
                          OPERACOES_ESTOQUE <> 'N' ${sqlFiltro}
                    group by OPERACOES_ESTOQUE,SALDOS_DISPONIVEL
                    into :V_ESTOQUE,:V_SALDOANTERIOR,:V_QUANTIDADE
                do
                    begin
                        if (V_ESTOQUE = 'C') then
                            V_SALDO = V_SALDO + :V_QUANTIDADE;
                        else
                            if (V_ESTOQUE = 'D') then
                                V_SALDO = V_SALDO - :V_QUANTIDADE;
                    end
              
                if (V_SALDOANTERIOR <> V_SALDO) then
                    in autonomous transaction do
                        begin
                            update SALDOS set SALDOS_DISPONIVEL = :V_SALDO
                            where 
                                ${estoqueMultiEmpresa ? '' : ` SALDOS_ID_EMPRESAS = '${empresa}' and `}
                                SALDOS_ID_PRODUTOS = :V_PRODUTO and SALDOS_ESCRITURACAO <> '9';
                        end

                    when any do
                        begin
                            exit;
                        end
            end
        end`;
    
    try {
        return await samosFB.executeSQL(executeBlock, params);
    } catch(error) {
        console.log(error);
    }
};