'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');

const fs = require("fs");

//Algumas versões do node não tem o fetch, então podemos verificar se ele esta disponivel
const checkIfFetchIsAvaliable = function(){
    try{
        Function('return fetch')();
        return true; 
    }catch(e){
        return false;
    }
}

// checks if module is available to load
const isModuleAvailableSync = function(moduleName)
{
    let ret = false; // return value, boolean
    let dirSeparator = require("path").sep

    // scan each module.paths. If there exists
    // node_modules/moduleName then
    // return true. Otherwise return false.
    module.paths.forEach(function(nodeModulesPath)
    {
        if(fs.existsSync(nodeModulesPath + dirSeparator + moduleName) === true)
        {
            ret = true;
            return false; // break forEach
        }
    });

    return ret;
}

//Usa o nodeFetch ou fetch, qual ele encontrar primeiro
const nodeFetch = checkIfFetchIsAvaliable() ? Function('return fetch')() : isModuleAvailableSync('node-fetch') ? require('node-fetch') : undefined;

module.exports = {
    read: async params => {
        try {
            const { cidade, estado, conteudo, ordem, start, limit } = params;

            if(!nodeFetch){ throw 'nodeFetch is not defined. A função fetch nao existe, e o modulo node-fetch como alternativa nao foi encontrado. Tente instalar usando: npm install node-fetch' };

            //Se a ordem for CEP, mais o usuario nao digitou o CEP, nao faz nada
            if( ordem == 0 && (conteudo == '' || !utils.string.onlyNumbers(conteudo)) ){
                return { results: [], total: 0 }
            }

            const urlCeps = new URL( process.env['APICEPS_URL'] || 'https://apiceps.samosweb.com.br/consulta' );
            urlCeps.searchParams.set('conteudo', conteudo);
            urlCeps.searchParams.set('cidade', cidade);
            urlCeps.searchParams.set('estado', estado);
            urlCeps.searchParams.set('ordem', ordem);
            urlCeps.searchParams.set('start', start);
            urlCeps.searchParams.set('limit', limit);

            const requisicao = await nodeFetch(urlCeps, {
                method: "GET", // *GET, POST, PUT, DELETE, etc.
                mode: "cors", // no-cors, *cors, same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                headers: {
                  "Content-Type"   : "application/json",
                  "x-access-token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
                }
            });

            const jsonConsulta = (await requisicao.json());
            const results = jsonConsulta.results ? jsonConsulta.results : [];
            const total = results.length;

            //Para cada resultado do CEP, junta com as informações da cidade
            await Promise.all(results.map(async cep => { 
                //Busca as cidades com os dados da cidade
                const sqlCidade = `
                select CIDADES_ID, CIDADES_STATUS
                from CIDADES
                where CIDADES_NOME       = '${ cep['CEPS_CIDADE'].toUpperCase() }'
                      and CIDADES_ESTADO = '${ cep['CEPS_ESTADO'] }'
                      and CIDADES_IBGE   = '${ cep['CEPS_IBGE']   }'
                order by CIDADES_ID
                `;

                const resultsCidade = await samosFB.executeSQL(sqlCidade, params);                                     

                if((resultsCidade||[]).length > 0) {
                    cep['CEPS_ID']     = resultsCidade[0]['CIDADES_ID'];
                    cep['CEPS_STATUS'] = resultsCidade[0]['CIDADES_STATUS'];
                }

            }))

            return { results, total };
                
        } catch(error) {
            const msg = 'Falha ao consultar ceps';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};