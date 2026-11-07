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
			api.empresas().read(params)
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
										text: 'CADASTRO DE EMPRESAS',
									}
								],
                                colSpan: 4,
                                alignment: 'center',
                                style: {fontSize: 14}               
                            },{},{},{}
                        ],
                        [
                            {
                                text: 'Código: ' + model['EMPRESAS_ID']
                            },
                            {
                                text: (model['EMPRESAS_CPFCNPJ'].length == 11 ? "CPF: " : "CNPJ: ") + utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']),
                                alignment: 'left'
                            },
                            {
                                text: (model['EMPRESAS_CPFCNPJ'].length == 11 ? "RG: " : "I.E.: ") + utils.string.maskCnp(model['EMPRESAS_INSCRICAO']),
                                alignment: 'left'
                            },							
                            {
								text: 'Fone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE'])
                            },
                            {
								text: 'Celular: ' + utils.string.maskFone(model['EMPRESAS_CELULAR'])
                            }
						],
                        [
                            {
								text: 'Razão Social: ' + model['EMPRESAS_NOME'],
								colSpan: 3
                            },{},{},
                            {
								text: 'Fantasia: ' + model['EMPRESAS_FANTASIA'],
								colSpan: 2
                            },
                            {}
						],
                        [
                            {
								text: 'CEP: ' + model['EMPRESAS_CEP'].substr(0, 5) + '-' + model['EMPRESAS_CEP'].substr(5, 3),
                            },{
								text: 'Endereço: ' + model['EMPRESAS_ENDERECO'],
								colSpan: 3
							},{},{},
                            {
                                text: 'Número: ' + model['EMPRESAS_NUMERO']
                            }
						]);
                        rows.push([
                            {
								text: 'Bairro: ' + model['EMPRESAS_BAIRRO'],
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
								text: 'Complemento: ' + model['EMPRESAS_PAGINA'],
								colSpan: 2
							},{},
							{
								text: 'E-mail: ' + model['EMPRESAS_EMAIL'],
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