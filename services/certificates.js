'use strict'; 

const axios   = require('axios');
const fs      = require('fs');
const mkdirp  = require('mkdirp');
const path    = require('path');
const os      = require('os');
const moment  = require('moment-timezone');
const appRoot = path.dirname(require.main.filename);

const node_openssl = require('node-openssl-cert');

const openssl = new node_openssl(
    os.platform().match(/linux|darwin/) ? 
    undefined : {
        binpath: 'C:/Program Files/OpenSSL-Win64/bin/openssl.exe'
    }
);

module.exports = {
    create: async (req, res, next) => {
        try {
            const { dominio, diretorio, access_key, id_cert_old ,access_key_old } = req.body;

            const privateKey = await createPrivateKey();
            const csr        = await createCSR(privateKey, req.body);

            await tentarApagarExistente(id_cert_old, access_key_old);

            const certificado = await criarRascunho(access_key, dominio, csr);
            
            if(certificado.success == false) {
                throw certificado;
            }

            criarArquivoVerificacao(certificado, dominio);
            await solicitarVerificacao(certificado.id, access_key);
            await checarStatus(certificado.id, access_key);
            await salvarCertificado(certificado.id, access_key, dominio, privateKey, diretorio);

            res.json(certificado);
        } catch (error) {
            console.log(error);
            res.status(400).json(error ? (error.stack || error.message || error) : "Erro");
        }
    },

    update: async (req, res, next) => {
        try {
            const { caminhoRelativo, nomeArquivo, content } = req.query;

            const caminhoCompleto = `${appRoot}${caminhoRelativo}`;

            if (!fs.existsSync(caminhoCompleto)){
                await mkdirp(caminhoCompleto);
            }
        
            fs.writeFileSync(`${caminhoCompleto}/${nomeArquivo}`, content);

        } catch (error) {
            console.log(error);
            res.status(400).json(error ? (error.stack || error.message || error) : "Erro");
        }
    }
};

const tentarApagarExistente = async function(id, access_key){
    if(!id) return
    //primeiro revoga, depois apaga
    try {
        await axios({
            url: `http://api.zerossl.com/certificates/${id}/revoke`,
            method: 'POST',
            params: { access_key }
        });
    } catch(error) {
        console.log(error);
    }

    try {
        await axios({
            url: `http://api.zerossl.com/certificates/${id}`,
            method: 'DELETE',
            params: { access_key }
        });
    } catch(error) {
        console.log(error);
    }
};

const criarRascunho = async function(access_key, dominio, csr) {
    const certificateResponse = await axios({
        url: 'http://api.zerossl.com/certificates',
        method: 'POST',
        params: { access_key },
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        data: require('querystring').stringify({
            certificate_domains      : dominio,
            certificate_validity_days: 90,
            certificate_csr          : csr
        })
    });

    return certificateResponse.data;
};

const criarArquivoVerificacao = async function(rascunhoCertificado, dominio){
    const validation = {
        url    : rascunhoCertificado.validation.other_methods[dominio].file_validation_url_http,
        content: rascunhoCertificado.validation.other_methods[dominio].file_validation_content
    };

    const nomeArquivo     = validation.url.split(dominio)[1].split('/').pop();
    const caminhoRelativo = validation.url.split(dominio)[1].split('/').slice(0, -1).join('/');
    const caminhoCompleto = `${appRoot}${caminhoRelativo}`;
    
    if (!fs.existsSync(caminhoCompleto)){
        await mkdirp(caminhoCompleto);
    }

    fs.writeFileSync(`${caminhoCompleto}/${nomeArquivo}`, validation.content.join('\n'));
};

const solicitarVerificacao = async function(id, access_key) {
    /*const certificadoVerificadoResponse = await request({
        url: `http://api.zerossl.com/certificates/${id}/challenges`,
        method: 'POST',
        qs: { access_key },
        formData: {
            validation_method : 'HTTP_CSR_HASH'
        }
    });*/

    const certificadoVerificadoResponse = await axios({
        url: `http://api.zerossl.com/certificates/${id}/challenges`,
        method: 'POST',
        params: { access_key },
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        data: require('querystring').stringify({
            validation_method : 'HTTP_CSR_HASH'
        })
    });

    const certificadoVerificado = certificadoVerificadoResponse.data;

    if(certificadoVerificado.status == 'pending_validation') {
        return;
    } else {
        return new Promise(resolve => {
            setTimeout(async () => resolve(await solicitarVerificacao(id, access_key)), 2000);
        });
    }
};

const checarStatus = async function(id, access_key) {
    const certificateStatusResponse = await axios({
        url: `http://api.zerossl.com/certificates/${id}/status`,
        method: 'GET',
        params: { access_key }
    });

    const certificateStatus = certificateStatusResponse.data;
    
    if(certificateStatus.validation_completed == 1 && !certificateStatus.details) {
        return;
    } else {
        return new Promise((resolve, reject) => {
            setTimeout(async () => resolve(await checarStatus(id, access_key)), 2000);
        });
    }
};

const salvarCertificado = async function(id, access_key, dominio, privateKey, diretorio){
    const certificadoResponse = await axios({
        url: `http://api.zerossl.com/certificates/${id}/download/return`,
        method: 'GET',
        params: { access_key }
    });

    const certificado = certificadoResponse.data;

    if (!fs.existsSync(diretorio)){
        await mkdirp(diretorio);
    }

    fs.writeFileSync(`${diretorio}${dominio}.crt`, `${certificado['certificate.crt']}\n${certificado['ca_bundle.crt']}`);
    fs.writeFileSync(`${diretorio}${dominio}.key`, privateKey);
    fs.writeFileSync(`${diretorio}${dominio}.json`, JSON.stringify({ 
        idCertificado: id, 
        chaveApi: access_key,
        vencimento: moment().add(90, 'days').format('DD/MM/YYYY')
    }));

    return;
};

const createPrivateKey = async function() {
    return new Promise((resolve, reject) => {
        openssl.generateRSAPrivateKey({}, function(error, key, cmd) {
            if(error) {
                reject(error);
            } else {
                resolve(key);
            }
        });
    });
};

const createCSR = async function(key, data) {
    return new Promise((resolve, reject) => {
        openssl.generateCSR({
            hash: 'sha512',
            subject: {
                countryName           : data['pais'],
                stateOrProvinceName   : data['estado'],
                localityName          : data['cidade'],
                postalCode            : data['cep'],
                streetAddress         : data['rua'],
                organizationName      : data['dominio'],
                organizationalUnitName: data['dominio'],
                emailAddress          : data['email'],
                commonName            : data['dominio']
            },
            extensions: {
                basicConstraints: {
                    critical: true,
                    CA: true,
                    pathlen: 1
                },
                keyUsage: {
                    usages: [
                        'digitalSignature',
                        'keyEncipherment'
                    ]
                },
                extendedKeyUsage: {
                    critical: true,
                    usages: [
                        'serverAuth',
                        'clientAuth'
                    ]	
                }
            }
        }, 
        key, 
        'test', 
        function(error, csr, cmd) {
            if(error) {
                reject(error)
            } else {
                resolve(csr);
            }
        });
    });
};