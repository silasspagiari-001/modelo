'use strict';

const axios  = require('axios');
const crypto = require('crypto');

const URL_CALCULADORA = process.env.CALCULADORA_IBSCBS_URL || 
                        'http://localhost:8080/api/calculadora/regime-geral';

const URL_CALCULADORA_SIMPLES = process.env.CALCULADORA_IBSCBS_SIMPLES_URL ||
                        'http://localhost:8082/api/calculadora/observabilidade/simples-nacional';

function numero(valor) {
    const n = Number(valor);

    return Number.isFinite(n) ? n : 0;
}


function texto(valor, padrao = '') {
    const retorno = (valor ?? '').toString().trim();

    return retorno || padrao;
}


/**
 * Monta um identificador único da operação.
 *
 * Exemplo:
 * 1-1-12345
 *
 * Empresa-Série-Número
 */
function montarIdOperacao(data) {
    return crypto.randomUUID();
}


/**
 * Monta um item no formato esperado pela Calculadora IBS/CBS.
 */
function montarItemCalculadora({
    produto,
    item,
    numeroItem
}) {

    const cst = texto(
        produto['PRODUTOS_CSTIBSCBS'],
        '000'
    );

    const cClassTrib = texto(
        produto['PRODUTOS_CLASSTRIB'],
        '000001'
    );

    const baseCalculo = Number((
        numero(item['TOTAL_LIQUIDO']) +
        numero(item['MOVIMENTOSITENS_FRETE']) +
        numero(item['MOVIMENTOSITENS_SEGURO']) +
        numero(item['MOVIMENTOSITENS_DESPESAS'])).toFixed(2));

    const ncm = texto(item['NCMS_NCM']);

    const itemCalculadora = {

        numero: numeroItem,

        cst: cst,

        cClassTrib: cClassTrib,

        baseCalculo: baseCalculo,

        quantidade: numero(
            item['MOVIMENTOSITENS_QUANTIDADE']
        ),

        unidade: texto(
            item['UNIDADES_SIGLA'] ||
            item['PRODUTOS_UNIDADE'],
            'UN'
        ),

        tributacaoRegular: {
            cst: cst,
            cClassTrib: cClassTrib
        }
    };

    /*
     * NCM 00000000 é utilizado na NF-e em situações específicas,
     * como mão de obra na industrialização por encomenda. (Biomart)
     *
     * A Calculadora IBS/CBS não reconhece 00000000 como NCM válido.
     * Portanto, nesse caso, não enviamos o campo NCM para a Calculadora.
     */
    if (ncm && ncm !== '00000000') {
        itemCalculadora.ncm = ncm;
    }

    return itemCalculadora;
}

/**
 * Monta o JSON completo da operação.
 *
 * itens deve possuir:
 *
 * [
 *   {
 *      item: {...},
 *      produto: {...}
 *   },
 *   ...
 * ]
 */
function montarPayload({
    itens,
    pessoa,
    data
}) {

    if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error(
            'Nenhum item informado para a Calculadora IBS/CBS.'
        );
    }


    const itensCalculadora = itens.map(
        ({ item, produto }, index) => {

            if (!item) {
                throw new Error(
                    `Item ${index + 1} não informado para a Calculadora IBS/CBS.`
                );
            }

            if (!produto) {
                throw new Error(
                    `Produto do item ${index + 1} não informado para a Calculadora IBS/CBS.`
                );
            }


            return montarItemCalculadora({
                produto,
                item,
                numeroItem: index + 1
            });
        }
    );


    return {

        id: montarIdOperacao(),

        versao: '0.0.1',

        dhFatoGerador: new Date()
            .toLocaleString(
                'sv-SE',
                {
                    timeZone: 'America/Sao_Paulo'
                }
            )
            .replace(' ', 'T') + '-03:00',

        municipio: numero(
            pessoa['CIDADES_IBGE']
        ),

        uf: texto(
            pessoa['CIDADES_ESTADO']
        ),


        /*
        gCompraGov: {

            // Ver futuramente como preencher
            // no caso de venda para órgão público.

            tpEnteGov: 1,
            tpOperGov: 1
        },
        */


        itens: itensCalculadora
    };
}

