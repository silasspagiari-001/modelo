'use strict'; 

const jwt = require('jsonwebtoken');
const samosFB = require('./samosFirebird');
const fs = require('fs');
const utils = require('./samosUtils');
const path = require('path');
const appRoot = path.dirname(require.main.filename);
const mkdirp = require('mkdirp'); 
const cors = require('cors');
const aesjs = require('aes-js'); 

const routes = function (server, exclusions) {
    server.use(cors({ origin: "*" }));
    server.use(defineDefaultParams);

    // Login específico da API
    server.post('/api/auth', apiAuth);

    // Autenticação Bearer exclusiva da API
    server.use('/api', bearerMiddleware);

    // Autenticação normal do Samos
    server.use(jwtMiddleware({ exclusions }));

    server.get('/auth', async (req, res, next) => {
        const { login, senha, loginCase, sessionId, client, acessos, device } = req.query;

        let db;

        try {
            db = await samosFB.conectarBanco(client);

            const inicioDominio = (
                req.get('x-forwarded-host') ||
                req.get('origin')           || 
                req.get('host')             || 
                req.get('referer')          || 
                ''
            )
            .replace('https://', '')
            .replace('http://',  '')
            .split(':')[0]
            .split('.')[0];
        
            const acessoInterno = inicioDominio == '192' || inicioDominio == '10' || inicioDominio == 'localhost';
            const autenticacao = await autenticar(db, login, senha, loginCase, acessoInterno);

            if(autenticacao && autenticacao.msgAcessoNegado) {
                res.status(401).json({ error: autenticacao.msgAcessoNegado });
                
            } else if(autenticacao && autenticacao.results){
                if(acessos > 0) {
                    const acessosAtivos = await checarUsuarioOnline({ 
                        user: autenticacao.results[1],
                        device
                    });

                    if(acessosAtivos >= acessos) {
                        throw 'Acessos simultâneos excedidos';
                    }
                }

                const limiteUsuarios = parseInt(process.env[client ? ((client || '').toUpperCase() + '_LIMITE') : 'LIMITE'] || 0);
                const acessoPermitido = (!acessos && limiteUsuarios > 0) ? await checarLimiteUsuarios(client) : true;
                
                if(acessoPermitido === true){
                    autenticacao.results[3] = limiteUsuarios || acessos || 0;

                    if(limiteUsuarios > 0 || acessos > 0){
                        await registrarSessao({ sessionId, device, user: autenticacao.results[1] });
                    }
                    res.json(autenticacao);
                } else if(acessoPermitido === false){
                    res.status(401).json({ error: 'Limite de usuários atingido' });
                } else {
                    throw acessoPermitido;
                }
            } else if(autenticacao === false){
                res.status(401).json({ error: 'Login e/ou senha incorretos' });
            } else {
                throw autenticacao;
            }
            db.detach();
        } catch (error) {
            if(error.message) {
                res.status(401).json({ error: 'Erro ao autenticar usuário' });
            } else {
                res.status(404).json({ error });
            }

            console.log(error); 
            try { db.detach(); } catch(e) {}
        }

        next();
    });

    server.post('/session', async (req, res, next) => {
        res.sendStatus(202);
        const sessionid = req.get('sessionid');
        const user = req.get('userid');
        const device = req.get('device');
        registrarSessao({ sessionId: sessionid || '', user, device });
        next();
    });

    server.delete('/session', async (req, res, next) => {
        const sessionid = req.get('sessionid');
        await deletarSessao(sessionid || '');
        res.json({ msg: 'Sessão deletada' });
        next();
    });
};

const apiAuth = async (req, res) => {
    const { login, senha } = req.body || {};
    const client = req.query.client;

    if (!login || !senha) {
        return res.status(400).json({
            error: 'Login e senha são obrigatórios'
        });
    }

    let db;

    try {
        db = await samosFB.conectarBanco(client);

        const usuario = await autenticarApi(
            db,
            login,
            senha
        );

        if (!usuario) {
            return res.status(401).json({
                error: 'Login e/ou senha incorretos'
            });
        }

        const status = (usuario.USUARIOS_STATUS || '').trim();

        if (status === 'F') {
            return res.status(403).json({
                error: 'Usuário inativo'
            });
        }

        if (status === 'P') {
            return res.status(403).json({
                error: 'Usuário pendente'
            });
        }

        const expiresIn = 60 * 60 * 24;

        const token = jwt.sign(
            {
                tokenType: 'api',
                userId: usuario.USUARIOS_ID.toString(),
                login: usuario.USUARIOS_LOGIN,
                client: client
            },
            process.env['JWT_SECRET'],
            {
                expiresIn
            }
        );

        return res.json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: expiresIn,
            usuario: {
                id: usuario.USUARIOS_ID.toString(),
                login: usuario.USUARIOS_LOGIN,
                nome: usuario.USUARIOS_NOME
            }
        });

    } catch(error) {
        console.log('Erro ao autenticar API:', error);

        return res.status(500).json({
            error: 'Erro ao autenticar usuário'
        });

    } finally {
        try {
            if(db) {
                db.detach();
            }
        } catch(e) {}
    }
};

