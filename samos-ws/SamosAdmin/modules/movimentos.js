'use strict';

const utils   = require('../services/samosUtils');
const cents   = utils.number.cents.bind(utils.number);
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const moment  = require('moment-timezone');

// Fallback de contingencia IBS/CBS para NF-e.
// Completa somente itens que chegarem sem IBS/CBS; calculos validos sao preservados.
function aplicarFallbackIbsCbsItens(movimento) {
    if(String(movimento['MOVIMENTOS_ID_DOCUMENTOS'] || '').slice(-4) !== '0003') return;

    (movimento['MOVIMENTOS_ITENS'] || []).forEach(item => {
        const cst = String(item['MOVIMENTOSITENS_CSTIBSCBS'] || '').trim();
        const cClassTrib = String(item['MOVIMENTOSITENS_CCLASSTRIB'] || '').trim();
        const aliquotaIbs = Number(item['MOVIMENTOSITENS_ALIQUOTAIBS']) || 0;
        const aliquotaCbs = Number(item['MOVIMENTOSITENS_ALIQUOTACBS']) || 0;

        const total = (cents(item['MOVIMENTOSITENS_TOTAL']) / 100) || 0;
        const descontos = (cents(item['MOVIMENTOSITENS_DESCONTOS']) / 100) || 0;
        const frete = Number(item['MOVIMENTOSITENS_FRETE']) || 0;
        const seguro = Number(item['MOVIMENTOSITENS_SEGURO']) || 0;
        const despesas = Number(item['MOVIMENTOSITENS_DESPESAS']) || 0;
        const base = Math.max(0, total - descontos + frete + seguro + despesas);

        const semClassificacao = !cClassTrib;
        const semCalculo = base > 0 && (cst === '' || cst === '000') && aliquotaIbs === 0 && aliquotaCbs === 0;

        if(semClassificacao || semCalculo) {
            item['MOVIMENTOSITENS_CSTIBSCBS'] = cst || '000';
            item['MOVIMENTOSITENS_CCLASSTRIB'] = cClassTrib || '000001';
            item['MOVIMENTOSITENS_BASEIBSCBS'] = base;
            item['MOVIMENTOSITENS_ALIQUOTAIBS'] = 0.1;
            item['MOVIMENTOSITENS_VALORIBS'] = Math.round(base * 0.001 * 100) / 100;
            item['MOVIMENTOSITENS_PERREDIBS'] = Number(item['MOVIMENTOSITENS_PERREDIBS']) || 0;
            item['MOVIMENTOSITENS_PERDIFIBS'] = Number(item['MOVIMENTOSITENS_PERDIFIBS']) || 0;
            item['MOVIMENTOSITENS_VLRDIFIBS'] = Number(item['MOVIMENTOSITENS_VLRDIFIBS']) || 0;
            item['MOVIMENTOSITENS_VLRDEVIBS'] = Number(item['MOVIMENTOSITENS_VLRDEVIBS']) || 0;
            item['MOVIMENTOSITENS_ALIQUOTACBS'] = 0.9;
            item['MOVIMENTOSITENS_VALORCBS'] = Math.round(base * 0.009 * 100) / 100;
            item['MOVIMENTOSITENS_PERREDCBS'] = Number(item['MOVIMENTOSITENS_PERREDCBS']) || 0;
            item['MOVIMENTOSITENS_PERDIFCBS'] = Number(item['MOVIMENTOSITENS_PERDIFCBS']) || 0;
            item['MOVIMENTOSITENS_VLRDIFCBS'] = Number(item['MOVIMENTOSITENS_VLRDIFCBS']) || 0;
            item['MOVIMENTOSITENS_VLRDEVCBS'] = Number(item['MOVIMENTOSITENS_VLRDEVCBS']) || 0;

            console.warn('[IBS/CBS][FALLBACK][MOVIMENTOS]', {
                movimento: movimento['MOVIMENTOS_ID'] || 0,
                numero: movimento['MOVIMENTOS_NUMERO'] || 0,
                produto: item['MOVIMENTOSITENS_ID_PRODUTOS'] || item['PRODUTOS_ID'] || 0,
                base,
                ibs: item['MOVIMENTOSITENS_VALORIBS'],
                cbs: item['MOVIMENTOSITENS_VALORCBS']
            });
        }
    });
}

