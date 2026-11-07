'use strict';

const mkdirp  = require('mkdirp');
const fs      = require('fs');
const crypto  = require('crypto');
const axios   = require('axios');

module.exports = {  
    read: async (params, req) => {
        const dataInvalida = new Date(0).getTime();

        try {
            const { cnpj, tipo } = params;
            const cnpjSemPontos = (cnpj || '').replace(/[^0-9]/g, '');
            const now = new Date().getTime();

            if(tipo == 'local') {
                let licenca;
    
                try {
                    licenca = fs.readFileSync(`licencas/${cnpjSemPontos}.key`).toString();
                } catch(e){
                    throw 'Nao encontrado arquivo de licenca';
                }
    
                if(licenca){
                    const chaveDescriptografada = await descriptografar(licenca);
        
                    if(chaveDescriptografada && chaveDescriptografada.slice){
                        const dataLimite = new Date((chaveDescriptografada || '').slice(0, 10)).getTime() + 10800000; //soma tres horas de fuso
                        const ultimaChecagem = new Date((chaveDescriptografada || '').slice(10, 20)).getTime() + 10800000; //soma tres horas de fuso

                        return {
                            results: [{ 
                                expires: dataLimite, 
                                checked: ultimaChecagem
                            }]
                        }
                    }
                }

                throw 'Licenca corrompida';

            } else if(tipo == 'remoto') {
                /*const queryLicencaRemota = await api.pessoas().read({
                    conteudo: cnpj,
                    ordem: 4,
                    client: params.client
                });*/

                const queryLicencaRemota = await axios({
                    url: 'https://automacao.samosweb.com.br/pessoas',
                    method: 'GET',
                    timeout: 5000,//5 segundos
                    headers: {
                        'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
                    },
                    params: {
                        conteudo: cnpj,
                        ordem: 4
                    }
                });

                const datafinal = queryLicencaRemota.data.results[0]['PESSOAS_VALIDADE'] + 'T04:00:00';

                if(!datafinal || !cnpjSemPontos) {
                    throw 'Sem data ou cnpj';
                }
                
                return {
                    results: [{ 
                        expires: new Date(datafinal).getTime(),
                        now: now,
                        dataexpires: new Date(datafinal).toISOString().slice(0,10),
                        datanow: new Date().toISOString().slice(0,10)
                    }]
                }
            }
            
            throw 'Parametro "tipo" faltando';
        } catch(error) {
            const msg = 'Falha ao checar licença';
            console.log(msg);
            console.log(error);

            throw {
                results: [{ 
                    expires: dataInvalida, 
                    checked: dataInvalida
                }]
            }
        }
    },

    create: async (data, params) => {
        try {
            const { datafinal, cnpj } = params;
            const cnpjSemPontos = (cnpj || '').replace(/[^0-9]/g, '');
            const ultimaChecagem = new Date().toISOString().slice(0, 10);

            if(!datafinal || !cnpjSemPontos) {
                throw 'Faltando parametros'
            }
            
            const chaveCriptografada = await criptografar(datafinal + ultimaChecagem + cnpjSemPontos);
            
            if (!fs.existsSync('licencas/')){
                await mkdirp('licencas/');
            }
            
            fs.writeFileSync(`licencas/${cnpjSemPontos}.key`, chaveCriptografada);

            return {
                results: [{ msg: 'Sucesso' }]
            }
        } catch(error) {
            const msg = 'Falha ao criar arquivo de licença';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const criptografar = function(chave) {
    return new Promise(async (resolve, reject) => {
        const key = crypto.scryptSync('87E28nbQhn', 'salt', 24);
        const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
        let encrypted = '';

        cipher.on('readable', () => {
            let chunk;
            while (null !== (chunk = cipher.read())) {
                encrypted += chunk.toString('hex');
            }
        });

        cipher.on('end', () => resolve(encrypted));

        cipher.write(chave);
        cipher.end();
    });
};

const descriptografar = function(chave) {
    return new Promise(async (resolve, reject) => {
        try{
            const key = crypto.scryptSync('87E28nbQhn', 'salt', 24);
            const iv = Buffer.alloc(16, 0);
            const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
            let decrypted = '';
    
            decipher.on('readable', () => {
                let chunk;
                while (null !== (chunk = decipher.read())) {
                    decrypted += chunk.toString('utf8');
                }
            });
    
            decipher.on('end', () => resolve(decrypted));
    
            decipher.write(chave, 'hex');
            decipher.end();
        } catch(error) {
            console.error(error);
        }
    });
};