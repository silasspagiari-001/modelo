'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');

module.exports = {
    read: async params => {

        try {
            const { conteudo, ordem, status, start, limit } = params || {};
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere = `where EMPRESAS_ID > 0  `;
                sqlWhere += status == 0 ? `and EMPRESAS_STATUS = 'T' ` : status == 1 ? `and EMPRESAS_STATUS = 'F' ` : '';
            let sqlOrder = '';

            if(conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and EMPRESAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
            } else {            
                if(ordem == 0) {
                    sqlWhere += `and EMPRESAS_NOME like '${conteudo.toUpperCase()}%' `; 
                    sqlOrder = ' order by EMPRESAS_NOME ';  
                } else if (ordem == 1) {
                    sqlWhere += `and EMPRESAS_NOME like '%${conteudo.toUpperCase()}%' `;
                    sqlOrder = ' order by EMPRESAS_NOME ';  
                } else if (ordem == 2) {
                    sqlWhere += `and EMPRESAS_FANTASIA like '%${conteudo.toUpperCase()}%' `;
                    sqlOrder = ' order by EMPRESAS_FANTASIA ';  
                } else if (ordem == 3) {
                    sqlWhere += `and EMPRESAS_CPFCNPJ like '%${conteudo}%' `;
                    sqlOrder = ' order by EMPRESAS_CPFCNPJ ';  
                } else if (ordem == 4) {
                    sqlWhere += conteudo > 0 ? `and EMPRESAS_ID = '${conteudo}' ` : '';
                    sqlOrder = ' order by EMPRESAS_ID ';  
                } else if(ordem == 5){
                    const id = await samosFB.buscaMultipla({
                        conteudo,
                        tabela: 'EMPRESAS',
                        chave: 'EMPRESAS_ID',
                        campos: [
                            'EMPRESAS_ID',                                
                            'EMPRESAS_NOME',
                            'EMPRESAS_FANTASIA',
                            'EMPRESAS_CPFCNPJ',
                            'EMPRESAS_LOGIN',
                            'EMPRESAS_EMAIL',
                            'EMPRESAS_INSCRICAO'
                        ]
                    }, params);

                    sqlWhere += `and EMPRESAS_ID = '${id}' `;
                    sqlOrder = ' order by EMPRESAS_ID '; 
                }
            }    

            const sqlCount  = `select count(*) from EMPRESAS ${sqlWhere} `;

            const sqlSearch = `select ${limits} 
                EMPRESAS.*,
                CIDADES_NOME,
                CIDADES_ESTADO,
                CIDADES_IBGE,
                PORTADORES_NOME 
            from EMPRESAS
            left outer join CIDADES on CIDADES_ID = EMPRESAS_ID_CIDADES
            left outer join PORTADORES on PORTADORES_ID = EMPRESAS_ID_PORTADORES
            ${sqlWhere} ${sqlOrder}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            results.forEach(empresa => {
                empresa['FRETEURB']       = empresa['EMPRESAS_CNAE'].split('|')[0] || 0;
                empresa['FRETESUB']       = empresa['EMPRESAS_CNAE'].split('|')[1] || 0;
                empresa['TABMONTAGEM']    = empresa['EMPRESAS_CNAE'].split('|')[2] || 'A';
                empresa['MINENTREGAURB']  = empresa['EMPRESAS_CNAE'].split('|')[3] || 0;
                empresa['MINENTREGASUB']  = empresa['EMPRESAS_CNAE'].split('|')[4] || 0;
                empresa['ALIQCOM']        = empresa['EMPRESAS_CNAE'].split('|')[5] || 0;
                empresa['ALIQIND']        = empresa['EMPRESAS_CNAE'].split('|')[6] || 0;
            });

            return { 
                results: results,
                total  : total
            };
        } catch(error) {
            const msg = 'Falha ao buscar empresas';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (empresa, params) => {
        try {
            
            if((params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) { //Traz os campos específicos da Prudenmóveis
                empresa['EMPRESAS_CNAE'] = (empresa['FRETEURB'] || '')      + '|' + 
                                           (empresa['FRETESUB'] || '')      + '|' + 
                                           (empresa['TABMONTAGEM'] || '')   + '|' + 
                                           (empresa['MINENTREGAURB'] || '') + '|' + 
                                           (empresa['MINENTREGASUB'] || '') + '|' + 
                                           (empresa['ALIQCOM'] || '')       + '|' + 
                                           (empresa['ALIQIND'] || '');
            }

            await samosFB.insert('EMPRESAS', empresa, params);
            await utils.dblog(params);  
            await criarSaldosEDocumentos(empresa, params);
            return { results: empresa };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar empresa' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, empresa, params) => {
        try {

            if((params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) { //Traz os campos específicos da Prudenmóveis
                empresa['EMPRESAS_CNAE'] = (empresa['FRETEURB'] || '')      + '|' + 
                                        (empresa['FRETESUB'] || '')      + '|' + 
                                        (empresa['TABMONTAGEM'] || '')   + '|' + 
                                        (empresa['MINENTREGAURB'] || '') + '|' + 
                                        (empresa['MINENTREGASUB'] || '') + '|' +
                                        (empresa['ALIQCOM'] || '')       + '|' +
                                        (empresa['ALIQIND'] || '');
            }
                
            await samosFB.update(id, 'EMPRESAS', empresa, params);
            await utils.dblog(params);
            return { results: empresa };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar empresa' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'EMPRESAS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar empresa';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const criarSaldosEDocumentos = async (empresa, params) => {
    const novaEmpresa = empresa['EMPRESAS_ID'];

    try {
        const primeiraEmpresa = await getPrimeiraEmpresa(novaEmpresa, params);
        const saldos = await getSaldos(primeiraEmpresa, params);

        const resultSaldos = await copiarSaldosIntervalo({
            novaEmpresa : novaEmpresa,
            saldos      : saldos,
            indexSaldo  : 0,
            intervalo   : 100,
            params      : params
        });

        const documentos = await getDocumentos(primeiraEmpresa, params);

        const resultDocumentos = await copiarDocumentos({
            novaEmpresa: novaEmpresa,
            documentos : documentos,
            params     : params
        });
        
        if((resultSaldos == 'sucesso') && (resultDocumentos == 'sucesso')){
            console.log(`Saldos e documentos incluídos para nova empresa ${novaEmpresa}`);
        } else {
            throw `Saldos: ${resultSaldos} - Documentos: ${resultDocumentos}`;
        }

    } catch(error){
        console.log(`Erro inclusão de saldos e documentos para a nova empresa ${novaEmpresa} - ${error}`);
    }
};

const getSaldos = async function(primeiraEmpresa, params) {
    const sql = `select SALDOS_ID 
        from SALDOS 
        where SALDOS_ID_EMPRESAS = '${primeiraEmpresa}' 
        order by SALDOS_ID`;
    
    const results = await samosFB.executeSQL(sql, params);
    return (results || []).map(model => model['SALDOS_ID'])
};

const getPrimeiraEmpresa = async function(novaEmpresa, params) {
    const sql = `select distinct SALDOS_ID_EMPRESAS from SALDOS 
        where SALDOS_ID_EMPRESAS <> '${novaEmpresa}'    
        order by SALDOS_ID_EMPRESAS`;
    
    const results = await samosFB.executeSQL(sql, params);
    const empresas = (results || []).map(model => model['SALDOS_ID_EMPRESAS']);
    return empresas[0] || 0;
};

const getDocumentos = async function(primeiraEmpresa, params) {
    const sql = `select DOCUMENTOS_ID 
        from DOCUMENTOS 
        where DOCUMENTOS_ID_EMPRESAS = '${primeiraEmpresa}' 
        order by DOCUMENTOS_ID`;
    
    const results = await samosFB.executeSQL(sql, params);
    return (results || []).map(model => model['DOCUMENTOS_ID']);
};

const copiarSaldosIntervalo = async function(deps) {
    const { saldos, indexSaldo, intervalo } = deps;
    const indexFinal = indexSaldo + intervalo;
    const saldosSelecionados = saldos.slice(indexSaldo, indexFinal);
    
    if(saldosSelecionados.length > 0){
        deps.strIdsSaldos = saldosSelecionados.join(',') + ',0';
    
        await executarInsercaoSaldos(deps);
    
        deps.indexSaldo = indexFinal;
        return copiarSaldosIntervalo(deps);
    } else {
        return 'sucesso';
    }
};

const executarInsercaoSaldos = async function(deps) {
    const { novaEmpresa, strIdsSaldos, params } = deps;
    
    const executeBlock = `execute block as 
        declare variable LISTA_SALDOS varchar(1024);
        declare variable SALDOS_ID_ORIGINAL varchar(10);
        declare variable NOVO_SALDOS_ID        integer;
        declare variable UltimaPosicao integer;
        declare variable ProximaPosicao integer;
        declare variable SALDOS_ID_PRODUTOS    integer;
        declare variable SALDOS_MAXIMO         numeric(12,3);
        declare variable SALDOS_MINIMO         numeric(12,3);
        declare variable SALDOS_COMPRA         numeric(12,2);
        declare variable SALDOS_CUSTO          numeric(12,2);
        declare variable SALDOS_PRECO          numeric(12,2);
        declare variable SALDOS_PRECOMINIMO    numeric(12,2);
        declare variable SALDOS_PRAZO          numeric(12,2);
        declare variable SALDOS_MARGEM         numeric(12,2);
        declare variable SALDOS_MARGEMMINIMA   numeric(12,2);        
        declare variable SALDOS_LOCAL          varchar(15);
        declare variable SALDOS_ESCRITURACAO   char(1);
        declare variable SALDOS_COMISSAO       numeric(6,3);
        declare variable SALDOS_COMISSAOPRAZO  numeric(6,3);        
        declare variable SALDOS_EXCECAO        char(1);
        declare variable SALDOS_IPI            numeric(6,3);
        declare variable SALDOS_ICMSLC         numeric(6,3);
        declare variable SALDOS_ICMS01         numeric(6,3);
        declare variable SALDOS_ICMS02         numeric(6,3);
        declare variable SALDOS_BASELC         numeric(6,3);
        declare variable SALDOS_BASE01         numeric(6,3);
        declare variable SALDOS_BASE02         numeric(6,3);
        declare variable SALDOS_CSTLOCAL       varchar(4);
        declare variable SALDOS_CSTOUTROS      varchar(4);
        declare variable SALDOS_ALIQUOTACFE    numeric(6,3);
        declare variable SALDOS_TRANSFERENCIA  numeric(12, 2);
        declare variable SALDOS_MARKUP         numeric(6, 3);        
        begin
            LISTA_SALDOS   = '${strIdsSaldos}';
            UltimaPosicao  = 1;
            ProximaPosicao = position(',', :LISTA_SALDOS, UltimaPosicao);
            while (:ProximaPosicao > 1) do
            begin
                SALDOS_ID_ORIGINAL = substring(:LISTA_SALDOS from :UltimaPosicao for :ProximaPosicao - :UltimaPosicao);
                UltimaPosicao      = :ProximaPosicao + 1;
                ProximaPosicao     = position(',', :LISTA_SALDOS, UltimaPosicao);
                
                select 
                    SALDOS_ID_PRODUTOS,
                    SALDOS_MAXIMO,
                    SALDOS_MINIMO,
                    SALDOS_COMPRA,
                    SALDOS_CUSTO,
                    SALDOS_PRECO,
                    SALDOS_PRECOMINIMO,
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
                    SALDOS_CSTLOCAL,
                    SALDOS_CSTOUTROS,
                    SALDOS_ALIQUOTACFE,
                    SALDOS_TRANSFERENCIA,
                    SALDOS_MARKUP
                from SALDOS
                where SALDOS_ID = :SALDOS_ID_ORIGINAL
                order by SALDOS_ID
                into
                    :SALDOS_ID_PRODUTOS,
                    :SALDOS_MAXIMO,
                    :SALDOS_MINIMO,
                    :SALDOS_COMPRA,
                    :SALDOS_CUSTO,
                    :SALDOS_PRECO,
                    :SALDOS_PRECOMINIMO,
                    :SALDOS_PRAZO,
                    :SALDOS_MARGEM,
                    :SALDOS_MARGEMMINIMA,
                    :SALDOS_LOCAL,
                    :SALDOS_ESCRITURACAO,
                    :SALDOS_COMISSAO,
                    :SALDOS_COMISSAOPRAZO,
                    :SALDOS_EXCECAO,
                    :SALDOS_IPI,
                    :SALDOS_ICMSLC,
                    :SALDOS_ICMS01,
                    :SALDOS_ICMS02,
                    :SALDOS_BASELC,
                    :SALDOS_BASE01,
                    :SALDOS_BASE02,
                    :SALDOS_CSTLOCAL,
                    :SALDOS_CSTOUTROS,
                    :SALDOS_ALIQUOTACFE,
                    :SALDOS_TRANSFERENCIA,
                    :SALDOS_MARKUP;
                
                NOVO_SALDOS_ID = gen_id(GEN_SALDOS_ID, 1);

                while (
                    exists(
                        select SALDOS_ID from SALDOS
                            where SALDOS_ID = :NOVO_SALDOS_ID
                            order by SALDOS_ID
                    )
                ) do
                    begin
                        NOVO_SALDOS_ID = gen_id(GEN_SALDOS_ID, 1);
                    end
                    
                in autonomous transaction do
                    begin
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
                            SALDOS_PRECO,
                            SALDOS_PRECOMINIMO,
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
                            SALDOS_CSTLOCAL,
                            SALDOS_CSTOUTROS,
                            SALDOS_ALIQUOTACFE,
                            SALDOS_TRANSFERENCIA,
                            SALDOS_MARKUP
                        ) values (
                            :NOVO_SALDOS_ID,
                            '${novaEmpresa}',
                            :SALDOS_ID_PRODUTOS,
                            :SALDOS_MAXIMO,
                            :SALDOS_MINIMO,
                            0,
                            0,
                            0,
                            :SALDOS_COMPRA,
                            :SALDOS_CUSTO,
                            :SALDOS_PRECO,
                            :SALDOS_PRECOMINIMO,
                            :SALDOS_PRAZO,
                            :SALDOS_MARGEM,
                            :SALDOS_MARGEMMINIMA,
                            :SALDOS_LOCAL,
                            :SALDOS_ESCRITURACAO,
                            :SALDOS_COMISSAO,
                            :SALDOS_COMISSAOPRAZO,
                            :SALDOS_EXCECAO,
                            :SALDOS_IPI,
                            :SALDOS_ICMSLC,
                            :SALDOS_ICMS01,
                            :SALDOS_ICMS02,
                            :SALDOS_BASELC,
                            :SALDOS_BASE01,
                            :SALDOS_BASE02,
                            :SALDOS_CSTLOCAL,
                            :SALDOS_CSTOUTROS,
                            :SALDOS_ALIQUOTACFE,
                            :SALDOS_TRANSFERENCIA,
                            :SALDOS_MARKUP
                        );
                    end

                when any do
                    begin
                        exit;
                    end
            end
        end`;

    return await samosFB.executeSQL(executeBlock, params);
};

const copiarDocumentos = async function(deps) {
    const { documentos } = deps;
    
    if(documentos.length > 0){
        deps.strIdsDocumentos = documentos.join(',') + ',0';
    
        return await executarInsercaoDocumentos(deps);
    } else {
        return 'sucesso';
    }
};

const executarInsercaoDocumentos = async function(deps) {
    const { novaEmpresa, strIdsDocumentos, params } = deps;
    const range = (10 ** (3 - novaEmpresa.toString().length) * novaEmpresa).toString();
    
    const executeBlock = `execute block as 
        declare variable LISTA_DOCUMENTOS varchar(1024);
        declare variable DOCUMENTOS_ID_ORIGINAL varchar(10);
        declare variable NOVO_DOCUMENTOS_ID           integer;
        declare variable UltimaPosicao integer;
        declare variable ProximaPosicao integer;
        declare variable DOCUMENTOS_ID                integer;
        declare variable DOCUMENTOS_ID_APLICACOES     integer;
        declare variable DOCUMENTOS_ID_OPERACOES      integer;
        declare variable DOCUMENTOS_ID_PESSOAS        integer;
        declare variable DOCUMENTOS_STATUS            CHAR(1);
        declare variable DOCUMENTOS_NOME              VARCHAR(50);
        declare variable DOCUMENTOS_SERIE             VARCHAR(3);
        declare variable DOCUMENTOS_ALTERAPRECO       CHAR(1);
        declare variable DOCUMENTOS_DESCONTOITEM      CHAR(1);
        declare variable DOCUMENTOS_COLETACARTAO      CHAR(1);
        declare variable DOCUMENTOS_COLETACHEQUE      CHAR(1);
        declare variable DOCUMENTOS_COLETATRANSPORTE  CHAR(1);
        declare variable DOCUMENTOS_COLETAENTREGA     CHAR(1);
        declare variable DOCUMENTOS_LAYOUT            VARCHAR(20);
        declare variable DOCUMENTOS_COLETAOUTRO       CHAR(1);

        begin
            LISTA_DOCUMENTOS = '${strIdsDocumentos}';
            UltimaPosicao  = 1;
            ProximaPosicao = position(',', :LISTA_DOCUMENTOS, UltimaPosicao);
            while (:ProximaPosicao > 1) do
            begin
                DOCUMENTOS_ID_ORIGINAL = substring(:LISTA_DOCUMENTOS from :UltimaPosicao for :ProximaPosicao - :UltimaPosicao);
                UltimaPosicao          = :ProximaPosicao + 1;
                ProximaPosicao         = position(',', :LISTA_DOCUMENTOS, UltimaPosicao);
                
                select 
                    DOCUMENTOS_ID,
                    DOCUMENTOS_ID_APLICACOES,
                    DOCUMENTOS_ID_OPERACOES,
                    DOCUMENTOS_ID_PESSOAS,
                    DOCUMENTOS_STATUS,
                    DOCUMENTOS_NOME,
                    DOCUMENTOS_SERIE,
                    DOCUMENTOS_ALTERAPRECO,
                    DOCUMENTOS_DESCONTOITEM,
                    DOCUMENTOS_COLETACARTAO,
                    DOCUMENTOS_COLETACHEQUE,
                    DOCUMENTOS_COLETATRANSPORTE,
                    DOCUMENTOS_COLETAENTREGA,
                    DOCUMENTOS_LAYOUT,
                    DOCUMENTOS_COLETAOUTRO
                from DOCUMENTOS
                where DOCUMENTOS_ID = :DOCUMENTOS_ID_ORIGINAL
                order by DOCUMENTOS_ID
                into
                    :DOCUMENTOS_ID,
                    :DOCUMENTOS_ID_APLICACOES,
                    :DOCUMENTOS_ID_OPERACOES,
                    :DOCUMENTOS_ID_PESSOAS,
                    :DOCUMENTOS_STATUS,
                    :DOCUMENTOS_NOME,
                    :DOCUMENTOS_SERIE,
                    :DOCUMENTOS_ALTERAPRECO,
                    :DOCUMENTOS_DESCONTOITEM,
                    :DOCUMENTOS_COLETACARTAO,
                    :DOCUMENTOS_COLETACHEQUE,
                    :DOCUMENTOS_COLETATRANSPORTE,
                    :DOCUMENTOS_COLETAENTREGA,
                    :DOCUMENTOS_LAYOUT,
                    :DOCUMENTOS_COLETAOUTRO;
                    
                NOVO_DOCUMENTOS_ID = '${range}' || substring(cast(:DOCUMENTOS_ID as varchar(10)) from 4 for 6); 

                while (
                    exists(
                        select DOCUMENTOS_ID from DOCUMENTOS
                            where DOCUMENTOS_ID = :NOVO_DOCUMENTOS_ID
                            order by DOCUMENTOS_ID
                    )
                ) do
                    begin
                        NOVO_DOCUMENTOS_ID = gen_id(GEN_DOCUMENTOS_ID, 1);
                    end
                    
                in autonomous transaction do
                    begin
                        insert into DOCUMENTOS (
                            DOCUMENTOS_ID, 
                            DOCUMENTOS_ID_EMPRESAS,
                            DOCUMENTOS_ID_APLICACOES,
                            DOCUMENTOS_ID_OPERACOES,
                            DOCUMENTOS_ID_PESSOAS,
                            DOCUMENTOS_STATUS,
                            DOCUMENTOS_NOME,
                            DOCUMENTOS_ULTIMO,
                            DOCUMENTOS_SERIE,
                            DOCUMENTOS_ALTERAPRECO,
                            DOCUMENTOS_DESCONTOITEM,
                            DOCUMENTOS_COLETACARTAO,
                            DOCUMENTOS_COLETACHEQUE,
                            DOCUMENTOS_COLETATRANSPORTE,
                            DOCUMENTOS_COLETAENTREGA,
                            DOCUMENTOS_LAYOUT,
                            DOCUMENTOS_COLETAOUTRO
                        ) values (
                            :NOVO_DOCUMENTOS_ID,
                            '${novaEmpresa}',
                            :DOCUMENTOS_ID_APLICACOES,
                            :DOCUMENTOS_ID_OPERACOES,
                            :DOCUMENTOS_ID_PESSOAS,
                            :DOCUMENTOS_STATUS,
                            :DOCUMENTOS_NOME,
                            0,
                            :DOCUMENTOS_SERIE,
                            :DOCUMENTOS_ALTERAPRECO,
                            :DOCUMENTOS_DESCONTOITEM,
                            :DOCUMENTOS_COLETACARTAO,
                            :DOCUMENTOS_COLETACHEQUE,
                            :DOCUMENTOS_COLETATRANSPORTE,
                            :DOCUMENTOS_COLETAENTREGA,
                            :DOCUMENTOS_LAYOUT,
                            :DOCUMENTOS_COLETAOUTRO
                        );
                    end

                when any do
                    begin
                        exit;
                    end
            end
        end`;
    
    return await samosFB.executeSQL(executeBlock, params);
};