module.exports = {
    read: async params => {
        try {
            const { 
                empresa, 
                documento, 
                nomedocumento, 
                numero, 
                filtravendedor,
                pessoa, 
                movimentosnome, 
                nfe,
                operacao,
                inicio, 
                final, 
                tipo,
                ordem, 
                status, 
                situacao, 
                start, 
                limit,
                userId
            } = params;

            const isTransferencia = nomedocumento.match(/Transfer/);
            const isNotaEntrada   = nomedocumento.match(/Entrada/);
            const isPedidoCompra  = nomedocumento.match(/Compra/);
            const idDocumento     = rightIdDocumento(nomedocumento);
            const buscaPorComanda = (numero || '').toString().toUpperCase().charAt(0) == 'C';
            const usaRomaneios    = process.env[params.client ? ((params.client || '').toUpperCase() + '_ROMANEIOS') : 'ROMANEIOS'] == 'TRUE';
            const isPrudenmoveis  = (params.client || '').toUpperCase().match(/PRUDENMOVEIS|EDULAR/);

            let sqlEmpresa = '';
            let sqlDocumento = '';
            let sqlIdDocumento = '';

            if(isTransferencia) {
                sqlEmpresa = empresa ? `and (MOVIMENTOS_ID_EMPRESAS = ${empresa} or (MOVIMENTOS_ID_OPERACOES = 710000 and MOVIMENTOS_ID_PESSOAS = ${empresa})) ` : '';
                sqlDocumento = ` and (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0007' or 
                                      right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0016') `
            } else {
                sqlDocumento   = documento   ? `and MOVIMENTOS_ID_DOCUMENTOS = ${documento} ` : '';
                sqlIdDocumento = idDocumento ? `and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '${idDocumento}' ` : '';
                sqlEmpresa     = empresa     ? `and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
            }            
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            
            let sqlOrder = '';

            let sqlVendedor = filtravendedor == 'true' ? ` and MOVIMENTOS_ID_USUARIOS = ${userId} ` : '';
            let sqlStatus = status == 19 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z')) `
                                         : ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' `

            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlIdDocumento} ${sqlVendedor} ${sqlStatus}`;
                
            if(operacao) {
                sqlWhere += ` and MOVIMENTOS_ID_OPERACOES = ${operacao} `;
            }
        
            if(idDocumento == '0004' && params.client.toUpperCase() == 'HERBIQUIMICA') {  // Filtra requisições faturadas herbiquimica
              sqlWhere += ` and MOVIMENTOS_ID_OPERACOES <> 610000 `;               
            }


            if(tipo && tipo > 0) {  // Filtro Vtex
                if(tipo == 1) {
                    sqlWhere += ` and MOVIMENTOS_PROTOCOLO = ''`;
                } else {
                    sqlWhere += ` and MOVIMENTOS_PROTOCOLO <> ''`;
                }
            }

            if(numero) {
                if(buscaPorComanda) {
                    sqlWhere += ` and COMANDAS_NUMERO = '${numero.slice(1, Infinity)}' `;
                    sqlOrder = ` order by MOVIMENTOS_NFE `;
                } else if(numero.toString().length > 15) {
                    sqlWhere += ` and MOVIMENTOS_NFE = '${numero}'`;
                    sqlOrder = ` order by MOVIMENTOS_NFE `;
                } else if(/[0-9]{8}/.test(numero) && !isNotaEntrada) {
                    sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${parseInt(numero.toString().slice(0,2))} 
                                  and MOVIMENTOS_NUMERO      = ${parseInt(numero.toString().slice(2,8))}  
                                  and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E') 
                                  and (
                                    select count(*) from ROMANEIOSITENS where ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
                                  ) = 0 `;
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `; 
                } else {
                    sqlWhere += ` and MOVIMENTOS_NUMERO = ${(numero || '').replace(/\D/ig, '')}`;
                    if(isPrudenmoveis && params.isromaneio == 'true') {  // Busca exclusiva Prudenmóveis/Romaneios
                        sqlWhere += ` and MOVIMENTOS_EMISSAO >= dateadd(-1 year to current_date) `
                    }
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;  
                    if (status == 11){
                        //traz os faturados, que ainda não estão em Romaneio de Entrega
                        sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
                                      ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is null `; 
                    }  
                    if(status == 12) {
                        //traz os faturados, que ainda não estão em Romaneio de Montagem mas tem romaneio de entrega
                        sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
                            (
                                select sum(MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_IMEDIATA) from MOVIMENTOSITENS
                                where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                    MOVIMENTOSITENS_CSTPIS <> 'ML'
                            ) > 0 and
                            ROMMONTAGEM.ROMANEIOSITENS_ID_ROMANEIOS is null and
                            ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is not null`;
                    }
                }
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
                } else if(movimentosnome) {
                    sqlWhere += ` and MOVIMENTOS_NOME like '${movimentosnome}%' `; 
                } else if(nfe) {
                    sqlWhere += ` and MOVIMENTOS_NFE = '${nfe}' `; 
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 3) { // Entrada/Saida
                        sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else {
                        sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ` order by MOVIMENTOS_ID_EMPRESAS,MOVIMENTOS_ID_DOCUMENTOS,MOVIMENTOS_EMISSAO,MOVIMENTOS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
                } else if (ordem == 4) {
                    sqlOrder = ` order by MOVIMENTOS_NFE `;                    
                }

                if(situacao) {
                    sqlWhere += ` and MOVIMENTOS_SITUACAO = '${situacao}' `;
                }

                if(isPedidoCompra && status != 6 && status != 9) {
                    sqlWhere += ` and MOVIMENTOS_SITUACAO <> 'A' `;
                }

                if(status == 0) {//movimentos sem caixa
                    sqlWhere += ` and ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0) or ((MOVIMENTOSCAIXA_DINHEIRO + 
                                                                                                    MOVIMENTOSCAIXA_CHEQUE + 
                                                                                                    MOVIMENTOSCAIXA_DEBITO + 
                                                                                                    MOVIMENTOSCAIXA_CREDITO + 
                                                                                                    MOVIMENTOSCAIXA_DUPLICATA +
                                                                                                    MOVIMENTOSCAIXA_CREDITOPESSOA +
                                                                                                    MOVIMENTOSCAIXA_TRANSFERENCIAS) = 0)) `; 
                } else if(status == 1) {
                    sqlWhere += ` and (MOVIMENTOS_STATUS = 'N' or MOVIMENTOS_STATUS = 'M') `; 
                } else if(status == 2) {
                    sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E') `; 
                } else if(status == 3) {
                    sqlWhere += ` and (MOVIMENTOS_STATUS = 'C' or MOVIMENTOS_STATUS = 'B') `; 
                } else if(status == 4) {
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'G' `; 
                } else if(status == 5) {
                    sqlWhere += ` and ((MOVIMENTOS_NUMEROORIGEM is null) or (MOVIMENTOS_NUMEROORIGEM = 0)) `; 
                } else if(status == 7) {
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'D' `; 
                } else if(status == 8) {
                    sqlWhere += ` and MOVIMENTOS_SITUACAO = 'P' `; 
                } else if(status == 9) {
                    sqlWhere += ` and MOVIMENTOS_SITUACAO = 'A' `; 
                } else if(status == 10) {
                    sqlWhere += ` and MOVIMENTOS_SITUACAO = 'R' `; 
                } else if (status == 11){
                    //traz os faturados, que ainda não estão em Romaneio de Entrega
                    sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
                                  ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is null`;                    
                } else if (status == 12){
                    //traz os faturados, que ainda não estão em Romaneio de Montagem mas estão em romaneio de Entrega
                    sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
                        (
                            select sum(MOVIMENTOSITENS_IMEDIATA * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                            join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                            where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                  MOVIMENTOSITENS_CSTPIS <> 'ML'
                        ) > 0 and
                        ROMMONTAGEM.ROMANEIOSITENS_ID_ROMANEIOS is null and
                        ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is not null`;
                } else if(status == 13){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'S' `; 
                } else if(status == 14){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'P' `; 
                } else if(status == 15){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'I' `; 
                } else if(status == 16){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'Q' `; 
                } else if(status == 17){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'R' `;   // Recusa (Manifestação)
                } else if(status == 18){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'V' `;   // Devoluçao
                } else if(status == 19 && idDocumento == '0003'){  
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'U' `;   // Nota eletrônica Inutilizada
                }
            }
                    
            const sqlCount  = `select count(MOVIMENTOS_ID) from MOVIMENTOS
                    left outer join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                    ${
                        buscaPorComanda ? 
                            `left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
                        : ''
                    }
                    ${
                        (status == 11 || status == 12) ? 
                            `left outer join ROMANEIOSITENS as ROMENTREGA  on ROMENTREGA.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMENTREGA.ROMANEIOSITENS_STATUS = 'E'
                             left outer join ROMANEIOSITENS as ROMMONTAGEM on ROMMONTAGEM.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMMONTAGEM.ROMANEIOSITENS_STATUS = 'M' `
                        : ''
                    }
                    ${
                        status == 12 
                        ? ` left join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left join PRODUTOS        on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS` 
                        : ''
                    }
                ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits}
                    MOVIMENTOS_ID, 
                    MOVIMENTOS_ID_EMPRESAS, 
                    MOVIMENTOS_ID_DOCUMENTOS,
                    EMPRESAS_ID_CIDADES,
                    EMPRESAS_REGIAO12,
                    MOVIMENTOS_ID_PESSOAS,
                    MOVIMENTOS_ID_PROPRIEDADES,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_FANTASIA,
                    PESSOAS_INCLUSAO,
                    MOVIMENTOS_CELULAR,
                    MOVIMENTOS_EMAIL,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    CIDADESPROPRIEDADE.CIDADES_NOME   as CIDADES_NOMEPROPRIEDADE,
                    CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                    iif(MOVIMENTOS_SERIE = 'TRS', PESSOAS_FANTASIA, EMPRESAS_FANTASIA) as DESTINO_FANTASIA,
                    MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE,
                    MOVIMENTOS_STATUS,
                    MOVIMENTOS_SITUACAO,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ENTRADASAIDA,
                    USUARIOS_LOGIN,
                    MOVIMENTOS_NOME,
                    MOVIMENTOS_CPFCNPJ,
                    MOVIMENTOS_TOTAL,
                    MOVIMENTOS_VALORRETENCAO,
                    MOVIMENTOS_IMPOSTO,
                    MOVIMENTOS_BASEICMS,
                    MOVIMENTOS_VALORICMS,
                    MOVIMENTOS_BASEST,
                    MOVIMENTOS_VALORST,
                    MOVIMENTOS_VALORIPI,
                    MOVIMENTOS_FRETE,
                    MOVIMENTOS_SEGURO,
                    MOVIMENTOS_DESPESAS,
                    MOVIMENTOS_DESCONTOS,
                    MOVIMENTOS_PRODUTOS,
                    MOVIMENTOS_NFE,
                    MOVIMENTOS_PROTOCOLO,
                    MOVIMENTOS_ID_OPERACOES,
                    MOVIMENTOS_NUMEROORIGEM,
                    MOVIMENTOS_SERIEORIGEM,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME,
                    OPERACOES_FINANCEIRO,
                    DOCUMENTOS_NOME
                    ${
                        status == 12
                        ? `, cast ((
                                select sum(MOVIMENTOSITENS_IMEDIATA * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                                where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                      MOVIMENTOSITENS_CSTPIS <> 'ML'
                            ) as numeric(12,2)) as MONTAGENS_VALOR ` 
                        : ''
                    }${
                        status == 11 || status == 12
                        ? `, (
                            iif((select count(*) from MOVIMENTOSITENS
                                where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                      MOVIMENTOSITENS_DEPOSITO = 0) = 0, 'T', 'F')
                        ) as RESERVAS_STATUS ` 
                        : ''
                    }
                from MOVIMENTOS 
                    left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                    join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
                    join DOCUMENTOS           on DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
                    left join OPERACOES       on OPERACOES_ID   = MOVIMENTOS_ID_OPERACOES                    
                    left join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                    ${
                        buscaPorComanda ? 
                            `left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
                        : ''
                    }
                    ${
                        (status == 11 || status == 12) ? 
                            `left outer join ROMANEIOSITENS as ROMENTREGA  on ROMENTREGA.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMENTREGA.ROMANEIOSITENS_STATUS = 'E'
                             left outer join ROMANEIOSITENS as ROMMONTAGEM on ROMMONTAGEM.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMMONTAGEM.ROMANEIOSITENS_STATUS = 'M' `
                        : ''}
                    left join PESSOAS         on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
                    left join PROPRIEDADES    on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
                    left join CIDADES         on CIDADES_ID      = PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES 
                    ${
                        status == 12 
                        ? ` left join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                            left join PRODUTOS        on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS`
                        : ''
                    }
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            //Pra cada movimento, pega o caixa
            for( let ic = 0 ; ic < movimentos.length ; ic++ )
            {
                const sqlCaixaAtual = `select 
                        MOVIMENTOSCAIXA.*, 
                        PESSOAS_NOME as CONTAS_NOME, 
                        PESSOAS_TIPO as CONTAS_TIPO
                    from MOVIMENTOSCAIXA
                    left outer join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
                    where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${movimentos[ic]['MOVIMENTOS_ID']}`
        
                movimentos[ic]['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixaAtual, params);
            }
                            
            const somaMovimentos = (movimentos.length && (params.client || 'prudenmoveis').toUpperCase().match(/PRUDENMOVEIS|EDULAR|STILO/)) ? 0 : await obterSomaMovimentos(sqlWhere, params);

            await Promise.all(movimentos.map(async movimento => {
                if(usaRomaneios) {
                    const sqlRomaneios = `execute block
                    returns (
                        MOVIMENTOSITENS_ID integer,
                        MOVIMENTOSITENS_ID_PRODUTOS integer,
                        PRODUTOS_NOME varchar(100),
                        MOVIMENTOSITENS_QUANTIDADE numeric(14,3),
                        MOVIMENTOSITENS_IMEDIATA numeric(14,3),                                                
                        MOVIMENTOSITENS_ENTREGUE numeric(14,3),
                        MOVIMENTOSITENS_DEPOSITO numeric(14,3),
                        MOVIMENTOSITENS_EMROMANEIO numeric(14,3),
                        ITENS_ENTREGAR numeric(14,3))
                    as
                    begin
                    for
                        select MOVIMENTOSITENS_ID,
                            MOVIMENTOSITENS_ID_PRODUTOS,
                            PRODUTOS_NOME,
                            MOVIMENTOSITENS_QUANTIDADE,
                            MOVIMENTOSITENS_IMEDIATA,
                            MOVIMENTOSITENS_ENTREGUE,
                            MOVIMENTOSITENS_DEPOSITO
                        from MOVIMENTOSITENS
                        left join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                        where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}
                        order by MOVIMENTOSITENS_ID
                        into :MOVIMENTOSITENS_ID,
                                :MOVIMENTOSITENS_ID_PRODUTOS,
                                :PRODUTOS_NOME,
                                :MOVIMENTOSITENS_QUANTIDADE,
                                :MOVIMENTOSITENS_IMEDIATA,
                                :MOVIMENTOSITENS_ENTREGUE,
                                :MOVIMENTOSITENS_DEPOSITO
                    do
                        begin
                        select sum(ROMANEIOSITENS_QUANTIDADE) from ROMANEIOSITENS
                        where ROMANEIOSITENS_ID_ITEM = :MOVIMENTOSITENS_ID
                        into
                            :MOVIMENTOSITENS_EMROMANEIO;
                        if (MOVIMENTOSITENS_EMROMANEIO is null) then MOVIMENTOSITENS_EMROMANEIO = 0;
                        MOVIMENTOSITENS_EMROMANEIO = (MOVIMENTOSITENS_EMROMANEIO + MOVIMENTOSITENS_ENTREGUE + MOVIMENTOSITENS_DEPOSITO);
                        ITENS_ENTREGAR = (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_EMROMANEIO);
                        if (ITENS_ENTREGAR > 0) then suspend;
                        end
                    end;`;    
                    
                    movimento['MOVIMENTOS_ROMANEIOS'] = await samosFB.executeSQL(sqlRomaneios, params);
                }

                movimento['XML_AUTOMATICO'] = (movimento['PESSOAS_INCLUSAO'] || '').split('|')[1] || 'F';
                movimento['TOTAL_MOVIMENTOS'] = somaMovimentos;

                if(movimento['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
                    movimento['CIDADES_NOME'] = movimento['CIDADES_NOMEPROPRIEDADE'];
                    movimento['CIDADES_ESTADO'] = movimento['CIDADES_ESTADOPROPRIEDADE'];
                }

                if(movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003' &&   // Corrige Status de notas enviadas
                   movimento['MOVIMENTOS_STATUS'] == 'N' &&
                   movimento['MOVIMENTOS_NFE'] != '' &&
                   movimento['MOVIMENTOS_PROTOCOLO'] != '') {
                   movimento['MOVIMENTOS_STATUS'] = 'F';
                }
            }))

            return { results: movimentos, total };

        } catch(error) {
            const msg = 'Falha ao buscar movimento';
            console.log(msg);
            console.log(error);
//          throw { msg, error }; // Não para a aplicação
        }
    },
 
    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');
            let sqlWhere = ` where `;
            const orcPrazo       = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const pedidoParcial  = process.env[params.client ? ((params.client || '').toUpperCase() + '_PEDIDOPARCIAL') : 'PEDIDOPARCIAL'] == 'TRUE';            
            const usaRomaneios   = process.env[params.client ? ((params.client || '').toUpperCase() + '_ROMANEIOS') : 'ROMANEIOS'] == 'TRUE';            
            const usaPromocao    = process.env[params.client ? ((params.client || '').toUpperCase() + '_PROMOCAO') : 'PROMOCAO'] == 'TRUE';
            const isRacaforte    = (params.client || 'RACAFORTE').toUpperCase() == 'RACAFORTE';            
            const isCirurcenter   = (params.client || '').toUpperCase() == 'CIRURCENTER';            
            
            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and
                              MOVIMENTOS_NUMERO      = ${params.numero}  and
                              MOVIMENTOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` MOVIMENTOS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const nomeProduto = params.client.toUpperCase().match(/PRUDENMOVEIS|EDULAR/) ? `(PRODUTOS_NOME || ' ' || PRODUTOS_FABRICA)` : 'PRODUTOS_NOME';   // Na pruden a descrição inclui as dimensões na view 

            const sqlOrder = ` order by MOVIMENTOS_ID `;
            const sqlSearch = `select distinct
                MOVIMENTOS_ID,
                MOVIMENTOS_ID_EMPRESAS,
                EMPRESAS_ID_CIDADES,
                EMPRESAS_NOME,
                EMPRESAS_FANTASIA,
                EMPRESAS_ENDERECO,
                EMPRESAS_NUMERO,
                EMPRESAS_BAIRRO,
                EMPRESAS_CEP,
                EMPRESAS_CPFCNPJ,
                EMPRESAS_INSCRICAO,
                EMPRESAS_MUNICIPAL,
                EMPRESAS_CELULAR,
                EMPRESAS_SIMPLES,
                EMPRESAS_REGIAO12,
                EMPRESAS_CAIXA,
                CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
                EMPRESAS_TELEFONE,
                EMPRESAS_EMAIL,
                EMPRESAS_PAGINA,
                EMPRESAS_ALIQUOTA,
                EMPRESAS_CNAE,
                MOVIMENTOS_ID_PESSOAS,
                MOVIMENTOS_ID_PROPRIEDADES,
                PESSOAS_ID,
                PESSOAS_NOME,
                PESSOAS_FANTASIA,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_CEP,
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                PESSOAS_TELEFONECOBRANCA,
                PESSOAS_ENDERECOCOBRANCA,
                PESSOAS_NUMEROCOBRANCA,
                PESSOAS_BAIRROCOBRANCA,
                PESSOAS_CEPCOBRANCA,
                PESSOAS_CELULAR,
                MOVIMENTOS_CELULAR,
                PESSOAS_CREDITO,
                PESSOAS_TIPO,
                PESSOAS_RETENCAO,
                PESSOAS_CATEGORIA,
                PESSOAS_ID_CIDADES,
                PESSOAS_OBSERVACOES,
                PESSOAS_CPFCNPJ,
                PESSOAS_PAGINA,
                PESSOAS_INCLUSAO,
                PESSOAS_ID_USUARIOS,
                PESSOAS_DESCONTO,
                CIDADES.CIDADES_STATUS,
                CIDADES.CIDADES_NOME,
                CIDADES.CIDADES_ESTADO,
                CIDADES.CIDADES_IBGE,
                CIDADESCOBRANCA.CIDADES_NOME   as CIDADES_NOMECOBRANCA,
                CIDADESCOBRANCA.CIDADES_ESTADO as CIDADES_ESTADOCOBRANCA,
                PROPRIEDADES_ID_PESSOAS,
                PROPRIEDADES_CPFCNPJ,
                PROPRIEDADES_INSCRICAO,
                PROPRIEDADES_NOME,
                PROPRIEDADES_ENDERECO,
                PROPRIEDADES_NUMERO,
                PROPRIEDADES_CEP,
                PROPRIEDADES_BAIRRO,
                PROPRIEDADES_TELEFONE,
                PROPRIEDADES_CELULAR,
                CIDADESPROPRIEDADE.CIDADES_NOME   as CIDADES_NOMEPROPRIEDADE,
                CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                CIDADESPROPRIEDADE.CIDADES_IBGE   as CIDADES_IBGEPROPRIEDADE,
                MOVIMENTOS_ID_USUARIOS,
                USUARIOS_NOME,
                USUARIOS_NOME as USUARIOS_NOMEVENDEDOR,
                USUARIOS_LOGIN,
                USUARIOS_CELULAR,
                MOVIMENTOS_ID_APLICACOES,
                APLICACOES_NOME,
                MOVIMENTOS_ID_CUSTOS,
                CUSTOS_NOME,
                MOVIMENTOS_ID_OPERACOES,
                OPERACOES_NOME,
                trim(OPERACOES_ST) as OPERACOES_ST,
                trim(OPERACOES_PISCOFINS) as OPERACOES_PISCOFINS,
                trim(OPERACOES_UNICA) as OPERACOES_UNICA,
                trim(OPERACOES_TIPO) as OPERACOES_TIPO,
                trim(OPERACOES_ESTOQUE) as OPERACOES_ESTOQUE,
                OPERACOES_ACAO,
                trim(OPERACOES_FINANCEIRO) as OPERACOES_FINANCEIRO,
                trim(OPERACOES_FINALIDADE) as OPERACOES_FINALIDADE,
                trim(OPERACOES_BAIXAVISTA) as OPERACOES_BAIXAVISTA,
                trim(OPERACOES_COMPLEMENTAR) as OPERACOES_COMPLEMENTAR,
                OPERACOES_ID_APLICACOES,
                MOVIMENTOS_ID_PRAZOS,
                PRAZOS_NOME,
                PRAZOS_PARCELAS,
                PRAZOS_PARCELAMENTO,
                MOVIMENTOS_ID_DOCUMENTOS,
                DOCUMENTOSMOVIMENTO.DOCUMENTOS_NOME,
                DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID_PESSOAS,
                DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID_OPERACOES,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_ALTERAPRECO) as DOCUMENTOS_ALTERAPRECO,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_DESCONTOITEM) as DOCUMENTOS_DESCONTOITEM,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACARTAO) as DOCUMENTOS_COLETACARTAO,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACHEQUE) as DOCUMENTOS_COLETACHEQUE,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETATRANSPORTE) as DOCUMENTOS_COLETATRANSPORTE,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETAENTREGA) as DOCUMENTOS_COLETAENTREGA,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_LAYOUT) as DOCUMENTOS_LAYOUT,
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO,
                MOVIMENTOS_HORA,
                MOVIMENTOS_ENTRADASAIDA,
                MOVIMENTOS_PRODUTOS,
                MOVIMENTOS_DESCONTOS,
                MOVIMENTOS_PERCENTUAL,
                MOVIMENTOS_MARGEM,
                MOVIMENTOS_TOTAL,
                MOVIMENTOS_VALORRETENCAO,
                MOVIMENTOS_BASEICMS,
                MOVIMENTOS_VALORICMS,
                MOVIMENTOS_BASEIBSCBS,
                MOVIMENTOS_ALIQUOTAIBS,
                MOVIMENTOS_VALORIBS,
                MOVIMENTOS_ALIQUOTACBS,
                MOVIMENTOS_VALORCBS,
                MOVIMENTOS_BASEST,
                MOVIMENTOS_VALORST,
                MOVIMENTOS_VALORIPI,
                MOVIMENTOS_FRETE,
                MOVIMENTOS_SEGURO,
                MOVIMENTOS_DESPESAS,
                MOVIMENTOS_ID_EMPRESAORIGEM,
                MOVIMENTOS_NUMEROORIGEM,
                MOVIMENTOS_SERIEORIGEM,
                MOVIMENTOS_NFE,
                MOVIMENTOS_PROTOCOLO,
                MOVIMENTOS_OBSERVACOES as OBSBRUTA,    
                trim(MOVIMENTOS_STATUS) as MOVIMENTOS_STATUS,
                trim(MOVIMENTOS_SITUACAO) as MOVIMENTOS_SITUACAO,
                MOVIMENTOS_LOG,
                PESSOAS_EMAIL,
                PESSOAS_PAGINA,
                MOVIMENTOS_EMAIL,
                MOVIMENTOS_NOME,
                MOVIMENTOS_CPFCNPJ,
                MOVIMENTOS_IMPOSTO, 
                cast ((
                    select sum(MOVIMENTOSITENS_IMEDIATA * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                    join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                    where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                          MOVIMENTOSITENS_CSTPIS <> 'ML'
                ) as numeric(12,2)) as MONTAGENS_VALOR,
                ROMANEIOS_STATUS,
                DOCUMENTOSROMANEIO.DOCUMENTOS_NOME as ROMANEIOS_DOCUMENTO, 
                (
                    iif((select count(*) from MOVIMENTOSITENS
                        where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                MOVIMENTOSITENS_DEPOSITO = 0) = 0, 'T', 'F')
                ) as RESERVAS_STATUS 
            from MOVIMENTOS
            left join EMPRESAS     on EMPRESAS_ID     = MOVIMENTOS_ID_EMPRESAS
            left join PESSOAS      on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
            left join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
            left join CIDADES      on CIDADES.CIDADES_ID = PESSOAS_ID_CIDADES
            left join CIDADES as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS.EMPRESAS_ID_CIDADES
            left join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES
            left join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS_ID_CIDADESCOBRANCA
            left join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
            left join PRAZOS     on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
            left outer join APLICACOES on APLICACOES_ID = MOVIMENTOS_ID_APLICACOES
            left outer join CUSTOS     on CUSTOS_ID = MOVIMENTOS_ID_CUSTOS
            left join DOCUMENTOS DOCUMENTOSMOVIMENTO on DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            left join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
            left join ROMANEIOSITENS on ROMANEIOSITENS_ID_MOVIMENTOS   = MOVIMENTOS_ID
            left join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS   = ROMANEIOS_ID
            left join DOCUMENTOS DOCUMENTOSROMANEIO on DOCUMENTOSROMANEIO.DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
            
            ${sqlWhere} ${sqlOrder}`; 

            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(movimentos.map(async movimento => {
                const isNotaEletronica = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';
                const isNotaEntrada    = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0005';
                const isPedido         = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
                const isPedidoCompra   = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
                const isOrcamentoPrazo = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
                const isPreVendaPrazo  = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0021' && orcPrazo;
                const idProfissional   = movimento['MOVIMENTOS_PROTOCOLO'] || '';
                let idMovimentoDestino = 0;

                movimento['MOVIMENTOS_OBSERVACOES'] = (movimento['OBSBRUTA'] || '').replace(/\\n/g, '\n'); // Tratamento para quebra de linha

                if(isPedido && idProfissional && params.client.toUpperCase().match(/LISLAIS/)) {
                    const searchProfissional = await samosFB.executeSQL(`select USUARIOS_NOME from USUARIOS where USUARIOS_ID = ${idProfissional}`, params);
                    movimento['PROFISSIONAIS_NOME'] = searchProfissional[0]['USUARIOS_NOME'] || '';
                }

                if(isNotaEletronica && 
                   !utils.string.isEmail(movimento['MOVIMENTOS_EMAIL']) &&
                    utils.string.isEmail(movimento['PESSOAS_EMAIL'])) {
                    const emailPessoa = movimento['PESSOAS_EMAIL'];
                    const idMovimento = movimento['MOVIMENTOS_ID'];
                    await samosFB.executeSQL(`update MOVIMENTOS set MOVIMENTOS_EMAIL = '${emailPessoa}' where MOVIMENTOS_ID = ${idMovimento}`, params);
                    movimento['MOVIMENTOS_EMAIL'] = emailPessoa;
                }

                if(isNotaEletronica && 
                   movimento['MOVIMENTOS_STATUS'] == 'N' &&
                   movimento['MOVIMENTOS_NFE'] != '' &&
                   movimento['MOVIMENTOS_PROTOCOLO'] != ''
                   ) {
                    await samosFB.executeSQL(`update MOVIMENTOS set MOVIMENTOS_STATUS = 'F' where MOVIMENTOS_ID = ${movimento['MOVIMENTOS_ID']}`, params);
                    movimento['MOVIMENTOS_STATUS'] = 'F';
                }

                if(isPedidoCompra || isOrcamentoPrazo || isPreVendaPrazo) {
                    const obsValue = movimento['MOVIMENTOS_OBSERVACOES'] || '';
                    const percentuaisValue = movimento['MOVIMENTOS_NFE'] || ''; // % Frete, Seguro, IPI
                    const partes = obsValue.split('|');
                    const financeiroscompra = (partes.slice(3, 4)[0] || '').split('#')
                        .filter(financeiro => !!financeiro)
                        .map((financeiro, index) => {
                            return {
                                'MOVIMENTOSFINANCEIROSCOMPRA_ID'           : index + 1,
                                'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS': movimento['MOVIMENTOS_ID'],
                                'MOVIMENTOSFINANCEIROSCOMPRA_VCTO'         : (financeiro || '').split('*')[0],
                                'MOVIMENTOSFINANCEIROSCOMPRA_VALOR'        : (financeiro || '').split('*')[1]
                            }
                        });
    
                    movimento['PERCENTUAL_FRETE']  = (percentuaisValue || '').split('|')[0] || 0;
                    movimento['PERCENTUAL_SEGURO'] = (percentuaisValue || '').split('|')[1] || 0;
                    movimento['PERCENTUAL_IPI']    = (percentuaisValue || '').split('|')[2] || 0;
                    movimento['MOVIMENTOS_OBSERVACOES'] = partes.slice(0, 3).join('|');
                    movimento['MOVIMENTOS_FINANCEIROSCOMPRA'] = financeiroscompra
                }

                //Para pedidos parciais da pruden aco
                if( isPedido && pedidoParcial ) {
                    const sqlQueryBaixasParciais = `
                        select * from CREDITOS
                        where CREDITOS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']} and
                              CREDITOS_TIPO = 'B';
                    `;

                    //Busca as baixas aqui
                    movimento['BAIXASPARCIAIS_MOVIMENTO'] = await samosFB.executeSQL(sqlQueryBaixasParciais, params);

                }else{
                    movimento['BAIXASPARCIAIS_MOVIMENTO'] = [];
                }

                movimento['XML_AUTOMATICO'] = (movimento['PESSOAS_INCLUSAO'] || '').split('|')[1] || 'F';
                movimento['VCTO_FIXO'] =      (movimento['PESSOAS_OBSERVACOES'] || '').split('|')[1] || '';

                let sqlTotalBruto = '';
                let sqlTotalLiquido = '';
                let sqlPromocao = '';

                if(usaPromocao) {
                    sqlPromocao = `
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALOR from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as VALOR_PROMOCAO,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORA from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as VALOR_PROMOCAOA,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORB from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as VALOR_PROMOCAOB,
                    (
                        select first 1 skip 0 PROMOCOESITENS_VALORC from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as VALOR_PROMOCAOC,
                    (
                        select first 1 skip 0 PROMOCOESITENS_CUSTOTECNICO from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as QTDE_PROMOCAO, `;
                }

                if(isNotaEletronica && !isRacaforte) { // Terá casos em que não irá arredondar, deverá truncar, então considerar o que estiver no BD.
                    sqlTotalBruto  = 'MOVIMENTOSITENS_TOTAL'
                    sqlTotalLiquido = 'cast((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO'
                } else {
                  if(isRacaforte && isNotaEntrada) { // Terá casos em que não irá arredondar, deverá truncar, então considerar o que estiver no BD.
                    sqlTotalBruto  = 'MOVIMENTOSITENS_TOTAL'
                    sqlTotalLiquido = 'cast((MOVIMENTOSITENS_TOTAL - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO'
                  } else {
                    sqlTotalBruto   = 'cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL'
                    sqlTotalLiquido = 'cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO'
                  }
                }

                const sqlItens = `select distinct 
                    MOVIMENTOSITENS_ID,
                    MOVIMENTOSITENS_ID_MOVIMENTOS,
                    MOVIMENTOSITENS_ID_OPERACOES,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_PRECO,
                    MOVIMENTOSITENS_CUSTO,
                    MOVIMENTOSITENS_MARGEM,
                    MOVIMENTOSITENS_PERCENTUAL,
                    MOVIMENTOSITENS_DESCONTOS,
                    ${sqlTotalBruto},
                    MOVIMENTOSITENS_ALIQUOTAPIS,
                    MOVIMENTOSITENS_CSTPIS,
                    MOVIMENTOSITENS_BASEPIS,
                    MOVIMENTOSITENS_VALORPIS,
                    MOVIMENTOSITENS_VALORPISST,
                    MOVIMENTOSITENS_ALIQUOTACOFINS,
                    MOVIMENTOSITENS_CSTCOFINS,
                    MOVIMENTOSITENS_BASECOFINS,
                    MOVIMENTOSITENS_VALORCOFINS,
                    MOVIMENTOSITENS_VALORCOFINSST,
                    MOVIMENTOSITENS_ICMS,
                    MOVIMENTOSITENS_BASEICMS,
                    MOVIMENTOSITENS_VALORICMS,
                    MOVIMENTOSITENS_IPI,
                    MOVIMENTOSITENS_VALORIPI,
                    MOVIMENTOSITENS_BASEST,
                    MOVIMENTOSITENS_VALORST,
                    MOVIMENTOSITENS_FRETE,
                    MOVIMENTOSITENS_SEGURO,
                    MOVIMENTOSITENS_DESPESAS,
                    MOVIMENTOSITENS_IMPOSTO,
                    MOVIMENTOSITENS_CST,
                    left(trim(MOVIMENTOSITENS_CST), 1) as TABELA_ORIGEM,
                    trim(substring(MOVIMENTOSITENS_CST from 2 for 3)) as TABELA_LOCAL,
                    MOVIMENTOSITENS_ESCRITURACAO,
                    MOVIMENTOSITENS_EXCECAO,
                    MOVIMENTOSITENS_ID_EMPRESAS,
                    MOVIMENTOSITENS_ID_LOTES,
                    MOVIMENTOSITENS_ENTREGUE,
                    MOVIMENTOSITENS_IMEDIATA,
                    iif((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012'), 'T', '') as ITENS_DEVOLUCAO,
                    MOVIMENTOSITENS_DATAMONTAGEM,
                    MOVIMENTOSITENS_HORAMONTAGEM,
                    MOVIMENTOSITENS_DATAENTREGA,
                    MOVIMENTOSITENS_HORAENTREGA,
                    MOVIMENTOSITENS_DEPOSITO,
                    iif(((MOVIMENTOSITENS_ID_PRODUTOS=999999) or (PRODUTOS_EDITAVEL = 'T')),
                       coalesce(RELACOESITENS_NOME, PRODUTOS_NOME), ${nomeProduto}) as PRODUTOS_NOME, 
                    PRODUTOS_ID,   
                    PRODUTOS_DERIVADO, 
                    PRODUTOS_EDITAVEL,
                    PRODUTOS_UNIDADE,
                    PRODUTOS_REFERENCIA,
                    PRODUTOS_EMBALAGEM,
                    PRODUTOS_STATUS,
                    iif(((MOVIMENTOSITENS_ID_PRODUTOS=999999) or (PRODUTOS_EDITAVEL = 'T')),
                       coalesce(RELACOESITENS_NOME, PRODUTOS_DESCRICAO), PRODUTOS_DESCRICAO) as PRODUTOS_DESCRICAO, 
                    PRODUTOS_MARCA, 
                    PRODUTOS_FABRICA,
                    PRODUTOS_APLICACAO, 
                    PRODUTOS_PESOLIQUIDO, 
                    PRODUTOS_PESOBRUTO,
                    PRODUTOS_ID_GRUPOS,
                    PRODUTOS_LISTAPRECO,
                    PRODUTOS_BARRA,
                    PRODUTOS_REFERENCIA,
                    ${sqlTotalLiquido},
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as numeric(12,2)) as TOTAL_CUSTO,
                    (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_ENTREGUE - MOVIMENTOSITENS_DEPOSITO - MOVIMENTOSITENS_IMEDIATA) as ITENS_ENTREGAR,
                    (iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SALDOS_CUSTO, 
                    SALDOS_COMPRA, 
                    SALDOS_PRECO, 
                    SALDOS_PRAZO, 
                    SALDOS_DISPONIVEL, 
                    SALDOS_IPI, 
                    SALDOS_RESERVADO,
                    SALDOS_CSTLOCAL, 
                    SALDOS_CSTOUTROS, 
                    SALDOS_CSTSUBST,
                    SALDOS_EXCECAO,
                    SALDOS_LOCAL,
                    SALDOS_TRANSFERENCIA, 
                    SALDOS_ICMSLC, 
                    SALDOS_ICMS01, 
                    SALDOS_ICMS02, 
                    SALDOS_MARGEM, 
                    SALDOS_PRECOMINIMO,   
                    SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                    SALDOS_CUSTO as NOVO_CUSTO, 
                    SALDOS_MARGEM as NOVO_MARGEM,
                    SALDOS_PRECO as NOVO_PRECO, 
                    SALDOS_PRAZO as NOVO_PRAZO,
                    SALDOS_COMPRA as NOVO_COMPRA,
                    ${sqlPromocao}
                    SALDOS_BASELC, 
                    SALDOS_BASE01, 
                    SALDOS_BASE02,
                    SALDOS_BENEFICIOLC,
                    SALDOS_BENEFICIO01,
                    SALDOS_BENEFICIO02,
                    SALDOS_ALIQUOTASUBST,
                    NCMS_STATUS,
                    NCMS_NCM, 
                    NCMS_ALIQUOTANACIONAL,  
                    NCMS_ALIQUOTAESTADUAL,
                    NCMS_ALIQUOTAIMPORTADO, 
                    NCMS_ALIQUOTAMUNICIPAL, 
                    NCMS_CSTPIS, 
                    NCMS_ALIQUOTAPIS, 
                    NCMS_CSTCOFINS,  
                    NCMS_ALIQUOTACOFINS, 
                    NCMS_ALIQUOTAFCP, 
                    NCMS_DIFAL,
                    NCMS_CEST,
                    OPERACOES_NOME,
                    OPERACOES_ST,
                    EMPRESAS_FANTASIA,
                    LOTES_ID,
                    LOTES_ID_PRODUTOS,
                    LOTES_NOME,
                    LOTES_REFERENCIA,
                    LOTES_FABRICACAO,
                    LOTES_VALIDADE,
                    0 as ITENS_MARGEM,
                    iif(LOTES_FABRICACAO < '01.01.1990', '', (lpad(extract(month from LOTES_FABRICACAO), 2, '0') || '/' || extract(year from LOTES_FABRICACAO))) as FABRICACAO_ABR,
                    iif(LOTES_VALIDADE < '01.01.1990', '', (lpad(extract(month from LOTES_VALIDADE),   2, '0') || '/' || extract(year from LOTES_VALIDADE)))     as VALIDADE_ABR,    
                    iif(MOVIMENTOSITENS_CSTPIS = 'ML', 0, cast(MOVIMENTOSITENS_IMEDIATA * MOVIMENTOSITENS_QUANTIDADE as numeric(12,2))) as MONTAGENS_VALOR
                from MOVIMENTOSITENS
                join MOVIMENTOS          on MOVIMENTOS_ID                 = MOVIMENTOSITENS_ID_MOVIMENTOS
                left join RELACOESITENS  on MOVIMENTOSITENS_ID_MOVIMENTOS = RELACOESITENS_ID_MOVIMENTOS and 
                                            MOVIMENTOSITENS_ID            = RELACOESITENS_ID_ITENS
                left join PRODUTOS       on PRODUTOS_ID                   = MOVIMENTOSITENS_ID_PRODUTOS
                left join SALDOS         on SALDOS_ID_EMPRESAS            = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join NCMS     on NCMS_ID                       = PRODUTOS_ID_NCMS
                left outer join LOTES    on LOTES_ID                      = MOVIMENTOSITENS_ID_LOTES
                left join OPERACOES      on OPERACOES_ID                  = MOVIMENTOSITENS_ID_OPERACOES
                left outer join EMPRESAS on EMPRESAS_ID                   = MOVIMENTOSITENS_ID_EMPRESAS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']} 
                order by MOVIMENTOSITENS_ID`;

                movimento['MOVIMENTOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);

                const sqlCaixa = `select 
                    MOVIMENTOSCAIXA.*, 
                    PESSOAS_NOME as CONTAS_NOME, 
                    PESSOAS_TIPO as CONTAS_TIPO,
                    CONTACORRENTES_DOCUMENTO
                from MOVIMENTOSCAIXA
                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
                left outer join CONTACORRENTES on CONTACORRENTES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`
    
                movimento['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixa, params);

             // Hospitalar mostra caixa/financeiro do novo documento, caso ele tenha sido faturado (para consulta)...

                if(params.client.toUpperCase().match(/HOSPITALAR/) && 
                   movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002' &&  // Pedido
                   movimento['MOVIMENTOS_CAIXA'].length == 0 &&                             // Sem caixa
                   movimento['MOVIMENTOS_STATUS'] == 'F' &&                                 // Faturado
                   movimento['MOVIMENTOS_NUMEROORIGEM'] > 0) {                              // Com número de origem

                    const sqlMovimentoDestino = `select MOVIMENTOS_ID from MOVIMENTOS 
                                where MOVIMENTOS_ID_EMPRESAS = ${movimento['MOVIMENTOS_ID_EMPRESAORIGEM']} and
                                      MOVIMENTOS_NUMERO      = ${movimento['MOVIMENTOS_NUMEROORIGEM']} and
                                      MOVIMENTOS_SERIE       = '${movimento['MOVIMENTOS_SERIEORIGEM']}' `

                    const movimentoDestino = await samosFB.executeSQL(sqlMovimentoDestino, params);

                    if(movimentoDestino.length > 0) {
                        idMovimentoDestino = movimentoDestino[0]['MOVIMENTOS_ID'];
                        const sqlCaixaDestino = `select 
                                    MOVIMENTOSCAIXA.*, 
                                    PESSOAS_NOME as CONTAS_NOME, 
                                    PESSOAS_TIPO as CONTAS_TIPO
                                from MOVIMENTOSCAIXA
                                join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
                                where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${idMovimentoDestino}`
                    
                        movimento['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixaDestino, params);    
                    }
                }

                const sqlFormas = `select MOVIMENTOSFORMAS.*, MOVIMENTOS_BASEICMS, MOVIMENTOS_BASEST, MOVIMENTOS_VALORIPI from MOVIMENTOSFORMAS
                    join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSFORMAS_ID_MOVIMENTOS
                    where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_FORMASPAGAMENTO'] = await samosFB.executeSQL(sqlFormas, params);

                const sqlCartoes = `select 
                    CARTOES.*, 
                    OPERADORAS_NOME, 
                    OPERADORAS_AVISTA, 
                    OPERADORAS_PARCELADO
                from CARTOES
                left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
                where CARTOES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_CARTOES'] = await samosFB.executeSQL(sqlCartoes, params);

                const sqlContacorrentes = `select 
                    CONTACORRENTES.*, 
                    PESSOAS_NOME
                from CONTACORRENTES
                left outer join PESSOAS on PESSOAS_ID = CONTACORRENTES_ID_PESSOAS
                where CONTACORRENTES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_CONTACORRENTES'] = await samosFB.executeSQL(sqlContacorrentes, params);

                const sqlCheques = `select CHEQUES.*, CIDADES_NOME, CIDADES_ESTADO from CHEQUES 
                    left outer join CIDADES on CIDADES_ID = CHEQUES_ID_CIDADES
                    where CHEQUES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_CHEQUES'] = await samosFB.executeSQL(sqlCheques, params);

                const sqlFinanceiros = `select 
                    FINANCEIROS.*,
                    PORTADORES_NOME, 
                    PESSOAS_NOME, 
                    PESSOAS_TIPO,
                    (FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
                from FINANCEIROS 
                left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
                left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
                where FINANCEIROS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB.executeSQL(sqlFinanceiros, params);

                if((movimento['MOVIMENTOS_FINANCEIROS'] || []).length > 0) {
                    movimento['PORTADORES_ID'] = movimento['MOVIMENTOS_FINANCEIROS'][0]['FINANCEIROS_ID_PORTADORES'];
                }

                // Hospitalar pegar caixa/financeiro do novo documento, para consulta...

                if(params.client.toUpperCase().match(/HOSPITALAR/) && 
                   idMovimentoDestino > 0 && 
                   movimento['MOVIMENTOS_FINANCEIROS'].length == 0) {                
                    const sqlFinanceirosDestino = `select 
                                                FINANCEIROS.*,
                                                PORTADORES_NOME, 
                                                PESSOAS_NOME, 
                                                PESSOAS_TIPO,
                                                (FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
                                            from FINANCEIROS 
                                            left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
                                            left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
                                            where FINANCEIROS_ID_MOVIMENTOS = ${idMovimentoDestino}`;
                    movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB.executeSQL(sqlFinanceirosDestino, params);
                }

                // hospitalar pega o que o cliente tem em aberto no financeiro, exceto o movimento atual
                if(params.client.toUpperCase().match(/HOSPITALAR/)) {  // Desbloquear antes de atualizar a versáo              
                    const sqlIdMovimento = cents(movimento['MOVIMENTOS_ID']) > 0 ? ` and FINANCEIROS_ID_MOVIMENTOS <> ${movimento['MOVIMENTOS_ID']}` : '';
                    const sqlFinanceiroPessoa = `select sum(FINANCEIROS_ABERTO) as TOTALABERTO_PESSOA
                                            from FINANCEIROS 
                                            where FINANCEIROS_ID_PESSOAS = ${movimento['MOVIMENTOS_ID_PESSOAS']} ${sqlIdMovimento}`;
                    const resultadoFinanceiro = await samosFB.executeSQL(sqlFinanceiroPessoa, params);
                    movimento['ABERTO_FINANCEIROPESSOA'] = (resultadoFinanceiro[0]['TOTALABERTO_PESSOA'] || 0);
                }

                const sqlEnvio = `select 
                    MOVIMENTOSENVIO.*, 
                    TRANSPORTES_EMAIL,
                    CIDADES_NOME, 
                    CIDADES_ESTADO, 
                    USUARIOS_NOME as VETERINARIOS_NOME,
                    USUARIOS_CPFCNPJ as VETERINARIOS_CPF
                from MOVIMENTOSENVIO
                join TRANSPORTES on TRANSPORTES_ID = MOVIMENTOSENVIO_ID_TRANSPORTES
                left outer join USUARIOS on USUARIOS_ID = MOVIMENTOSENVIO_ID_USUARIOS                
                join CIDADES on CIDADES_ID = MOVIMENTOSENVIO_ID_CIDADES
                where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_ENVIO'] = await samosFB.executeSQL(sqlEnvio, params);

                if((movimento['MOVIMENTOS_ENVIO'] || []).length > 0) {
                    movimento['MOVIMENTOSENVIO_ID_USUARIOS'] = movimento['MOVIMENTOS_ENVIO'][0]['MOVIMENTOSENVIO_ID_USUARIOS'];
                    movimento['VETERINARIOS_NOME']           = movimento['MOVIMENTOS_ENVIO'][0]['VETERINARIOS_NOME'];
                    movimento['VETERINARIOS_CPF']            = movimento['MOVIMENTOS_ENVIO'][0]['VETERINARIOS_CPF'];
                }

                const sqlCartas = `select MOVIMENTOSCARTAS.*, MOVIMENTOS_NFE from MOVIMENTOSCARTAS 
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCARTAS_ID_MOVIMENTOS
                where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}
                order by MOVIMENTOSCARTAS_ID`

                movimento['MOVIMENTOS_CARTAS'] = await samosFB.executeSQL(sqlCartas, params);

                if(usaRomaneios) {
                    const sqlRomaneiosMoveis =  `select 
                                                        ROMANEIOSITENS_ID, 
                                                        ROMANEIOS_NUMERO, 
                                                        iif(PESSOAS_FANTASIA = '' or PESSOAS_FANTASIA is null, PESSOAS_NOME, PESSOAS_FANTASIA) as PESSOAS_FANTASIA,
                                                        ROMANEIOS_STATUS,
                                                        ROMANEIOS_EMISSAO,
                                                        DOCUMENTOS_NOME 
                                                    from ROMANEIOSITENS
                                                    join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                                                    join DOCUMENTOS on ROMANEIOS_ID_DOCUMENTOS = DOCUMENTOS_ID
                                                    left outer join PESSOAS on PESSOAS_ID = ROMANEIOS_ID_PESSOAS
                                                    where ROMANEIOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                    movimento['ROMANEIOS_MOVEIS'] = await samosFB.executeSQL(sqlRomaneiosMoveis, params);

                    const sqlRomaneios = `execute block
                                        returns (
                                            MOVIMENTOSITENS_ID integer,
                                            MOVIMENTOSITENS_ID_PRODUTOS integer,
                                            PRODUTOS_NOME varchar(100),
                                            MOVIMENTOSITENS_QUANTIDADE numeric(14,3),
                                            MOVIMENTOSITENS_IMEDIATA numeric(14,3),                                                
                                            MOVIMENTOSITENS_ENTREGUE numeric(14,3),
                                            MOVIMENTOSITENS_DEPOSITO numeric(14,3),
                                            MOVIMENTOSITENS_EMROMANEIO numeric(14,3),
                                            ITENS_ENTREGAR numeric(14,3))
                                        as
                                        begin
                                        for
                                            select MOVIMENTOSITENS_ID,
                                                MOVIMENTOSITENS_ID_PRODUTOS,
                                                PRODUTOS_NOME,
                                                MOVIMENTOSITENS_QUANTIDADE,
                                                MOVIMENTOSITENS_IMEDIATA,
                                                MOVIMENTOSITENS_ENTREGUE,
                                                MOVIMENTOSITENS_DEPOSITO
                                            from MOVIMENTOSITENS
                                            left join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                                            where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}
                                            order by MOVIMENTOSITENS_ID
                                            into :MOVIMENTOSITENS_ID,
                                                    :MOVIMENTOSITENS_ID_PRODUTOS,
                                                    :PRODUTOS_NOME,
                                                    :MOVIMENTOSITENS_QUANTIDADE,
                                                    :MOVIMENTOSITENS_IMEDIATA,
                                                    :MOVIMENTOSITENS_ENTREGUE,
                                                    :MOVIMENTOSITENS_DEPOSITO
                                        do
                                            begin
                                            select sum(ROMANEIOSITENS_QUANTIDADE) from ROMANEIOSITENS
                                            where ROMANEIOSITENS_ID_ITEM = :MOVIMENTOSITENS_ID
                                            into
                                                :MOVIMENTOSITENS_EMROMANEIO;
                                            if (MOVIMENTOSITENS_EMROMANEIO is null) then MOVIMENTOSITENS_EMROMANEIO = 0;
                                            MOVIMENTOSITENS_EMROMANEIO = (MOVIMENTOSITENS_EMROMANEIO + MOVIMENTOSITENS_ENTREGUE + MOVIMENTOSITENS_DEPOSITO);
                                            ITENS_ENTREGAR = (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_EMROMANEIO);
                                            if (ITENS_ENTREGAR > 0) then suspend;
                                            end
                                        end;`;

                    movimento['MOVIMENTOS_ROMANEIOS'] = await samosFB.executeSQL(sqlRomaneios, params);
                }

            }));

            return { 
                results: movimentos, 
                total  : movimentos.length 
            };

        } catch(error) {
            const msg = 'Falha ao buscar movimentos por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (movimento, params) => {

        try {

            const isHerbiquimica = (params.client || '').toUpperCase() == 'HERBIQUIMICA';
            const isHermes       = (params.client || '').toUpperCase() == 'HERMES';
            const isOzoniobras   = (params.client || '').toUpperCase() == 'OZONIOBRAS';
            const isPinguim      = (params.client || '').toUpperCase() == 'PINGUIM';
            const isPrudenmoveis = (params.client || '').toUpperCase().match(/PRUDENMOVEIS|EDULAR/);
            const isRacaforte    = (params.client || '').toUpperCase() == 'RACAFORTE';
            const isCirurcenter  = (params.client || '').toUpperCase() == 'CIRURCENTER' || (params.client || 'CIRURCENTER').toUpperCase() == 'CIRURCENTER';
            const isTurbotec     = (params.client || '').toUpperCase() == 'TURBOTEC' || (params.client || 'SANTANA').toUpperCase() == 'SANTANA';
            const isAcomtf       = (params.client || '').toUpperCase() == 'ACOMTF';
            const isTopbob       = (params.client || '').toUpperCase() == 'TOPBOB';

            if(isHerbiquimica && movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10001) {
                movimento['MOVIMENTOS_ID_DOCUMENTOS'] = 10002; // Converte todo orçamento pra pedido na herbiquimica (Uso no mobile)
                movimento['MOVIMENTOS_ID_OPERACOES'] = 500000; // Pedido
            }

            if(isRacaforte && movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10002 && 
               (movimento['MOVIMENTOS_ID_OPERACOES'] || '') == 400000) {
                movimento['MOVIMENTOS_ID_OPERACOES'] = 500000; // Pedido
            }

            if((isRacaforte || isCirurcenter) && movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10004 && 
                (movimento['MOVIMENTOS_ID_OPERACOES'] || '') == 400000) {
                movimento['MOVIMENTOS_ID_OPERACOES'] = 600000; // Pendencia
            }

            const { numero, serie } = await samosFB.ultimoDocto('MOVIMENTOS', movimento, params);
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora = moment.tz(params.timezone).format('HH:mm:ss');
            const cents = utils.number.cents.bind(utils.number);
            const empresa = movimento['MOVIMENTOS_ID_EMPRESAS'];
            const orcPrazo             = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const isPedidoCompra       = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
            const isOrcamentoPrazo     = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
            const isPreVendaPrazo      = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0021' && orcPrazo;
            const isMovimentoSaida     = movimento['OPERACOES_TIPO'] == 'S';
            const isComplementar       = movimento['OPERACOES_COMPLEMENTAR'] == 'T';
            const isNotaEntrada        = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0005';
            const isNotaEletronica     = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';
            const isRequisicaoEntrada  = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0004' && movimento['MOVIMENTOS_ID_OPERACOES'] < 500000;
            const isRequisicaoNumerada = isRequisicaoEntrada && movimento['MOVIMENTOS_NUMERO'];
            const isTransferencia      = movimento['DOCUMENTOS_NOME'].match(/Transfer/);
            const isPedidoVenda        = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
            const isPedidoPrudenmoveis = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002' && isPrudenmoveis;
            const isOrcamento          = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001';
            const isReqAcerto          = movimento['MOVIMENTOS_ID_OPERACOES'] == 200000;

            const custos = [];
            let caixaRaca = [];
            let envioRaca = [];

            if(isRacaforte && 
                movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10001 &&
                (movimento['MOVIMENTOS_SITUACAO'] || '').toString().match(/B|C|D|E|F/)) { // Orcamento raca gera o caixa auto
                caixaRaca.push({
                    'MOVIMENTOSCAIXA_TIPO'          : 'E',
                    'MOVIMENTOSCAIXA_ID_PESSOAS'    : movimento['MOVIMENTOS_ID_PESSOAS'],
                    'MOVIMENTOSCAIXA_DINHEIRO'      : (movimento['MOVIMENTOS_SITUACAO'] == 'B' ? movimento['MOVIMENTOS_TOTAL'] : 0),
                    'MOVIMENTOSCAIXA_DEBITO'        : (movimento['MOVIMENTOS_SITUACAO'] == 'C' ? movimento['MOVIMENTOS_TOTAL'] : 0),
                    'MOVIMENTOSCAIXA_CREDITO'       : (movimento['MOVIMENTOS_SITUACAO'] == 'D' ? movimento['MOVIMENTOS_TOTAL'] : 0),
                    'MOVIMENTOSCAIXA_TRANSFERENCIAS': (movimento['MOVIMENTOS_SITUACAO'] == 'E' ? movimento['MOVIMENTOS_TOTAL'] : 0),
                    'MOVIMENTOSCAIXA_CHEQUE'        : (movimento['MOVIMENTOS_SITUACAO'] == 'F' ? movimento['MOVIMENTOS_TOTAL'] : 0),
                });
                movimento['MOVIMENTOS_CAIXA'] = caixaRaca;
            }

            if(isRacaforte && 
                movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10002 &&
                (movimento['MOVIMENTOS_ENVIO'] || []).length == 0) { // Pedido raca gera o transporte auto
                envioRaca.push({
                    'MOVIMENTOSENVIO_ID': -1,
                    'MOVIMENTOSENVIO_ID_CIDADES': movimento['EMPRESAS_ID_CIDADES'],
                    'MOVIMENTOSENVIO_REFERENTE' : '',
                    'MOVIMENTOSENVIO_QUANTIDADE' : 1,
                    'MOVIMENTOSENVIO_PESOLIQUIDO' : 0,
                    'MOVIMENTOSENVIO_CEP' : '',
                    'MOVIMENTOSENVIO_ID_TRANSPORTES' : 1,
                    'MOVIMENTOSENVIO_PESOBRUTO' : 0,
                    'MOVIMENTOSENVIO_MODO': 'F',
                    'MOVIMENTOSENVIO_NOME': 'O MESMO',
                    'MOVIMENTOSENVIO_INSCRICAO': '',
                    'MOVIMENTOSENVIO_ENDERECO': '',
                    'MOVIMENTOSENVIO_NUMERO': '',
                    'MOVIMENTOSENVIO_BAIRRO': '',
                    'MOVIMENTOSENVIO_MOTORISTA': '',
                    'MOVIMENTOSENVIO_PLACA': '',
                    'MOVIMENTOSENVIO_PLACAUF': '',
                    'MOVIMENTOSENVIO_ESPECIE': '',
                    'MOVIMENTOSENVIO_MARCA': '',
                    'MOVIMENTOSENVIO_VOLUMES': '',
                    'MOVIMENTOSENVIO_DATADI': '1899-12-30',
                    'MOVIMENTOSENVIO_DTDESEMBARQUE': '1899-12-30'
                });
                
                movimento['MOVIMENTOS_ENVIO'] = envioRaca;
            }
                        
            if((isPedidoVenda || isNotaEletronica) && !isPedidoPrudenmoveis ) {
                movimento['MOVIMENTOS_STATUS'] = 'N';
            }

            if(isNotaEletronica && (movimento['MOVIMENTOS_ENTRADASAIDA'] || '1899-12-30').match('1899')) {
                movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
            }

            movimento['MOVIMENTOS_BASEIBSCBS']  = cents(movimento['MOVIMENTOS_BASEIBSCBS']) / 100;
            movimento['MOVIMENTOS_ALIQUOTAIBS'] = movimento['MOVIMENTOS_ALIQUOTAIBS'] || 0;
            movimento['MOVIMENTOS_VALORIBS']    = cents(movimento['MOVIMENTOS_VALORIBS']) / 100;
            movimento['MOVIMENTOS_ALIQUOTACBS'] = movimento['MOVIMENTOS_ALIQUOTACBS'] || 0;
            movimento['MOVIMENTOS_VALORCBS']    = cents(movimento['MOVIMENTOS_VALORCBS']) / 100;

            if(!isNotaEntrada && !isRequisicaoNumerada) {
                movimento['MOVIMENTOS_NUMERO']  = numero;
                movimento['MOVIMENTOS_SERIE']   = serie;
                movimento['MOVIMENTOS_EMISSAO'] = (params.gravarEmissaoRecebida == 'true' || isPedidoCompra || isReqAcerto) && movimento['MOVIMENTOS_EMISSAO'] ? movimento['MOVIMENTOS_EMISSAO'] : hoje;
                movimento['MOVIMENTOS_HORA']    = (params.gravarEmissaoRecebida == 'true' || isPedidoCompra || isReqAcerto) && movimento['MOVIMENTOS_HORA']    ? movimento['MOVIMENTOS_HORA']    : hora;
                movimento['MOVIMENTOS_LOG']     = params.userLogin + ' ' + movimento['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + movimento['MOVIMENTOS_HORA'];

                if(isReqAcerto) {
                    movimento['MOVIMENTOS_ENTRADASAIDA'] = movimento['MOVIMENTOS_EMISSAO'];
                } else {
                    if((movimento['MOVIMENTOS_STATUS'] || '').match('F') &&
                       (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')) {
                        movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
                    }    
                }

                if(isComplementar) {
                    movimento['MOVIMENTOS_PRODUTOS'] = 0;
                    movimento['MOVIMENTOS_TOTAL'] = 0;
                }

                (movimento['MOVIMENTOS_CARTOES'] || []).forEach(cartao => {
                    cartao['CARTOES_ORIGEM'] = numero;
                    cartao['CARTOES_SERIE']  = serie;
                });

                (movimento['MOVIMENTOS_CHEQUES'] || []).forEach(cheque => {
                    cheque['CHEQUES_ORIGEM'] = numero;
                    cheque['CHEQUES_SERIE']  = serie;
                });

                (movimento['MOVIMENTOS_FINANCEIROS'] || []).forEach(financeiro => {
                    financeiro['FINANCEIROS_EMISSAO']    = hoje;
                    financeiro['FINANCEIROS_VENCIMENTO'] = moment(financeiro['FINANCEIROS_VENCIMENTO'] || '1899-12-30').format('YYYY-MM-DD');
                    financeiro['FINANCEIROS_NUMERO']     = numero;
                    financeiro['FINANCEIROS_SERIE']      = serie;
                    financeiro['FINANCEIROS_ID_APLICACOES'] = movimento['MOVIMENTOS_ID_APLICACOES'] || movimento['OPERACOES_ID_APLICACOES'] || 1;
                });
            } else {
                if(!movimento['MOVIMENTOS_NUMERO']) {
                    movimento['MOVIMENTOS_NUMERO']  = numero;
                    movimento['MOVIMENTOS_SERIE']   = serie;
                    movimento['MOVIMENTOS_EMISSAO'] = hoje
                    movimento['MOVIMENTOS_HORA']    = hora;
                    movimento['MOVIMENTOS_LOG']     = params.userLogin + ' ' + movimento['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + movimento['MOVIMENTOS_HORA'];    
                }

                (movimento['MOVIMENTOS_FINANCEIROS'] || []).forEach(financeiro => {
                    financeiro['FINANCEIROS_ID_APLICACOES'] = movimento['MOVIMENTOS_ID_APLICACOES'] || 1;
                });

            }

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {

                if((isRacaforte || isCirurcenter) && movimento['MOVIMENTOS_ID_DOCUMENTOS'] == 10004 && 
                    (movimento['MOVIMENTOS_ID_OPERACOES'] || '') == 600000) {
                    item['MOVIMENTOSITENS_ID_OPERACOES'] = 600000; // Pendencia
                }

                if((isPedidoVenda || isOrcamento || isTurbotec || isAcomtf || isTopbob) && item['PRODUTOS_EDITAVEL'] == 'T') {
                    item['MOVIMENTOSITENS_ID_EMPRESAS'] = (index + 1);
                }

                if(cents(item['MOVIMENTOSITENS_ID_PRODUTOS']) != cents(item['PRODUTOS_ID']) && cents(item['PRODUTOS_ID']) > 0) {
                    item['MOVIMENTOSITENS_ID_PRODUTOS'] = item['PRODUTOS_ID'];
                }

                if(!isNotaEntrada && isRacaforte) {
                    item['MOVIMENTOSITENS_DEPOSITO'] = item['PRECOMINIMO_DB'];
                    item['MOVIMENTOSITENS_IMEDIATA'] = item['SALDOS_COMISSAO'];
                }
    
                item['MOVIMENTOSITENS_ID_EMPRESAS'] = item['MOVIMENTOSITENS_ID_EMPRESAS'] || 0;
                item['MOVIMENTOSITENS_ENTREGUE'] = item['MOVIMENTOSITENS_ENTREGUE'] || 0;
                item['MOVIMENTOSITENS_DEPOSITO'] = item['MOVIMENTOSITENS_DEPOSITO'] || 0;
                item['MOVIMENTOSITENS_IMEDIATA'] = item['MOVIMENTOSITENS_IMEDIATA'] || 0;
                item['MOVIMENTOSITENS_ID_LOTES'] = item['MOVIMENTOSITENS_ID_LOTES'] || 0;    

                item['MOVIMENTOSITENS_CSTIBSCBS'] = item['MOVIMENTOSITENS_CSTIBSCBS']     || '';
                item['MOVIMENTOSITENS_CCLASSTRIB'] = item['MOVIMENTOSITENS_CCLASSTRIB']   || '';
                item['MOVIMENTOSITENS_BASEIBSCBS'] = item['MOVIMENTOSITENS_BASEIBSCBS']   || 0;
                item['MOVIMENTOSITENS_ALIQUOTAIBS'] = item['MOVIMENTOSITENS_ALIQUOTAIBS'] || 0;
                item['MOVIMENTOSITENS_VALORIBS'] = item['MOVIMENTOSITENS_VALORIBS']       || 0;
                item['MOVIMENTOSITENS_PERREDIBS'] = item['MOVIMENTOSITENS_PERREDIBS']     || 0;
                item['MOVIMENTOSITENS_PERDIFIBS'] = item['MOVIMENTOSITENS_PERDIFIBS']     || 0;
                item['MOVIMENTOSITENS_VLRDIFIBS'] = item['MOVIMENTOSITENS_VLRDIFIBS']     || 0;
                item['MOVIMENTOSITENS_VLRDEVIBS'] = item['MOVIMENTOSITENS_VLRDEVIBS']     || 0;
                item['MOVIMENTOSITENS_ALIQUOTACBS'] = item['MOVIMENTOSITENS_ALIQUOTACBS'] || 0;
                item['MOVIMENTOSITENS_VALORCBS'] = item['MOVIMENTOSITENS_VALORCBS']       || 0;
                item['MOVIMENTOSITENS_PERREDCBS'] = item['MOVIMENTOSITENS_PERREDCBS']     || 0;
                item['MOVIMENTOSITENS_PERDIFCBS'] = item['MOVIMENTOSITENS_PERDIFCBS']     || 0;
                item['MOVIMENTOSITENS_VLRDIFCBS'] = item['MOVIMENTOSITENS_VLRDIFCBS']     || 0;
                item['MOVIMENTOSITENS_VLRDEVCBS'] = item['MOVIMENTOSITENS_VLRDEVCBS']     || 0;
                
                if(params.client.toUpperCase().match(/HOSPITALAR/)) {  // Hosp grava o preço de compra atual no IMEDIATA
                    item['MOVIMENTOSITENS_IMEDIATA'] = item['SALDOS_COMPRA'];
                }

                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
                item['MOVIMENTOSITENS_FRETE'] = (cents(item['MOVIMENTOSITENS_FRETE']) / 100) || 0;
                item['MOVIMENTOSITENS_SEGURO'] = (cents(item['MOVIMENTOSITENS_SEGURO']) / 100) || 0;
                item['MOVIMENTOSITENS_DESPESAS'] = (cents(item['MOVIMENTOSITENS_DESPESAS']) / 100) || 0;
                item['MOVIMENTOSITENS_DESCONTOS'] = (cents(item['MOVIMENTOSITENS_DESCONTOS']) / 100) || 0;                
                item['MOVIMENTOSITENS_IMPOSTO'] = (cents(item['MOVIMENTOSITENS_IMPOSTO']) / 100) || 0;

                item['MOVIMENTOSITENS_HORAENTREGA'] = (item['MOVIMENTOSITENS_HORAENTREGA'] || '').slice(0, 10);
                item['MOVIMENTOSITENS_HORAMONTAGEM'] = (item['MOVIMENTOSITENS_HORAMONTAGEM'] || '').slice(0, 10);

                item['MOVIMENTOSITENS_ALIQUOTAPIS'] = (cents(item['MOVIMENTOSITENS_ALIQUOTAPIS']) / 100) || 0;
                item['MOVIMENTOSITENS_BASEPIS'] = (cents(item['MOVIMENTOSITENS_BASEPIS']) / 100) || 0;
                item['MOVIMENTOSITENS_VALORPIS'] = (cents(item['MOVIMENTOSITENS_VALORPIS']) / 100) || 0;
                item['MOVIMENTOSITENS_VALORPISST'] = (cents(item['MOVIMENTOSITENS_VALORPISST']) / 100) || 0;
                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = (cents(item['MOVIMENTOSITENS_ALIQUOTACOFINS']) / 100) || 0;
                item['MOVIMENTOSITENS_BASECOFINS'] = (cents(item['MOVIMENTOSITENS_BASECOFINS']) / 100) || 0;
                item['MOVIMENTOSITENS_VALORCOFINS'] = (cents(item['MOVIMENTOSITENS_VALORCOFINS']) / 100) || 0;                
                item['MOVIMENTOSITENS_VALORCOFINSST'] = (cents(item['MOVIMENTOSITENS_VALORCOFINSST']) / 100) || 0;
                item['MOVIMENTOSITENS_ICMS'] = (cents(item['MOVIMENTOSITENS_ICMS']) / 100) || 0;
                item['MOVIMENTOSITENS_IPI'] = (cents(item['MOVIMENTOSITENS_IPI']) / 100) || 0;
                item['MOVIMENTOSITENS_MARGEM'] = (cents(item['MOVIMENTOSITENS_MARGEM']) / 100) || 0;
                item['MOVIMENTOSITENS_BASEICMS'] = (cents(item['MOVIMENTOSITENS_BASEICMS']) / 100) || 0;
                item['MOVIMENTOSITENS_VALORICMS'] = (cents(item['MOVIMENTOSITENS_VALORICMS']) / 100) || 0;

// Ajuste ST
                if(cents(item['MOVIMENTOSITENS_BASEST']) > 0) {
                    item['MOVIMENTOSITENS_BASEST']  = cents(item['MOVIMENTOSITENS_BASEST']) / 100;
                }

                if(cents(item['MOVIMENTOSITENS_VALORST']) > 0) {
                   item['MOVIMENTOSITENS_VALORST'] = cents(item['MOVIMENTOSITENS_VALORST']) / 100;
                }   

                if(isNotaEntrada || isRequisicaoEntrada) {
                    custos.push({
                        'PRODUTOS_ID'         : item['MOVIMENTOSITENS_ID_PRODUTOS'],
                        'SALDOS_CUSTO'        : item['SALDOS_CUSTO'],
                        'SALDOS_PRAZO'        : item['SALDOS_PRAZO'],
                        'SALDOS_PRECO'        : item['SALDOS_PRECO'],
                        'SALDOS_COMPRA'       : item['SALDOS_COMPRA'],
                        'SALDOS_MARGEM'       : item['SALDOS_MARGEM'],
                        'SALDOS_TRANSFERENCIA': (
                            utils.number.cents((item['MOVIMENTOSITENS_FRETE'] / item['MOVIMENTOSITENS_QUANTIDADE']) || 0) +
                            utils.number.cents(item['MOVIMENTOSITENS_IMPOSTO'] ||0)
                        ) / 100,
                        'SALDOS_RESERVADO'    : utils.number.cents((item['MOVIMENTOSITENS_DESPESAS'] / item['MOVIMENTOSITENS_QUANTIDADE']) || 0) / 100,
                        'NOVO_CUSTO'          : item['NOVO_CUSTO'],
                        'NOVO_PRAZO'          : item['NOVO_PRAZO'],
                        'NOVO_PRECO'          : item['NOVO_PRECO'],
                        'NOVO_COMPRA'         : item['NOVO_COMPRA'],
                        'NOVO_MARGEM'         : item['NOVO_MARGEM'],
                        'ITEM_DOCUMENTO'      : movimento['MOVIMENTOS_ID_DOCUMENTOS'],                        
                        'ITEM_QUANTIDADE'     : item['MOVIMENTOSITENS_QUANTIDADE'],
                        'ITEM_FRETE'          : item['MOVIMENTOSITENS_FRETE'],
                        'ITEM_SEGURO'         : item['MOVIMENTOSITENS_SEGURO'],
                        'ITEM_DESPESAS'       : item['MOVIMENTOSITENS_DESPESAS'],
                        'ITEM_VALORIPI'       : item['MOVIMENTOSITENS_VALORIPI'],
                        'ITEM_VALORST'        : item['MOVIMENTOSITENS_VALORST'],
                        'ITEM_DEPOSITO'       : item['MOVIMENTOSITENS_DEPOSITO'],
                        'ITEM_IMPOSTO'        : item['MOVIMENTOSITENS_IMPOSTO'],
                        'ITEM_TOTAL'          : item['MOVIMENTOSITENS_TOTAL']                        
                    });

                } else if(isComplementar) {
                    item['MOVIMENTOSITENS_PRECO'] = 0;
                    item['MOVIMENTOSITENS_TOTAL'] = 0;

                } else if(isPedidoCompra) {
                    item['MOVIMENTOSITENS_ID_EMPRESAS'] = parseInt(index) + 1;
                }
            });

            aplicarFallbackIbsCbsItens(movimento);

            if(movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003'){ // Nota Eletronica
               ajustaICMSCabecalho(movimento); // Faz a compensação do ICMS
               if(cents(movimento['MOVIMENTOS_VALORST']) > 0) {
                  await ajusteSTItens(movimento); // Faz a compensação do cálculo ST
               } 
            }

            if((movimento['MOVIMENTOS_CAIXA'] || []).length > 0) {
                (movimento['MOVIMENTOS_CAIXA'] || []).forEach(caixa => {
                    delete caixa['MOVIMENTOSCAIXA_ID_PORTADORES'];

                    caixa['MOVIMENTOSCAIXA_EMISSAO'] = hoje;
                    caixa['MOVIMENTOSCAIXA_HORA']    = hora;

                    if( caixa['MOVIMENTOSCAIXA_NOME'] != undefined ){
                        caixa['MOVIMENTOSCAIXA_NOME']    = caixa['MOVIMENTOSCAIXA_NOME']
                            .replace('[NUMERO]', numero)
                            .replace('[SERIE]',  serie);

                    }else{
                        caixa['MOVIMENTOSCAIXA_NOME'] = movimento['MOVIMENTOS_NOME'];
                    }
                });
            }

            if((movimento['MOVIMENTOS_CARTOES'] || []).length > 0) {            
                (movimento['MOVIMENTOS_CARTOES'] || []).forEach(cartao => {
                    cartao['CARTOES_EMISSAO'] = hoje;
                });
            }    

            if((movimento['MOVIMENTOS_CONTACORRENTES'] || []).length > 0) {
                (movimento['MOVIMENTOS_CONTACORRENTES'] || []).forEach(contacorrente => {
                    contacorrente['CONTACORRENTES_EMISSAO']    = hoje;
                    contacorrente['CONTACORRENTES_VENCIMENTO'] = hoje;
                    contacorrente['CONTACORRENTES_PAGAMENTO']  = hoje;
                    contacorrente['CONTACORRENTES_COMPENSADO'] = hoje;                    
                });
            }    

            if((movimento['MOVIMENTOS_CHEQUES'] || []).length > 0) {            
                (movimento['MOVIMENTOS_CHEQUES'] || []).forEach(cheque => {
                    cheque['CHEQUES_EMISSAO'] = hoje;
                });
            }

            // não permitir duplicar transferência e pedido de venda na Pruden
            if((isTransferencia || isPedidoVenda) && isPrudenmoveis ||
                isNotaEletronica && params.client.toUpperCase().match(/HOSPITALAR/)) {
                const jaLancado = await movimentoJaGravado(movimento, params);
                if(jaLancado.length > 0) {
                    throw 'Já lançado'
                }
            }

            if(isPedidoCompra || isPreVendaPrazo || isOrcamentoPrazo) {
                const obsValue = movimento['MOVIMENTOS_OBSERVACOES'];
                const financeiroscompra = (movimento['MOVIMENTOS_FINANCEIROSCOMPRA'] || []).map(financeiro => {
                    const vcto  = financeiro['MOVIMENTOSFINANCEIROSCOMPRA_VCTO'];
                    const valor = financeiro['MOVIMENTOSFINANCEIROSCOMPRA_VALOR'];
                    return `${vcto}*${valor}`;
                }).join('#');
                movimento['MOVIMENTOS_NFE'] = (movimento['PERCENTUAL_FRETE'] || '0') + '|' + (movimento['PERCENTUAL_SEGURO'] || '0') + '|' + (movimento['PERCENTUAL_IPI'] || '0');
                movimento['MOVIMENTOS_OBSERVACOES']  = (obsValue == '||||||||' ? '||' : obsValue);
                movimento['MOVIMENTOS_OBSERVACOES'] += '|' + financeiroscompra;
            }

            // regra entrega prudenmoveis aqui...

            let marcaEntrega = '';
            let cnpjEmpresa = movimento['EMPRESAS_CPFCNPJ'] || '';

            if(isPedidoVenda || isOrcamento) {
                if(cnpjEmpresa.match(/74398579/) ||  // Prudenmóveis
                   cnpjEmpresa.match(/45118377/) ||   // Eduardo
                   cnpjEmpresa.match(/04395395/)){     // Margarida
                    const valorMinimoUrb = cents(movimento['EMPRESAS_CNAE'].split('|')[3] || 0);
                    const valorMinimoSub = cents(movimento['EMPRESAS_CNAE'].split('|')[4] || 0);
                    const valorMovimento = cents(movimento['MOVIMENTOS_TOTAL']) - cents(movimento['MOVIMENTOS_FRETE']);
                    const isSuburbano = (movimento['PESSOAS_ID_CIDADES'] != movimento['EMPRESAS_ID_CIDADES']) || movimento['MOVIMENTOS_ID_CUSTOS'] == 2;

                    if((isSuburbano && valorMovimento < valorMinimoSub) ||
                    (!isSuburbano && valorMovimento < valorMinimoUrb)) {
                        marcaEntrega = 'R';
                    }
                }
            }


            // fim da regra entrega

            if(isHermes) { // JD sempre mantém o vendedor do cadastro
                movimento['MOVIMENTOS_ID_USUARIOS'] = (movimento['PESSOAS_ID_USUARIOS'] || movimento['MOVIMENTOS_ID_USUARIOS']);
            }

            if(isPinguim) { // Pinguim nunca usa o MOVIMENTOSFORMAS
                movimento['MOVIMENTOS_FORMASPAGAMENTO'] = [];
            }

            if((movimento['MOVIMENTOS_CPFCNPJ'] || '').length == 0) {
                movimento['MOVIMENTOS_CPFCNPJ'] = utils.string.onlyNumbers(movimento['PESSOAS_CPFCNPJ']);
            }

            if((movimento['MOVIMENTOS_CELULAR'] || '').length == 0) {
                movimento['MOVIMENTOS_CELULAR'] = utils.string.onlyNumbers(movimento['PESSOAS_CELULAR']);
            }

            await samosFB.insert('MOVIMENTOS', movimento, params);

            (movimento['MOVIMENTOS_ITENS'] || []).forEach(item => {
                if(marcaEntrega == 'R') {
                    item['MOVIMENTOSITENS_DATAENTREGA']  = hoje;
                    item['MOVIMENTOSITENS_DATAMONTAGEM'] = hoje;
                    item['MOVIMENTOSITENS_HORAENTREGA']  = 'N';
                    item['MOVIMENTOSITENS_HORAMONTAGEM'] = 'N';
                    item['MOVIMENTOSITENS_ENTREGUE']     = item['MOVIMENTOSITENS_QUANTIDADE'];
                    item['MOVIMENTOSITENS_DEPOSITO']     = 1;
                }
                item['MOVIMENTOSITENS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_CAIXA'] || []).forEach(caixa => {
                caixa['MOVIMENTOSCAIXA_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                caixa['MOVIMENTOSCAIXA_LOG']           = movimento['MOVIMENTOS_LOG'];
                caixa['MOVIMENTOSCAIXA_NOME']          = `${movimento['MOVIMENTOS_SERIE']} ${movimento['MOVIMENTOS_NUMERO']} ${movimento['MOVIMENTOS_NOME']}`.slice(0, 50);
            });

            (movimento['MOVIMENTOS_FORMASPAGAMENTO'] || []).forEach(forma => {
                forma['MOVIMENTOSFORMAS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_CARTOES'] || []).forEach(cartao => {
                cartao['CARTOES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_CONTACORRENTES'] || []).forEach(contacorrente => {
                contacorrente['CONTACORRENTES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_FINANCEIROS'] || []).forEach(financeiro => {
                financeiro['FINANCEIROS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_ENVIO'] || []).forEach(envio => {
                if((movimento['OPERACOES_ACAO'] || '') != 'IM') {  // Se não for nota de importação de produtos
                    delete envio['MOVIMENTOSENVIO_DI'];
                    delete envio['MOVIMENTOSENVIO_DATADI'];
                    delete envio['MOVIMENTOSENVIO_DESEMBARQUE'];
                    delete envio['MOVIMENTOSENVIO_UFDESEMBARQUE'];
                    delete envio['MOVIMENTOSENVIO_DTDESEMBARQUE'];
                    delete envio['MOVIMENTOSENVIO_VIATRANSPORTE'];
                    delete envio['MOVIMENTOSENVIO_CODEXPORTADOR'];
                    delete envio['MOVIMENTOSENVIO_CODFABRICANTE'];
                    delete envio['MOVIMENTOSENVIO_INTERMEDIARIO'];
                }
                envio['MOVIMENTOSENVIO_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                envio['MOVIMENTOSENVIO_QUANTIDADE'] = envio['MOVIMENTOSENVIO_QUANTIDADE'] || 0;
            });

            (movimento['MOVIMENTOS_CARTAS'] || []).forEach(carta => {
                carta['MOVIMENTOSCARTAS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            try {
                if((movimento['MOVIMENTOS_ITENS'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSITENS', movimento['MOVIMENTOS_ITENS'], params);
                }
                if((movimento['MOVIMENTOS_CAIXA'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSCAIXA',  movimento['MOVIMENTOS_CAIXA'], params);
                    if( cents(movimento['MOVIMENTOS_CAIXA'][0]['MOVIMENTOSCAIXA_DUPLICATA']) > 1000000 &&
                        params.client.toUpperCase().match(/HOSPITALAR/)) {
                        await utils.dblog(params);
                    } 
                }

                if((movimento['MOVIMENTOS_FORMASPAGAMENTO'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSFORMAS', movimento['MOVIMENTOS_FORMASPAGAMENTO'], params);
                }
                if((movimento['MOVIMENTOS_CARTOES'] || []).length > 0) {
                    await samosFB.insert('CARTOES', movimento['MOVIMENTOS_CARTOES'], params);
                }
                if((movimento['MOVIMENTOS_CONTACORRENTES'] || []).length > 0) {
                    await samosFB.insert('CONTACORRENTES', movimento['MOVIMENTOS_CONTACORRENTES'], params);
                }
                if((movimento['MOVIMENTOS_CHEQUES'] || []).length > 0) {
                    await samosFB.insert('CHEQUES', movimento['MOVIMENTOS_CHEQUES'], params);
                }
                if((movimento['MOVIMENTOS_FINANCEIROS'] || []).length > 0) {
                    await samosFB.insert('FINANCEIROS', movimento['MOVIMENTOS_FINANCEIROS'], params);
                }
                if((movimento['MOVIMENTOS_ENVIO'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSENVIO',  movimento['MOVIMENTOS_ENVIO'], params);
                }
                if((movimento['MOVIMENTOS_CARTAS'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSCARTAS', movimento['MOVIMENTOS_CARTAS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from MOVIMENTOS       where MOVIMENTOS_ID                  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSITENS  where MOVIMENTOSITENS_ID_MOVIMENTOS  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSCAIXA  where MOVIMENTOSCAIXA_ID_MOVIMENTOS  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSFORMAS where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']};
                        delete from CARTOES          where CARTOES_ID_MOVIMENTOS          = ${movimento['MOVIMENTOS_ID']};
                        delete from CHEQUES          where CHEQUES_ID_MOVIMENTOS          = ${movimento['MOVIMENTOS_ID']};
                        delete from CONTACORRENTES   where CONTACORRENTES_ID_MOVIMENTOS   = ${movimento['MOVIMENTOS_ID']};
                        delete from FINANCEIROS      where FINANCEIROS_ID_MOVIMENTOS      = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSENVIO  where MOVIMENTOSENVIO_ID_MOVIMENTOS  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSCARTAS where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']};
                    end
                `, params);

                throw error;
            }

            //COMANDA_NUMERO

            if(movimento['COMANDA_NUMERO']) {
                const queryComanda = await samosFB.executeSQL(`select COMANDAS_ID from COMANDAS where COMANDAS_NUMERO = '${movimento['COMANDA_NUMERO']}'`)
                const comanda = queryComanda[0] || {};

                comanda['COMANDAS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                comanda['COMANDAS_NUMERO']        = movimento['COMANDA_NUMERO'];
                comanda['COMANDAS_STATUS']        = 'T';
                comanda['COMANDAS_ID_USUARIOS']   = params.userId;
                comanda['COMANDAS_LOG']           = movimento['MOVIMENTOS_LOG'];
                
                if(comanda['COMANDAS_ID']) {
                    await samosFB.update(comanda['COMANDAS_ID'], 'COMANDAS', comanda, params);
                } else {
                    await samosFB.insert('COMANDAS', comanda, params);
                }
            }

            if(
                (isNotaEntrada || isRequisicaoEntrada) && 
                movimento['MOVIMENTOS_SITUACAO'] != 1  && 
                movimento['MOVIMENTOS_SITUACAO'] != 3
            ) {

                if(custos.length > 120) { // Divide o processo em dois, em notas com muitos itens (acima de 120)
                    const custosA = custos.slice(0, 120);
                    const custosB = custos.slice(120 - custos.length);
                    await atualizaCusto(custosA, empresa, params);
                    await atualizaCusto(custosB, empresa, params);                    
                } else {
                    await atualizaCusto(custos, empresa, params);
                }

                if(isOzoniobras) {
                    await atualizaCustoFormulas(params); // Percorre as fórmulas para atualizar os custos dos produtos
                }
            }
            
            api['processos/atualizasaldo']().create({
                empresa : empresa,
                produtos: (movimento['MOVIMENTOS_ITENS'] || []).map(item => item['MOVIMENTOSITENS_ID_PRODUTOS']),
                client  : params.client
            });

            const produtosEditaveis = (movimento['MOVIMENTOS_ITENS'] || []).filter(produto => {
                return produto['PRODUTOS_EDITAVEL'] == 'T';
            });

            // produtos editáveis
            if(isMovimentoSaida) {
                await api['relacoesitens']().create({
                    idmovimento: movimento['MOVIMENTOS_ID'],
                    itens      : produtosEditaveis
                }, params);    
            }

            // Atualiza lotes
            const produtosComLote = (movimento['MOVIMENTOS_ITENS'] || []).filter(produto => {
                return cents(produto['MOVIMENTOSITENS_ID_LOTES']) > 0;
            });

            // Pesos nota Prudenaço

            if(isNotaEletronica && params.client.toUpperCase().match(/PRUDENACO/)) {
                await atualizaPesoNfe(movimento['MOVIMENTOS_ID'], params);
            }

            if(isNotaEletronica && isRacaforte) {
                await atualizaTotaisNfe(movimento['MOVIMENTOS_ID'], params);
            }

            if (movimento['MOVIMENTOS_SERIEORIGEM'] == 'PD') {
                api['processos/atualizacfopitens']().create({               
                  itens: movimento['MOVIMENTOS_ITENS']                    
                }, params);
            };

            await utils.dblog(params);    

            return { results: movimento };

        } catch(error) {
            const msg = error.message ? 'Falha ao criar movimento' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, movimento, params) => {
        const itens          = movimento['MOVIMENTOS_ITENS'];
        const caixa          = movimento['MOVIMENTOS_CAIXA'];
        const formas         = movimento['MOVIMENTOS_FORMASPAGAMENTO'];
        const cartoes        = movimento['MOVIMENTOS_CARTOES'];
        const contacorrentes = movimento['MOVIMENTOS_CONTACORRENTES'];
        const cheques        = movimento['MOVIMENTOS_CHEQUES'];
        const financeiros    = movimento['MOVIMENTOS_FINANCEIROS'];
        const envio          = movimento['MOVIMENTOS_ENVIO'];
        const cartas         = movimento['MOVIMENTOS_CARTAS'];
        const isRacaforte    = (params.client || '').toUpperCase() == 'RACAFORTE';  
        const isCirurcenter  = (params.client || '').toUpperCase() == 'CIRURCENTER';  
        const isPrudenmoveis = (params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/); 
        const idPortador     = cents(movimento['PORTADORES_ID']) / 100;
        const multiPortador  = movimento['PORTADORES_MULTI'] || [];
        
        try {
            const hoje                = moment.tz(params.timezone).format('YYYY-MM-DD');
            const cents               = utils.number.cents.bind(utils.number);            
            const empresa             = movimento['MOVIMENTOS_ID_EMPRESAS'];
            const isMovimentoSaida    = movimento['OPERACOES_TIPO']  == 'S';
            const tipoFinanceiro      = movimento['OPERACOES_FINANCEIRO'];
            const orcPrazo            = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const isPedido            = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0002';
            const isPedidoCompra      = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0006';
            const isOrcamentoPrazo    = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0001' && orcPrazo;
            const isPreVendaPrazo     = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0021' && orcPrazo;
            const isNotaEntrada       = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0005';
            const isRequisicaoEntrada = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0004' && movimento['MOVIMENTOS_ID_OPERACOES'] < 500000;
            const isDevolucao         = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0012';
            const isNotaEletronica    = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0003';
            const isComplementar      = movimento['OPERACOES_COMPLEMENTAR'] == 'T';
            const pedidoParcial       = process.env[params.client ? ((params.client || '').toUpperCase() + '_PEDIDOPARCIAL') : 'PEDIDOPARCIAL'] == 'TRUE';            

            const custos = [];

            if(!isNotaEntrada && !isRequisicaoEntrada) {
                if(
                    (movimento['MOVIMENTOS_STATUS']       || '').match('F') &&
                    (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')
                ) {
                    movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
                }

                if(params.userLogin) {
                    movimento['MOVIMENTOS_LOG'] = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                }
            }

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {

                if(cents(item['MOVIMENTOSITENS_ID_PRODUTOS']) != cents(item['PRODUTOS_ID']) && cents(item['PRODUTOS_ID']) > 0) {
                    item['MOVIMENTOSITENS_ID_PRODUTOS'] = item['PRODUTOS_ID'];
                }

                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
                item['MOVIMENTOSITENS_MARGEM']     = item['MOVIMENTOSITENS_MARGEM']     || 0;
                item['MOVIMENTOSITENS_SEGURO']     = item['MOVIMENTOSITENS_SEGURO']     || 0;
                item['MOVIMENTOSITENS_DESPESAS']   = item['MOVIMENTOSITENS_DESPESAS']   || 0;

                item['MOVIMENTOSITENS_ID_LOTES']  = item['MOVIMENTOSITENS_ID_LOTES'] || 0;
                item['MOVIMENTOSITENS_IMEDIATA']  = item['MOVIMENTOSITENS_IMEDIATA'] || 0;                
                item['MOVIMENTOSITENS_ENTREGUE']  = item['MOVIMENTOSITENS_ENTREGUE'] || 0;
                item['MOVIMENTOSITENS_DEPOSITO']  = item['MOVIMENTOSITENS_DEPOSITO'] || 0;
                item['MOVIMENTOSITENS_IMPOSTO']   = item['MOVIMENTOSITENS_IMPOSTO']  || 0;                
                item['MOVIMENTOSITENS_BASEICMS']  = item['MOVIMENTOSITENS_BASEICMS'] || 0;
                item['MOVIMENTOSITENS_ICMS']      = item['MOVIMENTOSITENS_ICMS'] || 0;
                item['MOVIMENTOSITENS_VALORICMS'] = item['MOVIMENTOSITENS_VALORICMS'] || 0;
                item['MOVIMENTOSITENS_IPI']       = item['MOVIMENTOSITENS_IPI'] || 0;                
                item['MOVIMENTOSITENS_VALORIPI']  = item['MOVIMENTOSITENS_VALORIPI'] || 0;
                
                item['MOVIMENTOSITENS_BASEPIS']        = item['MOVIMENTOSITENS_BASEPIS'] || 0;
                item['MOVIMENTOSITENS_ALIQUOTAPIS']    = item['MOVIMENTOSITENS_ALIQUOTAPIS'] || 0;
                item['MOVIMENTOSITENS_VALORPIS']       = item['MOVIMENTOSITENS_VALORPIS'] || 0;
                item['MOVIMENTOSITENS_VALORPISST']     = item['MOVIMENTOSITENS_VALORPISST'] || 0;                
                item['MOVIMENTOSITENS_BASECOFINS']     = item['MOVIMENTOSITENS_BASECOFINS'] || 0;
                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = item['MOVIMENTOSITENS_ALIQUOTACOFINS'] || 0;
                item['MOVIMENTOSITENS_VALORCOFINS']    = item['MOVIMENTOSITENS_VALORCOFINS'] || 0;
                item['MOVIMENTOSITENS_VALORCOFINSST']  = item['MOVIMENTOSITENS_VALORCOFINSST'] || 0;



                item['MOVIMENTOSITENS_DESCONTOS']  = (cents(item['MOVIMENTOSITENS_DESCONTOS']) / 100) || 0;
// Ajuste ST
                if(cents(item['MOVIMENTOSITENS_BASEST']) > 0) {
                    item['MOVIMENTOSITENS_BASEST']  = cents(item['MOVIMENTOSITENS_BASEST']) / 100;
                } else {
                    item['MOVIMENTOSITENS_BASEST']  = 0;
                }

                if(cents(item['MOVIMENTOSITENS_VALORST']) > 0) {
                   item['MOVIMENTOSITENS_VALORST'] = cents(item['MOVIMENTOSITENS_VALORST']) / 100;
                } else {
                    item['MOVIMENTOSITENS_VALORST'] = 0;
                }  

                if(isPedidoCompra) {
                    item['MOVIMENTOSITENS_ID_EMPRESAS'] = parseInt(index) + 1;                    
                }

                if(isNotaEntrada) {
                    if(cents(item['MOVIMENTOSITENS_ID_EMPRESAS']) == 0) {
                        item['MOVIMENTOSITENS_ID_EMPRESAS'] = parseInt(index) + 1;
                    }
                }

                if(params.client.toUpperCase().match(/HOSPITALAR/)) {  // Hosp grava o preço de compra atual no IMEDIATA
                    item['MOVIMENTOSITENS_IMEDIATA'] = item['SALDOS_COMPRA'];
                }

                if(isComplementar) {
                    item['MOVIMENTOSITENS_PRECO'] = 0;
                    item['MOVIMENTOSITENS_TOTAL'] = 0;
                }                    

                if(isNotaEntrada || isRequisicaoEntrada) {
                    custos.push({
                        'PRODUTOS_ID'         : item['MOVIMENTOSITENS_ID_PRODUTOS'],
                        'SALDOS_CUSTO'        : item['SALDOS_CUSTO'],
                        'SALDOS_PRAZO'        : item['SALDOS_PRAZO'],
                        'SALDOS_PRECO'        : item['SALDOS_PRECO'],
                        'SALDOS_COMPRA'       : item['SALDOS_COMPRA'],
                        'SALDOS_MARGEM'       : item['SALDOS_MARGEM'],
                        'SALDOS_TRANSFERENCIA': (
                            utils.number.cents((item['MOVIMENTOSITENS_FRETE'] / item['MOVIMENTOSITENS_QUANTIDADE']) || 0) +
                            utils.number.cents(item['MOVIMENTOSITENS_IMPOSTO'] || 0)
                        ) / 100,
                        'SALDOS_RESERVADO'    : utils.number.cents((item['MOVIMENTOSITENS_DESPESAS'] / item['MOVIMENTOSITENS_QUANTIDADE']) || 0) / 100,
                        'NOVO_CUSTO'          : item['NOVO_CUSTO'],
                        'NOVO_PRAZO'          : item['NOVO_PRAZO'],
                        'NOVO_PRECO'          : item['NOVO_PRECO'],
                        'NOVO_COMPRA'         : item['NOVO_COMPRA'],
                        'NOVO_MARGEM'         : item['NOVO_MARGEM'],
                        'ITEM_DOCUMENTO'      : movimento['MOVIMENTOS_ID_DOCUMENTOS'],
                        'ITEM_QUANTIDADE'     : item['MOVIMENTOSITENS_QUANTIDADE'],                        
                        'ITEM_FRETE'          : item['MOVIMENTOSITENS_FRETE'],
                        'ITEM_SEGURO'         : item['MOVIMENTOSITENS_SEGURO'],
                        'ITEM_DESPESAS'       : item['MOVIMENTOSITENS_DESPESAS'],
                        'ITEM_VALORIPI'       : item['MOVIMENTOSITENS_VALORIPI'],
                        'ITEM_VALORST'        : item['MOVIMENTOSITENS_VALORST'],
                        'ITEM_DEPOSITO'       : item['MOVIMENTOSITENS_DEPOSITO'],
                        'ITEM_IMPOSTO'        : item['MOVIMENTOSITENS_IMPOSTO'],
                        'ITEM_TOTAL'          : item['MOVIMENTOSITENS_TOTAL']
                    });
                }
            });

            aplicarFallbackIbsCbsItens(movimento);

            (movimento['MOVIMENTOS_ENVIO'] || []).forEach(envio => {
                envio['MOVIMENTOSENVIO_PLACAUF'] = envio['MOVIMENTOSENVIO_PLACAUF'] || '';
            });

            if(isPedidoCompra || isOrcamentoPrazo || isPreVendaPrazo) {
                const obsValue = movimento['MOVIMENTOS_OBSERVACOES'];
                const financeiroscompra = (movimento['MOVIMENTOS_FINANCEIROSCOMPRA'] || []).map(financeiro => {
                    const vcto  = financeiro['MOVIMENTOSFINANCEIROSCOMPRA_VCTO'];
                    const valor = financeiro['MOVIMENTOSFINANCEIROSCOMPRA_VALOR'];
                    return `${vcto}*${valor}`
                }).join('#');

                movimento['MOVIMENTOS_OBSERVACOES']  = ((!obsValue || obsValue == '||||||||||') ? '||' : obsValue);
                movimento['MOVIMENTOS_OBSERVACOES'] += '|' + financeiroscompra;
                movimento['MOVIMENTOS_NFE'] = (movimento['PERCENTUAL_FRETE'] || '0') + '|' + (movimento['PERCENTUAL_SEGURO'] || '0') + '|' + (movimento['PERCENTUAL_IPI'] || '0');
            }

            if(isDevolucao) {
                const somaPartidas = itens.reduce((total, itens) => {
                    return total + (cents(itens['MOVIMENTOSITENS_IMPOSTO']) || 0);
                }, 0);
                movimento['MOVIMENTOS_IMPOSTO'] = (somaPartidas / 100);
            }
        
            if(isComplementar) {
                movimento['MOVIMENTOS_PRODUTOS'] = 0;
                movimento['MOVIMENTOS_TOTAL'] = 0;
            }

            if((movimento['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4) == '0003'){  // Nota Eletronica
               ajustaICMSCabecalho(movimento); // Faz a compensação do ICMS                
               if(cents(movimento['MOVIMENTOS_VALORST']) > 0 &&
                  (movimento['MOVIMENTOS_ITENS'] || []).length > 0) {
                    await ajusteSTItens(movimento); // Faz a compensação do cálculo
                }     
            }

            if(params.client.toUpperCase().match(/HERMES/)) { // JD sempre mantém o vendedor do cadastro
                movimento['MOVIMENTOS_ID_USUARIOS'] = (movimento['PESSOAS_ID_USUARIOS'] || movimento['MOVIMENTOS_ID_USUARIOS']);
            }

            if((movimento['MOVIMENTOS_CPFCNPJ'] || '').length > 0) {
                movimento['MOVIMENTOS_CPFCNPJ'] = utils.string.onlyNumbers(movimento['MOVIMENTOS_CPFCNPJ']);
            }

            if((movimento['MOVIMENTOS_CELULAR'] || '').length > 0) {
                movimento['MOVIMENTOS_CELULAR'] = utils.string.onlyNumbers(movimento['MOVIMENTOS_CELULAR']);
            }

            //atualiza o cabecalho
            await samosFB.update(id, 'MOVIMENTOS', movimento, params);

            //MOVIMENTOS_ITENS
            if(itens) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from MOVIMENTOSITENS where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from MOVIMENTOSITENS where MOVIMENTOSITENS_ID_MOVIMENTOS = ${id}`, params);
            
                //atribui o id do cabecalho
                (itens || []).map(item => {
                    item['MOVIMENTOSITENS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });

                if(isNotaEntrada) {
                    atualizarLotes(movimento['MOVIMENTOS_ITENS'], params); // atualiza o ID dos produtos nos lotes, se tiver
                    atualizarNcms(movimento['MOVIMENTOS_ITENS'], params); // atualiza o NCM nos produtos, se forem diferentes xml/cadastro
                }
                
                try {
                    //grava os itens
                    if(itens.length > 0) await samosFB.insert('MOVIMENTOSITENS', movimento['MOVIMENTOS_ITENS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('MOVIMENTOSITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_CAIXA
            if(caixa) {
                const caixaOriginal = await samosFB.executeSQL(`select * from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${id}`, params);
            
                (caixa || []).map(item => {
                    item['MOVIMENTOSCAIXA_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                    delete item['MOVIMENTOSCAIXA_ID_PORTADORES']; 
                });

                if(caixa.length > 0 && 
                   cents(caixa[0]['MOVIMENTOSCAIXA_DUPLICATA']) > 1000000 &&
                   params.client.toUpperCase().match(/HOSPITALAR/)) {
                    await utils.dblog(params);
                } 
                
                try {
                    if(caixa.length > 0) await samosFB.insert('MOVIMENTOSCAIXA', movimento['MOVIMENTOS_CAIXA'], params);
                } catch(error) {
                    if(caixaOriginal) {
                        await samosFB.insert('MOVIMENTOSCAIXA', caixaOriginal, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_FORMASPAGAMENTO
            if(formas) {
                const formasOriginais = await samosFB.executeSQL(`select * from MOVIMENTOSFORMAS where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSFORMAS where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${id}`, params);
            
                (formas || []).map(item => {
                    item['MOVIMENTOSFORMAS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });
                
                try {
                    if(formas.length > 0) await samosFB.insert('MOVIMENTOSFORMAS', movimento['MOVIMENTOS_FORMASPAGAMENTO'], params);
                } catch(error) {
                    if(formasOriginais) {
                        await samosFB.insert('MOVIMENTOSFORMAS', formasOriginais, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_CARTOES
            if(cartoes) {
                const cartoesOriginais = await samosFB.executeSQL(`select * from CARTOES where CARTOES_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from CARTOES where CARTOES_ID_MOVIMENTOS = ${id}`, params);
            
                (movimento['MOVIMENTOS_CARTOES'] || []).forEach((item, index) => { // Sempre emissão do cartão = emissão movto
                    item['CARTOES_EMISSAO'] = movimento['MOVIMENTOS_EMISSAO'];
                });

                (cartoes || []).map(item => {
                    item['CARTOES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });
                
                try {
                    if(cartoes.length > 0) await samosFB.insert('CARTOES', movimento['MOVIMENTOS_CARTOES'], params);
                } catch(error) {
                    if(cartoesOriginais) {
                        await samosFB.insert('CARTOES', cartoesOriginais, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_CONTACORRENTES
            if(contacorrentes) {
                const contacorrentesOriginais = await samosFB.executeSQL(`select * from CONTACORRENTES where CONTACORRENTES_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from CONTACORRENTES where CONTACORRENTES_ID_MOVIMENTOS = ${id}`, params);
            
                (movimento['MOVIMENTOS_CONTACORRENTES'] || []).forEach((item, index) => { // Sempre emissão do cartão = emissão movto
                    item['CONTACORRENTES_EMISSAO']    = movimento['MOVIMENTOS_EMISSAO'];
                    item['CONTACORRENTES_VENCIMENTO'] = movimento['MOVIMENTOS_EMISSAO'];
                    item['CONTACORRENTES_PAGAMENTO']  = movimento['MOVIMENTOS_EMISSAO'];                    
                    item['CONTACORRENTES_COMPENSADO'] = movimento['MOVIMENTOS_EMISSAO'];                    
                });

                (contacorrentes || []).map(item => {
                    item['CONTACORRENTES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });
                
                try {
                    if(contacorrentes.length > 0) await samosFB.insert('CONTACORRENTES', movimento['MOVIMENTOS_CONTACORRENTES'], params);
                } catch(error) {
                    if(contacorrentesOriginais) {
                        await samosFB.insert('CONTACORRENTES', contacorrentesOriginais, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_CHEQUES
            if(cheques) {
                const chequesOriginais = await samosFB.executeSQL(`select * from CHEQUES where CHEQUES_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from CHEQUES where CHEQUES_ID_MOVIMENTOS = ${id}`, params);
            
                (cheques || []).map(item => {
                    item['CHEQUES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });
                
                try {
                    if(cheques.length > 0) await samosFB.insert('CHEQUES', movimento['MOVIMENTOS_CHEQUES'], params);
                } catch(error) {
                    if(chequesOriginais) {
                        await samosFB.insert('CHEQUES', chequesOriginais, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_FINANCEIROS
            if(financeiros) {

                const idCentroCusto = cents(movimento['MOVIMENTOS_ID_CENTROCUSTO']) / 100;
                const idAplicacao   = cents(movimento['MOVIMENTOS_ID_APLICACOES'])  / 100; 

                const financeirosOriginais = await samosFB.executeSQL(`select * from FINANCEIROS where FINANCEIROS_ID_MOVIMENTOS = ${id}`, params);

                const semParciais = (financeirosOriginais || []).every(financeiro => { 
                    return financeiro['FINANCEIROS_ABERTO'] == financeiro['FINANCEIROS_ORIGINAL']
                })    

                if(semParciais || params.client.toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {  // Só altera o financeiro se não tiver lançamentos parciais

                    await samosFB.executeSQL(`delete from FINANCEIROS where FINANCEIROS_ID_MOVIMENTOS = ${id}`, params);
            
                    (financeiros || []).map(item => {
                        if(idPortador > 0 && multiPortador.length > 0 &&
                            item['FINANCEIROS_VENCIMENTO'] != item['FINANCEIROS_EMISSAO'] &&
                            cents(item['FINANCEIROS_NOSSONUMERO']) == 0) {
                            item['FINANCEIROS_ID_PORTADORES'] = idPortador; // Atribui portador do combo
                        }

                        if(isRacaforte && isNotaEntrada) { 
                          item['FINANCEIROS_EMISSAO'] = movimento['MOVIMENTOS_ENTRADASAIDA'];
                        }

                        item['FINANCEIROS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                        item['FINANCEIROS_ID_APLICACOES'] = idAplicacao || (cents(item['FINANCEIROS_ID_APLICACOES']) / 100) || 1;
                        item['FINANCEIROS_ID_CUSTOS'] = idCentroCusto || (cents(item['FINANCEIROS_ID_CUSTOS'])/100) || 1;
                        item['FINANCEIROS_ABERTO'] = (item['FINANCEIROS_STATUS'] == 'P' ? 0 : item['FINANCEIROS_ABERTO']);
                        item['FINANCEIROS_TIPO'] = tipoFinanceiro ? tipoFinanceiro : item['FINANCEIROS_TIPO'];
                    });
                    
                    try {
                        if(financeiros.length > 0) await samosFB.insert('FINANCEIROS', movimento['MOVIMENTOS_FINANCEIROS'], params);
    
                    } catch(error) {
                        if(financeirosOriginais) {
                            await samosFB.insert('FINANCEIROS', financeirosOriginais, params);
                        }
    
                        throw error;
                    }    
                }
            }

            //MOVIMENTOS_ENVIO
            if(envio) {
                const envioOriginal = await samosFB.executeSQL(`select * from MOVIMENTOSENVIO where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSENVIO where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${id}`, params);
            
                (envio || []).map(item => {
                    item['MOVIMENTOSENVIO_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                    if((movimento['OPERACOES_ACAO'] || '') != 'IM') {  // Se não for nota de importação de produtos
                        delete item['MOVIMENTOSENVIO_DI'];
                        delete item['MOVIMENTOSENVIO_DATADI'];
                        delete item['MOVIMENTOSENVIO_DESEMBARQUE'];
                        delete item['MOVIMENTOSENVIO_UFDESEMBARQUE'];
                        delete item['MOVIMENTOSENVIO_DTDESEMBARQUE'];
                        delete item['MOVIMENTOSENVIO_VIATRANSPORTE'];
                        delete item['MOVIMENTOSENVIO_CODEXPORTADOR'];
                        delete item['MOVIMENTOSENVIO_CODFABRICANTE'];
                        delete item['MOVIMENTOSENVIO_INTERMEDIARIO'];
                    }    
                });
                
                try {
                    if(envio.length > 0) await samosFB.insert('MOVIMENTOSENVIO', movimento['MOVIMENTOS_ENVIO'], params);
                } catch(error) {
                    if(envioOriginal) {
                        await samosFB.insert('MOVIMENTOSENVIO', envioOriginal, params);
                    }

                    throw error;
                }
            }

            //MOVIMENTOS_CARTAS
            if(cartas) {
                const cartasOriginais = await samosFB.executeSQL(`select * from MOVIMENTOSCARTAS where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSCARTAS where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${id}`, params);
            
                (cartas || []).map(item => {
                    item['MOVIMENTOSCARTAS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                });
                
                try {
                    if(cartas.length > 0) await samosFB.insert('MOVIMENTOSCARTAS', movimento['MOVIMENTOS_CARTAS'], params);
                } catch(error) {
                    if(cartasOriginais) {
                        await samosFB.insert('MOVIMENTOSCARTAS', cartasOriginais, params);
                    }

                    throw error;
                }
            }

            if(isPedidoCompra || 
               isOrcamentoPrazo || 
               isPreVendaPrazo ||
               isNotaEntrada || 
               isRequisicaoEntrada) {
                delete movimento['MOVIMENTOS_OBSERVACOES'];//para não dar bug nesses movimentos, não retorna a observação persistida
            }

            if(
                (isNotaEntrada || isRequisicaoEntrada) && 
                movimento['MOVIMENTOS_SITUACAO'] != 1  && 
                movimento['MOVIMENTOS_SITUACAO'] != 3
            ) {
                if(custos.length > 120) { // Divide o processo em dois, em notas com muitos itens (acima de 120)
                    const custosA = custos.slice(0, 120);
                    const custosB = custos.slice(120 - custos.length);
                    await atualizaCusto(custosA, empresa, params);
                    await atualizaCusto(custosB, empresa, params);                    
                } else {
                    await atualizaCusto(custos, empresa, params);
                }
                if(params.client.toUpperCase().match(/OZONIOBRAS/)) {
                    await atualizaCustoFormulas(params); // Percorre as fórmulas para atualizar os custos dos produtos
                }
            }

            const idsProdutos = (movimento['MOVIMENTOS_ITENS'] || []).map(item => parseInt(item['MOVIMENTOSITENS_ID_PRODUTOS']));
            const idsProdutosAnteriores = (movimento['MOVIMENTOS_ITENSANTIGOS'] || [])
                .map(item => parseInt(item['MOVIMENTOSITENS_ID_PRODUTOS']))
                .filter(idProduto => idsProdutos.indexOf(idProduto) == -1);

            if(idsProdutos.length > 0){
                await api['processos/atualizasaldo']().create({
                    empresa: movimento['MOVIMENTOS_ID_EMPRESAS'],
                    produtos: idsProdutos.concat(idsProdutosAnteriores),
                    client  : params.client
                });
            }

            const produtosEditaveis = (movimento['MOVIMENTOS_ITENS'] || []).filter(produto => {
                return produto['PRODUTOS_EDITAVEL'] == 'T';
            });

            //produtos editáveis
            if(isMovimentoSaida) {
                await api['relacoesitens']().create({
                    idmovimento: movimento['MOVIMENTOS_ID'],
                    itens      : produtosEditaveis
                }, params);    
            }

            // Atualiza lotes
            const produtosComLote = (movimento['MOVIMENTOS_ITENS'] || []).filter(produto => {
                return cents(produto['MOVIMENTOSITENS_ID_LOTES']) > 0;
            });

            /*
            if(produtosComLote.length > 0) {
                await atualizarSaldoLotes(produtosComLote, params);
            }
            */

            // Pesos nota Prudenaço

            if(isNotaEletronica && params.client.toUpperCase().match(/PRUDENACO/)) {
                await atualizaPesoNfe(movimento['MOVIMENTOS_ID'], params);
            }

            if(isNotaEletronica && isRacaforte) {
                await atualizaTotaisNfe(movimento['MOVIMENTOS_ID'], params);
            }

            const status = movimento['MOVIMENTOS_STATUS'];

            if(isNotaEntrada && (status == 'F' || status == 'G')){
                if(!isPrudenmoveis) {
                    await atualizarRelacoes(id, params);
                }
            }
            
            if(status != 'B' && status != 'M' && status != 'E'){
                await utils.dblog(params);
            }

            return { results: movimento };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar movimento' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {

            const isPrudenmoveis = (params.client || 'PRUDENMOVEIS').toUpperCase().match(/PRUDENMOVEIS|EDULAR/);              

            const sql = `execute block as
                begin
                    delete from MOVIMENTOS        where MOVIMENTOS_ID                   = ${id};
                    delete from MOVIMENTOSITENS   where MOVIMENTOSITENS_ID_MOVIMENTOS   = ${id};
                    delete from MOVIMENTOSCAIXA   where MOVIMENTOSCAIXA_ID_MOVIMENTOS   = ${id};
                    delete from CARTOES           where CARTOES_ID_MOVIMENTOS           = ${id};
                    delete from CONTACORRENTES    where CONTACORRENTES_ID_MOVIMENTOS    = ${id};
                    delete from CHEQUES           where CHEQUES_ID_MOVIMENTOS           = ${id};
                    delete from FINANCEIROS       where FINANCEIROS_ID_MOVIMENTOS       = ${id};
                    delete from MOVIMENTOSENVIO   where MOVIMENTOSENVIO_ID_MOVIMENTOS   = ${id};
                    delete from MOVIMENTOSCARTAS  where MOVIMENTOSCARTAS_ID_MOVIMENTOS  = ${id};
                    delete from RELACOESITENS     where RELACOESITENS_ID_MOVIMENTOS     = ${id};
                end;`;
                
            await limparOrigem(id, params);
            await samosFB.executeSQL(sql, params);
            
            //Se for pruden aco, deleta as baixas parciais do pedido
            if( params.client.toUpperCase().match(/PRUDENACO/) )
            {
                const sqlDeletarBaixas = `
                    delete from CREDITOS
                    where CREDITOS_ID_MOVIMENTOS = ${id} and CREDITOS_TIPO = 'B'
                `;

                await samosFB.executeSQL(sqlDeletarBaixas, params);
            }

            try{
                console.log(
                    'EXCLUSAO MOVIMENTO: ' + 
                    params.log + ' ' + 
                    'Usuario: ' + params.userId + ' - ' + 
                    moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                );
            } catch(error){
                console.log(error)
                console.log('EXCLUSAO MOVIMENTO: ' + id)
            }
                        
            await api['processos/atualizasaldo']().create({
                empresa : params.empresa,
                produtos: (params.idsProdutos || '').split(',').filter(id => !!id),
                client  : params.client
            });

            if(!isPrudenmoveis) {
                await atualizarRelacoes(id, params);
            }

            await utils.dblog(params);

        } catch(error) {
            const msg = 'Falha ao deletar movimentos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const getLotes = async function(idMovimento, params){
    const movimentoCompleto = await api.movimentos().readById(idMovimento, params);
    const movimentosItens   = movimentoCompleto.results[0]['MOVIMENTOS_ITENS'];

    const produtosComLote = (movimentosItens || []).filter(produto => {
        return cents(produto['MOVIMENTOSITENS_ID_LOTES']) > 0;
    });

    return produtosComLote;
}

const atualizaCusto = async function(produtos = [], empresa, params) {
    const { client } = params

    const cents = utils.number.cents.bind(utils.number);
    const grams = utils.number.grams.bind(utils.number);

    const sql = produtos.reduce((str, produto) => {

        if(params.client.toUpperCase().match(/HERMES/) &&  // JD Distribuidora
           produto['ITEM_DOCUMENTO'].toString().slice(-4) == '0004') {
            const novoCusto = (((cents(produto['ITEM_TOTAL']) + 
                               cents(produto['ITEM_FRETE']) +             
                               cents(produto['ITEM_SEGURO']) + 
                               cents(produto['ITEM_DESPESAS']) + 
                               cents(produto['ITEM_VALORIPI']) + 
                               cents(produto['ITEM_VALORST']) + 
                               cents(produto['ITEM_DEPOSITO']) + 
                               cents(produto['ITEM_IMPOSTO']))/100) / (grams(produto['ITEM_QUANTIDADE']) / 1000));

            const novoPreco = ((cents(novoCusto) / (produto['NOVO_MARGEM'] / 100)) / 100);
            produto['NOVO_CUSTO'] = novoCusto;
            produto['NOVO_PRECO'] = novoPreco;
        }

        if(params.client.toUpperCase().match(/HOSPITALAR/) &&  // Hospitalar Distribuidora
           produto['ITEM_DOCUMENTO'].toString().slice(-4) == '0005') { // NF Entrada
            const novoCompra = (((cents(produto['ITEM_TOTAL']))/100) / (grams(produto['ITEM_QUANTIDADE']) / 1000));
            const novoPreco = cents(novoCompra + ((novoCompra / 100) * produto['NOVO_MARGEM'])) / 100;
                              
            produto['NOVO_PRECO'] = novoPreco;
            produto['NOVO_PRAZO'] = novoPreco;
        }

        const novo = {
            custo   : parseFloat(produto['NOVO_CUSTO']),
            prazo   : parseFloat(produto['NOVO_PRAZO']),
            preco   : parseFloat(produto['NOVO_PRECO']),
            compra  : parseFloat(produto['NOVO_COMPRA']),
            margem  : parseFloat(produto['NOVO_MARGEM']),
            frete   : parseFloat(produto['SALDOS_TRANSFERENCIA']),
            despesas: parseFloat(produto['SALDOS_RESERVADO']),
        };

        const anterior = {
            custo:  parseFloat(produto['SALDOS_CUSTO']),
            prazo:  parseFloat(produto['SALDOS_PRAZO']),
            preco:  parseFloat(produto['SALDOS_PRECO']),
            compra: parseFloat(produto['SALDOS_COMPRA']),
            margem: parseFloat(produto['SALDOS_MARGEM'])
        };

        let strCusto    = '';
        let strPrazo    = '';
        let strPreco    = '';
        let strCompra   = '';
        let strMargem   = '';

        let strFrete    = ` SALDOS_TRANSFERENCIA = ${novo.frete}, `;
        let strDespesas = ` SALDOS_RESERVADO     = ${novo.despesas}, `;
        
        if(process.env[client ? ((client || '').toUpperCase() + '_BAIXACUSTO') : 'BAIXACUSTO'] == 'TRUE') {
            strCusto  = novo.custo  > 0 ? ` SALDOS_CUSTO  = ${produto['NOVO_CUSTO']}, ` : '';
            strPrazo  = novo.prazo  > 0 ? ` SALDOS_PRAZO  = ${produto['NOVO_PRAZO']}, ` : '';
            strPreco  = novo.preco  > 0 ? ` SALDOS_PRECO  = ${produto['NOVO_PRECO']}, ` : '';
            strCompra = novo.compra > 0 ? ` SALDOS_COMPRA = ${produto['NOVO_COMPRA']}, ` : '';
            strMargem = novo.margem > 0 ? ` SALDOS_MARGEM = ${produto['NOVO_MARGEM']}, ` : '';
        } else {
            strCusto  = novo.custo  > anterior.custo  ? ` SALDOS_CUSTO  = ${produto['NOVO_CUSTO']}, ` : '';
            strPrazo  = novo.prazo  > anterior.prazo  ? ` SALDOS_PRAZO  = ${produto['NOVO_PRAZO']}, ` : '';
            strPreco  = novo.preco  > anterior.preco  ? ` SALDOS_PRECO  = ${produto['NOVO_PRECO']}, ` : '';
            strCompra = novo.compra > anterior.compra ? ` SALDOS_COMPRA = ${produto['NOVO_COMPRA']}, ` : '';
            strMargem = novo.margem > anterior.margem ? ` SALDOS_MARGEM = ${produto['NOVO_MARGEM']}, ` : '';
        }

        const precosMonoEmpresa = process.env[client ? ((client || '').toUpperCase() + '_PRECOS') : 'PRECOS'] == 'MONOEMPRESA';
        const sqlEmpresa = empresa && precosMonoEmpresa ? ` and SALDOS_ID_EMPRESAS = ${empresa} ` : '';

        return str += `
            update SALDOS 
                set 
                    ${strCusto}
                    ${strPrazo}
                    ${strPreco}
                    ${strCompra}
                    ${strMargem}
                    ${strFrete}
                    ${strDespesas}
                    SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}
                where SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}
                ${sqlEmpresa};
            `;
    }, '');

    try {
        await samosFB.executeSQL(`execute block as begin ${sql} end;`, params);
    } catch(error) {
        //apenas lança o erro nos logs, não para a aplicação
        console.log(error);
    }
};

const atualizarRelacoes = async function(idMovimento, params) {
    const sql = `execute block as 
        declare variable MOVIMENTOS_ID_PESSOAS       integer;
        declare variable MOVIMENTOSITENS_ID_PRODUTOS integer;
        declare variable PRODUTOS_UNIDADE            varchar(3);
        declare variable RELACOESITENS_FABRICA       varchar(20);
        declare variable RELACOESITENS_BARRAS        varchar(15);
        declare variable RELACOESITENS_SIGLA         varchar(10);
        declare variable RELACOES_ID                 integer;
        declare variable ultima_gen                  integer;      
        declare variable altera_gen                  varchar(100);  
                        
    begin
        for 
            /*Alista os RELACOESITENS do movimento*/
            select 
                    MOVIMENTOS_ID_PESSOAS, 
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    PRODUTOS_UNIDADE,
                    RELACOESITENS_FABRICA,
                    RELACOESITENS_BARRAS,
                    RELACOESITENS_SIGLA
            from  RELACOESITENS 
            join  MOVIMENTOSITENS on MOVIMENTOSITENS_ID_MOVIMENTOS = RELACOESITENS_ID_MOVIMENTOS and
                                     MOVIMENTOSITENS_ID            = RELACOESITENS_ID_ITENS
            join  MOVIMENTOS      on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
            join  PRODUTOS        on MOVIMENTOSITENS_ID_PRODUTOS   = PRODUTOS_ID
            where RELACOESITENS_ID_MOVIMENTOS = '${idMovimento}'
            into  :MOVIMENTOS_ID_PESSOAS,
                    :MOVIMENTOSITENS_ID_PRODUTOS,
                    :PRODUTOS_UNIDADE,
                    :RELACOESITENS_FABRICA,
                    :RELACOESITENS_BARRAS,
                    :RELACOESITENS_SIGLA
        do
            begin
                /*Se não existir o produto em RELACOES, inclui*/
                if (not exists(
                    select RELACOES_ID from RELACOES where
                        RELACOES_ID_PESSOAS  = :MOVIMENTOS_ID_PESSOAS and
                        RELACOES_ID_PRODUTOS = :MOVIMENTOSITENS_ID_PRODUTOS
                )) then
                    begin
                        /*GENERATOR PARA RELACOES_ID*/
                        RELACOES_ID = gen_id(GEN_RELACOES_ID, 1);
                        ultima_gen  = RELACOES_ID;
                        while (exists(select RELACOES_ID from RELACOES where RELACOES_ID = :RELACOES_ID)) do
                        begin
                            RELACOES_ID = gen_id(GEN_RELACOES_ID, 1);
                        end
                        if ((ultima_gen + 1) < RELACOES_ID) then
                            begin
                                altera_gen = 'set generator GEN_RELACOES_ID to ' || Cast(:RELACOES_ID as varchar(7));
                                execute statement :altera_gen with autonomous transaction;
                            end 

                        insert into RELACOES (
                            RELACOES_ID,
                            RELACOES_ID_PESSOAS,
                            RELACOES_ID_PRODUTOS,
                            RELACOES_FABRICA,
                            RELACOES_BARRAS,
                            RELACOES_SIGLA,
                            RELACOES_FATOR
                        ) values (
                            :RELACOES_ID,
                            :MOVIMENTOS_ID_PESSOAS,
                            :MOVIMENTOSITENS_ID_PRODUTOS,
                            :RELACOESITENS_FABRICA,
                            :RELACOESITENS_BARRAS,
                            :PRODUTOS_UNIDADE,
                            1
                        );
                    end
            end
        
        /*Limpa os RELACOESITENS deste movimento*/
        /*delete from RELACOESITENS where RELACOESITENS_ID_MOVIMENTOS = '${idMovimento}'*/
    end`;
    
    try {
        await samosFB.executeSQL(sql, params);
    } catch(error) {
        //apenas lança o erro nos logs, não para a aplicação
        console.log(error);
    }
};

const limparOrigem = async function(idMovimento, params) {
    const queryMovimento = await api.movimentos().readById(idMovimento, params);
    const movimento = queryMovimento && queryMovimento.results ? queryMovimento.results[0] : {};
    
    const sql = `update MOVIMENTOS 
        set 
            MOVIMENTOS_NUMEROORIGEM = 0, 
            MOVIMENTOS_SERIEORIGEM  = '', 
            MOVIMENTOS_STATUS       = 'N'
        where 
            MOVIMENTOS_SERIE        = 'ORC' and 
            MOVIMENTOS_NUMEROORIGEM = '${movimento['MOVIMENTOS_NUMERO']}' and 
            MOVIMENTOS_SERIEORIGEM  = '${movimento['MOVIMENTOS_SERIE']}'
        `;

    try {
        await samosFB.executeSQL(sql, params);
    } catch(error) {
        //apenas lança o erro nos logs, não para a aplicação
        console.log(error);
    }
};

const confereTotalMovimento = function(cabecalho, filhos, metodo) {
    const cents = utils.number.cents.bind(utils.number);
    const total = cents(cabecalho['MOVIMENTOS_TOTAL']);
    const frete = cents(cabecalho['MOVIMENTOS_FRETE']);
    const itens = filhos['MOVIMENTOS_ITENS'] || [];

    const somaItens = itens.reduce((total, itens) => {
        return total + (cents(itens['TOTAL_LIQUIDO']) || 0);
    }, 0);

    const diferenca = Math.abs((somaItens + frete) - total);

    /*Descomentar para pegar erros de diferenca de valores
    const log = `${metodo} de Movimento:
        ID:      ${cabecalho['MOVIMENTOS_ID']}
        Número:  ${cabecalho['MOVIMENTOS_NUMERO']}
        Série:   ${cabecalho['MOVIMENTOS_SERIE']}
        Empresa: ${cabecalho['MOVIMENTOS_ID_EMPRESAS']}
    Mestre: ${total / 100}
    Itens: ${somaItens / 100}
    Diferença: ${diferenca / 100}

    ObjMestre: ${JSON.stringify(cabecalho)}
    ObjItens:  ${JSON.stringify(itens)}

    `;

    console.log(log, false, 'movimentos.log');*/

    if(total && diferenca > 10 && somaItens > 0) {
        console.log(`Divergência no total do Movimento:
            ID:      ${cabecalho['MOVIMENTOS_ID']}
            Número:  ${cabecalho['MOVIMENTOS_NUMERO']}
            Série:   ${cabecalho['MOVIMENTOS_SERIE']}
            Empresa: ${cabecalho['MOVIMENTOS_ID_EMPRESAS']}
        Mestre: ${total / 100}
        Itens: ${somaItens / 100}
        diferenca: ${diferenca / 100}`);
        
        return true;

    } else {
        return false;
    }
};

const movimentoJaGravado = async function(movimento, params) {
    const empresa   = movimento['MOVIMENTOS_ID_EMPRESAS'];
    const origem    = (utils.number.cents(movimento['MOVIMENTOS_NUMEROORIGEM']) / 100);
    const documento = movimento['MOVIMENTOS_ID_DOCUMENTOS'];
    const emissao   = movimento['MOVIMENTOS_EMISSAO'];
    const pessoa    = movimento['MOVIMENTOS_ID_PESSOAS'];
    const operacao  = movimento['MOVIMENTOS_ID_OPERACOES'];
    const total     = movimento['MOVIMENTOS_TOTAL'];
    const sqlOrigem = origem > 0 ? `MOVIMENTOS_NUMEROORIGEM  = ${origem} and ` : ``;

    const sql = `select MOVIMENTOS_ID, MOVIMENTOS_NUMERO, MOVIMENTOS_SERIE from MOVIMENTOS
        where MOVIMENTOS_ID_EMPRESAS   = ${empresa}   and
              MOVIMENTOS_ID_DOCUMENTOS = ${documento} and
              ${sqlOrigem}
              MOVIMENTOS_EMISSAO       = '${emissao}' and
              MOVIMENTOS_ID_PESSOAS    = ${pessoa}    and
              MOVIMENTOS_ID_OPERACOES  = ${operacao}  and
              MOVIMENTOS_TOTAL         = ${total}     and
              (MOVIMENTOS_STATUS <> 'C' and 
               MOVIMENTOS_STATUS <> 'D' and 
               MOVIMENTOS_STATUS <> 'R')`

    return await samosFB.executeSQL(sql, params);
};

const atualizarLotes = async function(itens, params) {

    for(let i in itens) {
        if(itens[i]['MOVIMENTOSITENS_ID_LOTES'] > 0 && itens[i]['MOVIMENTOSITENS_ID_PRODUTOS'] != 999999) { // Se tiver lote informado no item
            const produto = itens[i]['MOVIMENTOSITENS_ID_PRODUTOS'] || 0;
            const qtde = itens[i]['MOVIMENTOSITENS_QUANTIDADE'] || 0;
            const lote = itens[i]['MOVIMENTOSITENS_ID_LOTES'];
            const sql = `update LOTES set LOTES_ID_PRODUTOS = ${produto},
                                          LOTES_QUANTIDADE = ${qtde} where LOTES_ID = ${lote}`
            await samosFB.executeSQL(sql, params);
        }
    }
};

const atualizarSaldoLotes = async function(produtos, params) {  // Atualiza os saldos dos lotes
    
    for(let i in produtos) {  // Faz a soma
        const sqlSaidas = `
            select sum(MOVIMENTOSITENS_QUANTIDADE) as SAIDAS_LOTES
            from MOVIMENTOSITENS
            join OPERACOES on OPERACOES_ID = MOVIMENTOSITENS_ID_OPERACOES
            where MOVIMENTOSITENS_ID_LOTES = ${ produtos[i]['MOVIMENTOSITENS_ID_LOTES'] } and
                  OPERACOES_ESTOQUE = 'D'
        `

        const querySaidas = await samosFB.executeSQL(sqlSaidas, params); 
        const qtdeSaidas = cents(querySaidas[0]['SAIDAS_LOTES']);

        const sqlEntradas = `
            select LOTES_QUANTIDADE as ENTRADAS_LOTES
            from LOTES
            where LOTES_ID = ${ produtos[i]['MOVIMENTOSITENS_ID_LOTES'] } 
        `
        const queryEntradas = await samosFB.executeSQL(sqlEntradas, params); 
        const qtdeEntradas = cents(queryEntradas[0]['ENTRADAS_LOTES']);

        //Faz o update

        let sqlUpdateLote = `
            update LOTES set LOTES_SALDO = LOTES_QUANTIDADE - ${ (qtdeSaidas/100) }
        `   

        if( (qtdeEntradas - qtdeSaidas) <= 0 ){
            //Inativar
            sqlUpdateLote += `,LOTES_STATUS = 'F'`;
        }

        const queryUpdate = await samosFB.executeSQL(sqlUpdateLote, params);


    }

};

const atualizarNcms = async function(itens, params) {

    return;

    for(let i in itens) {
        if(itens[i]['MOVIMENTOSITENS_ID_LOTES'] > 0 && itens[i]['MOVIMENTOSITENS_ID_PRODUTOS'] != 999999) { // Se tiver lote informado no item
            const produto = itens[i]['MOVIMENTOSITENS_ID_PRODUTOS'] || 0;
            const qtde = itens[i]['MOVIMENTOSITENS_QUANTIDADE'] || 0;
            const lote = itens[i]['MOVIMENTOSITENS_ID_LOTES'];
            const sql = `update LOTES set LOTES_ID_PRODUTOS = ${produto},
                                          LOTES_QUANTIDADE = ${qtde} where LOTES_ID = ${lote}`
            await samosFB.executeSQL(sql, params);
        }
    }
};

const rightIdDocumento = function(documento) {

    switch(documento) {
        case 'Orçamentos'            : return '0001';
        case 'Pedidos'               : return '0002';
        case 'Nota Eletrônica'       : return '0003';
        case 'Requisições'           : return '0004';
        case 'Nota Entrada'          : return '0005';
        case 'Compras'               : return '0006';
        case 'Pedidos Compra'        : return '0006';
        case 'Cupom Fiscal'          : return '0011';
        case 'Devoluções'            : return '0012';
        case 'Requisicoes Faturadas' : return '0016';
        case 'Pré-vendas'            : return '0021';
        default : '';
    }
};

const obterSomaMovimentos = async function(sqlWhere, params) {
    let sql = `select sum(MOVIMENTOS_TOTAL) from MOVIMENTOS
                left outer join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                 ${sqlWhere} 
               and (MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D')`;
    let result = await samosFB.executeSQL(sql, params);
  
    return result[0]['SUM']
};

const atualizarUsuarioPessoa = async function(pessoa, usuario, params) {
    
    const sql = `update PESSOAS set PESSOAS_ID_USUARIOS = ${usuario}
                                where PESSOAS_ID = ${pessoa}
                                  and PESSOAS_ID_USUARIOS = 0`;

    try {
        await samosFB.executeSQL(sql, params);
    } catch(error) {
        //apenas lança o erro nos logs, não para a aplicação
        console.log(error);
    }
};

const atualizaCustoFormulas = async function(params) {  // Atualiza o custo de todas as fórmulas de acordo com os produtos utilizados
    
    const sqlProdutos = `select PRODUCOESFORMULAS_ID_PRODUTOS from PRODUCOESFORMULAS`;

    const produtos = await samosFB.executeSQL(sqlProdutos, params); 

    for(let i in produtos) {

        const produtoFormula = produtos[i]['PRODUCOESFORMULAS_ID_PRODUTOS'];

        const queryFormula = await api.ordensproducaoformulas().readById(produtoFormula, params);

        if(queryFormula.results.length > 0) {
            const custoAtualizado = queryFormula.results[0]['VALOR_TOTAL'] || 0;
            if(custoAtualizado > 0) {
                const sql = `update SALDOS set SALDOS_CUSTO = ${custoAtualizado}
                             where SALDOS_ID_PRODUTOS = ${produtoFormula}`;
                try { 
                        await samosFB.executeSQL(sql, params);
                } catch(error) {
                    //apenas lança o erro nos logs, não para a aplicação
                    console.log(error);
                }
            }
        }
    }

};

const atualizaPesoNfe = async function(idMovimento, params) {  // Atualiza os pesos da Prudenaço no MOVIMENTOSENVIO
    
    const sqlProdutos = `select MOVIMENTOSITENS_ID_PRODUTOS, MOVIMENTOSITENS_QUANTIDADE, PRODUTOS_UNIDADE, PRODUTOS_PESOLIQUIDO, PRODUTOS_PESOBRUTO 
                           from MOVIMENTOSITENS
                           join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
                         where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idMovimento}`;

    const produtos = await samosFB.executeSQL(sqlProdutos, params); 
    let totalLiquido = 0
    let totalBruto = 0

    for(let i in produtos) {  // Faz a soma dos pesos

        if(produtos[i]['PRODUTOS_PESOLIQUIDO'] > 0 && produtos[i]['PRODUTOS_UNIDADE'] != 'KG') {
            totalLiquido += (produtos[i]['PRODUTOS_PESOLIQUIDO'] * produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])
        }

        if(produtos[i]['PRODUTOS_UNIDADE'] == 'KG') {
            totalLiquido += produtos[i]['MOVIMENTOSITENS_QUANTIDADE']
        }

        if(produtos[i]['PRODUTOS_PESOBRUTO'] > 0 && produtos[i]['PRODUTOS_UNIDADE'] != 'KG') {
            totalBruto += (produtos[i]['PRODUTOS_PESOBRUTO'] * produtos[i]['MOVIMENTOSITENS_QUANTIDADE'])
        }

        if(produtos[i]['PRODUTOS_UNIDADE'] == 'KG') {
            totalBruto += produtos[i]['MOVIMENTOSITENS_QUANTIDADE']
        }
      
    }

    const sqlEnvio = `select MOVIMENTOSENVIO_ID from MOVIMENTOSENVIO 
                       where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${idMovimento}`;

    const queryEnvio = await samosFB.executeSQL(sqlEnvio, params); 

    if((queryEnvio || []).length > 0) {
        const sqlPesos = `update MOVIMENTOSENVIO set MOVIMENTOSENVIO_PESOLIQUIDO = ${totalLiquido.toFixed(3)},
                                                    MOVIMENTOSENVIO_PESOBRUTO = ${totalBruto.toFixed(3)}
                    where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${idMovimento}`;
        try { 
            await samosFB.executeSQL(sqlPesos, params);
        } catch(error) {
            //apenas lança o erro nos logs, não para a aplicação
            console.log(error);
        }
    }

};

const atualizaTotaisNfe = async function(idMovimento, params) {  // Atualiza o MOVIMENTOSITENS_TOTAL das notas da raçaforte
    
    const sqlItens = `update MOVIMENTOSITENS set MOVIMENTOSITENS_TOTAL = (MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO)
                         where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idMovimento}`;
    try { 
        await samosFB.executeSQL(sqlItens, params);             
    } catch(error) {
        //apenas lança o erro nos logs, não para a aplicação
        console.log(error);
    }
};

const ajustaICMSCabecalho = function(movimento) {

    const produtos = movimento['MOVIMENTOS_ITENS'] || [];

    let totalBaseICMS  = 0;
    let totalValorICMS = 0;

    produtos.forEach(produto => {
        totalBaseICMS  += cents(produto['MOVIMENTOSITENS_BASEICMS']);
        totalValorICMS += cents(produto['MOVIMENTOSITENS_VALORICMS']);
    });

    movimento['MOVIMENTOS_BASEICMS']  = totalBaseICMS / 100;
    movimento['MOVIMENTOS_VALORICMS'] = totalValorICMS / 100;
};

const ajusteSTItens = async function(movimento) {  // Corrigir divergencia ST Mestre x Itens
    const cents        = utils.number.cents.bind(utils.number);    
    const produtos     = movimento['MOVIMENTOS_ITENS'] || [];
    const totalBaseST  = cents(movimento['MOVIMENTOS_BASEST']);
    const totalValorST = cents(movimento['MOVIMENTOS_VALORST']);

    let somaBaseST  = 0;
    let somaValorST = 0;

    produtos.forEach(produto => {
        const baseSTItem  = cents(produto['MOVIMENTOSITENS_BASEST']);
        const valorSTItem = cents(produto['MOVIMENTOSITENS_VALORST']);
        somaBaseST  += baseSTItem;
        somaValorST += valorSTItem;
    });

    if(somaBaseST > totalBaseST) { // sobra
        const diferencaBase = (somaBaseST - totalBaseST);
        produtos[0]['MOVIMENTOSITENS_BASEST'] = (cents(produtos[0]['MOVIMENTOSITENS_BASEST']) - diferencaBase) / 100;
    } else if(somaBaseST < totalBaseST) { // falta
        const diferencaBase = (totalBaseST - somaBaseST);
        produtos[0]['MOVIMENTOSITENS_BASEST'] = (cents(produtos[0]['MOVIMENTOSITENS_BASEST']) + diferencaBase) / 100
    }

    if(somaValorST > totalValorST) { // sobra
        const diferencaValor = (somaValorST - totalValorST);
        produtos[0]['MOVIMENTOSITENS_VALORST'] = (cents(produtos[0]['MOVIMENTOSITENS_VALORST']) - diferencaValor) / 100;
    } else if(somaValorST < totalValorST) { // falta
        const diferencaValor = (totalValorST - somaValorST);
        produtos[0]['MOVIMENTOSITENS_VALORST'] = (cents(produtos[0]['MOVIMENTOSITENS_VALORST']) + diferencaValor) / 100;
    }

};