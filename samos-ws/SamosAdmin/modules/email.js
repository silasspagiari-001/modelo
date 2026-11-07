'use strict';

const fs         = require('fs');
const nodemailer = require('nodemailer');
const samosFB    = require('../services/samosFirebird');
const utils      = require('../services/samosUtils');
const api        = require('../modules');
const path       = require('path');
const appRoot    = path.dirname(require.main.filename);

module.exports = {
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { empresa, anexos, tema } = data;

                const email   = typeof data.email == 'object' ? data.email : (data.email  || '').replace(/;/ig, ',');
                const cc      = typeof data.cc    == 'object' ? data.cc    : (data.cc     || '').replace(/;/ig, ',');
                const bcc     = typeof data.bcc   == 'object' ? data.bcc   : (data.bcc    || '').replace(/;/ig, ',');
                const assunto = data.assunto || 'Sistema Samos';
                const html    = data.html    || 'Email enviado por Sistema Samos';

                let dataEmpresa = {};
                let pathLogo = `${appRoot}/resources/images/nfe/default.png`;

                if(empresa) {
                    const queryEmpresa = await api.empresas().read({
                        conteudo: '.' + empresa,
                        client: params.client
                    });
                    
                    dataEmpresa = queryEmpresa.results[0] || {};

                    try {
                        pathLogo = utils.client.getImagePath(`logos/nfe/${dataEmpresa['EMPRESAS_CPFCNPJ']}.png`, params);
                    } catch(error) {
                        pathLogo = `${appRoot}/resources/images/nfe/default.png`;
                    }
                }

                const empresaLogin  = dataEmpresa['EMPRESAS_LOGIN'];
                const empresaEmail  = dataEmpresa['EMPRESAS_EMAIL'];
                const empresaSenha  = dataEmpresa['EMPRESAS_PASSWORD'];
                const empresaSMTP   = dataEmpresa['EMPRESAS_SMTP'];
                const empresaNome   = dataEmpresa['EMPRESAS_FANTASIA'];

                //se o email da empresa for do mesmo dominio do SMTP, envia dele, senão envia do SMTP
                const dominioSMTP   = (empresaLogin || '').split('@')[1];
                const enderecoEnvio = empresaEmail.indexOf(dominioSMTP) != -1 ? empresaEmail : empresaLogin;

                let transporter;

                if(empresaLogin.match(/samosweb/)) {
                    transporter = nodemailer.createTransport({
                        host   : empresaSMTP,
                        port   : 587,
                        secure : false, // true for 465, false for other ports
                        tls: {
                            cert: fs.readFileSync(`${appRoot}/certs/sslemail.crt`),
                            key: fs.readFileSync(`${appRoot}/certs/sslemail.key`),
                            rejectUnauthorized: false
                        },
                        auth   : {
                            user: empresaLogin,
                            pass: empresaSenha
                        }
                    });
                } else { // Dominios proprios
                    transporter = nodemailer.createTransport({
                        host   : empresaSMTP,
                        port   : 465,
                        secure : true, // true for 465, false for other ports
                        auth   : {
                            user: empresaLogin,
                            pass: empresaSenha
                        }
                    });
                }

                const mailOptions = {
                    from: {
                        name:    empresaNome,
                        address: enderecoEnvio
                    },
                    subject:     assunto,
                    html:        html,
                    attachments: []
                };

                if(email) {
                    mailOptions.to = email;
                }

                if(cc) {
                    mailOptions.cc  = cc;
                }

                if(bcc) {
                    mailOptions.bcc = bcc;
                }
                
                if(html.match(/BACKGROUND_URL/)){
                    mailOptions.attachments.push({
                        filename: 'fundoemail.png',
                        path: `${appRoot}/resources/images/fundoemail/${tema || 'basic'}.png`,
                        cid: 'BACKGROUND_URL'
                    })
                }

                if(html.match(/LOGO_URL/)){
                    mailOptions.attachments.push({
                        filename: (pathLogo || '').split('/').pop(),
                        path: pathLogo,
                        cid: 'LOGO_URL'
                    })
                }

                if(anexos && anexos.length > 0){
                    const listaAnexos = anexos.map(anexo => {
                        return {
                            filename: (anexo || '').split('/').pop(),
                            path: anexo
                        }
                    });

                    mailOptions.attachments = mailOptions.attachments.concat(listaAnexos);
                }

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        samosFB.enviarRespostaErro('Falha ao enviar email', null, { error, info }, reject);
                        console.log(error);                        
                    } else {
                        samosFB.enviarRespostaSucesso(null, [info], 0, resolve);
                    }
                });
            } catch(error) {
                console.log(error);
                samosFB.enviarRespostaErro('Falha ao enviar email', null, error, reject);
            }
        });
    }
};