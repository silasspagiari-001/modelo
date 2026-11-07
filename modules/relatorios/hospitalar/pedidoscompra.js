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
				iif(((MOVIMENTOSITENS_ID_PRODUTOS=999999) or (PRODUTOS_DERIVADO = 'T')),
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
    read: params => {
        return new Promise(async (resolve, reject) => {
			getMovimentoById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 30, 20, 25], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: { // Seq Cod   [Descricao  ]   C   L   D   I   E  [Preço] [Tota] 
									//        0   1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 15 Colunas
									widths: [17, 30, 43, 19, 55, 31, 21, 29, 29, 29, 29, 20, 20, 20, 29], // TOTAL: 414
                                    heights: 5,
                                    headerRows: 9,
									body: []
								},
								style: {
									fontSize: 8
								}
							}
                        ],
                        footer: function(page, pages) {
                            return { 
                                stack: [ 
                                    { text: 'Página: ' + page.toString() + ' de ' + pages.toString(), italics: true, fontSize: 7, alignment: 'right'}
                                ],
                                margin: [15, 10]  // 10, 10
                            };
                        },                                    
						styles: {
							tableReport: {
								margin: [0, 0, 0, 0],
							}
						}
					};
							
					const impLog = params.userLogin + ' ' + moment.tz(params.timezone).format('DD/MM/YYYY HH:mm:ss');
					let model = res.results[0];

					let fanFilial = model['EMPRESAS_FANTASIA'];
					let siglaFilial = fanFilial.indexOf('-') != -1 ? fanFilial.slice(fanFilial.indexOf('-') + 2, Infinity) : fanFilial.slice(0, 2);
                    let fanPessoa = (siglaFilial != 'FT' && model['PESSOAS_FANTASIA'] ? model['PESSOAS_FANTASIA'] : '');
                    const percentuaisValue = model['MOVIMENTOS_NFE'] || ''; // % Frete, Seguro, IPI                    

                    let percFrete  = (percentuaisValue || '').split('|')[0];
                    let percSeguro = (percentuaisValue || '').split('|')[1];
                    let percIpi    = (percentuaisValue || '').split('|')[2];                    

                    percIpi    = percIpi ? ' (' + percIpi + '%)' : '';
                    percFrete  = percFrete ? ' (' + percFrete + '%)' : '';
                    percSeguro = percSeguro ? ' (' + percSeguro + '%)' : '';

					let financeiros = model['MOVIMENTOS_FINANCEIROSCOMPRA'] || [];

					let vencto01 = (financeiros.length > 0  ? `${moment(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto02 = (financeiros.length > 1  ? `${moment(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto03 = (financeiros.length > 2  ? `${moment(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto04 = (financeiros.length > 3  ? `${moment(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto05 = (financeiros.length > 4  ? `${moment(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto06 = (financeiros.length > 5  ? `${moment(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto07 = (financeiros.length > 6  ? `${moment(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto08 = (financeiros.length > 7  ? `${moment(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto09 = (financeiros.length > 8  ? `${moment(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto10 = (financeiros.length > 9  ? `${moment(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto11 = (financeiros.length > 10 ? `${moment(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');
					let vencto12 = (financeiros.length > 11 ? `${moment(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VCTO']).format('DD/MM/YYYY')} - ` : '');

					let valor01 = (financeiros.length > 0  ? utils.number.float2moeda(financeiros[0]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor02 = (financeiros.length > 1  ? utils.number.float2moeda(financeiros[1]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor03 = (financeiros.length > 2  ? utils.number.float2moeda(financeiros[2]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor04 = (financeiros.length > 3  ? utils.number.float2moeda(financeiros[3]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor05 = (financeiros.length > 4  ? utils.number.float2moeda(financeiros[4]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor06 = (financeiros.length > 5  ? utils.number.float2moeda(financeiros[5]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor07 = (financeiros.length > 6  ? utils.number.float2moeda(financeiros[6]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor08 = (financeiros.length > 7  ? utils.number.float2moeda(financeiros[7]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor09 = (financeiros.length > 8  ? utils.number.float2moeda(financeiros[8]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor10 = (financeiros.length > 9  ? utils.number.float2moeda(financeiros[9]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor11 = (financeiros.length > 10 ? utils.number.float2moeda(financeiros[10]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');
					let valor12 = (financeiros.length > 11 ? utils.number.float2moeda(financeiros[11]['MOVIMENTOSFINANCEIROSCOMPRA_VALOR']) : '');

                    let obsPedido = (model['MOVIMENTOS_OBSERVACOES'].split('|')[0] + ' ' + 
                                    model['MOVIMENTOS_OBSERVACOES'].split('|')[1] + ' ' + 
                                    model['MOVIMENTOS_OBSERVACOES'].split('|')[2]).toUpperCase();
                    let obsPessoa = model['PESSOAS_OBSERVACOES'].toUpperCase();

					const emiPedido     =  moment(model['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
					let produtos        = model['MOVIMENTOS_ITENS'];
					let rows            = docDefinition.content[0].table.body;

					let pathLogo;

					try {
						pathLogo = utils.client.getImagePath(`logos/headers/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/headers/default.png`;
					}
                    
					let pathFone  = `${appRoot}/resources/images/headers/telefone.png`
					let pathWhats = `${appRoot}/resources/images/headers/whatsapp.png`

                    let tamIpi = percIpi - parseInt(percIpi) != 0 ? 7 : 8;
                    let tamFrete = percFrete - parseInt(percFrete) != 0 ? 7 : 8;
                    let tamSeguro = percSeguro - parseInt(percSeguro) != 0 ? 7 : 8;

                    rows.push(
                        [
                            {
                                image: pathLogo,
                                fit: [100, 100],									
                                colSpan: 3,
                                width: 80,
                                alignment: 'center',
                                margin: [0, 10, 0, 0],
                                border: [true, true, false, true]
                            },{},{},
                            {
                                colSpan: 4,
                                text: [
                                    {
                                        text: model['EMPRESAS_NOME'] + '\n',
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 8}
                                    },
                                    {
                                        text: `${model['EMPRESAS_ENDERECO']} ${model['EMPRESAS_NUMERO']} - ${model['EMPRESAS_BAIRRO']}\n`,
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                    {
                                        text: utils.string.maskCep(model['EMPRESAS_CEP']) + ' ' + model['CIDADES_NOMEEMPRESA'] + ' ' + model['CIDADES_ESTADOEMPRESA'] + '\n',
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                    {
                                        text: 'CNPJ: ' +  utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']) + '\nI.E.: ' + model['EMPRESAS_INSCRICAO'],
                                        alignment: 'left',
                                        style: {bold: true,	fontSize: 7}
                                    },
                                ],
                                border: [false, true, true, true]
                            },{},{},{},
                            {
                                colSpan: 6,
                                table: {
                                    body: [
                                        [
                                            {
                                                text: 'T', // só pra alinhamento
                                                fontSize: 5,
                                                color: 'white'
                                            },
                                            {
                                                text: `PEDIDO DE COMPRA`,
                                                alignment: 'center',
                                                style: {bold: true,	fontSize: 12}
                                            },{}
                                        ],
                                        [ 
                                            {
                                                text: 'T', // só pra alinhamento
                                                fontSize: 5,
                                                color: 'white'
                                            },
                                            {
                                                table: {
                                                    body: [
                                                        [	
                                                            {
                                                                image: pathFone,
                                                                width: 13,  //10 all
                                                                height: 13	
                                                            },
                                                            {
                                                                text: utils.string.maskFone(model['EMPRESAS_TELEFONE']),
                                                                style: {fontSize: 9, bold: true}
                                                            },																
                                                            {
                                                                image: pathWhats,
                                                                width: 13,
                                                                height: 13	
                                                            },
                                                            {
                                                                text: utils.string.maskFone(model['EMPRESAS_CELULAR']),
                                                                style: {fontSize: 9, bold: true}																	
                                                            }
                                                        ]
                                                    ]														
                                                },
                                                layout: 'noBorders'													
                                            },{
                                                text: ''
                                            }
                                        ]
                                    ]
                                },
                                layout: 'noBorders'
                            },
                            {},{},{},{},{},
                            { 
                                colSpan: 2,									
                                text: [
                                    {
                                        text: ''
                                    },
                                    {
                                        text: `\n`,
                                        fontSize: 6,
                                        alignment: 'center'
                                    },
                                    {
                                        text: model['MOVIMENTOS_NUMERO'],
                                        alignment: 'center',
                                        style: {
                                            bold: true,
                                            fontSize: 15
                                        }
                                    },
                                    {
                                        text: `\n${emiPedido}`,
                                        alignment: 'center',
                                        style: {
                                            bold: true,
                                            fontSize: 10
                                        }										
                                    }									
                                ]
                            },{}
                        ],
                        [
                            {
                                text: 'Nome',
                                colSpan: 2
                            },{},
                            {
                                text: model['MOVIMENTOS_NOME'] + (fanPessoa.length > 0 ? ` (${fanPessoa.toUpperCase()})` : ''),
                                colSpan: 9
                            },{},{},{},{},{},{},{},{},
                            {
                                text: 'Cel',
                                alignment: 'right'
                            },
                            {
                                text: utils.string.maskFone(model['MOVIMENTOS_CELULAR']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Endereço',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_ENDERECO'],
                                colSpan: 7
                            },{},{},{},{},{},{},{
                                text: 'Número',
                                alignment: 'right',
                                style: {
                                    fontSize: 7.5
                                }										
                            },{
                                text: model['PESSOAS_NUMERO'],
                                alignment: 'right'
                            },
                            {
                                text: 'Tel',
                                alignment: 'right'
                            },
                            {
                                text: utils.string.maskFone(model['PESSOAS_TELEFONE']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Bairro',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_BAIRRO'],
                                colSpan: 6
                            },{},{},{},{},{},	
                            {
                                text: 'Cep',
                                alignment: 'right'
                            }, 
                            {
                                text: model['PESSOAS_CEP'].substr(0, 5) + '-' + model['PESSOAS_CEP'].substr(5, 3),
                                colSpan: 2
                            },{},
                            {
                                text: (model['MOVIMENTOS_CPFCNPJ'].length == 11 ? "RG" : "Ie"),
                                alignment: 'right'
                            },{
                                text: model['PESSOAS_INSCRICAO'],
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Cidade',
                                colSpan: 2
                            },{},
                            {
                                text: model['CIDADES_NOME'],
                                colSpan: 4
                            },{},{},{},
                            {
                                text: 'UF',
                                alignment: 'right'
                            },
                            {
                                text: model['CIDADES_ESTADO'],
                                alignment: 'center'
                            },	
                            {
                                text: 'Prazo',
                                alignment: 'right'
                            },{
                                text: model['PRAZOS_NOME'].substring(0, 16),
                                colSpan: 2
                            },{},
                            {
                                text: model['MOVIMENTOS_CPFCNPJ'].length == 11 ? 'CPF' : 'CNPJ',
                                alignment: 'right'
                            }, 
                            {
                                text: utils.string.maskCnp(model['MOVIMENTOS_CPFCNPJ']),
                                colSpan: 3
                            },{},{}
                        ],
                        [
                            {
                                text: 'Complemento',
                                colSpan: 2
                            },{},
                            {
                                text: model['PESSOAS_PAGINA'].toUpperCase(),
                                colSpan: 6
                            },{},{},{},{},{},
                            {
                                text: 'E-mail',
                                alignment: 'right',
                            },{
                                text: model['MOVIMENTOS_EMAIL'],
                                colSpan: 6
                            },{},{},{},{},{}
                        ],
                        [
                            { 
                                text: 'Observações:',
                                colSpan: 2
                            },{},
                            {
                                text: (obsPessoa == 'null' ? '' : obsPessoa),
                                colSpan: 13
                            },{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            { 
                                text: '\n', 
                                style: {
                                    fontSize: 1
                                },
                                colSpan: 15,									
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
                        ],
                        [
                            {
                                text: 'Seq',
                                alignment: 'center'
                            },
                            {
                                text: 'Código',
                                alignment: 'center'
                            },
                            {
                                text: 'Descrição do Produto',
                                alignment: 'center',
                                colSpan: 8
                            }, 
                            {},{},{},{},{},{},{},
							{
                                text: 'Qtde',
                                alignment: 'center'
                            },
                            {
                                colSpan: 2,
                                text: 'Preço',
                                alignment: 'center'								
                            },{},
                            {
                                colSpan: 2,
                                text: 'Total',
                                alignment: 'center'								
                            },{}
                        ]
                    );

                    for(let i in produtos){
                        let qtdeProduto = produtos[i]['MOVIMENTOSITENS_QUANTIDADE'].toFixed(0);
                        rows.push(
                            [
                                {
                                    text: ('000' + produtos[i]['MOVIMENTOSITENS_ID_EMPRESAS']).slice(-3),
                                    alignment: 'center',
                                    style: {
                                        fontSize: 8
                                    }											
                                },
                                {							
                                    text: produtos[i]['MOVIMENTOSITENS_ID_PRODUTOS'],	
                                    alignment: 'center',
                                    style: {
                                        fontSize: 8
                                    }											
                                },
                                {
                                    text: produtos[i]['PRODUTOS_NOME'],
                                    colSpan: 8,
                                    style: {
                                        fontSize: 8
                                    }
                                },{},{},{},{},{},{},{},
                                {
                                    text: qtdeProduto,
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },
                                {
                                    colSpan: 2,
                                    text: utils.number.float2moeda((produtos[i]['MOVIMENTOSITENS_PRECO'])),
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },{},
                                {
                                    colSpan: 2,
                                    text: utils.number.float2moeda((produtos[i]['MOVIMENTOSITENS_TOTAL'] - produtos[i]['MOVIMENTOSITENS_DESCONTOS'])),
                                    alignment: 'right',
                                    style: {
                                        fontSize: 8
                                    }																			
                                },{}
                            ]
                        )

                    };

                    rows.push(
                        [
                            {  
                                text: [ 
                                    {text: vencto01},
                                    {text: valor01, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},
                                    {text: vencto04},
                                    {text: valor04, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto07},
                                    {text: valor07, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto10},
                                    {text: valor10, alignment: 'right'},
                                ],
                                colSpan: 11,
                                border: [false, false, false, false]
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Produtos',
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true
                                }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_PRODUTOS']),
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true							
                                }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [ 
                                    {text: vencto02},
                                    {text: valor02, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto05},
                                    {text: valor05, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto08},
                                    {text: valor08, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                          
                                    {text: vencto11},
                                    {text: valor11, alignment: 'right'},
                                ],
                                border: [false, false, false, false],
                                colSpan: 11
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'IPI' + percIpi,
                                alignment: 'right',                                
                                style: { fontSize: tamIpi }
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_VALORIPI']),
                                alignment: 'right',
                                style: { fontSize: 9 }
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: [ 
                                    {text: vencto03},
                                    {text: valor03, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto06},
                                    {text: valor06, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto09},
                                    {text: valor09, alignment: 'right'},
                                    {text: 'AAA', color: 'white'},                                    
                                    {text: vencto12},
                                    {text: valor12, alignment: 'right'}                                        
                                ],
                                border: [false, false, false, false],                                
                                colSpan: 11
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Frete' + percFrete,
                                alignment: 'right',
                                style: { fontSize: tamFrete }
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_FRETE']),
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: `Comprador: ${params.userName}`,
                                colSpan: 11,
                                border: [false, false, false, false]                                
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Seguro' + percSeguro,
                                alignment: 'right',                                
                                style: { fontSize: tamSeguro }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_SEGURO']),
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );

                    rows.push(
                        [
                            {
                                text: `Situação: ${model['MOVIMENTOS_STATUS'] == 'N' ? 'ABERTO' : 'ENTREGUE'}`,
                                colSpan: 11,
                                border: [false, false, false, false]                                
                            },{},{},{},{},{},{},{},{},{},{},
                            {
                                colSpan: 2,
                                text: 'Despesas',
                                alignment: 'right',                                
                                style: {fontSize: 8}
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_DESPESAS']),
                                alignment: 'right',
                                style: { fontSize: 9 }																			
                            },{}
                        ]
                    );
                    rows.push(
                        [
                            {
                                text: [
                                    {
                                        text: 'Impresso por: '
                                    },
                                    {
                                        text: impLog,
                                        style: { fontSize: 8, bold: true }
                                    }
                                ],
                                colSpan: 5,
                                alignment: 'left',
                                border: [false, false, false, false],
                            },{},{},{},{},
                            { text: '', border: [false, false, false, false]},
                            {
                                text: 'Assinatura',
                                alignment: 'center',
                                colSpan: 4,
                                border: [false, true, false, false]
                            },{},{},{},
                            { text: '', border: [false, false, false, false]},                            
                            {
                                colSpan: 2,
                                text: 'Total',
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true
                                }																		
                            },{},
                            {
                                colSpan: 2,
                                text: utils.number.float2moeda(model['MOVIMENTOS_TOTAL']),
                                alignment: 'right',
                                style: {
                                    fontSize: 9,
                                    bold: true							
                                }																			
                            },{}
                        ]
                    );
                    rows.push(
                        [
                            {
                                text: `Observações: ${obsPedido}`,
                                border: [false, false, false, false],
                                colSpan: 15
                            },{},{},{},{},{},{},{},{},{},{},{},{},{},{}
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