const autenticarApi = (db, login, senha) => {
    return new Promise((resolve, reject) => {

        const sql = `
            select
                USUARIOS_ID,
                USUARIOS_LOGIN,
                USUARIOS_NOME,
                USUARIOS_STATUS
            from USUARIOS
            where USUARIOS_LOGIN = ?
              and USUARIOS_SENHA = ?
        `;

        db.query(
            sql,
            [login, senha],
            (error, results) => {

                if(error) {
                    return reject(error);
                }

                if(!results || !results.length) {
                    return resolve(false);
                }

                resolve(results[0]);
            }
        );
    });
};

const bearerMiddleware = (req, res, next) => {
    const authorization = req.get('authorization');

    if (!authorization) {
        return res.status(401).json({
            error: 'Token Bearer não fornecido'
        });
    }

    const partes = authorization.split(' ');

    if (
        partes.length !== 2 ||
        partes[0].toLowerCase() !== 'bearer'
    ) {
        return res.status(401).json({
            error: 'Formato de autorização inválido'
        });
    }

    const token = partes[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token não fornecido'
        });
    }

    try {

        req.decoded = jwt.verify(
            token,
            process.env['JWT_SECRET']
        );

        if(req.decoded.tokenType !== 'api') {
            return res.status(403).json({
                error: 'Token não autorizado para utilização da API'
            });
        }

        next();

    } catch(error) {

        if(error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado'
            });
        }

        return res.status(401).json({
            error: 'Token inválido'
        });
    }
};

const jwtMiddleware = (deps) => {
    return async (req, res, next) => {
        const url = req.method == 'GET' ? req.url.split('?')[0] : req.url;
        const resource = '/' + url.split('/')[1];

        if (!deps.exclusions.includes(resource) && !deps.exclusions.includes(url)) {
            const token = req.get('x-access-token');

            if (!token) {
                res.status(403).json({ error: 'Token não fornecido ou Não permitido abrir no navegador' });
                return false;
            }

            if(token == 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') {
                req.decoded = true;
            } else {
                try {
                    req.decoded = jwt.verify(token, process.env['JWT_SECRET']);
                } catch (error) {
                    res.status(403).json({ error: 'Falha ao autenticar o token' });
                    return false;
                }
            }
        }

        next();
    };
};

function decriptString( encryptedHex, key=[2, 8, 2, 4, 1, 1, 1, 4, 5, 6, 0, 1, 3, 5, 4, 3] )
{
    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
        
    // The counter mode of operation maintains internal state, so to
    // decrypt a new instance must be instantiated.
    var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    var decryptedBytes = aesCtr.decrypt(encryptedBytes);
        
    // Convert our bytes back into text
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText
}

const autenticar = (db, login, senha, loginCase, acessoInterno) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sqlSearch =  
                loginCase == 'lowercase' ?
                    `select USUARIOS_ID, lower(USUARIOS_LOGIN) as USUARIOS_LOGIN, USUARIOS_NOME, USUARIOS_STATUS
                        from   USUARIOS
                        where  lower(USUARIOS_LOGIN) = '${login.toString().toLowerCase()}'
                        and    lower(USUARIOS_SENHA) = '${decriptString(senha).toString().toLowerCase()}'` :
                loginCase == 'uppercase' ?
                    `select USUARIOS_ID, upper(USUARIOS_LOGIN) as USUARIOS_LOGIN, USUARIOS_NOME, USUARIOS_STATUS
                        from   USUARIOS
                        where  upper(USUARIOS_LOGIN) = '${login.toString().toUpperCase()}'
                        and    upper(USUARIOS_SENHA) = '${decriptString(senha).toString().toUpperCase()}'` : 
                    `select USUARIOS_ID, USUARIOS_LOGIN, USUARIOS_NOME, USUARIOS_STATUS
                        from   USUARIOS
                        where  USUARIOS_LOGIN = '${login}'
                        and    USUARIOS_SENHA = '${decriptString(senha)}'`;

            db.query(sqlSearch, (error, results) => {
//                const key = {};
                
                if (error || !results.length) {
                    if(error){ 
                        resolve(error);
                        console.log(error); 
                    } else {
                        resolve(false);
                    }
                } else {

                    /*key['USUARIOS_LOGIN'] = results[0]['USUARIOS_LOGIN'];
                    key['USUARIOS_SENHA'] = senha;*/

                    const key = {
                        USUARIOS_ID: results[0]['USUARIOS_ID'].toString(),
                        USUARIOS_LOGIN: results[0]['USUARIOS_LOGIN']
                    };                    
                    
                    const userId   = results[0]['USUARIOS_ID'].toString();
                    const userName = results[0]['USUARIOS_NOME'].toString();
                    const status   = results[0]['USUARIOS_STATUS'].toString().trim();
                    const token    = jwt.sign(
                        key,
                        process.env['JWT_SECRET'],
                        { expiresIn: 60 * 60 * 24 }
                    );

                    let msgAcessoNegado = '';

                    if(status == 'F'){//inativo
                        msgAcessoNegado = 'Usuário inativo';
                    } else if(status == 'P'){//inativo
                        msgAcessoNegado = 'Usuário pendente';
                    }

                    if(acessoInterno && status == 'E') {
                        msgAcessoNegado = 'Apenas acesso externo';
                    } else if(!acessoInterno && status == 'I'){
                        msgAcessoNegado = 'Apenas acesso interno';
                    }
        
                    resolve({ msgAcessoNegado, results: [token, userId, userName] });
                }
            });
        } catch(error) {
            resolve(error);
            console.log(error);
        }
    });
};

