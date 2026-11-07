'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    readById: (id, params) => {//pode ser um id ou uma lista de ids separada por vírgula
        return new Promise(async (resolve, reject) => {
            const db = await samosFB.conectarBanco(params.client);
            const ids = id.split(',');
            let sqlWhere = ` where `;
            
            sqlWhere += ids.reduce((result, id) => {
                return result += ` MOVIMENTOSCARTAS_ID = '${id}' or `
            }, '').slice(0, -3);

            const sqlOrder = ` order by MOVIMENTOSCARTAS_ID `;
            const sqlSearch = `select
                MOVIMENTOSCARTAS.*,
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
                CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
                CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
                trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
                EMPRESAS_TELEFONE,
                EMPRESAS_EMAIL,
                EMPRESAS_PAGINA,
                MOVIMENTOS_ID_PESSOAS,
                PESSOAS_ENDERECO,
                PESSOAS_NUMERO,
                PESSOAS_BAIRRO,
                PESSOAS_CEP,
                PESSOAS_CPFCNPJ, 
                PESSOAS_INSCRICAO,
                PESSOAS_TELEFONE,
                MOVIMENTOS_CELULAR,
                PESSOAS_ID_CIDADES,
                PESSOAS_OBSERVACOES,
                CIDADES.CIDADES_NOME,
                CIDADES.CIDADES_ESTADO,
                CIDADES.CIDADES_IBGE,
                CIDADESPROPRIEDADE.CIDADES_NOME   as CIDADES_NOMEPROPRIEDADE,
                CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
                CIDADESPROPRIEDADE.CIDADES_IBGE   as CIDADES_IBGEPROPRIEDADE,
                MOVIMENTOS_ID_OPERACOES,
                OPERACOES_NOME,
                MOVIMENTOS_NUMERO,
                MOVIMENTOS_SERIE,
                MOVIMENTOS_EMISSAO,
                MOVIMENTOS_HORA,
                MOVIMENTOS_ENTRADASAIDA,
                MOVIMENTOS_NFE,
                MOVIMENTOS_PROTOCOLO,
                MOVIMENTOS_LOG,
                MOVIMENTOS_EMAIL,
                MOVIMENTOS_NOME,
                MOVIMENTOS_CPFCNPJ,
                MOVIMENTOS_ID_PROPRIEDADES,
                PROPRIEDADES_CPFCNPJ,
                PROPRIEDADES_INSCRICAO,
                PROPRIEDADES_NOME,
                PROPRIEDADES_ENDERECO,
                PROPRIEDADES_NUMERO,
                PROPRIEDADES_CEP,
                PROPRIEDADES_BAIRRO,
                PROPRIEDADES_TELEFONE,
                PROPRIEDADES_CELULAR

            from MOVIMENTOSCARTAS
            left join MOVIMENTOS   on MOVIMENTOS_ID    = MOVIMENTOSCARTAS_ID_MOVIMENTOS
            left join EMPRESAS     on EMPRESAS_ID      = MOVIMENTOS_ID_EMPRESAS
            left join PESSOAS      on PESSOAS_ID       = MOVIMENTOS_ID_PESSOAS
            left join PROPRIEDADES on PROPRIEDADES_ID  = MOVIMENTOS_ID_PROPRIEDADES
            left join CIDADES      on CIDADES.CIDADES_ID = PESSOAS_ID_CIDADES
            left join CIDADES as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS.EMPRESAS_ID_CIDADES
            left join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES            
            left join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
            
            ${sqlWhere} ${sqlOrder}`; 

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: 1, resolve, reject});
                }
            });
        });
    },

};