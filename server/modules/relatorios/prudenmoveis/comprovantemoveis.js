'use strict';  // Comprovante de entrega e montagem na mesma página

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const samosFB   = require('../../../services/samosFirebird');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

const codes = require('rescode');
codes.loadModules(['qrcode']);

module.exports = {
    readById: (id, params) => {
        return new Promise((resolve, reject) => {
			api.movimentos().readById(id, params) 
				.then(async res => {
                    let docDefinition = {
                        pageOrientation: 'portrait',
                        pageSize: 'A4',
                        pageMargins: [20, 20, 20, 20],
                        content: [
                            {columns: [{},{},{},{},{},{},{},{},{}]},  // 9
                            {
                                style: {
                                    margin: [0, 0, 0, 0],
                                },
                                fontSize: 8, 
                                table: { // [45, 65, 135, 39, 37, 40, 53, 35, 19],
                                    widths: [45, 65, 130, 39, 42, 40, 53, 35, 19],
                                    body: []
                                }
                            } 
                        ]
                    };
        
                    const rows = docDefinition.content[1].table.body;

					let model = res.results[0];
                    let linhasEntrega = 0;
                    
                    const qrcodes = await getQrcode(model);
                                  
                    rows.push([
                        {
                            text: 'COMPROVANTE DE ENTREGA\n',
                            fontSize: 18, 
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

                    const itens = model['MOVIMENTOS_ITENS'];
                    const primeiroItem = itens && itens[0] ? itens[0] : {};
                    const dataEntrega = primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] && primeiroItem['MOVIMENTOSITENS_DATAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_DATAENTREGA'] : '';
                    const turnoEntrega = primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] && primeiroItem['MOVIMENTOSITENS_HORAENTREGA'].toString ? primeiroItem['MOVIMENTOSITENS_HORAENTREGA'] : '';
                    const temMontagem = moment(primeiroItem['MOVIMENTOSITENS_DATAMONTAGEM']).isSameOrAfter('2010-01-01');
                    const fantasia = model['EMPRESAS_FANTASIA'];

                    rows.push([
                        {
                            text: [
                                {

                                    text: 'SOLICITAÇÃO\n DE ENTREGA',
                                    fontSize: 12
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
                                    text: 'Agenda: ' + moment(dataEntrega).format('DD/MM/YYYY'),
                                    fontSize: 10,
                                }
                            ],
                            border: [true, true, true, true]
                        },
                        {
                            text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                            alignment: 'center',
                            fontSize: 25,
                            bold: true,
                            colSpan: 2,
                            rowSpan: 2,
                            border: [true, true, true, true]
                        },{},
                        {
                            text: [
                                {
                                    text: model['MOVIMENTOS_NUMERO'],
                                    fontSize: 25,
                                    bold: true
                                }
                            ],
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
                                    text: 'Turno: ' + (
                                        turnoEntrega == 'M' ? 'Manhã' :
                                        turnoEntrega == 'T' ? 'Tarde' :
                                        turnoEntrega == 'N' ? 'Noite' : ''
                                    )
                                }
                            ],
                            fontSize: 10,
                            border: [true, true, true, true]
                        },{},{},{},{},{},{}
                    ]);

                    rows.push([
                        {
                            text: 'Nome',
                            border: [true, true, true, true]
                        },
                        {
                            text: model['MOVIMENTOS_NOME'] + (model['PESSOAS_FANTASIA'].length > 0 ? ` (${model['PESSOAS_FANTASIA']})`: '') + '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ',
                            colSpan: 4,
                            border: [true, true, true, true],
                        },{},{},{},
                        {
                            text: 'Celular',
                            border: [true, true, true, true]
                        },
                        {
                            text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
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
                            text: model['PESSOAS_ENDERECO'] + ', ' + model['PESSOAS_NUMERO'],
                            colSpan: 4,
                            border: [true, true, true, true]
                        },{},{},{},
                        {
                            text: 'Telefone',
                            border: [true, true, true, true]
                        },
                        {
                            text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
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
                            text: model['PESSOAS_BAIRRO'],
                            colSpan: 4,
                            border: [true, true, true, true]
                        },{},{},{},
                        {
                            text: 'Cidade',
                            border: [true, true, true, true]
                        },
                        {
                            text: (model['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                                                                .replace('ALVARES ', 'ALV. ')
                                                                .replace('ÁLVARES ', 'ALV. ')
                                                                .replace('ALFREDO ', 'ALF. ')
                                                                .replace('SANTO ', 'STO. '),                                                                    
                            colSpan: 2,
                            border: [true, true, true, true]
                        },{},
                        {
                            text: model['CIDADES_ESTADO'],
                            border: [true, true, true, true]
                        }
                    ]);

                    rows.push([
                        {
                            text: 'Obs',
                            border: [true, true, true, true]
                        },{
                            text: model['PESSOAS_PAGINA'].toUpperCase(),
                            colSpan: 8,
                            border: [true, true, true, true],
                        },{},{},{},{},{},{},{}
                    ]);


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
                            colSpan: 2,
                            border: [true, true, true, true],
                            alignment: 'center'
                        },{},
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
                            text: 'Filial',
                            colSpan: 3,
                            border: [true, true, true, true],
                            alignment: 'center',
                        },{},{}
                    ]);
    
                    itens.forEach(item => {

                        const descriProduto = item['PRODUTOS_NOME'];

                        rows.push([
                            {
                                text: item['MOVIMENTOSITENS_ID_PRODUTOS'],
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: descriProduto,
                                font: 'Consolas',	
                                fontSize: descriProduto.length > 50 ? 6 : 8,
                                colSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: item['PRODUTOS_MARCA'],
                                colSpan: 2,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},
                            {
                                text: item['MOVIMENTOSITENS_QUANTIDADE'],
                                border: [true, true, true, true],
                                alignment: 'center'
                            },
                            {
                                text: item['EMPRESAS_FANTASIA'],
                                colSpan: 3,
                                border: [true, true, true, true],
                                alignment: 'center'
                            },{},{}
                        ]);
                        linhasEntrega++;

                    });
    
                    rows.push([
                        {
                            text: 'ESTOU CIENTE QUE ESPELHOS, VIDROS E PEDRAS, DEVEM SER CONFERIDOS NESTE ATO, POR SEREM ITENS FRÁGEIS AO MANUSEIO\nRECEBI E CONFERI OS PRODUTOS CONSTANTES DA SOLICITAÇÃO DE ENTREGA ACIMA, ESTANDO TODOS EM PERFEITAS CONDIÇÕES',
                            border: [true, true, true, true],
                            fontSize: 8.7,
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
                        
                    rows.push([
                        {
                            image: 'data:image/png;base64,' + qrcodes,
                            width: 50,
                            height: 50,
                            colSpan: 9,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);
                    
                    rows.push([
                        {
                            text: (completeChars(model['MOVIMENTOS_ID_EMPRESAS'], 2) + completeChars(model['MOVIMENTOS_NUMERO'], 6)).split('').join(' '),
                            bold: true,
                            colSpan: 9,
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);
                    
                    rows.push([
                        {
                            text: 'Valor Partida',
                            border: [false, false, false, false],
                            colSpan: 2
                        },{},
                        {
                            text: utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']),
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
                            border: [false, false, false, false]
                        },{},{},{},{},{},{},{},{}
                    ]);	

                    const filialMestre = model['MOVIMENTOS_ID_EMPRESAS'];

                    const montarAlgo = (itens || []).filter(item => {
                        const montarItem  = item['MOVIMENTOSITENS_CSTPIS'];
                        return montarItem != 'ML';  // Checa se há algo a montar
                    }).filter(item => {
                        const reservaItem  = item['MOVIMENTOSITENS_ID_EMPRESAS'];
                        const valorMontagem = cents(item['MONTAGENS_VALOR'])
                        return reservaItem != filialMestre && valorMontagem > 0;  // Filtra os com reserva local
                    });

                    if(temMontagem && montarAlgo.length > 0) {  // Agora o comprovante de montagem, se tiver... 
                        if(linhasEntrega > 5) {
                            rows.push(
                                [
                                    { 
                                        text: 'a',
                                        color: 'white',
                                        colSpan: 9,
                                        border: [false, false, false, false],
                                        pageBreak: 'before'
                                    },{},{},{},{},{},{},{},{}
    
                                ]
                            );    
                        } else {
                            for (let linhas = linhasEntrega; linhas < 6; linhas++) {
                                rows.push(
                                    [
                                        { 
                                            text: 'a',
                                            color: 'white',
                                            colSpan: 9,
                                            border: [false, false, false, false],
                                        },{},{},{},{},{},{},{},{}
        
                                    ]
                                );    
                            }
                            rows.push(
                                [
                                    { 
                                        text: '- '.repeat(64),
                                        fontSize: 16,
                                        colSpan: 9,
                                        border: [false, false, false, false],
                                    },{},{},{},{},{},{},{},{}
    
                                ]
                            );
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
                                        color: 'darkblue',
                                        bold: true,
                                        alignment: 'center',
                                    }
                                ],
                                colSpan: 3,                                       
                                border: [true, true, true, true]                                                                                        
                            },{},{},
                            {
                                text: ''
                            },
                            {
                                text: fantasia.indexOf('-') != -1 ? fantasia.slice(fantasia.indexOf('-') + 2, Infinity) : fantasia.slice(0, 2),
                                alignment: 'center',
                                fontSize: 25,
                                bold: true,
                                border: [true, true, true, true]
                            },
                            {
                                text: [
                                    {
                                        text: model['MOVIMENTOS_NUMERO'],
                                        fontSize: 22,  //15
                                        bold: true                                        
                                    }
                                ],
                                alignment: 'center',
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{}
                        ]);
                        rows.push([
                            {
                                text: 'Nome',
                                border: [true, true, true, true]
                            },
                            {
                                text: model['MOVIMENTOS_NOME'] + (model['PESSOAS_FANTASIA'].length > 0 ? ` (${model['PESSOAS_FANTASIA']})`: '') + '(' + model['MOVIMENTOS_ID_PESSOAS'] + ') ',
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Celular',
                                border: [true, true, true, true],
                                bold: true
                            },
                            {
                                text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
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
                                text: model['PESSOAS_ENDERECO'] + ', ' + model['PESSOAS_NUMERO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Telefone',
                                border: [true, true, true, true]
                            },
                            {
                                text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
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
                                text: model['PESSOAS_BAIRRO'],
                                colSpan: 4,
                                border: [true, true, true, true]
                            },{},{},{},
                            {
                                text: 'Cidade',
                                border: [true, true, true, true]
                            },
                            {
                                text: (model['CIDADES_NOME'] || '').replace('PRESIDENTE ', 'PRES. ')
                                .replace('ALVARES ', 'ALV. ')
                                .replace('ALFREDO ', 'ALF. ')
                                .replace('SANTO ', 'STO. '),
                                colSpan: 2,
                                border: [true, true, true, true]
                            },{},
                            {
                                text: model['CIDADES_ESTADO'],
                                border: [true, true, true, true]
                            }
                        ]);
    
                        rows.push([
                            {
                                text: 'Obs',
                                border: [true, true, true, true]
                            },
                            {
                                text: model['PESSOAS_PAGINA'].toUpperCase(),
                                colSpan: 8,
                                border: [true, true, true, true],
                            },{},{},{},{},{},{},{}
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
//                            contadorItens++;

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
                                        font: 'Consolas',
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
                                fontSize: 7.8,
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

                    }

                    atualizaStatusImpressao(model['MOVIMENTOS_ID'], params);

					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
	}
};

const getQrcode = function(model) {
    return new Promise((resolve, reject) => {
        const code = completeChars(model['MOVIMENTOS_ID_EMPRESAS'], 2) + completeChars(model['MOVIMENTOS_NUMERO'], 6);        
        const qrcodes = codes.create('qrcode', code).toString("base64");
        resolve(qrcodes);
    });
};

const completeChars = function (str, chars, char = '0', direction = 'left') {
    var str = (str && str.toString) ? str.toString() : '',
        nCharsToComplete = chars - str.length;

    for (var i = 0; i < nCharsToComplete; i++) {
        if(direction == 'left'){
            str = char + str;
        } else if(direction == 'right'){
            str = str + char;
        } 
    }

    return str;
};

const atualizaStatusImpressao = function(pedido, params) {
    return new Promise(async (resolve, reject) => {
        const db = await samosFB.conectarBancoAsync(params.client);

        await db.query(`update MOVIMENTOS set MOVIMENTOS_PROTOCOLO = 'ENTREGA', 
                                              MOVIMENTOS_NFE = 'MOP'
                                            where MOVIMENTOS_ID = ${pedido}`);
    });
};