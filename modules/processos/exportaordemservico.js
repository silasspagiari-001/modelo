'use strict';

const utils   = require('../../services/samosUtils');
const api     = require('../');
const moment  = require('moment-timezone');
const cents   = utils.number.cents.bind(utils.number);

module.exports = {
    create: async (data, params) => {
        try {
            const { idOrdem } = params;
            
            const queryOrdem = await api.ordens().readById(idOrdem, params);

            if(!queryOrdem.results || !queryOrdem.results[0]) {
                throw 'Ordem de serviço de origem não encontrada';
            }

            const ordem = queryOrdem.results[0];
            const idEmpresa = ordem['ORDENS_ID_EMPRESAS'];

            if(cents(ordem['ORDENS_ID_ORDENSROTAS']) > 0) { // Se já gerado outra requisição anteriormente
                const idReq = ordem['ORDENS_ID_ORDENSROTAS'];
                const queryReq = await api.movimentos().readById(idReq, params);
                if(queryReq.results.length > 0) {
                    await api.movimentos().delete(idReq, params); // Se existir remove
                }    
            }

            const queryDocumentoRequisicao = await api.documentos().read(Object.assign({}, params, {
                conteudo: 'Requisições',
                empresa:  idEmpresa,
                ordem: '0',
                status: 2,
                start: 0,
                limit: 1
            }));

            if(!queryDocumentoRequisicao.results || !queryDocumentoRequisicao.results[0]) {
                throw 'Documento de requisição não encontrado';
            }

            const documentoRequisicao = queryDocumentoRequisicao.results[0];

            const itensOrdem = ordem['ORDENS_PRODUTOSITENS'] || [];
            const itensRequisicao = [];

            if(ordem['ORDENS_AGENDAMENTO'] != 'T') {  // Só gera a produção se não for garantia
                itensRequisicao.push({
                    'MOVIMENTOSITENS_ID'            : -1,
                    'MOVIMENTOSITENS_ID_MOVIMENTOS' : 0,
                    'MOVIMENTOSITENS_ID_OPERACOES'  : 900000,
                    'MOVIMENTOSITENS_ID_PRODUTOS'   : ordem['ORDENS_IDSKY'],
                    'MOVIMENTOSITENS_QUANTIDADE'    : 1,
                    'MOVIMENTOSITENS_PRECO'         : ordem['ORDENS_TOTAL'],
                    'MOVIMENTOSITENS_CUSTO'         : ordem['ORDENS_TOTAL'],
                    'MOVIMENTOSITENS_DATAENTREGA'   : '1899-12-30',
                    'MOVIMENTOSITENS_DATAMONTAGEM'  : '1899-12-30',
                    'MOVIMENTOSITENS_ENTREGUE'      : 0,
                    'MOVIMENTOSITENS_DEPOSITO'      : 0,
                    'MOVIMENTOSITENS_IMEDIATA'      : 0,
                    'MOVIMENTOSITENS_ID_EMPRESAS'   : ordem['ORDENS_ID_EMPRESAS'],
                    'MOVIMENTOSITENS_HORAENTREGA'   : '',
                    'MOVIMENTOSITENS_HORAMONTAGEM'  : '',
                    'MOVIMENTOSITENS_DESCONTOS'     : 0,
                    'MOVIMENTOSITENS_PERCENTUAL'    : 0,
                    'MOVIMENTOSITENS_TOTAL'         : ordem['ORDENS_TOTAL'],
                    'MOVIMENTOSITENS_CST'           : '000',
                    'MOVIMENTOSITENS_ESCRITURACAO'  : '2',
                    'MOVIMENTOSITENS_EXCECAO'       : '0',
                    'MOVIMENTOSITENS_ICMS'          : 0,
                    'MOVIMENTOSITENS_ALIQUOTAPIS'   : 0,
                    'MOVIMENTOSITENS_CSTPIS'        : '00',
                    'MOVIMENTOSITENS_BASEPIS'       : 0,
                    'MOVIMENTOSITENS_VALORPIS'      : 0,
                    'MOVIMENTOSITENS_VALORPISST'    : 0,
                    'MOVIMENTOSITENS_ALIQUOTACOFINS': 0,
                    'MOVIMENTOSITENS_CSTCOFINS'     : '00',
                    'MOVIMENTOSITENS_BASECOFINS'    : 0,
                    'MOVIMENTOSITENS_VALORCOFINS'   : 0,
                    'MOVIMENTOSITENS_VALORCOFINSST' : 0,
                    'MOVIMENTOSITENS_BASEICMS'      : 0,
                    'MOVIMENTOSITENS_VALORICMS'     : 0,
                    'MOVIMENTOSITENS_IPI'           : 0,
                    'MOVIMENTOSITENS_VALORIPI'      : 0,
                    'MOVIMENTOSITENS_BASEST'        : 0,
                    'MOVIMENTOSITENS_VALORST'       : 0,
                    'MOVIMENTOSITENS_FRETE'         : 0,
                    'MOVIMENTOSITENS_SEGURO'        : 0,
                    'MOVIMENTOSITENS_DESPESAS'      : 0,
                    'MOVIMENTOSITENS_IMPOSTO'       : 0
                });    
            }
            
            itensOrdem.forEach((item, index) => {
                itensRequisicao.push({
                    'MOVIMENTOSITENS_ID'            : (index + 2) * -1,
                    'MOVIMENTOSITENS_ID_MOVIMENTOS' : 0,
                    'MOVIMENTOSITENS_ID_OPERACOES'  : 520000, // Saída
                    'MOVIMENTOSITENS_ID_PRODUTOS'   : item['ORDENSPRODUTOS_ID_PRODUTOS'],
                    'MOVIMENTOSITENS_QUANTIDADE'    : item['ORDENSPRODUTOS_QUANTIDADE'],
                    'MOVIMENTOSITENS_PRECO'         : item['ORDENSPRODUTOS_PRECO'],
                    'MOVIMENTOSITENS_CUSTO'         : item['ORDENSPRODUTOS_PRECO'],
                    'MOVIMENTOSITENS_DATAENTREGA'   : '1899-12-30',
                    'MOVIMENTOSITENS_DATAMONTAGEM'  : '1899-12-30',
                    'MOVIMENTOSITENS_ENTREGUE'      : 0,
                    'MOVIMENTOSITENS_DEPOSITO'      : 0,
                    'MOVIMENTOSITENS_IMEDIATA'      : 0,
                    'MOVIMENTOSITENS_ID_EMPRESAS'   : ordem['ORDENS_ID_EMPRESAS'],
                    'MOVIMENTOSITENS_HORAENTREGA'   : '',
                    'MOVIMENTOSITENS_HORAMONTAGEM'  : '',
                    'MOVIMENTOSITENS_DESCONTOS'     : 0,
                    'MOVIMENTOSITENS_PERCENTUAL'    : 0,
                    'MOVIMENTOSITENS_TOTAL'         : item['ORDENSPRODUTOS_TOTAL'],
                    'MOVIMENTOSITENS_CST'           : '000',
                    'MOVIMENTOSITENS_ESCRITURACAO'  : '2',
                    'MOVIMENTOSITENS_EXCECAO'       : '0',
                    'MOVIMENTOSITENS_ICMS'          : 0,
                    'MOVIMENTOSITENS_ALIQUOTAPIS'   : 0,
                    'MOVIMENTOSITENS_CSTPIS'        : '00',
                    'MOVIMENTOSITENS_BASEPIS'       : 0,
                    'MOVIMENTOSITENS_VALORPIS'      : 0,
                    'MOVIMENTOSITENS_VALORPISST'    : 0,
                    'MOVIMENTOSITENS_ALIQUOTACOFINS': 0,
                    'MOVIMENTOSITENS_CSTCOFINS'     : '00',
                    'MOVIMENTOSITENS_BASECOFINS'    : 0,
                    'MOVIMENTOSITENS_VALORCOFINS'   : 0,
                    'MOVIMENTOSITENS_VALORCOFINSST' : 0,
                    'MOVIMENTOSITENS_BASEICMS'      : 0,
                    'MOVIMENTOSITENS_VALORICMS'     : 0,
                    'MOVIMENTOSITENS_IPI'           : 0,
                    'MOVIMENTOSITENS_VALORIPI'      : 0,
                    'MOVIMENTOSITENS_BASEST'        : 0,
                    'MOVIMENTOSITENS_VALORST'       : 0,
                    'MOVIMENTOSITENS_FRETE'         : 0,
                    'MOVIMENTOSITENS_SEGURO'        : 0,
                    'MOVIMENTOSITENS_DESPESAS'      : 0,
                    'MOVIMENTOSITENS_IMPOSTO'       : 0
                });
            });

            const requisicao = {
                'MOVIMENTOS_ID'              : 0,
                'MOVIMENTOS_CPFCNPJ'         : ordem['ORDENS_CPFCNPJ'],
                'MOVIMENTOS_SERIEORIGEM'     : ordem['ORDENS_SERIE'],
                'MOVIMENTOS_ID_EMPRESAS'     : ordem['ORDENS_ID_EMPRESAS'],
                'MOVIMENTOS_ID_PRAZOS'       : 1,
                'MOVIMENTOS_ENTRADASAIDA'    : moment.tz(params.timezone).format('YYYY-MM-DD'),
                'MOVIMENTOS_STATUS'          : 'F',
                'MOVIMENTOS_SITUACAO'        : '3',
                'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                'USUARIOS_NOME'              : params.userLogin,
                'USUARIOS_LOGIN'             : params.userLogin,
                'MOVIMENTOS_NFE'             : '',
                'MOVIMENTOS_PROTOCOLO'       : ordem['ORDENS_ID'],
                'MOVIMENTOS_BASEICMS'        : 0,
                'MOVIMENTOS_VALORICMS'       : 0,
                'MOVIMENTOS_BASEST'          : 0,
                'MOVIMENTOS_VALORST'         : 0,
                'MOVIMENTOS_VALORIPI'        : 0,
                'MOVIMENTOS_IMPOSTO'         : 0,
                'MOVIMENTOS_FRETE'           : 0,
                'MOVIMENTOS_DESCONTOS'       : 0,
                'MOVIMENTOS_PERCENTUAL'      : 0,
                'MOVIMENTOS_PRODUTOS'        : ordem['ORDENS_PRODUTOS'],
                'MOVIMENTOS_SEGURO'          : 0,
                'MOVIMENTOS_DESPESAS'        : 0,
                'MOVIMENTOS_TOTAL'           : ordem['ORDENS_TOTAL'],
                'MOVIMENTOS_OBSERVACOES'     : 'OS ' + ordem['ORDENS_REFERENCIA'] + ' ' + ordem['ORDENS_OBSERVACOES'],
                'MOVIMENTOS_FORMASPAGAMENTO' : [],
                'MOVIMENTOS_ID_EMPRESAORIGEM': ordem['ORDENS_ID_EMPRESAS'],
                'MOVIMENTOS_NUMEROORIGEM'    : ordem['ORDENS_NUMERO'],
                'MOVIMENTOS_ID_PESSOAS'      : ordem['ORDENS_ID_PESSOAS'],
                'MOVIMENTOS_NOME'            : ordem['ORDENS_NOME'],
                'MOVIMENTOS_EMAIL'           : ordem['ORDENS_EMAIL'],
                'MOVIMENTOS_ITENS'           : itensRequisicao,
                'MOVIMENTOS_ENVIO'           : [],
                'MOVIMENTOS_ID_DOCUMENTOS'   : documentoRequisicao['DOCUMENTOS_ID'],
                'DOCUMENTOS_NOME'            : documentoRequisicao['DOCUMENTOS_NOME'],
                'MOVIMENTOS_ID_OPERACOES'    : 520000,
                'OPERACOES_ID_APLICACOES'    : documentoRequisicao['OPERACOES_ID_APLICACOES'],
                'OPERACOES_FINANCEIRO'       : documentoRequisicao['OPERACOES_FINANCEIRO'],
                'OPERACOES_UNICA'            : documentoRequisicao['OPERACOES_UNICA'],
                'EMPRESAS_CPFCNPJ'           : ordem['EMPRESAS_CPFCNPJ'],
                'EMPRESAS_CNAE'              : ordem['EMPRESAS_CNAE']
            };

            const requisicaoSalva = await api.movimentos().create(requisicao, params);
            const idRequisicao = requisicaoSalva.results['MOVIMENTOS_ID'];
            const requisicaoCompleta = await api.movimentos().readById(idRequisicao, params);
            
            if(!requisicaoCompleta.results || !requisicaoCompleta.results[0]){
                throw `Falha ao recuperar requisição salva: ID: ${idRequisicao}`;
            }

            await atualizarOriginal(requisicao, ordem, params);

            return { results: ordem }

        } catch(error) {
            const msg = 'Falha ao exportar ordem de serviço';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const atualizarOriginal = async function(novo, original, params) {
    // Guarda o ID do movimento vinculado
    original['ORDENS_ID_ORDENSROTAS'] = novo['MOVIMENTOS_ID'];
    original['ORDENS_STATUS'] = (cents(original['ORDENS_NUMEROORIGEM']) > 0 ? 'F': 'E');
    original['ORDENS_HORAFECHAMENTO'] = moment.tz(params.timezone).format('HH:mm:ss');
   
    await api.ordens().update(original['ORDENS_ID'], original, params);
};
