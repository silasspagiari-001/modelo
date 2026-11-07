'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFirebird');
const axios   = require('axios');
const login = 'AUTOMACAO';
const senha = '3715';

module.exports = {
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            const numeros = data.numeros;
            const msg     = data.msg;

            try {
                if(!numeros || !msg){
                    throw { message: 'Informe o número e a mensagem' };
                }

                if(msg.length > 160){
                    throw { message: 'Limite msg 160 caracteres' };
                }

                //deixa no padrão (99) 9 9999-9999 (mas apenas numeros)
                //allcance nao aceita DDI e nem envio para outros países
                const numerosNormalizados = (numeros || '')
                    .split(',')
                    .map(numero => {
                        numero = numero.replace(/[^0-9]/ig, '');
                        if(numero.length == 8){
                            return '189' + numero;
                        } else if(numero.length == 9){
                            return '18' + numero;
                        } else if(numero.length == 10){
                            return numero.slice(0,2) + '9' + numero.slice(2,10);
                        } else if(numero.length > 11){
                            return numero.slice(-11);
                        } else {
                            return numero;
                        }
                    })
                    .join(',');

                
                /**
                 * http://www.grupoallcance.com.br/financeiro/Visao/loginCliente.php
                 * login: idot
                 * senha: 0937
                 * API: http://corporativo.allcancesms.com.br/app/modulo/usuario/sms/api.php
                 */

                const res = await axios({
                    url: `http://corporativo.allcancesms.com.br/app/modulo/api/index.php?action=sendsms&lgn=${login}&pwd=${senha}&msg=${msg}&numbers=${numerosNormalizados}`,
                    method: 'GET'
                });

                if(res.data['status'] == 1) {
                    samosFB.enviarRespostaSucesso(null, [res.data], 0, resolve);
                    utils.dblog(`Envio de SMS`, params);
                } else {
                    throw { message: 'Falha ao enviar sms' }
                }

            } catch(error) {
                samosFB.enviarRespostaErro('Falha ao enviar sms', null, error, reject);
            }
        });
    }
};