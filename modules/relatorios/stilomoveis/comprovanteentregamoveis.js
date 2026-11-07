'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');

const codes = require('rescode');
codes.loadModules(['code39']);

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
			],
			footer: function(page, pages) { 
				return { 
					stack: [ 
						{ text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 8, alignment: 'right'}
					],
					margin: [40, 10]
				};
			}
		};

        return new Promise((resolve, reject) => {
			api.movimentos().readById(params.id, params)
				.then(async res => {
                    const rows = docDefinition.content[1].table.body;
                    const pedidos = (res.results || []).filter(pedido => {
                        return pedido['ROMANEIOS_DOCUMENTO'] != 'Romaneio Montagem'
                    });
                    const barcodes = await getBarcode(pedidos);

                    let contadorPedidos = 0;
                    let contadorItens = 0;
                                   
                    title(rows);

                    pedidos.forEach((pedido, index) => {
                        contadorPedidos++;

                        const itens = pedido['MOVIMENTOS_ITENS'];
                        const primeiroItem = itens && itens[0] ? itens[0] : {};
                        const dataEntrega = primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] && primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] : '';
                        const turnoEntrega = primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] && primeiroItem['MOVIMENTOSITENS_HORAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] : '';
                        const fantasia = pedido['EMPRESAS_FANTASIA'];
                        const status = pedido['ROMANEIOS_STATUS'];

                        rows.push([
                            {
                                text: [
                                    {
                                        text: 'SE\n',
                                        fontSize: 16
                                    },
                                    {
                                        text: 'SOLICITAÇÃO\n DE ENTREGA',
                                        fontSize: 13
                                    }
                                ],
                                color: 'darkblue',
                                bold: true,
                                alignment: 'center',
                                colSpan: 2,
                                rowSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: [
                                    {
                                        text: 'A\n',
                                        fontSize: 3,
                                        color: 'white'
                                    },
                                    {
                                        text: 'Agenda: ' + dataEntrega.split('-').reverse().join('/')
                                    },
                                    {
                                        text: '\nA',
                                        fontSize: 4,
                                        color: 'white'
                                    }
                                ],
                                bold: true,
                                fontSize: 12,
                                border: [true, true, true, true]
                            },
                            {
                                text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                                alignment: 'center',
                                fontSize: 40,
                                bold: true,
                                colSpan: 2,
                                rowSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: [
                                    {
                                        text: 'Ordem do Serviço\n',
                                        fontSize: 9
                                    },
                                    {
                                        text: pedido['MOVIMENTOS_NUMERO'],
                                        fontSize: 35
                                    }
                                ],
                                bold: true,
                                alignment: 'center',
                                rowSpan: 2,
                                colSpan: 4,
                                border: [true, true, true, true]
                            },
                            {},{},{}
                        ]);
    
                        rows.push([
                            {},{},
                            {
                                text: [
                                    {
                                        text: 'A\n',
                                        fontSize: 3,
                                        color: 'white'
                                    },
                                    {
                                        text: 'Turno: ' + (
                                            turnoEntrega == 'M' ? 'Manhã' :
                                            turnoEntrega == 'T' ? 'Tarde' :
                                            turnoEntrega == 'N' ? 'Noite' : ''
                                        )
                                    },
                                    {
                                        text: '\nA',
                                        fontSize: 4,
                                        color: 'white'
                                    }
                                ],
                                bold: true,
                                fontSize: 12,
                                border: [true, true, true, true]
                            },{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Nome',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: pedido['MOVIMENTOS_NOME'],
                                colSpan: 4,
                                border: [true, true, true, true],
                                bold: true
                            },{},{},{},
                            {
                                text: 'Celular',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: utils.string.maskFone(pedido['MOVIMENTOS_CELULAR']),
                                colSpan: 3,
                                border: [true, true, true, true],
                                bold: true
                            },{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Endereço',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: pedido['PESSOAS_ENDERECO'] + ', ' + pedido['PESSOAS_NUMERO'],
                                colSpan: 4,
                                border: [true, true, true, true],
                                bold: true
                            },{},{},{},
                            {
                                text: 'Telefone',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: utils.string.maskFone(pedido['PESSOAS_TELEFONE']),
                                colSpan: 3,
                                border: [true, true, true, true],
                                bold: true
                            },{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Bairro',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: pedido['PESSOAS_BAIRRO'],
                                colSpan: 4,
                                border: [true, true, true, true],
                                bold: true
                            },{},{},{},
                            {
                                text: 'Cidade',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: (pedido['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. '),
                                colSpan: 2,
                                border: [true, true, true, true],
                                bold: true
                            },{},
                            {
                                text: pedido['CIDADES_ESTADO'],
                                border: [true, true, true, true],
                                bold: true
                            }
                        ]);
    
                        rows.push([
                            {
                                text: 'A',
                                color: 'white',
                                fontSize: 2,
                                colSpan: 9,
                                border: [false, true, false, true],
                                bold: true
                            },{},{},{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'Código',
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },
                            {
                                text: 'Descrição do Produto',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },{},
                            {
                                text: 'Cor',
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },
                            {
                                text: 'Qt',
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },
                            {
                                text: 'Filial',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },{},
                            {
                                text: 'Executado',
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center',
                                bold: true
                            },{}
                        ]);
    
                        itens.forEach(item => {
                            contadorItens++;

                            rows.push([
                                {
                                    text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: (item['PRODUTOS_NOME'] || '').substr(0, 45),
                                    colSpan: 2,
                                    fontSize: 9,
                                    border: [true, true, true, true]
                                },{},
                                {
                                    text: item['PRODUTOS_MARCA'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                    border: [true, true, true, true],
                                    fontSize: 9,
                                    alignment: 'center'
                                },
                                {
                                    text: item['EMPRESAS_FANTASIA'],
                                    fontSize: 9,
                                    colSpan: 2,
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },{},
                                {
                                    text: (status == 'E' || status == 'F') ? 'X' : '',
                                    colSpan: 2,
                                    fontSize: 9,
                                    border: [true, true, true, true],
                                    alignment: 'center'
                                },{}
                            ]);
                        });
    
                        rows.push([
                            {
                                text: 'RECEBI(EMOS) OS PRODUTOS DO COMPROVANTE DE ENTREGA ACIMA EM PERFEITAS CONDICOES',
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
                                text: 'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR\n\n\n',
                                border: [true, true, true, true],
                                fontSize: 9,
                                colSpan: 7
                            },{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                image: 'data:image/png;base64,' + barcodes[index],
                                width: 130,
                                height: 39,
                                colSpan: 9,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);
    
                        rows.push([
                            {
                                text: 'A\n',
                                color: 'white',
                                fontSize: 8,
                                colSpan: 9,
                                border: [false, false, false, false],
                                bold: true
                            },{},{},{},{},{},{},{},{}
                        ]);
                        
                        rows.push([
                            {
                                text: 'Valor Partida',
                                border: [false, false, false, false],
                                colSpan: 2
                            },{},
                            {
                                text: utils.number.float2moeda(pedido['MOVIMENTOS_IMPOSTO']),
                                border: [false, false, false, false],
                                bold: true
                            },
                            {
                                text: 'Visto Gerente _________________________________________',
                                border: [false, false, false, false],
                                colSpan: 6
                            },
                            {},{},{},{},{}
                        ]);	
    
                        rows.push([
                            {
                                text: 'A\n',
                                color: 'white',
                                fontSize: 5,
                                colSpan: 9,
                                border: [false, true, false, false]
                            },{},{},{},{},{},{},{},{}
                        ]);	

                        if(contadorPedidos == 1) {
                            const proximoPedido = pedidos[index + 1];

                            if(proximoPedido && contadorItens + proximoPedido['MOVIMENTOS_ITENS'].length > 13) {
                                //pular um bloco e pular para próxima pagina
                                const linhasRestantes = 13 - contadorItens;

                                const text = Array.from({length: parseInt(linhasRestantes * 1.5)}, (v, k) => k).reduce((str, index) => {
                                    return str + '\n';
                                }, 'A');

                                rows.push([
                                    {
                                        text: text,
                                        color: 'white',
                                        fontSize: 9,
                                        colSpan: 9,
                                        border: [false, false, false, false]
                                    },{},{},{},{},{},{},{},{}
                                ]);	

                                rows.push([
                                    {
                                        text: 'A\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n',
                                        color: 'white',
                                        fontSize: 7,
                                        colSpan: 9,
                                        border: [false, false, false, false]
                                    },{},{},{},{},{},{},{},{}
                                ]);	

                                title(rows);

                                contadorPedidos = 0;
                                contadorItens   = 0;
                            }
                        } else if(contadorPedidos == 2) {
                            //pular para próxima pagina
                            const proximoPedido = pedidos[index + 1];
                            const linhasRestantes = 13 - contadorItens;

                            const text = Array.from({length: linhasRestantes}, (v, k) => k).reduce((str, index) => {
                                return str + '\n';
                            }, 'A');

                            rows.push([
                                {
                                    text: linhasRestantes ? text : '',
                                    color: 'white',
                                    fontSize: 10,
                                    colSpan: 9,
                                    border: [false, false, false, false]
                                },{},{},{},{},{},{},{},{}
                            ]);	

                            if(proximoPedido){
                                title(rows);
                            }

                            contadorPedidos = 0;
                            contadorItens   = 0;
                        }
                    });

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

const title = function(rows) {
    rows.push([
        {
            text: 'COMPROVANTE DE ENTREGA\n',
            fontSize: 26, 
            border: [false, false, false, false],
            bold: true,
            colSpan: 9,
            color: 'red',
            alignment: 'center'
        },{},{},{},{},{},{},{},{}
    ]);

    rows.push([
        {
            text: 'A',
            color: 'white',
            fontSize: 2,
            colSpan: 9,
            border: [false, false, false, false],
            bold: true
        },{},{},{},{},{},{},{},{}
    ]);
};

const getBarcode = function(pedidos) {
    return new Promise((resolve, reject) => {
        const barcodes = pedidos.map(pedido => {
            const code = completeChars(pedido['MOVIMENTOS_ID_EMPRESAS'], 2) + completeChars(pedido['MOVIMENTOS_NUMERO'], 6);
            return codes.create('code39', code).toString("base64");
        });

        resolve(barcodes);
    });
};

const completeChars = function (str, chars, char = '0', direction = 'left') {
    var str = (str && str.toString) ? str.toString() : '',
        nCharsToComplete = chars - str.length;

    for (var i = 0; i < nCharsToComplete; i++) {
        if(direction == 'left'){
            str = char + str;
        } else if(direction == 'rigth'){
            str = str + char;
        } 
    }

    return str;
}