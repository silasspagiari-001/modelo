'use strict';

const samosFB = require('../../../services/samosFB');

module.exports = {
    update: async (login, data, params) => {
        try {
            const queryUsuario = await samosFB.executeSQL(`
                select USUARIOS_SENHA 
                from USUARIOS 
                where USUARIOS_LOGIN = '${login}'`, params);
            
            if(!queryUsuario[0]) {
                throw 'Usuário não encontrado';
            }

            if(data['novaSenha'] == queryUsuario[0]['USUARIOS_SENHA']) {
                throw 'A senha deve ser diferente da anterior';
            }

            if(data['novaSenha'].length < 8) {
                throw 'A senha deve ter pelo menos 8 caracteres';
            }

            if(!data['novaSenha'].match(/[0-9]/)) {
                throw 'A senha deve ter pelo menos um número';
            }

            if(!data['novaSenha'].match(/[A-Za-z]/)) {
                throw 'A senha deve ter pelo menos uma letra';
            }

            if(!data['novaSenha'].match(/[^0-9A-Z]/)) {
                throw 'A senha deve ter pelo menos um caractere especial';
            }

            const sql = `update USUARIOS set
                USUARIOS_SENHA = '${data['novaSenha']}',
                USUARIOS_NOVASENHA = 'F'
            where USUARIOS_LOGIN = '${login}'`;

            await samosFB.executeSQL(sql, params);

            return {
                results: 'Senha alterada com sucesso',
                total: 0
            }
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar senha' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
