'use strict'; 

const fs       = require('fs');
const path     = require('path');
const dotenv   = require('dotenv');
const axios    = require('axios');
const schedule = require('node-schedule');
const utils    = require('./services/samosUtils');

//inicia variaveis globais do arquivo .env da raiz
dotenv.config();

//inicia as variaveis de ambiente de cada cliente
const clientsPath    = path.join(process.cwd(), '..');
const clientsFolders = fs.readdirSync(clientsPath);

//entra em cada pasta do nivel acima (exceto server)
clientsFolders
    .filter(folder => folder != 'server' && folder != 'serverteste')
    .forEach(folder => {
        //se existir um arquivo .env, atribui as variaveis dele com o client na frente
        //ex: se encontrar o arquivo ../automacao/.env
        //faz: AUTOMACAO_FIREBIRD_PATH = .env['FIREBIRD_PATH']

        const envPath = path.join(clientsPath, folder, 'configs', '.env');
        const virtualhostPath = path.join(clientsPath, folder, 'configs', 'virtualhost.json');

        if(fs.existsSync(envPath)) {
            const clientName = (folder || '').toUpperCase();
            const clientEnv = dotenv.parse(fs.readFileSync(envPath));

            for (let i in clientEnv) {
                process.env[`${clientName}_${i}`] = clientEnv[i];
            }
        }

        if(fs.existsSync(virtualhostPath)) {
            const clientName = (folder || '').toUpperCase();
            const vhost = JSON.parse(fs.readFileSync(virtualhostPath));

            process.env[`${clientName}_DOMINIO`] = vhost['dominio'];
        }
    });

const express      = require('express');
const os           = require('os');
const compression  = require('compression');
const moment       = require('moment-timezone');
const api          = require('./modules');
const auth         = require('./services/auth');
const crud         = require('./services/crudRoutes');
const updategit    = require('./services/updategit');
const certificates = require('./services/certificates');
const exclusions   = [
    '/clientes', 
    '/auth', 
    '/session', 
    '/files', 
    '/imagem',
    '/email', 
    '/sms', 
    '/online', 
    '/usuarios', 
    '/integracao', 
    '/public', 
    '/licenca', 
    '/samosadmin', 
    '/favicon.ico', 
    '/socket.io', 
    '/.well-known', 
    '/updategit', 
    '/certificates',
    '/streaming',
    '/api',
    '/'
];

const server = express();

server.use(express.json({
    limit: '200mb', 
    strict: false, 
    type:  ["application/json", "text/json"]
}));

server.use(express.urlencoded({limit: '200mb', extended: true}));

//midleware para pegar arquivos em req.files
const multipart = require('connect-multiparty');
server.use(multipart());

server.use(compression());

server.use('/public', express.static('public'));
server.use('/.well-known', express.static('.well-known'));

auth(server, exclusions);
crud(server, api, 'modules');

server.post('/romaneiosmoveis/gerarTransferencias/:id', async (req, res) => {
    try {
        const response = await api['romaneiosmoveis']().gerarTransferencias(
            req.params.id,
            req.query
        );

        res.json(response);

    } catch(error) {
        console.log('Falha ao gerar transferências do romaneio');
        console.log(error);

        res.status(400).json(error);
    }
});

server.get('/datetime', async (req, res) => {
    try {
        res.send(moment().utc().format());
    } catch (error) {
        res.status(400).json({ error });
    }
});

server.get('/online', async (req, res) => {
    res.json({
        success: true,
        platform: os.platform(),
        architeture: os.arch()
    });
});

