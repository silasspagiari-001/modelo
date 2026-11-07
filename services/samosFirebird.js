'use strict'; 

const nodeFirebird = require('node-firebird');
const utils        = require('./samosUtils');
const moment       = require('moment-timezone');

const Firebird = {
    conectarBanco: function (client) {
        return new Promise((resolve, reject) => {
            const config = {
                //database: '/home/samosadmin/prudenaco/dados/samosdb.fdb',
                database: process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_PATH') : 'FIREBIRD_PATH'],
                host    : process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_HOST') : 'FIREBIRD_HOST'],
                port    : process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_PORT') : 'FIREBIRD_PORT'],
                user    : 'SYSDBA',
                password: 'masterkey',
                role    : null,
                pageSize: 16384,
                timeout : 5000
            };

            nodeFirebird.attach(config, function (error, db) {
                if (error) {
                    reject(error);
                    console.log(client)
                    console.log(process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_PATH') : 'FIREBIRD_PATH'])
                    console.log('samosFirebird/index.js:25: ' + error);
                } else {
                    resolve(db);

                    //se em 5 minutos a conexão ainda estiver aberta, fecha
                    setTimeout(() => {
                        try { 
                            db.detach();
                        } catch(e) {}
                    }, 5 * 60 * 1000);

                    /*function gracefulShutdown(event) {
                        return async code => {
                            try {
                                db.detach(() => {
                                    console.info(`${event} signal received with code ${code}`);
                                    console.log('Encerrando Conexão Firebird');
                                    process.exit(code || 0);
                                });
                            } catch (error) {
                                process.exit(code || 0);
                            }
                        }
                    }

                    process.on('SIGINT', gracefulShutdown('SIGINT'));
                    process.on('SIGTERM', gracefulShutdown('SIGTERM'));*/
                }
            });
        });
    },

    conectarBancoAsync: async function (client) {
        const db = await this.conectarBanco(client);

        //se em 5 minutos a conexão ainda estiver aberta, fecha
        setTimeout(() => {
            try { 
                db.detach();
            } catch(e) {}
        }, 5 * 60 * 1000)

        return {
            query: sql => {
                return new Promise((resolve, reject) => {
                    db.query(sql, (error, results) => {
                        if (error) {
                            reject(error);
                        } else {
                            this.converterCampos(results);
                            resolve(results)
                        }
                    });
                });
            },

            detach: function() {
                try {
                    db.detach();
                } catch (error) {
                    console.log('Não foi possível desconectar');
                    console.log(error);
                }
            }
        }
    },

    query: async function(db, sql){
        return new Promise((resolve, reject) => {
            db.query(sql, (error, results) => {
                if (error) {
                    reject(error);
                    console.log('samosFirebird/index.js:40: ' + error);
                } else {
                    resolve(results);
                }
            });
        });
    },

    reservarFilhos: function(registro) {
        let filhos = {};

        for (let i in registro){
            if(typeof registro[i] == 'object') {
                filhos[i] = registro[i];
                delete registro[i];
            }
        }

        return filhos;
    },

    removeForeignFields: function(data, table) {
        const foreignData = {};
        const foreignFields = Object.keys(data).filter(field => {
            return field.split('_')[0] != table;
        });

        foreignFields.forEach(field => {
            foreignData[field] = data[field];
            delete data[field];
        });

        return foreignData;
    },

    restoreForeignFields: function(data, foreignData) {
        Object.keys(foreignData).forEach(foreignField => {
            data[foreignField] = foreignData[foreignField];
        });
    },   

    processarLeitura: function (deps, callback) {
        let { db, results, total, resolve, reject, sqlFilhos } = deps;

        this.converterCampos(results);
        
        if(!sqlFilhos){
            this.enviarRespostaSucesso(db, results, total, resolve, callback);
        } else {
            total = total || 1;
            this.lerFilhos(db, results, total, resolve, reject, sqlFilhos, callback);
        }
    },

    processarGravacao: async function (deps, callback) {
        let { db, results, idRegistroPai, total, resolve, reject, sqlFilhos, registroPai } = deps;

        if(sqlFilhos){
            this.gravarFilhos(db, results, idRegistroPai, resolve, reject, sqlFilhos, null, registroPai, callback);
        } else {
            this.enviarRespostaSucesso(db, results, total, resolve, callback);
        }
    },

    processarExclusao: async function (deps, callback) {
        let { db, results, total, resolve } = deps;

        this.enviarRespostaSucesso(db, results, total, resolve, callback);
    },

    enviarRespostaErro: function (msg, db, error, reject, sql) {
        if(msg)   { console.log('samosFirebird/index.js:91: ' + msg  ); }
        if(error) { console.log('samosFirebird/index.js:92: ' + error); }
        if(sql)   { console.log('samosFirebird/index.js:93: ' + sql  ); }
        
        if(reject) {
            reject({ msg, error });
        }

        try {
            db.detach();
        } catch (error) {}
    },

    enviarRespostaSucesso: function (db, results, total, resolve, callback) {
        if(resolve) {
            resolve({ results, total });
        }
        
        if(callback) { 
            callback(results); 
        }
        
        if (db) {
            try {
                db.detach();
            } catch (error) {
                console.log('Não foi possível desconectar');
                console.log(error);
            }
        }
    },

    lerFilhos: function(db, results, total, resolve, reject, sqlFilhos, callback, indexes) {
        const childNames = Object.keys(sqlFilhos);

        try {
            if(!results[0]) {
                this.enviarRespostaSucesso(db, results, 0, resolve, callback); 
                return;
            }
            
            indexes = indexes || { sql: 0, results: 0 };
            const sqlInicial = sqlFilhos[childNames[indexes.sql]];
            const chavesCabecalho = sqlInicial.match(/results['[A-Z0-9]+_[A-Z0-9]+_*[A-Z0-9]*']/g) || [];
    
            const sqlFinal = chavesCabecalho.reduce((sql, chave) => {
                const campo = chave.match(/[A-Z0-9]+_[A-Z0-9]+_*[A-Z0-9]*/)[0];
                const regExp = new RegExp(`results\\['${campo}'\\]`, 'g');
                
                sql = sql.replace(regExp, "'" + results[indexes.results][campo] + "'");
                return sql;
            }, sqlInicial);
    
            db.query(sqlFinal, (error, resultsChilds) => {
                if (error) {
                    this.enviarRespostaErro('Falha ao listar itens', db, error, reject, sqlFinal);
                } else {
                    try{
                        this.converterCampos(resultsChilds);
                        
                        results[indexes.results][childNames[indexes.sql]] = resultsChilds;
                        
                        //verifica se existem outros filhos a buscar para este registro
                        if(sqlFilhos[childNames[indexes.sql + 1]]){
                            indexes.sql++;
                            this.lerFilhos(db, results, total, resolve, reject, sqlFilhos, callback, indexes);
                            
                        //verifica se existem outros registros para então procurar seus filhos
                        } else if(results[indexes.results + 1]){
                            indexes.results++;
                            indexes.sql = 0;
                            this.lerFilhos(db, results, total, resolve, reject, sqlFilhos, callback, indexes);
                            
                        } else {
                            this.enviarRespostaSucesso(db, results, total, resolve, callback); 
                        }
                    } catch(e){
                        console.log('samosFirebird/index.js:154: ' + e);
                    }
                }
            });
        } catch(e){
            console.log('samosFirebird/index.js:159: ' + e);
        }
    },

    gravarFilhos: async function(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback) {
        try {
            let childNames = Object.keys(sqlFilhos);
            let child;
            let sql, foreignKey;
            let fields, values;
            let foreignData = {};
    
            indexes = indexes || { sql: 0, items: 0 };
            sql = sqlFilhos[childNames[indexes.sql]];
    
            if(data[childNames[indexes.sql]] instanceof Array && sql) {
                foreignKey = sql
                    .match(/['[A-Z0-9]+_[A-Z0-9]+_*[A-Z0-9]*']/)[0]
                    .match(/[A-Z0-9]+_[A-Z0-9]+_*[A-Z0-9]*/)[0];
                
                child = data[childNames[indexes.sql]][indexes.items];
    
            } else {
                if (sql && sqlFilhos[childNames[indexes.sql + 1]]) {
                    indexes.items = 0;
                    indexes.sql++;
                    this.gravarFilhos(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback);
                } else {
                    this.enviarRespostaSucesso(db, registroPai, 1, resolve, callback);
                }
                return;
            }
    
            if(child) {
                child[foreignKey] = parseInt(idRegistroPai.toString().slice(8, 14)) > 0 ? idRegistroPai.slice(8, 14) : idRegistroPai;
        
                const campoId = Object.keys(child).filter(campo => campo.slice(-3) == '_ID')[0];
    
                if(parseInt(child[campoId]) < 0) {
                    child[campoId] = await this.lastId(db, campoId.slice(0, -3), `GEN_${campoId.slice(0, -3)}_ID`, `${campoId.slice(0, -3)}_ID`);
                }

                foreignData = this.removeForeignFields(child, campoId.split('_')[0]);
                
                fields = Object.keys(child);
                values = Object.values(child); 
    
            } else {
                await this.deleteChilds(db, foreignKey, idRegistroPai);
    
                if (sql && sqlFilhos[childNames[indexes.sql + 1]]) {
                    indexes.items = 0;
                    indexes.sql++;
                    this.gravarFilhos(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback);
                } else {
                    this.enviarRespostaSucesso(db, registroPai, 1, resolve, callback);
                }
                return;
            }
    
            fields = fields.join(',');
            values = utils.string.quotedArray(values).join(',').replace(/'NaN'/g, '0');
    
            sql = sql .replace(`['${foreignKey}']`, `(${fields})`)
                      .replace('[values]', `(${values})`)
                      .replace('T00:00:00', '');
                    
            if(indexes.items == 0) {
                await this.deleteChilds(db, foreignKey, idRegistroPai);
            }
            db.query(sql, (error) => {
                this.restoreForeignFields(child, foreignData);
                if (error) {
                    console.log('samosFirebird/index.js:228: ' + error);
                    console.log(sql);
                    this.enviarRespostaErro('Falha ao gravar itens', db, error, reject, sql);
                } else {
                    try {
                        //verifica se existem outros itens a gravar para este filho
                        if(data[childNames[indexes.sql]][indexes.items + 1]){
                            indexes.items++;
                            this.gravarFilhos(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback);
                            
                        //verifica se existem outros filhos para então gravar seus items
                        } else if(data[childNames[indexes.sql + 1]]){
                            registroPai[childNames[indexes.sql]] = data[childNames[indexes.sql]];                                        
                            indexes.items = 0;
                            indexes.sql++;
                            this.gravarFilhos(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback);
                        
                        } else if (indexes.sql + 2 != childNames.length) {
                            registroPai[childNames[indexes.sql]] = data[childNames[indexes.sql]];                                        
                            indexes.items = 0;
                            indexes.sql += 2;
                            this.gravarFilhos(db, data, idRegistroPai, resolve, reject, sqlFilhos, indexes, registroPai, callback);
                        
                        } else {
                            registroPai[childNames[indexes.sql]] = data[childNames[indexes.sql]];
                            this.enviarRespostaSucesso(db, registroPai, 1, resolve, callback); 
                        }
                    } catch(e){
                        console.log('samosFirebird/index.js:256: ' + e);
                    }
                }
            });
        } catch(e){
            console.log('samosFirebird/index.js:261: ' + e);
        }
    },

    deleteChilds: function(db, foreignKey, idRegistroPai) {
        return new Promise((resolve, reject) => { 
            try {
                let table = foreignKey.split('_')[0];
                var sql = `delete from ${table} where ${foreignKey} = '${idRegistroPai}'`;
    
                db.query(sql, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            } catch(e) {
                console.log('samosFirebird/index.js:279: ' + e);
            }
        });
    },

    converterCampos: function(records = []) {
        try {
            records.forEach(record => {
                Object.keys(record).forEach(campo => {
                    if(record[campo] && record[campo].buffer) {
                        record[campo] = record[campo].toString();
                    }
                    if(Object.prototype.toString.call(record[campo]) === '[object Date]'){
                        record[campo] = moment(record[campo]).format('YYYY-MM-DD');
                    }
    
                    if(typeof record[campo] == 'string' && record[campo][record[campo].length - 1] == ' ') {
                        record[campo] = record[campo].trim();
                    }
                });
            });
        } catch(error){
            console.log('samosFirebird/index.js:313: ' + error);
        }
    },

    lastId: function (db, tableName, genName, idName) {
        try {
            let sql = `execute block returns (ULTIMO integer) as
               declare variable incremento integer;
               declare variable ultima_gen integer;      
               declare variable altera_gen varchar(100);  
               begin
                 incremento = gen_id(${genName}, 1);
                 ultima_gen = incremento;
                 while (exists(select ${idName} from ${tableName} where ${idName} =  :incremento)) do
                   begin
                     incremento = gen_id(${genName}, 1);
                   end
                 ultimo = incremento;
                 if ((ultima_gen + 1) < ultimo) then
                    begin
                      altera_gen = 'set generator ${genName} to ' || Cast(:ultimo as varchar(7));
                      execute statement :altera_gen with autonomous transaction;
                    end 
                 suspend;
               end; `;

               return new Promise(async (resolve, reject) => {
                if(db.connection) {
                    db.query(sql, (error, results) => {
                        try {
                            if (error) {
                                reject(error);
                            } else {
                                const result = results[0] ? parseInt(results[0]['ULTIMO']) : undefined;
                                if(result >= 0) {
                                    resolve(result);
                                } else {
                                    reject('LastId Error');
                                }
                            }
                        } catch (e){
                            reject(e);
                            console.log('samosFirebird/index.js:354: ' + e);
                        }
                    });
                } else {
                    try {
                        const results = await db.query(sql);
                        const result = results[0] ? parseInt(results[0]['ULTIMO']) : undefined;
                        if(result >= 0) {
                            resolve(result);
                        } else {
                            reject('LastId Error');
                        }
                    } catch (e){
                        reject(e);
                        console.log('samosFirebird/index.js:354: ' + e);
                    }
                }
            });
        } catch(e){
            console.log('samosFirebird/index.js:259: ' + e);
        }
    },

    ultimoCodigo: function (db, tableName) {
        try {
            let sql = `select * from ultimo_codigo('00001','${tableName}','T')`;

            return new Promise((resolve, reject) => {
                let result;
                db.query(sql, (error, results) => {
                    try {
                        if (error) {
                            reject(error);
                        } else {
                            result = results[0] ? results[0]['ULTIMO'] : undefined;                    
                            if(result >= 0) {
                                resolve(result);
                            } else {
                                reject('ultimoCodigo Error');
                            }
                        }
                    } catch(e) {
                        reject(e);
                        console.log('samosFirebird/index.js:383: ' + e);
                    }
                });
            });
        } catch(e) {
            console.log('samosFirebird/index.js:388: ' + e);
        }
    },
    
    ultimoDocto: function (db, tabela, empresa, docto, reservar = 0) {
        let sql = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                    declare variable incremento integer;
                    declare variable altera_ultimo varchar(150);
                    begin
                        select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                        where DOCUMENTOS_ID = ${docto} and DOCUMENTOS_ID_EMPRESAS = ${empresa} into incremento,SERIE;
                        if (incremento = 0) then incremento = 1;
                        while (exists(select * from ${tabela} where ${tabela}_ID_EMPRESAS   = ${empresa}  and
                                                                    ${tabela}_ID_DOCUMENTOS = ${docto}    and
                                                                    ${tabela}_NUMERO        = :incremento and
                                                                    ${tabela}_SERIE         = :SERIE)) do
                        begin
                            incremento = incremento + 1;
                        end
                        ULTIMO = incremento;
                        altera_ultimo = 'update DOCUMENTOS set DOCUMENTOS_ULTIMO = ' || :ULTIMO || ' + ${reservar} where  DOCUMENTOS_ID = ${docto} and DOCUMENTOS_ID_EMPRESAS = ${empresa}';
                        execute statement :altera_ultimo with autonomous transaction;
                        suspend;
                    end `;
        
        return new Promise((resolve, reject) => {
            let numero, serie;
            db.query(sql, (error, results) => {
                if (error) {
                    console.log('samosFirebird/index.js:416: ' + error);
                    reject(error);
                } else {
                    numero = results[0] ? parseInt(results[0]['ULTIMO']) : undefined;
                    serie  = results[0] ? results[0]['SERIE']            : undefined; 

                    if(numero >= 0) {
                        resolve({ numero, serie });
                    } else {
                        console.log('samosFirebird/index.js:425: ultimoDocto Error');
                        reject('ultimoDocto Error');
                    }
                }
            });
        });
    },

    buscaMultipla: function(deps) {  
        return new Promise(async (resolve, reject) => {
            const { db, tabela, chave, campos, conteudo, where } = deps;

            let sql = `execute block returns (ID varchar(6)) as
                declare variable query varchar(100);
                begin `;

            campos.forEach((campo, index) => {
                const campoComplemento = campo.toString().split('_').pop();
                const exatamente = campoComplemento == 'ID' || campoComplemento == 'BARRA';
                
                if(conteudo == '' || (exatamente && isNaN(conteudo))){ return; }

                const escapedConteudo = conteudo.toString().toString().replace(/\'/ig, "''");;

                sql += `
                    query = (
                        select first 1 skip 0 ${chave} 
                        from ${tabela} 
                        where ${campo} ${exatamente ? '=' : 'like'} '${escapedConteudo}${exatamente ? '' : '%'}' 
                        ${where ? 'and ' + where : ''}
                        order by ${campo}
                    );
                    if (query is not null) then
                        ID = query;
                    `;

                sql += index != campos.length - 1 ? 'else' : '';
            });

            sql += `suspend;end;`;

            if(db.connection) {
                db.query(sql, (error, results) => {
                    if (error) {
                        reject(error);
                        console.log('samosFirebird/index.js:463: ' + error);
                        console.log('samosFirebird/index.js:464: ' + sql);
                    } else {
                        resolve(results[0]['ID'] || 0);
                    }
                });
            } else {
                try {
                    const results = await db.query(sql);
                    resolve(results[0]['ID'] || 0);
                } catch (error){
                    reject(error);
                    console.log('samosFirebird/index.js:463: ' + error);
                    console.log('samosFirebird/index.js:464: ' + sql);
                }
            }
        });
    },
    
    count: function (db, sql) {
        return new Promise(async (resolve, reject) => {
            if(db.connection) {
                db.query(sql, (error, results) => {
                    if (error) {
                        reject(error);
                        console.log('samosFirebird/index.js:479: ' + error);
                        console.log('samosFirebird/index.js:480: ' + sql);
                    } else {
                        const result = results[0] ? parseInt(results[0]['COUNT']) : undefined;

                        if(result >= 0) {
                            resolve(result);
                        } else {
                            reject('Count Error');
                        }
                    }
                });
            } else {
                try {
                    const results = await db.query(sql);
                    const result = results[0] ? parseInt(results[0]['COUNT']) : undefined;

                    if(result >= 0) {
                        resolve(result);
                    } else {
                        reject('Count Error');
                    }
                } catch (error){
                    reject(error);
                    console.log('samosFirebird/index.js:479: ' + error);
                    console.log('samosFirebird/index.js:480: ' + sql);
                }
            }
        });
    }
}

module.exports = Firebird;
