'use strict'; 

//https://www.npmjs.com/package/ioredis
const Redis = require('ioredis');

module.exports = {
    async connectRedis() {
        this.redisConnection = this.redisConnection || new Redis();
        return this.redisConnection;
    },

    async get(...args) {
        const redis = await this.connectRedis();
        return await redis.get(...args);
    },

    async set(...args) {
        const redis = await this.connectRedis();
        return await redis.set(...args);
    },

    async query(table, where, params) {
        const redis       = await this.connectRedis();
        const client      = params.client ? `-${params.client.toUpperCase()}` : '';
        const clientTable = `${table}${client}`;
        const stringQuery = await redis.get(clientTable);
        
        return JSON.parse(stringQuery || '[]')
            .filter(item => {
                let included = true;
    
                for (let i in where) {
                    const { key, on, value } = where[i];
    
                    if(on == '==') {
                        included = included && item[key] == value;
                    }
    
                    if(on == 'startsWith') {
                        included = included && (item[key] || '').startsWith(value);
                    }
    
                    if(on == 'contains') {
                        included = included && item[key] == value;
                        included = included && (item[key] || '').indexOf(value) != -1;
                    }
                }
    
                return included;
            });
    },
    
    async insert(table, model, params) {
        const redis       = await this.connectRedis();
        const client      = params.client ? `-${params.client.toUpperCase()}` : '';
        const clientTable = `${table}${client}`;
        const stringQuery = await redis.get(clientTable);
        const redisItens  = JSON.parse(stringQuery || '[]');

        //converte sempre para um array de models
        const itens = model instanceof Array ? model : [model];

        itens.map(item => {
            const indexExistente = redisItens.findIndex(itemGravado => {
                return itemGravado[`${table}_ID`] == item[`${table}_ID`];
            });
    
            if(indexExistente != -1) {
                redisItens[indexExistente] = item;
            } else {
                redisItens.push(item);
            }
        });
        
        const queryInsert = await redis.set(clientTable, JSON.stringify(redisItens));
        if(queryInsert == 'OK') {
            return model;
        } else {
            throw 'Erro ao inserir no Redis';
        }
    },
    
    async delete (id, table, params) {
        const redis       = await this.connectRedis();
        const client      = params.client ? `-${params.client.toUpperCase()}` : '';
        const clientTable = `${table}${client}`;
        const stringQuery = await redis.get(clientTable);
        const redisItens  = JSON.parse(stringQuery || '[]');

        //converte sempre para um array de models
        const ids = id instanceof Array ? id : [id];

        ids.map(id => {
            const indexExistente = redisItens.findIndex(itemGravado => {
                return itemGravado[`${table}_ID`] == id;
            });
    
            if(indexExistente != -1) {
                redisItens.splice(indexExistente, 1);
            }
        });

        const queryDelete = await redis.set(clientTable, JSON.stringify(redisItens));
                
        if(queryDelete == 'OK') {
            return true;
        } else {
            throw 'Erro ao deletar no Redis';
        }
    }
}