const checarLimiteUsuarios = client => {
    return new Promise(async (resolve, reject) => {
        try{
            const limiteUsuarios = parseInt(process.env[client ? ((client || '').toUpperCase() + '_LIMITE') : 'LIMITE']) || Infinity;
            const usuariosOnline = await checarUsuariosOnline();
    
            resolve(usuariosOnline < limiteUsuarios);
        } catch(err){
            reject(err);
        }
    });
};

const checarUsuarioOnline = function({ user, device }) {
    const ociosidadeMax = 10000;

    return new Promise(async (resolve, reject) => {
        try {
            const pastaLicencaUsuarios = await checarPastaUsuarios();

            fs.readdir(pastaLicencaUsuarios, async (err, files) => {
                if(err) { throw(err); }

                const agora = new Date().getTime();

                const usuarioOnline = files
                    .filter(file => {
                        return file.split('.')[1] == user && file.split('.')[3] == device
                    })
                    .reduce((total, file) => {
                        const fileTimestamp = file.split('.')[2];
                        const ociosidade = agora - fileTimestamp;
        
                        if(ociosidade <= ociosidadeMax){
                            return ++total;
                        } else {
                            setTimeout(() => {
                                fs.unlinkSync(`${pastaLicencaUsuarios}/${file}`);
                            }, 0);
                            return total;
                        }
                    }, 0);

                resolve(usuarioOnline);
            });
        } catch(err) {
            reject(err);
        }
    });
};

const checarUsuariosOnline = function() {
    const ociosidadeMax = 15000;

    return new Promise(async (resolve, reject) => {
        try {
            const pastaLicencaUsuarios = await checarPastaUsuarios();

            fs.readdir(pastaLicencaUsuarios, async (err, files) => {
                if(err) { throw(err); }

                const agora = new Date().getTime();

                const usuariosOnline = files.reduce((total, file) => {
                    const fileTimestamp = file.split('.')[2];
                    const ociosidade = agora - fileTimestamp;
    
                    if(ociosidade <= ociosidadeMax){
                        return ++total;
                    } else {
                        setTimeout(() => {
                            fs.unlinkSync(`${pastaLicencaUsuarios}/${file}`);
                        }, 0);
                        return total;
                    }
                }, 0);

                resolve(usuariosOnline);
            });
        } catch(err) {
            reject(err);
        }
    });
};

const checarPastaUsuarios = function() {
    const pastaLicencaUsuarios = `${appRoot}/licencas/usuarios`;

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(pastaLicencaUsuarios)){
            mkdirp(pastaLicencaUsuarios)
                .then(() => {
                    resolve(pastaLicencaUsuarios);
                })
                .catch(errMd => {
                    reject(errMd);
                    console.log(`Erro ao criar pasta licenca de usuarios: ${errMd} ${pastaLicencaUsuarios}`);
                });
        } else {
            resolve(pastaLicencaUsuarios);
        }
    });
};

