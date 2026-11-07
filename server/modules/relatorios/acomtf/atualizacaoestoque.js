'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

const getMovimentoById = async function(id, params){
	try {
		const ids = id.toString().split(',');
		let sqlWhere = ` where `;
		const precoMarkUp = process.env[params.client ? ((params.client || '').toUpperCase() + '_MARKUP') : 'MARKUP'] == 'TRUE';            
		const orcPrazo    = process.env[params.client ? ((params.client || '').toUpperCase() + '_PRAZOORCAMENTO') : 'PRAZOORCAMENTO'] == 'TRUE';
		const pedidoParcial  = process.env[params.client ? ((params.client || '').toUpperCase() + '_PEDIDOPARCIAL') : 'PEDIDOPARCIAL'] == 'TRUE';            
		const sqlMarkup = precoMarkUp ? '(SALDOS_PRECO - round((SALDOS_PRECO * (SALDOS_MARKUP / 100)), 2))': 'SALDOS_PRECOMINIMO';
		
		if(params.empresa && params.numero && params.serie) {
			sqlWhere += ` MOVIMENTOS_ID_EMPRESAS = ${params.empresa} and
						  MOVIMENTOS_NUMERO      = ${params.numero}  and
						  MOVIMENTOS_SERIE       = '${params.serie}' `;
		} else {
			sqlWhere += ids.reduce((result, id) => {
				return result += ` MOVIMENTOS_ID = '${id}' or `
			}, '').slice(0, -3);
		}

		const nomeProduto = params.client.toUpperCase().match(/PRUDENMOVEIS/) ? `(PRODUTOS_NOME || ' ' || PRODUTOS_FABRICA)` : 'PRODUTOS_NOME';   // Na pruden a descrição inclui as dimensões na view 

		const sqlOrder = ` order by MOVIMENTOS_ID `;
		const sqlSearch = `select distinct
			MOVIMENTOS_ID,
			MOVIMENTOS_ID_EMPRESAS,
			EMPRESAS_ID_CIDADES,
			EMPRESAS_NOME,
			EMPRESAS_FANTASIA,
			EMPRESAS_ENDERECO,
			EMPRESAS_NUMERO,
			EMPRESAS_BAIRRO,
			EMPRESAS_CEP,
			EMPRESAS_CPFCNPJ,
			EMPRESAS_INSCRICAO,
			EMPRESAS_MUNICIPAL,
			EMPRESAS_CELULAR,
			EMPRESAS_SIMPLES,
			EMPRESAS_REGIAO12,
			CIDADESEMPRESA.CIDADES_NOME as CIDADES_NOMEEMPRESA,
			CIDADESEMPRESA.CIDADES_ESTADO as CIDADES_ESTADOEMPRESA,
			trim(EMPRESAS_AMBIENTE) as EMPRESAS_AMBIENTE,
			EMPRESAS_TELEFONE,
			EMPRESAS_EMAIL,
			EMPRESAS_PAGINA,
			EMPRESAS_ALIQUOTA,
			MOVIMENTOS_ID_PESSOAS,
			MOVIMENTOS_ID_PROPRIEDADES,
			PESSOAS_NOME,
			PESSOAS_FANTASIA,
			PESSOAS_ENDERECO,
			PESSOAS_NUMERO,
			PESSOAS_BAIRRO,
			PESSOAS_CEP,
			PESSOAS_INSCRICAO,
			PESSOAS_TELEFONE,
			PESSOAS_CELULAR,
			MOVIMENTOS_CELULAR,
			PESSOAS_CREDITO,
			PESSOAS_TIPO,
			PESSOAS_ID_CIDADES,
			PESSOAS_OBSERVACOES,
			PESSOAS_CPFCNPJ,
			PESSOAS_PAGINA,
			PESSOAS_INCLUSAO,
			CIDADES.CIDADES_NOME,
			CIDADES.CIDADES_ESTADO,
			CIDADES.CIDADES_IBGE,
			PROPRIEDADES_ID_PESSOAS,
			PROPRIEDADES_CPFCNPJ,
			PROPRIEDADES_INSCRICAO,
			PROPRIEDADES_NOME,
			PROPRIEDADES_ENDERECO,
			PROPRIEDADES_NUMERO,
			PROPRIEDADES_CEP,
			PROPRIEDADES_BAIRRO,
			PROPRIEDADES_TELEFONE,
			PROPRIEDADES_CELULAR,
			CIDADESPROPRIEDADE.CIDADES_NOME   as CIDADES_NOMEPROPRIEDADE,
			CIDADESPROPRIEDADE.CIDADES_ESTADO as CIDADES_ESTADOPROPRIEDADE,
			CIDADESPROPRIEDADE.CIDADES_IBGE   as CIDADES_IBGEPROPRIEDADE,
			MOVIMENTOS_ID_USUARIOS,
			USUARIOS_NOME,
			USUARIOS_NOME as USUARIOS_NOMEVENDEDOR,
			USUARIOS_LOGIN,
			USUARIOS_CELULAR,
			MOVIMENTOS_ID_APLICACOES,
			APLICACOES_NOME,
			MOVIMENTOS_ID_CUSTOS,
			CUSTOS_NOME,
			MOVIMENTOS_ID_OPERACOES,
			OPERACOES_NOME,
			OPERACOES_ST,
			trim(OPERACOES_UNICA) as OPERACOES_UNICA,
			trim(OPERACOES_TIPO) as OPERACOES_TIPO,
			trim(OPERACOES_ESTOQUE) as OPERACOES_ESTOQUE,
			OPERACOES_ACAO,
			trim(OPERACOES_FINANCEIRO) as OPERACOES_FINANCEIRO,
			trim(OPERACOES_FINALIDADE) as OPERACOES_FINALIDADE,
			trim(OPERACOES_BAIXAVISTA) as OPERACOES_BAIXAVISTA,
			trim(OPERACOES_COMPLEMENTAR) as OPERACOES_COMPLEMENTAR,
			OPERACOES_ID_APLICACOES,
			MOVIMENTOS_ID_PRAZOS,
			PRAZOS_NOME,
			PRAZOS_PARCELAS,
			PRAZOS_PARCELAMENTO,
			MOVIMENTOS_ID_DOCUMENTOS,
			DOCUMENTOSMOVIMENTO.DOCUMENTOS_NOME,
			DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID_PESSOAS,
			DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID_OPERACOES,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_ALTERAPRECO) as DOCUMENTOS_ALTERAPRECO,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_DESCONTOITEM) as DOCUMENTOS_DESCONTOITEM,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACARTAO) as DOCUMENTOS_COLETACARTAO,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETACHEQUE) as DOCUMENTOS_COLETACHEQUE,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETATRANSPORTE) as DOCUMENTOS_COLETATRANSPORTE,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_COLETAENTREGA) as DOCUMENTOS_COLETAENTREGA,
			trim(DOCUMENTOSMOVIMENTO.DOCUMENTOS_LAYOUT) as DOCUMENTOS_LAYOUT,
			MOVIMENTOS_NUMERO,
			MOVIMENTOS_SERIE,
			MOVIMENTOS_EMISSAO,
			MOVIMENTOS_HORA,
			MOVIMENTOS_ENTRADASAIDA,
			MOVIMENTOS_PRODUTOS,
			MOVIMENTOS_DESCONTOS,
			MOVIMENTOS_PERCENTUAL,
			MOVIMENTOS_MARGEM,
			MOVIMENTOS_TOTAL,
			MOVIMENTOS_BASEICMS,
			MOVIMENTOS_VALORICMS,
			MOVIMENTOS_BASEST,
			MOVIMENTOS_VALORST,
			MOVIMENTOS_VALORIPI,
			MOVIMENTOS_FRETE,
			MOVIMENTOS_SEGURO,
			MOVIMENTOS_DESPESAS,
			MOVIMENTOS_ID_EMPRESAORIGEM,
			MOVIMENTOS_NUMEROORIGEM,
			MOVIMENTOS_SERIEORIGEM,
			MOVIMENTOS_NFE,
			MOVIMENTOS_PROTOCOLO,
			MOVIMENTOS_OBSERVACOES,
			trim(MOVIMENTOS_STATUS) as MOVIMENTOS_STATUS,
			trim(MOVIMENTOS_SITUACAO) as MOVIMENTOS_SITUACAO,
			MOVIMENTOS_LOG,
			PESSOAS_EMAIL,
			PESSOAS_PAGINA,
			MOVIMENTOS_EMAIL,
			MOVIMENTOS_NOME,
			MOVIMENTOS_CPFCNPJ,
			MOVIMENTOS_IMPOSTO, 
			cast ((
				select sum(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE) from MOVIMENTOSITENS
				join PRODUTOS  on PRODUTOS_ID  = MOVIMENTOSITENS_ID_PRODUTOS
				join MONTAGENS on MONTAGENS_ID = PRODUTOS_ID_MONTAGENS
				where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
					  MOVIMENTOSITENS_CSTPIS <> 'ML'
			) as numeric(12,2)) as MONTAGENS_VALOR,
			ROMANEIOS_STATUS,
			DOCUMENTOSROMANEIO.DOCUMENTOS_NOME as ROMANEIOS_DOCUMENTO, 
			(
				iif((select count(*) from MOVIMENTOSITENS
					where MOVIMENTOSITENS_ID_MOVIMENTOS = MOVIMENTOS_ID and
							MOVIMENTOSITENS_DEPOSITO = 0) = 0, 'T', 'F')
			) as RESERVAS_STATUS 
		from MOVIMENTOS
		left join EMPRESAS     on EMPRESAS_ID     = MOVIMENTOS_ID_EMPRESAS
		left join PESSOAS      on PESSOAS_ID      = MOVIMENTOS_ID_PESSOAS
		left join PROPRIEDADES on PROPRIEDADES_ID = MOVIMENTOS_ID_PROPRIEDADES
		left join CIDADES      on CIDADES.CIDADES_ID = PESSOAS_ID_CIDADES
		left join CIDADES as CIDADESEMPRESA on CIDADESEMPRESA.CIDADES_ID = EMPRESAS.EMPRESAS_ID_CIDADES
		left join CIDADES as CIDADESPROPRIEDADE on CIDADESPROPRIEDADE.CIDADES_ID = PROPRIEDADES.PROPRIEDADES_ID_CIDADES
		left join OPERACOES  on OPERACOES_ID  = MOVIMENTOS_ID_OPERACOES
		left join PRAZOS     on PRAZOS_ID     = MOVIMENTOS_ID_PRAZOS
		left outer join APLICACOES on APLICACOES_ID = MOVIMENTOS_ID_APLICACOES
		left outer join CUSTOS     on CUSTOS_ID = MOVIMENTOS_ID_CUSTOS
		left join DOCUMENTOS DOCUMENTOSMOVIMENTO on DOCUMENTOSMOVIMENTO.DOCUMENTOS_ID = MOVIMENTOS_ID_DOCUMENTOS
		left join USUARIOS   on USUARIOS_ID   = MOVIMENTOS_ID_USUARIOS
		left join ROMANEIOSITENS on ROMANEIOSITENS_ID_MOVIMENTOS   = MOVIMENTOS_ID
		left join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS   = ROMANEIOS_ID
		left join DOCUMENTOS DOCUMENTOSROMANEIO on DOCUMENTOSROMANEIO.DOCUMENTOS_ID = ROMANEIOS_ID_DOCUMENTOS
		
		${sqlWhere} ${sqlOrder}`; 

		const movimentos = await samosFB.executeSQL(sqlSearch, params);

		await Promise.all(movimentos.map(async movimento => {
			const isNotaEletronica = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';
			const isPedido         = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
			const isPedidoCompra   = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
			const isOrcamentoPrazo = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
			const idProfissional   = movimento['MOVIMENTOS_PROTOCOLO'] || '';
			let idMovimentoDestino = 0;

			if(isPedido && idProfissional && params.client.toUpperCase().match(/LISLAIS/)) {
				const searchProfissional = await samosFB.executeSQL(`select USUARIOS_NOME from USUARIOS where USUARIOS_ID = ${idProfissional}`, params);
				movimento['PROFISSIONAIS_NOME'] = searchProfissional[0]['USUARIOS_NOME'] || '';
			}

			if(isNotaEletronica && 
			   !utils.string.isEmail(movimento['MOVIMENTOS_EMAIL']) &&
				utils.string.isEmail(movimento['PESSOAS_EMAIL'])) {
				const emailPessoa = movimento['PESSOAS_EMAIL'];
				const idMovimento = movimento['MOVIMENTOS_ID'];
				await samosFB.executeSQL(`update MOVIMENTOS set MOVIMENTOS_EMAIL = '${emailPessoa}' where MOVIMENTOS_ID = ${idMovimento}`, params);
				movimento['MOVIMENTOS_EMAIL'] = emailPessoa;
			}

			if(isNotaEletronica && 
			   movimento['MOVIMENTOS_STATUS'] == 'N' &&
			   movimento['MOVIMENTOS_NFE'] != '' &&
			   movimento['MOVIMENTOS_PROTOCOLO'] != ''
			   ) {
				await samosFB.executeSQL(`update MOVIMENTOS set MOVIMENTOS_STATUS = 'F' where MOVIMENTOS_ID = ${movimento['MOVIMENTOS_ID']}`, params);
				movimento['MOVIMENTOS_STATUS'] = 'F';
			}

			if(isPedidoCompra || isOrcamentoPrazo) {
				const obsValue = movimento['MOVIMENTOS_OBSERVACOES'] || '';
				const percentuaisValue = movimento['MOVIMENTOS_NFE'] || ''; // % Frete, Seguro, IPI
				const partes = obsValue.split('|');
				const financeiroscompra = (partes.slice(3, 4)[0] || '').split('#')
					.filter(financeiro => !!financeiro)
					.map((financeiro, index) => {
						return {
							'MOVIMENTOSFINANCEIROSCOMPRA_ID'           : index + 1,
							'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS': movimento['MOVIMENTOS_ID'],
							'MOVIMENTOSFINANCEIROSCOMPRA_VCTO'         : (financeiro || '').split('*')[0],
							'MOVIMENTOSFINANCEIROSCOMPRA_VALOR'        : (financeiro || '').split('*')[1]
						}
					});

				movimento['PERCENTUAL_FRETE']  = (percentuaisValue || '').split('|')[0] || 0;
				movimento['PERCENTUAL_SEGURO'] = (percentuaisValue || '').split('|')[1] || 0;
				movimento['PERCENTUAL_IPI']    = (percentuaisValue || '').split('|')[2] || 0;
				movimento['MOVIMENTOS_OBSERVACOES'] = partes.slice(0, 3).join('|');
				movimento['MOVIMENTOS_FINANCEIROSCOMPRA'] = financeiroscompra
			}

			//Para pedidos parciais da pruden aco
			if( isPedido && pedidoParcial ) {
				const sqlQueryBaixasParciais = `
					select * from CREDITOS
					where CREDITOS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']} and
						  CREDITOS_TIPO = 'B';
				`;

				//Busca as baixas aqui
				movimento['BAIXASPARCIAIS_MOVIMENTO'] = await samosFB.executeSQL(sqlQueryBaixasParciais, params);

			}else{
				movimento['BAIXASPARCIAIS_MOVIMENTO'] = [];
			}

			movimento['XML_AUTOMATICO'] = movimento['PESSOAS_INCLUSAO'].split('|')[1] || 'F';

			const sqlItens = `select distinct 
				MOVIMENTOSITENS_ID,
				MOVIMENTOSITENS_ID_MOVIMENTOS,
				MOVIMENTOSITENS_ID_OPERACOES,
				MOVIMENTOSITENS_ID_PRODUTOS,
				MOVIMENTOSITENS_QUANTIDADE,
				MOVIMENTOSITENS_PRECO,
				MOVIMENTOSITENS_CUSTO,
				MOVIMENTOSITENS_MARGEM,
				MOVIMENTOSITENS_PERCENTUAL,
				MOVIMENTOSITENS_DESCONTOS,
				cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) as numeric(12,2)) as MOVIMENTOSITENS_TOTAL,
				MOVIMENTOSITENS_ALIQUOTAPIS,
				MOVIMENTOSITENS_CSTPIS,
				MOVIMENTOSITENS_BASEPIS,
				MOVIMENTOSITENS_VALORPIS,
				MOVIMENTOSITENS_VALORPISST,
				MOVIMENTOSITENS_ALIQUOTACOFINS,
				MOVIMENTOSITENS_CSTCOFINS,
				MOVIMENTOSITENS_BASECOFINS,
				MOVIMENTOSITENS_VALORCOFINS,
				MOVIMENTOSITENS_VALORCOFINSST,
				MOVIMENTOSITENS_ICMS,
				MOVIMENTOSITENS_BASEICMS,
				MOVIMENTOSITENS_VALORICMS,
				MOVIMENTOSITENS_IPI,
				MOVIMENTOSITENS_VALORIPI,
				MOVIMENTOSITENS_BASEST,
				MOVIMENTOSITENS_VALORST,
				MOVIMENTOSITENS_FRETE,
				MOVIMENTOSITENS_SEGURO,
				MOVIMENTOSITENS_DESPESAS,
				MOVIMENTOSITENS_IMPOSTO,
				MOVIMENTOSITENS_CST,
				MOVIMENTOSITENS_ESCRITURACAO,
				MOVIMENTOSITENS_EXCECAO,
				MOVIMENTOSITENS_ID_EMPRESAS,
				MOVIMENTOSITENS_ID_LOTES,
				MOVIMENTOSITENS_ENTREGUE,
				MOVIMENTOSITENS_IMEDIATA,
				iif((right(lpad(MOVIMENTOS_ID_DOCUMENTOS, 6, 0), 4) = '0012'), 'T', '') as ITENS_DEVOLUCAO,
				MOVIMENTOSITENS_DATAMONTAGEM,
				MOVIMENTOSITENS_HORAMONTAGEM,
				MOVIMENTOSITENS_DATAENTREGA,
				MOVIMENTOSITENS_HORAENTREGA,
				MOVIMENTOSITENS_DEPOSITO,
				iif(((MOVIMENTOSITENS_ID_PRODUTOS=999999) or (PRODUTOS_EDITAVEL = 'T')),
				   coalesce(RELACOESITENS_NOME, PRODUTOS_NOME), ${nomeProduto}) as PRODUTOS_NOME, 
				PRODUTOS_DERIVADO, 
				PRODUTOS_EDITAVEL,
				PRODUTOS_UNIDADE,
				PRODUTOS_REFERENCIA,
				PRODUTOS_STATUS,
				PRODUTOS_DESCRICAO, 
				PRODUTOS_MARCA, 
				PRODUTOS_FABRICA,
				PRODUTOS_APLICACAO, 
				PRODUTOS_PESOLIQUIDO, 
				PRODUTOS_PESOBRUTO,
				PRODUTOS_ID_GRUPOS,
				PRODUTOS_BARRA,
				PRODUTOS_REFERENCIA,
				cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) as TOTAL_LIQUIDO,
				cast((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_CUSTO) as numeric(12,2)) as TOTAL_CUSTO,
				(MOVIMENTOSITENS_QUANTIDADE - MOVIMENTOSITENS_ENTREGUE - MOVIMENTOSITENS_DEPOSITO - MOVIMENTOSITENS_IMEDIATA) as ITENS_ENTREGAR,
				(iif(MOVIMENTOSITENS_QUANTIDADE > 0,cast(((MOVIMENTOSITENS_QUANTIDADE * MOVIMENTOSITENS_PRECO) - MOVIMENTOSITENS_DESCONTOS) as numeric(12,2)) / MOVIMENTOSITENS_QUANTIDADE, 0)) as VALOR_LIQUIDO,
				SALDOS_CUSTO, 
				SALDOS_COMPRA, 
				SALDOS_PRECO, 
				SALDOS_PRAZO, 
				SALDOS_DISPONIVEL, 
				SALDOS_IPI, 
				SALDOS_CSTLOCAL, 
				SALDOS_CSTOUTROS, 
				SALDOS_LOCAL,
				SALDOS_TRANSFERENCIA, 
				SALDOS_ICMSLC, 
				SALDOS_ICMS01, 
				SALDOS_ICMS02, 
				SALDOS_MARGEM, 
				${sqlMarkup} as SALDOS_PRECOMINIMO,   
				${sqlMarkup} as PRECOMINIMO_DB,
				SALDOS_CUSTO as NOVO_CUSTO, 
				SALDOS_MARGEM as NOVO_MARGEM,
				SALDOS_PRECO as NOVO_PRECO, 
				SALDOS_PRAZO as NOVO_PRAZO,
				SALDOS_COMPRA as NOVO_COMPRA,
				(
					select first 1 skip 0 PROMOCOESITENS_VALOR from PROMOCOESITENS
					join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
					where PROMOCOES_STATUS   = 'T'           and
							PROMOCOES_EMISSAO  <= current_date and
							PROMOCOES_VALIDADE >= current_date and
							position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
							PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
				) as VALOR_PROMOCAO,
				(
					select first 1 skip 0 PROMOCOESITENS_CUSTOTECNICO from PROMOCOESITENS
					join  PROMOCOES on PROMOCOESITENS_ID_PROMOCOES = PROMOCOES_ID
					where PROMOCOES_STATUS   = 'T'           and
							PROMOCOES_EMISSAO  <= current_date and
							PROMOCOES_VALIDADE >= current_date and
							position(MOVIMENTOSITENS_ID_EMPRESAS, PROMOCOESITENS_EMPRESAS) <> 0 and 
							PROMOCOESITENS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS 
				) as QTDE_PROMOCAO,
				SALDOS_BASELC, 
				SALDOS_BASE01, 
				SALDOS_BASE02,
				SALDOS_ALIQUOTASUBST,
				NCMS_NCM, 
				NCMS_ALIQUOTANACIONAL,  
				NCMS_ALIQUOTAESTADUAL,
				NCMS_ALIQUOTAIMPORTADO, 
				NCMS_ALIQUOTAMUNICIPAL, 
				NCMS_CSTPIS, 
				NCMS_ALIQUOTAPIS, 
				NCMS_CSTCOFINS,  
				NCMS_ALIQUOTACOFINS, 
				NCMS_ALIQUOTAFCP, 
				NCMS_DIFAL,
				NCMS_CEST,
				OPERACOES_NOME, 
				EMPRESAS_FANTASIA,
				LOTES_ID,
				LOTES_REFERENCIA,
				LOTES_FABRICACAO,
				LOTES_VALIDADE,
				0 as ITENS_MARGEM,
				iif(MOVIMENTOSITENS_CSTPIS = 'ML', 0, cast(MONTAGENS_VALOR * MOVIMENTOSITENS_QUANTIDADE as numeric(12,2))) as MONTAGENS_VALOR
			from MOVIMENTOSITENS
			join MOVIMENTOS          on MOVIMENTOS_ID                 = MOVIMENTOSITENS_ID_MOVIMENTOS
			left join RELACOESITENS  on MOVIMENTOSITENS_ID_MOVIMENTOS = RELACOESITENS_ID_MOVIMENTOS and 
										MOVIMENTOSITENS_ID            = RELACOESITENS_ID_ITENS
			left join PRODUTOS       on PRODUTOS_ID                   = MOVIMENTOSITENS_ID_PRODUTOS
			left join MONTAGENS      on MONTAGENS_ID                  = PRODUTOS_ID_MONTAGENS
			left join SALDOS         on SALDOS_ID_EMPRESAS            = MOVIMENTOS_ID_EMPRESAS and SALDOS_ID_PRODUTOS = MOVIMENTOSITENS_ID_PRODUTOS
			left outer join NCMS     on NCMS_ID                       = PRODUTOS_ID_NCMS
			left outer join LOTES    on LOTES_ID                      = MOVIMENTOSITENS_ID_LOTES
			left join OPERACOES      on OPERACOES_ID                  = MOVIMENTOSITENS_ID_OPERACOES
			left outer join EMPRESAS on EMPRESAS_ID                   = MOVIMENTOSITENS_ID_EMPRESAS
			where MOVIMENTOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']} 
			order by MOVIMENTOSITENS_ID`;

			movimento['MOVIMENTOS_ITENS'] = await samosFB.executeSQL(sqlItens, params);

			const sqlCaixa = `select 
				MOVIMENTOSCAIXA.*, 
				PESSOAS_NOME, 
				CONTROLES_ID_PORTADORES as MOVIMENTOSCAIXA_ID_PORTADORES, 
				PORTADORES_NOME, 
				CONTROLES_DOCUMENTO
			from MOVIMENTOSCAIXA
			join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
			left outer join CONTROLES on CONTROLES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS
			left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
			where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`

			movimento['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixa, params);

		 // Hospitalar mostra caixa/financeiro do novo documento, caso ele tenha sido faturado (para consulta)...

			if(params.client.toUpperCase().match(/HOSPITALAR/) && 
			   movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002' &&  // Pedido
			   movimento['MOVIMENTOS_CAIXA'].length == 0 &&                             // Sem caixa
			   movimento['MOVIMENTOS_STATUS'] == 'F' &&                                 // Faturado
			   movimento['MOVIMENTOS_NUMEROORIGEM'] > 0) {                              // Com número de origem

				const sqlMovimentoDestino = `select MOVIMENTOS_ID from MOVIMENTOS 
							where MOVIMENTOS_ID_EMPRESAS = ${movimento['MOVIMENTOS_ID_EMPRESAORIGEM']} and
								  MOVIMENTOS_NUMERO      = ${movimento['MOVIMENTOS_NUMEROORIGEM']} and
								  MOVIMENTOS_SERIE       = '${movimento['MOVIMENTOS_SERIEORIGEM']}' `

				const movimentoDestino = await samosFB.executeSQL(sqlMovimentoDestino, params);

				if(movimentoDestino.length > 0) {
					idMovimentoDestino = movimentoDestino[0]['MOVIMENTOS_ID'];
					const sqlCaixaDestino = `select 
								MOVIMENTOSCAIXA.*, 
								PESSOAS_NOME, 
								CONTROLES_ID_PORTADORES as MOVIMENTOSCAIXA_ID_PORTADORES, 
								PORTADORES_NOME, 
								CONTROLES_DOCUMENTO
							from MOVIMENTOSCAIXA
							join PESSOAS on PESSOAS_ID = MOVIMENTOSCAIXA_ID_PESSOAS
							left outer join CONTROLES on CONTROLES_ID_MOVIMENTOS = MOVIMENTOSCAIXA_ID_MOVIMENTOS
							left outer join PORTADORES on PORTADORES_ID = CONTROLES_ID_PORTADORES
							where MOVIMENTOSCAIXA_ID_MOVIMENTOS = ${idMovimentoDestino}`
				
					movimento['MOVIMENTOS_CAIXA'] = await samosFB.executeSQL(sqlCaixaDestino, params);    
				}
			}

			const sqlFormas = `select MOVIMENTOSFORMAS.*, MOVIMENTOS_BASEICMS, MOVIMENTOS_BASEST from MOVIMENTOSFORMAS
				join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSFORMAS_ID_MOVIMENTOS
				where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_FORMASPAGAMENTO'] = await samosFB.executeSQL(sqlFormas, params);

			const sqlCartoes = `select 
				CARTOES.*, 
				OPERADORAS_NOME, 
				OPERADORAS_AVISTA, 
				OPERADORAS_PARCELADO
			from CARTOES
			left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
			where CARTOES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_CARTOES'] = await samosFB.executeSQL(sqlCartoes, params);

			const sqlCheques = `select CHEQUES.*, CIDADES_NOME, CIDADES_ESTADO from CHEQUES 
				left outer join CIDADES on CIDADES_ID = CHEQUES_ID_CIDADES
				where CHEQUES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_CHEQUES'] = await samosFB.executeSQL(sqlCheques, params);

			const sqlFinanceiros = `select 
				FINANCEIROS.*,
				PORTADORES_NOME, 
				PESSOAS_NOME, 
				PESSOAS_TIPO,
				(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
			from FINANCEIROS 
			left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
			left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
			where FINANCEIROS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB.executeSQL(sqlFinanceiros, params);

			// Hospitalar pegar caixa/financeiro do novo documento, para consulta...

			if(params.client.toUpperCase().match(/HOSPITALAR/) && 
			   idMovimentoDestino > 0 && 
			   movimento['MOVIMENTOS_FINANCEIROS'].length == 0) {                
				const sqlFinanceirosDestino = `select 
											FINANCEIROS.*,
											PORTADORES_NOME, 
											PESSOAS_NOME, 
											PESSOAS_TIPO,
											(FINANCEIROS_VENCIMENTO - FINANCEIROS_EMISSAO) as PRAZO_DIAS
										from FINANCEIROS 
										left outer join PESSOAS    on PESSOAS_ID    = FINANCEIROS_ID_PESSOAS
										left outer join PORTADORES on PORTADORES_ID = FINANCEIROS_ID_PORTADORES
										where FINANCEIROS_ID_MOVIMENTOS = ${idMovimentoDestino}`;
				movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB.executeSQL(sqlFinanceirosDestino, params);
			}

			const sqlEnvio = `select 
				MOVIMENTOSENVIO.*, 
				TRANSPORTES_EMAIL,
				CIDADES_NOME, 
				CIDADES_ESTADO 
			from MOVIMENTOSENVIO
			join TRANSPORTES on TRANSPORTES_ID = MOVIMENTOSENVIO_ID_TRANSPORTES
			join CIDADES on CIDADES_ID = MOVIMENTOSENVIO_ID_CIDADES
			where MOVIMENTOSENVIO_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_ENVIO'] = await samosFB.executeSQL(sqlEnvio, params);

			const sqlCartas = `select MOVIMENTOSCARTAS.*, MOVIMENTOS_NFE from MOVIMENTOSCARTAS 
			join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCARTAS_ID_MOVIMENTOS
			where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`

			movimento['MOVIMENTOS_CARTAS'] = await samosFB.executeSQL(sqlCartas, params);

			const sqlRomaneiosMoveis =  `select 
				ROMANEIOSITENS_ID, 
				ROMANEIOS_NUMERO, 
				DOCUMENTOS_NOME 
			from ROMANEIOSITENS
			join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
			join DOCUMENTOS on ROMANEIOS_ID_DOCUMENTOS = DOCUMENTOS_ID
			where ROMANEIOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['ROMANEIOS_MOVEIS'] = await samosFB.executeSQL(sqlRomaneiosMoveis, params);

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
		}));

		return { 
			results: movimentos, 
			total  : movimentos.length 
		};

	} catch(error) {
		const msg = 'Falha ao buscar movimentos por id';
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
						widths: [50, 50, '*','*', '*', 140, 60],
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
			getMovimentoById(params.idRequisicao, params)
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
								text: 'ACERTO DE ESTOQUE',
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
										text: 'Req. N.º\n\n', 
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
								text: `Data ${moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`,
								colSpan: 2
							},
							{}
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
								colSpan: 4,									
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{},
							{
								text: 'Operação',
								style: {
									bold: true
								}
							},
							{
								text: 'Qtde',
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
								colSpan: 4
							}, 
							{}, 
							{},
							{},
							{
								text: produtos[i]['OPERACOES_NOME'],
								alignment: 'right'
							},
							{
								text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
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
								colSpan: 7,
								style: {
									bold: true
								}
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
								text: `${model['MOVIMENTOS_OBSERVACOES'] || ''}\n${model['MOVIMENTOS_LOG']}`,
								border: [true, false, true, true],							
								colSpan: 7,
								rowSpan: 5,
								style: {
									bold: true
								}
							}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
						],
						[
							{}, 
							{}, 
							{}, 
							{}, 
							{},
							{}, 
							{}
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