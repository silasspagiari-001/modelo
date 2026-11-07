'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB   = require('../../../services/samosFirebird');
const moment    = require('moment-timezone');

module.exports = {
    read: params => {
		let docDefinition = {
			pageOrientation: 'portrait',
			pageSize: 'A4',
			pageMargins: [25, 25, 25, 25],
			content: [ //   1  2  3  4  5  6  7  8  9 10
				{columns: [{},{},{},{},{},{},{},{},{},{}]},
				{
					style: {
                        margin: [0, 0, 0, 0],
                    },
                    fontSize: 10, 
                    table: { //   1   2   3   4   5   6   7   8   9  10
//						widths: [45, 65, 94, 56, 39, 17, 40, 53, 35, 19],                        
						widths: [45, 65, 94, 56, 29, 17, 40, 53, 35, 19],
						body: []
					}
				} 
			]
		};

        return new Promise((resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;

                    const pedidos = res.results || [];
                                        
                    let contadorPedidos = 0;
                    let contadorItens = 0;
                    let pedidoAnterior = 0;
                    let pedidoAtual = 0;
                                                      
                    pedidos.forEach((pedido, index) => {
                        const montarAlgo = (pedido['MOVIMENTOS_ITENS'] || []).some(item => {
                            const montarItem  = item['MOVIMENTOSITENS_CSTPIS'];
                            return montarItem != 'ML';  // Filtra os montados loja
                        });

                        pedidoAtual = pedido['MOVIMENTOS_NUMERO'];                        
                
                        if(montarAlgo && pedidoAnterior != pedidoAtual) {
                            contadorPedidos++;
                        
                            const itens = pedido['MOVIMENTOS_ITENS'];
                            const fantasia = pedido['EMPRESAS_FANTASIA'];  
    
                            if(contadorPedidos > 3 || contadorItens > 13) {
                                contadorPedidos = 1;
                                contadorItens = 1;
    
                                rows.push([
                                    {
                                        text : [
                                            {
                                                text: 'A\n',
                                                color: 'white',
                                                fontSize: 7
                                            },
                                            {
                                                text: 'SOLICITAÇÃO DE MONTAGEM',
                                                fontSize: 12,
                                                color: 'darkblue',
                                                bold: true,
                                                alignment: 'center',
                                            }
                                        ],
                                        pageBreak: 'before',                                        
                                        colSpan: 3,                                       
                                        border: [true, true, true, true]                                                                                        
                                    },{},{},
                                    {
                                        text: '' // Em branco, pra anotações
                                    },
                                    {
                                        text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                                        alignment: 'center',
                                        fontSize: 25,
                                        pageBreak: 'before',                                    
                                        bold: true,
                                        colSpan: 2,
                                        border: [true, true, true, true]
                                    },{},
                                    {
                                        text: [
                                            {
                                                text: pedido['MOVIMENTOS_NUMERO'],
                                                fontSize: 22,  //15
                                                bold: true                                        
                                            }
                                        ],
                                        pageBreak: 'before',                                    
                                        alignment: 'center',
                                        colSpan: 4,
                                        border: [true, true, true, true]
                                    },
                                    {},{},{}
                                ]);
    
                            } else { // sem page feed - só pra dividir entre um e outro.
                                if(contadorPedidos > 1) {
                                    rows.push([
                                        {
                                            text: 'A',
                                            color: 'white',
                                            fontSize: 10,
                                            colSpan: 10,
                                            border: [false, true, false, true]
                                        },{},{},{},{},{},{},{},{},{}
                                    ]);        
                                }
                                rows.push([
                                    {
                                        text : [
                                            {
                                                text: 'A\n',
                                                color: 'white',
                                                fontSize: 7
                                            },
                                            {
                                                text: 'SOLICITAÇÃO DE MONTAGEM',
                                                fontSize: 12,
                                                pageBreak: 'before',
                                                color: 'darkblue',
                                                bold: true,
                                                alignment: 'center',
                                            }
                                        ],
                                        colSpan: 3,                                        
                                        border: [true, true, true, true]
                                    },{},{},
                                    {

                                            text: '' // Em branco, para anotações
                                    },
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
                                                text: pedido['MOVIMENTOS_NUMERO'],
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
                            }
               
                            rows.push([
                                {
                                    text: 'Nome',
                                    border: [true, true, true, true]
                                },
                                {
                                    text: pedido['MOVIMENTOS_NOME'] + (pedido['PESSOAS_FANTASIA'].length > 0 ? ` (${pedido['PESSOAS_FANTASIA']})`: '') + '(' + pedido['MOVIMENTOS_ID_PESSOAS'] + ') ',
                                    colSpan: 5,
                                    border: [true, true, true, true]
                                },{},{},{},{},
                                {
                                    text: 'Celular',
                                    border: [true, true, true, true],
                                    bold: true
                                },
                                {
                                    text: utils.string.maskFone(pedido['MOVIMENTOS_CELULAR']),
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
                                    text: pedido['PESSOAS_ENDERECO'] + ', ' + pedido['PESSOAS_NUMERO'],
                                    colSpan: 5,
                                    border: [true, true, true, true]
                                },{},{},{},{},
                                {
                                    text: 'Telefone',
                                    border: [true, true, true, true]
                                },
                                {
                                    text: utils.string.maskFone(pedido['PESSOAS_TELEFONE']),
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
                                    text: pedido['PESSOAS_BAIRRO'],
                                    colSpan: 5,
                                    border: [true, true, true, true]
                                },{},{},{},{},
                                {
                                    text: 'Cidade',
                                    border: [true, true, true, true]
                                },
                                {
                                    text: (pedido['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                                    .replace('ALVARES ', 'ALV. ')
                                    .replace('ALFREDO ', 'ALF. ')
                                    .replace('SANTO ', 'STO. '),
                                    colSpan: 2,
                                    border: [true, true, true, true]
                                },{},
                                {
                                    text: pedido['CIDADES_ESTADO'],
                                    border: [true, true, true, true]
                                }
                            ]);
        
                            rows.push([
                                {
                                    text: 'Obs',
                                    border: [true, true, true, true]
                                },
                                {
                                    text: pedido['PESSOAS_PAGINA'].toUpperCase(),
                                    colSpan: 9,
                                    border: [true, true, true, true],
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
                                    colSpan: 4,
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },{},{},{},
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
                                    text: 'Valor',
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },
                                {
                                    text: 'Filial',
                                    border: [true, true, true, true],
                                    fontSize: 7.5,
                                    alignment: 'center',
                                    bold: true
                                }
                            ]);
        
                            itens.forEach(item => {
                                contadorItens++;
    
                                if(item['MONTAGENS_VALOR'] > 0 && item['MOVIMENTOSITENS_CSTPIS'] != 'ML') {
                                    rows.push([
                                        {
                                            text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                            border: [true, true, true, true],
                                            fontSize: 9,
                                            alignment: 'center'
                                        },
                                        {
                                            text: (item['PRODUTOS_NOME'] || '').substr(0, 50),
                                            colSpan: 4,
                                            fontSize: 9,
                                            border: [true, true, true, true]
                                        },{},{},{},
                                        {
                                            text: item['PRODUTOS_MARCA'],
                                            colSpan: 2,                                    
                                            border: [true, true, true, true],
                                            fontSize: 9,
                                            alignment: 'center'
                                        },{},
                                        {
                                            text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                            border: [true, true, true, true],
                                            fontSize: 9,
                                            alignment: 'center'
                                        },
                                        {
                                            text: utils.number.float2moeda(item['MONTAGENS_VALOR']),
                                            border: [true, true, true, true],
                                            fontSize: 9,
                                            alignment: 'right'
                                        },
                                        {
                                            text: item['EMPRESAS_FANTASIA'].indexOf('-') != -1 ? item['EMPRESAS_FANTASIA'].slice(item['EMPRESAS_FANTASIA'].indexOf('-') + 2, Infinity) : item['EMPRESAS_FANTASIA'].slice(0, 2),
                                            fontSize: 9,
                                            border: [true, true, true, true],
                                            alignment: 'center'
                                        }
                                    ]);
                                }
                            });
        
                            rows.push([
                                {
                                    text: 'RECEBI E CONFERI A MONTAGEM DOS PRODUTOS CONSTANTES DA SOLICITAÇÃO DE MONTAGEM ACIMA, ESTANDO TODOS EM PERFEITAS CONDIÇÕES',
                                    border: [true, true, true, true],
                                    fontSize: 7.5,
                                    colSpan: 10
                                },{},{},{},{},{},{},{},{},{}
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
                                    colSpan: 2
                                },{},
                                {
                                    text: 'ASSINATURA DO RECEBEDOR POR EXTENSO\n\n\n',
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    colSpan: 6
                                },{},{},{},{},{}
                            ]); 
                            pedidoAnterior = pedidoAtual;
                        }
                        atualizaMontagem(pedido['MOVIMENTOS_ID'], params);
                        // fecha aqui o for dos pedidos...
                    });

                    rows.push([
                        {
                            text: 'A',
                            color: 'white',
                            fontSize: 1,
                            colSpan: 10,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{},{}
                    ]);        

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

// atualizando o status

const atualizaMontagem = function(idMovimento, params) {
    
    const executeBlock = `update MOVIMENTOS set MOVIMENTOS_NFE = 'MOP'
                          where MOVIMENTOS_ID = ${idMovimento}`;

    return new Promise(async (resolve, reject) => {
        const db = await samosFB.conectarBanco(params.client);                    

        db.query(executeBlock, (error) => {
            resolve();
            if (error) {
                console.log(error);
            }
            db.detach();
        });
    });
};