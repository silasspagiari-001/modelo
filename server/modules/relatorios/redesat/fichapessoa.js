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
        return new Promise(async (resolve, reject) => {
			api.pessoas().read(params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						content: [
							{
								style: 'tableReport',
								table: {
									widths: ['*', '*', '*', '*', '*'],
									heights: 5,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
						],
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					let rows = docDefinition.content[0].table.body;					
					let model = res.results[0];

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${params.empresacnpj}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

                    rows.push(
                        [
							{
								image: pathLogo,
								fit: [100, 100],									
								width: 80,
								alignment: 'center'
							},							
                            {
                                text: [
									{
										text: '\n',
										fontSize: 7
									},
									{
										text: 'CADASTRO DE ' + (params.nometipo ? params.nometipo.toString().toUpperCase() : 'PESSOAS'),
									}
								],
                                colSpan: 4,
                                alignment: 'center',
                                style: {fontSize: 14}               
                            },{},{},{}
                        ],
                        [
                            {
                                text: 'Código: ' + model['PESSOAS_ID']
                            },
                            {
                                text: (model['PESSOAS_CPFCNPJ'].length == 11 ? "CPF: " : "CNPJ: ") + utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
                                alignment: 'left'
                            },
                            {
                                text: (model['PESSOAS_CPFCNPJ'].length == 11 ? "RG: " : "I.E.: ") + utils.string.maskCnp(model['PESSOAS_INSCRICAO']),
                                alignment: 'left'
                            },							
                            {
                                text: 'Cadastro: ' + moment(model['PESSOAS_CADASTRO']).format('DD/MM/YYYY'),
                            },
                            {
                                text: 'Nascimento: ' + moment(model['PESSOAS_NASCIMENTO']).format('DD/MM/YYYY'),
                            }
						],
                        [
                            {
								text: 'Nome: ' + model['PESSOAS_NOME'],
								colSpan: 3
                            },{},{},
                            {
                                text: 'Fone: ' + utils.string.maskFone(model['PESSOAS_TELEFONE'])
                            },
                            {
                                text: 'Celular: ' + utils.string.maskFone(model['PESSOAS_CELULAR'])
                            }
						],
                        [
                            {
                                text: 'ENDEREÇO DE ENTREGA ',
                                colSpan: 5,
                                alignment: 'left',
								style: {fontSize: 10},
								border: [false, false, false, false]
                            },{},{},{},{}
						],
                        [
                            {
								text: 'CEP: ' + model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
                            },{
								text: 'Endereço: ' + model['PESSOAS_ENDERECO'],
								colSpan: 3
							},{},{},
                            {
                                text: 'Número: ' + model['PESSOAS_NUMERO']
                            }
						],
                        [
                            {
								text: 'Bairro: ' + model['PESSOAS_BAIRRO'],
								colSpan: 2
							},{},
							{
								text: 'Município: ' + model['CIDADES_NOME'],
								colSpan: 2
							},{},
                            {
                                text: 'UF: ' + model['CIDADES_ESTADO']
                            }
						],
                        [
                            {
								text: 'Observações: ' + (model['PESSOAS_OBSERVACOES'] || '').replace(/\\n/ig, '\n'),
								colSpan: 5
							},{},{},{},{}
						],
                        [
                            {
                                text: 'ENDEREÇO DE COBRANÇA ',
                                colSpan: 5,
                                alignment: 'left',
								style: {fontSize: 10},
								border: [false, false, false, false]
                            },{},{},{},{}
						],
                        [
                            {
								text: 'CEP: ' + model['PESSOAS_CEPCOBRANCA'].substr(0, 5) + '-' + model['PESSOAS_CEPCOBRANCA'].substr(5, 3),
                            },{
								text: 'Endereço: ' + model['PESSOAS_ENDERECOCOBRANCA'],
								colSpan: 3
							},{},{},
                            {
                                text: 'Número: ' + model['PESSOAS_NUMEROCOBRANCA']
                            }
						],
                        [
                            {
								text: 'Bairro: ' + model['PESSOAS_BAIRROCOBRANCA'],
								colSpan: 2
							},{},
							{
								text: 'Município: ' + model['CIDADES_NOMECOBRANCA'],
								colSpan: 2
							},{},
                            {
                                text: 'UF: ' + model['CIDADES_ESTADOCOBRANCA']
                            }
						],
                        [
                            {
								text: 'Fone: ' + utils.string.maskFone(model['PESSOAS_TELEFONECOBRANCA']),
							},
							{
								text: 'Celular: ' + utils.string.maskFone(model['PESSOAS_CELULARCOBRANCA']),
							},
                            {
								text: 'E-mail: ' + model['PESSOAS_EMAIL'],
								colSpan: 3
                            },{},{}
						]
                    );
					
					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};