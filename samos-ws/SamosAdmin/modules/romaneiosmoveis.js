'use strict';

const utils   = require('../services/samosUtils');
const samosFB = require('../services/samosFB');
const api     = require('../modules');
const moment  = require('moment-timezone');

module.exports = {
    read: async params => {
        try {
            const { empresa, documento, nomedocumento, numero, id, pessoa, inicio, final, ordem, status, start, limit } = params;
            
            let sqlOrder      = '';
            let sqlDocumento  = documento     ? ` and ROMANEIOS_ID_DOCUMENTOS = ${documento}       ` : 
                                nomedocumento ? ` and DOCUMENTOS_NOME         = '${nomedocumento}' ` : '';
            let sqlEmpresa    = empresa   ? ` and ROMANEIOS_ID_EMPRESAS   = ${empresa}   ` : '';
            let sqlWhere      = ` where ROMANEIOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} `;

            if(id > 0) {
                sqlWhere += ` and ROMANEIOS_ID = ${id} `;
                sqlOrder = ` order by ROMANEIOS_ID `;
            } else if(numero > 0) {
                sqlWhere += ` and ROMANEIOS_NUMERO = ${numero} `;
                sqlOrder = ` order by ROMANEIOS_NUMERO `;
            } else {    
                if(pessoa > 0) {
                    sqlWhere += ` and ROMANEIOS_ID_PESSOAS = ${pessoa} `; 
                }

                if(status == 0) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'N' `;
                } else if(status == 1) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'E' `;
                } else if(status == 2) {
                    sqlWhere += ` and ROMANEIOS_STATUS = 'F' `;
                }

                if (inicio && final && inicio.length > 0 && final.length > 0) {
                    sqlWhere += ` and ROMANEIOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
                }
                    
                if(ordem == 0) {
                    sqlOrder = ` order by ROMANEIOS_EMISSAO,ROMANEIOS_NUMERO `;
                } else if (ordem == 1) {
                    sqlOrder = ` order by ROMANEIOS_ID_TRANSPORTES `;
                } else if (ordem == 2) {
                    sqlOrder = ` order by ROMANEIOS_NUMERO `;
                }      
            }
                  
            const sql = `select 
                ${(start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : ''}
                ROMANEIOS.*,
                ROMANEIOS_OBSERVACOES as OBSBRUTA,
                EMPRESAS_FANTASIA,
                EMPRESAS_NOME,
                EMPRESAS_ENDERECO,
                EMPRESAS_NUMERO,
                EMPRESAS_BAIRRO,
                PESSOAS_NOME,
                PESSOAS_TIPO,
                PESSOAS_ENDERECO,
                PESSOAS_BAIRRO,
                PESSOAS_NUMERO,
                PESSOAS_TELEFONE,
                PESSOAS_CELULAR,
                PESSOAS_CPFCNPJ,
                PESSOAS_EMAIL,
                PESSOAS_FORMULA,
                CIDADES_NOME,
                CIDADES_ESTADO,
                USUARIOS_NOME,
                DOCUMENTOS_ID,
                DOCUMENTOS_NOME,
                DOCUMENTOS_LAYOUT          
            from ROMANEIOS 
            left join EMPRESAS on EMPRESAS_ID = ROMANEIOS_ID_EMPRESAS
            left join PESSOAS on PESSOAS_ID = ROMANEIOS_ID_PESSOAS
            left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
            left join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
            left join USUARIOS on USUARIOS_ID = ROMANEIOS_ID_USUARIOS                       
            ${sqlWhere} ${sqlOrder}`; 

            const sqlCount  = `select count(*) from ROMANEIOS 
                left join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
                ${sqlWhere}`;

            const total = await samosFB.count(sqlCount, params);
            const results = await samosFB.executeSQL(sql, params);

            //percorre os romaneios retornados e procura os itens de cada um
            for (let romaneio of results) {
                const sqlItens = `select distinct 
                    ROMANEIOSITENS.*, 
                    MOVIMENTOS_NUMERO, 
                    MOVIMENTOS_SERIE, 
                    MOVIMENTOS_ID_EMPRESAS,
                    MOVIMENTOS_ID_PESSOAS, 
                    MOVIMENTOS_NOME, 
                    MOVIMENTOS_CPFCNPJ,
                    CIDADES_NOME, 
                    CIDADES_ESTADO, 
                    EMPRESAS_FANTASIA,
                    MOVIMENTOS_EMISSAO, 
                    MOVIMENTOS_ENTRADASAIDA, 
                    MOVIMENTOS_IMPOSTO,
                    cast ((
                        select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
                        join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
                        join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
                        where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
                                MOVIMENTOSITENS_CSTPIS <> 'ML'
                    ) as numeric(12,2)) as MONTAGENS_VALOR,                                            
                    MOVIMENTOSITENS_DATAENTREGA, 
                    MOVIMENTOSITENS_HORAENTREGA,
                    MOVIMENTOSITENS_DATAMONTAGEM, 
                    MOVIMENTOSITENS_HORAMONTAGEM
                from ROMANEIOSITENS
                left outer join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOSITENS_ID_MOVIMENTOS
                left outer join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                left outer join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                left outer join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                left outer join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                where ROMANEIOSITENS_ID_ROMANEIOS = ${romaneio['ROMANEIOS_ID']}
                order by ROMANEIOSITENS_ID`

                romaneio['ROMANEIOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);

                if((params.client.toUpperCase() || 'STILOMOVEIS').match(/STILOMOVEIS/)){
                    if(romaneio['ROMANEIOS_ITENS'].length > 0) {
                        romaneio['PEDIDOS_NOME'] = romaneio['ROMANEIOS_ITENS'][0]['MOVIMENTOS_NOME'];
                        romaneio['PEDIDOS_CPFCNPJ'] = romaneio['ROMANEIOS_ITENS'][0]['MOVIMENTOS_CPFCNPJ'];
                    }
                    romaneio['ROMANEIOS_OBSERVACOES'] = (romaneio['OBSBRUTA'] || '').replace(/\\n/g, '\n')
                }                
            }

            return { results, total };
        } catch(error) {
            const msg = 'Falha ao buscar romaneio móveis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    readById: async (id, params) => {
        try {
            const ids = id.split(',');

            let sqlWhere = ` where `;            
    
            if(params.empresa && params.numero && params.serie) {
                sqlWhere += ` ROMANEIOS_ID_EMPRESAS = ${params.empresa} and
                              ROMANEIOS_NUMERO      = ${params.numero}  and
                              ROMANEIOS_SERIE       = '${params.serie}' `;
            } else {
                sqlWhere += ids.map(id => ` ROMANEIOS_ID = '${id}' `).join(' or ');
            }
            
            const sql = `select 
                ROMANEIOS.*,
                ROMANEIOS_OBSERVACOES as OBSBRUTA,
                EMPRESAS_FANTASIA,
                EMPRESAS_NOME,
                EMPRESAS_ENDERECO,
                EMPRESAS_NUMERO,
                EMPRESAS_BAIRRO,
                PESSOAS_NOME,
                PESSOAS_TIPO,
                PESSOAS_CPFCNPJ,
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                PESSOAS_CELULAR,
                PESSOAS_EMAIL,
                PESSOAS_FORMULA,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_CEP,
                PESSOAS_BAIRRO,
                CIDADES_NOME,
                CIDADES_ESTADO,
                USUARIOS_NOME,
                DOCUMENTOS_ID,
                DOCUMENTOS_NOME,
                DOCUMENTOS_LAYOUT
            from ROMANEIOS 
            left join EMPRESAS on EMPRESAS_ID = ROMANEIOS_ID_EMPRESAS
            left join TRANSPORTES on TRANSPORTES_ID = ROMANEIOS_ID_TRANSPORTES
            left join PESSOAS on PESSOAS_ID = ROMANEIOS_ID_PESSOAS
            left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
            left join DOCUMENTOS on DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
            left join USUARIOS on USUARIOS_ID = ROMANEIOS_ID_USUARIOS                       
            ${sqlWhere} 
            order by ROMANEIOS_ID `; 

            const results = await samosFB.executeSQL(sql, params);

            //percorre os romaneios retornados e procura os itens de cada um
            for (let romaneio of results) {
                const sqlItens = `select 
                    ROMANEIOSITENS_ID,
                    ROMANEIOSITENS_ID_MOVIMENTOS,
                    ROMANEIOSITENS_TOTAL,
                    EMPRESAS_FANTASIA,
                    MOVIMENTOS_ID,
                    MOVIMENTOS_ID_PESSOAS,
                    MOVIMENTOS_ID_USUARIOS,
                    MOVIMENTOS_NUMERO,
                    MOVIMENTOS_SERIE,
                    MOVIMENTOS_NOME,
                    MOVIMENTOS_CPFCNPJ,
                    MOVIMENTOS_EMISSAO,
                    MOVIMENTOS_ENTRADASAIDA,
                    MOVIMENTOS_IMPOSTO,
                    MOVIMENTOS_TOTAL,
                    USUARIOS_NOME,
                    PESSOAS_TELEFONE,
                    PESSOAS_CELULAR,
                    PESSOAS_EMAIL,
                    PESSOAS_ENDERECO,
                    PESSOAS_NUMERO,
                    PESSOAS_CEP,
                    PESSOAS_BAIRRO,
                    PESSOAS_OBSERVACOES,
                    CIDADES_NOME,
                    CIDADES_ESTADO             
                from ROMANEIOSITENS
                left join MOVIMENTOS on MOVIMENTOS_ID = ROMANEIOSITENS_ID_MOVIMENTOS
                left join PESSOAS on PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
                left join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
                left join EMPRESAS on EMPRESAS_ID = MOVIMENTOS_ID_EMPRESAS
                left join CIDADES on CIDADES_ID = PESSOAS_ID_CIDADES
                where ROMANEIOSITENS_ID_ROMANEIOS = ${romaneio['ROMANEIOS_ID']}
                order by ROMANEIOSITENS_ID`

                romaneio['ROMANEIOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);
                romaneio['ROMANEIOS_OBSERVACOES'] = romaneio['OBSBRUTA'].replace(/\\n/g, '\n');
            }
            
            return { results };

        } catch(error) {
            const msg = 'Falha ao buscar romaneio móveis por id';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    create: async (romaneio, params) => {
        try {
            const { numero, serie } = await samosFB.ultimoDocto('ROMANEIOS', romaneio, params);

            let totalServico = 0;
            let itemrom;
            let isEntrega = (romaneio['ROMANEIOS_ID_DOCUMENTOS'].toString().slice(-4) == '0010');
            
            const itens = romaneio['ROMANEIOS_ITENS']

            if(params.client.toUpperCase().match(/MOVEIS/)) { // Checa se não houve gravação simultânea concorrente.
                for(let i in itens) {  
                    itemrom = itens[i];
                    const jaLancado = await pedidoJaLancado(itemrom['ROMANEIOSITENS_ID_MOVIMENTOS'], romaneio['ROMANEIOS_ID_DOCUMENTOS'], params);
                    if(jaLancado.length > 0) {
                        throw 'Pedido:  ' + itemrom['MOVIMENTOS_NUMERO'] +  ' Já lançado em outro romaneio';
                    }
                };    
            }

            (romaneio['ROMANEIOS_ITENS'] || []).forEach(item => { // Totaliza novamente o frete pra bater
                totalServico = totalServico + utils.number.cents(item['ROMANEIOSITENS_TOTAL'] || 0);
            });

            romaneio['ROMANEIOS_NUMERO']  = numero;
            romaneio['ROMANEIOS_SERIE']   = serie;
            romaneio['ROMANEIOS_EMISSAO'] = moment.tz(params.timezone).format('YYYY-MM-DD');
            romaneio['ROMANEIOS_HORA']    = moment.tz(params.timezone).format('HH:mm:ss');
            romaneio['ROMANEIOS_FRETE']   = totalServico > 0 ? (totalServico / 100) : romaneio['ROMANEIOS_FRETE'];

            await samosFB.insert('ROMANEIOS', romaneio, params);

            (romaneio['ROMANEIOS_ITENS'] || []).forEach(item => {
                item['ROMANEIOSITENS_ID_ROMANEIOS'] = romaneio['ROMANEIOS_ID'];
                item['ROMANEIOSITENS_ID_ITEM']      = item['ROMANEIOSITENS_ID_ITEM']    || 1;
                item['ROMANEIOSITENS_QUANTIDADE']   = item['ROMANEIOSITENS_QUANTIDADE'] || 1;
                item['ROMANEIOSITENS_TOTAL']        = item['ROMANEIOSITENS_TOTAL']      || 0;
                item['ROMANEIOSITENS_STATUS']       = isEntrega ? 'E' : 'M';
            });

            try {
                await samosFB.insert('ROMANEIOSITENS', romaneio['ROMANEIOS_ITENS'], params);
            } catch(error) {
                //se der erro ao inserir itens tenta apagar o cabecalho
                await samosFB.executeSQL(`delete from ROMANEIOS where ROMANEIOS_ID = ${romaneio['ROMANEIOS_ID']} `, params);
                throw error;
            }

            if(romaneio['ROMANEIOS_ID_EMPRESAS'] == 1) {
                await gerarTransferenciasRomaneio(romaneio['ROMANEIOS_ID'], romaneio['ROMANEIOS_NUMERO'], params);
            }  
            
            if(romaneio['ROMANEIOS_STATUS'] == 'R' && 
               params.client.toUpperCase().match(/STILOMOVEIS/)){  // Retirado na stilo altera a reserva automaticamente
                await atualizaRetirado(itens[0]['ROMANEIOSITENS_ID_MOVIMENTOS'], params);
            }

            return { results: romaneio };
        } catch(error) {
            const msg = 'Falha ao criar romaneio móveis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    update: async (id, romaneio, params) => {
        const itens = romaneio['ROMANEIOS_ITENS'] || [];

        try {

            let totalServico = 0;
            
            (romaneio['ROMANEIOS_ITENS'] || []).forEach(item => { // Recalcular pra tirar diferença de centavos do serviço
                totalServico = totalServico + utils.number.cents(item['ROMANEIOSITENS_TOTAL'] || 0);
            });

            if(totalServico > 0) {
                romaneio['ROMANEIOS_FRETE'] = (totalServico / 100);
            }

            //atualiza o cabecalho
            await samosFB.update(id, 'ROMANEIOS', romaneio, params);
            
            let isEntrega = (romaneio['ROMANEIOS_ID_DOCUMENTOS'].toString().slice(-4) == '0010');

            //se vierem itens...
            if(itens.length > 0) {
                //guarda itens originais (do banco) na memória, para regravar em caso de erro                
                const itensOriginais = await samosFB.executeSQL(`select * from ROMANEIOSITENS where ROMANEIOSITENS_ID_ROMANEIOS = ${id}`, params);
                
                //apaga todos os itens para regravar os que vieram no lugar
                await samosFB.executeSQL(`delete from ROMANEIOSITENS where ROMANEIOSITENS_ID_ROMANEIOS = ${id}`, params);
            
                //atribui o id do cabecalho e outros campos
                itens.map(item => {
                    item['ROMANEIOSITENS_ID_ROMANEIOS'] = id;
                    item['ROMANEIOSITENS_ID_ITEM']      = item['ROMANEIOSITENS_ID_ITEM']    || 1;
                    item['ROMANEIOSITENS_QUANTIDADE']   = item['ROMANEIOSITENS_QUANTIDADE'] || 1;
                    item['ROMANEIOSITENS_TOTAL']        = item['ROMANEIOSITENS_TOTAL']      || 0;
                    item['ROMANEIOSITENS_STATUS']       = isEntrega ? 'E' : 'M';                    
                });
                
                try {
                    //grava os itens
                    await samosFB.insert('ROMANEIOSITENS', romaneio['ROMANEIOS_ITENS'], params);
                } catch(error) {
                    //caso houve erro ao inserir os novos itens
                    //reinsere os itens originais que foram deletados e lanca o erro
                    if(itensOriginais) {
                        await samosFB.insert('ROMANEIOSITENS', itensOriginais, params);
                    }

                    throw error;
                }
            }

            /*
            * Se o romaneio pertence ao CD:
            *
            * 1 - Remove TRE/TRS geradas anteriormente.
            * 2 - Gera novamente as transferências com os itens atuais.
            *
            * Isso evita duplicidade quando o romaneio é regravado.
            */
            if(romaneio['ROMANEIOS_ID_EMPRESAS'] == 1) {

                await removerTransferenciasRomaneio(
                    romaneio['ROMANEIOS_NUMERO'],
                    params
                );

                await gerarTransferenciasRomaneio(
                    id,
                    romaneio['ROMANEIOS_NUMERO'],
                    params
                );
            }            
            
            await utils.dblog(params);    

            return { results: romaneio };
        } catch(error) {
            const msg = 'Falha ao alterar o romaneio móveis';
            console.log(msg);
            console.log(error);

            throw { msg, error };
        }
    },

    delete: async (id, params) => {
        try {

            // Busca os dados do romaneio antes de excluir
            const resultado = await samosFB.executeSQL(`
                select
                    ROMANEIOS_ID,
                    ROMANEIOS_NUMERO,
                    ROMANEIOS_ID_EMPRESAS
                from ROMANEIOS
                where ROMANEIOS_ID = ${id}
            `, params);

            if(resultado.length == 0) {
                throw new Error(`Romaneio ID ${id} não encontrado`);
            }

            const romaneio = resultado[0];

            /*
            * Se for romaneio do CD/empresa 1,
            * remove todas as TRE/TRS vinculadas a ele.
            */
            if(romaneio['ROMANEIOS_ID_EMPRESAS'] == 1) {
                await removerTransferenciasRomaneio(
                    romaneio['ROMANEIOS_NUMERO'],
                    params
                );
            }

            await samosFB.delete(id, 'ROMANEIOS', params);
            await samosFB.delete(id, 'ROMANEIOSITENS', 'ROMANEIOS', params);

            await utils.dblog(params);

        } catch(error) {
            const msg = 'Falha ao deletar romaneio móveis';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    },

    gerarTransferencias: async (id, params) => {
        try {
            const idRomaneio = parseInt(id);

            if(!idRomaneio || idRomaneio <= 0) {
                throw new Error('ID do romaneio inválido');
            }

            // Busca o romaneio pelo ID informado
            const resultado = await samosFB.executeSQL(`
                select
                    ROMANEIOS_ID,
                    ROMANEIOS_NUMERO,
                    ROMANEIOS_ID_EMPRESAS
                from ROMANEIOS
                where ROMANEIOS_ID = ${idRomaneio}
            `, params);

            if(resultado.length == 0) {
                throw new Error(`Romaneio ID ${idRomaneio} não encontrado`);
            }

            const romaneio = resultado[0];

            // As transferências são geradas somente a partir do romaneio do depósito/CD
            if(romaneio['ROMANEIOS_ID_EMPRESAS'] != 1) {
                throw new Error(
                    `O romaneio ${romaneio['ROMANEIOS_NUMERO']} não pertence à empresa 1`
                );
            }

            await gerarTransferenciasRomaneio(
                romaneio['ROMANEIOS_ID'],
                romaneio['ROMANEIOS_NUMERO'],
                params
            );

            return {
                results: {
                    sucesso: true,
                    romaneioId: romaneio['ROMANEIOS_ID'],
                    romaneioNumero: romaneio['ROMANEIOS_NUMERO'],
                    mensagem: 'Transferências geradas com sucesso'
                }
            };

        } catch(error) {
            const msg = 'Falha ao gerar transferências do romaneio';

            console.log(msg);
            console.log(error);

            throw {
                msg,
                error
            };
        }
    }
};

async function gerarTransferenciasRomaneio(idRomaneio, numRomaneio, params) {
    const hoje = moment.tz(params.timezone).format('YYYY-MM-DD');
    
    const transferencias = await getTransferencias(idRomaneio, params);

    if(transferencias.length == 0) { return; }
    
    // Gera as transferências da loja 2 a 9      
    for (let transfEmpresa = 2; transfEmpresa < 10; transfEmpresa++) {
        const transferenciasLoja = transferencias.filter(loja => {
            return loja['MOVIMENTOS_ID_EMPRESAS'] == transfEmpresa;
        });

        if(transferenciasLoja.length > 0) {
            // Passo 1 - Gera a TRE na Loja
            const produtosLoja = await geraProdutos(transferenciasLoja, 800000);
            const totalProdutosLoja = produtosLoja.reduce((tot, produto) => {
                return tot += utils.number.cents(produto['MOVIMENTOSITENS_TOTAL']);
            }, 0) / 100;

            const transferenciaEntrada = {
                'MOVIMENTOS_ID_PESSOAS'      : 1,
                'MOVIMENTOS_NOME'            : 'EDULAR - CD',
                'MOVIMENTOS_SERIE'           : 'TRE',
                'MOVIMENTOS_CPFCNPJ'         : '74398579000200',
                'MOVIMENTOS_EMAIL'           : 'edular@edular.com.br',
                'MOVIMENTOS_ID_EMPRESAS'     : transfEmpresa,
                'MOVIMENTOS_ID_DOCUMENTOS'   : transfEmpresa + '0016',
                'DOCUMENTOS_NOME'            : 'Transferências Entrada',
                'MOVIMENTOS_ID_OPERACOES'    : 800000,
                'MOVIMENTOS_ID_PRAZOS'       : 1,
                'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                'MOVIMENTOS_STATUS'          : 'F',
                'MOVIMENTOS_SITUACAO'        : 0,
                'MOVIMENTOS_PRODUTOS'        : totalProdutosLoja,
                'MOVIMENTOS_TOTAL'           : totalProdutosLoja,
                'MOVIMENTOS_IMPOSTO'         : 0,
                'MOVIMENTOS_FRETE'           : 0,
                'MOVIMENTOS_DESCONTOS'       : 0,
                'MOVIMENTOS_PERCENTUAL'      : 0,
                'MOVIMENTOS_SEGURO'          : 0,
                'MOVIMENTOS_DESPESAS'        : 0,
                'MOVIMENTOS_MARGEM'          : 0,
                'MOVIMENTOS_OBSERVACOES'     : 'ROM: ' + numRomaneio + '|||||||||',
                'MOVIMENTOS_EMISSAO'         : hoje,
                'MOVIMENTOS_ENTRADASAIDA'    : hoje,
                'MOVIMENTOS_ID_EMPRESAORIGEM': 1,                
                'MOVIMENTOS_NUMEROORIGEM'    : numRomaneio,
                'MOVIMENTOS_SERIEORIGEM'     : 'RM',
                'MOVIMENTOS_ITENS'           : produtosLoja
            }

//            await api.movimentos().create(transferenciaEntrada, params); ESSE É O QUE SUBSTITUÍ PELO MAIS DETALHADO ABAIXO...

            // INCLUIDO COMO SUGESTAO DA IA, PARA DESCOBRIR O PROBLEMA COM ITENS NÃO TRANSFERIDOS

            const retornoTRE = await api.movimentos().create(transferenciaEntrada, params);

            const idTRE = retornoTRE.results['MOVIMENTOS_ID'];

            const itensGravadosTRE = await samosFB.executeSQL(`
                select
                    MOVIMENTOSITENS_ID,
                    MOVIMENTOSITENS_ID_PRODUTOS,
                    MOVIMENTOSITENS_QUANTIDADE,
                    MOVIMENTOSITENS_ID_EMPRESAS
                from MOVIMENTOSITENS
                where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idTRE}
                order by MOVIMENTOSITENS_ID
            `, params);

            console.log('==========================================');
            console.log('ROMANEIO:', numRomaneio);
            console.log('FILIAL:', transfEmpresa);
            console.log('TRE:', retornoTRE.results['MOVIMENTOS_NUMERO']);
            console.log('ID TRE:', idTRE);
            console.log('ITENS ENVIADOS:', produtosLoja.length);
            console.log('ITENS GRAVADOS:', itensGravadosTRE.length);

            if(produtosLoja.length != itensGravadosTRE.length) {
                console.log('******** ERRO TRANSFERENCIA ********');

                console.log(
                    'ENVIADOS:',
                    produtosLoja.map(item => ({
                        produto: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                        quantidade: item['MOVIMENTOSITENS_QUANTIDADE'],
                        empresa: item['MOVIMENTOSITENS_ID_EMPRESAS']
                    }))
                );

                console.log(
                    'GRAVADOS:',
                    itensGravadosTRE.map(item => ({
                        id: item['MOVIMENTOSITENS_ID'],
                        produto: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                        quantidade: item['MOVIMENTOSITENS_QUANTIDADE'],
                        empresa: item['MOVIMENTOSITENS_ID_EMPRESAS']
                    }))
                );

                if(itensGravadosTRE.length != produtosLoja.length) {
                    throw new Error(
                        `TRE incompleta. Romaneio ${numRomaneio}, ` +
                        `filial ${transfEmpresa}: ` +
                        `${produtosLoja.length} itens enviados e ` +
                        `${itensGravadosTRE.length} gravados.`
                    );
                }

            }
            // FIM DA SUGESTÃO DA IA

            // Passo 2 - Gera a TRS no CD.     
            const produtosCD = await geraProdutos(transferenciasLoja, 700000);
            const totalProdutosCD = produtosCD.reduce((tot, produto) => {
                return tot += utils.number.cents(produto['MOVIMENTOSITENS_TOTAL']);
            }, 0) / 100;

            const transferenciaSaida = {
                'MOVIMENTOS_ID_PESSOAS'      : transfEmpresa,
                'MOVIMENTOS_NOME'            : produtosCD[0]['EMPRESAS_FANTASIA'],
                'MOVIMENTOS_SERIE'           : 'TRS',                        
                'MOVIMENTOS_CPFCNPJ'         : produtosCD[0]['EMPRESAS_CPFCNPJ'],
                'MOVIMENTOS_EMAIL'           : 'prudenmoveis@prudenmoveis.com.br',
                'MOVIMENTOS_ID_EMPRESAS'     : 1,
                'MOVIMENTOS_ID_DOCUMENTOS'   : '10007',
                'DOCUMENTOS_NOME'            : 'Transferências Saída',
                'MOVIMENTOS_ID_OPERACOES'    : 700000,
                'MOVIMENTOS_ID_PRAZOS'       : 1,
                'MOVIMENTOS_ID_USUARIOS'     : params.userId,
                'MOVIMENTOS_STATUS'          : 'F',
                'MOVIMENTOS_SITUACAO'        : 0,
                'MOVIMENTOS_PRODUTOS'        : totalProdutosCD,
                'MOVIMENTOS_TOTAL'           : totalProdutosCD,
                'MOVIMENTOS_IMPOSTO'         : 0,
                'MOVIMENTOS_FRETE'           : 0,
                'MOVIMENTOS_DESCONTOS'       : 0,
                'MOVIMENTOS_PERCENTUAL'      : 0,
                'MOVIMENTOS_SEGURO'          : 0,
                'MOVIMENTOS_DESPESAS'        : 0,
                'MOVIMENTOS_MARGEM'          : 0,
                'MOVIMENTOS_OBSERVACOES'     : 'ROM: ' + numRomaneio + '|||||||||',
                'MOVIMENTOS_EMISSAO'         : hoje,                        
                'MOVIMENTOS_ENTRADASAIDA'    : hoje,
                'MOVIMENTOS_ID_EMPRESAORIGEM': 1,                
                'MOVIMENTOS_NUMEROORIGEM'    : numRomaneio,
                'MOVIMENTOS_SERIEORIGEM'     : 'RM',                
                'MOVIMENTOS_ITENS'           : produtosCD
            }

            await api.movimentos().create(transferenciaSaida, params);
        }
    }
};

async function getTransferencias(idRomaneio, params) {
    return await samosFB.executeSQL(`select 
        ROMANEIOSITENS_ID, 
        ROMANEIOSITENS_ID_MOVIMENTOS,
        MOVIMENTOSITENS_ID_EMPRESAS, 
        MOVIMENTOSITENS_ID_PRODUTOS, 
        MOVIMENTOS_ID_EMPRESAS,
        MOVIMENTOSITENS_QUANTIDADE, 
        SALDOS_CUSTO, 
        EMPRESAS_FANTASIA, 
        EMPRESAS_CPFCNPJ
    from ROMANEIOSITENS
    join MOVIMENTOS      on MOVIMENTOS_ID                 = ROMANEIOSITENS_ID_MOVIMENTOS   
    join MOVIMENTOSITENS on MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
    join EMPRESAS        on EMPRESAS_ID                   = MOVIMENTOS_ID_EMPRESAS                                             
    join SALDOS          on SALDOS_ID_EMPRESAS            = MOVIMENTOS_ID_EMPRESAS and 
                            SALDOS_ID_PRODUTOS            = MOVIMENTOSITENS_ID_PRODUTOS
    where ROMANEIOSITENS_ID_ROMANEIOS = ${idRomaneio}
    and MOVIMENTOSITENS_ID_EMPRESAS = 1 `, params);
}

async function geraProdutos(transferenciasLoja, operacao) {
    return transferenciasLoja.map((produto, index) => {
        return {
            'MOVIMENTOSITENS_ID'          : (index + 1) * -1,
            'MOVIMENTOSITENS_ID_EMPRESAS' : produto['MOVIMENTOSITENS_ID_EMPRESAS'],
            'EMPRESAS_FANTASIA'           : produto['EMPRESAS_FANTASIA'],
            'EMPRESAS_CPFCNPJ'            : produto['EMPRESAS_CPFCNPJ'],
            'MOVIMENTOSITENS_ID_PRODUTOS' : produto['MOVIMENTOSITENS_ID_PRODUTOS'],
            'MOVIMENTOSITENS_QUANTIDADE'  : produto['MOVIMENTOSITENS_QUANTIDADE'],
            'MOVIMENTOSITENS_PRECO'       : produto['SALDOS_CUSTO'],
            'MOVIMENTOSITENS_CUSTO'       : produto['SALDOS_CUSTO'],
            'MOVIMENTOSITENS_PERCENTUAL'  : 0,
            'MOVIMENTOSITENS_DESCONTOS'   : 0,
            'MOVIMENTOSITENS_FRETE'       : 0,
            'MOVIMENTOSITENS_SEGURO'      : 0,
            'MOVIMENTOSITENS_DESPESAS'    : 0,
            'MOVIMENTOSITENS_IMPOSTO'     : 0,
            'MOVIMENTOSITENS_ENTREGUE'    : 0,
            'MOVIMENTOSITENS_DEPOSITO'    : 0,
            'MOVIMENTOSITENS_IMEDIATA'    : 0,
            'MOVIMENTOSITENS_TOTAL'       : (
                utils.number.cents(produto['SALDOS_CUSTO']) * produto['MOVIMENTOSITENS_QUANTIDADE']
            ) / 100,
            'MOVIMENTOSITENS_ID_OPERACOES': operacao
        }
    })
}

const pedidoJaLancado = async function(idpedido, iddocumento, params) {

    const sql = `select ROMANEIOSITENS_ID_MOVIMENTOS from ROMANEIOSITENS
                   join ROMANEIOS on ROMANEIOS_ID = ROMANEIOSITENS_ID_ROMANEIOS
        where ROMANEIOSITENS_ID_MOVIMENTOS = ${idpedido} and
              ROMANEIOS_ID_DOCUMENTOS = ${iddocumento}`

    return await samosFB.executeSQL(sql, params);
};

const atualizaRetirado = async function(idpedido, params) {

    const sql = `update MOVIMENTOSITENS set MOVIMENTOSITENS_DEPOSITO = 1
                 where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idpedido}`

    return await samosFB.executeSQL(sql, params);
};

async function removerTransferenciasRomaneio(numRomaneio, params) {

    const transferencias = await samosFB.executeSQL(`
        select
            MOVIMENTOS_ID,
            MOVIMENTOS_ID_EMPRESAS,
            MOVIMENTOS_NUMERO,
            MOVIMENTOS_SERIE
        from MOVIMENTOS
        where MOVIMENTOS_ID_EMPRESAORIGEM = 1
          and MOVIMENTOS_NUMEROORIGEM = ${numRomaneio}
          and MOVIMENTOS_SERIEORIGEM = 'RM'
          and MOVIMENTOS_SERIE in ('TRE', 'TRS')
        order by MOVIMENTOS_ID
    `, params);

    if(transferencias.length == 0) {
        return;
    }

    console.log(
        `ROMANEIO ${numRomaneio}: removendo ${transferencias.length} transferência(s) antiga(s)`
    );

    for(const transferencia of transferencias) {

        const idMovimento = transferencia['MOVIMENTOS_ID'];

        console.log(
            `Removendo ${transferencia['MOVIMENTOS_SERIE']} ` +
            `${transferencia['MOVIMENTOS_NUMERO']} ` +
            `(ID ${idMovimento})`
        );

        /*
         * O delete de movimentos utiliza idsProdutos para
         * recalcular os saldos dos produtos envolvidos.
         */
        const produtos = await samosFB.executeSQL(`
            select distinct MOVIMENTOSITENS_ID_PRODUTOS
            from MOVIMENTOSITENS
            where MOVIMENTOSITENS_ID_MOVIMENTOS = ${idMovimento}
        `, params);

        const idsProdutos = produtos
            .map(item => item['MOVIMENTOSITENS_ID_PRODUTOS'])
            .filter(id => !!id)
            .join(',');

        const paramsDelete = {
            ...params,
            empresa: transferencia['MOVIMENTOS_ID_EMPRESAS'],
            idsProdutos
        };

        await api.movimentos().delete(
            idMovimento,
            paramsDelete
        );
    }
}