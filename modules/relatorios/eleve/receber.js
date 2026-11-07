'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

moment.locale('pt_BR');

const samosFB = require('../../../services/samosFirebird');

module.exports = {
    read: async params => { 
		return new Promise(async (resolve, reject) => {
			const db = await samosFB.conectarBanco(params.client); 
            const dados = await obterDados(db, params);

            const docDefinition = {
                pageOrientation: 'landscape',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{}]}, // 8 Colunas
                    {
                        style: 'tableExample',
                        table: {
                            widths:  [50, 90, 50, 230, 50, 50, 50, 160],
                            headerRows: 2,
                            body: []
                        },
                        layout: {
                            fillColor: function (i) {
                                return (i % 2 === 0) ? '#F0F0F0' : null;
                            }
                        }
                    }
                ],
                footer: function(page, pages) {
                    return { 
                        stack: [ 
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [15, 10]  // 10, 10
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 8,
                        margin: [0, 0, 0, 0],
                        border: 0
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 8,
                        color: 'black'
                    }
                }
            };

            let rows = docDefinition.content[1].table.body;

            let pathLogo;

            try {
                pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
            } catch(error) {
                pathLogo = `${appRoot}/resources/images/headers/default.png`;
            }

            const cents = utils.number.cents.bind(utils.number);
            let totalValorServico = 0;
            let totalValorLiquido = 0;
            let brutoProtestado   = 0;
            let brutoPermuta      = 0;
            let liquidoProtestado = 0;
            let liquidoPermuta    = 0;

            let nomeEmpresa = dados.length > 0 ? dados[0]['EMPRESAS_NOME'] : '';

            rows.push(		
                [
                    { 
                        text: `Títulos a Receber - ${nomeEmpresa} (${moment.tz(params.timezone).format('DD/MM/YYYY')})`,
                        colSpan: 8,
                        bold: true,
                        fontSize: 13,
                        alignment: 'center',
                        border: [false, false, false, false]
                    },{},{},{},{},{},{},{}
                ],
                [
                    {
                        text: 'Vencimento',
                        style: 'tableHeader',
                        alignment: 'center'									
                    },
                    {
                        text: 'Número OS',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Emissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Cliente',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor Serviço',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Nº N. Fiscal',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Valor Líquido',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Observações',
                        style: 'tableHeader',
                        alignment: 'center'
                    }
                ]
            );

            for(let i in dados){

                let valorServico = (cents(dados[i]['ORDENS_SERVICOS']) / dados[i]['FINANCEIROS_PARCELAS']);

                rows.push([
                    {
                        text: moment(dados[i]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },							
                    {
                        text: dados[i]['ORDENS_IDENTIFICACAO '] || dados[i]['ORDENS_NUMEROORIGEM'] || dados[i]['ORDENS_NUMERO'], // número OS
                        alignment: 'left',
                        style: 'tableExample'
                    },						
                    {
                        text: moment(dados[i]['FINANCEIROS_EMISSAO']).format('DD/MM/YYYY'),
                        alignment: 'center',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['PESSOAS_NOME'],
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(valorServico / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['FINANCEIROS_SERIE'] == 'NS' ? dados[i]['FINANCEIROS_NUMERO'] : '',
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['FINANCEIROS_ID_PORTADORES'] ==  9 ? 'PERMUTA' : utils.number.float2moeda(dados[i]['FINANCEIROS_ABERTO']),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: dados[i]['FINANCEIROS_ID_PORTADORES'] == 8 ? ('PROTESTADO ' + dados[i]['FINANCEIROS_OBSERVACOES']) : dados[i]['FINANCEIROS_OBSERVACOES'],
                        alignment: 'left',
                        style: 'tableExample'
                    }
                ]);	

                if(dados[i]['FINANCEIROS_ID_PORTADORES'] == 8) {
                    brutoProtestado   += valorServico;
                    liquidoProtestado += cents(dados[i]['FINANCEIROS_ABERTO']);
                } else {
                    if(dados[i]['FINANCEIROS_ID_PORTADORES'] == 9) {
                        brutoPermuta   += valorServico;
                        liquidoPermuta += cents(dados[i]['FINANCEIROS_ABERTO']);
                    } else {                        
                        totalValorLiquido += cents(dados[i]['FINANCEIROS_ABERTO']);
                    }
                }    

                totalValorServico += valorServico;
            }

            rows.push([
                {
                    text: 'TOTAIS:',
                    alignment: 'right',
                    bold: true,
                    colSpan: 4,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(totalValorServico / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },
                {
                    text: utils.number.float2moeda(totalValorLiquido / 100),
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },{},
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                }
            ]);

            rows.push([
                {
                    text: 'TOTAL PROTESTADO:',
                    alignment: 'right',
                    bold: true,
                    colSpan: 4,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(brutoProtestado / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },
                {
                    text: utils.number.float2moeda(liquidoProtestado / 100),
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },{},
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                }
            ]);

            rows.push([
                {
                    text: 'TOTAL PERMUTA:',
                    alignment: 'right',
                    bold: true,
                    colSpan: 4,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda(brutoPermuta / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },
                {
                    text: utils.number.float2moeda(liquidoPermuta / 100),
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },{},
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                }
            ]);

            rows.push([
                {
                    text: 'TOTAL GERAL:',
                    alignment: 'right',
                    bold: true,
                    colSpan: 4,
                    style: 'tableExample',
                    border: [false, false, false, false]
                },{},{},{},
                {
                    text: utils.number.float2moeda((totalValorServico + brutoProtestado + brutoPermuta) / 100),
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },
                {
                    text: utils.number.float2moeda((totalValorLiquido + liquidoProtestado + liquidoPermuta) / 100),
                    colSpan: 2,
                    alignment: 'right',
                    bold: true,
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                },{},
                {
                    text: '',
                    style: 'tableExample',
                    border: [false, false, false, false]                    
                }
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

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
        documento
    } = params;

    let sqlPessoa = '';
    let sqlOrder = '';
    let sqlEmpresa   = empresa   ? `and FINANCEIROS_ID_EMPRESAS   = ${empresa} `   : '';

    let sqlDocumento = parseInt(documento || 0) > 0 ? `and right(FINANCEIROS_ID_DOCUMENTOS, 4) = '000${documento}' ` : ''


    let sqlPortador  = (porinicio && porfinal) ? `and FINANCEIROS_ID_PORTADORES between ${porinicio} and  ${porfinal} `  : '';
    let sqlAplicacao = (aplinicio && aplfinal) ? `and FINANCEIROS_ID_APLICACOES between ${aplinicio} and  ${aplfinal} `  : '';
    let sqlCusto     = (cusinicio && cusfinal) ? `and FINANCEIROS_ID_CUSTOS between ${cusinicio} and  ${cusfinal} `  : '';
    let sqlSemnn     = semnn == 'true' ? ' and ((FINANCEIROS_NOSSONUMERO = 0) or (FINANCEIROS_NOSSONUMERO is null))' : '';

    if (pesinicio > 0 ) {
      sqlPessoa  = ` and FINANCEIROS_ID_PESSOAS IN (
        SELECT P2.PESSOAS_ID
        FROM PESSOAS P1
        JOIN PESSOAS P2 
            ON SUBSTRING(P2.PESSOAS_CPFCNPJ FROM 1 FOR 8) = SUBSTRING(P1.PESSOAS_CPFCNPJ FROM 1 FOR 8)
        WHERE P1.PESSOAS_ID = ${pesinicio} ) `

    } else {
      sqlPessoa  = tipo == 'T' 
                       ? ((pesinicio && pesfinal) ? `and ((FINANCEIROS_ID_PESSOAS = ${pesinicio}) or (FINANCEIROS_ID_PESSOAS = ${pesfinal})) ` : '')
                       : ((pesinicio && pesfinal) ? `and FINANCEIROS_ID_PESSOAS between ${pesinicio} and  ${pesfinal} `  : '');
    }

    let sqlWhere = `where FINANCEIROS_ID > 0 ${sqlEmpresa} 
                                            ${sqlDocumento}
                                            ${sqlPessoa} 
                                            ${sqlPortador} 
                                            ${sqlAplicacao} 
                                            ${sqlCusto} 
                                            ${sqlSemnn}`;

    if(tipo && tipo != 'T') {                                                     
        if(status == 0) {
            if(database && database != 'Data inválida') {
                sqlWhere += ` and ((FINANCEIROS_STATUS = 'A') or (FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO > '${database.replace (/\//ig,'.')}')) `;
            } else {
                sqlWhere += ` and FINANCEIROS_STATUS = 'A' `;
            }
        } else if(status == 1) {
            if(database && database != 'Data inválida' ) {
                sqlWhere += ` and FINANCEIROS_STATUS = 'P' and FINANCEIROS_PAGAMENTO <= '${database.replace (/\//ig,'.')}')) `;
            } else {
                sqlWhere += ` and FINANCEIROS_STATUS = 'P' `; 
            }
        } 
    }

    if (emiinicio && emifinal && emiinicio != 'Data inválida' && emifinal != 'Data inválida') {
        sqlWhere += ` and FINANCEIROS_EMISSAO between '${emiinicio.replace (/\//ig,'.')}' and '${emifinal.replace (/\//ig,'.')}' `;
    }

    if(database && database == 'Data inválida') {
        if (vctinicio && vctfinal && vctinicio != 'Data inválida' && vctinicio != 'Data inválida') {
            sqlWhere += ` and FINANCEIROS_VENCIMENTO between '${vctinicio.replace (/\//ig,'.')}' and '${vctfinal.replace (/\//ig,'.')}' `;
        }    
    }

    if (paginicio && pagfinal && paginicio != 'Data inválida' && pagfinal != 'Data inválida') {
        sqlWhere += ` and FINANCEIROS_PAGAMENTO between '${paginicio.replace (/\//ig,'.')}' and '${pagfinal.replace (/\//ig,'.')}' `;
    }    

    if (parseFloat(vloinicio) > 0 && parseFloat(vlofinal) > 0) {
        sqlWhere += ` and FINANCEIROS_ORIGINAL between ${vloinicio} and ${vlofinal} `;
    }    

    if(tipo && tipo != 'T') {
        sqlWhere += ` and FINANCEIROS_TIPO = '${tipo}' `
    }
                                
    if(ordem == 0) {
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
                        
    return new Promise(async (resolve, reject) => {
		let sql = `select FINANCEIROS_ID,
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
                        ORDENS_NUMERO,
                        ORDENS_NUMEROORIGEM,
                        ORDENS_IDENTIFICACAO,
                        ORDENS_SERVICOS,
                        ORDENS_REABERTURA,
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
                        left outer join PESSOAS                    on PESSOAS_ID                 = FINANCEIROS_ID_PESSOAS
                        left outer join CIDADES as CIDADESPESSOAS  on CIDADESPESSOAS.CIDADES_ID  = PESSOAS_ID_CIDADES
                        left outer join CIDADES as CIDADESEMPRESAS on CIDADESEMPRESAS.CIDADES_ID = EMPRESAS_ID_CIDADES
                        left outer join PORTADORES                 on PORTADORES_ID              = FINANCEIROS_ID_PORTADORES
                        left outer join APLICACOES                 on APLICACOES_ID              = FINANCEIROS_ID_APLICACOES
                        left outer join CUSTOS                     on CUSTOS_ID                  = FINANCEIROS_ID_CUSTOS
                        left outer join USUARIOS                   on USUARIOS_ID                = FINANCEIROS_ID_USUARIOS
                        left outer join MOVIMENTOS                 on MOVIMENTOS_ID              = FINANCEIROS_ID_MOVIMENTOS
                        left outer join ORDENS                     on ORDENS_ID                  = FINANCEIROS_ID_ORDENS
                    ${sqlWhere} ${sqlOrder}`; 
        
          db.query(sql, async (error, results) => {
            if (error) {
                console.log(error);
                reject();
            } else {
                resolve(results);
            }
        });
    });
};