'use strict';

const samosFB = require('../services/samosFB');

// Função auxiliar para formatar datas DD/MM/YYYY para DD.MM.YYYY do Firebird
const formatDateFB = (dateStr) => {
    if (!dateStr || dateStr === 'Data inválida') return null;
    return dateStr.replace(/\//g, '.');
};

module.exports = {
    read: async params => {
        try {
            const { 
                empresa,
                empresacnpj,
                tipo,
                pesinicio,
                pesfinal,
                porinicio,
                porfinal,
                aplinicio,
                aplfinal,
                cusinicio,
                cusfinal,
                vloinicio,
                vlofinal,
                emiinicio,
                emifinal,
                vctinicio,
                vctfinal,
                paginicio,
                pagfinal,
                database,
                quebra,
                semnn,
                ordem,
                status,
                codprofis,
                nomeprofis,
                documento,
                start,
                limit,
                relirf
            } = params;

            // --- FORMATADOR DE DATAS SEGURO (Variáveis Locais) ---
            let vEmiInicio = formatDateFB(emiinicio);
            let vEmiFinal  = formatDateFB(emifinal);

            let vVctInicio = formatDateFB(vctinicio);
            let vVctFinal  = formatDateFB(vctfinal);

            let vPagInicio = formatDateFB(paginicio);
            let vPagFinal  = formatDateFB(pagfinal);

            let vDatabase  = formatDateFB(database);

            const isMalacrida = (params.client || 'MALACRIDA').toUpperCase() === 'MALACRIDA';
            let sqlPessoa = '';
            let sqlPessoa1 = '';
            let sqlOrder = '';
            let cDatabase = 'N';
            let cStatus = 'FINANCEIROS_STATUS, FINANCEIROS_PAGAMENTO, FINANCEIROS_PAGO, FINANCEIROS_ABERTO';

            let sqlEmpresa = empresa ? `and FINANCEIROS_ID_EMPRESAS = ${empresa} ` : '';
            let sqlDocumento = parseInt(documento || 0) > 0 ? `and right(FINANCEIROS_ID_DOCUMENTOS, 4) = '000${documento}' ` : '';
            let sqlDocumento1 = `and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' `;

            let sqlPortador  = (porinicio && porfinal) ? `and FINANCEIROS_ID_PORTADORES between ${porinicio} and ${porfinal} ` : '';
            let sqlAplicacao = (aplinicio && aplfinal) ? `and FINANCEIROS_ID_APLICACOES between ${aplinicio} and ${aplfinal} ` : '';
            let sqlCusto     = (cusinicio && cusfinal) ? `and FINANCEIROS_ID_CUSTOS between ${cusinicio} and ${cusfinal} ` : '';
            let sqlSemnn     = semnn === 'true' ? ' and ((FINANCEIROS_NOSSONUMERO = 0) or (FINANCEIROS_NOSSONUMERO is null))' : '';
            let sqlProfissio = codprofis ? (isMalacrida ? ` and MOVIMENTOS_ID_USUARIOS = '${codprofis}' ` : ` and MOVIMENTOS_PROTOCOLO = '${codprofis}' `) : '';

            if (pesinicio > 0) {
                sqlPessoa = ` and FINANCEIROS_ID_PESSOAS IN (
                    SELECT P2.PESSOAS_ID
                    FROM PESSOAS P1
                    JOIN PESSOAS P2 ON SUBSTRING(P2.PESSOAS_CPFCNPJ FROM 1 FOR 8) = SUBSTRING(P1.PESSOAS_CPFCNPJ FROM 1 FOR 8)
                    WHERE P1.PESSOAS_ID = ${pesinicio} ) `;

                sqlPessoa1 = ` and MOVIMENTOS_ID_PESSOAS IN (
                    SELECT P2.PESSOAS_ID
                    FROM PESSOAS P1
                    JOIN PESSOAS P2 ON SUBSTRING(P2.PESSOAS_CPFCNPJ FROM 1 FOR 8) = SUBSTRING(P1.PESSOAS_CPFCNPJ FROM 1 FOR 8)
                    WHERE P1.PESSOAS_ID = ${pesinicio} ) `;
            } else {
                sqlPessoa = tipo === 'T' 
                    ? ((pesinicio && pesfinal) ? `and ((FINANCEIROS_ID_PESSOAS = ${pesinicio}) or (FINANCEIROS_ID_PESSOAS = ${pesfinal})) ` : '')
                    : ((pesinicio && pesfinal) ? `and FINANCEIROS_ID_PESSOAS between ${pesinicio} and ${pesfinal} ` : '');
            }

            let sqlWhere1 = `where MOVIMENTOS_ID > 0 and MOVIMENTOS_ID_EMPRESAS = ${empresa} ${sqlPessoa1} `;

            let sqlWhere = `where FINANCEIROS_ID > 0 ${sqlEmpresa} 
                            ${sqlDocumento}
                            ${sqlPessoa} 
                            ${sqlPortador} 
                            ${sqlAplicacao} 
                            ${sqlCusto} 
                            ${sqlSemnn}
                            ${sqlProfissio} `;

            // --- TRATAMENTO DE STATUS E DATA-BASE ---
            if (vDatabase) {
                cDatabase = 'S';
                if (status == 0) { // Somente Abertos na Data-Base
                    sqlWhere += ` and (FINANCEIROS_STATUS = 'A' or (FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO > '${vDatabase}')) `;
                    cStatus = ` 'A' as FINANCEIROS_STATUS, CAST(NULL AS DATE) as FINANCEIROS_PAGAMENTO, 0 as FINANCEIROS_PAGO, FINANCEIROS_ORIGINAL as FINANCEIROS_ABERTO`;
                } else if (status == 1) { // Somente Baixados/Liquidados até a Data-Base
                    sqlWhere += ` and FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO <= '${vDatabase}' `;
                }
            } else {
                if (tipo && tipo !== 'T') {
                    if (status == 0) {
                        sqlWhere += ` and FINANCEIROS_STATUS = 'A' `;
                    } else if (status == 1) {
                        sqlWhere += ` and FINANCEIROS_STATUS = 'P' `;
                    }
                }
            }

            // --- FILTROS DE DATAS DE PERÍODO (CORRIGIDO) ---
            if (relirf === 'true') {
                if (vEmiInicio && vEmiFinal) {
                    sqlWhere += ` and FINANCEIROS_EMISSAO between '${vEmiInicio}' and '${vEmiFinal}' `;
                    sqlWhere += ` and FINANCEIROS_PAGAMENTO between '${vEmiInicio}' and '${vEmiFinal}' `;
                    sqlWhere1 += ` and MOVIMENTOS_EMISSAO between '${vEmiInicio}' and '${vEmiFinal}' `;
                }
                sqlWhere1 += ` AND NOT EXISTS (
                    SELECT 1 FROM FINANCEIROS WHERE FINANCEIROS_ID_MOVIMENTOS = MOVIMENTOS_ID
                ) `;
                sqlWhere1 += ` ${sqlDocumento1} `;
            } else {
                // 1. Filtro de Emissão (Trata intervalar, apenas data limite final ou apenas inicial)
                if (vEmiInicio && vEmiFinal) {
                    sqlWhere += ` and FINANCEIROS_EMISSAO between '${vEmiInicio}' and '${vEmiFinal}' `;
                } else if (vEmiFinal) {
                    // Trata quando emiinicio vem 'Data inválida' e emifinal vem '31/12/2025'
                    sqlWhere += ` and FINANCEIROS_EMISSAO <= '${vEmiFinal}' `;
                } else if (vEmiInicio) {
                    sqlWhere += ` and FINANCEIROS_EMISSAO >= '${vEmiInicio}' `;
                }

                // 2. Filtro de Vencimento
                if (vVctInicio && vVctFinal) {
                    sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${vVctInicio}' and '${vVctFinal}' `;
                } else if (vVctFinal && !vPagInicio) {
                    sqlWhere += ` and FINANCEIROS_VENCIMENTO <= '${vVctFinal}' `;
                } else if (vVctInicio) {
                    sqlWhere += ` and FINANCEIROS_VENCIMENTO >= '${vVctInicio}' `;
                }

                // 3. Filtro de Pagamento
                if (vPagInicio && vPagFinal) {
                    sqlWhere += ` and FINANCEIROS_PAGAMENTO between '${vPagInicio}' and '${vPagFinal}' `;
                } else if (vPagFinal) {
                    sqlWhere += ` and FINANCEIROS_PAGAMENTO <= '${vPagFinal}' `;
                } else if (vPagInicio) {
                    sqlWhere += ` and FINANCEIROS_PAGAMENTO >= '${vPagInicio}' `;
                }
            }

            // Filtro por valor
            if (parseFloat(vloinicio) > 0 && parseFloat(vlofinal) > 0) {
                sqlWhere += ` and FINANCEIROS_ORIGINAL between ${vloinicio} and ${vlofinal} `;
            }

            // Filtro por tipo (R = Receber, P = Pagar)
            if (tipo && tipo !== 'T') {
                sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `;
            }

            if ((params.client || '').match(/biomart|organoplant/ig)) {
                sqlWhere += ` and right(FINANCEIROS_ID_DOCUMENTOS, 4) <> '0002' `;
            }

            // --- ORDENAÇÃO ---
            if (ordem == 0) {
                sqlOrder += ` order by FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 1) {
                sqlOrder += ` order by FINANCEIROS_PAGAMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 2) {
                sqlOrder += ` order by FINANCEIROS_EMISSAO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 3) {
                sqlOrder += ` order by FINANCEIROS_ID_PESSOAS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 4) {
                sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 5) {
                sqlOrder += ` order by FINANCEIROS_ID_PORTADORES, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 6) {
                sqlOrder += ` order by FINANCEIROS_ID_APLICACOES, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 7) {
                sqlOrder += ` order by FINANCEIROS_ID_CUSTOS, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else if (ordem == 8) {
                sqlOrder += ` order by FINANCEIROS_ORIGINAL, FINANCEIROS_VENCIMENTO, FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            } else {
                sqlOrder += ` order by FINANCEIROS_NUMERO, FINANCEIROS_PARCELA `;
            }

            if (relirf === 'true') {
                sqlOrder = '';
            }

            const sqlSearch = `select FINANCEIROS_ID,
                    FINANCEIROS_ID_DOCUMENTOS,
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
                    FINANCEIROS_ID_MOVIMENTOS,
                    FINANCEIROS_ID_USUARIOS,
                    USUARIOS_NOME,
                    USUARIOS_EMAIL,
                    USUARIOS_TELEFONE,
                    USUARIOS_CELULAR,
                    FINANCEIROS_ID_PESSOAS,
                    PESSOAS_CPFCNPJ,
                    PESSOAS_ID_CIDADES,
                    PESSOAS_INSCRICAO,
                    PESSOAS_NOME,
                    PESSOAS_FANTASIA,
                    PESSOAS_ENDERECO,
                    PESSOAS_NUMERO,
                    PESSOAS_BAIRRO,
                    PESSOAS_EMAIL,
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
                    FINANCEIROS_ID_APLICACOES,
                    APLICACOES_NOME,
                    FINANCEIROS_ID_CUSTOS,
                    CUSTOS_NOME,
                    FINANCEIROS_PARCELA,
                    FINANCEIROS_PARCELAS,
                    FINANCEIROS_NOSSONUMERO,
                    FINANCEIROS_EMISSAO,
                    FINANCEIROS_VENCIMENTO,
                    FINANCEIROS_BAIXA,
                    FINANCEIROS_ORIGINAL,
                    FINANCEIROS_ABERTO,
                    FINANCEIROS_DESCONTOS,
                    FINANCEIROS_JUROS,
                    FINANCEIROS_TAXAS,                    
                    FINANCEIROS_TOTAL,
                    FINANCEIROS_OBSERVACOES,
                    ${cStatus},
                    FINANCEIROS_EXPORTADO,
                    FINANCEIROS_LOG,
                    FINANCEIROS_NUMERO,
                    FINANCEIROS_SERIE,
                    FINANCEIROS_ID_EMPRESAORIGEM,
                    FINANCEIROS_NUMEROORIGEM,
                    FINANCEIROS_SERIEORIGEM,
                    iif(FINANCEIROS_STATUS = 'P', FINANCEIROS_PAGAMENTO - FINANCEIROS_VENCIMENTO, FINANCEIROS_VENCIMENTO - CURRENT_DATE) as PRAZOCALCULADO_FINANCEIRO
                from FINANCEIROS
                    left outer join EMPRESAS                    on EMPRESAS_ID                = FINANCEIROS_ID_EMPRESAS
                    left outer join PESSOAS                     on PESSOAS_ID                 = FINANCEIROS_ID_PESSOAS
                    left outer join CIDADES as CIDADESPESSOAS   on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
                    left outer join CIDADES as CIDADESEMPRESAS  on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
                    left outer join PORTADORES                 on PORTADORES_ID              = FINANCEIROS_ID_PORTADORES
                    left outer join APLICACOES                 on APLICACOES_ID              = FINANCEIROS_ID_APLICACOES
                    left outer join CUSTOS                     on CUSTOS_ID                  = FINANCEIROS_ID_CUSTOS
                    left outer join USUARIOS                   on USUARIOS_ID                = FINANCEIROS_ID_USUARIOS
                    left outer join MOVIMENTOS                 on MOVIMENTOS_ID              = FINANCEIROS_ID_MOVIMENTOS
                ${sqlWhere} ${sqlOrder}`;

            let sqlSearch1 = sqlSearch;

            if (relirf === 'true') {
                sqlSearch1 = `select * from (${sqlSearch} UNION ALL 
                SELECT
                 NULL,
                 NULL,
                 'R',
                 1,
                 EMPRESAS_FANTASIA,
                 EMPRESAS_NOME,
                 EMPRESAS_CPFCNPJ,
                 EMPRESAS_TELEFONE,
                 EMPRESAS_ENDERECO,
                 EMPRESAS_NUMERO,
                 EMPRESAS_BAIRRO,
                 CIDADESEMPRESAS.CIDADES_NOME as EMPRESAS_CIDADES,
                 CIDADESEMPRESAS.CIDADES_ESTADO as EMPRESAS_ESTADO,
                 MOVIMENTOS_ID,
                 NULL,
                 NULL,
                 NULL,
                 NULL,
                 NULL,
                 MOVIMENTOS_ID_PESSOAS,
                 PESSOAS_CPFCNPJ,
                 PESSOAS_ID_CIDADES,
                 PESSOAS_INSCRICAO,
                 PESSOAS_NOME,
                 PESSOAS_FANTASIA,
                 PESSOAS_ENDERECO,
                 PESSOAS_NUMERO,
                 PESSOAS_BAIRRO,
                 PESSOAS_EMAIL,
                 PESSOAS_TELEFONE,
                 PESSOAS_CELULAR,
                 PESSOAS_TELEFONECOBRANCA,
                 PESSOAS_CELULARCOBRANCA,
                 PESSOAS_CEP,
                 PESSOAS_CREDITO,
                 CIDADESPESSOAS.CIDADES_NOME,
                 CIDADESPESSOAS.CIDADES_ESTADO,
                 NULL,
                 NULL,
                 NULL,
                 NULL,
                 NULL,
                 NULL,
                 1,
                 1,
                 NULL,
                 MOVIMENTOS_EMISSAO AS FINANCEIROS_EMISSAO,
                 MOVIMENTOS_EMISSAO,
                 MOVIMENTOS_EMISSAO,
                 MOVIMENTOS_EMISSAO,
                 MOVIMENTOS_TOTAL,
                 0,
                 0,
                 0,
                 0,
                 MOVIMENTOS_TOTAL,
                 MOVIMENTOS_TOTAL,
                 'NOTA A VISTA',
                 'P',
                 'N',
                 NULL,
                 MOVIMENTOS_NUMERO,
                 MOVIMENTOS_SERIE,
                 NULL,
                 NULL,
                 NULL,
                 0
             FROM MOVIMENTOS
             LEFT JOIN PESSOAS  ON PESSOAS_ID = MOVIMENTOS_ID_PESSOAS
             left outer join CIDADES as CIDADESPESSOAS  on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
             LEFT JOIN EMPRESAS  ON EMPRESAS_ID = 1
             left outer join CIDADES as CIDADESEMPRESAS on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
             ${sqlWhere1} )
             ORDER BY FINANCEIROS_EMISSAO`;
            }

            const results = await samosFB.executeSQL(sqlSearch1, params);       

            return { results };
        } catch (error) {
            const msg = 'Falha ao buscar financeiros';
            console.log(msg);
            console.log(error);
            throw { msg, error };
        }
    }
};