/**
 * Monta o JSON da Calculadora IBS/CBS
 * para empresas do Simples Nacional.
 */
function montarPayloadSimples({
    itens,
    data,
    crt
}) {

    if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error(
            'Nenhum item informado para a Calculadora IBS/CBS Simples Nacional.'
        );
    }

    // Somente a data enviada à API é substituída; o movimento não é alterado.
    const dataSimulacao = texto(process.env.CALCULADORA_IBSCBS_SIMPLES_DATA_SIMULACAO);
    if (dataSimulacao) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Data de simulação do Simples Nacional não pode ser usada em produção.');
        }
        const instante = Date.parse(dataSimulacao + 'T00:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataSimulacao) || !Number.isFinite(instante) ||
            new Date(instante).toISOString().slice(0, 10) !== dataSimulacao) {
            throw new Error('CALCULADORA_IBSCBS_SIMPLES_DATA_SIMULACAO deve ser uma data válida YYYY-MM-DD.');
        }
    }

    const pIbsSn = texto(
        process.env.IBSSN,
        '0'
    );

    const pCbsSn = texto(
        process.env.CBSSN,
        '0'
    );

    const itensCalculadora = itens.map(
        ({ item, produto }, index) => {

            if (!item) {
                throw new Error(
                    `Item ${index + 1} não informado para a Calculadora IBS/CBS Simples Nacional.`
                );
            }

            if (!produto) {
                throw new Error(
                    `Produto do item ${index + 1} não informado para a Calculadora IBS/CBS Simples Nacional.`
                );
            }

            const baseCalculo = (
                numero(item['TOTAL_LIQUIDO']) +
                numero(item['MOVIMENTOSITENS_FRETE']) +
                numero(item['MOVIMENTOSITENS_SEGURO']) +
                numero(item['MOVIMENTOSITENS_DESPESAS'])
            ).toFixed(2);

            const cClassTrib = texto(
                produto['PRODUTOS_CLASSTRIB'],
                '000001'
            );

            return {
                numero: index + 1,

                cAtivSN: '01',

                cClassTrib: cClassTrib,

                baseCalculo: baseCalculo,

                valorImpostoSeletivo: '0.00',

                pIBSSN: pIbsSn,

                pCBSSN: pCbsSn
            };
        }
    );

    return {
        id: montarIdOperacao(),

        versao: '2.0.0',

        data: dataSimulacao || new Date()
            .toLocaleDateString(
                'sv-SE',
                {
                    timeZone: 'America/Sao_Paulo'
                }
            ),

        tpDoc: '55',

        CRT: texto(crt),

        itens: itensCalculadora
    };
}

/**
 * Interpreta um único item retornado pela calculadora.
 */
