'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const moment  = require('moment-timezone');
const api     = require('.');

module.exports = {
    read: async params => {
        try {
            const { 
                empresa,
                documento,
                numero,
                serie,
                pessoa,
                nomePessoa,
                inicio,
                final,
                ordem,
                status,
                start,
                limit,
                tipo,
                portador,
                banco,
                tipopessoa,
                codprofis
            } = params;            

            const isRacaforte = (params.client || 'RACAFORTE').toUpperCase() == 'RACAFORTE';
            const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlOrder = '';
            let sqlEmpresa   = empresa   ? `and FINANCEIROS_ID_EMPRESAS   = ${empresa} `   : '';
            let sqlDocumento = documento ? `and FINANCEIROS_ID_DOCUMENTOS = ${documento} ` : '';
            let sqlPortador  = portador && banco != 77 ? `and FINANCEIROS_ID_PORTADORES = ${portador} `  : '';
            let sqlPessoa    =  'PESSOAS_NOME';
            let sqlPessoafantasia = 'PESSOAS_FANTASIA'

            if (isRacaforte) {
                sqlPessoa = "PESSOAS_ID || '-' || PESSOAS_NOME AS PESSOAS_NOME";
                sqlPessoafantasia = "PESSOAS_ID || '-' || PESSOAS_FANTASIA AS PESSOAS_FANTASIA";
            }   

            let sqlWhere = `where FINANCEIROS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlPortador}`; 
            if(numero > 0 && ordem != 5 && ordem != 7) {
                sqlWhere += ` and FINANCEIROS_NUMERO = '${numero}' `;
                if(serie) {
                    sqlWhere += ` and FINANCEIROS_SERIE = '${serie}' `;
                }
                if(tipo) {
                    sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
                }                
                if (inicio && final && inicio.length > 0 && final.length > 0 && isRacaforte) {
                    if (ordem == 0) {
                        sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }
                sqlOrder  = ` order by FINANCEIROS_NUMERO, FINANCEIROS_ID `;
            } else {    
                //param pessoa pode ser PESSOAS_ID ou PESSOAS_CPFCNPJ (SEPARAR ISSO)
                if(pessoa > 0) {
                    sqlWhere += ` and FINANCEIROS_ID_PESSOAS = ${pessoa}`; 
                }

                if(nomePessoa) {
                    sqlWhere += ` and PESSOAS_NOME like '%${nomePessoa}%'`;
                }

                //ABERTOS
                if(status == 0) {
                    sqlWhere += ` and FINANCEIROS_STATUS = 'A' `; 

                //PAGOS
                } else if(status == 1) {
                    sqlWhere += ` and FINANCEIROS_STATUS = 'P' `; 

                //INATIVOS
                } else if(status == 2) {
                    sqlWhere += ` and PESSOAS_STATUS = 'F' `; 

                //EXPORTAR (para remessas)
                } else if(status == 3) {
                    sqlWhere += ` and ((FINANCEIROS_EXPORTADO = 'F') or (FINANCEIROS_EXPORTADO = 'E'))
                                  and FINANCEIROS_STATUS      = 'A'
                                  and FINANCEIROS_ABERTO      > 0`; 
                    if(banco == 77) {
                        sqlWhere += ` and FINANCEIROS_NOSSONUMERO = 0`
                    } else {
                        sqlWhere += ` and FINANCEIROS_NOSSONUMERO > 0`
                    }                
                //EXPORTADOS
                } else if(status == 4) {
                    sqlWhere += ` and FINANCEIROS_EXPORTADO = 'T' 
                                  and FINANCEIROS_EMISSAO > '01.11.2018' `; 
                                
                //EMITIDOS (boletos já impressos)
                } else if(status == 5) {
                    sqlWhere += ` and FINANCEIROS_EXPORTADO = 'E' `; 

                //REJEITADOS
                } else if(status == 6) {
                    sqlWhere += ` and FINANCEIROS_EXPORTADO = 'R' `; 

                //BAIXA BANCO
                } else if(status == 7) {
                    sqlWhere += ` and FINANCEIROS_EXPORTADO = 'B' `; 

                //CANCELADOS
                } else if(status == 8) {
                    sqlWhere += ` and FINANCEIROS_STATUS = 'C' `;
                } 

                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    if (ordem == 0 || ordem == 3 || ordem == 4 || ordem == 5) {
                        sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else if(ordem == 1) {
                        sqlWhere += ` and FINANCEIROS_PAGAMENTO  between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    } else if (ordem == 2) {
                        sqlWhere += ` and FINANCEIROS_EMISSAO    between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                    }
                }

                if(tipo) {
                    sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
                }

                if((params.client || '').match(/biomart|organoplant/ig)){
                    sqlWhere += ` and right(FINANCEIROS_ID_DOCUMENTOS, 4) <> '0002' `
                }

                if(tipopessoa && tipo == 'P') {
                    if(tipopessoa == 1) { // 1 - Titulos, 2 - Entregas, 3 - Montagens
                       sqlWhere += ` and PESSOAS_TIPO <> 'C' 
                                     and PESSOAS_TIPO <> 'F'
                                     and PESSOAS_TIPO <> 'N'
                                     and PESSOAS_TIPO <> 'O' `;
                    } else if(tipopessoa == 2) {
                       sqlWhere += ` and ((PESSOAS_TIPO = 'N') or (PESSOAS_TIPO = 'O')) `
                    } else if(tipopessoa == 3) {
                       sqlWhere += ` and ((PESSOAS_TIPO = 'C') or (PESSOAS_TIPO = 'F')) `
                    }
                } else if(tipopessoa && tipo == 'R') {
                    if(tipopessoa == 1) { // 1 - Pessoas, 2 - Empresas, 3 - Financeiras
                        sqlWhere += ` and PESSOAS_TIPO <> 'K' and PESSOAS_TIPO <> 'O' and PESSOAS_TIPO <> 'U' `;
                    } else if(tipopessoa == 2) {
                        sqlWhere += ` and ((PESSOAS_TIPO = 'O') or (PESSOAS_TIPO = 'U')) `;
                    } else if(tipopessoa == 3) {
                        sqlWhere += ` and PESSOAS_TIPO = 'K' `;
                    } 
                }

                if(ordem == 0) {
                    if((params.client || 'racaforte').match(/racaforte/ig)){
                        sqlOrder += ` order by FINANCEIROS_VENCIMENTO, PESSOAS_NOME, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;                        
                    } else {
                        sqlOrder += ` order by FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                    }                        
                } else if (ordem == 1) {
                    sqlOrder += ` order by FINANCEIROS_PAGAMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                } else if (ordem == 2) {
                    sqlOrder += ` order by FINANCEIROS_EMISSAO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                } else if (ordem == 3) {
                    sqlOrder += ` order by FINANCEIROS_ID_PESSOAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                } else if (ordem == 5) {
                    if(numero == ''){
                        sqlWhere += ` and FINANCEIROS_NOSSONUMERO > 0 `;
                    } else {
                        sqlWhere += ` and FINANCEIROS_NOSSONUMERO = '${numero}' `;
                    }
                    sqlOrder  = ` order by FINANCEIROS_NOSSONUMERO, FINANCEIROS_ID `;
                } else if (ordem == 6) {
                    sqlWhere += ` and FINANCEIROS_NOSSONUMERO = 0 `;
                    sqlOrder  = ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                } else if (ordem == 7) { // Valor
                    if(parseInt(numero) > 0) {
                        sqlWhere += ` and FINANCEIROS_ORIGINAL = ${numero.toString().replace(",", ".")}`;
                    }
                    sqlOrder  = ` order by FINANCEIROS_ORIGINAL `;
                } else {
                    sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
                }
            }
            
            const sqlCount  = `select count(*) from FINANCEIROS
                    left outer join PESSOAS on PESSOAS_ID = FINANCEIROS_ID_PESSOAS
                    ${sqlWhere}`;
            
            const sqlSearch = `select ${limits} 
                    FINANCEIROS_ID,
                    FINANCEIROS_TIPO,
                    FINANCEIROS_ID_EMPRESAS,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_NOME,
                    EMPRESAS_CPFCNPJ,
                    EMPRESAS_TELEFONE,
                    EMPRESAS_ENDERECO,
                    EMPRESAS_NUMERO,
                    EMPRESAS_BAIRRO,
                    CIDADESEMPRESAS.CIDADES_NOME as EMPRESAS_CIDADES,
                    CIDADESEMPRESAS.CIDADES_ESTADO as EMPRESAS_ESTADO,
                    FINANCEIROS_ID_DOCUMENTOS,
                    DOCUMENTOS_COLETACARTAO,
                    FINANCEIROS_ID_MOVIMENTOS,
                    FINANCEIROS_ID_ORDENS,
                    FINANCEIROS_ID_USUARIOS,
                    USUARIOS_NOME,
                    USUARIOS_EMAIL,
                    USUARIOS_TELEFONE,
                    USUARIOS_CELULAR,
                    FINANCEIROS_ID_PESSOAS,
                    PESSOAS_CPFCNPJ,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_INSCRICAO,
                    ${sqlPessoa},
                    ${sqlPessoafantasia},
                    PESSOAS_ENDERECO,
                    PESSOAS_NUMERO,
                    PESSOAS_BAIRRO,
                    PESSOAS_EMAIL,
                    PESSOAS_PAGINA,
                    PESSOAS_TELEFONE,
                    PESSOAS_CELULAR,
                    PESSOAS_TELEFONECOBRANCA,
                    PESSOAS_CELULARCOBRANCA,
                    PESSOAS_CEP,
                    PESSOAS_CREDITO,
                    CIDADESPESSOAS.CIDADES_NOME,
                    CIDADESPESSOAS.CIDADES_ESTADO,
                    FINANCEIROS_ID_PORTADORES,
                    PORTADORES_NOME,
                    (BANCOS_NOME || ' ' || case when position('-' in PORTADORES_AGENCIA) > 0 then substring(PORTADORES_AGENCIA from 1 for position('-' in PORTADORES_AGENCIA) -1) else PORTADORES_AGENCIA end || ' ' || PORTADORES_CONTA) as DESCRICAO_PORTADORES,
                    FINANCEIROS_ID_PRAZOS,
                    PRAZOS_NOME,
                    FINANCEIROS_ID_APLICACOES,
                    APLICACOES_NOME,
                    FINANCEIROS_ID_CUSTOS,
                    CUSTOS_NOME,
                    FINANCEIROS_BOLETO,
                    trim(FINANCEIROS_QRCODEPIX) as FINANCEIROS_QRCODEPIX,
                    FINANCEIROS_PARCELA,
                    FINANCEIROS_PARCELAS,
                    FINANCEIROS_NOSSONUMERO,
                    FINANCEIROS_EMISSAO,
                    FINANCEIROS_VENCIMENTO,
                    FINANCEIROS_PAGAMENTO,
                    FINANCEIROS_BAIXA,
                    FINANCEIROS_ORIGINAL,
                    FINANCEIROS_ABERTO,
                    FINANCEIROS_DESCONTOS,
                    FINANCEIROS_JUROS,
                    FINANCEIROS_TAXAS,
                    FINANCEIROS_PAGO,
                    FINANCEIROS_TOTAL,
                    FINANCEIROS_OBSERVACOES,
                    FINANCEIROS_STATUS,
                    FINANCEIROS_EXPORTADO,
                    FINANCEIROS_LOG,
                    FINANCEIROS_NUMERO,
                    FINANCEIROS_SERIE,
                    FINANCEIROS_ID_EMPRESAORIGEM,
                    FINANCEIROS_NUMEROORIGEM,
                    FINANCEIROS_SERIEORIGEM,
                    iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO
                from FINANCEIROS
                    left outer join EMPRESAS                   on EMPRESAS_ID                = FINANCEIROS_ID_EMPRESAS
                    left outer join DOCUMENTOS                 on DOCUMENTOS_ID              = FINANCEIROS_ID_DOCUMENTOS
                    left outer join PRAZOS                     on PRAZOS_ID                  = FINANCEIROS_ID_PRAZOS
                    left outer join PESSOAS                    on PESSOAS_ID                 = FINANCEIROS_ID_PESSOAS
                    left outer join CIDADES as CIDADESPESSOAS  on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESEMPRESAS on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
                    left outer join PORTADORES                 on PORTADORES_ID              = FINANCEIROS_ID_PORTADORES
                    left outer join BANCOS                     on BANCOS_ID                  = PORTADORES_ID_BANCOS
                    left outer join APLICACOES                 on APLICACOES_ID              = FINANCEIROS_ID_APLICACOES
                    left outer join CUSTOS                     on CUSTOS_ID                  = FINANCEIROS_ID_CUSTOS
                    left outer join USUARIOS                   on USUARIOS_ID                = FINANCEIROS_ID_USUARIOS
                    left outer join ORDENS                     on ORDENS_ID                  = FINANCEIROS_ID_ORDENS
                ${sqlWhere} ${sqlOrder}`; 

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sqlSearch, params);

            const { abertos, pagos } = results.length
                ? await obterSomaFinanceiros('T',params)
                : { abertos: 0, pagos: 0 };            

            const somaAbertos = abertos;
            const somaPagos   = pagos;

            await Promise.all(results.map(async financeiro => {
                const sqlItens = `select * from FINANCEIROSITENS
                    where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
                    order by FINANCEIROSITENS_ID`;

                financeiro['FINANCEIROS_ITENS']      = await samosFB.executeSQL(sqlItens, params);
                financeiro['GERALABERTO_FINANCEIRO'] = somaAbertos; // somaAbertos[0]['SUM'];
                financeiro['GERALPAGO_FINANCEIRO']   = somaPagos; // somaPagos[0]['SUM']; 

                if(params.empresacnpj == '04616748000174') {  // Eleve

                    const finObs = financeiro['FINANCEIROS_OBSERVACOES'].split('|') || [];

                    financeiro['NUMERO_OS']         = finObs[0];
                    financeiro['NUMERO_NFE']        = finObs[1];
                    financeiro['OBSERVACAO_TITULO'] = finObs[2];   
                }

            }));

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar financeiros';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        try {
            const ids = id.toString().split(',');
            let sqlWhere = ` where `;

            sqlWhere += ids.reduce((result, id) => {
                return result += ` FINANCEIROS_ID = '${id}' or `
            }, '').slice(0, -3);
            
            const sqlSearch = `select 
                    FINANCEIROS_ID,
                    FINANCEIROS_TIPO,
                    FINANCEIROS_ID_EMPRESAS,
                    EMPRESAS_FANTASIA,
                    EMPRESAS_TELEFONE, 
                    EMPRESAS_CELULAR,
                    EMPRESAS_NOME,
                    EMPRESAS_EMAIL,
                    EMPRESAS_INSCRICAO,
                    EMPRESAS_CPFCNPJ,
                    EMPRESAS_ENDERECO,
                    EMPRESAS_NUMERO,
                    EMPRESAS_BAIRRO,
                    EMPRESAS_CEP,
                    CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                    CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                    CIDADESPESSOA.CIDADES_NOME as PESSOAS_CIDADES,
                    CIDADESPESSOA.CIDADES_ESTADO as PESSOAS_ESTADO,
                    FINANCEIROS_ID_DOCUMENTOS,
                    DOCUMENTOS_COLETACARTAO,
                    FINANCEIROS_ID_MOVIMENTOS,
                    FINANCEIROS_ID_ORDENS,
                    FINANCEIROS_ID_USUARIOS,
                    USUARIOS_NOME,
                    USUARIOS_EMAIL,
                    USUARIOS_TELEFONE,
                    USUARIOS_CELULAR,
                    FINANCEIROS_ID_PESSOAS,
                    PESSOAS_CPFCNPJ,
                    PESSOAS_TIPO,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_INSCRICAO,
                    coalesce(ORDENS_NOME, PESSOAS_NOME) as PESSOAS_NOME,
                    PESSOAS_FANTASIA,
                    PESSOAS_ENDERECO,
                    PESSOAS_ENDERECOCOBRANCA,
                    PESSOAS_BAIRROCOBRANCA,
                    PESSOAS_CEPCOBRANCA,
                    PESSOAS_NUMEROCOBRANCA,
                    PESSOAS_TELEFONECOBRANCA,
                    CIDADESCOBRANCA.CIDADES_NOME as CIDADESCOBRANCA_CIDADE_COBRANCA,
                    CIDADESCOBRANCA.CIDADES_ESTADO as CIDADESCOBRANCA_ESTADO_COBRANCA,
                    PESSOAS_NUMERO,
                    PESSOAS_BAIRRO,
                    PESSOAS_EMAIL,
                    PESSOAS_PAGINA,
                    PESSOAS_TELEFONE,
                    PESSOAS_CELULAR,
                    PESSOAS_CEP,
                    PESSOAS_CREDITO,
                    CIDADES.CIDADES_NOME,
                    CIDADES.CIDADES_ESTADO,
                    MOVIMENTOS_ID_PROPRIEDADES,
                    PROPRIEDADES_CPFCNPJ,
                    PROPRIEDADES_NOME,
                    PROPRIEDADES_CEP,
                    PROPRIEDADES_ENDERECO,
                    PROPRIEDADES_NUMERO,
                    PROPRIEDADES_BAIRRO,
                    PROPRIEDADES_CEP,
                    CIDADESPROPRIEDADE.CIDADES_NOME as CIDADES_NOMEPROPRIEDADE,
                    CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                    FINANCEIROS_ID_PORTADORES,
                    PORTADORES_NOME,
                    PORTADORES_ID_BANCOS,
                    BANCOS_NOME,
                    PORTADORES_AGENCIA,
                    PORTADORES_CONTA,
                    PORTADORES_CONVENIO,
                    PORTADORES_CARTEIRA,
                    PORTADORES_CPFCNPJ,
                    PORTADORES_ENDERECO,
                    PORTADORES_NUMERO,
                    PORTADORES_BAIRRO,
                    PORTADORES_CEP,
                    PORTADORES_PROTESTO,
                    PORTADORES_MORA,
                    PORTADORES_MULTA,
                    CIDADESPORTADOR.CIDADES_NOME as CIDADES_NOMEPORTADOR,
                    CIDADESPORTADOR.CIDADES_ESTADO as CIDADES_ESTADOPORTADOR,
                    FINANCEIROS_ID_PRAZOS,
                    PRAZOS_NOME,
                    FINANCEIROS_ID_APLICACOES,
                    APLICACOES_NOME,
                    FINANCEIROS_ID_CUSTOS,
                    CUSTOS_NOME,
                    FINANCEIROS_PARCELA,
                    FINANCEIROS_PARCELAS,
                    FINANCEIROS_NOSSONUMERO,
                    FINANCEIROS_BOLETO,
                    FINANCEIROS_QRCODEPIX,
                    FINANCEIROS_EMISSAO,
                    FINANCEIROS_VENCIMENTO,
                    FINANCEIROS_PAGAMENTO,
                    FINANCEIROS_BAIXA,
                    FINANCEIROS_ORIGINAL,
                    FINANCEIROS_ABERTO,
                    FINANCEIROS_DESCONTOS,
                    FINANCEIROS_JUROS,
                    FINANCEIROS_TAXAS,
                    FINANCEIROS_PAGO,
                    FINANCEIROS_TOTAL,
                    FINANCEIROS_OBSERVACOES,
                    FINANCEIROS_STATUS,
                    FINANCEIROS_EXPORTADO,
                    FINANCEIROS_LOG,
                    FINANCEIROS_NUMERO,
                    FINANCEIROS_SERIE,
                    FINANCEIROS_ID_EMPRESAORIGEM,
                    FINANCEIROS_NUMEROORIGEM,
                    FINANCEIROS_SERIEORIGEM,
                    iif(FINANCEIROS_STATUS = 'P',FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO,FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO,
                    (FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZOCALCULADO_BOLETO
                from FINANCEIROS
                    left outer join EMPRESAS                      on EMPRESAS_ID                   = FINANCEIROS_ID_EMPRESAS
                    left outer join DOCUMENTOS                    on DOCUMENTOS_ID                 = FINANCEIROS_ID_DOCUMENTOS
                    left outer join PRAZOS                        on PRAZOS_ID                     = FINANCEIROS_ID_PRAZOS
                    left outer join PESSOAS                       on PESSOAS_ID                    = FINANCEIROS_ID_PESSOAS
                    left outer join PORTADORES                    on PORTADORES_ID                 = FINANCEIROS_ID_PORTADORES
                    left outer join MOVIMENTOS                    on MOVIMENTOS_ID                 = FINANCEIROS_ID_MOVIMENTOS
                    left outer join ORDENS                        on ORDENS_ID                     = FINANCEIROS_ID_ORDENS
                    left outer join PROPRIEDADES                  on PROPRIEDADES_ID               = MOVIMENTOS_ID_PROPRIEDADES
                    left outer join BANCOS                        on BANCOS_ID                     = PORTADORES_ID_BANCOS
                    left outer join CIDADES                       on CIDADES.CIDADES_ID            = PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESPESSOA      on CIDADESPESSOA.CIDADES_ID      = PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESPORTADOR    on CIDADESPORTADOR.CIDADES_ID    = PORTADORES_ID_CIDADES
                    left outer join CIDADES as CIDADESEMPRESA     on CIDADESEMPRESA.CIDADES_ID     = EMPRESAS_ID_CIDADES
                    left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES_ID_CIDADES
                    left outer join CIDADES as CIDADESCOBRANCA    on CIDADESCOBRANCA.CIDADES_ID    = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
                    left outer join APLICACOES                    on APLICACOES_ID                 = FINANCEIROS_ID_APLICACOES
                    left outer join CUSTOS                        on CUSTOS_ID                     = FINANCEIROS_ID_CUSTOS
                    left outer join USUARIOS                      on USUARIOS_ID                   = FINANCEIROS_ID_USUARIOS
                ${sqlWhere}
                order by FINANCEIROS_ID_EMPRESAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA  `;

            const results = await samosFB.executeSQL(sqlSearch, params);

            await Promise.all(results.map(async financeiro => {
                const sqlItens = `select 
                    FINANCEIROSITENS.*, 
                    APLICACOES_NOME, 
                    PORTADORES_NOME
                from FINANCEIROSITENS
                left outer join APLICACOES on APLICACOES_ID = FINANCEIROSITENS_ID_APLICACOES
                left outer join PORTADORES on PORTADORES_ID = FINANCEIROSITENS_ID_PORTADORES
                where FINANCEIROSITENS_ID_FINANCEIROS = ${financeiro['FINANCEIROS_ID']} 
                order by FINANCEIROSITENS_ID`;

                financeiro['FINANCEIROS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
                financeiro['FINANCEIROS_OBSERVACOES'] = (financeiro['FINANCEIROS_OBSERVACOES'] || '').replace(/\\n/g, '\n');

                if(financeiro['EMPRESAS_CPFCNPJ'] == '04616748000174') {  // Eleve

                    const finObs = financeiro['FINANCEIROS_OBSERVACOES'].split('|') || [];

                    financeiro['NUMERO_OS']         = finObs[0];
                    financeiro['NUMERO_NFE']        = finObs[1];
                    financeiro['OBSERVACAO_TITULO'] = finObs[2];   
                }

            }));

            return { 
                results, 
                total: results.length 
            };
        } catch(error) {
            const msg = 'Falha ao buscar financeiros por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (financeiro, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('FINANCEIROS', financeiro, params);
            const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
            
            financeiro['FINANCEIROS_EMISSAO']     = financeiro['FINANCEIROS_EMISSAO'] || hoje;
            financeiro['FINANCEIROS_NUMERO']      = financeiro['FINANCEIROS_NUMERO']  || numero;
            financeiro['FINANCEIROS_SERIE']       = financeiro['FINANCEIROS_SERIE']   || serie;

            if(financeiro['NUMERO_OS'] || financeiro['NUMERO_NFE'] || financeiro['OBSERVACAO_TITULO'])  {
                financeiro['FINANCEIROS_OBSERVACOES'] = (financeiro['NUMERO_OS'] || '') + '|' +
                                                        (financeiro['NUMERO_NFE'] || '') + '|' +
                                                        (financeiro['OBSERVACAO_TITULO'] || '')
            }

            await samosFB.insert('FINANCEIROS', financeiro, params);

            (financeiro['FINANCEIROS_ITENS'] || []).forEach(item => {
                item['FINANCEIROSITENS_ID_FINANCEIROS'] = financeiro['FINANCEIROS_ID'];
                item['FINANCEIROSITENS_EMISSAO']        = item['FINANCEIROSITENS_EMISSAO'] || hoje;
            });

            try {
                if((financeiro['FINANCEIROS_ITENS'] || []).length > 0) {
                    await samosFB.insert('FINANCEIROSITENS', financeiro['FINANCEIROS_ITENS'], params);
                }
            
            } catch(error) {
                //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                await samosFB.executeSQL(`execute block as
                    begin
                        delete from FINANCEIROS       where FINANCEIROS_ID                   = ${financeiro['FINANCEIROS_ID']};
                        delete from FINANCEIROSITENS  where FINANCEIROSITENS_ID_FINANCEIROS  = ${financeiro['FINANCEIROS_ID']};
                    end
                `, params);

                throw error;
            }

            await utils.dblog(params);  
            return { results: financeiro };
        } catch(error) {
            const msg = error.message ? 'Falha ao criar financeiro' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, financeiro, params) => {
        const itens = financeiro['FINANCEIROS_ITENS'] || [];

        try {
            financeiro['FINANCEIROS_LOG'] = params.userName + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
            
            if(financeiro['NUMERO_OS'] || financeiro['NUMERO_NFE'] || financeiro['OBSERVACAO_TITULO']) {
                financeiro['FINANCEIROS_OBSERVACOES'] = (financeiro['NUMERO_OS'] || '') + '|' +
                                                        (financeiro['NUMERO_NFE'] || '') + '|' +
                                                        (financeiro['OBSERVACAO_TITULO'] || '')
            }

            await samosFB.update(id, 'FINANCEIROS', financeiro, params);

            const itensOriginais = await samosFB.executeSQL(`select * from FINANCEIROSITENS where FINANCEIROSITENS_ID_FINANCEIROS = ${id}`, params);

            if(itensOriginais.length > 0) {
                await samosFB.executeSQL(`delete from FINANCEIROSITENS where FINANCEIROSITENS_ID_FINANCEIROS = ${id}`, params);
                let paramsOco = params;
                paramsOco.log = `removendo ocorrencias (update) do título: ${financeiro['FINANCEIROS_ID_EMPRESAS']}-${financeiro['FINANCEIROS_NUMERO']}/${financeiro['FINANCEIROS_SERIE']} (ID: ${financeiro['FINANCEIROS_ID']})`;
                await utils.dblog(paramsOco);
            }
            itens.map(item => {
                item['FINANCEIROSITENS_ID_FINANCEIROS'] = id;
            });                
        
            try {
                if(itens.length > 0) {
                    await samosFB.insert('FINANCEIROSITENS', financeiro['FINANCEIROS_ITENS'], params);
                }
            } catch(error) {
                if(itensOriginais) {
                    await samosFB.insert('FINANCEIROSITENS', itensOriginais, params);
                }
                throw error;
            }
            await utils.dblog(params);
            return { results: financeiro };
        } catch(error) {
            const msg = error.message ? 'Falha ao alterar financeiro' : error;
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {
            await samosFB.delete(id, 'FINANCEIROS', params);
            await samosFB.delete(id, 'FINANCEIROSITENS', 'FINANCEIROS', params);
            utils.dblog(params);
        } catch(error) {
            const msg = 'Falha ao deletar financeiro';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    lote: {
        create: async (financeiros, params) => {
            try {

                const { numero, serie } = await samosFB.ultimoDocto('FINANCEIROS', financeiros[0], params);
                const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');

                financeiros.forEach((financeiro, index) => {
                    financeiro['FINANCEIROS_EMISSAO'] = hoje;
                    financeiro['FINANCEIROS_NUMERO']  = financeiro['FINANCEIROS_NUMERO'] || numero;
                    financeiro['FINANCEIROS_SERIE']   = financeiro['FINANCEIROS_SERIE']  || serie;
                });

                await samosFB.insert('FINANCEIROS', financeiros, params);

                await Promise.all(financeiros.map(async financeiro => {
                    (financeiro['FINANCEIROS_ITENS'] || []).forEach(item => {
                        item['FINANCEIROSITENS_ID_FINANCEIROS'] = financeiro['FINANCEIROS_ID'];
                        item['FINANCEIROSITENS_EMISSAO']        = item['FINANCEIROSITENS_EMISSAO'] || hoje;
                    });

                    try {
                        if((financeiro['FINANCEIROS_ITENS'] || []).length > 0) {
                            await samosFB.insert('FINANCEIROSITENS', financeiro['FINANCEIROS_ITENS'], params);
                        }
                    
                    } catch(error) {
                        //se der erro ao inserir itens, tenta apagar tudo que já foi gravado antes de lançar o erro
                        await samosFB.executeSQL(`execute block as
                            begin
                                delete from FINANCEIROS       where FINANCEIROS_ID                   = ${financeiro['FINANCEIROS_ID']};
                                delete from FINANCEIROSITENS  where FINANCEIROSITENS_ID_FINANCEIROS  = ${financeiro['FINANCEIROS_ID']};
                            end
                        `, params);
        
                        throw error;
                    }
                }))
                
                await utils.dblog(params);  

                return { results: financeiros };
            } catch(error) {
                const msg = error.message ? 'Falha ao criar financeiro por lote' : error;
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        },

        update: async (financeiros, params) => {

            try {
                //await samosFB.update('FINANCEIROS', financeiros, params);
                let listaTitulos = `Baixa${financeiros[0]['FINANCEIROS_TIPO']||''}|`;

                /*financeiros.forEach((financeiro) => {
                    if(financeiro['FINANCEIROS_STATUS'] == 'P') {
                        listaTitulos += financeiro['FINANCEIROS_NUMERO'] + '-' + financeiro['FINANCEIROS_PARCELA'] + '|';
                    }
                });*/

                for(let financeiro of financeiros) {
                    await api['financeiros']().update(financeiro['FINANCEIROS_ID'], financeiro, params);
                }
 
                if(listaTitulos.length <= 6) {
                    await utils.dblog(params);
                } else {
                    params.log = listaTitulos;
                    await utils.dblog(params);
                }

                return { results: financeiros };
            } catch(error) {
                const msg = error.message ? 'Falha ao alterar financeiro por lote' : error;
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        },

        delete: async (financeiros, params) => {
            try {
                const ids = financeiros.map(financeiro => financeiro['FINANCEIROS_ID']).join(',');

                await samosFB.delete(ids, 'FINANCEIROS', params);
                await samosFB.delete(ids, 'FINANCEIROSITENS', 'FINANCEIROS', params);
                utils.dblog(params);
            } catch(error) {
                const msg = 'Falha ao deletar financeiros por lote';
                console.log(msg);
                console.log(error);
                throw { msg, error };
            }
        }
    }
};

const obterSomaFinanceiros = async function(status, params) {
    const { empresa, pessoa, documento, portador, numero, ordem, inicio, final, tipo, tipopessoa } = params;
    const sqlEmpresa   = empresa   ? ` and FINANCEIROS_ID_EMPRESAS   = ${empresa}   ` : '';
    const sqlDocumento = documento ? ` and FINANCEIROS_ID_DOCUMENTOS = ${documento} ` : '';
    const sqlPortador  = portador  ? ` and FINANCEIROS_ID_PORTADORES = ${portador}  ` : '';
    let sqlWhere = ` where FINANCEIROS_ID > 0  ${sqlEmpresa} ${sqlDocumento} ${sqlPortador} ` // and FINANCEIROS_STATUS = '${status}' `
    
    if(numero > 0 && ordem != 5) {
        sqlWhere += ` and FINANCEIROS_NUMERO = '${numero}' `;
    } else {    
        if(pessoa > 0) {
            sqlWhere += ` and FINANCEIROS_ID_PESSOAS = ${pessoa} `; 
        }

        if (inicio && final && inicio.length > 0 && final.length > 0) {
            if (ordem == 0 || ordem == 3 || ordem == 4 || ordem == 5) {
                sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            } else if(ordem == 1) {
                sqlWhere += ` and FINANCEIROS_PAGAMENTO  between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            } else if (ordem == 2) {
                sqlWhere += ` and FINANCEIROS_EMISSAO    between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
            }
        }

        if(tipo) {
            sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
        }

        if(tipo == 'P' && tipopessoa) {
            if(tipopessoa == 1) { // 1 - Titulos, 2 - Entregas, 3 - Montagens
                sqlWhere += ` and PESSOAS_TIPO <> 'C' 
                                and PESSOAS_TIPO <> 'F'
                                and PESSOAS_TIPO <> 'N'
                                and PESSOAS_TIPO <> 'O' `;
            } else if(tipopessoa == 2) {
                sqlWhere += ` and ((PESSOAS_TIPO = 'N') or (PESSOAS_TIPO = 'O')) `
            } else if(tipopessoa == 3) {
                sqlWhere += ` and ((PESSOAS_TIPO = 'C') or (PESSOAS_TIPO = 'F')) `
            }
        } else if(tipo == 'R' && tipopessoa) {
            if(tipopessoa == 1) { // 1 - Pessoas, 2 - Financeiras
                sqlWhere += ` and PESSOAS_TIPO <> 'K' `;
            } else if(tipopessoa == 2) {
                sqlWhere += ` and PESSOAS_TIPO = 'K' `;
            }
        }
    }

    if((params.client || '').match(/biomart|organoplant/ig)){
      sqlWhere += ` and right(FINANCEIROS_ID_DOCUMENTOS, 4) <> '0002' `
    }

    let sql = '';

    sql = `SELECT
         SUM(CASE 
             WHEN FINANCEIROS_STATUS = 'A' THEN FINANCEIROS_ABERTO 
               ELSE 0 
             END) AS TOTAL_ABERTO,
         SUM(CASE 
             WHEN FINANCEIROS_STATUS = 'P' THEN FINANCEIROS_PAGO 
                 ELSE 0 
             END) AS TOTAL_PAGO
        FROM FINANCEIROS
        LEFT OUTER JOIN PESSOAS 
            ON PESSOAS_ID = FINANCEIROS_ID_PESSOAS ${sqlWhere} `;

    const result = await samosFB.executeSQL(sql, params);

    return {
        abertos: result?.[0]?.TOTAL_ABERTO ?? 0,
        pagos:   result?.[0]?.TOTAL_PAGO   ?? 0
    };

};
