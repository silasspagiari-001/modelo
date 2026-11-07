'use strict';

const utils   = require('../../../services/samosUtils');
const moment  = require('moment-timezone');
const api     = require('../..');
const cents   = utils.number.cents.bind(utils.number);

module.exports = {
    create: async (produtos, params) => {
        try {
            const { empresaLogada } = params;

            const isMalacrida = (params.client || '').toUpperCase() == 'MALACRIDA';

            const queryEmpresa = await api.empresas().read(Object.assign({}, params, {
                conteudo: `.${empresaLogada || 1}`
            }));

            if(!queryEmpresa.results || !queryEmpresa.results[0]) {
                throw 'Empresa não encontrada';
            }

            const queryOperacaoEntrada = await api.operacoes().read({
                conteudo: '.100000',
                client: params.client
            });

            if(!queryOperacaoEntrada.results || !queryOperacaoEntrada.results[0]) {
                throw 'Operação para creditar estoque não cadastrada';
            }

            const queryOperacaoSaida = await api.operacoes().read({
                conteudo: '.200000',
                client: params.client
            });

            if(!queryOperacaoSaida.results || !queryOperacaoSaida.results[0]) {
                throw 'Operação para debitar estoque não cadastrada';
            }

            const empresa = queryEmpresa.results[0];

            const queryDocumentoRequisicao = await api.documentos().read(Object.assign({}, params, {
                conteudo: 'Requisições',
                empresa:  empresaLogada,
                ordem: '0',
                status: 2,
                start: 0,
                limit: 1
            }));

            if(!queryDocumentoRequisicao.results || !queryDocumentoRequisicao.results[0]) {
                throw 'Documento de requisição não encontrado';
            }

            const documentoRequisicao = queryDocumentoRequisicao.results[0];

            const itensRequisicao = [];

            produtos.forEach((item, index) => {
                const diferenca = utils.number.grams(item['NOVO_SALDO']) - utils.number.grams(item['SALDOS_DISPONIVEL']);

                //se não houver diferenca não inclui na requisição
                if(diferenca != 0) {
                    itensRequisicao.push({
                        'MOVIMENTOSITENS_ID'            : (index + 2) * -1,
                        'MOVIMENTOSITENS_ID_MOVIMENTOS' : 0,
                        'MOVIMENTOSITENS_ID_OPERACOES'  : diferenca > 0 ? 100000 : 200000,
                        'MOVIMENTOSITENS_ID_PRODUTOS'   : item['PRODUTOS_ID'],
                        'MOVIMENTOSITENS_QUANTIDADE'    : Math.abs(diferenca / 1000),
                        'MOVIMENTOSITENS_PRECO'         : isMalacrida ? item['SALDOS_CUSTO'] : 0.01,
                        'MOVIMENTOSITENS_CUSTO'         : isMalacrida ? item['SALDOS_CUSTO'] : 0.01,
                        'MOVIMENTOSITENS_DATAENTREGA'   : '1899-12-30',
                        'MOVIMENTOSITENS_DATAMONTAGEM'  : '1899-12-30',
                        'MOVIMENTOSITENS_ENTREGUE'      : 0,
                        'MOVIMENTOSITENS_DEPOSITO'      : 0,
                        'MOVIMENTOSITENS_IMEDIATA'      : 0,
                        'MOVIMENTOSITENS_ID_EMPRESAS'   : empresaLogada,
                        'MOVIMENTOSITENS_HORAENTREGA'   : '',
                        'MOVIMENTOSITENS_HORAMONTAGEM'  : '',
                        'MOVIMENTOSITENS_DESCONTOS'     : 0,
                        'MOVIMENTOSITENS_PERCENTUAL'    : 0,
                        'MOVIMENTOSITENS_TOTAL'         : isMalacrida ? ((cents(item['SALDOS_CUSTO']) * Math.abs(diferenca / 1000)) / 100) : 0.01,
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
            });

            const dataMovimento = produtos[0]['DATA_BASE'];

            const requisicao = {
                'MOVIMENTOS_ID'              : 0,
                'MOVIMENTOS_CPFCNPJ'         : empresa['EMPRESAS_CPFCNPJ'],
                'MOVIMENTOS_SERIEORIGEM'     : '',
                'MOVIMENTOS_ID_EMPRESAS'     : empresaLogada,
                'MOVIMENTOS_ID_PRAZOS'       : 1,
                'MOVIMENTOS_EMISSAO'         : dataMovimento,
                'MOVIMENTOS_ENTRADASAIDA'    : dataMovimento,
                'MOVIMENTOS_STATUS'          : 'F',
                'MOVIMENTOS_SITUACAO'        : '3',
                'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                'MOVIMENTOS_NFE'             : '',
                'MOVIMENTOS_PROTOCOLO'       : '',
                'MOVIMENTOS_BASEICMS'        : 0,
                'MOVIMENTOS_VALORICMS'       : 0,
                'MOVIMENTOS_BASEST'          : 0,
                'MOVIMENTOS_VALORST'         : 0,
                'MOVIMENTOS_VALORIPI'        : 0,
                'MOVIMENTOS_IMPOSTO'         : 0,
                'MOVIMENTOS_FRETE'           : 0,
                'MOVIMENTOS_DESCONTOS'       : 0,
                'MOVIMENTOS_PERCENTUAL'      : 0,
                'MOVIMENTOS_PRODUTOS'        : 0,
                'MOVIMENTOS_SEGURO'          : 0,
                'MOVIMENTOS_DESPESAS'        : 0,
                'MOVIMENTOS_TOTAL'           : 0,
                'MOVIMENTOS_OBSERVACOES'     : 'Requisição gerada em Processos > Alterar Estoque',
                'MOVIMENTOS_FORMASPAGAMENTO' : [],
                'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
                'MOVIMENTOS_NUMEROORIGEM'    : 0,
                'MOVIMENTOS_ID_PESSOAS'      : empresa['EMPRESAS_ID'],
                'MOVIMENTOS_NOME'            : empresa['EMPRESAS_NOME'],
                'MOVIMENTOS_EMAIL'           : empresa['EMPRESAS_EMAIL'],
                'MOVIMENTOS_ITENS'           : itensRequisicao,
                'MOVIMENTOS_ENVIO'           : [],
                'MOVIMENTOS_ID_DOCUMENTOS'   : documentoRequisicao['DOCUMENTOS_ID'],
                'DOCUMENTOS_NOME'            : documentoRequisicao['DOCUMENTOS_NOME'],
                'MOVIMENTOS_ID_OPERACOES'    : 200000,
                'OPERACOES_ID_APLICACOES'    : documentoRequisicao['OPERACOES_ID_APLICACOES'],
                'OPERACOES_FINANCEIRO'       : documentoRequisicao['OPERACOES_FINANCEIRO'],
                'OPERACOES_UNICA'            : documentoRequisicao['OPERACOES_UNICA']
            };

            const requisicaoSalva = await api.movimentos().create(requisicao, params);
            const idRequisicao = requisicaoSalva.results['MOVIMENTOS_ID'];
            const requisicaoCompleta = await api.movimentos().readById(idRequisicao, params);
            
            if(!requisicaoCompleta.results || !requisicaoCompleta.results[0]){
                throw `Falha ao recuperar requisição salva: ID: ${idRequisicao}`;
            }

            return { results: requisicaoCompleta.results }

        } catch(error) {
            const msg = 'Falha ao atualizar estoque';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};