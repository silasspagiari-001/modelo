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
                pageOrientation: 'portrait',
                pageSize: 'A4',
                pageMargins: [15, 40, 15, 35],  // E S D I 
                content: [
                    {columns: [{},{},{},{},{},{},{},{},{}]},
                    {
                        style: 'tableExample',
                        table: { //  VEN NOM  ORC COM NFS COM DEV COM LIQ
                            widths:  [25, 100, 50, 50, 50, 50, 50, 50, 50],
                            headerRows: 3,
                            body: []
                        }
                    }
                ],
                footer: function(page, pages) {
                    return { 
                        stack: [ 
                            '_'.repeat(103),
                            { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                        ],
                        margin: [15, 10]
                    };
                },
                styles: {
                    tableExample: {
                        fontSize: 7,
                        margin: [0, 0, 0, 0],
                        border: 0,
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 7,
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

            rows.push(		
                [
                    {							
                        image: pathLogo,
                        width: 80,
                        fontSize: 15,
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: 'COMISSÃO DE VENDEDORES',
                        colSpan: 7,
                        fontSize: 14,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},
                    {
                        text: '',
                        border: [false, false, false, false]
                    }
                ],
                [
                    {							
                        text: moment.tz(params.timezone).format('HH:mm:ss'),
                        alignment: 'left',
                        border: [false, false, false, false],
                    },
                    { 
                        text: 'Período: ' + params.inicio + ' a ' + params.final,
                        colSpan: 7,
                        fontSize: 7,
                        alignment: 'center',
                        border: [false, false, false, false],
                    },{},{},{},{},{},{},
                    {
                        text: moment.tz(params.timezone).format('DD/MM/YYYY'),
                        alignment: 'right',
                        border: [false, false, false, false],
                    }
                ],												
                [
                    {
                        text: 'Ven',
                        style: 'tableHeader',
                        alignment: 'center'
                    },
                    {
                        text: 'Nome',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Orçamento',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Comissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Notas Fiscais',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Comissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },                    
                    {
                        text: 'Devolução',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },
                    {
                        text: 'Comissão',
                        style: 'tableHeader',
                        alignment: 'center'	
                    },                  
                    {
                        text: 'Valor Líquido',
                        style: 'tableHeader',
                        alignment: 'center'	                        
                    }                      
                ]
            );

            let totalOrc = 0;
            let totalComOrc = 0;
            let totalNfs = 0;
            let totalComNfs = 0;
            let totalDev = 0;
            let totalComDev = 0;
            let totalLiquido = 0;

            for(let i in dados){

                let model = dados[i];

                console.log('model: ', model);

                let comOrcamento = 0;
                let comNotaFiscal = model['USUARIOS_TIPO'].trim() == '2' ? (cents(model['NOTAVISTA']) * .015) + (cents(model['NOTAPRAZO']) * .010) : 0;
                let comDevolucao =  model['USUARIOS_TIPO'].trim() == '2' ? (cents(model['DEVOLUCAO']) * .01) : 0;

                rows.push([
                    {
                        text: ('00000' + model['MOVIMENTOS_ID_USUARIOS']).slice(-5),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: model['USUARIOS_NOME'],
                        style: 'tableExample'
                    },						
                    {
                        text: utils.number.float2moeda(model['ORCAMENTO'] || 0),
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: utils.number.float2moeda(comOrcamento || 0),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(model['NOTAFISCAL']),
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: utils.number.float2moeda(comNotaFiscal / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda(model['DEVOLUCAO']),
                        alignment: 'right',
                        style: 'tableExample'
                    },		
                    {
                        text: utils.number.float2moeda(comDevolucao / 100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                    {
                        text: utils.number.float2moeda((comOrcamento + comNotaFiscal - comDevolucao)/100),
                        alignment: 'right',
                        style: 'tableExample'
                    },
                ]);	

                totalOrc     += cents(model['ORCAMENTO']);
                totalComOrc  += comOrcamento;
                totalNfs     += cents(model['NOTAFISCAL']);
                totalComNfs  += comNotaFiscal;
                totalDev     += cents(model['DEVOLUCAO']);
                totalComDev  += comDevolucao;
                totalLiquido += (comOrcamento + comNotaFiscal - comDevolucao);

            }
            rows.push([
                {
                    text: 'TOTAIS',
                    bold: true,
                    style: 'tableExample',
                    colSpan: 2
                },
                {},						
                {
                    text: utils.number.float2moeda((totalOrc/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },		
                {
                    text: utils.number.float2moeda((totalComOrc/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda((totalNfs/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },		
                {
                    text: utils.number.float2moeda((totalComNfs/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda((totalDev/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },		
                {
                    text: utils.number.float2moeda((totalComDev/100)),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },
                {
                    text: utils.number.float2moeda(totalLiquido/100),
                    bold: true,
                    alignment: 'right',
                    style: 'tableExample'
                },
            ]);

            pdfStream(docDefinition, resolve, reject);
        });
    }
};

const obterDados = function(db, params) {

    const { empresa, vendedor, inicio, final} = params;
    
    return new Promise(async (resolve, reject) => {

        let sqlEmpresa = '';
        let sqlVendedor = '';

        if(empresa > 0) {
            sqlEmpresa = ` and MOVIMENTOS_ID_EMPRESAS = ${empresa} `;
        }

        if(vendedor > 0) {
            sqlVendedor = ` and MOVIMENTOS_ID_USUARIOS = ${vendedor} `;
        }
    
        let sql = `select MOVIMENTOS_ID_EMPRESAS,
            MOVIMENTOS_ID_USUARIOS,
            USUARIOS_TIPO,
            USUARIOS_NOME, 
                        sum(case when right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and OPERACOES_ACAO = 'VN' then MOVIMENTOS_TOTAL ELSE 0 END) NOTAFISCAL,
                        sum(case when right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and OPERACOES_ACAO = 'VN' and MOVIMENTOS_ID_PRAZOS = 1 then MOVIMENTOS_TOTAL ELSE 0 END) NOTAVISTA,
                        sum(case when right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and OPERACOES_ACAO = 'VN' and MOVIMENTOS_ID_PRAZOS > 1 then MOVIMENTOS_TOTAL ELSE 0 END) NOTAPRAZO,
                        sum(case when right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0003' and OPERACOES_ACAO = 'DV' then MOVIMENTOS_TOTAL ELSE 0 END) DEVOLUCAO
            from MOVIMENTOS
            join USUARIOS on USUARIOS_ID = MOVIMENTOS_ID_USUARIOS
            join OPERACOES on OPERACOES_ID = MOVIMENTOS_ID_OPERACOES
                    where MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' and                             
                            ((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0001') or
                             (right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0003')) and
                            MOVIMENTOS_STATUS <> 'C' and
                            MOVIMENTOS_STATUS <> 'D' 
                            ${sqlEmpresa} ${sqlVendedor}
                    group by MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID_USUARIOS, USUARIOS_TIPO, USUARIOS_NOME`;

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