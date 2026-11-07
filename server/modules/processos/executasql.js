'use strict';

const samosFB = require('../../services/samosFB');

const sqls = {
    verifica_valorrestante: function(idMovimento){
        return `
            select coalesce(
                MOVIMENTOSCAIXA_DINHEIRO +
                MOVIMENTOSCAIXA_CHEQUE +
                MOVIMENTOSCAIXA_CREDITO +
                MOVIMENTOSCAIXA_DEBITO +
                MOVIMENTOSCAIXA_CREDITOLOJA +
                MOVIMENTOSCAIXA_CREDITOPESSOA +
                MOVIMENTOSCAIXA_ALIMENTACAO +
                MOVIMENTOSCAIXA_REFEICAO +
                MOVIMENTOSCAIXA_PRESENTE +
                MOVIMENTOSCAIXA_COMBUSTIVEL +
                MOVIMENTOSCAIXA_DUPLICATA +
                MOVIMENTOSCAIXA_TRANSFERENCIAS +
                MOVIMENTOSCAIXA_BOLETO +
                MOVIMENTOSCAIXA_OUTRO -
                MOVIMENTOSCAIXA_TROCO 
            ,0) as VALORRESTANTE
        from MOVIMENTOSCAIXA
        where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${ idMovimento }
        `    
    },

    verifica_valorrestante_ordem: function(idOrdem){
        return `
            select coalesce(
                MOVIMENTOSCAIXA_DINHEIRO +
                MOVIMENTOSCAIXA_CHEQUE +
                MOVIMENTOSCAIXA_CREDITO +
                MOVIMENTOSCAIXA_DEBITO +
                MOVIMENTOSCAIXA_CREDITOLOJA +
                MOVIMENTOSCAIXA_CREDITOPESSOA +
                MOVIMENTOSCAIXA_ALIMENTACAO +
                MOVIMENTOSCAIXA_REFEICAO +
                MOVIMENTOSCAIXA_PRESENTE +
                MOVIMENTOSCAIXA_COMBUSTIVEL +
                MOVIMENTOSCAIXA_DUPLICATA +
                MOVIMENTOSCAIXA_TRANSFERENCIAS +
                MOVIMENTOSCAIXA_BOLETO +
                MOVIMENTOSCAIXA_OUTRO -
                MOVIMENTOSCAIXA_TROCO 
            ,0) as VALORRESTANTE
        from MOVIMENTOSCAIXA
        where MOVIMENTOSCAIXA_ID_ORDENS = ${ idOrdem }
        `    
    },

    atualiza_financeiromovimento: function(idMovimento){
        return `
            select 
                FINANCEIROS.*,
                PORTADORES_NOME, 
                PESSOAS_NOME, 
                PESSOAS_TIPO,
                (FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
            from FINANCEIROS 
            left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
            left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
            where FINANCEIROS_ID_MOVIMENTOS = ${idMovimento}
            `    
    },

    obterdadostabela: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( parametros.match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        let sqlWhere = '';
        let sqlOrder = '';

        if( parametros.busca[0] == '.' || parametros.busca > 0 ){
            sqlWhere = ` ${ String(parametros.tabela).toUpperCase() }_ID = ${ String(parametros.busca || '').replace('.', '') }  `;
            sqlOrder = ` order by ${ String(parametros.tabela).toUpperCase() }_ID `;

        }else{
            sqlWhere = ` ${ String(parametros.tabela).toUpperCase() }_NOME like '%${ parametros.busca }%'  `;
            sqlOrder = ` order by ${ String(parametros.tabela).toUpperCase() }_NOME `;
        }

        return `
            select *
            from ${ String(parametros.tabela).toUpperCase() } 

            ${ parametros.tabela == 'pessoas' ? ' join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES ' : ' ' }

            where ${ sqlWhere }
            `    
    },

    obtercampostabela: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( parametros.match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        let sqlWhere = '';
        let sqlOrder = '';

        if( parametros.busca[0] == '.' || parametros.busca > 0 ){
            sqlWhere = ` ${ String(parametros.tabela).toUpperCase() }_ID = ${ parametros.busca.replace('.', '') }  `;
            sqlOrder = ` order by ${ String(parametros.tabela).toUpperCase() }_ID `;

        }else{
            sqlWhere = ` ${ String(parametros.tabela).toUpperCase() }_NOME like '%${ parametros.busca }%'  `;
            sqlOrder = ` order by ${ String(parametros.tabela).toUpperCase() }_NOME `;
        }

        return `
            select ${ parametros.fields.join(',') }
            from ${ String(parametros.tabela).toUpperCase() } 

            ${ parametros.tabela == 'pessoas' ? ' join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES ' : ' ' }

            where ${ sqlWhere }
            `    
    },

    getpessoafrommovimentos: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        let sqlWhere = '';
        let sqlOrder = '';

        sqlWhere = ` MOVIMENTOS_ID = ${ String(parametros.busca).replace('.', '') }  `;
        sqlOrder = ` order by MOVIMENTOS_ID `;

        return `
            select MOVIMENTOS.*,
                   PESSOAS_NOME,
                   PESSOAS_ID_CIDADES,
                   CIDADES_NOME,
                   CIDADES_ESTADO
            from MOVIMENTOS 
            join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
            join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
            where ${ sqlWhere }
            `  
    },

    getcustomedioproduto: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select SALDOS.*
            from SALDOS
            where SALDOS_ID_PRODUTOS = '${ String(parametros.busca).replace('.', '') }'
        `
    },

    vincular_documento_notaeletronica_aposcriar: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            update MOVIMENTOSENVIO set MOVIMENTOSENVIO_REFERENTE = '${ parametros.codigo }'
            where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${String(parametros.id).replace('.', '')}
        `
    },

    trocarorigem_pedido: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            update MOVIMENTOS set MOVIMENTOS_ID_EMPRESAORIGEM = ${ parametros.empresaOrigem },
                                  MOVIMENTOS_NUMEROORIGEM = ${ parametros.numeroOrigem },
                                  MOVIMENTOS_SERIEORIGEM = '${ parametros.serieOrigem }'
            where MOVIMENTOS_ID = ${String(parametros.id).replace('.', '')}
        `
    },

    trocaroperacao_pedido: function(parametros){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            update MOVIMENTOS set MOVIMENTOS_ID_OPERACOES = ${ parametros.idOperacao }
            where MOVIMENTOS_ID = ${String(parametros.id).replace('.', '')}
        `
    },

    //Adiciona uma baixa diretamente na tabela CREDITOS, passando um model em JSON
    adicionar_baixa: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        //Usa o insert do samosFB
        await samosFB.insert('CREDITOS', parametros.model, params);

       //Retorna todas as baixas do movimento atual, ou seja, a lista atualiza apos a inserção
        return `
            select * from CREDITOS
            where CREDITOS_ID_MOVIMENTOS = ${parametros.model['CREDITOS_ID_MOVIMENTOS']} and
                  CREDITOS_TIPO = 'B'
        `
    },

    read_manifestositens: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        //Retorna todas as baixas do movimento atual, ou seja, a lista atualiza apos a inserção
        return `
           select * from manifestositens
        `
    },

    pesquisar_NFE_dentro_algum_manifesto: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select * from MANIFESTOSITENS
            join MANIFESTOS on MANIFESTOS_ID = MANIFESTOSITENS_ID_MANIFESTOS
            where MANIFESTOS_ID_EMPRESAS = ${parametros.EMPRESA} and
                  MANIFESTOSITENS_NUMERO = '${parametros.NFE}' and
                  MANIFESTOSITENS_SERIE = 'NE'
        `
    },

    ler_protocolo_NFE_porNumero: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select MOVIMENTOS_ID, 
                   MOVIMENTOS_NUMERO, 
                   MOVIMENTOS_PROTOCOLO, 
                   MOVIMENTOS_STATUS 
            from MOVIMENTOS
            where MOVIMENTOS_ID_EMPRESAS = ${parametros.EMPRESA} and
                  MOVIMENTOS_NUMERO = ${parametros.NFE} and
                  MOVIMENTOS_SERIE = 'NE'
                  
        `
    },

    mascaraaplicacaoexiste: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select APLICACOES_ID 
            from APLICACOES
            where APLICACOES_MASCARA = '${parametros.mascara}'      
        `
    },

    getordemservicoorigem: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select ORDENS_ID, ORDENS_ID_PESSOAS
            from ORDENS
            where ORDENS_ID_EMPRESAS = ${parametros.empresa} and
                ORDENS_NUMERO = ${parametros.numero} and
                ORDENS_SERIE = '${parametros.serie}'    
        `
    },

    getmovimentoorigem: async function(parametros, params){
        //Se for um JSON em forma de string, transforma em JSON
        if( String(parametros).match(/}|{/) ){
            parametros = JSON.parse( parametros );
        }

        return `
            select MOVIMENTOS_ID, 
                   MOVIMENTOS_ID_DOCUMENTOS,
                   MOVIMENTOS_ID_PROPRIEDADES,
                   MOVIMENTOS_ID_PESSOAS,
                   DOCUMENTOS_ID_PESSOAS
            from MOVIMENTOS
            join DOCUMENTOS on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            where MOVIMENTOS_ID_EMPRESAS = ${parametros.empresa} and
                  MOVIMENTOS_NUMERO = ${parametros.numero} and
                  MOVIMENTOS_SERIE = '${parametros.serie}'      
        `
    }
}

module.exports = {
    read: async params => {
        try {
            const { nomeSql, parametroSql } = params;

            const sqlMontado = await sqls[nomeSql](parametroSql, params); 

            const results = await samosFB.executeSQL(sqlMontado, params);
            const total = results ? results.length : null;

            return { results, total };
                
        } catch(error) {
            const msg = 'Falha ao executar sql personalizado (processos/executasql)';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};