'use strict'; 

//https://npmdoc.github.io/node-npmdoc-node-firebird/build/apidoc.html
const nodeFirebird    = require('node-firebird');
const nodeFirebirdDev = require('node-firebird-dev');//le blobs tipo texto
const moment          = require('moment-timezone');

const MAX_PER_QUERY   = 256;

async function conectarBanco(client, readBlobs) {
    const config = {
        database: process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_PATH') : 'FIREBIRD_PATH'],
        host    : process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_HOST') : 'FIREBIRD_HOST'],
        port    : process.env[client ? ((client || '').toUpperCase() + '_FIREBIRD_PORT') : 'FIREBIRD_PORT'],
        user    : 'SYSDBA',
        password: 'masterkey',
        role    : null,
        pageSize: 16384,
        timeout : 5000
    };

    const db = await new Promise((resolve, reject) => {
        //se o parametro readBlobs for true usa outro pacote (que é desatualizado mas lê blobs tipo Text)
        (readBlobs ? nodeFirebirdDev : nodeFirebird).attach(config, (error, db) => error ? reject(error) : resolve(db));
    });
    //se em 5 minutos a conexão ainda estiver aberta, fecha
    setTimeout(() => {
        try { 
            db.detach(); 
        } catch(e) {}
    }, 5 * 60 * 1000);

    return {
        query: (...args) => {
            return new Promise((resolve, reject) => {
                db.query(...args, async (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        //se houverem blobs faz uma nova conexao exclusiva
                        //usando o pacote alternativo node-firebird-dev, que le blobs tipo texto
                        if(!readBlobs && hasBlob(results)) {
                            const newDb = await conectarBanco(client, true);//readBlobs=true
                            
                            try {
                                const newResults = await newDb.query(...args);
                                converterCampos(newResults);
                                resolve(newResults);
                            } catch (error) {
                                reject(error);
                            }

                            newDb.detach();
                        } else {
                            converterCampos(results);
                            resolve(results);
                        }
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
};

async function removerRelacionamentos(tabela, obj) {
    const relacionamentos = {};

    Object.keys(obj)
        .filter(field => field.split('_')[0] != tabela)
        .forEach(field => {
            relacionamentos[field] = obj[field];
            delete obj[field];
        });
    
    return relacionamentos;
}

const samosFB = {
    executeSQL: async function(...args) {
        /*
            Duas opções de parametros:
            executeSQL(sql, sqlParams, params) <- para queries parametrizadas ou
            executeSQL(sql, params) <- queries normals
        */

        const sql = args[0]; 
        const sqlParams = args[2] ? args[1] : [];
        const params = args[2] || args[1];

        let db;

        //params.client = 'prudenaco';
        //params.dbUser = 'SYSDBA';

        try {
            db = await conectarBanco(params.client, false, params.dbUser);

            const results = await db.query(sql, sqlParams);

            db.detach();

            return results;
        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    insert: async function(tabela, obj, params) {
        const utils = require('./samosUtils');

        let db, sql;

        try {
            db = await conectarBanco(params.client);

            //obj pode ser apenas um ou um array com varios
            if(obj instanceof Array) {
                if(obj.length == 0) { 
                    throw new Error('Lista para persistencia vazia'); 
                }

                async function execute(contador) {
                    const inicio = contador * MAX_PER_QUERY;
                    const final  = inicio + MAX_PER_QUERY;

                    const ids = await generator(db, tabela, obj.slice(inicio, final).length);
    
                    sql = 'execute block as begin ';
                    
                    const inserts = await Promise.all(obj.slice(inicio, final).map(async (model, index) => {
                        const relacionamentos = await removerRelacionamentos(tabela, model);
    
                        model[`${tabela}_ID`] = ids[index];
    
                        const filhos = await reservarFilhos(model);
                        const fields = Object.keys(model).join(',');
                        const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(model)));
                        
                        //devolve as listas de filhos/relacionamentos
                        Object.assign(model, filhos);
                        Object.assign(model, relacionamentos);
    
                        return `insert into ${tabela} (${fields}) values (${values})`;
                    }));
    
                    sql += inserts.join(';');
                    sql += ';end';

                    await db.query(sql);
                }

                //limita a executar o máximo de execucoes em MAX_PER_QUERY dentro do execute block
                const execucoes = Math.ceil(obj.length / MAX_PER_QUERY);

                for(let i = 0; i < execucoes; i++) {
                    await execute(i);
                }

                db.detach();
                return obj;

            } else {
                const relacionamentos = await removerRelacionamentos(tabela, obj);
    
                obj[`${tabela}_ID`] = (await generator(db, tabela))[0];
    
                const filhos = await reservarFilhos(obj);
                const fields = Object.keys(obj).join(',');
                const values = utils.string.quotedArray(Object.values(utils.string.escapeSingleQuotes(obj)));
                
                //devolve as listas de filhos/relacionamentos
                Object.assign(obj, filhos);
                Object.assign(obj, relacionamentos);
                
                sql = `insert into ${tabela} (${fields}) values (${values})`;
                
                await db.query(sql);
                db.detach();
                return obj;
            }

        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    update: async function(...args) {
        const utils = require('./samosUtils');
        
        const id     = args[3] ? args[0] : null;
        const tabela = args[3] ? args[1] : args[0];
        const obj    = args[3] ? args[2] : args[1];
        const params = args[3] ? args[3] : args[2];

        let db, sql;

        try {
            db = await conectarBanco(params.client);

            //obj pode ser apenas um ou um array com varios
            if(obj instanceof Array) {
                if(obj.length == 0) { 
                    throw new Error('Lista para persistencia vazia'); 
                }

                async function execute(contador) {
                    const inicio = contador * MAX_PER_QUERY;
                    const final  = inicio + MAX_PER_QUERY;

                    sql = 'execute block as begin ';
                    
                    const updates = await Promise.all(obj.slice(inicio, final).map(async model => {
                        const relacionamentos = await removerRelacionamentos(tabela, model);

                        const filhos = await reservarFilhos(model);
                        const values = JSON.stringify(utils.string.escapeSingleQuotes(model)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
                        
                        //devolve as listas de filhos/relacionamentos
                        Object.assign(model, filhos);
                        Object.assign(model, relacionamentos);

                        return `update ${tabela} set ${values} where ${tabela}_ID = ${model[`${tabela}_ID`]}`;
                    }));

                    sql += updates.join(';');
                    sql += ';end';

                    await db.query(sql);
                }

                //limita a executar o máximo de execucoes em MAX_PER_QUERY dentro do execute block
                const execucoes = Math.ceil(obj.length / MAX_PER_QUERY);

                for(let i = 0; i < execucoes; i++) {
                    await execute(i);
                }

                db.detach();
                return obj;
            } else {
                const relacionamentos = await removerRelacionamentos(tabela, obj);
    
                const filhos = await reservarFilhos(obj);
                const values = JSON.stringify(utils.string.escapeSingleQuotes(obj)).replace (/{"/ig, '').replace (/":/ig, '=').replace (/,"/ig, ',').replace (/}/ig,  '').replace (/"/ig,  '\'');
                
                //devolve as listas de filhos/relacionamentos
                Object.assign(obj, filhos);
                Object.assign(obj, relacionamentos);

                sql = `update ${tabela} set ${values} where ${tabela}_ID = ${id}`;

                await db.query(sql);
                db.detach();
                return obj;
            }
                
        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    delete: async function(...args) {
        const id        = (args[0] || '').toString();//id ou lista de ids 'id1,id2'
        const tabela    = args[1];
        const tabelaPai = args[3] ? args[2] : null;
        const params    = args[3] || args[2];

        let db, sql;

        try {
            const ids = id.split(',');
            
            let sqlBody = '';

            db = await conectarBanco(params.client);

            async function execute(contador) {
                const inicio = contador * MAX_PER_QUERY;
                const final  = inicio + MAX_PER_QUERY;

                if(tabelaPai) {
                    sqlBody = ids.slice(inicio, final).reduce((str, id) => {
                        return str += ` delete from ${tabela} where ${tabela}_ID_${tabelaPai} = ${id};`
                    }, '');
                } else {
                    sqlBody = ids.slice(inicio, final).reduce((str, id) => {
                        return str += ` delete from ${tabela} where ${tabela}_ID = ${id};`
                    }, '');
                }

                sql = `execute block as begin ${sqlBody} end;`;

                await db.query(sql);
            }

            //limita a executar o máximo de execucoes em MAX_PER_QUERY dentro do execute block
            const execucoes = Math.ceil(ids.length / MAX_PER_QUERY);

            for(let i = 0; i < execucoes; i++) {
                await execute(i);
            }

            db.detach();
        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },
    
    count: async function (sql, params) {
        let db;

        try {
            db = await conectarBanco(params.client);

            const results = await db.query(sql);
            const result = results[0] ? parseInt(results[0]['COUNT']) : undefined;

            db.detach();

            if(result >= 0) {
                return result;
            } else {
                throw new Error(`Erro contador`);
            }
        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    buscaMultipla: async function (deps, params) {  
        let db, sql;

        try {
            db = await conectarBanco(params.client);

            const { tabela, chave, campos, conteudo, where } = deps;

            let sql = `execute block returns (ID varchar(6)) as
                declare variable query varchar(100);
                begin `;

            campos.forEach((campo, index) => {
                const campoComplemento = campo.toString().split('_').pop();
                const exatamente = campoComplemento == 'ID' || campoComplemento == 'BARRA';
                
                if(exatamente && isNaN(conteudo)){ return; }

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

            const results = await db.query(sql);
            db.detach();
            return results[0]['ID'] || 0;
        } catch(error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    ultimoDocto: async function (tabela, data, params) {
        let db, sql;

        try {
            const empresa = data[`${tabela}_ID_EMPRESAS`];
            
            let documento;

            if(tabela == 'FINANCEIROS') {
               const tipo = data['FINANCEIROS_TIPO'];
               documento = tipo == 'R' ? (empresa * 10000) + 8 : (empresa * 10000) + 9;
            } else {
               documento = data[`${tabela}_ID_DOCUMENTOS`];    
            }

            const isNfeRBFT = (data['EMPRESAS_CPFCNPJ'] || '').trim() == '45118377000188' &&
                             (data['MOVIMENTOS_ID_DOCUMENTOS'].toString() || '').slice(-4) == '0003'
    
            db = await conectarBanco(params.client);

            if(isNfeRBFT) {
                sql = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                        declare variable incremento integer;
                        declare variable altera_ultimo varchar(150);
                        begin
                            select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                            where DOCUMENTOS_ID = 90003 and DOCUMENTOS_ID_EMPRESAS = 9 into incremento,SERIE;
                            if (incremento = 0) then incremento = 1;
                            while (exists(select * from MOVIMENTOS where ((MOVIMENTOS_ID_EMPRESAS = 2) or (MOVIMENTOS_ID_EMPRESAS = 9)) and
                                                                       right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and
                                                                        MOVIMENTOS_NUMERO = :incremento  and
                                                                        MOVIMENTOS_SERIE  = :SERIE)) do
                            begin
                                incremento = incremento + 1;
                            end
                            ULTIMO = incremento;
                            altera_ultimo = 'update DOCUMENTOS set DOCUMENTOS_ULTIMO = ' || :ULTIMO || ' where  right(DOCUMENTOS_ID, 4) = ' || 0003 || ' and ((DOCUMENTOS_ID_EMPRESAS = 2) or (DOCUMENTOS_ID_EMPRESAS = 9))';
                            execute statement :altera_ultimo with autonomous transaction;
                            suspend;
                        end `;
            } else {
                sql = `execute block returns (ULTIMO integer, SERIE varchar(3)) as
                        declare variable incremento integer;
                        declare variable altera_ultimo varchar(150);
                        begin
                            select DOCUMENTOS_ULTIMO,DOCUMENTOS_SERIE from DOCUMENTOS 
                            where DOCUMENTOS_ID = ${documento} and DOCUMENTOS_ID_EMPRESAS = ${empresa} into incremento,SERIE;
                            if (incremento = 0) then incremento = 1;
                            while (exists(select * from ${tabela} where ${tabela}_ID_EMPRESAS   = ${empresa}   and
                                                                        ${tabela}_ID_DOCUMENTOS = ${documento} and
                                                                        ${tabela}_NUMERO        = :incremento  and
                                                                        ${tabela}_SERIE         = :SERIE)) do
                            begin
                                incremento = incremento + 1;
                            end
                            ULTIMO = incremento;
                            altera_ultimo = 'update DOCUMENTOS set DOCUMENTOS_ULTIMO = ' || :ULTIMO || ' where  DOCUMENTOS_ID = ${documento} and DOCUMENTOS_ID_EMPRESAS = ${empresa}';
                            execute statement :altera_ultimo with autonomous transaction;
                            suspend;
                        end `;

            }
            
            const results = await db.query(sql);
    
            db.detach();
            
            const numero = results[0] ? parseInt(results[0]['ULTIMO']) : undefined;
            const serie  = results[0] ? results[0]['SERIE']            : ''; 
        
            if(numero >= 0) {
                return { numero, serie };
            } else {
                throw `Erro ao obter último numero ${tabela}, ${empresa} - DOCUMENTOS_ID: ${documento}`;
            }
            
        } catch (error) {
            if(db) { db.detach(); }
            console.log(sql);
            throw error;
        }
    },

    removerRelacionamentos: removerRelacionamentos,
    conectarBanco: conectarBanco
};

const converterCampos = async function(records = []) {
    records.forEach(async record => {
        Object.keys(record).forEach(async campo => {
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
};

    
const hasBlob = function(results = []) {
    return results.some(result => Object.keys(result).some(key => typeof result[key] == 'function'));
}

const generator = async function (db, tabela, total = 1) {
    let sql;

    try {
        async function execute(total){
            sql = `execute block returns (
                ids varchar(4096)
            ) as
            declare variable total      integer;
            declare variable contador   integer;
            declare variable ultimo     integer;
            declare variable ultima_gen integer;      
            declare variable altera_gen varchar(100);  
            begin
                ids      = '';
                total    = ${total};
                contador = 0;
            
                while (contador < total) do
                    begin
                        ultimo = gen_id(GEN_${tabela}_ID, 1);
                        ultima_gen = ultimo;
                        while (exists(select ${tabela}_ID from ${tabela} where ${tabela}_ID =  :ultimo)) do
                            begin
                                ultimo = gen_id(GEN_${tabela}_ID, 1);
                            end
                        ids = ids || cast(:ultimo as varchar(7)) || ',';
                        contador = contador + 1;
                    end
            
                ids = substring(ids from 1 for character_length(ids) - 1);
            
                if ((ultima_gen + 1) < ultimo) then
                    begin
                        altera_gen = 'set generator GEN_${tabela}_ID to ' || Cast(:ultimo as varchar(7));
                        execute statement :altera_gen with autonomous transaction;
                    end 
                suspend;
            end;`;
            
            const results = await db.query(sql);
            return (results[0]['IDS'] || '').split(',');
        }

        //limita a pegar o valor em MAX_PER_QUERY de ids por vez, para não estourar o varchar 4096 dentro do execute block
        const execucoes = Math.ceil(total / MAX_PER_QUERY);

        const result = [];

        for(let i = 0; i < execucoes; i++) {
            const ultimaExecucao = i == execucoes - 1;

            //na ultima rodada gera apenas o restante
            if(ultimaExecucao && total % MAX_PER_QUERY > 0) {
                result.push(...await execute(total % MAX_PER_QUERY));
            } else {
                result.push(...await execute(MAX_PER_QUERY));
            }
        }

        return result;

    } catch(error){
        console.log(`Erro generator ${tabela}`)
        console.log(sql);
        throw error;
    }
};

const reservarFilhos = async function (obj) {
    let filhos = {};

    for (let i in obj){
        if(typeof obj[i] == 'object') {
            filhos[i] = obj[i];
            delete obj[i];
        }
    }

    return filhos;
};

module.exports = samosFB;