server.get('/api/integra/sendInvoice/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            		 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
	//console.log(parametros);
        const response = await api['api/integra/sendInvoice']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/api/integra/sendStock/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            		 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
        const response = await api['api/integra/sendStock']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/api/ourofino/sendInvoice/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            	 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
        const response = await api['api/ourofino/sendInvoice']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/api/ourofino/sendStock/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            	 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
        const response = await api['api/ourofino/sendStock']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/api/ourofino/sendBilling/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            	 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
        const response = await api['api/ourofino/sendBilling']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/api/ourofino/sendSalesOrder/:empresa/:inicio/:final', async (req, res) => {
    const  parametros = {'timezone'       : 'America/Sao_Paulo',
	            	 'empresaLogada'  : '1',
                         'userId'         : '1',
                         'userName'       : 'SUPERVISOR',
                         'userLogin'      : 'SUPERVISOR',
                         'token'          : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                         'ip'             : '127.0.0.1',
                         'client'         : 'racaforte',
                         'empresa'        : req.params.empresa,
                         'inicio'         : req.params.inicio,
                         'final'          : req.params.final   
                        };
    try {
        const response = await api['api/ourofino/sendSalesOrder']().read(parametros); 
        res.json(response);
    } catch (error) {
        console.log(error);
    }
});

server.get('/updategit', updategit);
server.post('/updategit', updategit);

server.post('/certificates', certificates.create);
server.put('/certificates',  certificates.update);

server.use('/samosadmin', express.static('samosadmin'));

server.get('/samosadmin/classic', (req, res) => {
    res.redirect('/samosadmin/classic/')
});
server.get('/samosadmin/modern', (req, res) => {
    res.redirect('/samosadmin/modern/?#login')
});
server.get('/samosadmin', (req, res) => {
    res.redirect('/samosadmin/classic/')
});
server.get('/samosadmin/*', (req, res) => {
    res.redirect('/samosadmin/classic/')
});
server.get('/', (req, res) => {
    res.redirect('/samosadmin/classic/')
});

const app = server.listen(process.env['PORT'], () => console.log(`Listening at port: ${process.env['PORT']}`));

const { Server } = require('socket.io');

