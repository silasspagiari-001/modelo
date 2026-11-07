'use strict';

const utils   = require('../../../services/samosUtils');
const samosFB = require('../../../services/samosFB');
const moment  = require('moment-timezone');

module.exports = {
    update: async (id, data, params) => {
        try {
            const finalizada = data['finalizada'];
            const requisicao = await geraRequisicao(id, finalizada, params);
            
            const producao = {
                'PRODUCOES_STATUS'          : 'F',
                'PRODUCOES_FINALIZADA'      : requisicao['MOVIMENTOS_EMISSAO'],
                'PRODUCOES_HORAFINALIZADA'  : requisicao['MOVIMENTOS_HORA'],
                'PRODUCOES_LOG'             : requisicao['MOVIMENTOS_LOG'],
                'PRODUCOES_ID_EMPRESAORIGEM': requisicao['MOVIMENTOS_ID_EMPRESAS'],
                'PRODUCOES_NUMEROORIGEM'    : requisicao['MOVIMENTOS_NUMERO'],
                'PRODUCOES_SERIEORIGEM'     : requisicao['MOVIMENTOS_SERIE']
            }

            await samosFB.update(id, 'PRODUCOES', producao, params);

            await utils.dblog(params);
            return producao;
        } catch(error) {
            const msg = 'Falha ao finalizar produção';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

async function geraRequisicao(idProducao, finalizada, params) {
    const producao   = await getProducao(idProducao, params);
    const requisicao = await geraCabecalhoRequisicao(producao, finalizada, params);

    try {
        requisicao['MOVIMENTOS_ITENS'] = await geraItensRequisicao(requisicao, producao, params);
    } catch(error) {
        //se der erro ao inserir itens tenta apagar o cabecalho
        await samosFB.executeSQL(`delete from MOVIMENTOS where MOVIMENTOS_ID = ${requisicao['MOVIMENTOS_ID']} `, params);
        throw error;
    }

    return requisicao;
}

async function getProducao(id, params) {
    const queryProducao = await samosFB.executeSQL(`select 
        PRODUCOES_STATUS,
        PRODUCOES_ID_EMPRESAS,
        PRODUCOES_ID_PESSOAS,
        PESSOAS_NOME,
        PESSOAS_CPFCNPJ,
        PRODUCOES_ID_USUARIOS,
        PRODUCOES_ID_PRODUTOS,
        PRODUTOS_DESCRICAO,
        PRODUTOS_EMBALAGEM,
        PRODUCOES_QUANTIDADE,
        PRODUCOES_NUMERO,
        PRODUCOES_SERIE,
        PRODUCOES_ID_OPERACOES_S,
        PRODUCOES_ID_OPERACOES_E
    from PRODUCOES 
    left outer join PESSOAS on PRODUCOES_ID_PESSOAS = PESSOAS_ID
    left outer join PRODUTOS on PRODUTOS_ID = PRODUCOES_ID_PRODUTOS
    where PRODUCOES_ID = ${id}
    `, params);

    const producao = queryProducao[0];

    producao['PRODUCOES_ITENS'] = await samosFB.executeSQL(`select 
            PRODUCOESITENS_ID_PRODUTOS,
            PRODUCOESITENS_QUANTIDADE,
            PRODUCOESITENS_CUSTO,
            PRODUTOS_EMBALAGEM,
            PRODUTOS_STATUS
        from PRODUCOESITENS
        join PRODUTOS on PRODUTOS_ID = PRODUCOESITENS_ID_PRODUTOS
        where PRODUCOESITENS_ID_PRODUCOES = ${id}
    `, params);

    if(producao['PRODUCOES_STATUS'] == 'F') {
        throw 'Produção já finalizada';
    }

    if(producao['PRODUCOES_STATUS'] == 'C') {
        throw 'Produção cancelada não pode ser finalizada';
    }

    return producao;    
}

async function geraCabecalhoRequisicao(producao, finalizada, params) {
    const hora = moment.tz(params.timezone).format('HH:mm:ss');

    const documento = await getDocumentoRequisicao(producao['PRODUCOES_ID_EMPRESAS'], params);

    const { numero, serie } = await samosFB.ultimoDocto('MOVIMENTOS', {
        'MOVIMENTOS_ID_EMPRESAS'  : producao['PRODUCOES_ID_EMPRESAS'],
        'MOVIMENTOS_ID_DOCUMENTOS': documento['DOCUMENTOS_ID']
    }, params);

    const requisicao = {
        'MOVIMENTOS_ID_EMPRESAS'     : producao['PRODUCOES_ID_EMPRESAS'],
        'MOVIMENTOS_ID_PESSOAS'      : producao['PRODUCOES_ID_PESSOAS'],
        'MOVIMENTOS_ID_USUARIOS'     : producao['PRODUCOES_ID_USUARIOS'],
        'MOVIMENTOS_ID_OPERACOES'    : documento['DOCUMENTOS_ID_OPERACOES'],
        'MOVIMENTOS_ID_DOCUMENTOS'   : documento['DOCUMENTOS_ID'],
        'MOVIMENTOS_ID_PRAZOS'       : 0,
        'MOVIMENTOS_SITUACAO'        : '0',
        'MOVIMENTOS_NUMERO'          : numero,
        'MOVIMENTOS_SERIE'           : serie,
        'MOVIMENTOS_EMISSAO'         : finalizada,
        'MOVIMENTOS_ENTRADASAIDA'    : finalizada,
        'MOVIMENTOS_HORA'            : hora,
        'MOVIMENTOS_TOTAL'           : 0,
        'MOVIMENTOS_PRODUTOS'        : 0,
        'MOVIMENTOS_PERCENTUAL'      : 0,
        'MOVIMENTOS_DESCONTOS'       : 0,
        'MOVIMENTOS_MARGEM'          : 0,
        'MOVIMENTOS_BASEICMS'        : 0,
        'MOVIMENTOS_VALORICMS'       : 0,
        'MOVIMENTOS_BASEST'          : 0,
        'MOVIMENTOS_VALORST'         : 0,
        'MOVIMENTOS_VALORIPI'        : 0,
        'MOVIMENTOS_FRETE'           : 0,
        'MOVIMENTOS_SEGURO'          : 0,
        'MOVIMENTOS_DESPESAS'        : 0,
        'MOVIMENTOS_NFE'             : '',
        'MOVIMENTOS_PROTOCOLO'       : '',
        'MOVIMENTOS_OBSERVACOES'     : '',
        'MOVIMENTOS_STATUS'          : 'F',
        'MOVIMENTOS_LOG'             : `${params.userName} ${moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')}`,
        'MOVIMENTOS_EMAIL'           : '',
        'MOVIMENTOS_IMPOSTO'         : 0,
        'MOVIMENTOS_NOME'            : producao['PESSOAS_NOME'],
        'MOVIMENTOS_CPFCNPJ'         : producao['PESSOAS_CPFCNPJ'],
        'MOVIMENTOS_ID_EMPRESAORIGEM': producao['PRODUCOES_ID_EMPRESAS'],
        'MOVIMENTOS_NUMEROORIGEM'    : producao['PRODUCOES_NUMERO'],
        'MOVIMENTOS_SERIEORIGEM'     : producao['PRODUCOES_SERIE']
    };

    return await samosFB.insert('MOVIMENTOS', requisicao, params);
}

async function geraItensRequisicao(requisicao, producao, params) {
    const totalProducao = producao['PRODUCOES_ITENS'].reduce((total, item) => {
        total += item['PRODUCOESITENS_CUSTO'] * item['PRODUCOESITENS_QUANTIDADE'];
        return total;
    }, 0);

    const itensRequisicao = [];

    //o primeiro item da requisição é o produto principal do cabecalho da ordem de producao
    //gera ele primeiro com operacao de entrada
    const qtdeItem1      = producao['PRODUCOES_QUANTIDADE'];
    const precoItem1     = Math.round((totalProducao / qtdeItem1) * 100) / 100;
    const embalagemItem1 = Math.round((producao['PRODUTOS_EMBALAGEM'] || 1) * 1000);

    itensRequisicao[0] = {
        'MOVIMENTOSITENS_ID_MOVIMENTOS': requisicao['MOVIMENTOS_ID'],
        'MOVIMENTOSITENS_ID_OPERACOES' : producao['PRODUCOES_ID_OPERACOES_E'],
        'MOVIMENTOSITENS_ID_PRODUTOS'  : producao['PRODUCOES_ID_PRODUTOS'],
        'MOVIMENTOSITENS_ID_EMPRESAS'  : producao['PRODUCOES_ID_EMPRESAS'],
        'MOVIMENTOSITENS_QUANTIDADE'   : qtdeItem1 / embalagemItem1 * 1000,
        'MOVIMENTOSITENS_PRECO'        : precoItem1,
        'MOVIMENTOSITENS_CUSTO'        : precoItem1,
        'MOVIMENTOSITENS_TOTAL'        : totalProducao
    };

    //os demais itens da requisição são os itens da ordem de producao
    //gera eles com operacao de saída
    await Promise.all((producao['PRODUCOES_ITENS'] || []).map(async produto => {
        const embalagem = Math.round((produto['PRODUTOS_EMBALAGEM'] || 1) * 1000);
        const qtdeOriginal = produto['PRODUCOESITENS_QUANTIDADE'];
        
        itensRequisicao.push({
            'MOVIMENTOSITENS_ID_MOVIMENTOS': requisicao['MOVIMENTOS_ID'],
            'MOVIMENTOSITENS_ID_OPERACOES' : producao['PRODUCOES_ID_OPERACOES_S'],
            'MOVIMENTOSITENS_ID_EMPRESAS'  : producao['PRODUCOES_ID_EMPRESAS'],
            'MOVIMENTOSITENS_ID_PRODUTOS'  : produto['PRODUCOESITENS_ID_PRODUTOS'],
            'MOVIMENTOSITENS_QUANTIDADE'   : qtdeOriginal / embalagem * 1000,
            'MOVIMENTOSITENS_PRECO'        : produto['PRODUCOESITENS_CUSTO'],
            'MOVIMENTOSITENS_CUSTO'        : produto['PRODUCOESITENS_CUSTO'],
            'MOVIMENTOSITENS_TOTAL'        : produto['PRODUCOESITENS_CUSTO'] * produto['PRODUCOESITENS_QUANTIDADE']
        });
    }));

    return await samosFB.insert('MOVIMENTOSITENS', itensRequisicao, params);
}

async function getDocumentoRequisicao(empresa, params) {
    const queryDocumento = await samosFB.executeSQL(`select 
        DOCUMENTOS_ID,
        DOCUMENTOS_ID_APLICACOES,
        DOCUMENTOS_ID_OPERACOES
    from DOCUMENTOS
    where DOCUMENTOS_NOME = 'Requisições' and
        DOCUMENTOS_ID_EMPRESAS = ${empresa}
    `, params);

    return queryDocumento[0];
}