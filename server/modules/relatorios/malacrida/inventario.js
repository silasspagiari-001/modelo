'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const samosFB = require('../../../services/samosFB');
const samosRedis = require('../../../services/samosRedis')


module.exports = {
    
    read: params => {
        let pathLogo;

        try {
            pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
        } catch(error) {
            pathLogo = `${appRoot}/resources/images/headers/default.png`;
        }

        let docDefinition = {
            pageOrientation: 'portrait',
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 35],
            header: function(page, pages) { 
                return { 
                    alignment: 'justify',
                    columns: [
                        {
                            image: pathLogo,
                            width: 100,
                            height: 22,
                        },
                        {
                            text: [
                                {
                                    text: `Inventario de Produtos em ${moment(params.inicio).format('DD/MM/YYYY')} - ${(
                                        params.preco == 0 ? 'Preço de Custo\n'  : 
                                        params.preco == 1 ? 'Preço de Compra\n' : 
                                        params.preco == 2 ? 'Preço de Venda\n' : 
                                        'Custo Médio\n')}`,
                                    width: '*',
                                    style: {
                                        fontSize: 11,
                                        alignment: 'center',
                                        color: 'blue'
                                    }
                                }
                            ]
                        },
                        {
                            stack: [
                                moment.tz(params.timezone).format('DD/MM/YYYY'),
                                moment.tz(params.timezone).format('HH:mm:ss')
                            ],
                            width: 100,
                            style: {
                                fontSize: 6,
                                alignment: 'right',
                                bold: true
                            }
                        }
                    ],
                    margin: [40, 10]
                }
            },
            styles: {
                tableExample: {
                    fontSize: 8,
                    margin: [0, 0, 0, 0]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: 'black'
                }
            },
            content: [
                {columns: [{},{},{},{},{},{}]},
                {
                    style: 'tableExample',
                    table: {
                        widths: [30, '*', 17, 40, 55, 50],
                        headerRows: 1,                        
                        body: [
                            [
                                { text: 'Código', style: 'tableHeader', alignment: 'center' },
                                { text: 'Descrição do Produto', style: 'tableHeader', alignment: 'center' },
                                { text: 'Uni', style: 'tableHeader', alignment: 'center' },
                                { text: 'Qtde', style: 'tableHeader', alignment: 'center' },
                                { text: params.preco == 0 ? 'R$ Custo'  : 
                                        params.preco == 1 ? 'R$ Compra' : 
                                        params.preco == 2 ? 'R$ Venda'  : 'Custo Médio',
                                  style: 'tableHeader', alignment: 'center' },
                                { text: 'Total', style: 'tableHeader', alignment: 'center' }
                            ]
                        ]
                    },
                    layout: {
                        fillColor: function (i) {
                            return (i % 2 === 0) ? '#E3E3E3' : null;
                        }
                    }
                }
            ],
            footer: function(page, pages) {
                return { 
                    stack: [ 
                        '_'.repeat(95),
                        { text: 'Página: ' + page.toString(), italics: true, fontSize: 8, alignment: 'right'}
                    ],
                    margin: [40, 10]
                };
            }
        };

        return new Promise(async (resolve, reject) => {
            const dados = await obterDados(params);
            const dados2 = await obterdadosEmpresa(params);

            let rows = docDefinition.content[1].table.body;
            let totalGeral = 0;
            let totalGrupo = 0;

            for(let i in dados){
                if(parseInt(params.grupoinicial) > 0 && dados[i]['GRUPOS_ID'] < params.grupoinicial) continue;
                if(parseInt(params.grupofinal) > 0 && dados[i]['GRUPOS_ID'] > params.grupofinal) continue;

                const total = (
                    params.preco == 0 ? dados[i]['SALDOS_CUSTO'] :
                    params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                    params.preco == 2 ? dados[i]['SALDOS_PRECO'] :
                    params.preco == 3 ? dados[i]['SALDOS_MEDIO'] : 0
                ) * dados[i]['SALDOS_QUANTIDADE'];

                totalGeral += total;
                totalGrupo += total;

                rows.push([
                    { text: dados[i]['PRODUTOS_ID'], alignment: 'right', style: 'tableExample', border: [false, false, false, false] },                            
                    { text: dados[i]['PRODUTOS_NOME'] , alignment: 'left', style: 'tableExample', border: [false, false, false, false] },
                    { text: dados[i]['PRODUTOS_UNIDADE'], alignment: 'center', style: 'tableExample', border: [false, false, false, false] },
                    { text: dados[i]['SALDOS_QUANTIDADE'], alignment: 'right', style: 'tableExample', border: [false, false, false, false] },
                    { text: utils.number.float2moeda(
                            params.preco == 0 ? dados[i]['SALDOS_CUSTO']  :
                            params.preco == 1 ? dados[i]['SALDOS_COMPRA'] :
                            params.preco == 2 ? dados[i]['SALDOS_PRECO']  :
                            params.preco == 3 ? dados[i]['SALDOS_MEDIO']  : 0
                        ),
                      alignment: 'right', style: 'tableExample', border: [false, false, false, false] },
                    { text: utils.number.float2moeda(total), alignment: 'right', style: 'tableExample', border: [false, false, false, false] }
                ]);
            }

            rows.push([
                { text: 'TOTAL GERAL:', alignment: 'right', style: 'tableExample', bold: true, colSpan: 4, border: [false, false, false, false] },{},{},{},
                { text: utils.number.float2moeda(totalGeral), alignment: 'right', style: 'tableExample', colSpan: 2, border: [false, false, false, false] },{}
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

async function obterDados(params) {
    const dataInventario = moment(params.inicio).format('DD.MM.YYYY');
    const sql = `EXECUTE BLOCK RETURNS (
        PRODUTOS_ID INTEGER,
        PRODUTOS_ID_GRUPOS INTEGER,
        PRODUTOS_NOME VARCHAR(100),
        PRODUTOS_UNIDADE VARCHAR(10),
        PRODUTOS_BARRA VARCHAR(50),
        SALDOS_CUSTO NUMERIC(15,4),
        SALDOS_COMPRA NUMERIC(15,4),
        SALDOS_PRECO NUMERIC(15,4),
        SALDOS_RESERVADO NUMERIC(15,4),
        SALDOS_QUANTIDADE NUMERIC(15,4),
        SALDOS_MEDIO NUMERIC(15,4),
        SALDOS_TOTAL NUMERIC(15,4),
        QTDE_ORCAMENTO NUMERIC(15,4),
        QTDE_PENDENTE NUMERIC(15,4)        
    ) AS
    DECLARE VARIABLE V_SALDO NUMERIC(15,4);
    DECLARE VARIABLE V_ESTOQUE CHAR(1);
    DECLARE VARIABLE V_QUANTIDADE NUMERIC(15,4);
    DECLARE VARIABLE CUSTOMEDIO NUMERIC(15,4);

BEGIN
  FOR
    SELECT
        P.PRODUTOS_ID,
        P.PRODUTOS_ID_GRUPOS,
        P.PRODUTOS_NOME,
        P.PRODUTOS_UNIDADE,
        P.PRODUTOS_BARRA,
        S.SALDOS_CUSTO,
        S.SALDOS_COMPRA,
        S.SALDOS_PRECO,
        S.SALDOS_RESERVADO,
        0 AS QTDE_ORCAMENTO,
        0 AS QTDE_PENDENTE
    FROM PRODUTOS P
    JOIN GRUPOS G ON G.GRUPOS_ID = P.PRODUTOS_ID_GRUPOS
    JOIN NCMS N ON N.NCMS_ID = P.PRODUTOS_ID_NCMS
    JOIN SALDOS S ON S.SALDOS_ID_EMPRESAS = ${params.empresaLogada} AND S.SALDOS_ID_PRODUTOS = P.PRODUTOS_ID
    WHERE P.PRODUTOS_INVENTARIO = 'T'
      AND P.PRODUTOS_ID_GRUPOS BETWEEN 1 AND 99999
    ORDER BY P.PRODUTOS_NOME
    INTO :PRODUTOS_ID,: PRODUTOS_ID_GRUPOS, :PRODUTOS_NOME, :PRODUTOS_UNIDADE, :PRODUTOS_BARRA, 
         :SALDOS_CUSTO, :SALDOS_COMPRA,
         :SALDOS_PRECO, :SALDOS_RESERVADO, :QTDE_ORCAMENTO, :QTDE_PENDENTE
  DO
  BEGIN
    
    V_SALDO = 0;

    EXECUTE PROCEDURE CUSTO_MEDIO(:PRODUTOS_ID, '${dataInventario}', ${params.empresaLogada})
    RETURNING_VALUES :CUSTOMEDIO;

    CUSTOMEDIO = iif(CUSTOMEDIO = 0, SALDOS_CUSTO, CUSTOMEDIO);

    IF (${params.valuepercentual} > 0) THEN
    BEGIN
      IF (${params.valueacrescimo} = 1) THEN
        CUSTOMEDIO = ROUND(CUSTOMEDIO - ((CUSTOMEDIO * 0.01) * ${params.valuepercentual}), 2);
      ELSE
        CUSTOMEDIO = ROUND(CUSTOMEDIO + ((CUSTOMEDIO * 0.01) * ${params.valuepercentual}), 2);
    END
  
    FOR
      SELECT O.OPERACOES_ESTOQUE, SUM(MI.MOVIMENTOSITENS_QUANTIDADE)
      FROM MOVIMENTOSITENS MI
      LEFT JOIN MOVIMENTOS M ON M.MOVIMENTOS_ID = MI.MOVIMENTOSITENS_ID_MOVIMENTOS
      LEFT JOIN OPERACOES O ON O.OPERACOES_ID = MI.MOVIMENTOSITENS_ID_OPERACOES
      LEFT JOIN PRODUTOS P ON P.PRODUTOS_ID = MI.MOVIMENTOSITENS_ID_PRODUTOS
      WHERE MI.MOVIMENTOSITENS_ID_PRODUTOS = :PRODUTOS_ID
        AND M.MOVIMENTOS_ID_EMPRESAS = ${params.empresaLogada}
        AND P.PRODUTOS_ID_GRUPOS between ${params.grupoinicial} and ${params.grupofinal}
        AND ((M.MOVIMENTOS_ID_DOCUMENTOS = ${params.empresaLogada}0003 AND M.MOVIMENTOS_EMISSAO <= '${dataInventario}') OR
             (M.MOVIMENTOS_ID_DOCUMENTOS = ${params.empresaLogada}0004 AND M.MOVIMENTOS_ENTRADASAIDA <= '${dataInventario}') OR
             (M.MOVIMENTOS_ID_DOCUMENTOS = ${params.empresaLogada}0005 AND M.MOVIMENTOS_ENTRADASAIDA <= '${dataInventario}'))
        AND M.MOVIMENTOS_STATUS NOT IN ('C', 'D')
        AND O.OPERACOES_ESTOQUE <> 'N'
      GROUP BY O.OPERACOES_ESTOQUE
      ORDER BY O.OPERACOES_ESTOQUE
      INTO :V_ESTOQUE, :V_QUANTIDADE
    DO
    BEGIN
      IF (V_ESTOQUE = 'C') THEN
        V_SALDO = V_SALDO + V_QUANTIDADE;
      ELSE IF (V_ESTOQUE = 'D') THEN
        V_SALDO = V_SALDO - V_QUANTIDADE;
    END

    if (${params.tiposaldo} = 3) THEN -- todos
      BEGIN
        SALDOS_QUANTIDADE = (V_SALDO - QTDE_ORCAMENTO - QTDE_PENDENTE);
        SALDOS_MEDIO = CUSTOMEDIO;
        SALDOS_TOTAL = ROUND(SALDOS_QUANTIDADE * ROUND(CUSTOMEDIO, 2), 2);
        SUSPEND;
      end
    else
      if (${params.tiposaldo} = 0) then -- positivo
      begin
        IF (V_SALDO > 0)  THEN
          BEGIN
            SALDOS_QUANTIDADE = (V_SALDO - QTDE_ORCAMENTO - QTDE_PENDENTE);
            SALDOS_MEDIO = CUSTOMEDIO;
            SALDOS_TOTAL = ROUND(SALDOS_QUANTIDADE * ROUND(CUSTOMEDIO, 2), 2);
            SUSPEND;
          end
      end
      else
        if (${params.tiposaldo} = 1) then -- negativo
        begin
          IF (V_SALDO < 0)  THEN
            BEGIN
              SALDOS_QUANTIDADE = (V_SALDO - QTDE_ORCAMENTO - QTDE_PENDENTE);
              SALDOS_MEDIO = CUSTOMEDIO;
              SALDOS_TOTAL = ROUND(SALDOS_QUANTIDADE * ROUND(CUSTOMEDIO, 2), 2);
              SUSPEND;
            end
         end
        else
      IF (V_SALDO = 0) THEN
        BEGIN
          SALDOS_QUANTIDADE = (V_SALDO - QTDE_ORCAMENTO - QTDE_PENDENTE);
          SALDOS_MEDIO = CUSTOMEDIO;
          SALDOS_TOTAL = ROUND(SALDOS_QUANTIDADE * ROUND(CUSTOMEDIO, 2), 2);
          SUSPEND;




   end
  END
END`;

    const results = await samosFB.executeSQL(sql, params);
    return results;
}

async function obterdadosEmpresa(params) {
      let sql = ` select  * from EMPRESAS
                    where  EMPRESAS_ID  = ${params.empresaLogada}`


         const results = await samosFB.executeSQL(sql, params);
         return results;

};