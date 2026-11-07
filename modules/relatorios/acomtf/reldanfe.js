'use strict';

const utils = require('../../../services/samosUtils');
const fs = require('fs');
const path = require('path');
const appRoot = path.dirname(require.main.filename);
const api = require('../..');
const codes = require('rescode');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const samosFB_rel  = require('../../../services/samosFB');

codes.loadModules(['code128'], {"includetext" : false});

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

		const movimentos = await samosFB_rel.executeSQL(sqlSearch, params);

		await Promise.all(movimentos.map(async movimento => {
			const isNotaEletronica = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003';
			const isPedido         = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0002';
			const isPedidoCompra   = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0006';
			const isOrcamentoPrazo = movimento['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0001' && orcPrazo;
			const idProfissional   = movimento['MOVIMENTOS_PROTOCOLO'] || '';
			let idMovimentoDestino = 0;

			if(isPedido && idProfissional && params.client.toUpperCase().match(/LISLAIS/)) {
				const searchProfissional = await samosFB_rel.executeSQL(`select USUARIOS_NOME from USUARIOS where USUARIOS_ID = ${idProfissional}`, params);
				movimento['PROFISSIONAIS_NOME'] = searchProfissional[0]['USUARIOS_NOME'] || '';
			}

			if(isNotaEletronica && 
			   !utils.string.isEmail(movimento['MOVIMENTOS_EMAIL']) &&
				utils.string.isEmail(movimento['PESSOAS_EMAIL'])) {
				const emailPessoa = movimento['PESSOAS_EMAIL'];
				const idMovimento = movimento['MOVIMENTOS_ID'];
				await samosFB_rel.executeSQL(`update MOVIMENTOS set MOVIMENTOS_EMAIL = '${emailPessoa}' where MOVIMENTOS_ID = ${idMovimento}`, params);
				movimento['MOVIMENTOS_EMAIL'] = emailPessoa;
			}

			if(isNotaEletronica && 
			   movimento['MOVIMENTOS_STATUS'] == 'N' &&
			   movimento['MOVIMENTOS_NFE'] != '' &&
			   movimento['MOVIMENTOS_PROTOCOLO'] != ''
			   ) {
				await samosFB_rel.executeSQL(`update MOVIMENTOS set MOVIMENTOS_STATUS = 'F' where MOVIMENTOS_ID = ${movimento['MOVIMENTOS_ID']}`, params);
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
				movimento['BAIXASPARCIAIS_MOVIMENTO'] = await samosFB_rel.executeSQL(sqlQueryBaixasParciais, params);

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

			movimento['MOVIMENTOS_ITENS'] = await samosFB_rel.executeSQL(sqlItens, params);

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

			movimento['MOVIMENTOS_CAIXA'] = await samosFB_rel.executeSQL(sqlCaixa, params);

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

				const movimentoDestino = await samosFB_rel.executeSQL(sqlMovimentoDestino, params);

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
				
					movimento['MOVIMENTOS_CAIXA'] = await samosFB_rel.executeSQL(sqlCaixaDestino, params);    
				}
			}

			const sqlFormas = `select MOVIMENTOSFORMAS.*, MOVIMENTOS_BASEICMS, MOVIMENTOS_BASEST from MOVIMENTOSFORMAS
				join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSFORMAS_ID_MOVIMENTOS
				where MOVIMENTOSFORMAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_FORMASPAGAMENTO'] = await samosFB_rel.executeSQL(sqlFormas, params);

			const sqlCartoes = `select 
				CARTOES.*, 
				OPERADORAS_NOME, 
				OPERADORAS_AVISTA, 
				OPERADORAS_PARCELADO
			from CARTOES
			left outer join OPERADORAS on OPERADORAS_ID = CARTOES_ID_OPERADORAS
			where CARTOES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_CARTOES'] = await samosFB_rel.executeSQL(sqlCartoes, params);

			const sqlCheques = `select CHEQUES.*, CIDADES_NOME, CIDADES_ESTADO from CHEQUES 
				left outer join CIDADES on CIDADES_ID = CHEQUES_ID_CIDADES
				where CHEQUES_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['MOVIMENTOS_CHEQUES'] = await samosFB_rel.executeSQL(sqlCheques, params);

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

			movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB_rel.executeSQL(sqlFinanceiros, params);

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
				movimento['MOVIMENTOS_FINANCEIROS'] = await samosFB_rel.executeSQL(sqlFinanceirosDestino, params);
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

			movimento['MOVIMENTOS_ENVIO'] = await samosFB_rel.executeSQL(sqlEnvio, params);

			const sqlCartas = `select MOVIMENTOSCARTAS.*, MOVIMENTOS_NFE from MOVIMENTOSCARTAS 
			join MOVIMENTOS on MOVIMENTOS_ID = MOVIMENTOSCARTAS_ID_MOVIMENTOS
			where MOVIMENTOSCARTAS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`

			movimento['MOVIMENTOS_CARTAS'] = await samosFB_rel.executeSQL(sqlCartas, params);

			const sqlRomaneiosMoveis =  `select 
				ROMANEIOSITENS_ID, 
				ROMANEIOS_NUMERO, 
				DOCUMENTOS_NOME 
			from ROMANEIOSITENS
			join ROMANEIOS on ROMANEIOSITENS_ID_ROMANEIOS = ROMANEIOS_ID
			join DOCUMENTOS on ROMANEIOS_ID_DOCUMENTOS = DOCUMENTOS_ID
			where ROMANEIOSITENS_ID_MOVIMENTOS = ${movimento['MOVIMENTOS_ID']}`;

			movimento['ROMANEIOS_MOVEIS'] = await samosFB_rel.executeSQL(sqlRomaneiosMoveis, params);

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

			movimento['MOVIMENTOS_ROMANEIOS'] = await samosFB_rel.executeSQL(sqlRomaneios, params);
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
    readById: (id, params) => { 
        return new Promise((resolve, reject) =>{
			getMovimentoById(id, params)
				.then(async res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 20, 20, 20],
						background: [
						],									
						content: [
							{
								style: 'tableReport',
								table: { // Colunas (32)   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32 
									widths: [ 22,  6,  6,  8,  8,  8,  8,  8,  7,  7,  7,  5,  6,  6, 12, 12,  6,  8, 10, 10, 10,  8,  8,  8,  8,  8,  7,  7,  5,  5, 14, 14],
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
                   						
					let model             = res.results[0];
					let obsNfe            = (model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').slice(0, 5).join('\n') : '\n\n\n\n\n');
					const isComplementar  = model['OPERACOES_COMPLEMENTAR'] == 'T';
					let produtos          = model['MOVIMENTOS_ITENS'];
					const dataEntrega     = moment(produtos[0]['MOVIMENTOSITENS_DATAENTREGA']).isSameOrBefore('1900-01-01') ? '' : moment(produtos[0]['MOVIMENTOSITENS_DATAENTREGA']).format('DD/MM/YYYY');
					const turnoEntrega    = produtos[0]['MOVIMENTOSITENS_HORAENTREGA'];
					let transporte        = model['MOVIMENTOS_ENVIO'][0] || [];
					let rows              = docDefinition.content[0].table.body;
                    const barcodes        = await getBarcode(model['MOVIMENTOS_NFE']);
					let pagina            = 1;				
					let paginas           = (produtos.length <= 18 ? 1 : Math.trunc(produtos.length / 18) + ((produtos.length % 18) > 0 ? 1: 0));
					let linhas;
					let itensPagina = 0;
					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/nfe/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/nfe/default.png`;
					}
						
					let valorProdutos = isComplementar ? '\n' : utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']);
					let valorNfe      = isComplementar ? '\n' : utils.number.float2moeda(model['MOVIMENTOS_TOTAL']);

					let financeiros     = model['MOVIMENTOS_FINANCEIROS'] || [];

					let fatura01 = (financeiros.length > 0  ? `${model['MOVIMENTOS_NUMERO']}/01` : '');
					let fatura02 = (financeiros.length > 1  ? `${model['MOVIMENTOS_NUMERO']}/02` : '');
					let fatura03 = (financeiros.length > 2  ? `${model['MOVIMENTOS_NUMERO']}/03` : '');
					let fatura04 = (financeiros.length > 3  ? `${model['MOVIMENTOS_NUMERO']}/04` : '');
					let fatura05 = (financeiros.length > 4  ? `${model['MOVIMENTOS_NUMERO']}/05` : '');
					let fatura06 = (financeiros.length > 5  ? `${model['MOVIMENTOS_NUMERO']}/06` : '');
					let fatura07 = (financeiros.length > 6  ? `${model['MOVIMENTOS_NUMERO']}/07` : '');
					let fatura08 = (financeiros.length > 7  ? `${model['MOVIMENTOS_NUMERO']}/08` : '');
					let fatura09 = (financeiros.length > 8  ? `${model['MOVIMENTOS_NUMERO']}/09` : '');
					let fatura10 = (financeiros.length > 9  ? `${model['MOVIMENTOS_NUMERO']}/10` : '');
					let fatura11 = (financeiros.length > 10 ? `${model['MOVIMENTOS_NUMERO']}/11` : '');
					let fatura12 = (financeiros.length > 11 ? `${model['MOVIMENTOS_NUMERO']}/12` : '');

					let vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
					let vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');

					let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['FINANCEIROS_ORIGINAL']) : '');
					let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['FINANCEIROS_ORIGINAL']) : '');
					let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['FINANCEIROS_ORIGINAL']) : '');
					let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['FINANCEIROS_ORIGINAL']) : '');
					let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['FINANCEIROS_ORIGINAL']) : '');
					let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['FINANCEIROS_ORIGINAL']) : '');
					let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['FINANCEIROS_ORIGINAL']) : '');
					let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['FINANCEIROS_ORIGINAL']) : '');
					let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['FINANCEIROS_ORIGINAL']) : '');
					let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['FINANCEIROS_ORIGINAL']) : '');
					let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['FINANCEIROS_ORIGINAL']) : '');
					let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['FINANCEIROS_ORIGINAL']) : '');
					
					for(let i in produtos){
						if(itensPagina > 15 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
							if(itensPagina > 0) {                  // Se já imprimiu alguma página fecha o rodapé
								pagina++;
								rows.push(
									[
										{ 
											text: 'DADOS ADICIONAIS\n',
											alignment: 'left',
											style: {fontSize: 6},
											colSpan: 25,									
											border: [false, false, false, false]
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
											text: 'www.samos.com.br',
											alignment: 'right',
											style: {fontSize: 7},
											colSpan: 7,									
											border: [false, false, false, false]
										},{},{},{},{},{},{}
									],
									[
										{ 
											text: [
												{ 
													text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' ?
													'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,
													style: {fontSize: 7}
												},
												{ 
													text: `${obsNfe}`,
													style: {fontSize: 8}
												}									
											],
											colSpan: 18
										}, 
										{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
										{
											text: 'RESERVADO AO FISCO',
											style: {fontSize: 7},
											colSpan: 14
										},{},{},{},{},{},{},{},{},{},{},{},{},{}
									]
								);			
							}
							itensPagina = 0; // Zera o contador de itens							
							rows.push(
								[
									{
										text: `RECEBEMOS DE ${model['EMPRESAS_NOME']}, OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO:`,
										style: {fontSize: 6}, 
										border: [true, true, true, false],								
										colSpan: 26
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
									{
										text: `      NF-e\n  Nº           ${model['MOVIMENTOS_NUMERO']}`, alignment: 'center',
										colSpan: 6,
										border: [true, true, true, false],
										style: {fontSize: 10}
									},{},{},{},{},{}
								],
								[
									{
										text: 'DATA DE RECEBIMENTO',
										style: {fontSize: 6},								
										colSpan: 8,
										border: [true, true, true, true]
									},{},{},{},{},{},{},{},
									{   text: 'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR',
										style: {fontSize: 6},
										colSpan: 18
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
									{
										text: [
											{text: 'a\n', fontSize: 6, color: 'white'},
											{text: '  SÉRIE:\n', alignment: 'right',
											style: {fontSize: 10}},
										],
										border: [true, true, false, true],
										colSpan: 3
									},{},{},
									{
										text: [
											{text: 'a\n', fontSize: 6, color: 'white'},
											{text: '01\n', alignment: 'left',
											style: {fontSize: 10}},
										],
										border: [false, true, true, true],
										colSpan: 3
									},{},{}
								],
								[
									{ 
										text: ' -'.repeat(66),
										colSpan: 32,
										style: {
											fontSize: 16
										},
										border: [false, false, false, false]
									},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}

								]
							);

							rows.push(
								[
									{
										image: `${pathLogo}`,
										fit: [75, 75],
										colSpan: 4,
										width: 50,
										alignment: 'center',
										border: [true, true, false, true]
									},{},{},{},
									{
										colSpan: 9,
										text: [
											{
												text: model['EMPRESAS_NOME'] + '\n',
												alignment: 'left',
												style: {bold: true,	fontSize: 9}
											},
											{
												text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `${model['EMPRESAS_BAIRRO']}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `${model['CIDADES_NOMEEMPRESA']} - ${model['CIDADES_ESTADOEMPRESA']}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `Fone: ${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `Celular: ${utils.string.maskFone(model['EMPRESAS_CELULAR'])}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 8}
											},
											{
												text: `${model['EMPRESAS_EMAIL']}\n`,
												alignment: 'left',
												style: {bold: true,	fontSize: 7.5}
											}
										],
										border: [false, true, true, true]
									},{},{},{},{},{},{},{},{},
									{
										colSpan: 5,
										text: [
											{
												text: `DANFE\n`,
												alignment: 'center',
												style: {fontSize: 10}
											},
											{
												text: `Documento Auxiliar da\nNota Eletrônica\n`,
												alignment: 'center',
												style: {bold: true,	fontSize: 7}
											},
											{
												text: `1 = Saída\n2 = Entrada       `,
												alignment: 'left',
												style: {fontSize: 6}										
											},
											{
												text: (model['MOVIMENTOS_ID_OPERACOES'] > 500000 ? '1' : '2'),
												alignment: 'left',
												style: {bold: true,	fontSize: 10}										
											},
											{
												text: `\nNº ${model['MOVIMENTOS_NUMERO']} Série 01 Página ${pagina}/${paginas}`,
												alignment: 'center',
												style: {bold: true,	fontSize: 8}										
											},

										]
									},
									{},{},{},{},
									{ 
										colSpan: 14,
										table: {
											body: [
												['CONTROLE DO FISCO'],
												[ 
													barcodes ? {
														image: 'data:image/png;base64,' + barcodes,
														width: 230,
														height: 50,
														alignment: 'center'														
												    } : ''
												]
											]
										},
										layout: 'noBorders'
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: '\n',
										style: {
											fontSize: 1
										},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);
											
							rows.push(
								[{
									colSpan: 18,
									text: [
										{text: `Natureza da Operação\n`, style: {fontSize: 6}},
										{text: `${model['OPERACOES_NOME']}`, style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 14,
									text: [
										{text: `Número do protocolo de Autorização de uso da NF-e\n`, style: {fontSize: 6}},
										{text: `${utils.string.maskProtocoloNfe(model['MOVIMENTOS_PROTOCOLO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: '\n',
										style: {
											fontSize: 1
										},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);

							rows.push(
								[{
									colSpan: 4,
									text: [
										{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${model['EMPRESAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Insc Est do Subst Tributário`, alignment: 'center', style: {fontSize: 6}}
									]
								},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 7, bold: true}}
									]
								},{},{},{},{},
								{
									colSpan: 19,
									text: [
										{text: `Chave de acesso da NF-e para consulta de autenticação no site www.fazenda.gov.br\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskChaveNfe(model['MOVIMENTOS_NFE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{ 
										text: 'DESTINATÁRIO/REMETENTE\n', // divisão de bloco 
										alignment: 'left',
										style: {fontSize: 6},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);
							rows.push(
								[{
									colSpan: 19,
									text: [
										{text: `Nome/Razão Social\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${model['MOVIMENTOS_NOME']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 7,
									text: [
										{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Data de Emissão\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${moment(model['MOVIMENTOS_EMISSAO']).isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 13,
									text: [
										{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
										{text: `${model['PESSOAS_ENDERECO']}`, alignment: 'left', style: {fontSize: (model['PESSOAS_ENDERECO'].length > 40 ? 7 : 8), bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskCnp(model['PESSOAS_NUMERO'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},						
								{
									colSpan: 6,
									text: [
										{text: `Bairro\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${model['PESSOAS_BAIRRO']}`, alignment: 'center', style: {fontSize: (model['PESSOAS_BAIRRO'].length > 20 ? 5 : 8), bold: true}}
									]
								},{},{},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `CEP\n`, alignment: 'left', style: {fontSize: 6}},
										{text: `${utils.string.maskCep(model['PESSOAS_CEP'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Data de Saída/Entrada\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${moment(model['MOVIMENTOS_ENTRADASAIDA']).isSameOrBefore('1900-01-01') ? '' : moment(model['MOVIMENTOS_ENTRADASAIDA']).format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 12,
									text: [
										{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
										{text: `${model['CIDADES_NOME']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Telefone\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${utils.string.maskFone(model['PESSOAS_TELEFONE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${model['CIDADES_ESTADO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},
								{
									colSpan: 7,
									text: [
										{text: `Inscrição Estadual\n`, alignment: 'left', style: {fontSize: 6}},
										{text: `${model['PESSOAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Hora de Saída\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${model['MOVIMENTOS_HORA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{}],
								[
									{ 
										text: 'FATURA\n',
										alignment: 'left',
										style: {fontSize: 6},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]

							);

							rows.push(
								[{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor01}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor02}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor03}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor04}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}

									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor05}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor06}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor07}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor08}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 3,
									text: [
										{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${fatura09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${fatura12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${vencto09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${vencto12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},
								{
									colSpan: 4,
									text: [
										{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
										{text: `${valor09}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor10}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor11}\n`, alignment: 'center', style: {fontSize: 8, bold: true}},
										{text: `${valor12}\n`, alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{}],
								[
									{ 
										text: 'CÁLCULO DE IMPOSTO\n',
										alignment: 'left',
										style: {fontSize: 6},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);

							rows.push(
								[{
									colSpan: 6,
									text: [
										{text: `Base de Cálculo do ICMS\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_BASEICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do ICMS\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_VALORICMS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Base de Cálculo ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_BASEST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor ICMS ST\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_VALORST']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor FPC\n`, alignment: 'center', style: {fontSize: 6}},
										{text: '', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Valor Produtos\n`, alignment: 'center', style: {fontSize: 6}},
										{text: valorProdutos, alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 6,
									text: [
										{text: `Valor do Frete\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do Seguro\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor Despesas\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor do IPI\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_VALORIPI']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Valor Tributos - IBPT\n`, alignment: 'center', style: {fontSize: 6}},
										{text: utils.number.float2moeda(model['MOVIMENTOS_IMPOSTO']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Valor Total\n`, alignment: 'center', style: {fontSize: 6}},
										{text: valorNfe, alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}],
								[
									{ 
										text: 'TRANSPORTADOR/VOLUME TRANSPORTADO\n',
										alignment: 'left',
										style: {fontSize: 6},
										colSpan: 32,									
										border: [false, false, false, false]
									}, 
									{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
								]
							);

							rows.push(
								[{
									colSpan: 15,
									text: [
										{text: `Nome/Razão Social\n`, alignment: 'left', style: {fontSize: 6}},
										{text: isComplementar ? '' : (transporte['MOVIMENTOSENVIO_NOME'] || ' '), alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 4,
									text: [
										{
											text: `Frete por Conta\n1 = Emitente\n2 = Destinatário`,
											alignment: 'left',
											style: {fontSize: 5}										
										}
									],
									border: [true, true, false, true]
								},{},{},{},{
									text: [
										{
											text: 'a\n', color: 'white', style: {fontSize: 4},
										},
										{
											text: isComplementar ? '' :	(transporte['MOVIMENTOSENVIO_MODO'] == 'C' ? '1' : '2'),
											alignment: 'left',
											style: {bold: true,	fontSize: 10},

										}
									],
									border: [false, true, true, true]
								},
								{
									colSpan: 4,
									text: [
										{text: `Placa Veículo\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_PLACA'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_PLACAUF'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `CPF/CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : utils.string.maskCnp(transporte['MOVIMENTOSENVIO_CPFCNPJ']), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);

							rows.push(
								[{
									colSpan: 15,
									text: [
										{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
										{text: isComplementar ? '\n' : (`${transporte['MOVIMENTOSENVIO_ENDERECO'] || ' '} ${transporte['MOVIMENTOSENVIO_NUMERO'] || ' '} `), alignment: 'left', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
								{
									colSpan: 9,
									text: [
										{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['CIDADES_NOME'], alignment: 'left', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},{},{},{},
								{
									colSpan: 2,
									text: [
										{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['CIDADES_ESTADO'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},
								{
									colSpan: 6,
									text: [
										{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_INSCRICAO'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{}]
							);					
							rows.push(
								[{
									colSpan: 5,
									text: [
										{text: `Quantidade\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '\n' : (transporte['MOVIMENTOSENVIO_QUANTIDADE'] || ' '), alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_ESPECIE'], alignment: 'center', style: {fontSize: 8, bold: true}}
									]
								},{},{},{},{},{},
								{
									colSpan: 6,
									text: [
										{text: `Marca\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_MARCA'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Volumes\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_VOLUMES'], alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Bruto\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_PESOBRUTO'] || '', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},
								{
									colSpan: 5,
									text: [
										{text: `Peso Líquido\n`, alignment: 'center', style: {fontSize: 6}},
										{text: isComplementar ? '' : transporte['MOVIMENTOSENVIO_PESOLIQUIDO'] || '', alignment: 'center', style: {fontSize: 8, bold: true}},
									]
								},{},{},{},{},						
							],
							[
								{ 
									text: 'DADOS DOS PRODUTOS/SERVIÇOS\n',
									alignment: 'left',
									style: {fontSize: 6},
									colSpan: 32,									
									border: [false, false, false, false]
								}, 
								{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],
							[
								{   // Coluna 1
									text: 'Código',	alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{
									text: 'Descrição dos Produtos',	alignment: 'left', style: {fontSize: 6, bold: true},
									colSpan: 10
								}, // Colunas 2 a 11
								{},{},{},{},{},{},{},{},{},
								{  // Colunas 12 a 14
									colSpan: 3,
									text: 'NCM/SH',
									alignment: 'center', style: {fontSize: 6, bold: true}		
								},{},{},
								{   // Coluna 15
									text: 'Cfop',
									style: {fontSize: 5, bold: true}
								},
								{   // Coluna 16
									text: 'Cst',
									style: {fontSize: 5, bold: true}
								},
								{   // Coluna 17 e 18
									colSpan: 2,
									text: 'Qtde',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 19
									text: 'Un',
									alignment: 'center', style: {fontSize: 5, bold: true}
								},
								{   // Coluna 20 e 21
									colSpan: 2,
									text: 'Preço',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 22 a 24
									colSpan: 3,
									text: 'Vlr. Total',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},{},
								{   // Coluna 25 e 26
									colSpan: 2,
									text: 'Base Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{   // Coluna 27 e 28
									colSpan: 2,
									text: 'Vlr. Icms',
									style: {fontSize: 5, bold: true}
								},{},
								{   // Coluna 29 e 30
									colSpan: 2,
									text: 'Vlr. Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},{},
								{   // Coluna 31
									text: 'Icms',
									alignment: 'center', style: {fontSize: 6, bold: true}
								},
								{   // Coluna 32
									text: 'Ipi',
									alignment: 'center', style: {fontSize: 6, bold: true}
								}
							]
							);
						}

						let precoUnitario = (produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
											utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
											produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ','))
                        
						rows.push(
							[
								{
									text: isComplementar ? '' :	produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	alignment: 'center', style: {fontSize: 6}
								},
								{
									text: produtos[i]['PRODUTOS_NOME'].substring(0, 45), alignment: 'left', style: {fontSize: 6},
									colSpan: 10
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: isComplementar ? '' :	produtos[i]['NCMS_NCM'],
									alignment: 'center', style: {fontSize: 6}		
								},{},{},
								{
									text: isComplementar ? '' :	(produtos[i]['MOVIMENTOSITENS_ID_OPERACOES'].toString().substring(0, 4)),
									style: {fontSize: 5}
								},
								{
									text: isComplementar ? '' :	produtos[i]['MOVIMENTOSITENS_CST'],
									alignment: 'center', style: {fontSize: 5}
								},
								{
									colSpan: 2,
									text: isComplementar ? '' :	produtos[i]['MOVIMENTOSITENS_QUANTIDADE'],
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									text: isComplementar ? '' :	produtos[i]['PRODUTOS_UNIDADE'],
									alignment: 'center', style: {fontSize: 6}
								},
								{
									colSpan: 2,
									text: isComplementar ? '' :	precoUnitario,
									alignment: 'right', style: {fontSize: 6}
								},{},
								{
									colSpan: 3,
									text: isComplementar ? '' :	utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_TOTAL']),
									alignment: 'right', style: {fontSize: 6}
								},{},{},
								{
									colSpan: 2,
									text: isComplementar ? '' :	(utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_BASEICMS']) || ''),
									alignment: 'right',
									style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: isComplementar ? '' :	(utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORICMS']) || ''),
									alignment: 'right', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: isComplementar ? '' :	(utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORIPI']) || ''),
									alignment: 'right', style: {fontSize: 5}
								},{},
								{
									text: isComplementar ? '' :	(produtos[i]['MOVIMENTOSITENS_ICMS'] || ''),
									alignment: 'right', style: {fontSize: 6}
								},
								{
									text: isComplementar ? '' :	(produtos[i]['MOVIMENTOSITENS_IPI'] || ''),
									alignment: 'right', style: {fontSize: 6}
								}
		
							]
						)
						itensPagina++
					}


					for (linhas = itensPagina; linhas < 15; linhas++) {  // Aqui completamos a grid com linhas em branco
						rows.push(
							[
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									colSpan: 10,									
									text: ' ', style: {fontSize: 6},
								}, 
								{},{},{},{},{},{},{},{},{},
								{
									colSpan: 3,
									text: ' ', style: {fontSize: 6}
								},{},{},
								{
									text: ' ', style: {fontSize: 5}
								},
								{
									text: ' ', style: {fontSize: 5}
								},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									colSpan: 3,
									text: ' ', style: {fontSize: 6}
								},{},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 5}
								},{},
								{
									colSpan: 2,
									text: ' ', style: {fontSize: 6}
								},{},
								{
									text: ' ', style: {fontSize: 6}
								},
								{
									text: ' ', style: {fontSize: 6}
								}		
							]
						)
					}
					
					rows.push(
						[
							{ 
								text: 'DADOS ADICIONAIS\n',
								alignment: 'left',
								style: {fontSize: 6},
								colSpan: 25,									
								border: [false, false, false, false]
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
								text: 'www.samos.com.br',
								alignment: 'right',
								style: {fontSize: 7},
								colSpan: 7,									
								border: [false, false, false, false]
							},{},{},{},{},{},{}
						],
						[
							{ 
								text: [
									{ 
										text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' ?
										'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,
										style: {fontSize: 7}
									},
									{ 
										text: `${obsNfe}`,
										style: {fontSize: 8}
									}									
								],
								colSpan: 18
							}, 
							{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
							{
								text: 'RESERVADO AO FISCO',
								style: {fontSize: 7},
								colSpan: 14
							},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					);	
					
					rows.push(
						[
							{
								text: [
									{text: 'Entrega dos produtos em: '	},
									{text: dataEntrega, style: {fontSize: 8, bold: true}},
									{text: (turnoEntrega == 'M' ? '  ( X )' : '  (   )'), style: {bold: true}},
									{text: ' I - Turno da manhã'},
									{text: 'a'.repeat(19),style: {color: 'white'}},										
									{text: (turnoEntrega == 'T' ? '( X )' : '(   )'), style: {bold: true}},
									{text: ' II - Turno da tarde'},
									{text: 'a'.repeat(18),style: {color: 'white'}},										
									{text: (turnoEntrega == 'N' ? '( X )' : '(   )'), style: {bold: true}},
									{text: ' III - Turno da Noite\n'},
									{text: 'a'.repeat(20),style: {color: 'white'}},
									{text: ' compreende o periodo entre 7h e 11h          '},
									{text: ' compreende o periodo entre 12h e 18h         '},
									{text: ' compreende o periodo entre 19h e 23h\n'},
									{text: 'de acordo com a Lei Estadual 14.951 de 06 de Fevereiro de 2013.', alignment: 'right', style: {bold: true}}
								],
								colSpan: 32,
								alignment: 'left',
								border: [false, false, false, false]
							},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}
						]
					)				

					pdfStream(docDefinition, model['MOVIMENTOS_NUMERO'], resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
		});
    }
};

const getBarcode = function(chave) {
    return new Promise((resolve, reject) => {
		const codigo = codes.create('code128', chave);
		const codbar = (codigo || '').toString("base64");
        resolve(codbar);
    });
};