'use strict';

const nodeFirebird    = require('node-firebird');
const moment          = require('moment-timezone');
const email           = require('../../email');

module.exports = {
    read: async (params) => {

        let { listaemails } = params;

        const clientes = `prudenmax   |databases.samoswex.com.br|3060|/home/samoswin/prudenmax/samosdb.fdb                 |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          paulista    |databases.samoswex.com.br|3060|/home/samoswin/paulista/samosdb.fdb                  |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          polidoro    |databases.samoswex.com.br|3060|/home/samoswin/polidoro/dados/samosdb.fdb            |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          polipneus   |databases.samoswex.com.br|3060|/home/samoswin/polidoropneus/dados/samosdb.fdb       |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          deposito    |databases.samoswex.com.br|3060|/home/samoswin/deposito/dados/samosdb.fdb            |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          bellar      |databases.samosweb.com.br|3060|/home/samosadmin/bellar/samoswin/samosdb.fdb         |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          fumya       |databases.samoswex.com.br|3060|/home/samoswin/fumya/dados/samosdb.fdb               |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          washington  |databases.samoswex.com.br|3060|/home/samoswin/washington/dados/samosdb.fdb          |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          prudenart   |databases.samoswex.com.br|3060|/home/samosadmin/prudenart/dados/samosdb.fdb         |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          redesat     |databases.samosweb.com.br|3060|/home/samosadmin/redesat/samoswin/samosdb.fdb        |select max(SAIDTE)    as DATABACKUP from CADSA1,
                          eleve       |databases.samoswex.com.br|3060|/home/samosadmin/eleve/dados/samosdb.fdb             |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          acomtf      |databases.samoswex.com.br|3060|/home/samosadmin/acomtf/dados/samosdb.fdb            |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          biomart     |databases.samoswex.com.br|3060|/home/samosadmin/biomart/dados/samosdb.fdb           |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          masterpecas |databases.samoswex.com.br|3060|/home/samosadmin/masterautopecas/dados/samosdb.fdb   |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          herbiquimica|databases.samoswex.com.br|3060|/home/samosadmin/herbiquimica/dados/samosdb.fdb      |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          hermes      |databases.samoswex.com.br|3060|/home/samosadmin/hermes/dados/samosdb.fdb            |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          hospitalar  |databases.samoswex.com.br|3060|/home/samosadmin/hospitalar/dados/samosdb.fdb        |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          lislais     |databases.samoswex.com.br|3060|/home/samosadmin/lislais/dados/samosdb.fdb           |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          organoplant |databases.samoswex.com.br|3060|/home/samosadmin/organoplant/dados/samosdb.fdb       |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          ozoniobras  |databases.samoswex.com.br|3060|/home/samosadmin/ozoniobras/dados/samosdb.fdb        |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          prudenaco   |databases.samoswex.com.br|3060|/home/samosadmin/prudenaco/dados/samosdb.fdb         |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          prudenmoveis|databases.samosweb.com.br|3060|/home/samosadmin/prudenmoveis/dados/samosdx.fdb      |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          santana     |databases.samoswex.com.br|3060|/home/samosadmin/santana/dados/samosdb.fdb           |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          stilomoveis |databases.samoswex.com.br|3060|/home/samosadmin/stilomoveis/dados/samosdb.fdb       |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          turbotec    |databases.samoswex.com.br|3060|/home/samosadmin/turbotec/dados/samosdb.fdb          |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          Osteon      |databases.samoswex.com.br|3060|/home/samosidot/osteon/dados/samosdb.fdb             |select max(LOGS_DATA) as DATABACKUP from LOGS,
                          RacaForte   |databases.samoswex.com.br|3060|/home/samosadmin/racaforte/dados/samosdb.fdb         |select max(LOGS_DATA) as DATABACKUP from LOGS`;

        let ArrayClientes = clientes.split(",");
        
        const results = [];

        for (let itens = 0; itens < ArrayClientes.length; itens++) {

            let cliente = ArrayClientes[itens].split("|");

            try {

                const config = {
                    database: cliente[3].trim(),
                    host: cliente[1].trim(),
                    port: cliente[2].trim(),
                    user: 'SYSDBA',
                    password: 'masterkey',
                    role: null,
                    pageSize: 16384,
                    timeout: 5000
                };

                const data = await new Promise((resolve, reject) => {
                    nodeFirebird.attach(config, (error, db) => {
                        if (error) {
                          return reject(error);
                        }    
                        db.query(cliente[4], (queryError, results) => {
                            db.detach(); 
                            if (queryError) {
                                console.log('queryError: ',queryError);
                                reject(queryError);
                            } else {
                                resolve(results);
                            }
                        });
                    });
                });

                results.push({empresas: cliente[0].trim(), dataBackup: data[0]['DATABACKUP'] ? moment(data[0]['DATABACKUP'] || '1899-12-30').format('DD/MM/YYYY') : ''});

            } catch (error) {
                console.error(`Erro ao checar backup cliente: ${cliente[0]} : 'Desconhecido'}:`, error.message);
            }

        }      

        try {
                let htmlPronto = `<table><td>Empresa</td><td>Último Backup</td>`;

                for (let itens = 0; itens < results.length; itens++) {
                    htmlPronto += `<tr><td>${results[itens].empresas}</td><td>${results[itens].dataBackup}</td></tr>`
                };

                htmlPronto += '</table>';

                await email.create({
                        empresa   : 1,
                        usuario   : 1,
                        email     : ( ( typeof listaemails == 'string' ? listaemails.toLowerCase() : listaemails ) || ''),
                        bcc       : '',
                        assunto   : 'Checagem Backup Diário',
                        html      : htmlPronto,
                        anexos    : [],
                        clientName: 'automacao',
                        tema      : 'basic'
                },
                {
                    empresaLogada: '1',
                    userId: '1',
                    userName: 'SUPERVISOR',
                    userLogin: 'SUPERVISOR',
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                    client : ''
               });

//                console.log('Email de checagem de backup enviado com sucesso');
            } catch (error) {
                console.log('Falha ao enviar email de backup');
                console.log(error);
            }    

        return results;

    }

};