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
			api.assistencias().read(params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 35],
						content: [
							{
								style: 'tableReport',
								table: {
									widths: [70, 60, 90, 100, 90, 90], // 6 colunas
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
										text: 'ASSISTÊNCIA TÉCNICA'
									}
								],
                                colSpan: 5,
                                alignment: 'center',
                                style: {fontSize: 14}               
                            },{},{},{},{}
                        ],
                        [
                            {
                                text: 'Código: ' + model['PESSOAS_ID'],
                            },
                            {
                                text: (model['PESSOAS_CPFCNPJ'].length == 11 ? "CPF: " : "CNPJ: ") + utils.string.maskCnp(model['PESSOAS_CPFCNPJ']),
                                alignment: 'left',
								colSpan: 2
                            },{},
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
								colSpan: 4
                            },{},{},{},
                            {
                                text: 'Fone: ' + utils.string.maskFone(model['PESSOAS_TELEFONE'])
                            },
                            {
                                text: 'Celular: ' + utils.string.maskFone(model['PESSOAS_CELULAR'])
                            }
						],
                        [
                            {
                                text: 'LOCAL DA ASSISTÊNCIA ',
                                colSpan: 6,
                                alignment: 'left',
								style: {fontSize: 10},
								border: [false, false, false, false]
                            },{},{},{},{},{}
						],
                        [
                            {
								text: 'CEP: ' + model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
                            },
							{
								text: 'Endereço: ' + model['PESSOAS_ENDERECO'],
								colSpan: 4
							},{},{},{},
                            {
                                text: 'Número: ' + model['PESSOAS_NUMERO']
                            }
						],
                        [
                            {
								text: 'Bairro: ' + model['PESSOAS_BAIRRO'],
								colSpan: 3
							},{},{},
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
                                text: 'DESCRIÇÃO DA ASSISTÊNCIA TÉCNICA',
                                colSpan: 6,
                                alignment: 'left',
								style: {fontSize: 10},
								border: [false, false, false, true]
                            },{},{},{},{},{}
						]
                    );

					rows.push(
						[
							{
								text: model['ORDENS_OBSERVACOES'],
								colSpan: 6,
								alignment: 'left',
								style: {fontSize: 10},
								border: [true, false, true, false]
							},{},{},{},{},{}
						]	
					)

					rows.push(
						[
							{
								text: '',
								colSpan: 6,
								alignment: 'left',
								style: {fontSize: 10},
								border: [true, false, true, true]
							},{},{},{},{}
						]	
					)

					rows.push(
						[
							{ 
								text: '\n', 
								style: {
									bold: true,
									fontSize: 6
								},
								colSpan: 6,
								border: [false, false, false, false]
							}, 
							{},{},{},{},{}
						],	
						[  
							{
								text: 'RECEBI(EMOS) OS PRODUTOS CONSTANTES DA ASSISTÊNCIA TÉCNICA ACIMA, EM PERFEITAS CONDIÇÕES.',
								fontSize: 6,
								alignment: 'left',
								colSpan: 6
							},{},{},{},{},{}
						],
						[  
							{
								text: [
									{
										text: 'DATA DO RECEBIMENTO\n\n',
										fontSize: 7,
										alignment: 'left',		
									},
									{
										text: [
											{ text: 'AAA', color: 'white', fontSize: 18 },
											{ text: '/', fontSize: 18 },
											{ text: 'AAA', color: 'white', fontSize: 18 },											
											{ text: '/', fontSize: 18 }
										]
									}
								],
								colSpan: 2
							},{},
							{
								text: [
									{
										text: 'NOME COMPLETO DO RECEBEDOR E NÚMERO DO DOCUMENTO\n\n',
										fontSize: 7,
										alignment: 'left',
									},
									{
										text: '\n',
										font: 'Consolas',
										fontSize: 14,
										alignment: 'left'
									}
								],				
								colSpan: 4
							},{},{},{}
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