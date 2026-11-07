'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const moment  = require('moment-timezone');

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
            const isNotaEntrada = nomedocumento.match(/Entrada/);
            const isPedidoCompra = nomedocumento.match(/Compra/);
            const idDocumento = await rightIdDocumento(nomedocumento, params); // Pega os 4 últimos dígitos do ID documento (para multiempresa)
            const buscaPorComanda = (numero || '').toString().toUpperCase().charAt(0) == 'C';

            let sqlEmpresa     = '';
            let sqlDocumento   = '';
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
            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlIdDocumento} ${sqlVendedor}`;
                
            if(operacao) {
                sqlWhere += ` and MOVIMENTOS_ID_OPERACOES = ${operacao} `;
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
                                select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                                join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                                join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
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
                    sqlWhere += ` and ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0)) `; 
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
                            select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
                            join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                            join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
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
                    MOVIMENTOS_ID_PESSOAS,
                    MOVIMENTOS_ID_PROPRIEDADES,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_FANTASIA,
                    MOVIMENTOS_CELULAR,
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
                    EMPRESAS_NOME
                    ${
                        status == 12
                        ? `, cast ((
                                select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                                join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                                join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
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
                            left join PRODUTOS        on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
                            left join MONTAGENS       on MONTAGENS_ID  = PRODUTOS_ID_MONTAGENS` 
                        : ''
                    }
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            const somaMovimentos = (movimentos.length && params.client.toUpperCase().match(/HERMES|HERB/ig)) ? await obterSomaMovimentos(sqlWhere, params) : 0;

            movimentos.map(movimento => {
                movimento['TOTAL_MOVIMENTOS'] = somaMovimentos;

                if(movimento['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
                    movimento['CIDADES_NOME']   = movimento['CIDADES_NOMEPROPRIEDADE'];
                    movimento['CIDADES_ESTADO'] = movimento['CIDADES_ESTADOPROPRIEDADE'];
                }
            })

            return { results: movimentos, total };

        } catch(error) {
            const msg = 'Falha ao buscar movimento';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
 
    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');
            let sqlWhere = ` where `;
            const precoMarkUp = process.env[params.client ? ((params.client || '').toUpperCase() + '_MARKUP') : 'MARKUP'] == 'TRUE';            
            const orcPrazo    = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const sqlMarkup = precoMarkUp ? '(SALDOS_PRECO - round((SALDOS_PRECO * (SALDOS_MARKUP / 100)), 2))': 'SALDOS_PRECOMINIMO';
            
            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and
                              MOVIMENTOS_NUMERO      = ${params.numero}  and
                              MOVIMENTOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` MOVIMENTOS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const nomeProduto = params.client.toUpperCase().match(/PRUDENMOVEIS/) ? `(PRODUTOS_NOME || ' ' || PRODUTOS_FABRICA)` : 'PRODUTOS_NOME';   // Na pruden a descrição inclui as dimensões na view 

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
                CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
                EMPRESAS_TELEFONE,
                EMPRESAS_EMAIL,
                EMPRESAS_PAGINA,
                EMPRESAS_ALIQUOTA,
                MOVIMENTOS_ID_PESSOAS,
                MOVIMENTOS_ID_PROPRIEDADES,
                PESSOAS_NOME,
                PESSOAS_FANTASIA,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_CEP,
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                PESSOAS_CELULAR,
                MOVIMENTOS_CELULAR,
                PESSOAS_CREDITO,
                PESSOAS_TIPO,
                PESSOAS_ID_CIDADES,
                PESSOAS_OBSERVACOES,
                PESSOAS_CPFCNPJ,
                PESSOAS_PAGINA,
                CIDADES.CIDADES_NOME,
                CIDADES.CIDADES_ESTADO,
                CIDADES.CIDADES_IBGE,
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
                USUARIOS_LOGIN,
                USUARIOS_CELULAR,
                MOVIMENTOS_ID_APLICACOES,
                APLICACOES_NOME,
                MOVIMENTOS_ID_CUSTOS,
                CUSTOS_NOME,
                MOVIMENTOS_ID_OPERACOES,
                OPERACOES_NOME,
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
                MOVIMENTOS_BASEICMS,
                MOVIMENTOS_VALORICMS,
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
                MOVIMENTOS_OBSERVACOES,
                trim(MOVIMENTOS_STATUS) as MOVIMENTOS_STATUS,
                trim(MOVIMENTOS_SITUACAO) as MOVIMENTOS_SITUACAO,
                MOVIMENTOS_LOG,
                MOVIMENTOS_EMAIL,
                MOVIMENTOS_NOME,
                MOVIMENTOS_CPFCNPJ,
                MOVIMENTOS_IMPOSTO, 
                cast ((
                    select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                    join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                    join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
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
                const isPedido         = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
                const isPedidoCompra   = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
                const isOrcamentoPrazo = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
                const idProfissional   = movimento['MOVIMENTOS_PROTOCOLO'] || '';

                if(isPedido && idProfissional && params.client.toUpperCase().match(/LISLAIS/)) {
                    const searchProfissional = await samosFB.executeSQL(`select USUARIOS_NOME from USUARIOS where USUARIOS_ID = ${idProfissional}`, params);
                    movimento['PROFISSIONAIS_NOME'] = searchProfissional[0]['USUARIOS_NOME'] || '';
                }

                if(isPedidoCompra || isOrcamentoPrazo) {
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
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL,
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
                    PRODUTOS_DERIVADO, 
                    PRODUTOS_UNIDADE,
                    PRODUTOS_REFERENCIA,
                    PRODUTOS_STATUS,
                    PRODUTOS_DESCRICAO, 
                    PRODUTOS_MARCA, 
                    PRODUTOS_FABRICA,
                    PRODUTOS_APLICACAO, 
                    PRODUTOS_PESOLIQUIDO, 
                    PRODUTOS_PESOBRUTO,
                    PRODUTOS_ID_GRUPOS,
                    PRODUTOS_BARRA,
                    PRODUTOS_REFERENCIA,
                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as numeric(12,2)) as TOTAL_CUSTO,
                    (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_ENTREGUE - MOVIMENTOSITENS_DEPOSITO - MOVIMENTOSITENS_IMEDIATA) as ITENS_ENTREGAR,
                    (iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SALDOS_CUSTO, 
                    SALDOS_COMPRA, 
                    SALDOS_PRECO, 
                    SALDOS_PRAZO, 
                    SALDOS_DISPONIVEL, 
                    SALDOS_IPI, 
                    SALDOS_CSTLOCAL, 
                    SALDOS_CSTOUTROS, 
                    SALDOS_LOCAL,
                    SALDOS_TRANSFERENCIA, 
                    SALDOS_ICMSLC, 
                    SALDOS_ICMS01, 
                    SALDOS_ICMS02, 
                    SALDOS_MARGEM, 
                    ${sqlMarkup} as SALDOS_PRECOMINIMO,   
                    ${sqlMarkup} as PRECOMINIMO_DB,
                    SALDOS_CUSTO as NOVO_CUSTO, 
                    SALDOS_MARGEM as NOVO_MARGEM,
                    SALDOS_PRECO as NOVO_PRECO, 
                    SALDOS_PRAZO as NOVO_PRAZO,
                    SALDOS_COMPRA as NOVO_COMPRA,
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
                        select first 1 skip 0 PROMOCOESITENS_CUSTOTECNICO from PROMOCOESITENS
                        join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                        where PROMOCOES_STATUS   = 'T'           and
                                PROMOCOES_EMISSAO  <= current_date and
                                PROMOCOES_VALIDADE >= current_date and
                                position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
                                PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
                    ) as QTDE_PROMOCAO,
                    SALDOS_BASELC, 
                    SALDOS_BASE01, 
                    SALDOS_BASE02,
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
                    OPERACOES_NOME, 
                    EMPRESAS_FANTASIA,
                    LOTES_REFERENCIA,
                    LOTES_FABRICACAO,
                    LOTES_VALIDADE,
                    0 as ITENS_MARGEM,
                    iif(MOVIMENTOSITENS_CSTPIS = 'ML', 0, cast(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE as numeric(12,2))) as MONTAGENS_VALOR
                from MOVIMENTOSITENS
                join MOVIMENTOS          on MOVIMENTOS_ID                 = MOVIMENTOSITENS_ID_MOVIMENTOS
                left join RELACOESITENS  on MOVIMENTOSITENS_ID_MOVIMENTOS = RELACOESITENS_ID_MOVIMENTOS and 
                                            MOVIMENTOSITENS_ID            = RELACOESITENS_ID_ITENS
                left join PRODUTOS       on PRODUTOS_ID                   = MOVIMENTOSITENS_ID_PRODUTOS
                left join MONTAGENS      on MONTAGENS_ID                  = PRODUTOS_ID_MONTAGENS
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
                    PESSOAS_NOME, 
                    CONTROLES_ID_PORTADORES as MOVIMENTOSCAIXA_ID_PORTADORES, 
                    PORTADORES_NOME, 
                    CONTROLES_DOCUMENTO
                from MOVIMENTOSCAIXA
                join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
                left outer join CONTROLES on CONTROLES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
                where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`
    
                movimento['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixa, params);

                const sqlFormas = `select MOVIMENTOSFORMAS.*, MOVIMENTOS_BASEICMS, MOVIMENTOS_BASEST from MOVIMENTOSFORMAS
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

                const sqlEnvio = `select 
                    MOVIMENTOSENVIO.*, 
                    CIDADES_NOME, 
                    CIDADES_ESTADO 
                from MOVIMENTOSENVIO
                join CIDADES on CIDADES_ID = MOVIMENTOSENVIO_ID_CIDADES
                where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

                movimento['MOVIMENTOS_ENVIO'] = await samosFB.executeSQL(sqlEnvio, params);

                const sqlCartas = `select MOVIMENTOSCARTAS.*, MOVIMENTOS_NFE from MOVIMENTOSCARTAS 
                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCARTAS_ID_MOVIMENTOS
                where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`

                movimento['MOVIMENTOS_CARTAS'] = await samosFB.executeSQL(sqlCartas, params);

                const sqlRomaneiosMoveis =  `select 
                    ROMANEIOSITENS_ID, 
                    ROMANEIOS_NUMERO, 
                    DOCUMENTOS_NOME 
                from ROMANEIOSITENS
                join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
                join DOCUMENTOS on ROMANEIOS_ID_DOCUMENTOS = DOCUMENTOS_ID
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
            const { numero, serie } = await samosFB.ultimoDocto('MOVIMENTOS', movimento, params);
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora = moment.tz(params.timezone).format('HH:mm:ss');
            const cents = utils.number.cents.bind(utils.number);
            const empresa = movimento['MOVIMENTOS_ID_EMPRESAS'];
            const orcPrazo             = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const isPedidoCompra       = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
            const isOrcamentoPrazo     = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
            const isMovimentoSaida     = movimento['OPERACOES_TIPO'] == 'S';
            const isComplementar       = (movimento['OPERACOES_COMPLEMENTAR'] == 'T' && movimento['MOVIMENTOS_TOTAL'] == 0.01);
            const isNotaEntrada        = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0005';
            const isNotaEletronica     = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';
            const isRequisicaoEntrada  = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0004' && movimento['MOVIMENTOS_ID_OPERACOES'] < 500000;
            const isRequisicaoNumerada = isRequisicaoEntrada && movimento['MOVIMENTOS_NUMERO'];
            const isTransferencia      = movimento['DOCUMENTOS_NOME'].match(/Transfer/);
            const isPedidoVenda        = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
            const isOrcamento          = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001';

            const custos = [];

            if(!isNotaEntrada && !isRequisicaoNumerada) {
                movimento['MOVIMENTOS_NUMERO']  = numero;
                movimento['MOVIMENTOS_SERIE']   = serie;
                movimento['MOVIMENTOS_EMISSAO'] = (params.gravarEmissaoRecebida == 'true' || isPedidoCompra) && movimento['MOVIMENTOS_EMISSAO'] ? movimento['MOVIMENTOS_EMISSAO'] : hoje;
                movimento['MOVIMENTOS_HORA']    = (params.gravarEmissaoRecebida == 'true' || isPedidoCompra) && movimento['MOVIMENTOS_HORA']    ? movimento['MOVIMENTOS_HORA']    : hora;
                movimento['MOVIMENTOS_LOG']     = params.userLogin + ' ' + movimento['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + movimento['MOVIMENTOS_HORA'];
              
                if(
                    (movimento['MOVIMENTOS_STATUS']       || '').match('F') &&
                    (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')
                ) {
                    movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
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
                    movimento['MOVIMENTOS_LOG']     = movimento['USUARIOS_LOGIN'] + ' ' + movimento['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + movimento['MOVIMENTOS_HORA'];    
                }

                (movimento['MOVIMENTOS_FINANCEIROS'] || []).forEach(financeiro => {
                    financeiro['FINANCEIROS_ID_APLICACOES'] = movimento['MOVIMENTOS_ID_APLICACOES'] || 1;
                });

            }

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {
                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
                item['MOVIMENTOSITENS_FRETE'] = (cents(item['MOVIMENTOSITENS_FRETE']) / 100) || 0;
                item['MOVIMENTOSITENS_SEGURO'] = (cents(item['MOVIMENTOSITENS_SEGURO']) / 100) || 0;
                item['MOVIMENTOSITENS_DESPESAS'] = (cents(item['MOVIMENTOSITENS_DESPESAS']) / 100) || 0;

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

            (movimento['MOVIMENTOS_CAIXA'] || []).forEach(caixa => {
                delete caixa['MOVIMENTOSCAIXA_ID_PORTADORES'];

                caixa['MOVIMENTOSCAIXA_EMISSAO'] = hoje;
                caixa['MOVIMENTOSCAIXA_HORA']    = hora;
                caixa['MOVIMENTOSCAIXA_NOME']    = caixa['MOVIMENTOSCAIXA_NOME']
                    .replace('[NUMERO]', numero)
                    .replace('[SERIE]',  serie);
            });

            (movimento['MOVIMENTOS_CARTOES'] || []).forEach(cartao => {
                cartao['CARTOES_EMISSAO'] = hoje;
            });

            (movimento['MOVIMENTOS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_EMISSAO'] = hoje;
            });

            // não permitir duplicar transferência e pedido de venda na Pruden
            if((isTransferencia || isPedidoVenda) && params.client.toUpperCase().match(/PRUDENMOVEIS/) ||
                isNotaEletronica && params.client.toUpperCase().match(/HOSPITALAR/)) {
                const jaLancado = await movimentoJaGravado(movimento, params);
                if(jaLancado.length > 0) {
                    throw 'Já lançado'
                }
            }

            if(isPedidoCompra || isOrcamentoPrazo) {
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

            await samosFB.insert('MOVIMENTOS', movimento, params);

            (movimento['MOVIMENTOS_ITENS'] || []).forEach(item => {
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

            (movimento['MOVIMENTOS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_FINANCEIROS'] || []).forEach(financeiro => {
                financeiro['FINANCEIROS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_ENVIO'] || []).forEach(envio => {
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
                }
                if((movimento['MOVIMENTOS_FORMASPAGAMENTO'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSFORMAS', movimento['MOVIMENTOS_FORMASPAGAMENTO'], params);
                }
                if((movimento['MOVIMENTOS_CARTOES'] || []).length > 0) {
                    await samosFB.insert('CARTOES', movimento['MOVIMENTOS_CARTOES'], params);
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
                await atualizaCusto(custos, empresa, params);
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
            if(produtosEditaveis.length > 0 && isMovimentoSaida) {
                api['relacoesitens']().create({
                    idmovimento: movimento['MOVIMENTOS_ID'],
                    itens      : produtosEditaveis
                }, params);    
            }

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
        const itens       = movimento['MOVIMENTOS_ITENS'];
        const caixa       = movimento['MOVIMENTOS_CAIXA'];
        const formas      = movimento['MOVIMENTOS_FORMASPAGAMENTO'];
        const cartoes     = movimento['MOVIMENTOS_CARTOES'];
        const cheques     = movimento['MOVIMENTOS_CHEQUES'];
        const financeiros = movimento['MOVIMENTOS_FINANCEIROS'];
        const envio       = movimento['MOVIMENTOS_ENVIO'];
        const cartas      = movimento['MOVIMENTOS_CARTAS'];

        try {
            const hoje                = moment.tz(params.timezone).format('YYYY-MM-DD');
            const cents               = utils.number.cents.bind(utils.number);            
            const empresa             = movimento['MOVIMENTOS_ID_EMPRESAS'];
            const isMovimentoSaida    = movimento['OPERACOES_TIPO']  == 'S';
            const tipoFinanceiro      = movimento['OPERACOES_FINANCEIRO'];
            const orcPrazo            = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
            const isPedidoCompra      = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0006';
            const isOrcamentoPrazo    = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0001' && orcPrazo;
            const isNotaEntrada       = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0005';
            const isRequisicaoEntrada = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0004' && movimento['MOVIMENTOS_ID_OPERACOES'] < 500000;
            const isDevolucao         = (movimento['MOVIMENTOS_ID_DOCUMENTOS']||'').toString().slice(-4) == '0012';
            const isComplementar      = (movimento['OPERACOES_COMPLEMENTAR'] == 'T' && itens[0]['TOTAL_LIQUIDO'] <= 0.01);

            const custos = [];

            if(!isNotaEntrada && !isRequisicaoEntrada) {
                if(
                    (movimento['MOVIMENTOS_STATUS']       || '').match('F') &&
                    (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')
                ) {
                    movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
                }

                if(movimento['USUARIOS_LOGIN']) {
                    movimento['MOVIMENTOS_LOG'] = movimento['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                }
            }

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {
                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
                item['MOVIMENTOSITENS_MARGEM']     = item['MOVIMENTOSITENS_MARGEM']     || 0;
                item['MOVIMENTOSITENS_SEGURO']     = item['MOVIMENTOSITENS_SEGURO']     || 0;

                if(isPedidoCompra) {
                    item['MOVIMENTOSITENS_ID_EMPRESAS'] = parseInt(index) + 1;                    
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

            (movimento['MOVIMENTOS_ENVIO'] || []).forEach(envio => {
                envio['MOVIMENTOSENVIO_PLACAUF'] = envio['MOVIMENTOSENVIO_PLACAUF'] || '';
            });

            if(isPedidoCompra || isOrcamentoPrazo) {
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

                const financeirosOriginais = await samosFB.executeSQL(`select * from FINANCEIROS where FINANCEIROS_ID_MOVIMENTOS = ${id}`, params);

                const semParciais = (financeirosOriginais || []).every(financeiro => { 
                    return financeiro['FINANCEIROS_ABERTO'] == financeiro['FINANCEIROS_ORIGINAL']
                })    

                if(semParciais || params.client.toUpperCase().match(/PRUDENMOVEIS/)) {  // Só altera o financeiro se não tiver lançamentos parciais

                    await samosFB.executeSQL(`delete from FINANCEIROS where FINANCEIROS_ID_MOVIMENTOS = ${id}`, params);
            
                    (financeiros || []).map(item => {
                        item['FINANCEIROS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
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

            if(isPedidoCompra || isOrcamentoPrazo || isNotaEntrada || isRequisicaoEntrada) {
                delete movimento['MOVIMENTOS_OBSERVACOES'];//para não dar bug no pedido de compra, não retorna a observação persistida
            }

            if(
                (isNotaEntrada || isRequisicaoEntrada) && 
                movimento['MOVIMENTOS_SITUACAO'] != 1    && 
                movimento['MOVIMENTOS_SITUACAO'] != 3
            ) {
                await atualizaCusto(custos, empresa, params);
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

            if(isMovimentoSaida) {
                await samosFB.executeSQL(`delete from RELACOESITENS where RELACOESITENS_ID_MOVIMENTOS = ${id}`, params);
            }

            const produtosEditaveis = (movimento['MOVIMENTOS_ITENS'] || []).filter(produto => {
                return produto['PRODUTOS_EDITAVEL'] == 'T';
            });

            //produtos editáveis
            if(produtosEditaveis.length > 0 && isMovimentoSaida) {
                await api['relacoesitens']().create({
                    idmovimento: movimento['MOVIMENTOS_ID'],
                    itens      : produtosEditaveis
                }, params);    
            }

            const status = movimento['MOVIMENTOS_STATUS'];

            if(isNotaEntrada && (status == 'F' || status == 'G')){
                await atualizarRelacoes(id, params);
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
            const sql = `execute block as
                begin
                    delete from MOVIMENTOS        where MOVIMENTOS_ID                   = ${id};
                    delete from MOVIMENTOSITENS   where MOVIMENTOSITENS_ID_MOVIMENTOS   = ${id};
                    delete from MOVIMENTOSCAIXA   where MOVIMENTOSCAIXA_ID_MOVIMENTOS   = ${id};
                    delete from CARTOES           where CARTOES_ID_MOVIMENTOS           = ${id};
                    delete from CHEQUES           where CHEQUES_ID_MOVIMENTOS           = ${id};
                    delete from FINANCEIROS       where FINANCEIROS_ID_MOVIMENTOS       = ${id};
                    delete from MOVIMENTOSENVIO   where MOVIMENTOSENVIO_ID_MOVIMENTOS   = ${id};
                    delete from MOVIMENTOSCARTAS  where MOVIMENTOSCARTAS_ID_MOVIMENTOS  = ${id};
                    delete from RELACOESITENS     where RELACOESITENS_ID_MOVIMENTOS     = ${id};
                end;`;
                
            await limparOrigem(id, params);
            await samosFB.executeSQL(sql, params);
            
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

            await atualizarRelacoes(id, params);
            await utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar movimentos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const atualizaCusto = async function(produtos = [], empresa, params) {
    const { client } = params

    const cents = utils.number.cents.bind(utils.number);
    const grams = utils.number.grams.bind(utils.number);

    const sql = produtos.reduce((str, produto) => {

        if(params.client.toUpperCase().match(/HERMES/) && produto['ITEM_DOCUMENTO'].toString().slice(-4) == '0004') {
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
            join  MOVIMENTOSITENS on RELACOESITENS_ID_ITENS        = MOVIMENTOSITENS_ID
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
        delete from RELACOESITENS where RELACOESITENS_ID_MOVIMENTOS = '${idMovimento}';
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

const rightIdDocumento = async function(documento, params) {

    const sqlDoc = `select first 1 skip 0 DOCUMENTOS_ID from DOCUMENTOS
                             where DOCUMENTOS_NOME like '%${documento}%'`
                             
    const resultDoc = await samosFB.executeSQL(sqlDoc, params);

    return resultDoc[0]['DOCUMENTOS_ID'].toString().slice(-4) || '';
};

const obterSomaMovimentos = async function(sqlWhere, params) {

    let sql = `select sum(MOVIMENTOS_TOTAL) from MOVIMENTOS ${sqlWhere} 
               and (MOVIMENTOS_STATUS <> 'C' and 
                    MOVIMENTOS_STATUS <> 'D' and
                    MOVIMENTOS_STATUS <> 'R')`;
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