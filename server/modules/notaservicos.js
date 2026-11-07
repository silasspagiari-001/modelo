'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('.');
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
                notaservicosnome, 
                nfe,
                operacao,
                inicio, 
                final, 
                ordem, 
                status, 
                start, 
                limit,
                userId
            } = params;

            const idDocumento = await rightIdDocumento(nomedocumento, params); // Pega os 4 últimos dígitos do ID documento (para multiempresa)
            const buscaPorComanda = (numero || '').toString().toUpperCase().charAt(0) == 'C';

            const sqlDocumento   = documento   ? `and ORDENS_ID_DOCUMENTOS = ${documento} ` : '';
            const sqlIdDocumento = idDocumento ? `and right(ORDENS_ID_DOCUMENTOS, 4) = '${idDocumento}' ` : '';
            const sqlEmpresa     = empresa     ? `and ORDENS_ID_EMPRESAS   = ${empresa}   ` : '';
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            
            let sqlOrder = '';

            let sqlVendedor = filtravendedor == 'true' ? ` and ORDENS_ID_USUARIOS = ${userId} ` : '';
            let sqlWhere = `where ORDENS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlIdDocumento} ${sqlVendedor}`;
                
            if(operacao) {
                sqlWhere += ` and ORDENS_ID_OPERACOES = ${operacao} `;
            }

            if(numero) {
                if(buscaPorComanda) {
                    sqlWhere += ` and COMANDAS_NUMERO = '${numero.slice(1, Infinity)}' `;
                    sqlOrder = ` order by ORDENS_NFE `;
                } else if(numero.toString().length > 15) {
                    sqlWhere += ` and ORDENS_NFE = '${numero}'`;
                    sqlOrder = ` order by ORDENS_NFE `;
                } else {
                    sqlWhere += ` and ORDENS_NUMERO = ${(numero || '').replace(/\D/ig, '')}`;
                    sqlOrder = ` order by ORDENS_NUMERO `;  
                }
            } else {
                if(pessoa > 0) {
                    sqlWhere += ` and ORDENS_ID_PESSOAS = '${pessoa}' `; 
                } else if(notaservicosnome) {
                    sqlWhere += ` and ORDENS_NOME like '${notaservicosnome}%' `; 
                } else if(nfe) {
                    sqlWhere += ` and ORDENS_NFE = '${nfe}' `; 
                }
                
                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 3) { // Entrada/Saida
                        sqlWhere += ` and ORDENS_FECHAMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else {
                        sqlWhere += ` and ORDENS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(ordem == 0) {
                    sqlOrder = ` order by ORDENS_ID_EMPRESAS,ORDENS_ID_DOCUMENTOS,ORDENS_EMISSAO,ORDENS_ID `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by ORDENS_ID_PESSOAS, ORDENS_ID_EMPRESAS, ORDENS_ID`;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ORDENS_NUMERO `;
                } else if (ordem == 3) {
                    sqlOrder = ` order by ORDENS_FECHAMENTO, ORDENS_ID_EMPRESAS, ORDENS_ID `;
                } else if (ordem == 4) {
                    sqlOrder = ` order by ORDENS_NFE `;                    
                }

                if(status == 0) {//notaservicos sem caixa
                    sqlWhere += ` and ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0)) `; 
                } else if(status == 1) {
                    sqlWhere += ` and (ORDENS_STATUS = 'N' or ORDENS_STATUS = 'M') `; 
                } else if(status == 2) {
                    sqlWhere += ` and (ORDENS_STATUS = 'F' or ORDENS_STATUS = 'E') `; 
                } else if(status == 3) {
                    sqlWhere += ` and (ORDENS_STATUS = 'C' or ORDENS_STATUS = 'B') `; 
                } else if(status == 4) {
                    sqlWhere += ` and ORDENS_STATUS = 'G' `; 
                } else if(status == 5) {
                    sqlWhere += ` and ((ORDENS_NUMEROORIGEM is null) or (ORDENS_NUMEROORIGEM = 0)) `; 
                } else if(status == 7) {
                    sqlWhere += ` and ORDENS_STATUS = 'D' `; 
                } else if(status == 13){
                    sqlWhere += ` and ORDENS_STATUS = 'S' `; 
                } else if(status == 14){
                    sqlWhere += ` and ORDENS_STATUS = 'P' `; 
                } else if(status == 15){
                    sqlWhere += ` and ORDENS_STATUS = 'I' `; 
                } else if(status == 16){
                    sqlWhere += ` and ORDENS_STATUS = 'Q' `; 
                }
            }
                    
            const sqlCount  = `select count(ORDENS_ID) from ORDENS
                    ${
                        buscaPorComanda ? 
                            `left outer join COMANDAS on ORDENS_ID = COMANDAS_ID_ORDENS `
                        : ''
                    }
                ${sqlWhere}`;
                
            const sqlSearch = `
                select ${limits}
                    ORDENS_ID, 
                    ORDENS_ID_EMPRESAS, 
                    ORDENS_ID_DOCUMENTOS,
                    EMPRESAS_ID_CIDADES,
                    ORDENS_ID_PESSOAS,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_FANTASIA,
                    ORDENS_CELULAR,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    ORDENS_NUMERO,
                    ORDENS_SERIE,
                    ORDENS_STATUS,
                    ORDENS_EMISSAO,
                    ORDENS_FECHAMENTO,
                    USUARIOS_LOGIN,
                    ORDENS_NOME,
                    ORDENS_CPFCNPJ,
                    ORDENS_TOTAL,
                    ORDENS_VALORISS,
                    ORDENS_VALORINSS,
                    ORDENS_DESCONTOS,
                    ORDENS_PRODUTOS,
                    ORDENS_SERVICOS,
                    ORDENS_NFE,
                    ORDENS_PROTOCOLO,
                    ORDENS_ID_OPERACOES,
                    ORDENS_NUMEROORIGEM,
                    ORDENS_SERIEORIGEM,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME
                from ORDENS 
                    left join USUARIOS        on USUARIOS_ID   = ORDENS_ID_USUARIOS
                    join EMPRESAS             on EMPRESAS_ID   = ORDENS_ID_EMPRESAS
                    left join PESSOAS         on PESSOAS_ID      = ORDENS_ID_PESSOAS
                    left join CIDADES         on CIDADES_ID      = PESSOAS_ID_CIDADES
                ${sqlWhere} ${sqlOrder}`; 


            const total = await samosFB.count(sqlCount, params);
            const notaservicos = await samosFB.executeSQL(sqlSearch, params);

            return { results: notaservicos, total };

        } catch(error) {
            const msg = 'Falha ao buscar Notas de Serviços';
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
                sqlWhere += ` ORDENS_ID_EMPRESAS = ${params.empresa} and
                              ORDENS_NUMERO      = ${params.numero}  and
                              ORDENS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.reduce((result, id) => {
                    return result += ` ORDENS_ID = '${id}' or `
                }, '').slice(0, -3);
            }

            const sqlOrder = ` order by ORDENS_ID `;
            const sqlSearch = `select distinct
                ORDENS_ID,
                ORDENS_ID_EMPRESAS,
                EMPRESAS_NOME,
                EMPRESAS_ENDERECO,
                EMPRESAS_NUMERO,
                EMPRESAS_BAIRRO,
                EMPRESAS_CEP,
                EMPRESAS_TELEFONE,
                EMPRESAS_EMAIL,
                EMPRESAS_CPFCNPJ,
                EMPRESAS_INSCRICAO,
                EMPRESAS_MUNICIPAL,
                EMPRESAS_SIMPLES,
                EMPRESAS_CERTIFICADO,
                EMPRESAS_SENHA,
                trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
                CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                ORDENS_ID_PESSOAS,
                PESSOAS_NOME,
                PESSOAS_FANTASIA,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_CEP,
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                PESSOAS_CELULAR,
                ORDENS_CELULAR,
                PESSOAS_CREDITO,                
                PESSOAS_TIPO,
                PESSOAS_ID_CIDADES,
                PESSOAS_OBSERVACOES,
                PESSOAS_CPFCNPJ,
                PESSOAS_EMAIL,
                PESSOAS_PAGINA,
                ORDENS_ID_CIDADES,
                ORDENS_IDSKY,
                CIDADES.CIDADES_NOME,
                CIDADES.CIDADES_ESTADO,
                CIDADES.CIDADES_IBGE,
                CIDADESPRESTACAO.CIDADES_NOME as CIDADES_NOMEPRESTACAO,
                CIDADESPRESTACAO.CIDADES_ESTADO as CIDADES_ESTADOPRESTACAO,
                CIDADESPRESTACAO.CIDADES_IBGE as CIDADES_IBGEPRESTACAO,
                CIDADESINCIDENCIA.CIDADES_NOME as CIDADES_NOMEINCIDENCIA,
                CIDADESINCIDENCIA.CIDADES_ESTADO as CIDADES_ESTADOINCIDENCIA,
                CIDADESINCIDENCIA.CIDADES_IBGE as CIDADES_IBGEINCIDENCIA,
                ORDENS_ID_USUARIOS,
                USUARIOS_NOME,
                USUARIOS_LOGIN,
                USUARIOS_CELULAR,
                ORDENS_ID_OPERACOES,
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
                ORDENS_ID_PRAZOS,
                PRAZOS_NOME,
                PRAZOS_PARCELAS,
                PRAZOS_PARCELAMENTO,
                ORDENS_ID_DOCUMENTOS,
                DOCUMENTOSMOVIMENTO.DOCUMENTOS_NOME,
                DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID_PESSOAS,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_ALTERAPRECO) as DOCUMENTOS_ALTERAPRECO,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_DESCONTOITEM) as DOCUMENTOS_DESCONTOITEM,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACARTAO) as DOCUMENTOS_COLETACARTAO,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACHEQUE) as DOCUMENTOS_COLETACHEQUE,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETATRANSPORTE) as DOCUMENTOS_COLETATRANSPORTE,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETAENTREGA) as DOCUMENTOS_COLETAENTREGA,
                trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_LAYOUT) as DOCUMENTOS_LAYOUT,
                ORDENS_NUMERO,
                ORDENS_SERIE,
                ORDENS_EMISSAO,
                ORDENS_HORAEMISSAO,
                ORDENS_FECHAMENTO,
                ORDENS_PRODUTOS,
                ORDENS_SERVICOS,
                ORDENS_DESCONTOS,
                ORDENS_TOTAL,
                ORDENS_ID_EMPRESAORIGEM,
                ORDENS_NUMEROORIGEM,
                ORDENS_SERIEORIGEM,
                ORDENS_NFE,
                ORDENS_PROTOCOLO,
                ORDENS_OBSERVACOES,
                trim(ORDENS_STATUS) as ORDENS_STATUS,
                ORDENS_LOG,
                ORDENS_EMAIL,
                ORDENS_NOME,
                ORDENS_CPFCNPJ,
                ORDENS_ALIQUOTAISS,
                ORDENS_ALIQUOTAINSS,
                ORDENS_VALORISS,
                ORDENS_VALORINSS,
                ORDENS_VALORRETENCOES,
                ORDENS_ISSRETIDO,
                ORDENS_TRIBUTACAO,
                ORDENS_CODIGOSERVICO
            from ORDENS
            left join EMPRESAS                     on EMPRESAS_ID                  = ORDENS_ID_EMPRESAS
            left join PESSOAS                      on PESSOAS_ID                   = ORDENS_ID_PESSOAS
            left join CIDADES                      on CIDADES.CIDADES_ID           = PESSOAS_ID_CIDADES
            left join CIDADES as CIDADESEMPRESA    on CIDADESEMPRESA.CIDADES_ID    = EMPRESAS.EMPRESAS_ID_CIDADES
            left join CIDADES as CIDADESPRESTACAO  on CIDADESPRESTACAO.CIDADES_ID  = ORDENS_ID_CIDADES
            left join CIDADES as CIDADESINCIDENCIA on CIDADESINCIDENCIA.CIDADES_ID = ORDENS_IDSKY
            left join OPERACOES                    on OPERACOES_ID                 = ORDENS_ID_OPERACOES
            left join PRAZOS                       on PRAZOS_ID                    = ORDENS_ID_PRAZOS
            left join DOCUMENTOS DOCUMENTOSMOVIMENTO on DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID = ORDENS_ID_DOCUMENTOS
            left join USUARIOS                     on USUARIOS_ID                  = ORDENS_ID_USUARIOS
            ${sqlWhere} ${sqlOrder}`; 

            const notaservicos = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(notaservicos.map(async notaservico => {
                const sqlItens = `select distinct 
                    ORDENSSERVICOS_ID,
                    ORDENSSERVICOS_ID_ORDENS,
                    ORDENSSERVICOS_ID_SERVICOS,
                    ORDENSSERVICOS_QUANTIDADE,
                    ORDENSSERVICOS_PRECO,
                    ORDENSSERVICOS_PERCENTUAL,
                    ORDENSSERVICOS_DESCONTOS,
                    cast((ORDENSSERVICOS_QUANTIDADE * ORDENSSERVICOS_PRECO) as numeric(12,2)) as ORDENSSERVICOS_TOTAL,
                    ORDENSSERVICOS_ISS,
                    ORDENSSERVICOS_DESCRITIVO,
                    SERVICOS_NOME, 
                    SERVICOS_STATUS,
                    cast(((ORDENSSERVICOS_QUANTIDADE * ORDENSSERVICOS_PRECO) - ORDENSSERVICOS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
                    (iif(ORDENSSERVICOS_QUANTIDADE > 0,cast(((ORDENSSERVICOS_QUANTIDADE * ORDENSSERVICOS_PRECO) - ORDENSSERVICOS_DESCONTOS) as numeric(12,2)) / ORDENSSERVICOS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
                    SERVICOS_PRECO
                from ORDENSSERVICOS
                join ORDENS              on ORDENS_ID   = ORDENSSERVICOS_ID_ORDENS
                left join SERVICOS       on SERVICOS_ID = ORDENSSERVICOS_ID_SERVICOS
                where ORDENSSERVICOS_ID_ORDENS = ${notaservico['ORDENS_ID']} 
                order by ORDENSSERVICOS_ID`;

                notaservico['ORDENS_SERVICOSITENS'] = await samosFB.executeSQL(sqlItens, params);

                const sqlCaixa = `select 
                    MOVIMENTOSCAIXA.*, 
                    PESSOAS_NOME
                from MOVIMENTOSCAIXA
                join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
                where MOVIMENTOSCAIXA_ID_ORDENS = ${notaservico['ORDENS_ID']}`
    
                notaservico['ORDENS_CAIXA'] = await samosFB.executeSQL(sqlCaixa, params);

                const sqlCartoes = `select 
                    CARTOES.*, 
                    OPERADORAS_NOME, 
                    OPERADORAS_AVISTA, 
                    OPERADORAS_PARCELADO
                from CARTOES
                left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
                where CARTOES_ID_ORDENS = ${notaservico['ORDENS_ID']}`;

                notaservico['ORDENS_CARTOES'] = await samosFB.executeSQL(sqlCartoes, params);

                const sqlCheques = `select CHEQUES.*, CIDADES_NOME, CIDADES_ESTADO from CHEQUES 
                    left outer join CIDADES on CIDADES_ID = CHEQUES_ID_CIDADES
                    where CHEQUES_ID_ORDENS = ${notaservico['ORDENS_ID']}`;

                notaservico['ORDENS_CHEQUES'] = await samosFB.executeSQL(sqlCheques, params);

                const sqlFinanceiros = `select 
                    FINANCEIROS.*,
                    PORTADORES_NOME, 
                    PESSOAS_NOME, 
                    PESSOAS_TIPO,
                    (FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
                from FINANCEIROS 
                left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
                left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
                where FINANCEIROS_ID_ORDENS = ${notaservico['ORDENS_ID']}`;

                notaservico['ORDENS_FINANCEIROS'] = await samosFB.executeSQL(sqlFinanceiros, params);
            }));

            return { 
                results: notaservicos, 
                total  : notaservicos.length 
            };

        } catch(error) {
            const msg = 'Falha ao buscar Nota Serviços por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },
    
    create: async (notaservicos, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('ORDENS', notaservicos, params);
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            const hora = moment.tz(params.timezone).format('HH:mm:ss');
            const empresa = notaservicos['ORDENS_ID_EMPRESAS'];

            notaservicos['ORDENS_NUMERO']  = numero;
            notaservicos['ORDENS_SERIE']   = serie;
//          notaservicos['ORDENS_EMISSAO'] = hoje;
//          notaservicos['ORDENS_HORAEMISSAO'] = hora;
            notaservicos['ORDENS_LOG']     = params.userLogin + ' ' + notaservicos['ORDENS_EMISSAO'].split('-').reverse().join('/') + ' ' + notaservicos['ORDENS_HORAEMISSAO'];
            
            (notaservicos['ORDENS_CARTOES'] || []).forEach(cartao => {
                cartao['CARTOES_ORIGEM'] = numero;
                cartao['CARTOES_SERIE']  = serie;
            });

            (notaservicos['ORDENS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_ORIGEM'] = numero;
                cheque['CHEQUES_SERIE']  = serie;
            });

            (notaservicos['ORDENS_FINANCEIROS'] || []).forEach(financeiro => {
                financeiro['FINANCEIROS_EMISSAO']    = hoje;
                financeiro['FINANCEIROS_VENCIMENTO'] = moment(financeiro['FINANCEIROS_VENCIMENTO'] || '1899-12-30').format('YYYY-MM-DD');
                financeiro['FINANCEIROS_NUMERO']     = numero;
                financeiro['FINANCEIROS_SERIE']      = serie;
                financeiro['FINANCEIROS_ID_APLICACOES'] = 1;
            });

            (notaservicos['ORDENS_SERVICOSITENS'] || []).forEach((item, index) => {
                item['ORDENSSERVICOS_PERCENTUAL'] = item['ORDENSSERVICOS_PERCENTUAL'] || 0;
            });

            
            (notaservicos['ORDENS_CAIXA'] || []).forEach(caixa => {
                delete caixa['MOVIMENTOSCAIXA_ID_PORTADORES'];

                caixa['MOVIMENTOSCAIXA_EMISSAO'] = hoje;
                caixa['MOVIMENTOSCAIXA_HORA']    = hora;
                caixa['MOVIMENTOSCAIXA_NOME']    = caixa['MOVIMENTOSCAIXA_NOME']
                    .replace('[NUMERO]', numero)
                    .replace('[SERIE]',  serie);
            });           

            (notaservicos['ORDENS_CARTOES'] || []).forEach(cartao => {
                cartao['CARTOES_EMISSAO'] = hoje;
            });

            (notaservicos['ORDENS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_EMISSAO'] = hoje;
            });

            await samosFB.insert('ORDENS', notaservicos, params);

            (notaservicos['ORDENS_SERVICOSITENS'] || []).forEach(item => {
                item['ORDENSSERVICOS_ID_ORDENS'] = notaservicos['ORDENS_ID'];
            });

            (notaservicos['MOVIMENTOSCAIXA_CAIXA'] || []).forEach(caixa => {
                caixa['MOVIMENTOSCAIXA_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                caixa['MOVIMENTOSCAIXA_LOG']       = notaservicos['ORDENS_LOG'];
                caixa['MOVIMENTOSCAIXA_NOME']      = `${notaservicos['ORDENS_SERIE']} ${notaservicos['ORDENS_NUMERO']} ${notaservicos['ORDENS_NOME']}`.slice(0, 50);
            });

            (notaservicos['ORDENS_CARTOES'] || []).forEach(cartao => {
                cartao['CARTOES_ID_ORDENS'] = notaservicos['ORDENS_ID'];
            });

            (notaservicos['ORDENS_CHEQUES'] || []).forEach(cheque => {
                cheque['CHEQUES_ID_ORDENS'] = notaservicos['ORDENS_ID'];
            });

            (notaservicos['ORDENS_FINANCEIROS'] || []).forEach(financeiro => {
                financeiro['FINANCEIROS_ID_ORDENS'] = notaservicos['ORDENS_ID'];
            });

            try {
                if((notaservicos['ORDENS_SERVICOSITENS'] || []).length > 0) {
                    await samosFB.insert('ORDENSSERVICOS', notaservicos['ORDENS_SERVICOSITENS'], params);
                }
                if((notaservicos['ORDENS_CAIXA'] || []).length > 0) {
                    await samosFB.insert('MOVIMENTOSCAIXA',  notaservicos['ORDENS_CAIXA'], params);
                }
                if((notaservicos['ORDENS_CARTOES'] || []).length > 0) {
                    await samosFB.insert('CARTOES', notaservicos['ORDENS_CARTOES'], params);
                }
                if((notaservicos['ORDENS_CHEQUES'] || []).length > 0) {
                    await samosFB.insert('CHEQUES', notaservicos['ORDENS_CHEQUES'], params);
                }
                if((notaservicos['ORDENS_FINANCEIROS'] || []).length > 0) {
                    await samosFB.insert('FINANCEIROS', notaservicos['ORDENS_FINANCEIROS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from ORDENS       where ORDENS_ID                    = ${notaservicos['ORDENS_ID']};
                        delete from ORDENSSERVICOS  where ORDENSSERVICOS_ID_ORDENS  = ${notaservicos['ORDENS_ID']};
                        delete from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID_ORDENS = ${notaservicos['ORDENS_ID']};
                        delete from CARTOES          where CARTOES_ID_ORDENS        = ${notaservicos['ORDENS_ID']};
                        delete from CHEQUES          where CHEQUES_ID_ORDENS        = ${notaservicos['ORDENS_ID']};
                        delete from FINANCEIROS      where FINANCEIROS_ID_ORDENS    = ${notaservicos['ORDENS_ID']};
                    end
                `, params);

                throw error;
            }
            
            await utils.dblog(params);

            return { results: notaservicos };

        } catch(error) {
            const msg = error.message ? 'Falha ao criar notaservicos' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, notaservicos, params) => {
        const itens       = notaservicos['ORDENS_SERVICOSITENS'];
        const caixa       = notaservicos['ORDENS_CAIXA'];
        const cartoes     = notaservicos['ORDENS_CARTOES'];
        const cheques     = notaservicos['ORDENS_CHEQUES'];
        const financeiros = notaservicos['ORDENS_FINANCEIROS'];

        try {
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

            if(
                (notaservicos['ORDENS_STATUS']       || '').match('F') &&
                (notaservicos['ORDENS_FECHAMENTO'] || '').match('1899')
            ) {
                notaservicos['ORDENS_FECHAMENTO'] = hoje;
            }

            if(notaservicos['ORDENS_PROTOCOLO'] != '' && notaservicos['ORDENS_STATUS'] == 'N') {
                notaservicos['ORDENS_STATUS'] = 'F'
            }

            if(notaservicos['USUARIOS_LOGIN']) {
                notaservicos['ORDENS_LOG'] = notaservicos['USUARIOS_LOGIN'] + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
            }

            (notaservicos['ORDENS_SERVICOSITENS'] || []).forEach((item, index) => {
                item['ORDENSSERVICOS_PERCENTUAL'] = item['ORDENSSERVICOS_PERCENTUAL'] || 0;
            });

            //atualiza o cabecalho
            await samosFB.update(id, 'ORDENS', notaservicos, params);

            //ORDENS_ITENS
            if(itens) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from ORDENSSERVICOS where ORDENSSERVICOS_ID_ORDENS = ${id}`, params);
            
                //atribui o id do cabecalho
                (itens || []).map(item => {
                    item['ORDENSSERVICOS_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                });

                try {
                    //grava os itens
                    if(itens.length > 0) await samosFB.insert('ORDENSSERVICOS', notaservicos['ORDENS_SERVICOSITENS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('ORDENSSERVICOS', itensOriginais, params);
                    }

                    throw error;
                }
            }

            //ORDENS_CAIXA
            if(caixa) {
                const caixaOriginal = await samosFB.executeSQL(`select * from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID_ORDENS = ${id}`, params);
                await samosFB.executeSQL(`delete from MOVIMENTOSCAIXA where MOVIMENTOSCAIXA_ID_ORDENS = ${id}`, params);
            
                (caixa || []).map(item => {
                    item['MOVIMENTOSCAIXA_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                    delete item['MOVIMENTOSCAIXA_ID_PORTADORES']; 
                });
                
                try {
                    if(caixa.length > 0) await samosFB.insert('MOVIMENTOSCAIXA', notaservicos['ORDENS_CAIXA'], params);
                } catch(error) {
                    if(caixaOriginal) {
                        await samosFB.insert('MOVIMENTOSCAIXA', caixaOriginal, params);
                    }

                    throw error;
                }
            }

            //ORDENS_CARTOES
            if(cartoes) {
                const cartoesOriginais = await samosFB.executeSQL(`select * from CARTOES where CARTOES_ID_ORDENS = ${id}`, params);
                await samosFB.executeSQL(`delete from CARTOES where CARTOES_ID_ORDENS = ${id}`, params);
            
                (cartoes || []).map(item => {
                    item['CARTOES_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                });
                
                try {
                    if(cartoes.length > 0) await samosFB.insert('CARTOES', notaservicos['ORDENS_CARTOES'], params);
                } catch(error) {
                    if(cartoesOriginais) {
                        await samosFB.insert('CARTOES', cartoesOriginais, params);
                    }

                    throw error;
                }
            }

            //ORDENS_CHEQUES
            if(cheques) {
                const chequesOriginais = await samosFB.executeSQL(`select * from CHEQUES where CHEQUES_ID_ORDENS = ${id}`, params);
                await samosFB.executeSQL(`delete from CHEQUES where CHEQUES_ID_ORDENS = ${id}`, params);
            
                (cheques || []).map(item => {
                    item['CHEQUES_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                });
                
                try {
                    if(cheques.length > 0) await samosFB.insert('CHEQUES', notaservicos['ORDENS_CHEQUES'], params);
                } catch(error) {
                    if(chequesOriginais) {
                        await samosFB.insert('CHEQUES', chequesOriginais, params);
                    }

                    throw error;
                }
            }

            //ORDENS_FINANCEIROS
            if(financeiros) {

                const financeirosOriginais = await samosFB.executeSQL(`select * from FINANCEIROS where FINANCEIROS_ID_ORDENS = ${id}`, params);

                const semParciais = (financeirosOriginais || []).every(financeiro => { 
                    return financeiro['FINANCEIROS_ABERTO'] == financeiro['FINANCEIROS_ORIGINAL']
                })    

                if(semParciais) {  // Só altera o financeiro se não tiver lançamentos parciais

                    await samosFB.executeSQL(`delete from FINANCEIROS where FINANCEIROS_ID_ORDENS = ${id}`, params);
            
                    (financeiros || []).map(item => {
                        item['FINANCEIROS_ID_ORDENS'] = notaservicos['ORDENS_ID'];
                        item['FINANCEIROS_TIPO'] = notaservicos['OPERACOES_FINANCEIRO'] || item['FINANCEIROS_TIPO'];
                    });
                    
                    try {
                        if(financeiros.length > 0) await samosFB.insert('FINANCEIROS', notaservicos['ORDENS_FINANCEIROS'], params);
    
                    } catch(error) {
                        if(financeirosOriginais) {
                            await samosFB.insert('FINANCEIROS', financeirosOriginais, params);
                        }
    
                        throw error;
                    }    
                }
            }

            const status = notaservicos['ORDENS_STATUS'];

            if(status != 'B' && status != 'M' && status != 'E'){
                await utils.dblog(params);
            }

            return { results: notaservicos };

        } catch(error) {
            const msg = error.message ? 'Falha ao alterar notaservicos' : error;
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {

        console.log('Excluindo id: ', id);

        try {
            const sql = `execute block as
                begin
                    delete from ORDENS           where ORDENS_ID                 = ${id};
                    delete from ORDENSSERVICOS   where ORDENSSERVICOS_ID_ORDENS  = ${id};
                    delete from MOVIMENTOSCAIXA  where MOVIMENTOSCAIXA_ID_ORDENS = ${id};
                    delete from CARTOES          where CARTOES_ID_ORDENS         = ${id};
                    delete from CHEQUES          where CHEQUES_ID_ORDENS         = ${id};
                    delete from FINANCEIROS      where FINANCEIROS_ID_ORDENS     = ${id};
                end;`;
                
            await samosFB.executeSQL(sql, params);
            
            try{
                console.log(
                    'EXCLUSAO NOTA FISCAL SERVIÇOS: ' + 
                    params.log + ' ' + 
                    'Usuario: ' + params.userId + ' - ' + 
                    moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss')
                );
            } catch(error){
                console.log(error)
                console.log('EXCLUSAO NOTA FISCAL SERVIÇOS: ' + id)
            }
                        
            await utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar nota servicos';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};

const rightIdDocumento = async function(documento, params) {
    const sqlDoc = `select first 1 skip 0 DOCUMENTOS_ID from DOCUMENTOS
                             where DOCUMENTOS_NOME like '%${documento}%'`
    const resultDoc = await samosFB.executeSQL(sqlDoc, params);
    return resultDoc[0]['DOCUMENTOS_ID'].toString().slice(-4) || '';
};
