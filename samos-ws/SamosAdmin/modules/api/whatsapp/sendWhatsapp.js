'use strict';

const samosFB = require('../../../services/samosFB');
const axios   = require('axios');

module.exports = {
    read: async (params) => {
        return new Promise(async (resolve, reject) => {

            const { origem, destino, mensagem, acesso } = params;

            try {

                const res = await axios({
                    url: `https://api.zenvia.com/v2/channels/whatsapp/messages`,
                    method: 'POST',
                    timeout: 1000,
                    headers: {
                        'X-API-TOKEN': acesso                            
                    },
                    data: {
                        from: origem,
                        to: destino,
                        contents: [{
                        type: 'text',
                        text: mensagem,
                        }],
                    }              
                });

                if(res.status == 200) {
                    samosFB.enviarRespostaSucesso(null, [res.data], 0, resolve);
                    utils.dblog(`Envio de mensagem WhatsApp`, params);
                } else {
                    throw { message: 'Falha ao enviar mensagem WhatsApp' }
                }

            } catch(error) {
                samosFB.enviarRespostaErro('Falha ao enviar WhatsApp', null, error, reject);
            }
        });
    }                       
}
    
    
