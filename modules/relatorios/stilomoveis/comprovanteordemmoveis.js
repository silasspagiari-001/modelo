'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [30, 30, 30, 30],
			content: [
				{columns: [{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 10, 
                    table: {
						widths: [45, 65, 150, 39, 17, 40, 53, 35, 19],
						body: []
					}
				} 
			]
		};

        return new Promise((resolve, reject) => {
			api.ordensmoveis().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
                                       
                    const ordem = res.results[0];
                    const produtos = ordem['ORDENS_PRODUTOSITENS'];
                    const servicos = ordem['ORDENS_SERVICOSITENS'];
                    const fantasia = ordem['EMPRESAS_FANTASIA']; 
                    const pessoaFantasia = ordem['PESSOAS_FANTASIA'] || [];
    
                    rows.push([
                        {
                            text : [
                                {
                                    text: 'A\n',
                                    color: 'white',
                                    fontSize: 7
                                },
                                {
                                    text: 'SOLICITAÇÃO DE SERVIÇOS',
                                    fontSize: 12,
                                    color: 'darkblue',
                                    bold: true,
                                    alignment: 'center',
                                }
                            ],
                            colSpan: 3,                                        
                            border: [true, true, true, true]                                                                                        
                        },{},{},
                        {
                            text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                            alignment: 'center',
                            fontSize: 25,
                            bold: true,
                            colSpan: 2,
                            border: [true, true, true, true]
                        },{},
                        {
                            text: [
                                {
                                    text: ordem['ORDENS_NUMERO'],
                                    fontSize: 25,
                                    bold: true                                        
                                }
                            ],
                            alignment: 'center',
                            colSpan: 4,
                            border: [true, true, true, true]
                        },
                        {},{},{}
                    ]);
               
                    rows.push([
                        {
                            text: 'Nome',
                            border: [true, true, true, true]
                        },
                        {
                            text: ordem['PESSOAS_NOME'] + (pessoaFantasia.length > 0 ? ` (${pessoaFantasia})`: '') + '(' + ordem['ORDENS_ID_PESSOAS'] + ') ',
                            colSpan: 4,
                            border: [true, true, true, true]
                        },{},{},{},
                        {
                            text: 'Celular',
                            border: [true, true, true, true]
                        },
                        {
                            text: utils.string.maskFone(ordem['PESSOAS_CELULAR']),
                            colSpan: 3,
                            border: [true, true, true, true]
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Endereço',
                            border: [true, true, true, true]
                        },
                        {
                            text: ordem['PESSOAS_ENDERECO'] + ', ' + ordem['PESSOAS_NUMERO'],
                            colSpan: 4,
                            border: [true, true, true, true]
                        },{},{},{},
                        {
                            text: 'Telefone',
                            border: [true, true, true, true]
                        },
                        {
                            text: utils.string.maskFone(ordem['PESSOAS_TELEFONE']),
                            colSpan: 3,
                            border: [true, true, true, true]
                        },{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Bairro',
                            border: [true, true, true, true]
                        },
                        {
                            text: ordem['PESSOAS_BAIRRO'],
                            colSpan: 4,
                            border: [true, true, true, true]
                        },{},{},{},
                        {
                            text: 'Cidade',
                            border: [true, true, true, true]
                        },
                        {
                            text: (ordem['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                            .replace('ALVARES ', 'ALV. ')
                            .replace('ALFREDO ', 'ALF. ')
                            .replace('SANTO ', 'STO. '),
                            colSpan: 2,
                            border: [true, true, true, true]
                        },{},
                        {
                            text: ordem['CIDADES_ESTADO'],
                            border: [true, true, true, true]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'Obs',
                            border: [true, true, true, true]
                        },{
                            text: ordem['PESSOAS_PAGINA'].toUpperCase(),
                            colSpan: 8,
                            border: [true, true, true, true],
                        },{},{},{},{},{},{},{}
                    ]);

                    if(produtos.length > 0) {                        
                        rows.push([
                            {
                                text: 'A',
                                color: 'white',
                                fontSize: 2,
                                colSpan: 9,
                                border: [false, true, false, true]
                            },{},{},{},{},{},{},{},{}
                        ]);
                        
                        rows.push([
                            {
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Produto',
                                colSpan: 3,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},{},
                            {
                                text: 'Cor',
                                colSpan: 2,                                
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: 'Qtde',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Total',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{}
                        ]);
    
                        produtos.forEach(item => {
                            rows.push([
                                {
                                    text: item['ORDENSPRODUTOS_ID_PRODUTOS'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: (item['PRODUTOS_NOME'] || '').substr(0, 50),
                                    colSpan: 3,
                                    fontSize: 9,
                                    border: [true, true, true, true]
                                },{},{},
                                {
                                    text: item['PRODUTOS_MARCA'],
                                    colSpan: 2,                                    
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },{},
                                {
                                    text: item['ORDENSPRODUTOS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: utils.number.float2moeda(item['ORDENSPRODUTOS_TOTAL']),
                                    border: [true, true, true, true],
                                    colSpan: 2,
                                    fontSize: 9,
                                    alignment: 'right'
                                },{}
                            ]);
    
                        });    
                    } // Fim produtos

                    if(servicos.length > 0) {                        
                        rows.push([
                            {
                                text: 'A',
                                color: 'white',
                                fontSize: 2,
                                colSpan: 9,
                                border: [false, true, false, true]
                            },{},{},{},{},{},{},{},{}
                        ]);
                        
                        rows.push([
                            {
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Serviço',
                                colSpan: 5,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},{},{},{},
                            {
                                text: 'Qtde',
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: 'Total',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{}
                        ]);
    
                        servicos.forEach(item => {
                            rows.push([
                                {
                                    text: item['ORDENSSERVICOS_ID_SERVICOS'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: (item['SERVICOS_NOME'] || '').substr(0, 50),
                                    colSpan: 5,
                                    fontSize: 9,
                                    border: [true, true, true, true]
                                },{},{},{},{},
                                {
                                    text: item['ORDENSSERVICOS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: utils.number.float2moeda(item['ORDENSSERVICOS_TOTAL']),
                                    border: [true, true, true, true],
                                    colSpan: 2,
                                    fontSize: 9,
                                    alignment: 'right'
                                },{}
                            ]);
    
                        });    
                    } // Fim serviços

                    rows.push([
                        {
                            text: 'RECEBI E CONFERI OS SERVIÇOS CONSTANTES DA SOLICITAÇÃO DE SERVIÇOS ACIMA EM PERFEITAS CONDIÇÕES',
                            border: [true, true, true, true],
                            fontSize: 8,
                            colSpan: 9
                        },{},{},{},{},{},{},{},{}
                    ]);
                    
                    rows.push([
                        {
                            text: 'DATA DO RECEBIMENTO\n\n\n',
                            border: [true, true, true, true],
                            fontSize: 9,
                            colSpan: 2
                        },{},
                        {
                            text: 'IDENTIFICAÇÃO\n\n\n',
                            border: [true, true, true, true],
                            fontSize: 9,
                        },
                        {
                            text: 'ASSINATURA DO RECEBEDOR POR EXTENSO\n\n\n',
                            border: [true, true, true, true],
                            fontSize: 9,
                            colSpan: 6
                        },{},{},{},{},{}
                    ]); 

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};