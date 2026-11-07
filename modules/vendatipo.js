'use strict';

const samosFB = require('../services/samosFirebird');

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
            const { empresa, inicio, final, maquinas} = params;
            const db = await samosFB.conectarBanco(params.client);

            let arrMaquinas = maquinas.split(',');
            let sqlWhere = '';
            let sqlSearch = '';
            let idMaquina01 = arrMaquinas[0] ? arrMaquinas[0] : '';
            let idMaquina02 = arrMaquinas[1] ? arrMaquinas[1] : '';
            let idMaquina03 = arrMaquinas[2] ? arrMaquinas[2] : '';
            let idMaquina04 = arrMaquinas[3] ? arrMaquinas[3] : '';
            let idMaquina05 = arrMaquinas[4] ? arrMaquinas[4] : '';


            if(empresa > 0) {
                sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
            }

            if(params.log.toUpperCase().match(/PRUDENMOVEIS|EDULAR/)) {
                sqlSearch = `select MOVIMENTOSCAIXA_ID_EMPRESAS as MOVIMENTOS_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO as MOVIMENTOS_EMISSAO,
                                count(*) as MOVIMENTOS_QUANTIDADE,
                                sum(MOVIMENTOSCAIXA_DINHEIRO) as MOVIMENTOS_DINHEIRO,
                                sum(MOVIMENTOSCAIXA_TRANSFERENCIAS) as MOVIMENTOS_TRANSFERENCIA,
                                sum(MOVIMENTOSCAIXA_CHEQUE) as MOVIMENTOS_CHEQUE,
                                sum(MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO) as MOVIMENTOS_CARTOES,
                                sum(MOVIMENTOSCAIXA_DUPLICATA) as MOVIMENTOS_DUPLICATA,
                                sum(MOVIMENTOSCAIXA_OUTRO) as MOVIMENTOS_FINANCEIRA
                        from MOVIMENTOSCAIXA
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                        where ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                                    right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0002' and
                        MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                        ${sqlWhere}
                        group by MOVIMENTOSCAIXA_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO
                        order by MOVIMENTOSCAIXA_ID_EMPRESAS, MOVIMENTOSCAIXA_EMISSAO`                       
            } else {
                sqlSearch = `select MOVIMENTOSCAIXA_EMISSAO as MOVIMENTOS_EMISSAO, 
                                sum(MOVIMENTOSCAIXA_DINHEIRO) as MOVIMENTOS_DINHEIRO,
                                sum(MOVIMENTOSCAIXA_TRANSFERENCIAS) as MOVIMENTOS_TRANSFERENCIA,
                                sum(MOVIMENTOSCAIXA_CHEQUE) as MOVIMENTOS_CHEQUE,
                                coalesce((select sum(CHEQUES_VALOR) from CHEQUES where CHEQUES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CHEQUES_EMISSAO <> CHEQUES_VENCIMENTO), 0) as MOVIMENTOS_CHEQUEPRAZO,
                                coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina01}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES01,
                                coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina02}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES02,
                                coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina03}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES03,
                                coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina04}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES04,                                
                                coalesce((select sum(CARTOES_VALOR) from CARTOES where CARTOES_EMISSAO = MOVIMENTOSCAIXA_EMISSAO and CARTOES_CONVENIO = '${idMaquina05}' and ((CARTOES_SERIE = 'PE') or (CARTOES_SERIE = 'PV'))), 0) as MOVIMENTOS_CARTOES05,
                                sum(MOVIMENTOSCAIXA_CREDITO + MOVIMENTOSCAIXA_DEBITO) as MOVIMENTOS_CARTOES,
                                sum(MOVIMENTOSCAIXA_DUPLICATA) as MOVIMENTOS_DUPLICATA, 
                                sum(case when (((FINANCEIROS_ID_PESSOAS = 98) or (FINANCEIROS_ID_PESSOAS = 21949))
                                and MOVIMENTOSCAIXA_OUTRO > 0) then MOVIMENTOSCAIXA_OUTRO ELSE 0 END) MOVIMENTOS_FINANCEIRA01,
                                sum(case when (FINANCEIROS_ID_PESSOAS = 99
                                and MOVIMENTOSCAIXA_OUTRO > 0) then MOVIMENTOSCAIXA_OUTRO ELSE 0 END) MOVIMENTOS_FINANCEIRA02,
                                sum(MOVIMENTOSCAIXA_OUTRO) as MOVIMENTOS_FINANCEIRA
                        from MOVIMENTOSCAIXA
                        join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
                        left outer join FINANCEIROS on FINANCEIROS_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS and
                                                        FINANCEIROS_PARCELA = FINANCEIROS_PARCELAS
                        where ((MOVIMENTOS_STATUS <> 'C') and (MOVIMENTOS_STATUS <> 'D')) and
                                MOVIMENTOS_ID_DOCUMENTOS = ((MOVIMENTOS_ID_EMPRESAS * 10000) + 2) and
                        MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}'
                        ${sqlWhere}
                        GROUP BY MOVIMENTOSCAIXA_EMISSAO`
            }

            db.query(sqlSearch, (error, results) => {
                if (error) {
                    samosFB.enviarRespostaErro(`Falha ao listar`, db, error, reject, sqlSearch);
                } else {
                    samosFB.processarLeitura({db, results, total: results.length, resolve, reject});
                }
            });
        });
    }
};