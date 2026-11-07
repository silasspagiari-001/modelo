'use strict';

const samosFB = require('../../services/samosFB');
const api     = require('../');
const utils   = require('../../services/samosUtils');
const cents   = utils.number.cents.bind(utils.number);
const grams   = utils.number.grams.bind(utils.number);

module.exports = {
    read: async params => {
        try {
            let { empresa, conteudo, ordem, status, start, limit } = params;
            const limits    = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
            let sqlWhere    = `where PRODUTOS_ID > 0 `;
            let sqlOrder    = '';
            let usaPromocao = process.env[params.client ? ((params.client || '').toUpperCase() + '_PROMOCAO') : 'PROMOCAO'] == 'TRUE';
            let nomeCliente = (params.client || 'STILOMOVEIS').toLowerCase();
            const cliMoveis = ['prudenmoveis', 'edular', 'stilomoveis'];

            //Se for mobile, ele envia como string, então tratamos aqui
            if( typeof ordem == 'string' ){ ordem = Number( ordem ) };

            if(status != '') {               
                if (cliMoveis.includes(nomeCliente) && status === 'T') { // Ativo da Pruden/Stilo/Edular traz o fora de linha
                    sqlWhere += ` and (PRODUTOS_STATUS = 'T' or PRODUTOS_STATUS = 'L') `;
                } else if(nomeCliente == 'lislais' && status == 'T')  {
                    sqlWhere += ` and (PRODUTOS_STATUS <> 'F' and SALDOS_ESCRITURACAO <> '9') `; // filtra os inativados só na empresa    
                } else if (status == 'T') {
                    sqlWhere += ` and PRODUTOS_STATUS <> 'F' `;
                } else  {
                    sqlWhere += ` and PRODUTOS_STATUS = '${status}' `;
                }    
            }


            if(nomeCliente.match(/prudenmoveis|edular/)) {
                sqlWhere += ` and PRODUTOS_ID_GRUPOS between 1 and 90 `;
            }
            
            if (conteudo && conteudo.substring(0, 1) == '.') {
                sqlWhere += `and PRODUTOS_ID = ${conteudo.replace(/\./ig, '')} `;
            } else if (conteudo && conteudo.substring(0, 1) == '+') {
                sqlWhere += `and PRODUTOS_NOME like  '${conteudo.replace(/\+/ig, '')}%' `;
                sqlOrder = ' order by PRODUTOS_NOME ';
            } else if (conteudo && conteudo.substring(0, 1) == '#') {
                sqlWhere += `and PRODUTOS_BARRA like  '${conteudo.replace(/\#/ig, '%')}%' `;
                sqlOrder = ' order by PRODUTOS_BARRA ';
            } else if (conteudo && conteudo.substring(0, 1) == '@') {
                sqlWhere += `and PRODUTOS_MARCA like  '${conteudo.replace(/\@/ig, '%')}%' `;
                sqlOrder = ' order by PRODUTOS_MARCA ';
            } else if (conteudo && conteudo.substring(0, 1) == '-') {
                sqlWhere += `and PRODUTOS_FABRICA like  '${conteudo.replace(/\-/ig, '%')}%' `;
                sqlOrder = ' order by PRODUTOS_FABRICA ';
            } else if (ordem == 0) {
                sqlWhere += `and PRODUTOS_NOME like '${conteudo}%' `;
                sqlOrder = ' order by PRODUTOS_NOME ';
            } else if (ordem == 1) {
                sqlWhere += `and PRODUTOS_NOME like '%${conteudo}%' `; 
                sqlOrder = ' order by PRODUTOS_NOME ';
            } else if (ordem == 2) {
                sqlWhere += conteudo > 0 ? `and PRODUTOS_ID = '${conteudo}' ` : '';
                sqlOrder = ' order by PRODUTOS_ID ';
            } else if (ordem == 3) {
                const id = await samosFB.buscaMultipla({
                    conteudo,
                    tabela: 'PRODUTOS',
                    chave: 'PRODUTOS_ID',
                    campos: [
                        'PRODUTOS_ID',
                        'PRODUTOS_BARRA',
                        'PRODUTOS_NOME'
                    ]
                }, params);
                sqlWhere += `and PRODUTOS_ID = '${id}' `;
                sqlOrder = ' order by PRODUTOS_ID ';
            } else if (ordem == 4) {
                sqlWhere += ` and PRODUTOS_MARCA like '%${conteudo}%' `;
                sqlOrder = ' order by PRODUTOS_MARCA ';
            } else if (ordem == 5) {
                sqlWhere += ` and PRODUTOS_APLICACAO like '%${conteudo}%' `;
                sqlOrder = ' order by PRODUTOS_APLICACAO, PRODUTOS_NOME ';
            } else if (ordem == 6) {
                sqlWhere += ` and PRODUTOS_FABRICA like '%${conteudo.toUpperCase()}%' `;
                sqlOrder = ' order by PRODUTOS_FABRICA, PRODUTOS_NOME ';

            } else if (ordem == 7) {
                sqlWhere += `and PRODUTOS_NOME like  '%${conteudo.replace('%', '')}%' `;
                //Se for vista
                if( params.tipopreco == 'vista' && nomeCliente != 'stilomoveis'){
                    sqlOrder = ' order by SALDOS_PRECO, PRODUTOS_NOME ';

                }else{
                    sqlOrder = ' order by SALDOS_PRAZO, PRODUTOS_NOME ';
                }
            }

            const sqlIds = `select ${limits} PRODUTOS_ID from PRODUTOS 
                            join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                            ${sqlWhere} ${sqlOrder}`;

            const resultsIds = await samosFB.executeSQL(sqlIds, params);

            await api['processos/atualizasaldo']().create({
                produtos: (resultsIds || []).map(item => item['PRODUTOS_ID']),
                client: params.client
            });

            const sqlPrecoMontagem = nomeCliente.match(/prudenmoveis|edular/) ? ', MONTAGENS_PRECOS' : ''

            const sqlSearch = `select ${limits} 
                PRODUTOS_ID,
                PRODUTOS_ID        as CODIGO,
                PRODUTOS_ID_GRUPOS as GRUPO,
                PRODUTOS_STATUS    as STATUS,
                PRODUTOS_NOME      as NOME,
                PRODUTOS_DESCRICAO as DESCRICAO,
                PRODUTOS_UNIDADE   as UNIDADE,
                PRODUTOS_FABRICA   as FABRICA,
                PRODUTOS_MARCA     as MARCA,
                PRODUTOS_APLICACAO as APLICACAO,
                PRODUTOS_DERIVADO  as DERIVADO,
                EMPRESAS_CNAE      as CNAE,
                SALDOS_LOCAL       as LOCAL,
                SALDOS_PRECO       as PRECO,
                SALDOS_DISPONIVEL  as DISPONIVEL,
                SALDOS_PRAZO       as PRAZO,
                SALDOS_CUSTO       as CUSTO,
                SALDOS_PRECOMINIMO as PRECOMINIMO,
                GRUPOS_NOME        as CLASSE,                       
                MONTAGENS_VALOR    as PRECOMONTAGEM${sqlPrecoMontagem}
            from PRODUTOS
            join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
            join EMPRESAS on EMPRESAS_ID = SALDOS_ID_EMPRESAS
            left outer join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
            left outer join GRUPOS on GRUPOS_ID = PRODUTOS_ID_GRUPOS
            ${sqlWhere} ${sqlOrder}`;
            
            const sqlCount = `select count(*) from PRODUTOS
                              join SALDOS on SALDOS_ID_EMPRESAS = ${empresa} and SALDOS_ID_PRODUTOS = PRODUTOS_ID
                              ${sqlWhere}`;

            const results = await samosFB.executeSQL(sqlSearch, params);
            const total   = await samosFB.count(sqlCount, params);

            await Promise.all(results.map(async produto => {
                const sqlSaldos = `select 
                    SALDOS_DISPONIVEL, 
                    SALDOS_RESERVADO, 
                    SALDOS_COMPRADO, 
                    EMPRESAS_ID, 
                    EMPRESAS_NOME, 
                    EMPRESAS_FANTASIA
                from SALDOS 
                join EMPRESAS on EMPRESAS_ID = SALDOS_ID_EMPRESAS
                where SALDOS_ID_PRODUTOS = ${produto['PRODUTOS_ID']} and EMPRESAS_STATUS = 'T'
                order by EMPRESAS_ID `;

                produto['SALDOS'] = await samosFB.executeSQL(sqlSaldos, params);

                if(nomeCliente.match(/prudenmoveis|edular/)) { // Muda o preço montagem pra tabela definida na empresa
                    const tabelaMontagem = (produto['CNAE'] || '').split('|')[2];
                    let valorMontagem = 0;
                    if(tabelaMontagem == 'A') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[0]};
                    if(tabelaMontagem == 'B') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[1]};
                    if(tabelaMontagem == 'C') { valorMontagem = (produto['MONTAGENS_PRECOS'] || '').split('|')[2]};    
                    produto['PRECOMONTAGEM'] = cents(valorMontagem) / 100;

                    const sqlReservas = `select sum(MOVIMENTOSITENS_ENTREGUE) as QTDE_RESERVADA
                                                from MOVIMENTOSITENS
                                                join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
                                                left outer join ROMANEIOSITENS on ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and ROMANEIOSITENS_STATUS = 'E'
                                                where MOVIMENTOS_STATUS <> 'C' and
                                                    right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0002' and
                                                    MOVIMENTOSITENS_ID_OPERACOES = 500000 and
                                                    MOVIMENTOSITENS_ID_EMPRESAS = 1 and
                                                    ROMANEIOSITENS_ID_MOVIMENTOS is null and
                                                    MOVIMENTOS_EMISSAO >= DATEADD(-4 MONTH TO CURRENT_DATE) and
                                                    MOVIMENTOSITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}`;
                    
                    const resReservas = await samosFB.executeSQL(sqlReservas, params);
                    let qtdeReservada = 0;

                    if(resReservas.length > 0) {
                        qtdeReservada = grams(resReservas[0]['QTDE_RESERVADA'])
                    }

                    produto['SALDOS'][0]['SALDOS_DISPONIVEL'] = (grams(produto['SALDOS'][0]['SALDOS_DISPONIVEL']) - qtdeReservada) / 1000;

                }

                if(usaPromocao) {
                    const sqlPromocoes = `select 
                        PROMOCOES_NOME, 
                        PROMOCOES_VALIDADE, 
                        PROMOCOESITENS_ID, 
                        PROMOCOESITENS_VALOR, 
                        PROMOCOESITENS_VALORA, 
                        PROMOCOESITENS_VALORB, 
                        PROMOCOESITENS_VALORC,                     
                        PROMOCOESITENS_DESCONTO, 
                        PROMOCOESITENS_CUSTOTECNICO,
                        round((100 - (PROMOCOESITENS_VALOR / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADO,
                        round((100 - (PROMOCOESITENS_VALORA / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOA,
                        round((100 - (PROMOCOESITENS_VALORB / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOB,
                        round((100 - (PROMOCOESITENS_VALORC / SALDOS_PRECO) * 100), 3) as DESCONTO_CALCULADOC,
                        PROMOCOESITENS_PARCELAS, 
                        cast((PROMOCOESITENS_INDICE * PROMOCOESITENS_PARCELAS * PROMOCOESITENS_VALOR) as integer) as TOTALPARCELAS_ITENS
                    from PROMOCOESITENS
                    join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
                    left outer join SALDOS   on SALDOS_ID_PRODUTOS = PROMOCOESITENS_ID_PRODUTOS and 
                                                SALDOS_ID_EMPRESAS = ${empresa}
                    where PROMOCOES_STATUS   = 'T'           and
                        PROMOCOES_EMISSAO  <= current_date and
                        PROMOCOES_VALIDADE >= current_date and
                        ${empresa ? ` position('${empresa}', PROMOCOESITENS_EMPRESAS) <> 0 and ` : ''}
                        PROMOCOESITENS_ID_PRODUTOS = ${produto['PRODUTOS_ID']}  `

                    produto['PROMOCOES'] = await samosFB.executeSQL(sqlPromocoes, params);                    
                } else {
                    produto['PROMOCOES'] = [];
                }

                const sqlLotes = `select 
                    LOTES_ID,
                    LOTES_ID_PRODUTOS,
                    PRODUTOS_NOME,
                    LOTES_REFERENCIA,
                    LOTES_FABRICACAO,
                    LOTES_VALIDADE,
                    LOTES_SALDO 
                from LOTES
                join PRODUTOS on PRODUTOS_ID = LOTES_ID_PRODUTOS
                where LOTES_ID_EMPRESAS = ${empresa} and
                      LOTES_STATUS   = 'T'           and
                      LOTES_ID_PRODUTOS = ${produto['PRODUTOS_ID']} 
                order by LOTES_VALIDADE`

                produto['LOTES'] = await samosFB.executeSQL(sqlLotes, params) || [];

            }));

            return { results, total };

        } catch(error) {
            const msg = 'Falha ao consultar preço do produto';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};
