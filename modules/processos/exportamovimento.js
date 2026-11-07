'use strict';

const samosFB = require('../../services/samosFB');
const utils   = require('../../services/samosUtils');
const api     = require('../');
const moment  = require('moment-timezone');
const cents   = utils.number.cents.bind(utils.number);
const grams   = utils.number.grams.bind(utils.number);
const changeBase = utils.number.changeBase.bind(utils.number);

module.exports = {
    create: async (data, params) => {

        let avisoIbsCbs = '';
        let falhouCalculadoraIbsCbs = false;

        try {

            console.log(
                '[EXPORTAMOVIMENTO][ENTROU]',
                'idOrigem=', params.idOrigem,
                'nomeNovoDocumento=', params.nomeNovoDocumento,
                'client=', params.client
            );

            const { idOrigem, nomeNovoDocumento } = params;

            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

            const queryMovimentoOrigem = await api.movimentos().readById(idOrigem, params);

            if(!queryMovimentoOrigem.results || !queryMovimentoOrigem.results[0]) {
                throw 'Movimento de origem não encontrado';
            }

            const movimentoOrigem = queryMovimentoOrigem.results[0];

            const isPrudenMoveis   = (movimentoOrigem['EMPRESAS_CPFCNPJ'] || []).match(/74398579|45118377|04395395/); // Prudenmóveis/Eduardo/Margarida
            const isRacaforte      = (movimentoOrigem['EMPRESAS_CPFCNPJ'] || []) == '64607922000144';
            const isCirurcenter    = (movimentoOrigem['EMPRESAS_CPFCNPJ'] || []).match(/02715655|37623347|27435570/); // Cirurcenter/Nutri Inova/Nutri Center
            const isMovimentoSaida = movimentoOrigem['OPERACOES_TIPO'] == 'S';

        
            // Se vier de Nota ou Requisição de entrada
            if( !isRacaforte &&
                ((
                    movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0004' && 
                    parseInt(movimentoOrigem['MOVIMENTOS_ID_OPERACOES']) < 500000
                 ) || movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0005')
            ) { 
                const idEmpresaOrigem = movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'];
                const idEmpresaDestino = '1';// Sempre será para o CD

                // Passo 1 - Gerando TRE
                const queryNovoDocumentoTRE = await api.documentos().read(Object.assign({}, params, {
                    conteudo: idEmpresaDestino + '0016',// TRE
                    empresa:  idEmpresaDestino,
                    ordem: '2',
                    status: 2,
                    start: 0,
                    limit: 1
                }));

                if(!queryNovoDocumentoTRE.results || !queryNovoDocumentoTRE.results[0]) {
                    throw 'Documento para geração de TRE não encontrado';
                }

                const novoDocumentoTRE = queryNovoDocumentoTRE.results[0];

                const itensAntigosTRE = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).map(item => {
                    return Object.assign({}, item);
                });
                
                const formasTRE = resetarIds(movimentoOrigem, 'MOVIMENTOS_FORMASPAGAMENTO', 'MOVIMENTOSFORMAS_ID');
                const itensTRE  = resetarIds(movimentoOrigem, 'MOVIMENTOS_ITENS',           'MOVIMENTOSITENS_ID')
                    .map(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = novoDocumentoTRE['DOCUMENTOS_ID_OPERACOES'];
                        item['MOVIMENTOSITENS_MARGEM'] = 0;
                        return item;
                    });

                const novoMovimentoTRE = {
                    'MOVIMENTOS_ID'              : 0,
                    'MOVIMENTOS_CPFCNPJ'         : movimentoOrigem['EMPRESAS_CPFCNPJ'],   //'74398579000200',  // CD
                    'MOVIMENTOS_SERIEORIGEM'     : movimentoOrigem['MOVIMENTOS_SERIE'],
                    'MOVIMENTOS_ID_EMPRESAS'     : idEmpresaDestino,
                    'MOVIMENTOS_ID_PRAZOS'       : movimentoOrigem['MOVIMENTOS_ID_PRAZOS'],
                    'MOVIMENTOS_ENTRADASAIDA'    : movimentoOrigem['MOVIMENTOS_ENTRADASAIDA'],
                    'MOVIMENTOS_STATUS'          : 'F',
                    'MOVIMENTOS_SITUACAO'        : 'A',
                    'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                    'USUARIOS_NOME'              : params.userLogin,
                    'USUARIOS_LOGIN'             : params.userLogin,
                    'MOVIMENTOS_NFE'             : '',
                    'MOVIMENTOS_PROTOCOLO'       : '',
                    'MOVIMENTOS_BASEICMS'        : 0,
                    'MOVIMENTOS_VALORICMS'       : 0,
                    'MOVIMENTOS_BASEST'          : 0,
                    'MOVIMENTOS_VALORST'         : movimentoOrigem['MOVIMENTOS_VALORST'],
                    'MOVIMENTOS_VALORIPI'        : movimentoOrigem['MOVIMENTOS_VALORIPI'],
                    'MOVIMENTOS_IMPOSTO'         : movimentoOrigem['MOVIMENTOS_IMPOSTO'],
                    'MOVIMENTOS_FRETE'           : movimentoOrigem['MOVIMENTOS_FRETE'],
                    'MOVIMENTOS_DESCONTOS'       : movimentoOrigem['MOVIMENTOS_DESCONTOS'],
                    'MOVIMENTOS_PERCENTUAL'      : movimentoOrigem['MOVIMENTOS_PERCENTUAL'],
                    'MOVIMENTOS_PRODUTOS'        : movimentoOrigem['MOVIMENTOS_PRODUTOS'],
                    'MOVIMENTOS_SEGURO'          : movimentoOrigem['MOVIMENTOS_SEGURO'],
                    'MOVIMENTOS_DESPESAS'        : movimentoOrigem['MOVIMENTOS_DESPESAS'],
                    'MOVIMENTOS_TOTAL'           : movimentoOrigem['MOVIMENTOS_TOTAL'],
                    'MOVIMENTOS_OBSERVACOES'     : movimentoOrigem['MOVIMENTOS_OBSERVACOES'],
                    'MOVIMENTOS_FORMASPAGAMENTO' : formasTRE,
                    'MOVIMENTOS_ID_EMPRESAORIGEM': movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'MOVIMENTOS_NUMEROORIGEM'    : movimentoOrigem['MOVIMENTOS_NUMERO'],
                    'MOVIMENTOS_ID_PESSOAS'      : idEmpresaOrigem,
                    'MOVIMENTOS_ID_PROPRIEDADES' : movimentoOrigem['MOVIMENTOS_ID_PROPRIEDADES'],
                    'MOVIMENTOS_NOME'            : movimentoOrigem['EMPRESAS_FANTASIA'],
                    'MOVIMENTOS_EMAIL'           : movimentoOrigem['EMPRESAS_EMAIL'],
                    'MOVIMENTOS_CELULAR'         : movimentoOrigem['MOVIMENTOS_CELULAR'],                    
                    'MONTAGENS_VALOR'            : movimentoOrigem['MONTAGENS_VALOR'],
                    'MOVIMENTOS_ITENS'           : itensTRE,
                    'MOVIMENTOS_ENVIO'           : [],
                    'MOVIMENTOS_ID_DOCUMENTOS'   : novoDocumentoTRE['DOCUMENTOS_ID'],
                    'DOCUMENTOS_NOME'            : novoDocumentoTRE['DOCUMENTOS_NOME'],
                    'MOVIMENTOS_ID_OPERACOES'    : novoDocumentoTRE['DOCUMENTOS_ID_OPERACOES'],
                    'OPERACOES_ID_APLICACOES'    : novoDocumentoTRE['OPERACOES_ID_APLICACOES'],
                    'OPERACOES_FINANCEIRO'       : novoDocumentoTRE['OPERACOES_FINANCEIRO'],
                    'OPERACOES_UNICA'            : novoDocumentoTRE['OPERACOES_UNICA'],
                    'MOVIMENTOS_ITENSANTIGOS'    : itensAntigosTRE
                };

                await api.movimentos().create(novoMovimentoTRE, params);

                // Passo 2 - Gerando TRS
                const queryNovoDocumentoTRS = await api.documentos().read(Object.assign({}, params, {
                    conteudo: idEmpresaOrigem + '0007',// TRS
                    empresa:  idEmpresaOrigem,
                    ordem: '2',
                    status: 2,
                    start: 0,
                    limit: 1
                }));

                if(!queryNovoDocumentoTRS.results || !queryNovoDocumentoTRS.results[0]) {
                    throw 'Documento para geração de TRS não encontrado';
                }

                const novoDocumentoTRS = queryNovoDocumentoTRS.results[0];

                const itensAntigosTRS = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).map(item => {
                    return Object.assign({}, item);
                });

                const formasTRS = resetarIds(movimentoOrigem, 'MOVIMENTOS_FORMASPAGAMENTO', 'MOVIMENTOSFORMAS_ID');
                const itensTRS  = resetarIds(movimentoOrigem, 'MOVIMENTOS_ITENS',           'MOVIMENTOSITENS_ID')
                    .map(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = 700000;
                        item['MOVIMENTOSITENS_MARGEM'] = 0;
                        return item;
                    });

                const novoMovimentoTRS = {
                    'MOVIMENTOS_ID'              : 0,
                    'MOVIMENTOS_CPFCNPJ'         : movimentoOrigem['EMPRESAS_CPFCNPJ'],
                    'MOVIMENTOS_SERIEORIGEM'     : movimentoOrigem['MOVIMENTOS_SERIE'],
                    'MOVIMENTOS_ID_EMPRESAS'     : idEmpresaOrigem,
                    'MOVIMENTOS_ID_PRAZOS'       : movimentoOrigem['MOVIMENTOS_ID_PRAZOS'],
                    'MOVIMENTOS_ID_OPERACOES'    : 700000,
                    'MOVIMENTOS_ENTRADASAIDA'    : movimentoOrigem['MOVIMENTOS_ENTRADASAIDA'],
                    'MOVIMENTOS_STATUS'          : 'F',
                    'MOVIMENTOS_SITUACAO'        : 'A',
                    'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                    'USUARIOS_NOME'              : params.userLogin,
                    'USUARIOS_LOGIN'             : params.userLogin,
                    'MOVIMENTOS_NFE'             : '',
                    'MOVIMENTOS_PROTOCOLO'       : '',
                    'MOVIMENTOS_BASEICMS'        : 0,
                    'MOVIMENTOS_VALORICMS'       : 0,
                    'MOVIMENTOS_BASEST'          : 0,
                    'MOVIMENTOS_VALORST'         : movimentoOrigem['MOVIMENTOS_VALORST'],
                    'MOVIMENTOS_VALORIPI'        : movimentoOrigem['MOVIMENTOS_VALORIPI'],
                    'MOVIMENTOS_IMPOSTO'         : movimentoOrigem['MOVIMENTOS_IMPOSTO'],
                    'MOVIMENTOS_FRETE'           : movimentoOrigem['MOVIMENTOS_FRETE'],
                    'MOVIMENTOS_DESCONTOS'       : movimentoOrigem['MOVIMENTOS_DESCONTOS'],
                    'MOVIMENTOS_PERCENTUAL'      : movimentoOrigem['MOVIMENTOS_PERCENTUAL'],
                    'MOVIMENTOS_PRODUTOS'        : movimentoOrigem['MOVIMENTOS_PRODUTOS'],
                    'MOVIMENTOS_SEGURO'          : movimentoOrigem['MOVIMENTOS_SEGURO'],
                    'MOVIMENTOS_DESPESAS'        : movimentoOrigem['MOVIMENTOS_DESPESAS'],
                    'MOVIMENTOS_TOTAL'           : movimentoOrigem['MOVIMENTOS_TOTAL'],
                    'MOVIMENTOS_OBSERVACOES'     : movimentoOrigem['MOVIMENTOS_OBSERVACOES'],
                    'MOVIMENTOS_FORMASPAGAMENTO' : formasTRS,
                    'MOVIMENTOS_ID_EMPRESAORIGEM': movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'MOVIMENTOS_NUMEROORIGEM'    : movimentoOrigem['MOVIMENTOS_NUMERO'],
                    'MOVIMENTOS_ID_PESSOAS'      : idEmpresaDestino,
                    'MOVIMENTOS_ID_PROPRIEDADES' : movimentoOrigem['MOVIMENTOS_ID_PROPRIEDADES'],                    
                    'MOVIMENTOS_NOME'            : movimentoOrigem['EMPRESAS_FANTASIA'],
                    'MOVIMENTOS_EMAIL'           : movimentoOrigem['EMPRESAS_EMAIL'],
                    'MOVIMENTOS_CELULAR'         : movimentoOrigem['MOVIMENTOS_CELULAR'],
                    'MONTAGENS_VALOR'            : movimentoOrigem['MONTAGENS_VALOR'],
                    'MOVIMENTOS_ITENS'           : itensTRS,
                    'MOVIMENTOS_ENVIO'           : [],
                    'MOVIMENTOS_ID_DOCUMENTOS'   : novoDocumentoTRS['DOCUMENTOS_ID'],
                    'DOCUMENTOS_NOME'            : novoDocumentoTRS['DOCUMENTOS_NOME'],
                    'OPERACOES_ID_APLICACOES'    : novoDocumentoTRS['OPERACOES_ID_APLICACOES'],
                    'OPERACOES_FINANCEIRO'       : novoDocumentoTRS['OPERACOES_FINANCEIRO'],
                    'OPERACOES_UNICA'            : novoDocumentoTRS['OPERACOES_UNICA'],
                    'MOVIMENTOS_ITENSANTIGOS'    : itensAntigosTRS
                };
        
                const novoMovimentoTRSSalvo = await api.movimentos().create(novoMovimentoTRS, params);
                const idNovoMovimentoTRS = novoMovimentoTRSSalvo.results['MOVIMENTOS_ID'];
                const novoMovimentoTRSCompleto = await api.movimentos().readById(idNovoMovimentoTRS, params);

                if(!novoMovimentoTRSCompleto.results || !novoMovimentoTRSCompleto.results[0]){
                    throw `Falha ao recuperar movimento TRS salvo: ID: ${idNovoMovimentoTRS}`;
                }
                
                await atualizarOriginal(novoMovimentoTRS, movimentoOrigem, params);

                return { results: novoMovimentoTRSCompleto.results }
                
            // Segue procedimento normal se NÃO vier de nota ou requisição de entrada
            } else {
                const idEmpresa = movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'];

                const queryNovoDocumento = await api.documentos().read(Object.assign({}, params, {
                    conteudo: nomeNovoDocumento,
                    empresa:  idEmpresa,
                    ordem: '0',
                    status: 2,
                    start: 0,
                    limit: 1
                }))

                if(!queryNovoDocumento.results || !queryNovoDocumento.results[0]) {
                    throw 'Documento para geração de movimento não encontrado';
                }

                const novoDocumento = queryNovoDocumento.results[0];

                if(movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006') { // Se vier do pedido de compra
                    const temRecebido = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).some(item => {
                        const qtdProdutoRecebido  = item['MOVIMENTOSITENS_ENTREGUE'];
                        return qtdProdutoRecebido > 0;
                    });
                    if(!temRecebido){
                        throw 'Nada recebido no pedido de compra';
                    }                    
                }

                // Define frete/reserva/montagem

                let geraRetirada = '';

                if(isPrudenMoveis && nomeNovoDocumento == 'Pedidos') {                        
                    const valorMinimoUrb = cents(movimentoOrigem['EMPRESAS_CNAE'].split('|')[3] || 0);
                    const valorMinimoSub = cents(movimentoOrigem['EMPRESAS_CNAE'].split('|')[4] || 0);
                    const valorMovimento = cents(movimentoOrigem['MOVIMENTOS_TOTAL']) - cents(movimentoOrigem['MOVIMENTOS_FRETE']);
                    const isSuburbano = (movimentoOrigem['PESSOAS_ID_CIDADES'] != movimentoOrigem['EMPRESAS_ID_CIDADES']);

                    if((isSuburbano && valorMovimento < valorMinimoSub) ||
                    (!isSuburbano && valorMovimento < valorMinimoUrb)) {
                        geraRetirada = 'R';
                    }
                }        

                let valorST = 0;

                if(
                    nomeNovoDocumento.match(/Pedidos|Nota Eletrônica/) && 
                    movimentoOrigem['MOVIMENTOS_OBSERVACOES'].match(/ - VALORST: /)
                ) {
                    try {
                        const partes = movimentoOrigem['MOVIMENTOS_OBSERVACOES'].split(' - VALORST: (')[1];
                        const fim = partes.indexOf(')');
                        valorST = utils.number.cents(partes.slice(0, fim).replace('.','').replace(',','.')) / 100
                    } catch(error) {
                        console.log(error);
                    }
                }

                const itensAntigos = (movimentoOrigem['MOVIMENTOS_ITENS'] || []).map(item => {
                    return Object.assign({}, item);
                });

                const formas      = movimentoOrigem['OPERACOES_FINANCEIRO'] == 'O' ? resetarIds(movimentoOrigem, 'MOVIMENTOS_FORMASPAGAMENTO', 'MOVIMENTOSFORMAS_ID') : [];
                let transporte;

                if(novoDocumento['DOCUMENTOS_COLETATRANSPORTE'] == 'T' &&
                   movimentoOrigem['EMPRESAS_CPFCNPJ'] == '61446316000104' &&  // Prudenaço
                   movimentoOrigem['DOCUMENTOS_COLETATRANSPORTE'] == 'F') {
                   const pesoLiquido =  await calculaPesoLiquido(movimentoOrigem['MOVIMENTOS_ITENS']);
                   const pesoBruto = await calculaPesoBruto(movimentoOrigem['MOVIMENTOS_ITENS']);
                   transporte = [{
                            'MOVIMENTOSENVIO_ID': 0,
                            'MOVIMENTOSENVIO_ID_MOVIMENTOS': 0,
                            'MOVIMENTOSENVIO_ID_CIDADES': movimentoOrigem['EMPRESAS_ID_CIDADES'],
                            'MOVIMENTOSENVIO_REFERENTE' : '',
                            'MOVIMENTOSENVIO_QUANTIDADE' : 0,
                            'MOVIMENTOSENVIO_PESOLIQUIDO' : pesoLiquido,
                            'MOVIMENTOSENVIO_CEP' : '',
                            'MOVIMENTOSENVIO_ID_TRANSPORTES' : 1,
                            'MOVIMENTOSENVIO_PESOBRUTO' : pesoBruto,
                            'MOVIMENTOSENVIO_MODO': '',
                            'MOVIMENTOSENVIO_NOME': '',
                            'MOVIMENTOSENVIO_INSCRICAO': '',
                            'MOVIMENTOSENVIO_ENDERECO': '',
                            'MOVIMENTOSENVIO_NUMERO': '',
                            'MOVIMENTOSENVIO_BAIRRO': '',
                            'MOVIMENTOSENVIO_MOTORISTA': '',
                            'MOVIMENTOSENVIO_PLACA': '',
                            'MOVIMENTOSENVIO_PLACAUF': '',
                            'MOVIMENTOSENVIO_ESPECIE': '',
                            'MOVIMENTOSENVIO_MARCA': '',
                            'MOVIMENTOSENVIO_VOLUMES': ''
                        }] // fim do novo objeto
                } else {
                    transporte = resetarIds(movimentoOrigem, 'MOVIMENTOS_ENVIO',           'MOVIMENTOSENVIO_ID')                    
                    .map(item => {
                        item['MOVIMENTOSENVIO_REFERENTE'] = '';
                        return item;
                    })
                }

                const isNfeExportacao = nomeNovoDocumento.match(/Nota Eletrônica/) && 
                                         movimentoOrigem['PESSOAS_CATEGORIA'] == '3'
                
                let itens = resetarIds(movimentoOrigem, 'MOVIMENTOS_ITENS', 'MOVIMENTOSITENS_ID')
                    .map((item, index, itens) => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = (isNfeExportacao ? 710100 : novoDocumento['DOCUMENTOS_ID_OPERACOES']);

                        if(item['MOVIMENTOSITENS_MARGEM'] == 'null') {                            
                            item['MOVIMENTOSITENS_MARGEM'] = 0;
                        }
                        if(nomeNovoDocumento.toUpperCase().match(/ELETR/)) { // Se for nota eletrônica, cupom, etc.
                            item['MOVIMENTOSITENS_SEGURO'] = 0;
                            item['MOVIMENTOSITENS_MARGEM'] = item['MOVIMENTOSITENS_MARGEM'] || 0;
                            if(isPrudenMoveis) {
                                item['MOVIMENTOSITENS_FRETE'] = 0;
                            }
                            if(isRacaforte) {
                                if(item['MOVIMENTOSITENS_DESCONTOS'] > 0){
                                    const casasDecimaisPreco = 10;//calcula sempre com 10 casas pra não arredondar o preco
                                    const preco    = changeBase(item['MOVIMENTOSITENS_PRECO'], casasDecimaisPreco);
                                    const desconto = cents(item['MOVIMENTOSITENS_DESCONTOS']);
                                    const qtde     = grams(item['MOVIMENTOSITENS_QUANTIDADE']);

                                    const descontoPorUnidade = changeBase(desconto / qtde * 10, casasDecimaisPreco);
                                    const precoLiq = preco - descontoPorUnidade;
            
                                    item['MOVIMENTOSITENS_PRECO']     = precoLiq / (10 ** casasDecimaisPreco);
                                    //----------
                                    
                                    item['MOVIMENTOSITENS_TOTAL']     = Math.round(precoLiq * qtde / 1000 / (10 ** (casasDecimaisPreco - 2))) / 100;
                                    item['MOVIMENTOSITENS_DESCONTOS'] = 0;
                                    item['MOVIMENTOSITENS_PERCENTUAL'] = 0;
                                }
                            }
                        }

                        if(nomeNovoDocumento.toUpperCase().match(/ELETR/) &&  // Nota Pruden Aço
                           movimentoOrigem['EMPRESAS_CPFCNPJ'] == '61446316000104' &&
                           item['PRODUTOS_UNIDADE'] == 'KG') {
                            item['MOVIMENTOSITENS_QUANTIDADE'] = ((grams(item['MOVIMENTOSITENS_QUANTIDADE']) * grams(item['PRODUTOS_PESOLIQUIDO'])) / 1000000);
                            item['MOVIMENTOSITENS_PRECO']      = cents(((cents(item['TOTAL_LIQUIDO']) / grams(item['MOVIMENTOSITENS_QUANTIDADE'])) * 10)) / 100;
                        }

                        if(nomeNovoDocumento == 'Pedidos' || nomeNovoDocumento.toUpperCase().match(/DEVOLU/)) {
                            item['MOVIMENTOSITENS_ENTREGUE'] = item['MOVIMENTOSITENS_QUANTIDADE'];
                            item['MOVIMENTOSITENS_VALORPISST'] = item['SALDOS_PRECOMINIMO'];
                        } else {
                            item['MOVIMENTOSITENS_VALORPISST'] = 0;
                        }

                        if(valorST) {
                            const despesa = utils.number.cents(valorST) / itens.length;
                            item['MOVIMENTOSITENS_DESPESAS'] = (index == 0 ? Math.ceil(despesa) : Math.floor(despesa)) / 100
                        }

                        if(geraRetirada == 'R') {
                            item['MOVIMENTOSITENS_DATAENTREGA']  = hoje;
                            item['MOVIMENTOSITENS_DATAMONTAGEM'] = hoje;
                            item['MOVIMENTOSITENS_HORAENTREGA']  = 'N';
                            item['MOVIMENTOSITENS_HORAMONTAGEM'] = 'N';
                            item['MOVIMENTOSITENS_ENTREGUE']     = item['MOVIMENTOSITENS_QUANTIDADE'];
                            item['MOVIMENTOSITENS_DEPOSITO']     = 1;
                        }

                        return item;
                    })
                    .map(item => {
                        if(params.pedidoLP  == 'true') {
                            item['MOVIMENTOSITENS_PRECO']     = (item['MOVIMENTOSITENS_PRECO']     || 0) / 2;
                            item['MOVIMENTOSITENS_DESCONTOS'] = (item['MOVIMENTOSITENS_DESCONTOS'] || 0) / 2;
                            item['MOVIMENTOSITENS_TOTAL']     = (item['MOVIMENTOSITENS_TOTAL']     || 0) / 2;
                            item['MOVIMENTOSITENS_FRETE']     = (item['MOVIMENTOSITENS_FRETE']     || 0) / 2;
                            item['MOVIMENTOSITENS_SEGURO']    = (item['MOVIMENTOSITENS_SEGURO']    || 0) / 2;
                            item['MOVIMENTOSITENS_DESPESAS']  = (item['MOVIMENTOSITENS_DESPESAS']  || 0) / 2;
                        }

                        return item;
                    })

                // Se vier do pedido de compra deixa só os itens recebidos
                  if(movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006') {    
                    const itensRestantes = (itens || []).filter(restante => { 
                        restante['MOVIMENTOSITENS_QUANTIDADE'] = restante['MOVIMENTOSITENS_ENTREGUE'];
                        restante['MOVIMENTOSITENS_ENTREGUE'] = 0;
                        return grams(restante['MOVIMENTOSITENS_QUANTIDADE']) > 0;
                    });    
                    itens = itensRestantes;
                }

                const usarMarkup = process.env[params.client ? ((params.client || '').toUpperCase() + '_MARKUP') : 'MARKUP'] == 'TRUE';

                let novoMovimento = {
                    'aliquotas'                  : data['aliquotas'] || [],
                    'MOVIMENTOS_ID'              : 0,
                    'MOVIMENTOS_CPFCNPJ'         : movimentoOrigem['MOVIMENTOS_CPFCNPJ'],
                    'MOVIMENTOS_SERIEORIGEM'     : movimentoOrigem['MOVIMENTOS_SERIE'],
                    'MOVIMENTOS_ID_EMPRESAS'     : movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'EMPRESAS_CPFCNPJ'           : movimentoOrigem['EMPRESAS_CPFCNPJ'],
                    'EMPRESAS_CNAE'              : movimentoOrigem['EMPRESAS_CNAE'],
                    'MOVIMENTOS_ID_PRAZOS'       : movimentoOrigem['MOVIMENTOS_ID_PRAZOS'],
                    'MOVIMENTOS_ID_APLICACOES'   : movimentoOrigem['MOVIMENTOS_ID_APLICACOES'],
                    'MOVIMENTOS_ENTRADASAIDA'    : moment.tz(params.timezone).format('YYYY-MM-DD'),
                    'MOVIMENTOS_STATUS'          : (movimentoOrigem['DOCUMENTOS_NOME'].match(/Transfer/) || (movimentoOrigem['DOCUMENTOS_NOME'].match(/Compra/) && movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'] == 1)) ? 'F' : 'N',
                    'MOVIMENTOS_SITUACAO'        : novoDocumento['DOCUMENTOS_ID'].toString().slice(-4) == '0012' ? '0' :  // Devolução
                                                   movimentoOrigem['DOCUMENTOS_NOME'].match(/Transfer/) ? 'A' : 
                                                   movimentoOrigem['DOCUMENTOS_NOME'].match(/Compra/) ? '0' : 
                                                   (movimentoOrigem['MOVIMENTOS_SITUACAO'] || 'P'),
                    'MOVIMENTOS_ID_USUARIOS'     : movimentoOrigem['MOVIMENTOS_ID_USUARIOS'],
                    'USUARIOS_NOME'              : movimentoOrigem['USUARIOS_NOME'],
                    'USUARIOS_LOGIN'             : params.userLogin,
                    'MOVIMENTOS_NFE'             : novoDocumento['DOCUMENTOS_NOME'].toUpperCase().match(/ELETR/) ? '' : movimentoOrigem['MOVIMENTOS_NFE'],
                    'MOVIMENTOS_PROTOCOLO'       : '',
                    'MOVIMENTOS_BASEICMS'        : 0,
                    'MOVIMENTOS_VALORICMS'       : 0,
                    'MOVIMENTOS_BASEIBSCBS'      : 0,
                    'MOVIMENTOS_ALIQUOTAIBS'     : 0,
                    'MOVIMENTOS_VALORIBS'        : 0,                    
                    'MOVIMENTOS_ALIQUOTACBS'     : 0,
                    'MOVIMENTOS_VALORCBS'        : 0,                    
                    'MOVIMENTOS_BASEST'          : (nomeNovoDocumento == 'Pedidos' ? movimentoOrigem['MOVIMENTOS_BASEST'] : 0),
                    'MOVIMENTOS_VALORST'         : movimentoOrigem['MOVIMENTOS_VALORST'],
                    'MOVIMENTOS_VALORIPI'        : movimentoOrigem['MOVIMENTOS_VALORIPI'],
                    'MOVIMENTOS_IMPOSTO'         : movimentoOrigem['MOVIMENTOS_IMPOSTO'],
                    'MOVIMENTOS_FRETE'           : movimentoOrigem['MOVIMENTOS_FRETE'],
                    'MOVIMENTOS_DESCONTOS'       : isRacaforte ? 0 : movimentoOrigem['MOVIMENTOS_DESCONTOS'],
                    'MOVIMENTOS_PERCENTUAL'      : isRacaforte ? 0 : movimentoOrigem['MOVIMENTOS_PERCENTUAL'],
                    'MOVIMENTOS_PRODUTOS'        : movimentoOrigem['MOVIMENTOS_PRODUTOS'],
                    'MOVIMENTOS_TOTAL'           : (valorST + movimentoOrigem['MOVIMENTOS_TOTAL']),
                    'MOVIMENTOS_DESPESAS'        : (valorST || movimentoOrigem['MOVIMENTOS_DESPESAS']),
                    'MOVIMENTOS_SEGURO'          : movimentoOrigem['MOVIMENTOS_SEGURO'],
                    'MOVIMENTOS_OBSERVACOES'     : isCirurcenter ? '||||||||' : movimentoOrigem['MOVIMENTOS_OBSERVACOES'],
                    'MOVIMENTOS_FORMASPAGAMENTO' : formas,
                    'MOVIMENTOS_ID_EMPRESAORIGEM': movimentoOrigem['MOVIMENTOS_ID_EMPRESAS'],
                    'MOVIMENTOS_NUMEROORIGEM'    : movimentoOrigem['MOVIMENTOS_NUMERO'],
                    'MOVIMENTOS_ID_PESSOAS'      : movimentoOrigem['MOVIMENTOS_ID_PESSOAS'],
                    'MOVIMENTOS_ID_PROPRIEDADES' : movimentoOrigem['MOVIMENTOS_ID_PROPRIEDADES'],                    
                    'MOVIMENTOS_NOME'            : (nomeNovoDocumento.toUpperCase().match(/ELETR/) ? movimentoOrigem['PESSOAS_NOME'] : movimentoOrigem['MOVIMENTOS_NOME']),
                    'MOVIMENTOS_EMAIL'           : movimentoOrigem['MOVIMENTOS_EMAIL'],
                    'MOVIMENTOS_CELULAR'         : movimentoOrigem['MOVIMENTOS_CELULAR'],
                    'MONTAGENS_VALOR'            : movimentoOrigem['MONTAGENS_VALOR'],
                    'MOVIMENTOS_ITENS'           : itens,
                    'MOVIMENTOS_ENVIO'           : transporte,
                    'MOVIMENTOS_ID_DOCUMENTOS'   : novoDocumento['DOCUMENTOS_ID'],
                    'DOCUMENTOS_NOME'            : novoDocumento['DOCUMENTOS_NOME'],
                    'MOVIMENTOS_ID_OPERACOES'    : (isNfeExportacao ? 710100 : novoDocumento['DOCUMENTOS_ID_OPERACOES']),
                    'OPERACOES_ID_APLICACOES'    : novoDocumento['OPERACOES_ID_APLICACOES'],
                    'OPERACOES_FINANCEIRO'       : novoDocumento['OPERACOES_FINANCEIRO'],
                    'OPERACOES_UNICA'            : novoDocumento['OPERACOES_UNICA'],
                    'MOVIMENTOS_ID_CUSTOS'       : novoDocumento['OPERACOES_ID_CUSTOS'],
                    'CUSTOS_NOME'                : novoDocumento['CUSTOS_NOME'],
                    'MOVIMENTOS_ITENSANTIGOS'    : itensAntigos
                };

                if(isRacaforte && nomeNovoDocumento.match(/Nota Eletrônica/)) { // Partidas Vacinas Raçaforte
                    const campoVacina = (movimentoOrigem['MOVIMENTOS_OBSERVACOES'] || '').split('|').slice(6, 7).join() || '';
                    const arrVacina = campoVacina.split('#');
                    if((arrVacina || []).length > 0) {
                        novoMovimento['VACINA_NFE']              = arrVacina[0] || 'N';
                        novoMovimento['VETERINARIOS_ID']         = arrVacina[1] || '0';
                        novoMovimento['VETERINARIOS_NOME']       = arrVacina[2] || '';
                        novoMovimento['VETERINARIOS_CPFCNPJ']    = arrVacina[3] || '';
                        novoMovimento['VETERINARIOS_PARTIDA']    = arrVacina[4] || '';
                        novoMovimento['VETERINARIOS_FABRICACAO'] = arrVacina[5] || '';
                        novoMovimento['VETERINARIOS_VALIDADE']   = arrVacina[6] || '';    
                    }
                }


                if(movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == 
                     novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4)) {
                        throw 'Documento de destino não pode ser o mesmo da origem';
                }

                if(novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003') { // Nota Eletrônica
                    novoMovimento['MOVIMENTOS_SEGURO'] = 0; 
                }
                
                if(movimentoOrigem['OPERACOES_FINANCEIRO'] == 'O') {
                    await gerarCaixaAPartirDaFormaDePagamento(novoMovimento, movimentoOrigem, params);
                }

                if(nomeNovoDocumento == 'Pedidos' || nomeNovoDocumento.toUpperCase().match(/DEVOLU/)) {
                    await ratearPartidaPelosItens(novoMovimento);
                }

                if((movimentoOrigem['EMPRESAS_CPFCNPJ'] || '').match(/02704798|38167820|50203915/) &&        // Stilo Móveis
                    novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003') {              // Exportando pra NFe
                    novoMovimento['MOVIMENTOS_OBSERVACOES'] = '||||||||'                                     // Reseta a OBS
                }
        
                const freteCabecalho = cents(novoMovimento['MOVIMENTOS_FRETE']);
                const freteItens     = (itens.reduce((result, item) => {
                    const vlrFreteItem = cents(item['MOVIMENTOSITENS_FRETE']);
                    return result += vlrFreteItem;
                }, 0));

                if(nomeNovoDocumento.toUpperCase().match(/ELETR/)  && (freteCabecalho != freteItens)) {  // Se o frete for destacado e houver divergência
                    await ratearFretePelosItens(novoMovimento);                    // Refaz o rateio
                }

                if(movimentoOrigem['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) != '0006') { // Exceto pedido de compra
                    await calcularMargem(novoMovimento);
                }

                // Documento fiscal eletrônico: 10003, 20003, 30003, etc.
                // Usa os 4 últimos dígitos porque os primeiros identificam a empresa.
                const isNFe = novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'] &&
                              novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';

                // Avisa/faz fallback de IBS/CBS SOMENTE para clientes que habilitaram a calculadora.
                // Se a variável não existir ou estiver FALSE, o cliente ainda não usa a Calculadora IBS/CBS
                // e não deve receber aviso de indisponibilidade nem fallback de contingência.
                const nomeEnvCalculadoraIbsCbs = params.client
                    ? ((params.client || '').toUpperCase() + '_CALCULADORAIBS')
                    : 'CALCULADORAIBS';
                const usarCalculadoraIbsCbs = process.env[nomeEnvCalculadoraIbsCbs] == 'TRUE';

                if(isNFe) {
                    console.log(
                        `[IBS/CBS] Calculando NF-e. ` +
                        `Origem: ${movimentoOrigem['MOVIMENTOS_NUMERO']} ` +
                        `Documento: ${novoMovimento['MOVIMENTOS_ID_DOCUMENTOS']} ` +
                        `Operação: ${novoMovimento['MOVIMENTOS_ID_OPERACOES']} ` +
                        `Itens: ${(novoMovimento['MOVIMENTOS_ITENS'] || []).length}`
                    );

                    try {
                        const calculaImposto = await api['docsfiscais/calculoimposto']().create(novoMovimento, params);

                        if(calculaImposto.results && calculaImposto.results[0]) {
                            novoMovimento = calculaImposto.results[0];
                            await checarOperacao(novoMovimento);
                        } else {

                            if(usarCalculadoraIbsCbs) {
                                falhouCalculadoraIbsCbs = true;

                                avisoIbsCbs =
                                    'ATENÇÃO: A Calculadora IBS/CBS está inoperante. ' +
                                    'A nota foi gerada utilizando os valores padrão de contingência.';

                                console.log(
                                    `[IBS/CBS][FALLBACK] Calculadora não retornou resultado. ` +
                                    `Pedido=${movimentoOrigem['MOVIMENTOS_NUMERO']} ` +
                                    `Documento=${novoMovimento['MOVIMENTOS_ID_DOCUMENTOS']}. ` +
                                    `Aplicando valores padrão e continuando a gravação.`
                                );
                            } else {
                                console.log(
                                    `[IBS/CBS] Calculadora desabilitada (${nomeEnvCalculadoraIbsCbs} != TRUE). ` +
                                    `Nenhum aviso/fallback IBS/CBS será enviado ao usuário.`
                                );
                            }
                        }
                    } catch(error) {

                        if(usarCalculadoraIbsCbs) {
                            falhouCalculadoraIbsCbs = true;

                            avisoIbsCbs = 'ATENÇÃO: A Calculadora IBS/CBS está inoperante. ' +
                                          'A nota foi gerada utilizando os valores padrão de contingência.';

                            console.log(
                                `[IBS/CBS][FALLBACK] Falha na calculadora. ` +
                                `Pedido=${movimentoOrigem['MOVIMENTOS_NUMERO']} ` +
                                `Documento=${novoMovimento['MOVIMENTOS_ID_DOCUMENTOS']}. ` +
                                `Aplicando valores padrão e continuando a gravação.`
                            );
                        } else {
                            console.log(
                                `[IBS/CBS] Calculadora desabilitada (${nomeEnvCalculadoraIbsCbs} != TRUE). ` +
                                `Erro no cálculo fiscal não será tratado como indisponibilidade da Calculadora IBS/CBS.`
                            );
                        }

                        console.log(error);
                    }

                    if(falhouCalculadoraIbsCbs) {

                        let totalBaseIbsCbs = 0;
                        let totalValorIbs   = 0;
                        let totalValorCbs   = 0;

                        (novoMovimento['MOVIMENTOS_ITENS'] || []).forEach(item => {

                            const baseIbsCbs =
                                (Number(item['MOVIMENTOSITENS_TOTAL']) || 0) +
                                (Number(item['MOVIMENTOSITENS_FRETE']) || 0) +
                                (Number(item['MOVIMENTOSITENS_SEGURO']) || 0) +
                                (Number(item['MOVIMENTOSITENS_DESPESAS']) || 0);

                            const valorIbs = Math.round(baseIbsCbs * 0.001 * 100) / 100;
                            const valorCbs = Math.round(baseIbsCbs * 0.009 * 100) / 100;

                            item['MOVIMENTOSITENS_CCLASSTRIB']   = '000001';
                            item['MOVIMENTOSITENS_CSTIBSCBS']    = '000';
                            item['MOVIMENTOSITENS_BASEIBSCBS']   = baseIbsCbs;

                            item['MOVIMENTOSITENS_ALIQUOTAIBS']  = 0.1;
                            item['MOVIMENTOSITENS_VALORIBS']     = valorIbs;

                            item['MOVIMENTOSITENS_ALIQUOTACBS']  = 0.9;
                            item['MOVIMENTOSITENS_VALORCBS']     = valorCbs;

                            totalBaseIbsCbs += baseIbsCbs;
                            totalValorIbs   += valorIbs;
                            totalValorCbs   += valorCbs;

                            console.log(
                                `[IBS/CBS][FALLBACK] Item padrão aplicado. ` +
                                `Produto=${item['MOVIMENTOSITENS_ID_PRODUTOS'] || ''} ` +
                                `Base=${baseIbsCbs.toFixed(2)} ` +
                                `IBS=${valorIbs.toFixed(2)} ` +
                                `CBS=${valorCbs.toFixed(2)}`
                            );
                        });

                        // Mestre
                        novoMovimento['MOVIMENTOS_BASEIBSCBS']  =
                            Math.round(totalBaseIbsCbs * 100) / 100;

                        novoMovimento['MOVIMENTOS_ALIQUOTAIBS'] = 0.1;

                        novoMovimento['MOVIMENTOS_VALORIBS'] =
                            Math.round(totalValorIbs * 100) / 100;

                        novoMovimento['MOVIMENTOS_ALIQUOTACBS'] = 0.9;

                        novoMovimento['MOVIMENTOS_VALORCBS'] =
                            Math.round(totalValorCbs * 100) / 100;

                        console.log(
                            `[IBS/CBS][FALLBACK] Mestre padrão aplicado. ` +
                            `Base=${novoMovimento['MOVIMENTOS_BASEIBSCBS'].toFixed(2)} ` +
                            `IBS=${novoMovimento['MOVIMENTOS_VALORIBS'].toFixed(2)} ` +
                            `CBS=${novoMovimento['MOVIMENTOS_VALORCBS'].toFixed(2)}`
                        );
                    }                    

                }

                if(params.pedidoLP  == 'true') {
                    novoMovimento['MOVIMENTOS_IMPOSTO']    = novoMovimento['MOVIMENTOS_IMPOSTO']   / 2;
                    novoMovimento['MOVIMENTOS_FRETE']      = novoMovimento['MOVIMENTOS_FRETE']     / 2;
                    novoMovimento['MOVIMENTOS_DESCONTOS']  = novoMovimento['MOVIMENTOS_DESCONTOS'] / 2;
                    novoMovimento['MOVIMENTOS_PRODUTOS']   = novoMovimento['MOVIMENTOS_PRODUTOS']  / 2;
                    novoMovimento['MOVIMENTOS_TOTAL']      = novoMovimento['MOVIMENTOS_TOTAL']     / 2;
                    novoMovimento['MOVIMENTOS_SEGURO']     = usarMarkup ? 0 : novoMovimento['MOVIMENTOS_SEGURO'] / 2;
                }

                if(novoDocumento['OPERACOES_FINANCEIRO'] == 'R') {
                    novoMovimento['MOVIMENTOS_CAIXA']       = resetarIds(movimentoOrigem, 'MOVIMENTOS_CAIXA',       'MOVIMENTOSCAIXA_ID');
                    novoMovimento['MOVIMENTOS_CARTOES']     = resetarIds(movimentoOrigem, 'MOVIMENTOS_CARTOES',     'CARTOES_ID');
                    novoMovimento['MOVIMENTOS_CHEQUES']     = resetarIds(movimentoOrigem, 'MOVIMENTOS_CHEQUES',     'CHEQUES_ID');
                    novoMovimento['MOVIMENTOS_FINANCEIROS'] = resetarIds(movimentoOrigem, 'MOVIMENTOS_FINANCEIROS', 'FINANCEIROS_ID');
                
                    novoMovimento['MOVIMENTOS_CARTOES'].map(cartao => {
                        cartao['CARTOES_ID_DOCUMENTOS'] = novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'];
                    });

                    novoMovimento['MOVIMENTOS_CHEQUES'].map(cheque => {
                        cheque['CHEQUES_ID_DOCUMENTOS'] = novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'];
                    });

                    novoMovimento['MOVIMENTOS_FINANCEIROS'].map(financeiro => {

                        financeiro['FINANCEIROS_EMISSAO'] = hoje;
                        

                        if(movimentoOrigem['EMPRESAS_CPFCNPJ'] == '03375328000180' || 
                           movimentoOrigem['EMPRESAS_CPFCNPJ'] == '05971492000186') { // Hospitalar e biomart prorroga o financeiro
                            const prazoDias = parseInt(financeiro['PRAZO_DIAS']) || 0;
                            const dtEmissao = moment(financeiro['FINANCEIROS_EMISSAO']).format('YYYY-MM-DD');
                            financeiro['FINANCEIROS_VENCIMENTO'] = moment(dtEmissao).add(prazoDias, 'days').format('YYYY-MM-DD');
                        }

                        financeiro['FINANCEIROS_ID_DOCUMENTOS'] = novoMovimento['MOVIMENTOS_ID_DOCUMENTOS'];

                        //caso o pedido seja de data anterior, atualiza a data do financeiro na nota
                        if(moment(financeiro['FINANCEIROS_VENCIMENTO'], 'YYYY-MM-DD').isBefore()) {
                            financeiro['FINANCEIROS_VENCIMENTO'] = hoje;
                        }
                    });

                }

                // Em produção, nunca interrompe a gravação por IBS/CBS. Apenas registra o estado final.
                if(isNFe) {
                    const itensSemIbsCbs = (novoMovimento['MOVIMENTOS_ITENS'] || []).filter(item => {
                        return !String(item['MOVIMENTOSITENS_CCLASSTRIB'] || '').trim();
                    });

                    console.log(
                        `[IBS/CBS] NF-e antes de gravar: ` +
                        `Pedido=${movimentoOrigem['MOVIMENTOS_NUMERO']} ` +
                        `Documento=${novoMovimento['MOVIMENTOS_ID_DOCUMENTOS']} ` +
                        `Itens=${(novoMovimento['MOVIMENTOS_ITENS'] || []).length} ` +
                        `SemIBSCBS=${itensSemIbsCbs.length}`
                    );
                }

                const novoMovimentoSalvo = await api.movimentos().create(novoMovimento, params);
                const idNovoMovimento = novoMovimentoSalvo.results['MOVIMENTOS_ID'];
                const novoMovimentoCompleto = await api.movimentos().readById(idNovoMovimento, params);

                if(!novoMovimentoCompleto.results || !novoMovimentoCompleto.results[0]){
                    throw `Falha ao recuperar movimento salvo: ID: ${idNovoMovimento}`;
                }
                
                await atualizarOriginal(novoMovimento, movimentoOrigem, params);

                if(nomeNovoDocumento == 'Pedidos') {
                    await gerarTransferencia(novoMovimento, params); // Gerar lançamento bancário
                }

                if(novoMovimentoCompleto.results[0]['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0016') { // Se for transferência de entrada
                    const itensTransfer = novoMovimentoCompleto.results[0]['MOVIMENTOS_ITENS'];
                    const itensEtiqueta = itensTransfer.some(item => item['MOVIMENTOSITENS_EXCECAO'] == 'L');
                    if(itensEtiqueta) {
                        await gerarEtiquetas(novoMovimentoCompleto.results[0], params);
                    }
                }

                const movimentoBase = novoMovimentoCompleto.results[0];                                    
                                
                if(geraRetirada == 'R') { // gerar romaneio cliente retirou, caso valor esteja abaixo do mínimo valor entrega URB e SUB e seja um novo pedido
                    let itemRomaneio = [{
                        'ROMANEIOSITENS_ID': 0,
                        'ROMANEIOSITENS_ID_ROMANEIOS': 0,
                        'ROMANEIOSITENS_ID_MOVIMENTOS': movimentoBase['MOVIMENTOS_ID'],
                        'ROMANEIOSITENS_ID_ITEM': 0,
                        'ROMANEIOSITENS_QUANTIDADE' : 1,
                        'ROMANEIOSITENS_QUANTIDADE' : 1,
                        'ROMANEIOSITENS_TOTAL' : 0,
                        'ROMANEIOSITENS_STATUS' : 'T'
                    }] 
                        
                    let novoRomaneio = {
                        'ROMANEIOS_ID'             : 0,
                        'ROMANEIOS_ID_MOVIMENTOS'  : movimentoBase['MOVIMENTOS_ID'],
                        'ROMANEIOS_ID_EMPRESAS'    : movimentoBase['MOVIMENTOS_ID_EMPRESAS'],
                        'ROMANEIOS_ID_TRANSPORTES' : 1,
                        'ROMANEIOS_ID_PESSOAS'     : movimentoBase['MOVIMENTOS_ID_PESSOAS'],
                        'ROMANEIOS_ID_USUARIOS'    : movimentoBase['MOVIMENTOS_ID_USUARIOS'],
                        'ROMANEIOS_ID_OPERACOES'   : 0,
                        'ROMANEIOS_ID_DOCUMENTOS'  : ((cents(movimentoBase['MOVIMENTOS_ID_EMPRESAS']) * 100) + 10),
                        'ROMANEIOS_OBSERVACOES'    : 'CLIENTE RETIROU||||||||||',
                        'ROMANEIOS_PLACA'          : 'E',
                        'ROMANEIOS_LOCAL'          : (movimentoBase['PESSOAS_ID_CIDADES'] != movimentoBase['EMPRESAS_ID_CIDADES'] ? 'S' : 'U'),
                        'ROMANEIOS_STATUS'         : 'R',
                        'ROMANEIOS_LOG'            : movimentoBase['MOVIMENTOS_LOG'],
                        'ROMANEIOS_FRETE'          : 0,
                        'ROMANEIOS_ITENS'          : itemRomaneio
                    };
        
                    await api.romaneiosmoveis().create(novoRomaneio, params);
                }

                // gerando o financeiro
                if(isRacaforte && 
                    movimentoBase['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003' &&
                    movimentoBase['OPERACOES_FINANCEIRO'] == 'R' &&
                    movimentoBase['MOVIMENTOS_SITUACAO'] == 'A') { // Exportando para NF/Boleto Raçaforte
                     const parBoleto = (movimentoBase['PRAZOS_PARCELAS'] || 1) ;
                     const vlrBoleto = cents(movimentoBase['MOVIMENTOS_TOTAL']);
                     const parcelamento = (movimentoBase['PRAZOS_PARCELAMENTO'] || '').split('#') ;
                     let financeiros = [];
                     
                     const resto = vlrBoleto % parcelamento.length;
                 
                     parcelamento.forEach((days, index) => {
                         const vcto = moment(hoje).add(days, 'days').format('YYYY-MM-DD');
                                 
                         const vlrOriginal = cents(parseInt(vlrBoleto / parBoleto) / 100) + (index === 0 ? resto : 0);
         
                         const titulo = {
                             'FINANCEIROS_ID'               : (index + 2) * -1,
                             'FINANCEIROS_NUMERO'           : movimentoBase['MOVIMENTOS_NUMERO'], 
                             'FINANCEIROS_SERIE'            : movimentoBase['MOVIMENTOS_SERIE'], 
                             'FINANCEIROS_TIPO'             : movimentoBase['OPERACOES_FINANCEIRO'], 
                             'FINANCEIROS_ID_MOVIMENTOS'    : movimentoBase['MOVIMENTOS_ID'], 
                             'FINANCEIROS_ID_DOCUMENTOS'    : movimentoBase['MOVIMENTOS_ID_DOCUMENTOS'], 
                             'FINANCEIROS_ID_PESSOAS'       : movimentoBase['MOVIMENTOS_ID_PESSOAS'],
                             'FINANCEIROS_ID_USUARIOS'      : movimentoBase['MOVIMENTOS_ID_USUARIOS'],
                             'FINANCEIROS_ID_PORTADORES'    : params.portadorEmpresa,
                             'FINANCEIROS_ID_APLICACOES'    : movimentoBase['OPERACOES_ID_APLICACOES'] || 1,
                             'FINANCEIROS_ID_PRAZOS'        : movimentoBase['MOVIMENTOS_ID_PRAZOS'],
                             'FINANCEIROS_PARCELAS'         : parBoleto,
                             'FINANCEIROS_PARCELA'          : index + 1,
                             'FINANCEIROS_EMISSAO'          : hoje,
                             'FINANCEIROS_VENCIMENTO'       : vcto,
                             'FINANCEIROS_BAIXA'            : '1899-12-30',
                             'FINANCEIROS_PAGAMENTO'        : '1899-12-30',
                             'FINANCEIROS_ORIGINAL'         : vlrOriginal / 100,
                             'FINANCEIROS_ABERTO'           : vlrOriginal / 100,
                             'FINANCEIROS_PAGO'             : 0,
                             'FINANCEIROS_TOTAL'            : vlrBoleto / 100,
                             'FINANCEIROS_STATUS'           : 'A',
                             'FINANCEIROS_ID_EMPRESAS'      : movimentoBase['MOVIMENTOS_ID_EMPRESAS'],
                             'FINANCEIROS_NOSSONUMERO'      : 0,
                             'FINANCEIROS_ID_EMPRESAORIGEM' : 0,
                             'FINANCEIROS_NUMEROORIGEM'     : 0,
                             'FINANCEIROS_SERIEORIGEM'      : '',
                             'FINANCEIROS_BOLETO'           : '',
                             'FINANCEIROS_DESCONTOS'        : 0,
                             'FINANCEIROS_JUROS'            : 0,
                             'FINANCEIROS_TAXAS'            : 0,
                             'FINANCEIROS_OBSERVACOES'      : '',
                             'FINANCEIROS_EXPORTADO'        : 'F'
                         }
         
                         financeiros.push(titulo);
                     });

                     // grava o financeiro individualmente
                     await api.financeiros().lote.create(financeiros, params); 
                 }
 
                // fim do gerando financeiro

                const produtosEditaveis = (itens || []).filter(produto => {
                    return produto['PRODUTOS_EDITAVEL'] == 'T';
                });
    
                //produtos editáveis
                if(produtosEditaveis.length > 0 && isMovimentoSaida) {
                    await api['relacoesitens']().create({
                        idmovimento: idNovoMovimento,
                        itens      : produtosEditaveis
                    }, params);    
                }

                const geradoCompleto = await api.movimentos().readById(idNovoMovimento, params);

                return {
                    results: geradoCompleto.results,
                    warning: avisoIbsCbs || ''
                };

            }
            
        } catch(error) {
            const msg = 'Falha ao exportar movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const resetarIds = function(model, campoLista, campoId) {
    const lista = model[campoLista] || [];
    
    return lista.map((model, index) => {
        const novoItem = Object.assign({}, model);
        novoItem[campoId] = (parseInt(index) + 1) * -1;
        return novoItem;
    });
};

const gerarCaixaAPartirDaFormaDePagamento = async function(novo, original, params) {
    const formasDePagamento = original['MOVIMENTOS_FORMASPAGAMENTO'] ? original['MOVIMENTOS_FORMASPAGAMENTO'][0] : null;

    if(formasDePagamento) {
        const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
        const hora = moment.tz(params.timezone).format('HH:mm:ss');
        const log  = novo['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')

        // Número de parcelas
        const parCredito    = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCCREDITO']    || 0);
        const parChequePre  = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE']  || 0);
        const parCarne      = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCDUPLICATA']  || 0);
        const parFinanceira = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCFINANCEIRA'] || 0);

        // Valor de cada parcela
        const vlpCredito    = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRCREDITO']);
        const vlpChequePre  = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRCHEQUEPRE']);
        const vlpCarne      = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRDUPLICATA']);
        const vlpFinanceira = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']);

        // Valor total
        const credito    = cents(formasDePagamento['MOVIMENTOSFORMAS_CREDITO']);
        const chequePre  = cents(formasDePagamento['MOVIMENTOSFORMAS_CHEQUEPRE']);
        const carne      = cents(formasDePagamento['MOVIMENTOSFORMAS_DUPLICATA']);

        const vlrCredito    = (Math.abs((parCredito   * vlpCredito)   - credito)   > 10 ? (parCredito   * vlpCredito)   : credito);
        const vlrChequePre  = (Math.abs((parChequePre * vlpChequePre) - chequePre) > 10 ? (parChequePre * vlpChequePre) : chequePre);
        const vlrCarne      = (Math.abs((parCarne     * vlpCarne)     - carne)     > 10 ? (parCarne     * vlpCarne)     : carne);
        const vlrFinanceira = cents(formasDePagamento['MOVIMENTOSFORMAS_FINANCEIRA']);

        const vlrDinheiro       = cents(formasDePagamento['MOVIMENTOSFORMAS_DINHEIRO']);
        const vlrTransferencia  = cents(formasDePagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS']);
        const vlrDebito         = cents(formasDePagamento['MOVIMENTOSFORMAS_DEBITO']);
        const vlrCheque         = cents(formasDePagamento['MOVIMENTOSFORMAS_CHEQUE']);
        
        const vctChequePre  = moment(formasDePagamento['MOVIMENTOSFORMAS_VCTCHEQUEPRE']  || '1899-12-30');
        const vctCarne      = moment(formasDePagamento['MOVIMENTOSFORMAS_VCTDUPLICATA']  || '1899-12-30');
        const vctFinanceira = moment(formasDePagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] || '1899-12-30');
        
        const vlrCreditoPessoa = original['MOVIMENTOS_VALORIPI'] || 0; // Usado pra persistir o crédito do cliente, quando houver.

        const cartoes        = [];
        const cheques        = [];
        const financeiros    = [];
        
        const caixa = {
            'MOVIMENTOSCAIXA_ID'             : -1,
            'MOVIMENTOSCAIXA_ID_PESSOAS'     : original['MOVIMENTOS_ID_PESSOAS'],
            'MOVIMENTOSCAIXA_ID_APLICACOES'  : novo['OPERACOES_ID_APLICACOES'],
            'MOVIMENTOSCAIXA_NOME'           : '[SERIE] [NUMERO] ' + original['MOVIMENTOS_NOME'].toString().replace(/'/ig, ''),
            'MOVIMENTOSCAIXA_TIPO'           : novo['OPERACOES_TIPO'] == 'E' ? 'S' : 'E',
            'MOVIMENTOSCAIXA_DINHEIRO'       : vlrDinheiro / 100,
            'MOVIMENTOSCAIXA_TRANSFERENCIAS' : vlrTransferencia / 100,
            'MOVIMENTOSCAIXA_DEBITO'         : vlrDebito / 100,
            'MOVIMENTOSCAIXA_CHEQUE'         : (vlrCheque + vlrChequePre) / 100,
            'MOVIMENTOSCAIXA_CREDITO'        : vlrCredito / 100,
            'MOVIMENTOSCAIXA_DUPLICATA'      : vlrCarne / 100,
            'MOVIMENTOSCAIXA_OUTRO'          : vlrFinanceira / 100,
            'MOVIMENTOSCAIXA_VENCIMENTO'     : hoje,
            'MOVIMENTOSCAIXA_EXPORTADO'      : 'N',
            'MOVIMENTOSCAIXA_ID_EMPRESAS'    : novo['MOVIMENTOS_ID_EMPRESAS'],
            'MOVIMENTOSCAIXA_ID_USUARIOS'    : novo['MOVIMENTOS_ID_USUARIOS'],
            'MOVIMENTOSCAIXA_STATUS'         : 'A',
            'MOVIMENTOSCAIXA_ID_MOVIMENTOS'  : 0,
            'MOVIMENTOSCAIXA_ID_FINANCEIROS' : 0,
            'MOVIMENTOSCAIXA_EMISSAO'        : hoje,
            'MOVIMENTOSCAIXA_HORA'           : hora,
            'MOVIMENTOSCAIXA_TROCO'          : 0,
            'MOVIMENTOSCAIXA_CREDITOLOJA'    : 0,
            'MOVIMENTOSCAIXA_CREDITOPESSOA'  : original['MOVIMENTOS_VALORIPI'] || 0,
            'MOVIMENTOSCAIXA_ALIMENTACAO'    : 0,
            'MOVIMENTOSCAIXA_REFEICAO'       : 0,
            'MOVIMENTOSCAIXA_PRESENTE'       : 0,
            'MOVIMENTOSCAIXA_COMBUSTIVEL'    : 0,
            'MOVIMENTOSCAIXA_BOLETO'         : 0,
            'MOVIMENTOSCAIXA_LOG'            : log,
        };


        if(vlrDebito > 0) {
            const debito = {
                'CARTOES_ID'           : -1,
                'CARTOES_TIPO'         : 'D',
                'CARTOES_PARCELAS'     : 1,
                'CARTOES_VALOR'        : vlrDebito / 100,
                'CARTOES_EMISSAO'      : hoje,
                'CARTOES_ORIGEM'       : novo['MOVIMENTOS_NUMERO'],
                'CARTOES_SERIE'        : novo['MOVIMENTOS_SERIE'],
                'CARTOES_PAGO'         : 0,
                'CARTOES_TAXA'         : 0,
                'CARTOES_ID_OPERADORAS': 0,
                'CARTOES_ID_MOVIMENTOS': novo['MOVIMENTOS_ID'],
                'CARTOES_ID_DOCUMENTOS': novo['MOVIMENTOS_ID_DOCUMENTOS'],
                'CARTOES_STATUS'       : 'A',
                'CARTOES_ID_EMPRESAS'  : novo['MOVIMENTOS_ID_EMPRESAS'],
                'CARTOES_CONVENIO'     : '',
                'CARTOES_AUTORIZACAO'  : '',
                'CARTOES_NUMERO'       : '',
                'CARTOES_OBSERVACOES'  : '',
                'CARTOES_LOG'          : log
            }

            cartoes.push(debito);
        }

        if(vlrCredito > 0) {
            const credito = {
                'CARTOES_ID'           : -2,
                'CARTOES_TIPO'         : 'C',
                'CARTOES_PARCELAS'     : parCredito,
                'CARTOES_VALOR'        : vlrCredito / 100,
                'CARTOES_EMISSAO'      : hoje,
                'CARTOES_ORIGEM'       : novo['MOVIMENTOS_NUMERO'],
                'CARTOES_SERIE'        : novo['MOVIMENTOS_SERIE'],
                'CARTOES_PAGO'         : 0,
                'CARTOES_TAXA'         : 0,
                'CARTOES_ID_OPERADORAS': 0,
                'CARTOES_ID_MOVIMENTOS': novo['MOVIMENTOS_ID'],
                'CARTOES_ID_DOCUMENTOS': novo['MOVIMENTOS_ID_DOCUMENTOS'],
                'CARTOES_STATUS'       : 'A',
                'CARTOES_ID_EMPRESAS'  : novo['MOVIMENTOS_ID_EMPRESAS'],
                'CARTOES_CONVENIO'     : '',
                'CARTOES_AUTORIZACAO'  : '',
                'CARTOES_NUMERO'       : '',
                'CARTOES_OBSERVACOES'  : '',
                'CARTOES_LOG'          : log
            }

            cartoes.push(credito);
        }

        if(vlrCheque > 0) {
            const cheque = {
                'CHEQUES_ID'           : -1,
                'CHEQUES_ID_MOVIMENTOS': novo['MOVIMENTOS_ID'],
                'CHEQUES_ORIGEM'       : novo['MOVIMENTOS_NUMERO'],
                'CHEQUES_SERIE'        : novo['MOVIMENTOS_SERIE'],
                'CHEQUES_ID_DOCUMENTOS': novo['MOVIMENTOS_ID_DOCUMENTOS'],
                'CHEQUES_ID_BANCOS'    : 0,
                'CHEQUES_AGENCIA'      : '',
                'CHEQUES_CONTA'        : '',
                'CHEQUES_NUMERO'       : '',
                'CHEQUES_VALOR'        : vlrCheque / 100,
                'CHEQUES_EMISSAO'      : hoje,
                'CHEQUES_LANCADO'      : hoje,
                'CHEQUES_VENCIMENTO'   : hoje,
                'CHEQUES_DEPOSITO'     : '1899-12-30',
                'CHEQUES_REPASSE'      : '1899-12-30',
                'CHEQUES_BAIXA'        : '1899-12-30',
                'CHEQUES_CPFCNPJ'      : (original['MOVIMENTOS_CPFCNPJ'] || '').replace(/[^0-9]/g, ''),
                'CHEQUES_NOME'         : original['MOVIMENTOS_NOME'],
                'CHEQUES_ENDERECO'     : original['PESSOAS_ENDERECO'],
                'CHEQUES_NRORESIDENCIA': original['PESSOAS_NUMERO'],
                'CHEQUES_BAIRRO'       : original['PESSOAS_BAIRRO'],
                'CHEQUES_CEP'          : (original['PESSOAS_CEP'] || '').replace(/[^0-9]/g, ''),
                'CHEQUES_TELEFONE'     : (original['PESSOAS_TELEFONE'] || '').replace(/[^0-9]/g, ''),
                'CHEQUES_CELULAR'      : (original['MOVIMENTOS_CELULAR'] || '').replace(/[^0-9]/g, ''),
                'CHEQUES_ID_CIDADES'   : original['PESSOAS_ID_CIDADES'],
                'CHEQUES_ID_EMPRESAS'  : novo['MOVIMENTOS_ID_EMPRESAS'],
                'CHEQUES_ID_PESSOAS'   : 0,
                'CHEQUES_STATUS'       : 'A',
                'CHEQUES_LOG'          : log
            }

            cheques.push(cheque);
        }

        if(vlrChequePre > 0) {
            const parcelamento = [];
            for (let i = 0; i < parChequePre; i++) {
                parcelamento.push(i * 30);
            }
    
            const resto = vlrChequePre % parcelamento.length;
    
            parcelamento.forEach((days, index) => {
                const vcto = moment(vctChequePre).add(days, 'days').format('YYYY-MM-DD');
                const vlrOriginal = parseInt(vlrChequePre / parChequePre) / 100 + (index === 0 ? resto / 100 : 0);
                const chequePre = {
                    'CHEQUES_ID'           : (index + 2) * -1,
                    'CHEQUES_ID_EMPRESAS'  : novo['MOVIMENTOS_ID_EMPRESAS'],
                    'CHEQUES_ID_BANCOS'    : 0,
                    'CHEQUES_AGENCIA'      : '',
                    'CHEQUES_CONTA'        : '',
                    'CHEQUES_NUMERO'       : '',
                    'CHEQUES_ORIGEM'       : novo['MOVIMENTOS_NUMERO'], 
                    'CHEQUES_SERIE'        : novo['MOVIMENTOS_SERIE'], 
                    'CHEQUES_ID_MOVIMENTOS': novo['MOVIMENTOS_ID'], 
                    'CHEQUES_ID_DOCUMENTOS': novo['MOVIMENTOS_ID_DOCUMENTOS'], 
                    'CHEQUES_CPFCNPJ'      : (original['MOVIMENTOS_CPFCNPJ'] || '').replace(/[^0-9]/g, ''),
                    'CHEQUES_NOME'         : original['MOVIMENTOS_NOME'],
                    'CHEQUES_ENDERECO'     : original['PESSOAS_ENDERECO'],
                    'CHEQUES_NRORESIDENCIA': original['PESSOAS_NUMERO'],
                    'CHEQUES_BAIRRO'       : original['PESSOAS_BAIRRO'],
                    'CHEQUES_CEP'          : (original['PESSOAS_CEP'] || '').replace(/[^0-9]/g, ''),
                    'CHEQUES_TELEFONE'     : (original['PESSOAS_TELEFONE'] || '').replace(/[^0-9]/g, ''),
                    'CHEQUES_CELULAR'      : (original['MOVIMENTOS_CELULAR'] || '').replace(/[^0-9]/g, ''),
                    'CHEQUES_ID_CIDADES'   : original['PESSOAS_ID_CIDADES'],
                    'CIDADES_NOME'         : original['CIDADES_NOME'],
                    'CIDADES_ESTADO'       : original['CIDADES_ESTADO'],
                    'CHEQUES_EMISSAO'      : hoje,
                    'CHEQUES_LANCADO'      : hoje,
                    'CHEQUES_VENCIMENTO'   : vcto,
                    'CHEQUES_DEPOSITO'     : '1899-12-30',
                    'CHEQUES_REPASSE'      : '1899-12-30',
                    'CHEQUES_BAIXA'        : '1899-12-30',
                    'CHEQUES_VALOR'        : vlrOriginal,
                    'CHEQUES_STATUS'       : 'A',
                    'CHEQUES_ID_PESSOAS'   : 0,
                    'CHEQUES_LOG'          : log
                };

                cheques.push(chequePre);
            });
        }

        if(vlrCarne > 0) {
            const parcelamento = [];
            for (let i = 0; i < parCarne; i++) {
                parcelamento.push(i * 30);
            }

            const resto = vlrCarne % parcelamento.length;

            const queryPrazo = await api['consultas/getidprazo']().read(Object.assign({}, params, { parcelas: parCarne }));
            const prazo      = (!queryPrazo.results || !queryPrazo.results[0]) ? null : queryPrazo.results[0];
            const idPrazo    = prazo && prazo['PRAZOS_ID']   ? prazo['PRAZOS_ID']   : novo['MOVIMENTOS_ID_PRAZOS'];
            const nomePrazo  = prazo && prazo['PRAZOS_NOME'] ? prazo['PRAZOS_NOME'] : novo['PRAZOS_NOME'];

            novo['MOVIMENTOS_ID_PRAZOS'] = idPrazo;
            novo['PRAZOS_NOME']          = nomePrazo;

            let diaVcto = moment(vctCarne).format('DD');
            let vctCarneVar = vctCarne;

            parcelamento.forEach((days, index) => {
                const vcto = moment(vctCarneVar).add(days, 'days').format('YYYY-MM-DD');
                let vctoVar = '';

                if(original['EMPRESAS_CPFCNPJ'].match(/74398579/) ||  // Prudenmóveis
                   original['EMPRESAS_CPFCNPJ'].match(/45118377/) ||  // Eduardo
                   original['EMPRESAS_CPFCNPJ'].match(/04395395/)) {  // Margarida
                    vctoVar = vcto.split('-')[0] + '-' + vcto.split('-')[1] + '-' + diaVcto;
                } else {
                    vctoVar = vcto;
                }       
                
                const vlrOriginal = cents(parseInt(vlrCarne / parCarne) / 100) + (index === 0 ? resto : 0);

                const carne = {
                    'FINANCEIROS_ID'               : (index + 2) * -1,
                    'FINANCEIROS_NUMERO'           : novo['MOVIMENTOS_NUMERO'], 
                    'FINANCEIROS_SERIE'            : novo['MOVIMENTOS_SERIE'], 
                    'FINANCEIROS_TIPO'             : novo['OPERACOES_FINANCEIRO'], 
                    'FINANCEIROS_ID_MOVIMENTOS'    : novo['MOVIMENTOS_ID'], 
                    'FINANCEIROS_ID_DOCUMENTOS'    : novo['MOVIMENTOS_ID_DOCUMENTOS'], 
                    'FINANCEIROS_ID_PESSOAS'       : novo['MOVIMENTOS_ID_PESSOAS'],
                    'FINANCEIROS_ID_USUARIOS'      : novo['MOVIMENTOS_ID_USUARIOS'],
                    'FINANCEIROS_ID_PORTADORES'    : params.portadorEmpresa,
                    'FINANCEIROS_ID_APLICACOES'    : novo['OPERACOES_ID_APLICACOES'] || 1,
                    'FINANCEIROS_ID_PRAZOS'        : idPrazo,
                    'FINANCEIROS_PARCELAS'         : parCarne,
                    'FINANCEIROS_PARCELA'          : index + 1,
                    'FINANCEIROS_EMISSAO'          : hoje,
                    'FINANCEIROS_VENCIMENTO'       : vctoVar,
                    'FINANCEIROS_BAIXA'            : '1899-12-30',
                    'FINANCEIROS_PAGAMENTO'        : '1899-12-30',
                    'FINANCEIROS_ORIGINAL'         : vlrOriginal / 100,
                    'FINANCEIROS_ABERTO'           : vlrOriginal / 100,
                    'FINANCEIROS_PAGO'             : 0,
                    'FINANCEIROS_TOTAL'            : vlrCarne / 100,
                    'FINANCEIROS_STATUS'           : 'A',
                    'FINANCEIROS_ID_EMPRESAS'      : novo['MOVIMENTOS_ID_EMPRESAS'],
                    'FINANCEIROS_NOSSONUMERO'      : 0,
                    'FINANCEIROS_ID_EMPRESAORIGEM' : 0,
                    'FINANCEIROS_NUMEROORIGEM'     : 0,
                    'FINANCEIROS_SERIEORIGEM'      : '',
                    'FINANCEIROS_BOLETO'           : '',
                    'FINANCEIROS_DESCONTOS'        : 0,
                    'FINANCEIROS_JUROS'            : 0,
                    'FINANCEIROS_TAXAS'            : 0,
                    'FINANCEIROS_OBSERVACOES'      : '',
                    'FINANCEIROS_EXPORTADO'        : 'F',
                    'FINANCEIROS_LOG'              : log
                }

                financeiros.push(carne);
            });
        }

        if(vlrFinanceira > 0) {
            const financeira = {
                'FINANCEIROS_ID'               : -1,
                'FINANCEIROS_NUMERO'           : novo['MOVIMENTOS_NUMERO'],
                'FINANCEIROS_SERIE'            : novo['MOVIMENTOS_SERIE'],
                'FINANCEIROS_TIPO'             : novo['OPERACOES_FINANCEIRO'],
                'FINANCEIROS_ID_MOVIMENTOS'    : novo['MOVIMENTOS_ID'],
                'FINANCEIROS_ID_DOCUMENTOS'    : novo['MOVIMENTOS_ID_DOCUMENTOS'],
                'FINANCEIROS_ID_PESSOAS'       : '999999',
                'FINANCEIROS_ID_USUARIOS'      : novo['MOVIMENTOS_ID_USUARIOS'],
                'FINANCEIROS_ID_PORTADORES'    : params.portadorEmpresa,
                'FINANCEIROS_ID_APLICACOES'    : novo['OPERACOES_ID_APLICACOES'] || 1,
                'FINANCEIROS_ID_PRAZOS'        : 0,
                'FINANCEIROS_PARCELAS'         : parFinanceira,
                'FINANCEIROS_PARCELA'          : 1,
                'FINANCEIROS_VENCIMENTO'       : vctFinanceira.format('YYYY-MM-DD'),
                'FINANCEIROS_EMISSAO'          : hoje,
                'FINANCEIROS_BAIXA'            : '1899-12-30',
                'FINANCEIROS_PAGAMENTO'        : '1899-12-30',
                'FINANCEIROS_ORIGINAL'         : original['MOVIMENTOS_BASEST'],
                'FINANCEIROS_ABERTO'           : (vlpFinanceira * parFinanceira)/ 100,
                'FINANCEIROS_PAGO'             : 0,
                'FINANCEIROS_TOTAL'            : (vlpFinanceira * parFinanceira)/ 100,
                'FINANCEIROS_STATUS'           : 'A',
                'FINANCEIROS_ID_EMPRESAS'      : novo['MOVIMENTOS_ID_EMPRESAS'],
                'FINANCEIROS_NOSSONUMERO'      : 0,
                'FINANCEIROS_ID_EMPRESAORIGEM' : 0,
                'FINANCEIROS_NUMEROORIGEM'     : 0,
                'FINANCEIROS_SERIEORIGEM'      : '',
                'FINANCEIROS_BOLETO'           : '',
                'FINANCEIROS_DESCONTOS'        : 0,
                'FINANCEIROS_JUROS'            : 0,
                'FINANCEIROS_TAXAS'            : 0,
                'FINANCEIROS_OBSERVACOES'      : '',
                'FINANCEIROS_EXPORTADO'        : 'F',
                'FINANCEIROS_LOG'              : log
            }

            financeiros.push(financeira);
        }

        if(vlrCreditoPessoa > 0) {
            await gerarCredito(novo, vlrCreditoPessoa, params); // Gera o lançamento na tabela de créditos para abater
        }
        
        original['MOVIMENTOS_CAIXA']   = [caixa];
        novo['MOVIMENTOS_CAIXA']       = [caixa];
        original['MOVIMENTOS_CARTOES']     = cartoes;
        novo['MOVIMENTOS_CARTOES']     = cartoes;
        original['MOVIMENTOS_CHEQUES'] = cheques;
        novo['MOVIMENTOS_CHEQUES']     = cheques;
        original['MOVIMENTOS_FINANCEIROS'] = financeiros;
        novo['MOVIMENTOS_FINANCEIROS'] = financeiros;

        if(
            vlrDebito        > 0 || 
            vlrCredito       > 0 || 
            vlrCheque        > 0 || 
            vlrChequePre     > 0 || 
            vlrTransferencia > 0 ||
            vlrFinanceira    > 0
        ){
            novo['MOVIMENTOS_ENTRADASAIDA'] = '1899-12-30';
            novo['MOVIMENTOS_STATUS']       = 'N';
        } else {
            novo['MOVIMENTOS_ENTRADASAIDA'] = original['MOVIMENTOS_ENTRADASAIDA'];
            novo['MOVIMENTOS_STATUS']       = 'F';
        }
    };
};

const ratearPartidaPelosItens = async function(movimento) {
    const produtos          = movimento['MOVIMENTOS_ITENS'] || [];
    const totalPartida      = cents(movimento['MOVIMENTOS_IMPOSTO']);
    const totalMovimento    = cents(movimento['MOVIMENTOS_TOTAL']);
    const partidaPercentual = Math.round(((totalPartida / totalMovimento) * 100), 2);
    const isDevolucao       = (movimento['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4) == '0012';

    let somaPartidas = 0

    if(isDevolucao) {
        movimento['MOVIMENTOS_DESCONTOS'] = 0;
        movimento['MOVIMENTOS_PERCENTUAL'] = 0;
    }

    produtos.forEach(produto => {
        const totalLiquido = cents(produto['TOTAL_LIQUIDO']);
        const partidaItem = Math.round((totalLiquido * (partidaPercentual / 100)), 2);

        if(isDevolucao) { // Se for devolução, converte tudo pro valor líquido e zera o desconto
            if(produto['MOVIMENTOSITENS_DESCONTOS'] > 0){
                //--NOVO BLOCO ABATIMENTO DESCONTO MANTENDO CASAS DECIMAIS DO PRECO
                const casasDecimaisPreco = 10;//calcula sempre com 10 casas pra não arredondar o preco
                const preco    = changeBase(produto['MOVIMENTOSITENS_PRECO'], casasDecimaisPreco);
                const desconto = cents(produto['MOVIMENTOSITENS_DESCONTOS']);
                const qtde     = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);

                const descontoPorUnidade = changeBase(desconto / qtde * 10, casasDecimaisPreco);
                const precoLiq = preco - descontoPorUnidade;

                produto['MOVIMENTOSITENS_PRECO']     = precoLiq / (10 ** casasDecimaisPreco);
                //----------
                
                produto['MOVIMENTOSITENS_TOTAL']     = Math.round(precoLiq * qtde / 1000 / (10 ** (casasDecimaisPreco - 2))) / 100;
                produto['MOVIMENTOSITENS_DESCONTOS'] = 0;
                produto['MOVIMENTOSITENS_PERCENTUAL'] = 0;
            }
        }

        if(totalLiquido == totalMovimento){  // Um item só
            produto['MOVIMENTOSITENS_IMPOSTO'] = (totalPartida / 100);
            somaPartidas = totalPartida;
        } else { 
            produto['MOVIMENTOSITENS_IMPOSTO'] = (partidaItem / 100);
            somaPartidas += partidaItem;
        }
    });

    if(somaPartidas > totalPartida) { // sobra
        const diferenca = (somaPartidas - totalPartida);
        produtos[0]['MOVIMENTOSITENS_IMPOSTO'] = (produtos[0]['MOVIMENTOSITENS_IMPOSTO'] - (diferenca / 100));
    } else if(somaPartidas < totalPartida) { // falta
        const diferenca = (totalPartida - somaPartidas);
        produtos[0]['MOVIMENTOSITENS_IMPOSTO'] = (produtos[0]['MOVIMENTOSITENS_IMPOSTO'] + (diferenca / 100));
    }

    if(isDevolucao) {
        movimento['MOVIMENTOS_IMPOSTO'] = (somaPartidas / 100);
        movimento['MOVIMENTOS_PRODUTOS'] = movimento['MOVIMENTOS_TOTAL'];
        movimento['MOVIMENTOS_DESCONTOS'] = 0;
        movimento['MOVIMENTOS_PERCENTUAL'] = 0;
    }
};

const ratearFretePelosItens = async function(movimento) {
    const produtos        = movimento['MOVIMENTOS_ITENS'] || [];
    const totalFrete      = cents(movimento['MOVIMENTOS_FRETE']);
    const totalMovimento  = cents(movimento['MOVIMENTOS_PRODUTOS']);
    const fretePercentual = Math.round(((totalFrete / totalMovimento) * 100), 2);
    const isPrudenMoveis = (movimento['EMPRESAS_CPFCNPJ'] || []).match(/74398579|45118377|04395395/); // Prudenmóveis/Eduardo/Margarida

    if(isPrudenMoveis && totalFrete > 0) {
        let produtosOrdenados = produtos.sort((a, b) => {
            if (a['TOTAL_LIQUIDO'] < b['TOTAL_LIQUIDO']) {
                return 1;
            }
            if (a['TOTAL_LIQUIDO'] > b['TOTAL_LIQUIDO']) {
                return -1;
            }
            return 0;
        });
        produtosOrdenados['0']['MOVIMENTOSITENS_TOTAL'] = (cents(produtosOrdenados['0']['MOVIMENTOSITENS_TOTAL']) + totalFrete) / 100;
        produtosOrdenados['0']['MOVIMENTOSITENS_PRECO'] = (cents(produtosOrdenados['0']['MOVIMENTOSITENS_TOTAL']) / produtosOrdenados['0']['MOVIMENTOSITENS_QUANTIDADE']) / 100;

        movimento['MOVIMENTOS_FRETE'] = 0;
        movimento['MOVIMENTOS_PRODUTOS'] = (cents(movimento['MOVIMENTOS_PRODUTOS']) + totalFrete) / 100;
        movimento['MOVIMENTOS_TOTAL'] = (cents(movimento['MOVIMENTOS_TOTAL']) + totalFrete) / 100;    
    } else {
        let somaFretes = 0

        produtos.forEach(produto => {
            const totalItem = cents(produto['MOVIMENTOSITENS_TOTAL']);
            const freteItem = Math.round((totalItem * (fretePercentual / 100)), 2);
    
            produto['MOVIMENTOSITENS_FRETE'] = (freteItem / 100);
            somaFretes += freteItem;
        });
    
        if(somaFretes > totalFrete) { // sobra
            const diferenca = (somaFretes - totalFrete);
            produtos[0]['MOVIMENTOSITENS_FRETE'] = (produtos[0]['MOVIMENTOSITENS_FRETE'] - (diferenca / 100));
        } else if(somaFretes < totalFrete) { // falta
            const diferenca = (totalFrete - somaFretes);
            produtos[0]['MOVIMENTOSITENS_FRETE'] = (produtos[0]['MOVIMENTOSITENS_FRETE'] + (diferenca / 100));
        }
    }
};

const calcularMargem = async function(movimento) {
    const produtos   = movimento['MOVIMENTOS_ITENS'] || [];
    const precoTotal = cents(movimento['MOVIMENTOS_PRODUTOS']) - cents(movimento['MOVIMENTOS_DESCONTOS']);
    const custoTotal = parseInt(produtos.reduce((result, produto) => {
        const custo = cents(produto['MOVIMENTOSITENS_CUSTO']) || cents(produto['MOVIMENTOSITENS_PRECO']) * 0.65
        const qtde  = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        return result += custo * qtde;
    }, 0) / 1000);

    const margem = cents(100 - (custoTotal / precoTotal * 100)) / 100;

    movimento['MOVIMENTOS_MARGEM'] = margem;
};

const atualizarOriginal = async function(novo, original, params) {

    if(original['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) != '0005') { // Se não for Nota de entrada
        original['MOVIMENTOS_ENTRADASAIDA']     = moment.tz(params.timezone).format('YYYY-MM-DD');
        original['MOVIMENTOS_ID_EMPRESAORIGEM'] = novo['MOVIMENTOS_ID_EMPRESAS'];
        original['MOVIMENTOS_NUMEROORIGEM']     = novo['MOVIMENTOS_NUMERO'];
        original['MOVIMENTOS_SERIEORIGEM']      = novo['MOVIMENTOS_SERIE'];    
    }

//         CNPJ                                    ACOMTF     HOSPITALAR   HERBIQUIMICA    PRUDENACO   SANTANAS     RACAFORTE       BIOMART         TOPBOB          AUTOP
    if(original['EMPRESAS_CPFCNPJ'].match(/05133494000104|03375328000180|00123727000166|61446316000104|4914959600|64607922000144|05971492000186|14377023000124|16615972000120/) &&
        original['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002') { // Pedidos
        const itensOriginalAtualizados = (original['MOVIMENTOS_ITENS'] || []).map((item, index) => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = 510000; // Substitui o CFOP
            return item;
        });
        original['MOVIMENTOS_ITENS'] = itensOriginalAtualizados;
        original['MOVIMENTOS_ID_OPERACOES'] = 510000;
    }

    if((original['EMPRESAS_CPFCNPJ'].match(/00123727000166|64607922000144/)) &&  //HERBIQUIMICA NOROESTE / RAÇAFORTE
       original['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0004') { // Requisiçao
        const itensOriginalAtualizados = (original['MOVIMENTOS_ITENS'] || []).map((item, index) => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = 610000;                    // Substitui o CFOP
            return item;
        });
        original['MOVIMENTOS_ITENS'] = itensOriginalAtualizados;
        original['MOVIMENTOS_ID_OPERACOES'] = 610000;
    }

    if((original['EMPRESAS_CPFCNPJ'] || '').match(/02704798|38167820|50203915/) &&        // STILO MÓVEIS
       original['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001') {             // Orçamento pra pedido
        const itensOriginalAtualizados = (original['MOVIMENTOS_ITENS'] || []).map((item, index) => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = 410000;                    // Substitui o CFOP
            return item;
        });
        original['MOVIMENTOS_ITENS'] = itensOriginalAtualizados;
        original['MOVIMENTOS_ID_OPERACOES'] = 410000;
    }

    original['MOVIMENTOS_STATUS'] = 'F';
   
    if(original['DOCUMENTOS_NOME'].match(/Transfer/)) {
        original['MOVIMENTOS_ID_EMPRESAS']   = novo['MOVIMENTOS_ID_PESSOAS'];
        original['MOVIMENTOS_ID_PESSOAS']    = novo['MOVIMENTOS_ID_EMPRESAS'];
        original['MOVIMENTOS_ID_OPERACOES']  = 700000; 
        original['MOVIMENTOS_ID_DOCUMENTOS'] = novo['MOVIMENTOS_ID_PESSOAS'] + '0007';
        original['MOVIMENTOS_ID_USUARIOS']   = params.userId;
        original['USUARIOS_NOME']            = params.userLogin;
        original['USUARIOS_LOGIN']           = params.userLogin;

        const itensOriginalAtualizados = (original['MOVIMENTOS_ITENS'] || []).map((item, index) => {
            item['MOVIMENTOSITENS_ID_EMPRESAS'] = novo['MOVIMENTOS_ID_PESSOAS'];
            item['MOVIMENTOSITENS_ID_OPERACOES'] = 700000;
            return item;
        });
        original['MOVIMENTOS_ITENS'] = itensOriginalAtualizados;
    }

    if(novo['OPERACOES_FINANCEIRO'] == 'R') {
        original['MOVIMENTOS_FINANCEIROS'] = [];
        original['MOVIMENTOS_CAIXA']       = [];
        original['MOVIMENTOS_CARTOES']     = [];
        original['MOVIMENTOS_CHEQUES']     = [];
        if(original['OPERACOES_FINANCEIRO'] == 'R') {
            await samosFB.executeSQL(`delete from FINANCEIROS where FINANCEIROS_ID_MOVIMENTOS = ${original['MOVIMENTOS_ID']}`, params);
        }
    }

    await api.movimentos().update(original['MOVIMENTOS_ID'], original, params);
};

const checarOperacao = async function(novoMovimento){
    const produtos = novoMovimento['MOVIMENTOS_ITENS'] || [];
    const operacaoPrimeiroItem = produtos[0]['MOVIMENTOSITENS_ID_OPERACOES'];
    const itemComMesmaOperacao = produtos.every(produto => {
        return produto['MOVIMENTOSITENS_ID_OPERACOES'] == operacaoPrimeiroItem;
    });

    if(novoMovimento['OPERACOES_UNICA'] != 'T' && itemComMesmaOperacao){
        novoMovimento['MOVIMENTOS_ID_OPERACOES'] = operacaoPrimeiroItem;

    } else if(novoMovimento['OPERACOES_UNICA'] == 'T') {
        const produtosAtualizados = produtos.map(produto => {
            produto['MOVIMENTOSITENS_ID_OPERACOES'] = novoMovimento['MOVIMENTOS_ID_OPERACOES'];
            return produto;
        });

        novoMovimento['MOVIMENTOS_ITENS'] = produtosAtualizados;
    }
};

const gerarTransferencia = async (movimento, params) => {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const log  = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
    const caixa = movimento['MOVIMENTOS_CAIXA'] || [];
    let vlrTransferencia = 0;

    if(caixa.length > 0) {
        vlrTransferencia = cents(caixa[0]['MOVIMENTOSCAIXA_TRANSFERENCIAS']);
    }

    if(vlrTransferencia > 0) {
        const controle = {
            'CONTROLES_ID'           : -1,
            'CONTROLES_STATUS'       : 'T',
            'CONTROLES_ID_MOVIMENTOS': movimento['MOVIMENTOS_ID'],
            'CONTROLES_ID_PORTADORES': 0,
            'CONTROLES_ID_APLICACOES': 0,
            'CONTROLES_EMISSAO'      : hoje,
            'CONTROLES_VENCIMENTO'   : hoje,
            'CONTROLES_COMPENSADO'   : hoje,
            'CONTROLES_NOME'         : `${movimento['MOVIMENTOS_SERIE']} ${movimento['MOVIMENTOS_NUMERO']} (Transf) ${movimento['MOVIMENTOS_NOME'].toString().replace(/'/ig, '')}`,
            'CONTROLES_DOCUMENTO'    : movimento['MOVIMENTOS_NUMERO'],
            'CONTROLES_TIPO'         : 'E',
            'CONTROLES_VALOR'        : vlrTransferencia / 100,
            'CONTROLES_LOG'          : log
        }

        return await api.controlebancos().create(controle, params); 
    }
};

const gerarCredito = async (movimento, vlrcredito, params) => {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const log  = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')

    if(vlrcredito > 0) {
        const creditopessoa = {
            'CREDITOS_ID'            : -1,
            'CREDITOS_ID_MOVIMENTOS' : movimento['MOVIMENTOS_ID'],
            'CREDITOS_EMISSAO'       : hoje,
            'CREDITOS_ID_PESSOAS'    : movimento['MOVIMENTOS_ID_PESSOAS'],
            'CREDITOS_STATUS'        : 'C',
            'CREDITOS_TIPO'          : 'S',
            'CREDITOS_NOME'          : 'ABATIMENTO DE CRÉDITO',
            'CREDITOS_VALOR'         : vlrcredito,
            'CREDITOS_LOG'           : log
        }

        return await api.creditos().create(creditopessoa, params);
    }
};

const gerarEtiquetas = async (movimento, params) => {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    const log  = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
    let itensGerar = (movimento['MOVIMENTOS_ITENS'] || []).filter(item => item['MOVIMENTOSITENS_EXCECAO'] == 'L');

    for(let i in itensGerar) {
        itensGerar[i]['ETIQUETASITENS_ID_PRODUTOS'] = itensGerar[i]['MOVIMENTOSITENS_ID_PRODUTOS'];
        itensGerar[i]['ETIQUETASITENS_QUANTIDADE'] = itensGerar[i]['MOVIMENTOSITENS_QUANTIDADE'];
    }
   
    const etiqueta = {
        'ETIQUETAS_ID'           : -1,
        'ETIQUETAS_ID_EMPRESAS'  : movimento['MOVIMENTOS_ID_EMPRESAS'],
        'ETIQUETAS_STATUS'       : 'F',
        'ETIQUETAS_NOME'         : 'TRE ' + movimento['MOVIMENTOS_NUMERO'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY'),
        'ETIQUETAS_LOG'          : log,
        'ETIQUETAS_EMISSAO'      : hoje,
        'ETIQUETAS_LAYOUT'       : '',
        'TABELA'                 : 'PRODUTOS',
        'TIPO'                   : 'PRODUTOS',
        'ETIQUETAS_ITENS'        : itensGerar
    }

    return await api.etiquetas().create(etiqueta, params);
};

const checarSaldos = async function(movimento, params) {
    const idEmpresa = movimento['MOVIMENTOS_ID_EMPRESAS'];
    const idsProdutos = (movimento['MOVIMENTOS_ITENS'] || [])
        .map(produto => produto['MOVIMENTOSITENS_ID_PRODUTOS'])
        .join(',');

    const sql = `execute block returns (
            PRODUTOS_ID integer,
            SALDOS_DISPONIVELTOTAL numeric(12,3),
            SALDOS_DISPONIVEL numeric(12,3)
        ) as
        declare variable resultado      varchar(10);
        declare variable Explodir       varchar(100);
        declare variable UltimaPosicao  integer;
        declare variable ProximaPosicao integer;
        declare variable Temporaria     varchar(2000);
        begin
            Explodir       = '${idsProdutos}';
            Explodir       = :Explodir || ',';
            UltimaPosicao  = 1;
            ProximaPosicao = position(',', :Explodir, UltimaPosicao);
            SALDOS_DISPONIVELTOTAL = 0;
        
            while (:ProximaPosicao > 1) do
                begin
                    Temporaria     = substring(:Explodir from :UltimaPosicao for :ProximaPosicao - :UltimaPosicao);
                    resultado      = Temporaria;
                    UltimaPosicao  = :ProximaPosicao + 1;
                    ProximaPosicao = position(',', :Explodir, UltimaPosicao);
        
                    for
                        select SALDOS_ID_PRODUTOS, SALDOS_DISPONIVEL
                        from SALDOS
                        left outer join EMPRESAS on EMPRESAS_ID = SALDOS_ID_EMPRESAS                        
                        where (SALDOS_ID_EMPRESAS = ${idEmpresa} or position('DEPOS', EMPRESAS_FANTASIA) <> 0) and
                              SALDOS_ID_PRODUTOS = :resultado
                        into :PRODUTOS_ID,
                            :SALDOS_DISPONIVEL
                    do
                        begin
                            SALDOS_DISPONIVELTOTAL = SALDOS_DISPONIVELTOTAL + SALDOS_DISPONIVEL;
                        end
                        suspend;
                        SALDOS_DISPONIVELTOTAL = 0;
                end
        end`;
    
    const results = await samosFB.executeSQL(sql, params);

    let excedentes = [];

    (movimento['MOVIMENTOS_ITENS'] || []).map(produto => {
        const id   = produto['MOVIMENTOSITENS_ID_PRODUTOS'];
        const qtde = produto['MOVIMENTOSITENS_QUANTIDADE'];

        const excedente = results.filter(result => {
            const idResult = result['PRODUTOS_ID'];
            const disponivel = result['SALDOS_DISPONIVELTOTAL'];
            return idResult == id && qtde > disponivel;
        });

        if(excedente) {
            excedentes.push(...excedente);
        }
    });

    return excedentes;
};

const calculaPesoLiquido = async (itens) => {  // Exclusivo Prudenaço
    let totalLiquido = 0;
    for(let i in itens) {
        totalLiquido += grams(itens[i]['PRODUTOS_PESOLIQUIDO']) > 0 ?
                        (grams(itens[i]['MOVIMENTOSITENS_QUANTIDADE']) * grams(itens[i]['PRODUTOS_PESOLIQUIDO'])) : 0
    }

    return (totalLiquido / 1000000);
};

const calculaPesoBruto = async (itens) => {
    let totalBruto = 0;
    for(let i in itens) {
        totalBruto += grams(itens[i]['PRODUTOS_PESOBRUTO']) > 0 ?
                      (grams(itens[i]['MOVIMENTOSITENS_QUANTIDADE']) * grams(itens[i]['PRODUTOS_PESOBRUTO'])) : 0
    }
   
    return (totalBruto / 1000000);
};
