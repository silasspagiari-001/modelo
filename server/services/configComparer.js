const fs = require('fs');
const path = require('path');
const appRoot = path.dirname(require.main.filename);
const utils = require('./samosUtils');
   
const add = function(padrao, client) {
    Object.keys(padrao).filter(config => {
        return client[config] === undefined;
    }).forEach(config => {
        client[config] = padrao[config];
        console.log(`config.js adicionado: ${config}: ${client[config]}`);
    });
};

const remove = function(padrao, client) {
    Object.keys(client).filter(config => {
        return padrao[config] === undefined;
    }).forEach(config => {
        delete client[config];
        console.log(`config.js removido: ${config}: ${client[config]}`);
    });
};

const levels = function(padrao, client) {
    Object.keys(padrao).filter(config => {
        return (
            (padrao[config] instanceof Array) == false && 
            typeof padrao[config]             != 'string' &&
            typeof padrao[config]             != 'boolean'
        );
    }).forEach(config => {
        add(   padrao[config], client[config]);
        remove(padrao[config], client[config]);
        
        if(padrao[config] != undefined || client[config] != undefined) {
            levels(padrao[config], client[config]);
        }
    });
}

module.exports = function() {
    return new Promise((resolve, reject) => {
        try {
            const configPadrao = fs.readFileSync(`${appRoot}/samosadmin/classic/config-padrao.js`);
            const configClient = fs.readFileSync(`${appRoot}/samosadmin/classic/config.js`);
            
            eval(configClient.toString());
            eval(configPadrao.toString());
        
            setTimeout(() => {
                //nivel 1
                add(Ext.PadraoConfig, Ext.ClientConfig);
                remove(Ext.PadraoConfig, Ext.ClientConfig);
            
                //outros niveis
                levels(Ext.PadraoConfig, Ext.ClientConfig);
            
                const result = `var Ext = Ext || {};
            Ext.ClientConfig = ${JSON.stringify(Ext.ClientConfig, null, 4)}`;
                
                fs.writeFile(`${appRoot}/samosadmin/classic/config.js`, result, 'utf-8', function (error) {
                    if (error) {
                        throw error;
                    } else {
                        console.log(`config.js Updated`);
                        resolve();
                    }
                });
            }, 1000);
        } catch(error) {
            console.log(`Erro ao atualizar config.js ${error.toString()}`);
            resolve();
        }
    });
};