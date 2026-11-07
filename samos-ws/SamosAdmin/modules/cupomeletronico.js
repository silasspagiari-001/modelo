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
                ordem, 
                status, 
                situacao, 
                start, 
                limit,
                userId
            } = params;

            const idDocumento = await rightIdDocumento(nomedocumento, params); // Pega os 4 últimos dígitos do ID documento (para multiempresa)
            const buscaPorComanda = (numero || '').toString().toUpperCase().charAt(0) == 'C';
            const sqlDocumento   = documento   ? `and MOVIMENTOS_ID_DOCUMENTOS = ${documento} ` : '';
            const sqlIdDocumento = idDocumento ? `and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '${idDocumento}' ` : '';
            const sqlEmpresa     = empresa     ? `and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            
            let sqlOrder = '';

            let sqlVendedor = filtravendedor == 'true' ? ` and MOVIMENTOS_ID_USUARIOS = ${userId} ` : '';
            let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlIdDocumento} ${sqlVendedor}`;
                
            if(operacao) {
                sqlWhere += ` and MOVIMENTOS_ID_OPERACOES = ${operacao} `;
            }

            if(numero) {
                if(buscaPorComanda) {
                    sqlWhere += ` and COMANDAS_NUMERO = '${numero.slice(1, Infinity)}' `;
                    sqlOrder = ` order by MOVIMENTOS_NFE `;
                } else if(numero.toString().length > 15) {
                    sqlWhere += ` and MOVIMENTOS_NFE = '${numero}'`;
                    sqlOrder = ` order by MOVIMENTOS_NFE `;
                } else {
                    sqlWhere += ` and MOVIMENTOS_NUMERO = ${(numero || '').replace(/\D/ig, '')}`;
                    sqlOrder = ` order by MOVIMENTOS_NUMERO `;  
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
                } else if(status == 13){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'S' `; 
                } else if(status == 14){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'P' `; 
                } else if(status == 15){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'I' `; 
                } else if(status == 16){
                    sqlWhere += ` and MOVIMENTOS_STATUS = 'Q' `; 
                }
            }
                    
            const sqlCount  = `select count(MOVIMENTOS_ID) from MOVIMENTOS
                    ${
                        buscaPorComanda ? 
                            `left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
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
                    MOVIMENTOS_DESCONTOS,
                    MOVIMENTOS_PRODUTOS,
                    MOVIMENTOS_NFE,
                    MOVIMENTOS_PROTOCOLO,
                    MOVIMENTOS_ID_OPERACOES,
                    MOVIMENTOS_NUMEROORIGEM,
                    MOVIMENTOS_SERIEORIGEM,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME
                from MOVIMENTOS 
                    left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
                    join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
                    ${
                        buscaPorComanda ? 
                            `left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
                        : ''
                    }
                    left join PESSOAS         on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
                    left join CIDADES         on CIDADES_ID      = PESSOAS_ID_CIDADES
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            const somaMovimentos = (movimentos.length && params.client.toUpperCase().match(/prudenmoveis|stilo/ig)) ? 0 : await obterSomaMovimentos(sqlWhere, params);

            await Promise.all(movimentos.map(async movimento => {
                movimento['TOTAL_MOVIMENTOS'] = somaMovimentos;
            }))

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
            
            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and
                              MOVIMENTOS_NUMERO      = ${params.numero}  and
                              MOVIMENTOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` MOVIMENTOS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const sqlOrder = ` order by MOVIMENTOS_ID `;
            const sqlSearch = `select distinct
                MOVIMENTOS_ID,
                MOVIMENTOS_ID_EMPRESAS,
                EMPRESAS_CPFCNPJ,
                EMPRESAS_INSCRICAO,
                EMPRESAS_SIMPLES,
                EMPRESAS_CERTIFICADO,
                EMPRESAS_SENHA,
                trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
                MOVIMENTOS_ID_PESSOAS,
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
                MOVIMENTOS_ID_USUARIOS,
                USUARIOS_NOME,
                USUARIOS_LOGIN,
                USUARIOS_CELULAR,
                MOVIMENTOS_ID_APLICACOES,
                MOVIMENTOS_ID_CUSTOS,
                MOVIMENTOS_ID_OPERACOES,
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
                MOVIMENTOS_TOTAL,
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
                MOVIMENTOS_IMPOSTO 
            from MOVIMENTOS
            left join EMPRESAS     on EMPRESAS_ID     = MOVIMENTOS_ID_EMPRESAS
            left join PESSOAS      on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
            left join CIDADES      on CIDADES.CIDADES_ID = PESSOAS_ID_CIDADES
            left join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
            left join PRAZOS     on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
            left join DOCUMENTOS DOCUMENTOSMOVIMENTO on DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
            left join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
            ${sqlWhere} ${sqlOrder}`; 

            const movimentos = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(movimentos.map(async movimento => {
                const sqlItens = `select distinct 
                    MOVIMENTOSITENS_ID,
                    MOVIMENTOSITENS_ID_MOVIMENTOS,
                    MOVIMENTOSITENS_ID_OPERACOES,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_PRECO,
                    MOVIMENTOSITENS_CUSTO,
                    MOVIMENTOSITENS_PERCENTUAL,
                    MOVIMENTOSITENS_DESCONTOS,
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL,
                    MOVIMENTOSITENS_IMPOSTO,
                    MOVIMENTOSITENS_CST,
                    MOVIMENTOSITENS_ID_EMPRESAS,
                    MOVIMENTOSITENS_DATAENTREGA,
                    MOVIMENTOSITENS_HORAENTREGA,
                    PRODUTOS_NOME, 
                    PRODUTOS_STATUS,
                    cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as numeric(12,2)) as TOTAL_CUSTO,
                    (iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SALDOS_PRECO, 
                    SALDOS_PRAZO, 
                    SALDOS_DISPONIVEL, 
                    SALDOS_CSTLOCAL, 
                    SALDOS_CSTOUTROS, 
                    SALDOS_LOCAL,
                    SALDOS_ICMSLC, 
                    SALDOS_ICMS01, 
                    SALDOS_ICMS02, 
                    SALDOS_PRECOMINIMO,   
                    SALDOS_PRECOMINIMO as PRECOMINIMO_DB,
                    NCMS_NCM, 
                    NCMS_ALIQUOTANACIONAL,  
                    NCMS_ALIQUOTAESTADUAL,
                    NCMS_ALIQUOTAIMPORTADO, 
                    NCMS_ALIQUOTAMUNICIPAL
                from MOVIMENTOSITENS
                join MOVIMENTOS          on MOVIMENTOS_ID                 = MOVIMENTOSITENS_ID_MOVIMENTOS
                left join PRODUTOS       on PRODUTOS_ID                   = MOVIMENTOSITENS_ID_PRODUTOS
                left join SALDOS         on SALDOS_ID_EMPRESAS            = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
                left outer join NCMS     on NCMS_ID                       = PRODUTOS_ID_NCMS
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
            }));

            return { 
                results: movimentos, 
                total  : movimentos.length 
            };

        } catch(error) {
            const msg = 'Falha ao buscar cupom eletrônico por id';
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
            const empresa = movimento['MOVIMENTOS_ID_EMPRESAS'];

            movimento['MOVIMENTOS_NUMERO']  = numero;
            movimento['MOVIMENTOS_SERIE']   = serie;
            movimento['MOVIMENTOS_EMISSAO'] = hoje;
            movimento['MOVIMENTOS_HORA']    = hora;
            movimento['MOVIMENTOS_LOG']     = params.userLogin + ' ' + movimento['MOVIMENTOS_EMISSAO'].split('-').reverse().join('/') + ' ' + movimento['MOVIMENTOS_HORA'];
            
            if(
                (movimento['MOVIMENTOS_STATUS']       || '').match('F') &&
                (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')
            ) {
                movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
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

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {
                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
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

            await samosFB.insert('MOVIMENTOS', movimento, params);

            (movimento['MOVIMENTOS_ITENS'] || []).forEach(item => {
                item['MOVIMENTOSITENS_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
            });

            (movimento['MOVIMENTOS_CAIXA'] || []).forEach(caixa => {
                caixa['MOVIMENTOSCAIXA_ID_MOVIMENTOS'] = movimento['MOVIMENTOS_ID'];
                caixa['MOVIMENTOSCAIXA_LOG']           = movimento['MOVIMENTOS_LOG'];
                caixa['MOVIMENTOSCAIXA_NOME']          = `${movimento['MOVIMENTOS_SERIE']} ${movimento['MOVIMENTOS_NUMERO']} ${movimento['MOVIMENTOS_NOME']}`.slice(0, 50);
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

            try {
                if((movimento['MOVIMENTOS_ITENS'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSITENS', movimento['MOVIMENTOS_ITENS'], params);
                }
                if((movimento['MOVIMENTOS_CAIXA'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSCAIXA',  movimento['MOVIMENTOS_CAIXA'], params);
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
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from MOVIMENTOS       where MOVIMENTOS_ID                  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSITENS  where MOVIMENTOSITENS_ID_MOVIMENTOS  = ${movimento['MOVIMENTOS_ID']};
                        delete from MOVIMENTOSCAIXA  where MOVIMENTOSCAIXA_ID_MOVIMENTOS  = ${movimento['MOVIMENTOS_ID']};
                        delete from CARTOES          where CARTOES_ID_MOVIMENTOS          = ${movimento['MOVIMENTOS_ID']};
                        delete from CHEQUES          where CHEQUES_ID_MOVIMENTOS          = ${movimento['MOVIMENTOS_ID']};
                        delete from FINANCEIROS      where FINANCEIROS_ID_MOVIMENTOS      = ${movimento['MOVIMENTOS_ID']};
                    end
                `, params);

                throw error;
            }

            //COMANDA_NUMERO
            if(movimento['COMANDA_NUMERO']) {
                const queryComanda = await samosFB.executeSQL(`select COMANDAS_ID from COMANDAS where COMANDAS_NUMERO = '${movimento['COMANDA_NUMERO']}'`, params)
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
            
            api['processos/atualizasaldo']().create({
                empresa : empresa,
                produtos: (movimento['MOVIMENTOS_ITENS'] || []).map(item => item['MOVIMENTOSITENS_ID_PRODUTOS']),
                client  : params.client
            });

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
        const cartoes     = movimento['MOVIMENTOS_CARTOES'];
        const cheques     = movimento['MOVIMENTOS_CHEQUES'];
        const financeiros = movimento['MOVIMENTOS_FINANCEIROS'];

        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

            if(
                (movimento['MOVIMENTOS_STATUS']       || '').match('F') &&
                (movimento['MOVIMENTOS_ENTRADASAIDA'] || '').match('1899')
            ) {
                movimento['MOVIMENTOS_ENTRADASAIDA'] = hoje;
            }

            if(movimento['USUARIOS_LOGIN']) {
                movimento['MOVIMENTOS_LOG'] = movimento['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
            }

            (movimento['MOVIMENTOS_ITENS'] || []).forEach((item, index) => {
                item['MOVIMENTOSITENS_PERCENTUAL'] = item['MOVIMENTOSITENS_PERCENTUAL'] || 0;
            });

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
                        item['FINANCEIROS_TIPO'] = movimento['OPERACOES_FINANCEIRO'] || item['FINANCEIROS_TIPO'];
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

            const status = movimento['MOVIMENTOS_STATUS'];

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
                end;`;
                
            await limparOrigem(id, params);
            await samosFB.executeSQL(sql, params);
            
            try{
                console.log(
                    'EXCLUSAO CUPOM ELETRONICO: ' + 
                    params.log + ' ' + 
                    'Usuario: ' + params.userId + ' - ' + 
                    moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                );
            } catch(error){
                console.log(error)
                console.log('EXCLUSAO CUPOM ELETRONICO: ' + id)
            }
                        
            await api['processos/atualizasaldo']().create({
                empresa : params.empresa,
                produtos: (params.idsProdutos || '').split(',').filter(id => !!id),
                client  : params.client
            });

            await utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar movimentos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
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

const rightIdDocumento = async function(documento, params) {
    const sqlDoc = `select first 1 skip 0 DOCUMENTOS_ID from DOCUMENTOS
                             where DOCUMENTOS_NOME like '%${documento}%'`
                             
    const resultDoc = await samosFB.executeSQL(sqlDoc, params);
    return resultDoc[0]['DOCUMENTOS_ID'].toString().slice(-4) || '';
};

const obterSomaMovimentos = async function(sqlWhere, params) {
    const sql = `select sum(MOVIMENTOS_TOTAL) from MOVIMENTOS ${sqlWhere} 
               and (MOVIMENTOS_STATUS <> 'C' and MOVIMENTOS_STATUS <> 'D')`;
    const result = await samosFB.executeSQL(sql, params);
  
    return result[0]['SUM']
};