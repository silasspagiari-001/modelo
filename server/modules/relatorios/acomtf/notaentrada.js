'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const utils     = require('../../../services/samosUtils');
const codes     = require('rescode');
const moment    = require('moment-timezone');
const samosFB   = require('../../../services/samosFB');

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
    read: async (params) => { //readById (id, params)
        try {
		
			const queryMovimentos = await getMovimentoById(params.id, params)
			const model = queryMovimentos.results[0];

			let empresaUf = model['CIDADES_ESTADOEMPRESA'];
			let pessoaCnpj = '';
			let pessoaIe = '';
			let pessoaEnd = '';
			let pessoaNum = '';
			let pessoaBai = '';
			let pessoaCep = '';
			let pessoaMun = '';
			let pessoaUf = '';
			let pessoaFon = '';

			if(model['MOVIMENTOS_ID_PROPRIEDADES'] > 0) {
				pessoaCnpj = model['PROPRIEDADES_CPFCNPJ'];
				pessoaIe   = model['PROPRIEDADES_INSCRICAO'];
				pessoaEnd  = model['PROPRIEDADES_ENDERECO'];
				pessoaNum  = model['PROPRIEDADES_NUMERO'];;
				pessoaBai  = model['PROPRIEDADES_BAIRRO'];
				pessoaCep  = model['PROPRIEDADES_CEP'];
				pessoaMun  = model['CIDADES_NOMEPROPRIEDADE'];
				pessoaUf   = model['CIDADES_ESTADOPROPRIEDADE'];
				pessoaFon  = model['PROPRIEDADES_TELEFONE'];
			} else {
				pessoaCnpj = model['PESSOAS_CPFCNPJ'];
				pessoaIe   = model['PESSOAS_INSCRICAO'];
				pessoaEnd  = model['PESSOAS_ENDERECO'];
				pessoaNum  = model['PESSOAS_NUMERO'];;
				pessoaBai  = model['PESSOAS_BAIRRO'];
				pessoaCep  = model['PESSOAS_CEP'];
				pessoaMun  = model['CIDADES_NOME'];
				pessoaUf   = model['CIDADES_ESTADO'];
				pessoaFon  = model['PESSOAS_TELEFONE'];
			}

            const isLocal = pessoaUf == empresaUf; // Determina qual convênio listar
			let arrayConvenios = []; // Aqui irá a lista de convenios.
			let linhasConvenios = []; // Aqui é o que será impresso.

			const motivoNfe = model['MOVIMENTOS_PROTOCOLO'] == ''  ? `Nf-e sem Protocolo/Cód Barras - Sem valor fiscal` :
			                  model['MOVIMENTOS_STATUS']    == 'C' ? `Nf-e CANCELADA - Por motivo de emissão indevida` :
			                  model['MOVIMENTOS_STATUS']    == 'D' ? `............Nf-e DENEGADA pela SEFAZ...........` :
							  model['MOVIMENTOS_STATUS']    == 'R' ? `.........NF-e RECUSADA pelo Destinatário.......` : ''

			const docDefinition = {
				pageOrientation: 'portrait', 
				pageSize: 'A4',
				pageMargins: [20, 20, 20, 20],
				background: [					
					motivoNfe ?
					{  
						svg: `<svg><text
									transform="translate(50, 800) rotate(-50)"
									font-weight="bold"
									fill= "gray"
									style="font-size: 35px;"
								>
									${motivoNfe}
								</text></svg>`
					} : null
				],									
				content: [
					{
						style: 'tableReport', // antes (Tam)                                                      10  10
						table: { // Colunas (32)   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32 
							widths: [ 18,  5,  5,  7,  7,  7,  7,  7,  6,  6,  6,  4,  4,  4, 12, 12,  6,  8, 10, 28, 24,  8,  8,  8,  8,  8,  6,  6,  6,  6, 12, 12],
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

			const rows = docDefinition.content[0].table.body;
									
			const obsNfe = (model['MOVIMENTOS_OBSERVACOES'] ? model['MOVIMENTOS_OBSERVACOES'].split('|').slice(0, 7).join('\n') : '\n\n\n\n\n\n');
			const emiNfe = moment(model['MOVIMENTOS_EMISSAO']);
			const saiNfe = moment(model['MOVIMENTOS_ENTRADASAIDA']);
			const produtos = model['MOVIMENTOS_ITENS'];
			const transporte  = model['MOVIMENTOS_ENVIO'][0] || [];
			const barcodes  = (codes.create('code128', model['MOVIMENTOS_NFE']) || '').toString('base64');
			const empCelular = utils.string.maskFone(model['EMPRESAS_CELULAR']);
			const semFrete = transporte['MOVIMENTOSENVIO_MODO'] == 'S';
			
			let pagina = 1;				
			let itensPagina = 0;
			const paginas = (produtos.length <= 18 ? 1 : Math.trunc(produtos.length / 18) + ((produtos.length % 18) > 0 ? 1: 0));
			

			let	pathLogo = `${appRoot}/resources/images/headers/LogoTipoNFE.png`;

			const caixa       = model['MOVIMENTOS_CAIXA'] || [];
			let condPagto     = formaPagamento(model);
			const financeiros = (model['MOVIMENTOS_FINANCEIROS'] || []);

			const fatura01 = (financeiros.length > 0  ? `${model['MOVIMENTOS_NUMERO']}/01` : '');
			const fatura02 = (financeiros.length > 1  ? `${model['MOVIMENTOS_NUMERO']}/02` : '');
			const fatura03 = (financeiros.length > 2  ? `${model['MOVIMENTOS_NUMERO']}/03` : '');
			const fatura04 = (financeiros.length > 3  ? `${model['MOVIMENTOS_NUMERO']}/04` : '');
			const fatura05 = (financeiros.length > 4  ? `${model['MOVIMENTOS_NUMERO']}/05` : '');
			const fatura06 = (financeiros.length > 5  ? `${model['MOVIMENTOS_NUMERO']}/06` : '');
			const fatura07 = (financeiros.length > 6  ? `${model['MOVIMENTOS_NUMERO']}/07` : '');
			const fatura08 = (financeiros.length > 7  ? `${model['MOVIMENTOS_NUMERO']}/08` : '');
			const fatura09 = (financeiros.length > 8  ? `${model['MOVIMENTOS_NUMERO']}/09` : '');
			const fatura10 = (financeiros.length > 9  ? `${model['MOVIMENTOS_NUMERO']}/10` : '');
			const fatura11 = (financeiros.length > 10 ? `${model['MOVIMENTOS_NUMERO']}/11` : '');
			const fatura12 = (financeiros.length > 11 ? `${model['MOVIMENTOS_NUMERO']}/12` : '');

			const vencto01 = (financeiros.length > 0  ? moment(financeiros[0]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto02 = (financeiros.length > 1  ? moment(financeiros[1]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto03 = (financeiros.length > 2  ? moment(financeiros[2]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto04 = (financeiros.length > 3  ? moment(financeiros[3]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto05 = (financeiros.length > 4  ? moment(financeiros[4]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto06 = (financeiros.length > 5  ? moment(financeiros[5]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto07 = (financeiros.length > 6  ? moment(financeiros[6]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto08 = (financeiros.length > 7  ? moment(financeiros[7]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto09 = (financeiros.length > 8  ? moment(financeiros[8]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY'): '');
			const vencto10 = (financeiros.length > 9  ? moment(financeiros[9]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto11 = (financeiros.length > 10 ? moment(financeiros[10]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');
			const vencto12 = (financeiros.length > 11 ? moment(financeiros[11]['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY') : '');

			const valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['FINANCEIROS_ORIGINAL']) : '');
			const valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['FINANCEIROS_ORIGINAL']) : '');
			const valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['FINANCEIROS_ORIGINAL']) : '');
			const valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['FINANCEIROS_ORIGINAL']) : '');
			const valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['FINANCEIROS_ORIGINAL']) : '');
			const valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['FINANCEIROS_ORIGINAL']) : '');
			const valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['FINANCEIROS_ORIGINAL']) : '');
			const valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['FINANCEIROS_ORIGINAL']) : '');
			const valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['FINANCEIROS_ORIGINAL']) : '');
			const valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['FINANCEIROS_ORIGINAL']) : '');
			const valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['FINANCEIROS_ORIGINAL']) : '');
			const valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['FINANCEIROS_ORIGINAL']) : '');
			
			for(let i in produtos){
				if(itensPagina > 13 || itensPagina == 0) { // Se primeiro passo do laço ou se já imprimiu uma página
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
											text: `Informações: ${(model['EMPRESAS_SIMPLES'] == 'T' || model['EMPRESAS_SIMPLES'] == '0' || model['EMPRESAS_SIMPLES'] == '2' ?
											'Empresa optante do simples nacional, não gera crédito de ICMS/IPI' : '')}\n`,														
											style: {fontSize: 7}
										},
										{ 
											text: `${obsNfe}`,
											style: {fontSize: 8}
										},
										{ 
											text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Pedido: ${model['MOVIMENTOS_NUMEROORIGEM']}` : '',
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
								text: `RECEBEMOS DE ${model['PESSOAS_NOME']}, OS PRODUTOS/SERVIÇOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO:`,
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

					rows.push([
						{
							colSpan: 13,
							text: model['PESSOAS_NOME'],
							alignment: 'center',
							border: [true, true, true, false],
							style: {bold: true,	fontSize: 9}
						},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 5,
							text: 'DANFE',
							alignment: 'center',
							border: [true, true, true, false],									
							style: {bold: true,	fontSize: 9}
						},{},{},{},{},
						{
							text: 'CONTROLE DO FISCO',
							colSpan: 14,
							border: [true, true, true, false]																		
						},{},{},{},{},{},{},{},{},{},{},{},{},{}
					]);

					rows.push(
						[
							{
								image: `${pathLogo}`,
								colSpan: 4,
								width: 70, //50
								height: 50,
								alignment: 'center',
								border: [true, false, false, true]
							},{},{},{},
							{
								colSpan: 9,
								text: [
									{
										text: `${model['PESSOAS_ENDERECO']} ${model['PESSOAS_NUMERO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `${model['PESSOAS_BAIRRO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `Cep: ${utils.string.maskCep(model['PESSOAS_CEP'])} - ${model['CIDADES_NOME']} - ${model['CIDADES_ESTADO']}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `Fone: ${utils.string.maskFone(model['PESSOAS_TELEFONE'])}\n`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: (empCelular ? `Celular: ${model['PESSOAS_CELULAR']}\n` : ''),
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									},
									{
										text: `${model['PESSOAS_EMAIL']}`,
										alignment: 'left',
										style: {bold: true,	fontSize: 7}
									}
								],
								border: [false, false, true, true]
							},{},{},{},{},{},{},{},{},
							{
								colSpan: 5,
								text: [
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

								],
								border: [true, false, true, true]
							},
							{},{},{},{},
							{ 
								colSpan: 14,
								border: [false, false, true, false],
								table: {
									body: [
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
								{text: `${model['PESSOAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
								{text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 6, bold: true}}
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
								{text: `${model['EMPRESAS_NOME']} (${model['MOVIMENTOS_ID_EMPRESAS']})`, alignment: 'left', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 7,
							text: [
								{text: `CNPJ/CPF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${utils.string.maskCnp(model['EMPRESAS_CPFCNPJ'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},
						{
							colSpan: 6,
							text: [
								{text: `Data de Emissão\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${emiNfe.isSameOrBefore('1900-01-01') ? '' : emiNfe.format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{}]
					);

					rows.push(
						[{
							colSpan: 13,
							text: [
								{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${model['EMPRESAS_ENDERECO']}`, alignment: 'left', style: {fontSize: (pessoaEnd.length > 40 ? 7 : 8), bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${model['EMPRESAS_NUMERO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},						
						{
							colSpan: 6,
							text: [
								{text: `Bairro\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${model['EMPRESAS_BAIRRO']}`, alignment: 'center', style: {fontSize: (pessoaBai.length > 20 ? 5 : 8), bold: true}}
							]
						},{},{},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `CEP\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${utils.string.maskCep(model['EMPRESAS_CEP'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 6,
							text: [
								{text: `Data de Saída/Entrada\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${saiNfe.isSameOrBefore('1900-01-01') ? '' : saiNfe.format('DD/MM/YYYY')}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{}]
					);

					rows.push(
						[{
							colSpan: 12,
							text: [
								{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${model['CIDADES_NOMEEMPRESA']}`, alignment: 'left', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 5,
							text: [
								{text: `Telefone\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${utils.string.maskFone(model['EMPRESAS_TELEFONE'])}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},
						{
							colSpan: 2,
							text: [
								{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${model['CIDADES_ESTADOEMPRESA']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
							]
						},{},
						{
							colSpan: 7,
							text: [
								{text: `Inscrição Estadual\n`, alignment: 'left', style: {fontSize: 6}},
								{text: `${model['EMPRESAS_INSCRICAO']}`, alignment: 'center', style: {fontSize: 8, bold: true}}
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
								{text: `${fatura01}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura02}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura03}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura04}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto01}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto02}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto03}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto04}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor01}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor02}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor03}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor04}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${fatura05}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura06}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura07}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura08}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}

							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto05}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto06}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto07}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto08}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor05}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor06}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor07}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor08}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},
						{
							colSpan: 3,
							text: [
								{text: `Número\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${fatura09}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura10}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura11}\n`, alignment: 'center', style: {fontSize: 6, bold: true}},
								{text: `${fatura12}\n`, alignment: 'center', style: {fontSize: 6, bold: true}}
							]
						},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Vencimento\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${vencto09}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto10}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto11}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${vencto12}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
							]
						},{},{},{},
						{
							colSpan: 4,
							text: [
								{text: `Valor\n`, alignment: 'center', style: {fontSize: 6}},
								{text: `${valor09}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor10}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor11}\n`, alignment: 'center', style: {fontSize: 7, bold: true}},
								{text: `${valor12}\n`, alignment: 'center', style: {fontSize: 7, bold: true}}
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
								{text: `Valor do Desconto\n`, alignment: 'center', style: {fontSize: 6}},
								{text: '', alignment: 'center', style: {fontSize: 8, bold: true}},
								{text: utils.number.float2moeda(model['MOVIMENTOS_DESCONTOS']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},
						{
							colSpan: 6,
							text: [
								{text: `Valor Produtos\n`, alignment: 'center', style: {fontSize: 6}},
								{text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']), alignment: 'center', style: {fontSize: 8, bold: true}},
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
								{text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']), alignment: 'center', style: {fontSize: 8, bold: true}},
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
							colSpan: 14,
							text: [
								{text: `Nome/Razão Social\n`, alignment: 'left', style: {fontSize: 6}},
								{text: transporte['MOVIMENTOSENVIO_NOME'] || ' ', alignment: 'left', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 5,
							text: [
								{
									text: `Frete por Conta\n1 = Emitente        3 = Terceiros\n2 = Destinatário  4 = Sem Frete`,
									alignment: 'left',
									style: {fontSize: 5}										
								}
							],
							border: [true, true, false, true]
						},{},{},{},{},
						{
							text: [
								{
									text: 'a\n', color: 'white', style: {fontSize: 4},
								},
								{
									text: (transporte['MOVIMENTOSENVIO_MODO'] == 'C' ? '1' : 
											transporte['MOVIMENTOSENVIO_MODO'] == 'F' ? '2' :
											transporte['MOVIMENTOSENVIO_MODO'] == 'T' ? '3' : '4'),
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
								{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PLACA']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},
						{
							colSpan: 2,
							text: [
								{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PLACAUF']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},
						{
							colSpan: 6,
							text: [
								{text: `CPF/CNPJ\n`, alignment: 'center', style: {fontSize: 6}},
								{text: (semFrete ? '' : utils.string.maskCnp(transporte['MOVIMENTOSENVIO_CPFCNPJ'])), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},{}]
					);

					rows.push(
						[{
							colSpan: 14,
							text: [
								{text: `Endereço\n`, alignment: 'left', style: {fontSize: 6}},
								{text: ``, alignment: 'left', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 10,
							text: [
								{text: `Município\n`, alignment: 'left', style: {fontSize: 6}},
								{text: (semFrete ? '' : transporte['CIDADES_NOME']), alignment: 'left', style: {fontSize: 8, bold: true}}
							]
						},{},{},{},{},{},{},{},{},{},
						{
							colSpan: 2,
							text: [
								{text: `UF\n`, alignment: 'center', style: {fontSize: 6}},
								{text: (semFrete ? '' : transporte['CIDADES_ESTADO']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},
						{
							colSpan: 6,
							text: [
								{text: `Inscrição Estadual\n`, alignment: 'center', style: {fontSize: 6}},
								{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_INSCRICAO']), alignment: 'center', style: {fontSize: 8, bold: true}},
							]
						},{},{},{},{},{}]
					);

					rows.push(
						[
							{
								colSpan: 5,
								text: [
									{text: `Quantidade\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (transporte['MOVIMENTOSENVIO_QUANTIDADE'] || ' '), alignment: 'center', style: {fontSize: 8, bold: true}},
								]
							},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `Espécie\n`, alignment: 'center', style: {fontSize: 6}},
									{text: transporte['MOVIMENTOSENVIO_ESPECIE'], alignment: 'center', style: {fontSize: 8, bold: true}}
								]
							},{},{},{},{},{},
							{
								colSpan: 6,
								text: [
									{text: `Marca\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_MARCA']), alignment: 'center', style: {fontSize: 8, bold: true}},
								]
							},{},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Volumes\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_VOLUMES']), alignment: 'center', style: {fontSize: 8, bold: true}},
								]
							},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Peso Bruto\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PESOBRUTO'] || ''), alignment: 'center', style: {fontSize: 8, bold: true}},
								]
							},{},{},{},{},
							{
								colSpan: 5,
								text: [
									{text: `Peso Líquido\n`, alignment: 'center', style: {fontSize: 6}},
									{text: (semFrete ? '' : transporte['MOVIMENTOSENVIO_PESOLIQUIDO'] || ''), alignment: 'center', style: {fontSize: 8, bold: true}},
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
							{   // Coluna 1 (Código)
								text: 'Cód',	alignment: 'center', style: {fontSize: 6, bold: true}
							},
							{
								text: 'Descrição dos Produtos',	alignment: 'left', style: {fontSize: 6, bold: true},
								colSpan: 10
							}, // Colunas 2 a 11 (Descrição)
							{},{},{},{},{},{},{},{},{},
							{  // Colunas 12 a 14 (NCM)
								colSpan: 3,
								text: 'NCM/SH',
								alignment: 'center', style: {fontSize: 6, bold: true}		
							},{},{},
							{   // Coluna 15 (CFOP)
								text: 'Cfop',
								style: {fontSize: 5, bold: true}
							},
							{   // Coluna 16 (CST)
								text: 'Cst',
								style: {fontSize: 5, bold: true}
							},
							{   // Coluna 17 e 18 (Qtde)
								colSpan: 2,
								text: 'Qtde',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},
							{   // Coluna 19 (UN)
								text: 'Un',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 20 (Preço)
								text: 'Preço',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{ // Coluna 21 (Desconto)
								text: 'Desconto',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 22 a 24 (Total)
								colSpan: 3,
								text: 'Vlr. Total',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},{},
							{   // Coluna 25 e 26 (Base ICMS)
								colSpan: 2,
								text: 'Base Icms',
								style: {fontSize: 5, bold: true}
							},{},
							{   // Coluna 27 e 28 (Valor ICMS)
								colSpan: 2,
								text: 'Vlr. Icms',
								style: {fontSize: 5, bold: true}
							},{},
							{   // Coluna 29 e 30 (Vlr Ipi)
								colSpan: 2,
								text: 'Vlr. Ipi',
								alignment: 'center', style: {fontSize: 6, bold: true}
							},{},
							{   // Coluna 31 (Valor Icms)
								text: 'Icms',
								alignment: 'center', style: {fontSize: 5, bold: true}
							},
							{   // Coluna 32
								text: 'Ipi',
								alignment: 'center', style: {fontSize: 6, bold: true}
							}
						]
					);
				}

				const precoUnitario = (
					produtos[i]['MOVIMENTOSITENS_PRECO'].toString().length <= produtos[i]['MOVIMENTOSITENS_PRECO'].toFixed(2).length ?
				    utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_PRECO']) :
					produtos[i]['MOVIMENTOSITENS_PRECO'].toString().replace('.', ',')
				);

				const descontoUnitario = (
					produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toString().length <= produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toFixed(2).length ?
					utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_DESCONTOS']) :
									     produtos[i]['MOVIMENTOSITENS_DESCONTOS'].toString().replace('.', ','))


				const letraLocal  = produtos[i]['SALDOS_LOCAL'].match(/,/) ? produtos[i]['SALDOS_LOCAL'].split(',')[0] : ''
				const letraOutros = produtos[i]['SALDOS_LOCAL'].match(/,/) ? produtos[i]['SALDOS_LOCAL'].split(',')[1] : ''
			    const letraConvenio = isLocal ? letraLocal : letraOutros ;

                if(arrayConvenios.indexOf(letraConvenio) == -1) {
					arrayConvenios.push(letraConvenio);
				}

				rows.push(
					[
						{
							text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	alignment: 'center', style: {fontSize: 6}
						},
						{
							text: produtos[i]['PRODUTOS_NOME'] + (letraConvenio ? '*' + letraConvenio : ''), 
							alignment: 'left', 
							style: {fontSize: produtos[i]['PRODUTOS_NOME'].length > 40 ? 5 : 6},
							colSpan: 10
						}, 
						{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: produtos[i]['NCMS_NCM'],
							alignment: 'center', style: {fontSize: 6}		
						},{},{},
						{
							text: parseInt(produtos[i]['MOVIMENTOSITENS_ID_OPERACOES'] / 100),
							style: {fontSize: 5}
						},
						{
							text: produtos[i]['MOVIMENTOSITENS_CST'],
							alignment: 'center', style: {fontSize: 5}
						},
						{
							colSpan: 2,
							text: produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toString().replace('.',','),
							alignment: 'right', style: {fontSize: 6}
						},{},
						{
							text: produtos[i]['PRODUTOS_UNIDADE'].slice(0, 2),
							alignment: 'center', style: {fontSize: 6}
						},
						{
							text: precoUnitario,
							alignment: 'right', style: {fontSize: 6}
						},
						{
							text: descontoUnitario,
							alignment: 'right', style: {fontSize: 5}
						},
						{
							colSpan: 3,
							text: utils.number.float2moeda(produtos[i]['TOTAL_LIQUIDO']),
							alignment: 'right', style: {fontSize: 6}
						},{},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_BASEICMS']) || '',
							alignment: 'right',
							style: {fontSize: 5}
						},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORICMS']) || '',
							alignment: 'right', style: {fontSize: 5}
						},{},
						{
							colSpan: 2,
							text: utils.number.float2moeda(produtos[i]['MOVIMENTOSITENS_VALORIPI']) || '',
							alignment: 'right', style: {fontSize: 6}
						},{},
						{
							text: produtos[i]['MOVIMENTOSITENS_ICMS'] || '',
							alignment: 'right', style: {fontSize: 6}
						},
						{
							text: produtos[i]['MOVIMENTOSITENS_IPI'] || '',
							alignment: 'right', style: {fontSize: 6}
						}

					]
				)

				itensPagina++

			}

			for (let linhas = itensPagina; linhas < 16; linhas++) {  // Aqui completamos a grid com linhas em branco
				rows.push(
					[
						{
							text: ' ', style: {fontSize: 6}  // 1
						},
						{
							colSpan: 10,									
							text: ' ', style: {fontSize: 6}, // 2-11
						}, 
						{},{},{},{},{},{},{},{},{},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 12-14
						},{},{},
						{
							text: ' ', style: {fontSize: 5} // 15
						},
						{
							text: ' ', style: {fontSize: 5}  // 16
						},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 6}  // 17-18
						},{},
						{
							text: ' ', style: {fontSize: 6}  // 19
						},
						{
							text: ' ', style: {fontSize: 6}  // 20
						},
						{
							text: ' ', style: {fontSize: 6}  // 21
						},
						{
							colSpan: 3,
							text: ' ', style: {fontSize: 6} // 20-22
						},{},{},
						{
							colSpan: 2,
							text: ' ', style: {fontSize: 5} // 
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
								text: `Informações Complementares: \n`,
								style: {fontSize: 7}
							},
							{ 
								text: `\n `,
								style: {fontSize: 7}
							},
							{ 
								text: ``,
								style: {fontSize: 7}
							},
							{ 
								text: `${obsNfe}`,
								style: {fontSize: 8}
							},
							{ 
								text: parseInt(model['MOVIMENTOS_NUMEROORIGEM'] || '') > 0 ? `Pedido: ${model['MOVIMENTOS_NUMEROORIGEM']}` : '',
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

			const pdfName = await pdfStream(docDefinition);

			return { results: [ { name: pdfName } ] }

		} catch(error) {
			const msg = 'Falha ao gerar danfe';
			console.log(msg);
			console.log(error);
			throw { msg, error };
		}
    }
};

const formaPagamento = function(model) {
	let formas = '';
	let caixa  = model['MOVIMENTOS_CAIXA'] || [];
	
	if(caixa.length > 0) {
		for (let i in caixa) {
			if(caixa[i]['MOVIMENTOSCAIXA_DINHEIRO'] > 0) {
				formas += 'DINHEIRO/';
			}		
			if(caixa[i]['MOVIMENTOSCAIXA_TRANSFERENCIAS'] > 0) {
				formas += 'TRANSFERENCIA BANCARIA/';
			}		
			if(caixa[i]['MOVIMENTOSCAIXA_CHEQUE'] > 0) {
				formas += 'CHEQUE/';
			}
			if((caixa[i]['MOVIMENTOSCAIXA_CREDITO'] + caixa[i]['MOVIMENTOSCAIXA_DEBITO']) > 0) {
				formas += 'CARTAO/';
			}
			if(caixa[i]['MOVIMENTOSCAIXA_OUTRO'] > 0) {
				formas += 'FINANCEIRA/';
			}
		}	
	} else {
		formas = ' ';
	}

	return formas.substr(0, (formas.length - 1));
};