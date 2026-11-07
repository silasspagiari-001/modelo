'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getMovimentos = async function(params){
	try {
		const { 
			empresa, 
			documento, 
			nomedocumento, 
			numero, 
			filtravendedor,
			pessoa, 
			movimentosnome, 
			nfe,
			operacao,
			inicio, 
			final, 
			tipo,
			ordem, 
			status, 
			situacao, 
			start, 
			limit,
			userId
		} = params;

		const isTransferencia = nomedocumento.match(/Transfer/);
		const isNotaEntrada   = nomedocumento.match(/Entrada/);
		const isPedidoCompra  = nomedocumento.match(/Compra/);
		const idDocumento     = rightIdDocumento(nomedocumento);
		const buscaPorComanda = (numero || '').toString().toUpperCase().charAt(0) == 'C';

		let sqlEmpresa = '';
		let sqlDocumento = '';
		let sqlIdDocumento = '';

		if(isTransferencia) {
			sqlEmpresa = empresa ? `and (MOVIMENTOS_ID_EMPRESAS = ${empresa} or (MOVIMENTOS_ID_OPERACOES = 710000 and MOVIMENTOS_ID_PESSOAS = ${empresa})) ` : '';
			sqlDocumento = ` and (right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0007' or 
								  right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '0016') `
		} else {
			sqlDocumento   = documento   ? `and MOVIMENTOS_ID_DOCUMENTOS = ${documento} ` : '';
			sqlIdDocumento = idDocumento ? `and right(MOVIMENTOS_ID_DOCUMENTOS, 4) = '${idDocumento}' ` : '';
			sqlEmpresa     = empresa     ? `and MOVIMENTOS_ID_EMPRESAS   = ${empresa}   ` : '';
		}            
		const limits = (start >= 0 && limit >= 0) ? `first ${limit} skip ${start} ` : '';
		
		let sqlOrder = '';

		let sqlVendedor = filtravendedor == 'true' ? ` and MOVIMENTOS_ID_USUARIOS = ${userId} ` : '';
		let sqlStatus = status == 19 ? ` and ((MOVIMENTOS_STATUS = 'X') or (MOVIMENTOS_STATUS = 'Z')) `
									 : ` and MOVIMENTOS_STATUS <> 'X' and MOVIMENTOS_STATUS <> 'Z' `

		let sqlWhere = `where MOVIMENTOS_ID > 0 ${sqlEmpresa} ${sqlDocumento} ${sqlIdDocumento} ${sqlVendedor} ${sqlStatus}`;
			
		if(operacao) {
			sqlWhere += ` and MOVIMENTOS_ID_OPERACOES = ${operacao} `;
		}

		if(tipo && tipo > 0) {  // Filtro Vtex
			if(tipo == 1) {
				sqlWhere += ` and MOVIMENTOS_PROTOCOLO = ''`;
			} else {
				sqlWhere += ` and MOVIMENTOS_PROTOCOLO <> ''`;
			}
		}

		if(numero) {
			if(buscaPorComanda) {
				sqlWhere += ` and COMANDAS_NUMERO = '${numero.slice(1, Infinity)}' `;
				sqlOrder = ` order by MOVIMENTOS_NFE `;
			} else if(numero.toString().length > 15) {
				sqlWhere += ` and MOVIMENTOS_NFE = '${numero}'`;
				sqlOrder = ` order by MOVIMENTOS_NFE `;
			} else if(/[0-9]{8}/.test(numero) && !isNotaEntrada) {
				sqlWhere += ` and MOVIMENTOS_ID_EMPRESAS = ${parseInt(numero.toString().slice(0,2))} 
							  and MOVIMENTOS_NUMERO      = ${parseInt(numero.toString().slice(2,8))}  
							  and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E') 
							  and (
								select count(*) from ROMANEIOSITENS where ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID
							  ) = 0 `;
				sqlOrder = ` order by MOVIMENTOS_NUMERO `; 
			} else {
				sqlWhere += ` and MOVIMENTOS_NUMERO = ${(numero || '').replace(/\D/ig, '')}`;
				sqlOrder = ` order by MOVIMENTOS_NUMERO `;  
				if (status == 11){
					//traz os faturados, que ainda não estão em Romaneio de Entrega
					sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
								  ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is null `; 
				}  
				if(status == 12) {
					//traz os faturados, que ainda não estão em Romaneio de Montagem mas tem romaneio de entrega
					sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
						(
							select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
							join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
							join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
							where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
								MOVIMENTOSITENS_CSTPIS <> 'ML'
						) > 0 and
						ROMMONTAGEM.ROMANEIOSITENS_ID_ROMANEIOS is null and
						ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is not null`;
				}
			}
		} else {
			if(pessoa > 0) {
				sqlWhere += ` and MOVIMENTOS_ID_PESSOAS = '${pessoa}' `; 
			} else if(movimentosnome) {
				sqlWhere += ` and MOVIMENTOS_NOME like '${movimentosnome}%' `; 
			} else if(nfe) {
				sqlWhere += ` and MOVIMENTOS_NFE = '${nfe}' `; 
			}
			
			if (inicio && final && inicio.length > 0 && final.length > 0) {
				if (ordem == 3) { // Entrada/Saida
					sqlWhere += ` and MOVIMENTOS_ENTRADASAIDA between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
				} else {
					sqlWhere += ` and MOVIMENTOS_EMISSAO between '${inicio.replace (/\//ig,'.')}' and '${final.replace (/\//ig,'.')}' `;
				}
			}

			if(ordem == 0) {
				sqlOrder = ` order by MOVIMENTOS_ID_EMPRESAS,MOVIMENTOS_ID_DOCUMENTOS,MOVIMENTOS_EMISSAO,MOVIMENTOS_ID `;
			} else if (ordem == 1) {
				sqlOrder = ` order by MOVIMENTOS_ID_PESSOAS, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID`;
			} else if (ordem == 2) {
				sqlOrder = ` order by MOVIMENTOS_NUMERO `;
			} else if (ordem == 3) {
				sqlOrder = ` order by MOVIMENTOS_ENTRADASAIDA, MOVIMENTOS_ID_EMPRESAS, MOVIMENTOS_ID `;
			} else if (ordem == 4) {
				sqlOrder = ` order by MOVIMENTOS_NFE `;                    
			}

			if(situacao) {
				sqlWhere += ` and MOVIMENTOS_SITUACAO = '${situacao}' `;
			}

			if(isPedidoCompra && status != 6 && status != 9) {
				sqlWhere += ` and MOVIMENTOS_SITUACAO <> 'A' `;
			}

			if(status == 0) {//movimentos sem caixa
				sqlWhere += ` and ((MOVIMENTOSCAIXA_ID is null) or (MOVIMENTOSCAIXA_ID = 0)) `; 
			} else if(status == 1) {
				sqlWhere += ` and (MOVIMENTOS_STATUS = 'N' or MOVIMENTOS_STATUS = 'M') `; 
			} else if(status == 2) {
				sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E') `; 
			} else if(status == 3) {
				sqlWhere += ` and (MOVIMENTOS_STATUS = 'C' or MOVIMENTOS_STATUS = 'B') `; 
			} else if(status == 4) {
				sqlWhere += ` and MOVIMENTOS_STATUS = 'G' `; 
			} else if(status == 5) {
				sqlWhere += ` and ((MOVIMENTOS_NUMEROORIGEM is null) or (MOVIMENTOS_NUMEROORIGEM = 0)) `; 
			} else if(status == 7) {
				sqlWhere += ` and MOVIMENTOS_STATUS = 'D' `; 
			} else if(status == 8) {
				sqlWhere += ` and MOVIMENTOS_SITUACAO = 'P' `; 
			} else if(status == 9) {
				sqlWhere += ` and MOVIMENTOS_SITUACAO = 'A' `; 
			} else if(status == 10) {
				sqlWhere += ` and MOVIMENTOS_SITUACAO = 'R' `; 
			} else if (status == 11){
				//traz os faturados, que ainda não estão em Romaneio de Entrega
				sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
							  ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is null`;                    
			} else if (status == 12){
				//traz os faturados, que ainda não estão em Romaneio de Montagem mas estão em romaneio de Entrega
				sqlWhere += ` and (MOVIMENTOS_STATUS = 'F' or MOVIMENTOS_STATUS = 'E')  and
					(
						select sum(MONTAGENS_VALOR) from MOVIMENTOSITENS
						join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
						join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
						where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
							  MOVIMENTOSITENS_CSTPIS <> 'ML'
					) > 0 and
					ROMMONTAGEM.ROMANEIOSITENS_ID_ROMANEIOS is null and
					ROMENTREGA.ROMANEIOSITENS_ID_ROMANEIOS is not null`;
			} else if(status == 13){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'S' `; 
			} else if(status == 14){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'P' `; 
			} else if(status == 15){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'I' `; 
			} else if(status == 16){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'Q' `; 
			} else if(status == 17){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'R' `;   // Recusa (Manifestação)
			} else if(status == 18){
				sqlWhere += ` and MOVIMENTOS_STATUS = 'V' `;   // Devoluçao
			}
		}
				
		const sqlCount  = `select count(MOVIMENTOS_ID) from MOVIMENTOS
				left outer join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
				${
					buscaPorComanda ? 
						`left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
					: ''
				}
				${
					(status == 11 || status == 12) ? 
						`left outer join ROMANEIOSITENS as ROMENTREGA  on ROMENTREGA.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMENTREGA.ROMANEIOSITENS_STATUS = 'E'
						 left outer join ROMANEIOSITENS as ROMMONTAGEM on ROMMONTAGEM.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMMONTAGEM.ROMANEIOSITENS_STATUS = 'M' `
					: ''
				}
				${
					status == 12 
					? ` left join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						left join PRODUTOS        on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS` 
					: ''
				}
			${sqlWhere}`;
			
		const sqlSearch = `
			select ${limits}
				MOVIMENTOS_ID, 
				MOVIMENTOS_ID_EMPRESAS, 
				MOVIMENTOS_ID_DOCUMENTOS,
				EMPRESAS_ID_CIDADES,
				MOVIMENTOS_ID_PESSOAS,
				MOVIMENTOS_ID_PROPRIEDADES,
				PESSOAS_ID_CIDADES,
				PESSOAS_FANTASIA,
				MOVIMENTOS_CELULAR,
				CIDADES.CIDADES_NOME,
				CIDADES.CIDADES_ESTADO,
				CIDADESPROPRIEDADE.CIDADES_NOME   as CIDADES_NOMEPROPRIEDADE,
				CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
				iif(MOVIMENTOS_SERIE = 'TRS', PESSOAS_FANTASIA, EMPRESAS_FANTASIA) as DESTINO_FANTASIA,
				MOVIMENTOS_NUMERO,
				MOVIMENTOS_SERIE,
				MOVIMENTOS_STATUS,
				MOVIMENTOS_SITUACAO,
				MOVIMENTOS_EMISSAO,
				MOVIMENTOS_ENTRADASAIDA,
				USUARIOS_LOGIN,
				MOVIMENTOS_NOME,
				MOVIMENTOS_CPFCNPJ,
				MOVIMENTOS_TOTAL,
				MOVIMENTOS_IMPOSTO,
				MOVIMENTOS_BASEICMS,
				MOVIMENTOS_VALORICMS,
				MOVIMENTOS_BASEST,
				MOVIMENTOS_VALORST,
				MOVIMENTOS_VALORIPI,
				MOVIMENTOS_FRETE,
				MOVIMENTOS_SEGURO,
				MOVIMENTOS_DESPESAS,
				MOVIMENTOS_DESCONTOS,
				MOVIMENTOS_PRODUTOS,
				MOVIMENTOS_NFE,
				MOVIMENTOS_PROTOCOLO,
				MOVIMENTOS_ID_OPERACOES,
				MOVIMENTOS_NUMEROORIGEM,
				MOVIMENTOS_SERIEORIGEM,
				EMPRESAS_FANTASIA,
				EMPRESAS_NOME
				${
					status == 12
					? `, cast ((
							select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
							join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
							join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
							where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
								  MOVIMENTOSITENS_CSTPIS <> 'ML'
						) as numeric(12,2)) as MONTAGENS_VALOR ` 
					: ''
				}${
					status == 11 || status == 12
					? `, (
						iif((select count(*) from MOVIMENTOSITENS
							where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
								  MOVIMENTOSITENS_DEPOSITO = 0) = 0, 'T', 'F')
					) as RESERVAS_STATUS ` 
					: ''
				}
			from MOVIMENTOS 
				left join USUARIOS        on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
				join EMPRESAS             on EMPRESAS_ID   = MOVIMENTOS_ID_EMPRESAS
				left join MOVIMENTOSCAIXA on MOVIMENTOS_ID = MOVIMENTOSCAIXA_ID_MOVIMENTOS
				${
					buscaPorComanda ? 
						`left outer join COMANDAS on MOVIMENTOS_ID = COMANDAS_ID_MOVIMENTOS `
					: ''
				}
				${
					(status == 11 || status == 12) ? 
						`left outer join ROMANEIOSITENS as ROMENTREGA  on ROMENTREGA.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMENTREGA.ROMANEIOSITENS_STATUS = 'E'
						 left outer join ROMANEIOSITENS as ROMMONTAGEM on ROMMONTAGEM.ROMANEIOSITENS_ID_MOVIMENTOS = MOVIMENTOS.MOVIMENTOS_ID and ROMMONTAGEM.ROMANEIOSITENS_STATUS = 'M' `
					: ''}
				left join PESSOAS         on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
				left join PROPRIEDADES    on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
				left join CIDADES         on CIDADES_ID      = PESSOAS_ID_CIDADES
				left outer join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES 
				${
					status == 12 
					? ` left join MOVIMENTOSITENS on MOVIMENTOS_ID = MOVIMENTOSITENS_ID_MOVIMENTOS
						left join PRODUTOS        on PRODUTOS_ID   = MOVIMENTOSITENS_ID_PRODUTOS
						left join MONTAGENS       on MONTAGENS_ID  = PRODUTOS_ID_MONTAGENS` 
					: ''
				}
			${sqlWhere} ${sqlOrder}`; 

		const total = await samosFB.count(sqlCount, params);
		const movimentos = await samosFB.executeSQL(sqlSearch, params);
		
		const somaMovimentos = (movimentos.length && params.client.toUpperCase().match(/prudenmoveis|stilo/ig)) ? 0 : await obterSomaMovimentos(sqlWhere, params);

		await Promise.all(movimentos.map(async movimento => {
			const sqlRomaneios = `execute block
				returns (
					MOVIMENTOSITENS_ID integer,
					MOVIMENTOSITENS_ID_PRODUTOS integer,
					PRODUTOS_NOME varchar(100),
					MOVIMENTOSITENS_QUANTIDADE numeric(14,3),
					MOVIMENTOSITENS_IMEDIATA numeric(14,3),                                                
					MOVIMENTOSITENS_ENTREGUE numeric(14,3),
					MOVIMENTOSITENS_DEPOSITO numeric(14,3),
					MOVIMENTOSITENS_EMROMANEIO numeric(14,3),
					ITENS_ENTREGAR numeric(14,3))
				as
				begin
				for
					select MOVIMENTOSITENS_ID,
						MOVIMENTOSITENS_ID_PRODUTOS,
						PRODUTOS_NOME,
						MOVIMENTOSITENS_QUANTIDADE,
						MOVIMENTOSITENS_IMEDIATA,
						MOVIMENTOSITENS_ENTREGUE,
						MOVIMENTOSITENS_DEPOSITO
					from MOVIMENTOSITENS
					left join PRODUTOS on PRODUTOS_ID = MOVIMENTOSITENS_ID_PRODUTOS
					where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}
					order by MOVIMENTOSITENS_ID
					into :MOVIMENTOSITENS_ID,
							:MOVIMENTOSITENS_ID_PRODUTOS,
							:PRODUTOS_NOME,
							:MOVIMENTOSITENS_QUANTIDADE,
							:MOVIMENTOSITENS_IMEDIATA,
							:MOVIMENTOSITENS_ENTREGUE,
							:MOVIMENTOSITENS_DEPOSITO
				do
					begin
					select sum(ROMANEIOSITENS_QUANTIDADE) from ROMANEIOSITENS
					where ROMANEIOSITENS_ID_ITEM = :MOVIMENTOSITENS_ID
					into
						:MOVIMENTOSITENS_EMROMANEIO;
					if (MOVIMENTOSITENS_EMROMANEIO is null) then MOVIMENTOSITENS_EMROMANEIO = 0;
					MOVIMENTOSITENS_EMROMANEIO = (MOVIMENTOSITENS_EMROMANEIO + MOVIMENTOSITENS_ENTREGUE + MOVIMENTOSITENS_DEPOSITO);
					ITENS_ENTREGAR = (MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_EMROMANEIO);
					if (ITENS_ENTREGAR > 0) then suspend;
					end
				end;`;

			movimento['MOVIMENTOS_ROMANEIOS'] = await samosFB.executeSQL(sqlRomaneios, params);
			movimento['TOTAL_MOVIMENTOS'] = somaMovimentos;

			if(movimento['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
				movimento['CIDADES_NOME'] = movimento['CIDADES_NOMEPROPRIEDADE'];
				movimento['CIDADES_ESTADO'] = movimento['CIDADES_ESTADOPROPRIEDADE'];
			}

			if(movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003' &&   // Corrige Status de notas enviadas
			   movimento['MOVIMENTOS_STATUS'] == 'N' &&
			   movimento['MOVIMENTOS_NFE'] != '' &&
			   movimento['MOVIMENTOS_PROTOCOLO'] != '') {
			   movimento['MOVIMENTOS_STATUS'] = 'F';
			}
		}))

		return { results: movimentos, total };

	} catch(error) {
		const msg = 'Falha ao buscar movimento';
		console.log(msg);
		console.log(error);
		throw { msg, error };
	}
}

module.exports = {
    read: params => {
		let docDefinition = {
			content: [
				{
					style: 'tableReport',
					table: {
						widths: [50, 50, '*','*', 40, 50, 70],
						body: []
					}
				}
			],
			styles: {
				tableReport: {
					margin: [10, 10, 10, 10],
					border: 0.5
				}
			}
		};

        return new Promise(async (resolve, reject) => {
			getMovimentos(params)
				.then(res => {
					let rows = docDefinition.content[0].table.body;
					let model = res.results[0];
					let produtos = model['MOVIMENTOS_ITENS'];

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}

					rows.push(
						[
							{
								image: pathLogo,
								colSpan: 2,
								width: 100
							}, 
							{},
							{
								text: '\n' + model['DOCUMENTOS_NOME'].toUpperCase(),
								colSpan: 3,									
								alignment: 'center',
								style: {
									bold: true,
									fontSize: 16
								}
							}, 
							{}, 
							{},
							{
								colSpan: 2,									
								text: [
									{
										text: 'N.º\n\n', 
										fontSize: 10, 
										alignment: 'center'
									},
									{
										text: model['MOVIMENTOS_NUMERO'],  
										fontSize: 20, 
										alignment: 'center',
										style: {
											bold: true,
											fontSize: 16
										}
									}
								]
							}, 
							{}
						],
						[
							{
								text: 'Nome'
							},
							{
								text: model['MOVIMENTOS_NOME'],
								colSpan: 4
							}, 
							{}, 
							{}, 
							{},
							{
								text: 'Data'
							},
							{
								text: moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')
							}
						],
						[
							{ 
								text: '\n', 
								colSpan: 7,									
								border: [false, false, false, false]
							}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}
						],
						[
							{
								text: 'Código',
								style: {
									bold: true
								}
							},
							{
								text: 'Descrição',
								colSpan: 3,									
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{
								text: 'Qtde',
								style: {
									bold: true
								}
							},
							{
								text: 'Preço',
								style: {
									bold: true
								}
							},
							{
								text: 'Total',
								style: {
									bold: true
								}
							}
						]
					);

					for(let i in produtos){
						rows.push([
							{
								text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],
								alignment: 'right'
							},
							{
								text: produtos[i]['PRODUTOS_NOME'],
								colSpan: 3
							}, 
							{}, 
							{},
							{
								text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
								alignment: 'right'
							},
							{
								text: produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).replace('.',','),
								alignment: 'right'
							},
							{
								text: (produtos[i]['MOVIMENTOSITENS_QUANTIDADE'] * produtos[i]['MOVIMENTOSITENS_PRECO']).toFixed(2).replace('.',','),
								alignment: 'right'
							}
						]);
					}

					rows.push(
						[
							{ 
								text: '\n', 
								colSpan: 7,									
								border: [false, false, false, false]
							}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}, 
							{}
						],
						[
							{
								text: 'Observações',
								fontSize: 10,							
								border: [true, true, true, false],							
								colSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Frete',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_FRETE'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{
								text: model['MOVIMENTOS_OBSERVACOES'] || '',
								border: [true, false, true, true],							
								colSpan: 5,
								rowSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Despesas',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_DESPESAS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Seguro',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_SEGURO'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Descontos',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_DESCONTOS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Produtos',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_PRODUTOS'].toFixed(2).replace('.',','),
								alignment: 'right'
							}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{
								text: 'Total',
								fontSize: 10,							
								style: {
									bold: true
								}
							}, 
							{
								text: model['MOVIMENTOS_TOTAL'].toFixed(2).replace('.',','),
								alignment: 'right',							
								style: {
									bold: true
								}
							}
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