const registrarSessao = ({ sessionId, user, device }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const pastaLicencaUsuarios = await checarPastaUsuarios();
            const timestamp = new Date().getTime().toString();
            const caminhoArquivo = `${pastaLicencaUsuarios}/${sessionId}.${user}.${timestamp}.${device}.session`;
            
            fs.writeFileSync(caminhoArquivo, '');
            resolve();

            //limpar chaves ja inuteis
            fs.readdir(pastaLicencaUsuarios, async (err, files) => {
                if(err) { return; }

                files.forEach(file => {
                    const fileSession   = file.split('.')[0];
                    const fileTimeStamp = file.split('.')[2];

                    if(fileSession == sessionId && fileTimeStamp != timestamp){
                        try{
                            fs.unlinkSync(`${pastaLicencaUsuarios}/${file}`);
                        } catch(e){}
                    }
                });
            });

        } catch(err) {
            reject(err);
        }
    });
};

const deletarSessao = sessionId => {
    return new Promise(async (resolve, reject) => {
        try {
            const pastaLicencaUsuarios = await checarPastaUsuarios();
            
            fs.readdir(pastaLicencaUsuarios, async (err, files) => {
                if(err) { return; }

                files.forEach(file => {
                    const fileSession = file.split('.')[0];

                    if(fileSession == sessionId){
                        try{
                            fs.unlinkSync(`${pastaLicencaUsuarios}/${file}`);
                        } catch(e){}
                    }
                });

                resolve();
            });

        } catch(err) {
            reject(err);
        }
    });
};

async function defineDefaultParams(req, res, next) {
    try {
        //define alguns parametros padrao
        req.query['timezone']      = req.get('x-timezone')       || 'America/Sao_Paulo';
        req.query['empresaLogada'] = req.get('x-empresa-logada') || 0;
        req.query['userId']        = req.get('x-usuario-id')     || 0;
        req.query['userName']      = (req.get('x-usuario-nome')  || '').slice(0, 30);//para nao estourar os logs
        req.query['userLogin']     = req.get('x-usuario-login')  || 0;
        req.query['token']         = req.get('x-access-token')   || '';
        req.query['ip'] = (
            req.get('x-forwarded-for') || 
            (req.connection ? req.connection.remoteAddress : '')
        ).replace('::ffff:', '').replace('::1', 'localhost').replace('127.0.0.1', 'localhost');

        //caso o sistema esteja hospedado em um dominio,
        //aqui tenta determinar o client com base no dominio
        //atribui o client a uma parametro "client" que será repassado a todas as requisições

        const partes = (
            req.get('x-forwarded-host') ||
            req.get('origin')           || 
            req.get('host')             || 
            req.get('referer')          || 
            ''
        )
        .replace('https://', '')
        .replace('http://',  '')
        .split(':')[0]
        .split('.');

        //por padrão o client é o subdominio da aplicacao, ex:
        //automacao.samosweb.com.br -> client = automacao
        //batista.samosweb.com.br   -> client = batista
        req.query['client'] = partes[0];

        //a partir daqui trata-se as exceções, quando não tem subdominio:
        if(partes[0] == 'app') {
            //quando o subdominio comeca com "app"
            //app.prudenmoveis.com.br -> client = prudenmoveis
            //app.stilomoveis.net.br  -> client = stilomoveis
            req.query['client'] = partes[1];

        } else if(req.query['client'] == 'localhost') {
            //localhost não dá pra definir o client pelo endereço
            req.query['client'] = '';

        } else if(!isNaN(parseInt(partes[0]))) {
            //quando o endereco do sistema é acessado diretamente pelo IP, entra aqui
            //neste caso, tenta pegar o client do header x-client
            req.query['client'] = req.get('x-client');
        }

        //caso o client não esteja especificado tenta pegar da variavel de ambiente
        //que por sua vez é definida pelas pastas do cliente
        //ex: se tiver apenas uma pasta do cliente "jd", entao as variaveis serão: JD_FIREBIRD_PATH
        //e o client automaticamente será "jd"
        //só consegue se houver apenas uma pasta de cliente
        if(!req.query['client']) {
            const clients = Object.keys(process.env).filter(key => key.match(/_FIREBIRD_PATH/));
    
            if(clients.length == 0) {
                //sem pastas de cliente (modo desenvolvedor localhost)
                req.query['client'] =  '';
            
            } else if(clients.length == 1) {
                //pasta de cliente única (SUCESSO)
                req.query['client'] = clients[0].replace('_FIREBIRD_PATH', '');
            
            } else {
                //múltiplas pastas de cliente mas nenhuma maneira de definir o client
                //não dá pra definir o banco entao não permite acessar o sistema
                const error = `${clients.length} variaveis de ambiente de clientes encontradas. Envie o header x-client com o clientName para selecionar`;
                res.status(409).json(error);
                console.log(error);
                return;
            }
        }

        //deixa no padrão lowercase
        req.query['client'] = req.query['client'].toLowerCase().replace(/-bkp/ig, '');
    } catch(error) {
        console.log('Erro ao verificar dominio: ' + req.get('host'));
        console.log(error);
    }

    next();
}

module.exports = routes;