const io = new Server(app, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

require('./modules/socket')(io);

global.socketLiberacao = require('./modules/socket/liberacao')(io);

//limpando a pasta public todo dia às 00h30 (com exceção das remessas)
const appRoot  = path.dirname(require.main.filename);
const pdfs     = os.platform().match(/linux|darwin/) ? 
                  `${appRoot}/public/pdf`.replace(/\\/ig, '/') :
                  `${appRoot}/public/pdf`.replace(/\//ig, '\\');
const retorno  = os.platform().match(/linux|darwin/) ? 
                  `${appRoot}/public/retorno`.replace(/\\/ig, '/') :
                  `${appRoot}/public/retorno`.replace(/\//ig, '\\');
const raiz     = os.platform().match(/linux|darwin/) ? 
                  `${appRoot}/public`.replace(/\\/ig, '/') :
                  `${appRoot}/public`.replace(/\//ig, '\\');                  

//https://www.npmjs.com/package/node-schedule
schedule.scheduleJob('30 00 * * *', function(){
    try{
        //da public elimina apenas os arquivos da raiz
        (fs.readdirSync(raiz) || []).forEach(function(file,index){
            const curPath = os.platform().match(/linux|darwin/) ?( raiz + '/' + file) : (raiz + '\\' + file); 
            if (!fs.lstatSync(curPath).isDirectory()){
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(pdfs,    { recursive: true });//elimina todos arquivos e pastas
//      fs.rmdirSync(retorno, { recursive: true });//elimina todos arquivos e pastas
    } catch(e){
        console.log('Não foi possível limpar a pasta public');
        console.log(e);
    }
});

//Atualização de xmls e saldos dos produtos à uma da manhã
schedule.scheduleJob('0 1 * * *', async function(){
    const clients = Object.keys(process.env).filter(key => {
        return key.match(/_FIREBIRD_PATH/)
    });

    for (let i in clients) {
        try {
            const client = clients[i].replace('_FIREBIRD_PATH', '').toLowerCase();
            console.log(`atualizando saldo ${client}...`);
            await api['processos/atualizasaldo']().create({ client });    
        } catch (error) {
            console.log(error);
        }
    }
});

schedule.scheduleJob('00 22 * * *', async function(){

    /*
    
    *    *    *    *    *    *
    ┬    ┬    ┬    ┬    ┬    ┬
    │    │    │    │    │    │
    │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
    │    │    │    │    └───── month (1 - 12)
    │    │    │    └────────── day of month (1 - 31)
    │    │    └─────────────── hour (0 - 23)
    │    └──────────────────── minute (0 - 59)
    └───────────────────────── second (0 - 59, OPTIONAL)
    */
    
    const datainicial = moment().subtract(1, 'day').format('DD.MM.YYYY');
    const datafinal   = moment().format('DD.MM.YYYY');
    const serverName  = process.env['SERVER'];

    if(serverName == 'racaforte') {
        console.log(`Baixando retorno BB Racaforte...${datainicial} a ${datafinal}`);
        const guidRacaforte = utils.string.gerarGuid(); // Raçaforte BB
        const  paramsraca = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '1',
                            'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                            'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                            'ip'        : '127.0.0.1',         'client'        : 'racaforte' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '1',
            portador: '3',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidRacaforte
        }, paramsraca);    
    }

    if(serverName == 'cloud') {
        // Malacrida Banco do Brasil 1|11        
        let guidMalacrida = utils.string.gerarGuid();
        let paramsmala = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '1',
                            'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                            'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                            'ip'        : '127.0.0.1',         'client'        : 'malacrida' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '1',
            portador: '11',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidMalacrida
        }, paramsmala);    

        console.log(`Malacrida 1|11|${guidMalacrida} Concluído!`);

        // Banco do Brasil 3|3
        guidMalacrida = utils.string.gerarGuid();
        paramsmala = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '3',
                        'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                        'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                        'ip'        : '127.0.0.1',         'client'        : 'malacrida' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '3',
            portador: '3',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidMalacrida
        }, paramsmala);    

        console.log(`Malacrida 3|3|${guidMalacrida} Concluído!`);

        // Banco do Brasil 5|5
        guidMalacrida = utils.string.gerarGuid();
        paramsmala = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '5',
                        'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                        'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                        'ip'        : '127.0.0.1',         'client'        : 'malacrida' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '5',
            portador: '5',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidMalacrida
        }, paramsmala); 

        console.log(`Malacrida 5|5|${guidMalacrida} Concluído!`);
        
        // Banco do Brasil 5|51
        guidMalacrida = utils.string.gerarGuid();
        paramsmala = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '5',
                        'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                        'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                        'ip'        : '127.0.0.1',         'client'        : 'malacrida' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '5',
            portador: '51',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidMalacrida
        }, paramsmala);    

        console.log(`Malacrida 5|51|${guidMalacrida} Concluído!`);

        // Sicredi 6|6
        guidMalacrida = utils.string.gerarGuid();
        paramsmala = { 'timezone'  : 'America/Sao_Paulo', 'empresaLogada' : '6',
                        'userId'    : '1',                 'userName'      : 'SUPERVISOR',
                        'userLogin' : 'SUPERVISOR',        'token'         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                        'ip'        : '127.0.0.1',         'client'        : 'malacrida' };
        await api['processos/financeiros/enviofinanceirotxt']().create({
            task    : 'processarapi',
            empresa : '6',
            portador: '6',
            inicio  : datainicial, 
            final   : datafinal,
            guid    : guidMalacrida
        }, paramsmala);    

        console.log(`Malacrida 6|6|${guidMalacrida} Concluído!`);
        
    }
    
    console.log(`Processamento ProcessarAPI concluido`);
    
});    

schedule.scheduleJob('00 04 * * *', async function(){

    const queryProcessarAPI_Backup = await axios({  // ProcessarBACKUP
        url: `https://automacao.samosweb.com.br/api/processos/backups?&listaemails=suporte@samos.com.br`, 
        method: 'GET'
    });    
    
    console.log(`Processamento ProcessarAPI concluido`);

});

let encerrando = false;

function gracefulShutdown(signal) {

    if (encerrando) {
        return;
    }

    encerrando = true;

    console.log(`${signal} signal received`);
    console.log('Encerrando servidor...');

    try {

        io.disconnectSockets(true);
        io.close();

        console.log('Socket.IO encerrado');

        // dá um pequeno tempo para finalizar operações pendentes
        setTimeout(() => {
            console.log('Express encerrado');
            process.exit(0);
        }, 500);

    } catch(error) {

        console.log('Erro durante encerramento:');
        console.log(error);

        process.exit(1);
    }
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));