function interpretarItem(objeto, numeroItem) {

    const ibsCbs =
        objeto?.tribCalc?.IBSCBS;

    const grupo =
        ibsCbs?.gIBSCBS;


    if (!ibsCbs || !grupo) {

        throw new Error(
            `Resposta da Calculadora IBS/CBS não contém ` +
            `o grupo esperado IBSCBS para o item ${numeroItem}.`
        );
    }


    const ibsUf =
        grupo.gIBSUF || {};

    const ibsMun =
        grupo.gIBSMun || {};

    const cbs =
        grupo.gCBS || {};


    const valorIbs =
        numero(grupo.vIBS) ||
        (
            numero(ibsUf.vIBSUF) +
            numero(ibsMun.vIBSMun)
        );


    return {

        numero: numeroItem,

        cst:
            texto(ibsCbs.CST),

        cClassTrib:
            texto(ibsCbs.cClassTrib),


        baseCalculo:
            numero(grupo.vBC),


        aliquotaIbsUf:
            numero(ibsUf.pIBSUF),

        aliquotaIbsMun:
            numero(ibsMun.pIBSMun),


        aliquotaIbs:
            numero(ibsUf.pIBSUF) +
            numero(ibsMun.pIBSMun),


        valorIbs:
            valorIbs,


        reducaoIbsUf:
            numero(
                ibsUf.gRed?.pRedAliq
            ),

        reducaoIbsMun:
            numero(
                ibsMun.gRed?.pRedAliq
            ),


        aliquotaEfetivaIbsUf:
            numero(
                ibsUf.gRed?.pAliqEfet
            ),

        aliquotaEfetivaIbsMun:
            numero(
                ibsMun.gRed?.pAliqEfet
            ),


        aliquotaCbs:
            numero(cbs.pCBS),

        aliquotaEfetivaCbs:
            numero(
                cbs.gRed?.pAliqEfet
            ),

        valorCbs:
            numero(cbs.vCBS),

        reducaoCbs:
            numero(
                cbs.gRed?.pRedAliq
            ),


        /*
         * Esses campos ainda serão tratados futuramente
         * conforme os respectivos grupos retornados
         * pela Calculadora IBS/CBS.
         */

        diferimentoIbs: 0,
        valorDiferimentoIbs: 0,
        valorDevolucaoIbs: 0,

        diferimentoCbs: 0,
        valorDiferimentoCbs: 0,
        valorDevolucaoCbs: 0,


        memoriaCalculo: {

            ibsUf:
                texto(
                    ibsUf.memoriaCalculo
                ),

            ibsMun:
                texto(
                    ibsMun.memoriaCalculo
                ),

            cbs:
                texto(
                    cbs.memoriaCalculo
                )
        }
    };
}


/**
 * Interpreta todos os itens retornados
 * pela Calculadora IBS/CBS.
 */
function interpretarResposta(
    resposta,
    payload
) {

    const objetos =
        resposta?.objetos;


    if (!Array.isArray(objetos)) {

        throw new Error(
            'Resposta da Calculadora IBS/CBS não contém ' +
            'o array "objetos".'
        );
    }


    if (objetos.length !== payload.itens.length) {

        throw new Error(
            `Quantidade de itens retornados pela Calculadora IBS/CBS ` +
            `é diferente da quantidade enviada. ` +
            `Enviados: ${payload.itens.length}. ` +
            `Retornados: ${objetos.length}.`
        );
    }


    return objetos.map(
        (objeto, index) => {

            /*
             * O payload foi enviado na mesma ordem dos itens
             * da nota.
             *
             * Portanto utilizamos o numero do item original
             * para manter o relacionamento.
             */

            const numeroItem =
                payload.itens[index].numero;


            return interpretarItem(
                objeto,
                numeroItem
            );
        }
    );
}


/**
 * Envia toda a operação para a Calculadora IBS/CBS
 * em uma única requisição.
 */
