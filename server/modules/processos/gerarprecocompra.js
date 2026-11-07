'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const moment    = require('moment-timezone');
const mkdirp    = require('mkdirp');
const utils     = require('../../services/samosUtils');
const cents     = utils.number.cents.bind(utils.number);
const grams     = utils.number.grams.bind(utils.number);
const strZero   = utils.number.strZero.bind(utils.number);

moment.locale('pt_BR');

const samosFB = require('../../services/samosFirebird'); 

module.exports = {
    read: async params => { 
        const db = await samosFB.conectarBanco(params.client); 
        const nomeArquivo = 'PRECOS_' + (params.client || 'Hosp');
        let conteudo = '';

        let dadosProduto = await obterDadosProdutos(db, params); // Vou pegar sempre todos os produtos ativos

        for(let i in dadosProduto) {
 
            let model    = dadosProduto[i];
            let codPro  = strZero(model['PRODUTOS_ID'], 9);
            let precoCompraCadastro = model['SALDOS_COMPRA'];
            let precocompraKardex = await getPrecoCompra(db, model['PRODUTOS_ID']);

            if(String(cents(precoCompraCadastro) / 100) == String(cents(precocompraKardex) / 100)) {
                continue;
            }
                                                                        
            conteudo += codPro; // Código do produto
            conteudo += ";"
            conteudo += (cents(precoCompraCadastro) / 100).toString().replaceAll('.', ',');
            conteudo += ";"
            conteudo += (cents(precocompraKardex) / 100).toString().replaceAll('.', ','); // preço direto da consulta kardex
            conteudo += '\n';                                   
        }
        const caminhoSped = 'public/sped/';
        const caminhoCompleto = `${appRoot}/public/sped/`;
        const now = new Date().getTime();

        if (!fs.existsSync(caminhoCompleto)){
            await mkdirp(caminhoCompleto)
        }

        fs.writeFileSync(`${caminhoSped}/${nomeArquivo}.${'txt'}`, conteudo);

        return `${caminhoSped}${nomeArquivo}.txt`
    }
};

const obterDadosProdutos = function(db, params) {
    return new Promise(async (resolve, reject) => {
        
		let sql = `select PRODUTOS_ID, 
                          SALDOS_COMPRA from PRODUTOS
                   join SALDOS on SALDOS_ID_EMPRESAS = ${params.empresaLogada} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                   where SALDOS_ID_EMPRESAS = ${params.empresaLogada} and
                         PRODUTOS_STATUS <> 'F'`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};

const getPrecoCompra = function(db, produto, final) {

    return new Promise(async (resolve, reject) => {       
      
		let sql = `select MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOSITENS_ID_OPERACOES, MOVIMENTOSITENS_PRECO, MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_SITUACAO from MOVIMENTOSITENS
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                        where MOVIMENTOSITENS_ID_PRODUTOS = ${produto}
                        and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0005'
                        and ((movimentos_situacao = '0') or (movimentos_situacao = '3'))
                        order by MOVIMENTOS_ENTRADASAIDA descending`;

          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                if(results && results.length > 0) {
                    const precocompra = results[0]['MOVIMENTOSITENS_PRECO']
                    resolve(precocompra);    
                } else {
                    resolve(0);
                }
            }
        });
    });
};