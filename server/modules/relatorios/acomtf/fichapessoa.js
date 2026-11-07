'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getPessoas = async function(params){
	try {
		const { conteudo, ordem, tipo, status, start, limit } = params;
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';

		let sqlWhere = `where PESSOAS_ID > 0 `;
		let sqlOrder = '';
		
		if(conteudo && conteudo.substring(0, 1) == '.') {
			sqlWhere += `and PESSOAS_ID = '${conteudo.replace (/\./ig,'') || 0}' `;
		} else {  
			sqlWhere += status == 0 ? `and PESSOAS_STATUS = 'T' ` : status == 1 ? `and PESSOAS_STATUS = 'F' ` : '';
			
			if(tipo && tipo != 0 && ordem != 6){
				sqlWhere += `and PESSOAS_TIPO = '${tipo}' `;
			}
			
			if(ordem == 0) {
				sqlWhere += `and PESSOAS_NOME like '${conteudo}%' `; 
				sqlOrder = ' order by PESSOAS_NOME ';  
			} else if (ordem == 1) {
				sqlWhere += `and PESSOAS_NOME like '%${conteudo}%' `;
				sqlOrder = ' order by PESSOAS_NOME ';  
			} else if (ordem == 2) {
				sqlWhere += `and PESSOAS_ENDERECO like '%${conteudo}%' `;
				sqlOrder = ' order by PESSOAS_ENDERECO ';  
			} else if (ordem == 3) {
				sqlWhere += `and PESSOAS_EMAIL like '${conteudo}%' `;
				sqlOrder = ' order by PESSOAS_EMAIL ';  
			} else if (ordem == 4) {
				sqlWhere += `and PESSOAS_CPFCNPJ = '${utils.string.onlyNumbers(conteudo)}' `;
				sqlOrder = ' order by PESSOAS_ID ';  
			} else if (ordem == 5) {
				sqlWhere += conteudo > 0 ? `and PESSOAS_ID = '${conteudo}' ` : '';
				sqlOrder = ' order by PESSOAS_ID ';  
			} else if(ordem == 6){
				const id = await samosFB.buscaMultipla({
					conteudo,
					tabela: 'PESSOAS',
					chave: 'PESSOAS_ID',
					campos: [
						'PESSOAS_ID', 
						'PESSOAS_NOME', 
						'PESSOAS_FANTASIA', 
						'PESSOAS_CPFCNPJ', 
						'PESSOAS_INSCRICAO', 
						'PESSOAS_EMAIL'
					],
					where: "PESSOAS_STATUS = 'T'"
				}, params);

				sqlWhere += `and PESSOAS_ID = '${id}' `;
				sqlOrder = ' order by PESSOAS_ID '; 
			} else if (ordem == 7) {
				sqlWhere += `and (
					CIDADES.CIDADES_NOME         like '%${conteudo}%' or
					CIDADESCOBRANCA.CIDADES_NOME like '%${conteudo}%'
				)`;
				sqlOrder = ' order by PESSOAS_NOME ';  
			} else if (ordem == 8) {
				sqlWhere += `and (
					PESSOAS_TELEFONE         like '%${conteudo}%' or 
					PESSOAS_CELULAR          like '%${conteudo}%' or 
					PESSOAS_CELULARCOBRANCA  like '%${conteudo}%'
				) `;
				sqlOrder = ' order by PESSOAS_NOME ';  
			} else if(ordem == 9) {
				sqlWhere += `and PESSOAS_FANTASIA like '%${conteudo}%' `; 
				sqlOrder = ' order by PESSOAS_FANTASIA ';
			}
		}  

		const sqlCount  = `select count(*) from PESSOAS 
				left outer join CIDADES on CIDADES.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
			${sqlWhere} `;

		const sql = `select ${limits} PESSOAS.*, 
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				CIDADES.CIDADES_IBGE,
				CIDADESCOBRANCA.CIDADES_NOME   as CIDADES_NOMECOBRANCA,
				CIDADESCOBRANCA.CIDADES_ESTADO as CIDADES_ESTADOCOBRANCA,
				CIDADESCOBRANCA.CIDADES_IBGE   as CIDADES_IBGECOBRANCA,
				USUARIOS_NOME as USUARIOS_NOMEVENDEDOR,
				USUARIOS_LOGIN as USUARIOS_LOGINVENDEDOR
			from PESSOAS
			left outer join USUARIOS                   on USUARIOS_ID = PESSOAS_ID_USUARIOS
			left outer join CIDADES                    on CIDADES.CIDADES_ID         = PESSOAS.PESSOAS_ID_CIDADES
			left outer join CIDADES as CIDADESCOBRANCA on CIDADESCOBRANCA.CIDADES_ID = PESSOAS.PESSOAS_ID_CIDADESCOBRANCA 
			${sqlWhere} ${sqlOrder}`;

		const total   = await samosFB.count(sqlCount, params);
		const results = await samosFB.executeSQL(sql, params);

		const caminhoFotos = params.client ? `/public/uploads/pessoas/${params.client}/` : `/public/uploads/pessoas/`;

		if (fs.existsSync(`${appRoot}${caminhoFotos}`)) {
			const fotos = await fs.readdirSync(`${appRoot}${caminhoFotos}`);
			
			for(let i in results) {
				const fotoEncontrada = await fotos.find(foto => {
					return foto.split('.').slice(0, -1).join('.') == results[i]['PESSOAS_ID'];
				});

				results[i]['FOTO'] = fotoEncontrada ? 
					`${caminhoFotos}${fotoEncontrada}` : 
					'sem_foto';
			}
		} else {
			for(let i in results) {
				results[i]['FOTO'] = 'sem_foto';
			}
		}

		for (let i in results) {
			try {
				results[i]['XML_AUTOMATICO'] = results[i]['PESSOAS_INCLUSAO'].split('|')[1] || 'F';
				results[i]['PESSOAS_FORMULA'] = JSON.parse(results[i]['PESSOAS_FORMULA']) || [];
				for (let j in results[i]['PESSOAS_FORMULA']) {
					//entra aqui se for preco específico do cliente, não entra no caso da formula de transporte
					if(results[i]['PESSOAS_FORMULA'][j]['ID']) {
						results[i]['PESSOAS_FORMULA'][j]['ID_ITEM'] = (parseInt(j) + 1) * (-1)
						results[i]['PESSOAS_FORMULA'][j]['PRODUTOS_NOME'] = (await samosFB.executeSQL(`
							select PRODUTOS_NOME from PRODUTOS where PRODUTOS_ID = ${results[i]['PESSOAS_FORMULA'][j]['ID']}
						`, params))[0]['PRODUTOS_NOME'];
					}
				}

				results[i]['PESSOAS_FORMULA'] = JSON.stringify(results[i]['PESSOAS_FORMULA'])
			} catch (e) {}
		}

		if((params.propriedades || '').toUpperCase().match(/TRUE/)) { // Tabela de propriedades
			await Promise.all(results.map(async result => {
				const sqlPropriedades = `
						select PROPRIEDADES.*, CIDADES_NOME as CIDADES_NOMEPROPRIEDADE, CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
						(PROPRIEDADES_ENDERECO || ', ' || PROPRIEDADES_NUMERO) as ENDERECO_COMPLETO,
						(CIDADES_NOME || '/' || CIDADES_ESTADO) as CIDADE_COMPLETA
						from PROPRIEDADES
						left outer join CIDADES on CIDADES_ID = PROPRIEDADES_ID_CIDADES
						where PROPRIEDADES_ID_PESSOAS = ${result['PESSOAS_ID']}
						order by PROPRIEDADES_NOME`;
	
				result['PESSOAS_PROPRIEDADES'] = await samosFB.executeSQL(sqlPropriedades, params);
			}))    
		}  
		
		return { results, total }
	} catch(error) {
		const msg = 'Falha ao buscar pessoas';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			getPessoas(params)
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