async function calcular({itens, pessoa, data}) {

    const payload = montarPayload({
        itens,
        pessoa,
        data
    });

    console.log(
        'JSON CALCULADORA IBS/CBS:',
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    try {

        const response =
            await axios.post(
                URL_CALCULADORA,
                payload,
                {
                    timeout: 15000,

                    headers: {
                        'Content-Type':
                            'application/json'
                    }
                }
            );


        const resultado =
            interpretarResposta(
                response.data,
                payload
            );


        console.log(
            'RESPOSTA CALCULADORA IBS/CBS:',
            resultado
        );


        return resultado;


    } catch(error) {

        if (error.response) {

            throw new Error(

                `Calculadora IBS/CBS retornou HTTP ` +
                `${error.response.status}: ` +
                JSON.stringify(
                    error.response.data
                )
            );
        }


        throw new Error(
            `Falha ao acessar Calculadora IBS/CBS: ` +
            `${error.message}`
        );
    }
}

/**
 * Adapta a resposta do Simples ao contrato consumido por calculoimposto.js.
 * Relaciona os itens por nObj, sem depender da ordem da resposta.
 */
function interpretarRespostaSimples(resposta, payload, itens) {
    const objetos = resposta?.objetos;

    if (!Array.isArray(objetos) || objetos.length !== payload.itens.length) {
        throw new Error('Resposta da Calculadora Simples Nacional contém quantidade de itens inválida.');
    }

    const porNumero = new Map();
    for (const objeto of objetos) {
        const nObj = Number(objeto?.nObj);
        if (!Number.isInteger(nObj) || porNumero.has(nObj)) {
            throw new Error('Resposta da Calculadora Simples Nacional contém identificador de item inválido ou repetido.');
        }
        porNumero.set(nObj, objeto);
    }

    return payload.itens.map((entrada, index) => {
        const objeto = porNumero.get(entrada.numero);
        const trib = objeto?.tribCalc;

        if (objeto?.estadoItem !== 'CALCULADO' || !trib) {
            throw new Error(`Item ${entrada.numero} do Simples Nacional não foi calculado: ${objeto?.estadoItem || 'ausente'}.`);
        }

        const lerNumero = campo => {
            const valor = trib[campo];
            if (valor === null || valor === undefined || String(valor).trim() === '' ||
                !Number.isFinite(Number(valor))) {
                throw new Error(`Campo ${campo} inválido na resposta do Simples Nacional, item ${entrada.numero}.`);
            }
            return Number(valor);
        };

        // O contrato atual do ERP não representa pendências de suspensão do SN.
        if (lerNumero('vIBSPendSusp') !== 0 || lerNumero('vCBSPendSusp') !== 0) {
            throw new Error(`Item ${entrada.numero} possui pendência de suspensão do Simples Nacional ainda não suportada pelo ERP.`);
        }

        return {
            numero: entrada.numero,
            cst: texto(itens[index].produto['PRODUTOS_CSTIBSCBS'], '000'),
            cClassTrib: entrada.cClassTrib,
            baseCalculo: lerNumero('vBC'),
            aliquotaIbs: lerNumero('pIBSSN'),
            valorIbs: lerNumero('vIBSSN'),
            aliquotaCbs: lerNumero('pCBSSN'),
            valorCbs: lerNumero('vCBSSN'),
            reducaoIbsUf: 0,
            reducaoCbs: 0,
            diferimentoIbs: 0,
            valorDiferimentoIbs: 0,
            valorDevolucaoIbs: 0,
            diferimentoCbs: 0,
            valorDiferimentoCbs: 0,
            valorDevolucaoCbs: 0
        };
    });
}

/**
 * Envia a operação para a Calculadora IBS/CBS
 * do Simples Nacional.
 */
async function calcularSimples({itens, data, crt}) {

    const payload = montarPayloadSimples({
        itens,
        data,
        crt
    });

    if (texto(process.env.CALCULADORA_IBSCBS_SIMPLES_DATA_SIMULACAO)) {
        console.warn('SIMULAÇÃO IBS/CBS SIMPLES: data enviada à API = ' + payload.data +
            '. Não usar estes resultados na emissão ou apuração de documentos reais.');
    }

    console.log(
        'JSON CALCULADORA IBS/CBS SIMPLES:',
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    try {

        const response =
            await axios.post(
                URL_CALCULADORA_SIMPLES,
                payload,
                {
                    timeout: 15000,

                    headers: {
                        'Content-Type':
                            'application/json'
                    }
                }
            );

        console.log(
            'RESPOSTA CALCULADORA IBS/CBS SIMPLES:',
            JSON.stringify(
                response.data,
                null,
                2
            )
        );

        return interpretarRespostaSimples(response.data, payload, itens);

    } catch(error) {

        if (error.response) {

            throw new Error(
                `Calculadora IBS/CBS Simples Nacional retornou HTTP ` +
                `${error.response.status}: ` +
                JSON.stringify(
                    error.response.data
                )
            );
        }

        throw new Error(
            `Falha ao acessar Calculadora IBS/CBS Simples Nacional: ` +
            `${error.message}`
        );
    }
}

module.exports = {

    calcular,

    calcularSimples,

    montarPayload,

    montarPayloadSimples,

    interpretarRespostaSimples,

    montarItemCalculadora,

    interpretarResposta,

    interpretarItem
};