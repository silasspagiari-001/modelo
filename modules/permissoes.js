'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');

module.exports = {  
    read: async params => {
        try {
            const { pessoa, empresa } = params;

            const sqlSearchLogin = `select 
                PERMISSOES.*, 
                EMPRESAS.*,
                PORTADORES_NOME, 
                PORTADORES_LAYOUT,
                BANCOS_NOME,
                (BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
                CIDADES_NOME, 
                CIDADES_ESTADO,
                USUARIOS_ID, 
                USUARIOS_ID_EMPRESAS, 
                USUARIOS_LOGIN, 
                USUARIOS_CPFCNPJ,
                USUARIOS_NOME, 
                USUARIOS_PRIVILEGIADO, 
                USUARIOS_TIPO, 
                USUARIOS_NOVASENHA, 
                USUARIOS_TEMPO,
                USUARIOS_ULTIMOLOG,
                USUARIOS_CELULAR,
                PERMISSOES_ITENS
            from PERMISSOES
            left outer join EMPRESAS   on EMPRESAS_ID    = PERMISSOES_ID_EMPRESAS
            left outer join PORTADORES on PORTADORES_ID  = EMPRESAS_ID_PORTADORES
            left outer join BANCOS     on BANCOS_ID      = PORTADORES_ID_BANCOS
            left outer join CIDADES    on CIDADES_ID     = EMPRESAS_ID_CIDADES
            left outer join USUARIOS   on USUARIOS_ID    = PERMISSOES_ID_USUARIOS
            where PERMISSOES_ID_USUARIOS = ${pessoa} and EMPRESAS_STATUS = 'T'
            order by PERMISSOES_ID_EMPRESAS`;

            const sqlSearchCrud = `select * from PERMISSOES
                where PERMISSOES_ID_USUARIOS = ${pessoa}
                and PERMISSOES_ID_EMPRESAS = ${empresa}`;

            const sqlFinal = empresa ? sqlSearchCrud : sqlSearchLogin;

            return { 
                results: await samosFB.executeSQL(sqlFinal, params)
            };
        
        } catch(error) {
            const msg = 'Falha ao buscar permissões';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (idParametros, params) => {
        try {
            console.log(idParametros);
            const ids = idParametros.toString().split('|');
            const idUsuario = ids[0];
            const idEmpresa = ids[1];

            const sqlSearch = `select 
            PERMISSOES.*, 
            EMPRESAS.*,
            PORTADORES_NOME, 
            BANCOS_NOME,
            (BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
            CIDADES_NOME, 
            CIDADES_ESTADO,
            USUARIOS_ID, 
            USUARIOS_ID_EMPRESAS, 
            USUARIOS_LOGIN, 
            USUARIOS_CPFCNPJ,
            USUARIOS_NOME, 
            USUARIOS_PRIVILEGIADO, 
            USUARIOS_TIPO, 
            USUARIOS_NOVASENHA, 
            USUARIOS_TEMPO,
            USUARIOS_ULTIMOLOG,
            PERMISSOES_ITENS
        from PERMISSOES
        left outer join EMPRESAS   on EMPRESAS_ID    = PERMISSOES_ID_EMPRESAS
        left outer join PORTADORES on PORTADORES_ID  = EMPRESAS_ID_PORTADORES
        left outer join BANCOS     on BANCOS_ID      = PORTADORES_ID_BANCOS
        left outer join CIDADES    on CIDADES_ID     = EMPRESAS_ID_CIDADES
        left outer join USUARIOS   on USUARIOS_ID    = PERMISSOES_ID_USUARIOS
        where PERMISSOES_ID_USUARIOS = ${idUsuario} 
        and PERMISSOES_ID_EMPRESAS = ${idEmpresa}`;

            const results = await samosFB.executeSQL(sqlSearch, params);

            return { results: results };
        } catch(error) {
            const msg = 'Falha ao buscar permissao pelo id do usuario';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (permissao, params) => {
        try {
            return { 
                results: await samosFB.insert('PERMISSOES', permissao, params)
            };

        } catch(error) {
            const msg = 'Falha ao criar permissão';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, permissao, params) => {
        try {
            const items = JSON.stringify(permissao['PERMISSOES_ITENS'])
                .replace(/\\"/ig, '"')
                .replace(/"expanded":true,/ig, '')
                .slice(1, -1);

            const sqlUpdate = `update PERMISSOES 
                               set    PERMISSOES_ITENS = ?,
                                      PERMISSOES_ID    = ${id} 
                               where  PERMISSOES_ID    = ${id}`;
            
            await samosFB.executeSQL(sqlUpdate, [items], params);

            await utils.dblog(params);  

            return { results: [permissao] };

        } catch(error) {
            const msg = 'Falha ao alterar a permissão';
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'PERMISSOES', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar permissão';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
