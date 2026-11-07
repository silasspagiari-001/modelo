'use strict';

const path      = require('path');
const appRoot   = path.dirname(require.main.filename);
const fs        = require('fs');
const utils     = require('../../../services/samosUtils');
const api       = require('../..');
const pdfStream = require('../../../services/pdfStream');
const moment    = require('moment-timezone');
const cents     = utils.number.cents.bind(utils.number);

module.exports = {
    read: params => {
        return new Promise(async (resolve, reject) => {
			api.ordenseleve().readById(params.id, params)
				.then(res => {
					let docDefinition = {
						pageOrientation: 'portrait', 
						pageSize: 'A4',
						pageMargins: [20, 0, 20, 15], //  [20, 20, 20, 35]
						content: [
							{
								style: 'tableReport',
								table: {   //                         
									//        1   2   3   4   5   6   7   8   9  10  11  12  13  14 // 14 Colunas
									widths: [45, 45, 45, 45, 45, 45, 20, 20, 20, 20, 20, 20, 20, 20], // TOTAL: 414
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
					
					let model = res.results[0];
					const isFechada = model['ORDENS_STATUS'] != 'N';
					const emiOrdem  = moment(model['ORDENS_EMISSAO']).format('DD/MM/YYYY');
					let servicos    = model['ORDENS_SERVICOSITENS'] || [];
					let rows        = docDefinition.content[0].table.body;
					let pathLogo;
					let numPagina   = 0;

					try {
						pathLogo = utils.client.getImagePath(`logos/pedido/${model['EMPRESAS_CPFCNPJ']}.png`, params);
					} catch(error) {
						pathLogo = `${appRoot}/resources/images/pedido/defaultE.png`;
					}

					for(let i in servicos){  // Uma página para cada serviço.

						let diaServico       = moment(model['ORDENS_REABERTURA']).format('DD/MM/YYYY');
						let horaInicio       = servicos[i]['ITEM_HORAINICIO'];
						let horaFinal        = servicos[i]['ITEM_HORAFIM'];
						let qtdeHoras        = servicos[i]['ORDENSSERVICOS_QUANTIDADE'];
						let horaOuDiaria     = servicos[i]['SERVICOS_DESCRICAO'].split('|')[0];
						let tipoEquipamento  = servicos[i]['SERVICOS_DESCRICAO'].split('|')[1];
						let nomeEquipamento  = servicos[i]['SERVICOS_NOME'];
						let placaEquipamento = servicos[i]['SERVICOS_DESCRICAO'].split('|')[2];
						let horasMinimo      = servicos[i]['ITEM_MINIMO'];
						let valorAdicional   = cents(servicos[i]['SERVICOS_DESCRICAO'].split('|')[5]) / 100;
						let valorSdf         = cents(servicos[i]['SERVICOS_DESCRICAO'].split('|')[6]) / 100;	
						let iniAlmoco        = model['ORDENS_PERIODO'].split('|')[0] || '';
						let finAlmoco        = model['ORDENS_PERIODO'].split('|')[1] || '';						
						let iniJantar        = model['ORDENS_PERIODO'].split('|')[2] || '';
						let finJantar        = model['ORDENS_PERIODO'].split('|')[3] || '';

						numPagina++;

						if(numPagina != 1) {
							rows.push([
								{
									text: 'a',
									color: 'white',
									fontSize: 4,
									pageBreak: 'before',
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);    
						} else {
							rows.push([
								{
									text: 'a',
									color: 'white',									
									fontSize: 4,
									colSpan: 14,
									border: [false, false, false, false]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);    
						}

						rows.push(
							[
								{
									colSpan: 2,
									border: [true, true, false, true],
									image: pathLogo,
									fit: [80,80],
									alignment: 'center',
								},{},
								{
									colSpan: 4,
									text: [
										{
											text: model['EMPRESAS_NOME'] + '\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 10}
										},
										{
											text: 'CNPJ: ' + utils.string.maskCnp(model['EMPRESAS_CPFCNPJ']) + '\n\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 10}
										},
										{
											text: 'Centro Administrativo Pres. Prudente\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 10}
										},
										{
											text: 'Fone: ' + utils.string.maskFone(model['EMPRESAS_TELEFONE']),
											alignment: 'left',
											style: {bold: true,	fontSize: 10}
										}

									],
									border: [false, true, true, true]
								},{},{},{},
								{
									colSpan: 8,
									table: {
										widths: ['*','*'],
										body: [
											[
												{
													text: 'ESPELHO - DE - NFS-e',
													fillColor: '#dedede',
													alignment: 'center',
													fontSize: 9,
													colSpan: 2,
												},{},
											],
											[ 
												{
													text: `Data de emissão:\n${emiOrdem}`,
													bold: true,
													fontSize: 10
												},
												{
													text: 'MATRIZ',
													fontSize: 12,
													alignment: 'center',
													bold: true
												}
											],
											[ 
												{
													text: 'Emitente:',
													fontSize: 12
												},
												{
													text: utils.number.strZero(model['ORDENS_NUMERO'], 6),
													fontSize: 12,
													alignment: 'center',
													bold: true
												}
											],
										]
									}
								},{},{},{},{},{},{},{}
							],
							[
								{
									colSpan: 6,								
									text: [
										{
											text: 'Motorista/Operador\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: servicos[i]['USUARIOS_LOGIN'],
											alignment: 'left',
											style: {fontSize: 10}
										}
									],

								},{},{},{},{},{},
								{
									colSpan: 4,								
									text: [
										{
											text: 'Equipamento\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: nomeEquipamento,
											alignment: 'left',
											style: {fontSize: 10}
										}
									]
								},{},{},{},
								{
									colSpan: 4,								
									text: [
										{
											text: 'Placa\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: placaEquipamento,
											alignment: 'left',
											style: {fontSize: 10}
										}
									]
								},{},{},{}
							],
							[
								{
									colSpan: 6,								
									text: [
										{
											text: 'Cliente\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: `${model['ORDENS_NOME']}\n`,
											alignment: 'left',
											style: {fontSize: 10}
										},
										{
											text: `CPF/CNPJ\n`,
											alignment: 'left',
											style: {bold: true, fontSize: 7}
										},
										{
											text: `${utils.string.maskCnp(model['PESSOAS_CPFCNPJ'])}`,
											alignment: 'left',
											style: {fontSize: 10}
										}

									],
								},{},{},{},{},{},
								{
									colSpan: 8,
									text: [
										{
											text: 'Nome Fantasia\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: `${model['PESSOAS_FANTASIA']}\n`,
											alignment: 'left',
											style: {fontSize: 10, bold: true}
										}
									]
								},{},{},{},{},{},{},{}
							],						
							[
								{
									colSpan: 6,								
									text: [
										{
											text: 'Local do Serviço/Endereço\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: model['ORDENS_ENDERECO'],
											alignment: 'left',
											style: {fontSize: 10}
										},
										{
											text: '\n\nCONTATO: ',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: model['ORDENS_NUMEROLC'],
											alignment: 'left',
											style: {fontSize: 8}
										},
																			{
											text: ' Fone: ' + utils.string.maskFone(model['ORDENS_CELULAR']),
											alignment: 'left',
											style: {fontSize: 8}
										}
									]
								},{},{},{},{},{},
								{
									colSpan: 8,								
									fillColor: '#dedede',
									text: [
										{
											text: 'Serviço\n',
											alignment: 'left',
											style: {bold: true,	fontSize: 7}
										},
										{
											text: model['ORDENS_REFERENCIA'],
											alignment: 'left',
											style: {fontSize: 7}
										}
									]

								},{},{},{},{},{},{},{}
							],						
							[
								{
									colSpan: 14,								
									text: `OBS: ${model['ORDENS_OBSERVACOES']}\n`,								
									fontSize: 17,								
									bold: true
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							],						
							[
								{
									colSpan: 14,
									text: [
										{
											text: 'ATENÇÃO',
											alignment: 'center',
											style: {bold: true,	fontSize: 22, decoration: 'underline'}
										},
										{
											text: '\nFAVOR PREENCHER AS INFORMAÇÕES ABAIXO',
											alignment: 'center',
											style: {bold: true, fontSize: 17}
										}
									]
								},{},{},{},{},{},{},{},{},{},{},{},{},{}
							]);

							rows.push(
								[
									{
										colSpan: 14,								
										text: 'A',
										fontsize: 18,
										color: 'white'
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],								
								[
									{
										colSpan: 2,
										text: 'X',
										fontSize: 15,
										bold: true,
										alignment: 'center'
									},{},
									{
										colSpan: 12,
										text: `SERVIÇO ${tipoEquipamento}`,
										fontSize: 15,
										bold: true,
										alignment: 'center'							
									},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 2,
										text: 'Data',
										fontSize: 15,
										fillColor: '#dedede',
										alignment: 'center'
									},{},
									{
										colSpan: 2,
										text: 'Hora',
										fontSize: 11,
										fillColor: '#dedede',
										alignment: 'center'							
									},{},
									{
										colSpan: 3,
										text: 'Horas de trabalho',
										fontSize: 11,
										fillColor: '#dedede',
										alignment: 'center'						
									},{},{},
									{
										colSpan: 2,
										text: horaOuDiaria == 'D' ? 'Diária' : 'Hora',
										fontSize: 11,
										fillColor: '#dedede',
										alignment: 'center'								
									},{},
									{
										colSpan: 2,
										text: 'Valor',
										fontSize: 11,	
										fillColor: '#dedede',
										alignment: 'center'
									},{},
									{
										colSpan: 3,
										text: 'Sáb/Dom/Fer',
										fontSize: 11,
										fillColor: '#dedede',
										alignment: 'center'
									},{},{}
								],
								[
									{
										colSpan: 2,
										text: diaServico,
										alignment: 'center',
										border: [true, false, true, false],
										style: {
											fontSize: 14,
											bold: true
										}																				
									},{},
									{					
										colSpan: 2,
										text: servicos[i]['ITEM_HORALOCAL'],
										alignment: 'center',
										border: [false, false, false, false],
										style: { fontSize: 14 }											
									},{},
									{
										colSpan: 3,
										text: '07:30 às 17:30',
										alignment: 'center',
										style: {
											decoration: 'underline',
											fontSize: 12
										}
									},{},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_PRECO']),
										alignment: 'right',
										style: { fontSize: 12 }
									},{},
									{
										colSpan: 2,
										text: utils.number.float2moeda(valorAdicional),
										alignment: 'right',
										style: { fontSize: 12 }
									},{},
									{
										colSpan: 3,
										text: utils.number.float2moeda(valorSdf),
										alignment: 'right',
										style: { fontSize: 12 }
									},{},{}
								],
								[ // Rodapé do item
									{
										colSpan: 2,
										text: '',		
										border: [true, false, true, true],
										style: { fontSize: 12 }																				
									},{},
									{					
										colSpan: 2,
										text: 'NO LOCAL',
										alignment: 'center',
										border: [false, false, false, true],
										style: { fontSize: 12 }											
									},{},
									{
										colSpan: 3,
										text: 'do Operador',
										alignment: 'center',
										fillColor: '#dedede',
										style: { fontSize: 12 }
									},{},{},
									{
										colSpan: 2,
										text: `MÍNIMO ${horasMinimo} h`,
										alignment: 'center',
										fillColor: '#dedede',										
										style: { fontSize: 8, bold: true }
									},{},
									{
										colSpan: 2,
										text: 'Hora Adicional',
										alignment: 'center',
										fillColor: '#dedede',
										style: { fontSize: 7 }
									},{},
									{
										colSpan: 3,
										text: 'Acréscimos',
										alignment: 'center',
										fillColor: '#dedede',
										style: { fontSize: 9 }
									},{},{}
								],
								[   // Aqui é o ponto que é preenchido manualmente
								    {
										colSpan: 2,
										alignment: 'center',
										text: 'Data',
										fillColor: '#dedede',
										fontSize: 11
									},{},
									{
										colSpan: 2,
										alignment: 'center',
										text: 'Hora de Início',
										fillColor: '#dedede',
										fontSize: 11
									},{},
									{
										colSpan: 2,
										alignment: 'center',
										text: 'Hora de Término',
										fillColor: '#dedede',
										fontSize: 11
									},{},					
									{
										colSpan: 2,
										alignment: 'center',
										text: 'Qtde Horas',
										fillColor: '#dedede',
										fontSize: 9,
									},{},
									{
										colSpan: 6,
										alignment: 'center',
										text: 'Serviço realizado',
										fillColor: '#dedede',
										fontSize: 11
									},{},{},{},{},{}
								]);

								for (let lBranco = 0; lBranco < 6; lBranco++) { // Linhas de prenchimento manual

									if(isFechada && lBranco == 0) { // OS Fechada imprime os detalhes
										rows.push([
											{
												colSpan: 2,
												text: diaServico,
												fontSize: 16
											},{},
											{
												colSpan: 2,
												text: horaInicio,
												fontSize: 16,
												alignment: 'center'												
											},{},
											{
												colSpan: 2,
												text: horaFinal,
												fontSize: 16,
												alignment: 'center'
											},{},					
											{
												colSpan: 2,
												text: qtdeHoras,
												fontSize: 16,
												alignment: 'center'
											},{},
											{
												colSpan: 6,
												text: `SERVIÇO ${tipoEquipamento}`,
												fontSize: 10
											},{},{},{},{},{}
										]);	
									} else {
										rows.push([
											{
												colSpan: 2,
												text: '\n\n',
												fontSize: 8
											},{},
											{
												colSpan: 2,
												text: '\n\n',
												fontSize: 8
											},{},
											{
												colSpan: 2,
												text: ''
											},{},					
											{
												colSpan: 2,
												text: ''
											},{},
											{
												colSpan: 6,
												text: ''
											},{},{},{},{},{}
										]);	
									}

								}

								rows.push([
									{
										colSpan: 6,
										text: 'Total de horas trabalhadas',
										fillColor: '#dedede',
										fontSize: 14
									},{},{},{},{},{},
									{
										colSpan: 2,
										text: isFechada ? qtdeHoras : '',
										fontSize: 14,
										bold: true,
										alignment: 'center'
									},{},
									{
										colSpan: 6,
										text: 'Horário de Almoço',
										alignment: 'center',
										fontSize: 12,
										bold: true
									},{},{},{},{},{}
								],
								[
									{
										colSpan: 6,
										text: 'Total de horas trabalhadas',
										fillColor: '#dedede',
										fontSize: 14
									},{},{},{},{},{},
									{
										colSpan: 2,
										text: ''
									},{},
									{
										colSpan: 3,
										text: 'Inicio: ' + iniAlmoco,
										fontSize: 10,
										alignment: iniAlmoco ? 'center' : 'left'
									},{},{},
									{
										colSpan: 3,
										text: 'Término: ' + finAlmoco,
										fontSize: 10,
										alignment: finAlmoco ? 'center' : 'left'
									},{},{}
								],
								[
									{
										colSpan: 6,
										text: 'Valor por Hora',
										fontSize: 14
									},{},{},{},{},{},
									{
										colSpan: 2,
										text: isFechada ? utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_PRECO']) : '',
										fontSize: 10,
										bold: true,
										alignment: 'right'
									},{},
									{
										colSpan: 6,
										text: 'Horário de Jantar',
										alignment: 'center',
										fontSize: 12,
										bold: true
									},{},{},{},{},{}
								],
								[
									{
										colSpan: 6,
										text: 'Deslocamento',
										fontSize: 14
									},{},{},{},{},{},
									{
										colSpan: 2,
										text: ''
									},{},
									{
										colSpan: 3,
										text: 'Inicio: ' + iniJantar,
										fontSize: 10,
										alignment: iniJantar ? 'center' : 'left'
									},{},{},
									{
										colSpan: 3,
										text: 'Término: ' + finJantar,
										fontSize: 10,
										alignment: finJantar ? 'center' : 'left'
									},{},{}
								],
								[
									{
										colSpan: 6,
										text: 'Total (R$)',
										fontSize: 14
									},{},{},{},{},{},
									{
										colSpan: 2,
										text: isFechada ? utils.number.float2moeda(servicos[i]['ORDENSSERVICOS_TOTAL']) : '',
										alignment: 'right',
										fontSize: 10,
										bold: true
									},{},
									{
										colSpan: 6,
										text: ''
									},{},{},{},{},{}
								]
							);

							rows.push(
								[
									{
										text: `OBS: HORAS CONTADAS DESDE A SAÍDA DA EMPRESA ATÉ RETORNAR PARA O PÁTIO DA MESMA. CONFORME AS HORAS DE TRABALHO MENCIONADAS ACIMA.`,
										style: {bold: true,	fontSize: 12, decoration: 'underline'},
										colSpan: 14,
										bold: true
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],
								[
									{
										colSpan: 14,								
										text: 'A',
										fontsize: 20,
										border: [false, false, false, false],
										color: 'white'
									},{},{},{},{},{},{},{},{},{},{},{},{},{}
								],						
								[
									{
										text: `Operador/Motorista`,
										alignment: 'center',
										colSpan: 4,
										fillColor: '#dedede',
										bold: true
									},{},{},{},
									{
										text: `Apontador/Encarregado`,
										alignment: 'center',
										colSpan: 5,
										fillColor: '#dedede',
										bold: true
									},{},{},{},{},
									{
										text: `Engenheiro`,
										alignment: 'center',
										colSpan: 5,
										fillColor: '#dedede',
										bold: true
									},{},{},{},{}
								],
								[
									{
										text: `Nome\n\n\n`,
										colSpan: 2,
										bold: true
									},{},
									{
										text: `Visto`,
										colSpan: 2,
										bold: true
									},{},
									{
										text: `Nome`,
										colSpan: 2,
										bold: true
									},{},
									{
										text: `Visto`,
										colSpan: 3,
										bold: true
									},{},{},
									{
										text: `Nome`,
										colSpan: 3,
										bold: true
									},{},{},
									{
										text: `Visto`,
										colSpan: 2,
										bold: true
									},{}
								]
							);

					}		


					pdfStream(docDefinition, resolve, reject);
				})
				.catch(res => {
                    reject(res);
				});
        });
    }
};
