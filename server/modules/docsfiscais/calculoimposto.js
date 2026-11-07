'use strict';

const samosFB           = require('../../services/samosFirebird');
const utils             = require('../../services/samosUtils');
const api               = require('..');
const calculadoraIbsCbs = require('./calculadoraibscbs');

module.exports = {
    create: (data, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cfopStLocal  = process.env[params.client ? ((params.client || '').toUpperCase() + '_CFOP_STLOCAL') : 'CFOP_STLOCAL'];
                let cfopStOutros = process.env[params.client ? ((params.client || '').toUpperCase() + '_CFOP_STOUTROS') : 'CFOP_STOUTROS'];
                let origemPis    = process.env[params.client ? ((params.client || '').toUpperCase() + '_PISCOFINS') : 'PISCOFINS'];
                
                cfopStLocal = cfopStLocal == undefined ? '540500' : cfopStLocal;
                cfopStOutros = cfopStOutros == undefined ? '640300' : cfopStOutros;
               
                const cents = utils.number.cents.bind(utils.number);
                const grams = utils.number.grams.bind(utils.number);
                const changeBase = utils.number.changeBase.bind(utils.number);
                const usarDesconto = process.env[params.client ? ((params.client || '').toUpperCase() + '_DESCONTONFE') : 'DESCONTONFE'] == 'TRUE';
                const usarCalculadoraIbsCbs = process.env[params.client ? ((params.client || '').toUpperCase() + '_CALCULADORAIBS') : 'CALCULADORAIBS'] == 'TRUE';
                const cfopsCredito = ['5101', '5102', '6101', '6102'];

                let  operacaoCabecalho = data['MOVIMENTOS_ID_OPERACOES'];
                const queryEmpresa = await api.empresas().read({
                    conteudo: '.' + data['MOVIMENTOS_ID_EMPRESAS'],
                    client: params.client
                });
                const queryPessoa = await api.pessoas().read({
                    conteudo: '.' + data['MOVIMENTOS_ID_PESSOAS'],
                    client: params.client
                });

                let queryPropriedade = '';

                if(cents(data['MOVIMENTOS_ID_PROPRIEDADES']) > 0) {
                    queryPropriedade = await api.propriedades().read({
                      conteudo: '.' + data['MOVIMENTOS_ID_PROPRIEDADES'],
                      client: params.client
                    });              
                }

                const queryOperacao = await api.operacoes().read({
                    conteudo: '.' + operacaoCabecalho,
                    client: params.client
                });
   
                const empresa       = (queryEmpresa     && queryEmpresa.results     && queryEmpresa.results[0])     ? queryEmpresa.results[0]  : {};
                const pessoa        = (queryPessoa      && queryPessoa.results      && queryPessoa.results[0])      ? queryPessoa.results[0]   : {};
                const propriedade   = (queryPropriedade && queryPropriedade.results && queryPropriedade.results[0]) ? queryPropriedade.results[0] : {};
                const operacao      = (queryOperacao    && queryOperacao.results    && queryOperacao.results[0])    ? queryOperacao.results[0] : {};

                const regimeNormal  = empresa['EMPRESAS_SIMPLES'] == 'F' || 
                                      (empresa['EMPRESAS_CPFCNPJ'] || '').slice(0, 8) == '49149596' || // Santana é simples mas calcula ICMS normal por causa do ST
                                       parseInt(empresa['EMPRESAS_SIMPLES']) > 0;

                let crtIbsCbs;

                const regimeEmpresa = empresa['EMPRESAS_SIMPLES'];

                if (regimeEmpresa === 'T' || regimeEmpresa === 0 || regimeEmpresa === '0') {
                    crtIbsCbs = 1; // Simples Nacional
                } else if (regimeEmpresa === 2 || regimeEmpresa === '2') {
                    crtIbsCbs = 2; // Simples Nacional - excesso de sublimite
                } else {
                    crtIbsCbs = 3; // Regime Normal
                }

                console.log(
                    'REGIME IBS/CBS:',
                    'EMPRESAS_SIMPLES =', regimeEmpresa,
                    'CRT =', crtIbsCbs
                );                                       

                const isContribuinte = pessoa['PESSOAS_CATEGORIA'] == '0' ||
                                       pessoa['PESSOAS_CATEGORIA'] == '3' ||
                                       pessoa['PESSOAS_CATEGORIA'] == '4'; 
                const isConsumidor   = pessoa['PESSOAS_TIPO'] == 'Z';

                const itens         = data['MOVIMENTOS_ITENS'] || [];

                if(cents(data['MOVIMENTOS_ID_PROPRIEDADES']) > 0) {
                  if(propriedade['CIDADES_ESTADO']) {
                      pessoa['CIDADES_IBGE'] = propriedade['CIDADES_IBGE'];
                      pessoa['CIDADES_NOME'] = propriedade['CIDADES_NOME'];
                      pessoa['CIDADES_ESTADO'] = propriedade['CIDADES_ESTADO'];
                      pessoa['PESSOAS_CPFCNPJ'] = propriedade['PROPRIEDADES_CPFCNPJ'];
                  }
                }

                if(data['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003') {
                  if(empresa['CIDADES_ESTADO'] != pessoa['CIDADES_ESTADO'] && operacaoCabecalho.toString().slice(0, 1) == '5') {
                    operacaoCabecalho = operacaoCabecalho.toString().replace(/^\w/, 6);
                    data['MOVIMENTOS_ID_OPERACOES'] = operacaoCabecalho;                      
                  }

                  if (operacaoCabecalho == '610100' || operacaoCabecalho == '610200'){
                    if((pessoa['PESSOAS_CPFCNPJ'] || '').toString().length == 11 ||
                        !isContribuinte){
                        if(operacaoCabecalho == '610100') {
                          data['MOVIMENTOS_ID_OPERACOES'] = '610700';
                        } else {
                          data['MOVIMENTOS_ID_OPERACOES'] = '610800';
                        }
                    }
                  }

                  if (/^(610200|610800)$/.test(String(operacaoCabecalho ?? ''))){
                    if((pessoa['PESSOAS_CPFCNPJ'] || '').toString().length != 11 && isContribuinte){
                        if(empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']) {
                          data['MOVIMENTOS_ID_OPERACOES'] = '510200';
                        } else {
                          data['MOVIMENTOS_ID_OPERACOES'] = '610200';
                        }
                    }
                  }
                }
    
                if(empresa['EMPRESAS_CPFCNPJ'] == '32072246000165'){ // Organoplant
                  if(!data['MOVIMENTOS_OBSERVACOES'].match(/RICMS/g)) {
                      data['MOVIMENTOS_OBSERVACOES'] = ('IPI NÃO TRIBUTADO DECRETO 8950/16 DE 30/12/2016.|' +
                      (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO'] ? 'RICMS/SP 2000 ANEXO II ARTIGO 77 INCISO II|PARAGRAFO 1º ITEM I|' : '||') +
                      data['MOVIMENTOS_OBSERVACOES']).substring(0, 512);
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '17752912000112'){ // OzonioBras
                  if(data['MOVIMENTOS_SITUACAO'] == 'R') {  // Revenda
                    const creditoIcms = (cents(empresa['EMPRESAS_CNAE'].split('|')[5] || 0) / 10000) 
                    const valorCredito = utils.number.float2moeda((cents(data['MOVIMENTOS_TOTAL']) * creditoIcms) / 100);
                    if(!data['MOVIMENTOS_OBSERVACOES'].match(/ICMS/g)) {
                        data['MOVIMENTOS_OBSERVACOES'] = (`PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS NO|VALOR DE R$ ${valorCredito} CORRESPONDENTE Á ALIQUOTA|DE 1,86% NOS TERMOS DO ART 23 DA LC 123/2006.|1 ANO DE GARANTIA - Nº DE SÉRIE:|` +
                        data['MOVIMENTOS_OBSERVACOES']).substring(0, 512);
                    }  
                  } else {
                    if(!data['MOVIMENTOS_OBSERVACOES'].match(/GARANTIA/g)) {
                        data['MOVIMENTOS_OBSERVACOES'] = (`|1 ANO DE GARANTIA - Nº DE SÉRIE:|||` +
                        data['MOVIMENTOS_OBSERVACOES']).substring(0, 512);
                    }
  
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '32676940000191'){ // Espaço Vital
                  const creditoIcms = (cents(empresa['EMPRESAS_CNAE'].split('|')[5] || 0) / 10000)                   
                  const valorCredito = utils.number.float2moeda((cents(data['MOVIMENTOS_TOTAL']) * creditoIcms) / 100);
                  if(!data['MOVIMENTOS_OBSERVACOES'].match(/ICMS/g)) {
                      data['MOVIMENTOS_OBSERVACOES'] = (`PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS NO|VALOR DE R$ ${valorCredito} CORRESPONDENTE Á ALIQUOTA|DE 1,86% NOS TERMOS DO ART 23 DA LC 123/2006.|` +
                      data['MOVIMENTOS_OBSERVACOES']).substring(0, 512);
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '46130523000153' && itens[0]['MOVIMENTOSITENS_ID_PRODUTOS'].toString() == '801' ){ // FC AUTOPECAS
                  if(!data['MOVIMENTOS_OBSERVACOES'].match(/ENERGETICO/g)) {
                      data['MOVIMENTOS_OBSERVACOES'] = 'declaro que os produtos perigosos estao adequadamente|classificados, embalados,identificados e estivados para |suportar os riscos da operacoes de transporte e que atende |as exigencias da regulamentacao. onu 2794 baterias eletricas|umidas,contendo acido 8. DOCUMENTO SEM VALOR | comercial, baterias com esgotamento ENERGETICO PARA | reciclagem comforme resolucao conama 401/08 ISENTO ICMS |nos termos do convenio 27/05 procon mt av. hist rubens de | mendonca917 ed eldorado executive center bairr araes fon151|';
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'].slice(0, 8) == '49149596' && 
                  operacao['OPERACOES_ACAO'] == 'VN' &&
                   (data['MOVIMENTOS_ID_PESSOAS'] == 202 ||
                    data['MOVIMENTOS_ID_PESSOAS'] == 92)) { // SANTANA Mensagem especifica clientes
                  if(!data['MOVIMENTOS_OBSERVACOES'].match(/VETADA/g)) {
                      data['MOVIMENTOS_OBSERVACOES'] = 'VENDA PARA INDUSTRIALIZACAO, NÃO RECOLHIDO ICMS-ST CONFORME|RICMS-PR 1980/2007 ART. 536-I PARAF.2 ITEM B).PROT 41/08.|SENDO VETADA A SIMPLES REVENDA SEM O RECOLHIMENTO DO|REFERIDO IMPOSTO.';
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '09316417000132'){ // Lislais
                  let obsSemConvenios = (data['MOVIMENTOS_OBSERVACOES']||[]).split('|').filter(obs => {
                     return !obs.match(/APROVEITAMENTO/g) && 
                            !obs.match(/TERMOS/g) && 
                            !obs.match(/CFOP/g);
                  }).join('|');
                  let msgAliqs = ''
                  let digAliq = operacaoCabecalho.toString().substr(0, 1);
                  const itensProduzidos = itens.reduce((total, item) => {
                    return total + (item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '5101' || 
                                    item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '6101' ?
                                    cents(item['MOVIMENTOSITENS_TOTAL']) : 0);}, 0);
                  const itensRevenda = itens.reduce((total, item) => {
                    return total + (item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '5102' || 
                                    item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '6102' ?
                                    cents(item['MOVIMENTOSITENS_TOTAL']) : 0);}, 0);

                  if(itensProduzidos > 0) {
                    const strProducao = (empresa['EMPRESAS_CNAE']||'').split('|')[6].replace('.', ',');
                    const aliquotaProducao = (cents((empresa['EMPRESAS_CNAE']||'').split('|')[6]) / 10000);
                    const valorCredProd = utils.number.float2moeda((itensProduzidos * aliquotaProducao) / 100);
                    msgAliqs += `CFOP ${digAliq}.101 NO VALOR DE R$ ${valorCredProd} À ALIQUOTA DE ${strProducao}%|`;
                  }

                  if(itensRevenda > 0) {
                    const strRevenda = (empresa['EMPRESAS_CNAE']||'').split('|')[5].replace('.', ',');
                    const aliquotaRevenda = (cents((empresa['EMPRESAS_CNAE']||'').split('|')[5]) / 10000);
                    const valorCredRev = utils.number.float2moeda((itensRevenda * aliquotaRevenda) / 100);
                    msgAliqs += `CFOP ${digAliq}.102 NO VALOR DE R$ ${valorCredRev} À ALIQUOTA DE ${strRevenda}%|`;
                  }
                  
                  if(msgAliqs) {
                      data['MOVIMENTOS_OBSERVACOES'] = (`PERMITE O APROVEITAMENTO DO CRÉDITO REFERENTE AO|${msgAliqs}NOS TERMOS DO ART 23 DA LC 123.|` +
                      obsSemConvenios).substring(0, 512);
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '00917145000151'){ // Hermes 
                  let obsSemConvenios = (data['MOVIMENTOS_OBSERVACOES']||[]).split('|').filter(obs => {
                     return !obs.match(/APROVEITAMENTO/g) && 
                            !obs.match(/CORRESPONDENTE/g) &&
                            !obs.match(/TERMOS/g);
                  }).join('|');

                  const itensCredito = itens.reduce((total, item) => {
                    return total + (cfopsCredito.includes(item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4)) && isContribuinte ?
                                    cents(item['MOVIMENTOSITENS_TOTAL']) : 0);}, 0);

                  if(itensCredito > 0 && grams(empresa['EMPRESAS_ALIQUOTA']) > 0) {
                    const strCredito = (empresa['EMPRESAS_ALIQUOTA'].toString() || '').replace('.', ',');
                    const aliquotaCredito = grams(empresa['EMPRESAS_ALIQUOTA']) / 1000;
                    const valorCredito = utils.number.float2moeda((itensCredito * aliquotaCredito) / 10000);
                    data['MOVIMENTOS_OBSERVACOES'] = (`PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS|NO VALOR DE R$ ${valorCredito} CORRESPONDENTE A ALIQUOTA|DE ${strCredito}% NOS TERMOS DO ARTIGO 23 DA LC 123|` +
                    obsSemConvenios).substring(0, 512);
                  } else {
                    data['MOVIMENTOS_OBSERVACOES'] = obsSemConvenios.substring(0, 512);
                  }                
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '56779193000185'){ // Café aroma
                  let obsSemConvenios = (data['MOVIMENTOS_OBSERVACOES']||[]).split('|').filter(obs => {
                     return !obs.match(/APROVEITAMENTO/g) && 
                            !obs.match(/TERMOS/g) && 
                            !obs.match(/CFOP/g);
                  }).join('|');
                  let msgAliqs = ''
                  let digAliq = operacaoCabecalho.toString().substr(0, 1);
                  const itensProduzidos = itens.reduce((total, item) => {
                    return total + (item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '5101' || 
                                    item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '6101' ?
                                    cents(item['MOVIMENTOSITENS_TOTAL']) : 0);}, 0);
                  const itensRevenda = itens.reduce((total, item) => {
                    return total + (item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '5102' || 
                                    item['MOVIMENTOSITENS_ID_OPERACOES'].toString().substr(0, 4) == '6102' ?
                                    cents(item['MOVIMENTOSITENS_TOTAL']) : 0);}, 0);

                  if(itensProduzidos > 0) {
                    const strProducao = (empresa['EMPRESAS_CNAE']||'').split('|')[6].replace('.', ',');
                    const aliquotaProducao = (cents((empresa['EMPRESAS_CNAE']||'').split('|')[6]) / 10000);
                    const valorCredProd = utils.number.float2moeda((itensProduzidos * aliquotaProducao) / 100);
                    msgAliqs += `CFOP ${digAliq}.101 NO VALOR DE R$ ${valorCredProd} À ALIQUOTA DE ${strProducao}%|`;
                  }

                  if(itensRevenda > 0) {
                    const strRevenda = (empresa['EMPRESAS_CNAE']||'').split('|')[5].replace('.', ',');
                    const aliquotaRevenda = (cents((empresa['EMPRESAS_CNAE']||'').split('|')[5]) / 10000);
                    const valorCredRev = utils.number.float2moeda((itensRevenda * aliquotaRevenda) / 100);
                    msgAliqs += `CFOP ${digAliq}.102 NO VALOR DE R$ ${valorCredRev} À ALIQUOTA DE ${strRevenda}%|`;
                  }
                  
                  if(msgAliqs) {
                      data['MOVIMENTOS_OBSERVACOES'] = (`PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS REFERENTE|AO ${msgAliqs}NOS TERMOS DO ART 23 DA LC 123.|` +
                      obsSemConvenios).substring(0, 512);
                  }
                }

                if(empresa['EMPRESAS_CPFCNPJ'] == '05971492000186'){ // Biomart
                  let obsSemConvenios = (data['MOVIMENTOS_OBSERVACOES']||[]).split('|').filter(obs => {
                     return !(obs.match(pessoa['PESSOAS_OBSERVACOES']) && (pessoa['PESSOAS_OBSERVACOES'] || '').trim().length > 0) && 
                            !obs.match(/ICMS/g) && 
                            !obs.match(/DOMESTICOS/) &&  
                            !obs.match(/OBS: NOSSO/) &&
                            !obs.match(/SUSPENSO/g);
                  }).join('|');
                  let msgPessoa = (pessoa['PESSOAS_OBSERVACOES'] || '').trim().length > 0 ? pessoa['PESSOAS_OBSERVACOES'] + '|' : '';
                  let msgIpi = 'IPI SUSPENSO ART. 43 INCISO IV DECRETO 7.212 DE 06/2010.';
                  let foraEstado = (empresa['CIDADES_ESTADO'] != pessoa['CIDADES_ESTADO']);
                  let msgRacao = '';

                  if(pessoa['CIDADES_ESTADO'] == 'MT' || pessoa['CIDADES_ESTADO'] == 'MS') {
                     msgRacao = '|OBS: NOSSO PRODUTO NAO SE TRATA DE RAÇÃO PARA|ANIMAIS DOMESTICOS|';
                  }

                  let letraConvenio = '';
                  let arrConvenios = [];

                  for(let i in itens) {
                    letraConvenio = foraEstado ? (itens[i]['SALDOS_LOCAL'] || '').split('|')[1] : (itens[i]['SALDOS_LOCAL'] || '').split('|')[0];
                    if(arrConvenios.indexOf(letraConvenio) == -1) {
                        arrConvenios.push(letraConvenio);
                    }
                  }

                  let msgConvenios = await montaConvenio(arrConvenios, foraEstado);

                  if(pessoa['PESSOAS_CATEGORIA'] != '3') { // Se não for exportação
                    data['MOVIMENTOS_OBSERVACOES'] = (`${msgPessoa}${msgIpi}${msgConvenios}${msgRacao}|${obsSemConvenios}`).substring(0, 512);
                  } else {
                    data['MOVIMENTOS_OBSERVACOES'] = (`${msgPessoa}${msgIpi}${obsSemConvenios}`).substring(0, 512);
                  }

                }

                data['MOVIMENTOS_BASEICMS']   = 0;
                data['MOVIMENTOS_VALORICMS']  = 0;
                data['MOVIMENTOS_VALORIPI']   = 0;
                data['MOVIMENTOS_BASEIBSCBS'] = 0;
                data['MOVIMENTOS_VALORIBS']   = 0;
                data['MOVIMENTOS_VALORCBS']   = 0;
                data['MOVIMENTOS_BASEST']     = 0;
                data['MOVIMENTOS_VALORST']    = 0;
                data['MOVIMENTOS_IMPOSTO']    = 0;
                data['MOVIMENTOS_PRODUTOS']   = 0;
                data['MOVIMENTOS_TOTAL']      = 0;

                const produtosIbsCbs = [];
                
                await Promise.all(itens.map(async (item, index) => {
                    try {

                        let perBaselc = 0;
                        let perBase01 = 0;
                        let perBase02 = 0;
                        let perIVA = 0;
                        let pmpfCalculado = 0;
                        let pmpfBaseCalculo = 0; 
                        if((empresa['EMPRESAS_CPFCNPJ'].slice(0, 8).match(/56779193|67861500/)) &&  // Cafe aroma/Malacrida
                           item['NCMS_NCM'].match(/09012100|09011110/) &&
                           operacao['OPERACOES_ST'] == 'T' &&
                           pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) {
                            if(data['MOVIMENTOS_ID_OPERACOES'] == 510100 && isContribuinte) {
                              item['MOVIMENTOSITENS_ID_OPERACOES'] = 540100;
                            }
                            if(empresa['CIDADES_ESTADO'] == 'SP') {
                              perIVA = 30.55
                            } else {
                              perIVA = 20
                            }
                        } else {
                        
                            if(pessoa['CIDADES_ESTADO'] == 'MT') {  // IVA MT
                            perIVA = 50.39
                            }

                            if(pessoa['CIDADES_ESTADO'] == 'PR' ||  // IVA PR e PE
                            pessoa['CIDADES_ESTADO'] == 'PE') {
                            perIVA = 71.78
                            }

                            if(pessoa['CIDADES_ESTADO'] == 'RO') {  // IVA RO
                            perIVA = 44 
                            }

                            if(empresa['EMPRESAS_CPFCNPJ'].slice(0, 8).match(/56779193|67861500/)) {  // Aroma/Malacrida
    //                        perIVA Exclusivo malacrida acima
                            } else {
                            perIVA = 72.15
                            }
                        }

                        if(pessoa['PESSOAS_CPFCNPJ'].slice(0, 8) == '49149596' &&  // Santana
                           item['NCMS_NCM'] == '84149039' &&
                           item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4) == '6152') {
                            item['MOVIMENTOSITENS_CST'] = '0101';                            
                            item['SALDOS_CSTOUTROS'] = '0101';                            
                        }

                        if(operacaoCabecalho.toString().slice(0, 4).match(/5102|5405/)) {
                          if(regimeNormal && item['MOVIMENTOSITENS_CST'] == '000') {
                            item['MOVIMENTOSITENS_ID_OPERACOES'] = '510200';
                          } else if (regimeNormal && item['MOVIMENTOSITENS_CST'] == '0201') {
                            item['MOVIMENTOSITENS_ID_OPERACOES'] = cfopStLocal;
                          }
                        }

                        if(cents(item['MOVIMENTOSITENS_DESCONTOS']) < 0) {
                          item['MOVIMENTOSITENS_DESCONTOS'] = 0;
                        }

                        if(empresa['EMPRESAS_CPFCNPJ'] == '17752912000112'){ // Ajuste CSOSN Consumo/Revenda OzonioBrás
                          if(data['MOVIMENTOS_SITUACAO'] == 'C' && item['MOVIMENTOSITENS_CST'] == '0101') {
                            item['MOVIMENTOSITENS_CST'] = '0102'
                          } else {
                            if(data['MOVIMENTOS_SITUACAO'] == 'R' && item['MOVIMENTOSITENS_CST'] == '0102') {
                              item['MOVIMENTOSITENS_CST'] = '0101'
                            }
                          }
                        }  

                        let isProdutoExcecaoHerbi = empresa['EMPRESAS_CPFCNPJ'] == '00123727000166' &&
                                                      (item['MOVIMENTOSITENS_ID_PRODUTOS'] == 4266 ||  
                                                       item['MOVIMENTOSITENS_ID_PRODUTOS'] == 5839); // Produtos tributação especial Herbiquimica

                        if(!isContribuinte && 
                           !isProdutoExcecaoHerbi) {

                          if(pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) {
                            if(item['SALDOS_BASELC'] > 0 && item['SALDOS_BASELC'] != 100) {
                              perBaselc = 100;
                            } else {
                              perBaselc = item['SALDOS_BASELC'];
                            }
                          } else {
                            if(item['SALDOS_BASE01'] > 0 && item['SALDOS_BASE01'] != 100) {
                              perBase01 = 100;                              
                            } else {
                              perBase01 = item['SALDOS_BASE01'];
                            }
                            if(item['SALDOS_BASE02'] > 0 && item['SALDOS_BASE02'] != 100) {
                              perBase02 = 100;
                            } else {
                              perBase02 = item['SALDOS_BASE02'];
                            }
                          }
                        } else {
                          perBaselc = item['SALDOS_BASELC'];
                          perBase01 = item['SALDOS_BASE01'];
                          perBase02 = item['SALDOS_BASE02'];
                          if(empresa['EMPRESAS_CPFCNPJ'] == '64607922000144'){ // Raçaforte (NOVO - 05/05/2025)
                            if(pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) {
                              item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTLOCAL'];
                            } else {
                              item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTOUTROS'];
                            }  
                            if(item['MOVIMENTOSITENS_CST'].trim().slice(-2) == '00' && 
                               item['MOVIMENTOSITENS_ID_OPERACOES'] == '640300') {
                                item['MOVIMENTOSITENS_ID_OPERACOES'] = '610201'
                            }
                          }  
                        }

                        if(operacao['OPERACOES_COMPLEMENTAR'] != 'T' &&
                           operacao['OPERACOES_FINALIDADE'] != 'D' &&  // Se não for devolução
                           !item['MOVIMENTOSITENS_CST'].toString().match(/090/)) {
                          item['MOVIMENTOSITENS_BASEICMS']  = 0;                                      
                          item['MOVIMENTOSITENS_VALORICMS'] = 0; // Zerar pra recalcular
                        }

                        item['TOTAL_LIQUIDO'] = (cents(item['MOVIMENTOSITENS_TOTAL']) - cents(item['MOVIMENTOSITENS_DESCONTOS'])) / 100; // Recálculo...

                        if(empresa['CIDADES_ESTADO'] != pessoa['CIDADES_ESTADO'] && data['MOVIMENTOS_ID_DOCUMENTOS'].toString().slice(-4) == '0003') {
                          if(item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 1) == '5') {
                            item['MOVIMENTOSITENS_ID_OPERACOES'] = item['MOVIMENTOSITENS_ID_OPERACOES'].toString().replace(/^\w/, 6);
                          }
                        }

                        if(empresa['EMPRESAS_CPFCNPJ'] == '05971492000186'){ // Se for Biomart
                          if(operacao['OPERACOES_UNICA'] == 'T')   {
                            item['MOVIMENTOSITENS_ID_OPERACOES'] = operacaoCabecalho;
                          }
                        }

                        if(data['MOVIMENTOS_DESCONTOS'] > 0  && !usarDesconto){
                            if(item['MOVIMENTOSITENS_DESCONTOS'] > 0){
                                const casasDecimaisPreco = 10;//calcula sempre com 10 casas pra não arredondar o preco
                                const preco    = changeBase(item['MOVIMENTOSITENS_PRECO'], casasDecimaisPreco);
                                const desconto = cents(item['MOVIMENTOSITENS_DESCONTOS']);
                                const qtde     = grams(item['MOVIMENTOSITENS_QUANTIDADE']);

                                const descontoPorUnidade = changeBase(desconto / qtde * 10, casasDecimaisPreco);
                                const precoLiq = preco - descontoPorUnidade;
        
                                item['MOVIMENTOSITENS_PRECO']     = precoLiq / (10 ** casasDecimaisPreco);
                                //----------
                                
                                item['MOVIMENTOSITENS_TOTAL']     = Math.round(precoLiq * qtde / 1000 / (10 ** (casasDecimaisPreco - 2))) / 100;
                                item['MOVIMENTOSITENS_DESCONTOS'] = 0;
                                item['MOVIMENTOSITENS_PERCENTUAL'] = 0;
                            }
                        } else {
                          if(!usarDesconto) {
                            item['MOVIMENTOSITENS_DESCONTOS'] = 0;                          
                            item['MOVIMENTOSITENS_PERCENTUAL'] = 0; 
                          }
                        }

                        if(regimeNormal) {   // Regime normal ou simples excesso receita

                            const queryProdutos = await api.produtos().read({
                              conteudo: '.' + item['MOVIMENTOSITENS_ID_PRODUTOS'],
                              empresa: data['MOVIMENTOS_ID_EMPRESAS'],
                              client: params.client
                            });

                            const produto = queryProdutos.results[0];

                            produtosIbsCbs[index] = produto;

                            const queryOperacaoItem = await api.operacoes().read({
                              conteudo: '.' + item['MOVIMENTOSITENS_ID_OPERACOES'],
                              client: params.client
                            });

                            const operacaoItem = queryOperacaoItem.results[0];
                            const sobreTotal = (operacaoItem['OPERACOES_SOBRETOTAL'] || '') == 'T';

                            if(operacaoItem['OPERACOES_ICMS'] == 'T' && operacaoItem['OPERACOES_COMPLEMENTAR'] != 'T') { // Se não for complementar
                                if(empresa['EMPRESAS_SIMPLES'] == 3){//regime especial para o exterior, usando a tabela aliquitas no config
                                    item['MOVIMENTOSITENS_ICMS'] = ((data['aliquotas'] || []).find(aliquota => aliquota['ALIQUOTAS_ESTADO'] == pessoa['CIDADES_ESTADO']) || {})['ALIQUOTAS_PERCENTUAL'] || 0;
                                    item['MOVIMENTOSITENS_CST'] = '000';
                                    item['MOVIMENTOSITENS_BASEICMS'] = item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0); 
                                } else if(empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']){
                                    if (item['SALDOS_CSTLOCAL'].trim().slice(-2) == '60') {
                                        if (operacao['OPERACOES_UNICA'] != 'T' && empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') { // Única e não Biomart) 
                                            item['MOVIMENTOSITENS_ID_OPERACOES'] = (item['PRODUTOS_DERIVADO'] == 'T' ? '565600' : '540500');
                                            item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTLOCAL'];
                                        }
                                        item['MOVIMENTOSITENS_ICMS'] = 0;
                                    } else {
                                        item['MOVIMENTOSITENS_ICMS'] = item['SALDOS_ICMSLC'];
                                        item['MOVIMENTOSITENS_CST'] = operacao['OPERACOES_UNICA'] != 'T' ? item['SALDOS_CSTLOCAL'] : item['MOVIMENTOSITENS_CST'];
                                        if (perBaselc == 100 && cents(item['MOVIMENTOSITENS_ICMS']) > 0){ //                                          
                                            item['MOVIMENTOSITENS_BASEICMS'] = item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0);
                                        } else if (perBaselc > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                            item['MOVIMENTOSITENS_BASEICMS'] = Math.round((cents(item['TOTAL_LIQUIDO']) + cents(sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)) * 0.01 * grams(perBaselc) / 1000) / 100;
                                        }
                                    }
                                } else if(!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])){
                                    if (item['SALDOS_CSTOUTROS'].trim().slice(-2) == '60') {
                                        if (operacao['OPERACOES_UNICA'] != 'T' && empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') { // Única e não Biomart
                                            item['MOVIMENTOSITENS_ID_OPERACOES'] = (item['PRODUTOS_DERIVADO'] == 'T' ? '665600' : '640300');
                                            item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTOUTROS'];
                                        }
                                        if(operacaoItem['OPERACOES_ICMS'] != 'T') {
                                            item['MOVIMENTOSITENS_ICMS'] = 0;
                                            item['MOVIMENTOSITENS_BASEICMS'] = 0;
                                            item['MOVIMENTOSITENS_VALORICMS'] = 0;  
                                        }
                                    } else {
                                        item['MOVIMENTOSITENS_ICMS'] = item['SALDOS_ICMS02'];
                                        item['MOVIMENTOSITENS_CST'] = operacao['OPERACOES_UNICA'] == 'T' ? item['MOVIMENTOSITENS_CST'] : item['SALDOS_CSTOUTROS'];
                                        if (item['SALDOS_BASE02'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                            item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)); 
                                        } else if (perBase02 > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                          const valorLiquido = cents(item['TOTAL_LIQUIDO']);
                                          const valorFrete   = cents(item['MOVIMENTOSITENS_FRETE']);
                                          if(sobreTotal) {
                                              item['MOVIMENTOSITENS_BASEICMS'] = (((valorLiquido + valorFrete) / 100) * (cents(perBase02) / 100)) / 100;
                                          } else {
                                              item['MOVIMENTOSITENS_BASEICMS'] = (((valorLiquido) / 100) * (cents(perBase02) / 100)) / 100;
                                          }
                                        }
                                    }
                                } else {
                                    if(item['SALDOS_CSTOUTROS'].trim().slice(-2) == '60'){
                                        if (operacao['OPERACOES_UNICA'] != 'T' && empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') { // Unica e não Biomart
                                            item['MOVIMENTOSITENS_ID_OPERACOES'] = (item['PRODUTOS_DERIVADO'] == 'T' ? '665600' :'640300');
                                            item['MOVIMENTOSITENS_CST'] = operacao['OPERACOES_UNICA'] == 'T' ? item['MOVIMENTOSITENS_CST'] : item['SALDOS_CSTOUTROS'];
                                        }
                                        item['MOVIMENTOSITENS_ICMS'] = 0;
                                    } else {
                                        item['MOVIMENTOSITENS_ICMS'] = item['SALDOS_ICMS01'];
                                        item['MOVIMENTOSITENS_CST'] = operacao['OPERACOES_UNICA'] == 'T' ? item['MOVIMENTOSITENS_CST'] : item['SALDOS_CSTOUTROS'];
                                        if (perBase01 == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                            item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0));
                                        } else if (perBase01 > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                            const valorLiquido = cents(item['TOTAL_LIQUIDO']);
                                            const valorFrete   = cents(item['MOVIMENTOSITENS_FRETE']);
                                            if(sobreTotal) {
                                                item['MOVIMENTOSITENS_BASEICMS'] = (((valorLiquido + valorFrete) / 100) * (cents(perBase01) / 100)) / 100;
                                            } else {
                                                item['MOVIMENTOSITENS_BASEICMS'] = (((valorLiquido) / 100) * (cents(perBase01) / 100)) / 100;
                                            }
                                        }
                                    }
                                }

                                if(operacao['OPERACOES_COMPLEMENTAR'] != 'T') {                                
                                  if (item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;
                                  } else {
                                        item['MOVIMENTOSITENS_BASEICMS']  = 0;
                                        item['MOVIMENTOSITENS_VALORICMS'] = 0;  
                                  }
                                }
                            }
        
                            if(operacao['OPERACOES_IPI'] == 'T') {
                              if(item['MOVIMENTOSITENS_CST'].toString().slice(-2) == '90'){
                                item['MOVIMENTOSITENS_IPI'] = 0;
                              } else {
                                if (item['SALDOS_IPI'] > 0)  {
                                  item['MOVIMENTOSITENS_IPI']      = item['SALDOS_IPI'];
                                  item['MOVIMENTOSITENS_VALORIPI'] = Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * grams(item['MOVIMENTOSITENS_IPI']) / 1000) / 100;
                                }
                              }                                                               
                            } else {
                              item['MOVIMENTOSITENS_VALORIPI'] = 0;                              
                            }

                            // cálculo ST
                            if(operacaoItem['OPERACOES_COMPLEMENTAR'] != 'T') {                         
                              item['MOVIMENTOSITENS_BASEST'] = 0;
                              item['MOVIMENTOSITENS_VALORST'] = 0;
                            }

                            if(operacaoItem['OPERACOES_ST'] == 'T' &&
                               operacaoItem['OPERACOES_COMPLEMENTAR'] != 'T' && 
                               operacaoItem['OPERACOES_ICMS'] == 'T' && // Só se calcular o ICMS
                               empresa['CIDADES_ESTADO'].match(/PR|MT/) && // Santana
                               item['NCMS_NCM'] == '84149039' &&
                               operacaoItem['OPERACOES_FINALIDADE'] == 'N' && // Só finalidade normal
                               item['MOVIMENTOSITENS_CST'] == '0201') {

                                  if(pessoa['PESSOAS_CPFCNPJ'].length == 11 || 
                                     !isContribuinte || 
                                     pessoa['CIDADES_ESTADO'] == 'SC' ||
                                     pessoa['PESSOAS_INSCRICAO'].match(/ISENTO/)) {  // PF ou SC ou Não contribuinte não tem ST
                                    item['MOVIMENTOSITENS_CST'] = '0102';
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) ? 510200 : 610200;
                                  } else {
                                    item['MOVIMENTOSITENS_CST'] = '0201';
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) ? cfopStLocal : cfopStOutros;  
                                  }

                                  item['MOVIMENTOSITENS_ICMS'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO'])          ? item['SALDOS_ICMSLC'] :
                                                                 (!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])) ? item['SALDOS_ICMS02'] : item['SALDOS_ICMS01'];
                                  if (item['SALDOS_BASELC'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)); 
                                  } else if (perBaselc > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_BASEICMS'] = Math.round((cents(item['TOTAL_LIQUIDO']) + cents(sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)) * 0.01 * grams(perBaselc) / 1000) / 100;
                                  }
                                  item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;

                                  if(!(pessoa['PESSOAS_CPFCNPJ'].length == 11 || !isContribuinte || pessoa['PESSOAS_INSCRICAO'].match(/ISENTO/))) {
                                    item['MOVIMENTOSITENS_BASEST']    = (cents(item['MOVIMENTOSITENS_TOTAL']) + (cents(item['MOVIMENTOSITENS_TOTAL']) * (perIVA / 100))) / 100;
                                    if(empresa['CIDADES_ESTADO'] == 'PR') {  // Interno PR
                                      if(pessoa['CIDADES_ESTADO'] == 'PE') {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .18) / 100;
                                      } else {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .19) / 100;
                                      }
                                    }  
                                    if(empresa['CIDADES_ESTADO'] == 'MT') { // Interno MT
                                      item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .175) / 100;
                                    }
                                    item['MOVIMENTOSITENS_VALORST'] = item['MOVIMENTOSITENS_VALORST'] - item['MOVIMENTOSITENS_VALORICMS'];
                                  }
                               }
                         // Zera ICMS produtos Santana
                         
                         if((empresa['EMPRESAS_CPFCNPJ'] || '').slice(0, 8) == '49149596' && 
                             operacao['OPERACOES_FINALIDADE'] == 'N') {
                           item['MOVIMENTOSITENS_BASEICMS'] = 0;
                           item['MOVIMENTOSITENS_ICMS'] = 0;
                           item['MOVIMENTOSITENS_VALORICMS'] = 0;
                           if(pessoa['CIDADES_ESTADO'] == 'SC' && item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4) == '6102') {
                              item['MOVIMENTOSITENS_CST'] = '0102';
                              item['MOVIMENTOSITENS_BASEST']    = 0;
                              item['MOVIMENTOSITENS_VALORST']   = 0;
                           }
                           if(!isContribuinte && item['MOVIMENTOSITENS_CST'] == '0201') {
                              item['MOVIMENTOSITENS_CST'] = '0102';                            
                           }
                         }

                          // Produtos Tributação especial Produtor Rural SP (Isenção) Herbiquimica
                          if(empresa['EMPRESAS_CPFCNPJ'].match(/00123727000166/) &&
                            pessoa['PESSOAS_CPFCNPJ'].length == 14 &&
                            pessoa['PESSOAS_CATEGORIA'] == 4 &&
                            pessoa['CIDADES_ESTADO'] == 'SP' &&
                            item['SALDOS_EXCECAO'] == '2') {
                            item['MOVIMENTOSITENS_CST'] = '040';                              
                            item['MOVIMENTOSITENS_BASEICMS'] = 0;
                            item['MOVIMENTOSITENS_ICMS'] = 0;
                            item['MOVIMENTOSITENS_VALORICMS'] = 0;
                          }   

                          // Produtos Tributação especial Produtor Rural SP (Diferimento) Herbiquimica
                          if(empresa['EMPRESAS_CPFCNPJ'].match(/00123727000166/) &&
                             pessoa['PESSOAS_CPFCNPJ'].length == 14 &&
                             pessoa['PESSOAS_CATEGORIA'] == '4' &&
                             pessoa['CIDADES_ESTADO'] == 'SP' &&
                             item['SALDOS_EXCECAO'] == '3') {
                                item['MOVIMENTOSITENS_CST'] = '051';
                                item['MOVIMENTOSITENS_BASEICMS'] = 0;
                                item['MOVIMENTOSITENS_ICMS'] = 0;
                                item['MOVIMENTOSITENS_VALORICMS'] = 0;
                          }

                          // Produtos Tributação especial Produtor Rural SP (Redução) Herbiquimica
                          if(empresa['EMPRESAS_CPFCNPJ'].match(/00123727000166/) &&
                            pessoa['PESSOAS_CATEGORIA'] != 4 &&
                            pessoa['CIDADES_ESTADO'] == 'SP' &&
                            produto['PRODUTOS_ID_GRUPOS'] == 100) {
                              item['MOVIMENTOSITENS_CST'] = '000';                              
                              item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0));
                              item['MOVIMENTOSITENS_ICMS'] = 18;
                              item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;
                          }                             

                          // Produtos Tributação especial Produtor Rural (Redução BC Exclusiva) Herbiquimica
                          if(empresa['EMPRESAS_CPFCNPJ'].match(/00123727000166/) &&
                            pessoa['PESSOAS_CATEGORIA'] != '4' &&
                            item['SALDOS_EXCECAO'] == '4') {
                              item['MOVIMENTOSITENS_CST'] = '000';                              
                              item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0));
                              item['MOVIMENTOSITENS_ICMS'] = (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO'])          ? item['SALDOS_ICMSLC'] :
                                                             (!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])) ? item['SALDOS_ICMS02'] : item['SALDOS_ICMS01'];

                              item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;
                          }                             

                          // tratamento de produtos com redução (ajuste CST para não contribuintes)

                          if(item['MOVIMENTOSITENS_CST'] == '020' && 
                             !isContribuinte && 
                             item['MOVIMENTOSITENS_VALORICMS'] > 0 &&
                             !isProdutoExcecaoHerbi) {
                             item['MOVIMENTOSITENS_CST'] = '000';
                          }

                          if(empresa['EMPRESAS_CPFCNPJ'] == '64607922000144'){ // Ajuste CST raçaforte
                            if(pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) {
                              item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTLOCAL'];
                            } else {
                              item['MOVIMENTOSITENS_CST'] = item['SALDOS_CSTOUTROS'];
                            }  
                            if(item['MOVIMENTOSITENS_CST'].trim().slice(-2) == '20' && 
                                item['MOVIMENTOSITENS_VALORICMS'] == 0) {
                                item['MOVIMENTOSITENS_CST'] = item['MOVIMENTOSITENS_CST'].slice(0, 1) + '40';
                            }
                          }  

                          // Fim do tratamento de produtos com redução de BC Icms

                          // ST Malacrida Regime normal
                          if(empresa['EMPRESAS_CPFCNPJ'].slice(0, 8) == '67861500' &&  // Malacrida
                              item['NCMS_NCM'].match(/09012100|09011110/) &&
                              operacao['OPERACOES_ST'] == 'T' && // antes operacaoItem
                              pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) {
                                item['MOVIMENTOSITENS_ICMS'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO'])          ? item['SALDOS_ICMSLC'] :
                                                              (!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])) ? item['SALDOS_ICMS02'] : item['SALDOS_ICMS01'];
                                if (item['SALDOS_BASELC'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                  item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)); 
                                } else if (perBaselc > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_BASEICMS'] = Math.round((cents(item['TOTAL_LIQUIDO']) + cents(sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)) * 0.01 * grams(perBaselc) / 1000) / 100;
                                }
                                item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;

                                item['MOVIMENTOSITENS_BASEST']    = (cents(item['MOVIMENTOSITENS_BASEICMS']) + (cents(item['MOVIMENTOSITENS_BASEICMS']) * (perIVA / 100))) / 100; 

                                item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * (item['MOVIMENTOSITENS_ICMS'] / 100)) / 100; 
                                
                                item['MOVIMENTOSITENS_VALORST'] = item['MOVIMENTOSITENS_VALORST'] - item['MOVIMENTOSITENS_VALORICMS'];

                                if(empresa['EMPRESAS_CPFCNPJ'] == '67861500000784' && cents(item['SALDOS_RESERVADO']) > 0) {  // Malacrida Coxim
                                  pmpfCalculado   = (cents(item['SALDOS_RESERVADO']) * item['MOVIMENTOSITENS_QUANTIDADE']) / 100; // valor total PMPF
                                  pmpfCalculado = (pmpfCalculado * perBaselc) / 100 ;
                                  pmpfBaseCalculo = pmpfCalculado;
                                  pmpfCalculado = (pmpfCalculado * item['SALDOS_ICMSLC']) / 100;
                                  pmpfCalculado = (pmpfCalculado - item['MOVIMENTOSITENS_VALORICMS']);
                                  item['MOVIMENTOSITENS_BASEST']    = pmpfBaseCalculo; 
                                  item['MOVIMENTOSITENS_VALORST']   = pmpfCalculado;
                                }

                                if(isConsumidor) {
                                  if(item['MOVIMENTOSITENS_CST'] == '070') {
                                    item['MOVIMENTOSITENS_CST'] = '020';
                                    item['TABELA_ORIGEM'] = '0';
                                    item['TABELA_LOCAL'] = '20';
                                  }
                                  item['MOVIMENTOSITENS_BASEST'] = 0;
                                  item['MOVIMENTOSITENS_VALORST'] = 0;
                                }
                          }

                          // Iniciando calculo PIS/COFINS
                          if(origemPis == 'PRODUTO') {  // CST e Aliquota no cadastro do produto
                            let valorItem   = cents(item['MOVIMENTOSITENS_TOTAL']) - cents(item['MOVIMENTOSITENS_DESCONTOS']);
                            let valorIcms   = cents(item['MOVIMENTOSITENS_VALORICMS']);
                            let cstPis      = item['PRODUTOS_DESCRICAO'].split('|')[0] || '01';
                            let aliqPis     = cents(item['PRODUTOS_DESCRICAO'].split('|')[1]) / 100;
                            let cstCofins   = item['PRODUTOS_DESCRICAO'].split('|')[2] || '01';   
                            let aliqCofins  = cents(item['PRODUTOS_DESCRICAO'].split('|')[3]) / 100;    
                          
                            if(operacaoItem['OPERACOES_PISCOFINS'] == 'T') {
                              if(item['MOVIMENTOSITENS_CST'] == '060') { // ST
                                item['MOVIMENTOSITENS_CSTPIS'] = cstPis;
                                item['MOVIMENTOSITENS_BASEPIS'] = ((valorItem - ((valorItem / 100) * 18)) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTAPIS'] = aliqPis;
                                item['MOVIMENTOSITENS_VALORPIS'] = (cents((item['MOVIMENTOSITENS_BASEPIS'] * aliqPis)) / 10000);

                                item['MOVIMENTOSITENS_CSTCOFINS'] = cstCofins;
                                item['MOVIMENTOSITENS_BASECOFINS'] = ((valorItem - ((valorItem / 100) * 18)) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = aliqCofins;
                                item['MOVIMENTOSITENS_VALORCOFINS'] = (cents((item['MOVIMENTOSITENS_BASECOFINS'] * aliqCofins)) / 10000);
                              } else {
                                item['MOVIMENTOSITENS_CSTPIS'] = cstPis;
                                item['MOVIMENTOSITENS_BASEPIS'] = ((valorItem - valorIcms) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTAPIS'] = aliqPis;
                                item['MOVIMENTOSITENS_VALORPIS'] = (cents((item['MOVIMENTOSITENS_BASEPIS'] * aliqPis)) / 10000);

                                item['MOVIMENTOSITENS_CSTCOFINS'] = cstCofins;
                                item['MOVIMENTOSITENS_BASECOFINS'] = ((valorItem - valorIcms) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = aliqCofins;
                                item['MOVIMENTOSITENS_VALORCOFINS'] = (cents((item['MOVIMENTOSITENS_BASECOFINS'] * aliqCofins)) / 10000);
                              }
                            } else {
                              item['MOVIMENTOSITENS_CSTPIS'] = '08'  // Sem incidência da contribuição
                              item['MOVIMENTOSITENS_BASEPIS'] = 0;
                              item['MOVIMENTOSITENS_ALIQUOTAPIS'] = 0;
                              item['MOVIMENTOSITENS_VALORPIS'] = 0;
                              item['MOVIMENTOSITENS_CSTCOFINS'] = '08'  // Sem incidência da contribuição
                              item['MOVIMENTOSITENS_BASECOFINS'] = 0;
                              item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = 0;
                              item['MOVIMENTOSITENS_VALORCOFINS'] = 0;
                            }
                          } else { // Pegando CST e Alíquota da tabela de NCMS
                            let valorItem   = cents(item['MOVIMENTOSITENS_TOTAL']) - cents(item['MOVIMENTOSITENS_DESCONTOS']);
                            let valorIcms   = cents(item['MOVIMENTOSITENS_VALORICMS']);
                            let cstPis      = item['NCMS_CSTPIS'] || '01' ;
                            let aliqPis     = cents(item['NCMS_ALIQUOTAPIS']) / 100;
                            let cstCofins   = item['NCMS_CSTCOFINS'] || '01' ;
                            let aliqCofins  = cents(item['NCMS_ALIQUOTACOFINS']) / 100;
                          
                            if(operacaoItem['OPERACOES_PISCOFINS'] == 'T') {
                              if(item['MOVIMENTOSITENS_CST'] == '060') { // ST
                                item['MOVIMENTOSITENS_CSTPIS'] = cstPis;
                                item['MOVIMENTOSITENS_BASEPIS'] = ((valorItem - ((valorItem / 100) * 18)) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTAPIS'] = aliqPis;
                                item['MOVIMENTOSITENS_VALORPIS'] = (cents((item['MOVIMENTOSITENS_BASEPIS'] * aliqPis)) / 10000);

                                item['MOVIMENTOSITENS_CSTCOFINS'] = cstCofins;
                                item['MOVIMENTOSITENS_BASECOFINS'] = ((valorItem - ((valorItem / 100) * 18)) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = aliqCofins;
                                item['MOVIMENTOSITENS_VALORCOFINS'] = (cents((item['MOVIMENTOSITENS_BASECOFINS'] * aliqCofins)) / 10000);
                              } else {
                                item['MOVIMENTOSITENS_CSTPIS'] = cstPis;
                                item['MOVIMENTOSITENS_BASEPIS'] = ((valorItem - valorIcms) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTAPIS'] = aliqPis;
                                item['MOVIMENTOSITENS_VALORPIS'] = (cents((item['MOVIMENTOSITENS_BASEPIS'] * aliqPis)) / 10000);

                                item['MOVIMENTOSITENS_CSTCOFINS'] = cstCofins;
                                item['MOVIMENTOSITENS_BASECOFINS'] = ((valorItem - valorIcms) / 100);
                                item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = aliqCofins;
                                item['MOVIMENTOSITENS_VALORCOFINS'] = (cents((item['MOVIMENTOSITENS_BASECOFINS'] * aliqCofins)) / 10000);
                              }
                            } else {
                              item['MOVIMENTOSITENS_CSTPIS'] = '08'  // Sem incidência da contribuição
                              item['MOVIMENTOSITENS_BASEPIS'] = 0;
                              item['MOVIMENTOSITENS_ALIQUOTAPIS'] = 0;
                              item['MOVIMENTOSITENS_VALORPIS'] = 0;
                              item['MOVIMENTOSITENS_CSTCOFINS'] = '08'  // Sem incidência da contribuição
                              item['MOVIMENTOSITENS_BASECOFINS'] = 0;
                              item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = 0;
                              item['MOVIMENTOSITENS_VALORCOFINS'] = 0;
                            }                            
                          } // Fim do cálculo PIS/COFINS

                        } else {                                //Agora, simples nacional

                            const queryProdutos = await api.produtos().read({
                              conteudo: '.' + item['MOVIMENTOSITENS_ID_PRODUTOS'],
                              empresa: data['MOVIMENTOS_ID_EMPRESAS'],
                              client: params.client
                            });
                            const produto = queryProdutos.results[0];
                            produtosIbsCbs[index] = produto;
                            const sobreTotal = 'T';

                            if(parseInt(item['SALDOS_CSTLOCAL']) == 0) {// Conversão CST para CSOSN em filiais mistas
                              item['MOVIMENTOSITENS_CST'] = '0102'
                            } else if(parseInt(item['SALDOS_CSTLOCAL']) == 40) {
                              item['MOVIMENTOSITENS_CST'] = '0103'
                            } else if(parseInt(item['SALDOS_CSTLOCAL']) == 41) {
                              item['MOVIMENTOSITENS_CST'] = '0300'
                            } else if(parseInt(item['SALDOS_CSTLOCAL']) == 60) {
                              item['MOVIMENTOSITENS_CST'] = '0500'
                            } else if(parseInt(item['SALDOS_CSTLOCAL']) == 90) {
                              item['MOVIMENTOSITENS_CST'] = '0900'
                            }

                            if(empresa['EMPRESAS_CPFCNPJ'].match(/65437543000116|03526177000114/)) { // Lais construtora e engenharia não fabricam.
                              // Não troca pra cfop de industria
                            } else {
                                if(produto['PRODUTOS_STATUS'] == 'P' &&                               
                                  item['MOVIMENTOSITENS_ID_OPERACOES'] == '510200') {
                                  if (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']) {
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = '510100'
                                  } else {
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = '610100'
                                  }
                                }
                            }

                            // Calculo da permissão de credito ICMS Simples Nacional
                            const aliqCom = cents(empresa['EMPRESAS_CNAE'].split('|')[5]) / 100; // Cómercio (Lislais)
                            const aliqInd = cents(empresa['EMPRESAS_CNAE'].split('|')[6]) / 100; // Indústria (Lislais)
                            const aliqPer = grams(empresa['EMPRESAS_ALIQUOTA']) / 1000; 

                            const vendaCom = item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5102|6102/) ? true : false;
                            const vendaInd = item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5101|6101/) ? true : false;
                            const vendaPer = item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 4).match(/5101|5102|6101|6102/) ? true : false;

                            if(vendaCom && aliqCom > 0) {
                              item['MOVIMENTOSITENS_PERCREDITO'] = aliqCom;
                              item['MOVIMENTOSITENS_VLRCREDITO'] = (cents(item['MOVIMENTOSITENS_TOTAL']) * cents(aliqCom)) / 1000000;
                            }

                            if(vendaInd && aliqInd > 0) {
                              item['MOVIMENTOSITENS_PERCREDITO'] = aliqInd;
                              item['MOVIMENTOSITENS_VLRCREDITO'] = (cents(item['MOVIMENTOSITENS_TOTAL']) * cents(aliqInd)) / 1000000;
                            }

                            if(vendaPer && aliqPer > 0) {
                              item['MOVIMENTOSITENS_PERCREDITO'] = aliqPer;
                              item['MOVIMENTOSITENS_VLRCREDITO'] = (cents(item['MOVIMENTOSITENS_TOTAL']) * grams(aliqPer)) / 10000000;
                            }

                            // Fim do calculo ICMS Simples nacional

                            if (operacao['OPERACOES_UNICA'] == 'T') {
                                if ((item['SALDOS_CSTOUTROS'] || '').trim().slice(-3) == '900') {
                                    item['MOVIMENTOSITENS_ICMS'] = item['SALDOS_ICMSLC'];
                                    if (item['SALDOS_BASELC'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                        item['MOVIMENTOSITENS_BASEICMS'] = item['TOTAL_LIQUIDO'] // Antes: MOVIMENTOSITENS_TOTAL
                                    } else if (item['SALDOS_BASELC'] > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                        item['MOVIMENTOSITENS_BASEICMS'] = Math.round(cents(item['TOTAL_LIQUIDO']) * 0.01 * grams(item['SALDOS_BASELC']) / 1000) / 100; // Antes: MOVIMENTOSITENS_TOTAL
                                    }
                                    if (item['MOVIMENTOSITENS_ICMS'] > 0) {
                                        item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;
                                    }
                                }
                            } else if (empresa['EMPRESAS_CPFCNPJ'] == '00917145000151') { // JD Distribuidora
                                if(item['MOVIMENTOSITENS_CST'] == '0101' && !isContribuinte) {
                                  item['MOVIMENTOSITENS_CST'] = '0102'; // Não contribuinte não permite crédito                                  
                                }
                                if(item['MOVIMENTOSITENS_CST'] == '0102' && isContribuinte) {
                                  item['MOVIMENTOSITENS_CST'] = '0101'; // Contribuinte permite crédito
                                }
                                if (produto['PRODUTOS_ID_GRUPOS'] == 89) {                // Produtos Remanufaturados
                                    item['MOVIMENTOSITENS_CST'] = '0102';
                                    if (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']) {
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '510100'
                                    } else {
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '610100';
                                    }
                                } else if (item['MOVIMENTOSITENS_CST'] == '0500') {
                                    if (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']) {
                                      if((pessoa['PESSOAS_CPFCNPJ'] || '').toString().length == 11) { // PF não tem Subst. Tributária
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '510100';
                                        item['MOVIMENTOSITENS_CST'] = '0102';
                                      } else {
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = cfopStLocal;
                                      }
                                    } else if(!!('RO#MS#TO#SE#CE#RN#PE#TO#DF#SC').match(pessoa['CIDADES_ESTADO'])  && empresa['EMPRESAS_CPFCNPJ'] != '05971492000186'){ // e não biomart
                                        item['MOVIMENTOSITENS_CST'] = '0102';
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '610200';
                                    } else {
                                      if((pessoa['PESSOAS_CPFCNPJ'] || '').toString().length == 11) { // PF não tem Subst. Tributária
                                        item['MOVIMENTOSITENS_CST'] = '0102';
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '610100';
                                      } else {
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = cfopStOutros;
                                      }  
                                    }
                                }
                            } else if (item['MOVIMENTOSITENS_CST'] == '0500') {
                              if(operacaoCabecalho == '515200') {
                                item['MOVIMENTOSITENS_ID_OPERACOES'] = '540900';   // Transferência ST
                              } else {
                                if (empresa['CIDADES_ESTADO'] == pessoa['CIDADES_ESTADO']  && 
//                                  !item['MOVIMENTOSITENS_ID_OPERACOES'].toString().slice(0, 2).match(/14|24|54|64/) &&  // Subst Tributária (1405, 5405, 5411, etc)
                                    empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') {
                                  item['MOVIMENTOSITENS_ID_OPERACOES'] = '540500';
                                } else {
                                    if (operacaoCabecalho == '610100'  && empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') {
                                        item['MOVIMENTOSITENS_ID_OPERACOES'] = '640300';
                                    } else {
                                        if(empresa['EMPRESAS_CPFCNPJ'] != '05971492000186') { // Não biomart
                                          item['MOVIMENTOSITENS_ID_OPERACOES'] = cfopStOutros;
                                        }
                                    }
                                }
                              }
                            }

                            if((pessoa['PESSOAS_INSCRICAO'] || '').match(/ISENTO/i) || !pessoa['PESSOAS_INSCRICAO']) {
                              if(!'0101#0102#0103#0300#0400#0500'.match(item['MOVIMENTOSITENS_CST'])) {                                
                                item['MOVIMENTOSITENS_CST'] = '0102';
                              }
                            }

                            if(operacao['OPERACOES_IPI'] == 'T') { // IPI no simples nacional
                              if(item['MOVIMENTOSITENS_CST'].toString().match(/090/)){
                                // manterá o IPI informado pelo usuário mas irá zerar o % por ser devolutivo
                                item['MOVIMENTOSITENS_IPI'] = 0;
                              } else {
                                if (item['SALDOS_IPI'] > 0)  {
                                  item['MOVIMENTOSITENS_IPI']      = item['SALDOS_IPI'];
                                  item['MOVIMENTOSITENS_VALORIPI'] = Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * grams(item['MOVIMENTOSITENS_IPI']) / 1000) / 100;
                                } else {
                                  item['MOVIMENTOSITENS_VALORIPI'] = 0;
                                }
                              }                                                               
                            } else {
                              item['MOVIMENTOSITENS_VALORIPI'] = 0;                              
                            }

                            // Substituição Tributária no SIMPLES NACIONAL
                            // cálculo ST

                            if(operacao['OPERACOES_COMPLEMENTAR'] != 'T') {                         
                              item['MOVIMENTOSITENS_BASEST'] = 0;
                              item['MOVIMENTOSITENS_VALORST'] = 0;
                            }


// ST Malacrida Simples Nacional
                            if(empresa['EMPRESAS_CPFCNPJ'] == '56779193000185' &&  // Cafe aroma
                                item['NCMS_NCM'].match(/09012100|09011110/) &&
                                pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO'] &&
                                operacao['OPERACOES_ST'] == 'T' &&
                                isContribuinte) {
                                  item['MOVIMENTOSITENS_ICMS'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO'])          ? item['SALDOS_ICMSLC'] :
                                                                 (!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])) ? item['SALDOS_ICMS02'] : item['SALDOS_ICMS01'];
                                  if (item['SALDOS_BASELC'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                     item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)); 
                                  } else if (perBaselc > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                        item['MOVIMENTOSITENS_BASEICMS'] = Math.round((cents(item['TOTAL_LIQUIDO']) + cents(sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)) * 0.01 * grams(perBaselc) / 1000) / 100;
                                  }

                                  item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;

                                  item['MOVIMENTOSITENS_BASEST']    = (cents(item['MOVIMENTOSITENS_BASEICMS']) + (cents(item['MOVIMENTOSITENS_BASEICMS']) * (perIVA / 100))) / 100; 

                                  item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .18) / 100; 
                                  
                                  item['MOVIMENTOSITENS_VALORST'] = item['MOVIMENTOSITENS_VALORST'] - item['MOVIMENTOSITENS_VALORICMS'];
                                  item['MOVIMENTOSITENS_BASEICMS']  = 0;
                                  item['MOVIMENTOSITENS_ICMS'] = 0;
                                  item['MOVIMENTOSITENS_VALORICMS'] = 0;


                            }


//

                            if(item['SALDOS_CSTSUBST'] == '111' &&
                               item['MOVIMENTOSITENS_CST'] == '1202') {

                                  if(pessoa['CIDADES_ESTADO'] == 'PR' ||  // IVA PR e PE
                                     pessoa['CIDADES_ESTADO'] == 'PE') {
                                     perIVA = 103.59
                                  }
     
                                  if(pessoa['PESSOAS_CPFCNPJ'].length == 11 || !isContribuinte || pessoa['PESSOAS_INSCRICAO'].match(/ISENTO/)) {  // PF ou Não contribuinte não tem ST
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) ? 510200 : 610200;
                                  } else {
                                    item['MOVIMENTOSITENS_ID_OPERACOES'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO']) ? cfopStLocal : cfopStOutros;
                                  }

                                  item['MOVIMENTOSITENS_ICMS'] = (pessoa['CIDADES_ESTADO'] == empresa['CIDADES_ESTADO'])          ? item['SALDOS_ICMSLC'] :
                                                                 (!!empresa['EMPRESAS_REGIAO12'].match(pessoa['CIDADES_ESTADO'])) ? item['SALDOS_ICMS02'] : item['SALDOS_ICMS01'];
                                  if (item['SALDOS_BASELC'] == 100 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_BASEICMS'] = (item['TOTAL_LIQUIDO'] + (sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)); 
                                  } else if (perBaselc > 0 && item['MOVIMENTOSITENS_ICMS'] > 0) {
                                      item['MOVIMENTOSITENS_BASEICMS'] = Math.round((cents(item['TOTAL_LIQUIDO']) + cents(sobreTotal ? item['MOVIMENTOSITENS_FRETE'] : 0)) * 0.01 * grams(perBaselc) / 1000) / 100;
                                  }
                                  item['MOVIMENTOSITENS_VALORICMS'] = Math.round(cents(item['MOVIMENTOSITENS_BASEICMS']) * 0.01 * grams(item['MOVIMENTOSITENS_ICMS']) / 1000) / 100;


                                  if(!(pessoa['PESSOAS_CPFCNPJ'].length == 11 || !isContribuinte || pessoa['PESSOAS_INSCRICAO'].match(/ISENTO/))) {
                                    item['MOVIMENTOSITENS_BASEST']    = (cents(item['MOVIMENTOSITENS_TOTAL']) + (cents(item['MOVIMENTOSITENS_TOTAL']) * (perIVA / 100))) / 100;
                                    if(empresa['CIDADES_ESTADO'] == 'PR') {  // Interno PR
                                      if(pessoa['CIDADES_ESTADO'] == 'PE') {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .18) / 100;
                                      } else {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .19) / 100;
                                      }
                                    }  
                                    if(empresa['CIDADES_ESTADO'] == 'SP') { // Origem SP
                                      if(pessoa['CIDADES_ESTADO'].match(/SP|PE/)) {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .18) / 100;
                                      }
                                      if(pessoa['CIDADES_ESTADO'] == 'PR') {                                      
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .19) / 100;
                                      }
                                      if(pessoa['CIDADES_ESTADO'] == 'MT') {
                                        item['MOVIMENTOSITENS_VALORST']   = (cents(item['MOVIMENTOSITENS_BASEST']) * .17) / 100;
                                      }  
                                    }

                                    if(pessoa['CIDADES_ESTADO'].match(/MS|ES/)) {  // MS e ES não tem ST nesse caso
                                      item['MOVIMENTOSITENS_BASEICMS']  = 0;
                                      item['MOVIMENTOSITENS_VALORICMS'] = 0;
                                      item['MOVIMENTOSITENS_BASEST']    = 0;
                                      item['MOVIMENTOSITENS_VALORST']   = 0;
                                    } else {
                                      item['MOVIMENTOSITENS_VALORST'] = item['MOVIMENTOSITENS_VALORST'] - item['MOVIMENTOSITENS_VALORICMS'];
                                      item['MOVIMENTOSITENS_BASEICMS']  = 0;
                                      item['MOVIMENTOSITENS_VALORICMS'] = 0;
                                    }
                                  }
                            }
                            // Fim da Substituição Simples Nacional
                        }
                        
                        data['MOVIMENTOS_BASEICMS']   = (cents(data['MOVIMENTOS_BASEICMS'])  + cents(item['MOVIMENTOSITENS_BASEICMS']))  / 100;
                        data['MOVIMENTOS_VALORICMS']  = (cents(data['MOVIMENTOS_VALORICMS']) + cents(item['MOVIMENTOSITENS_VALORICMS'])) / 100;
                        data['MOVIMENTOS_VALORIPI']   = (cents(data['MOVIMENTOS_VALORIPI'])  + cents(item['MOVIMENTOSITENS_VALORIPI']))  / 100;
                        data['MOVIMENTOS_BASEST']     = (cents(data['MOVIMENTOS_BASEST'])    + cents(item['MOVIMENTOSITENS_BASEST']))    / 100;      
                        data['MOVIMENTOS_VALORST']    = (cents(data['MOVIMENTOS_VALORST'])   + cents(item['MOVIMENTOSITENS_VALORST']))   / 100;                        

                        data['MOVIMENTOS_PRODUTOS']  = (cents(data['MOVIMENTOS_PRODUTOS'])  + cents(item['MOVIMENTOSITENS_TOTAL']))     / 100;
                        data['MOVIMENTOS_TOTAL']     = (
                            cents(data['MOVIMENTOS_TOTAL'])  + 
                            cents(item['TOTAL_LIQUIDO'])  +
                            cents(item['MOVIMENTOSITENS_FRETE'])    +
                            cents(item['MOVIMENTOSITENS_SEGURO'])   +
                            cents(item['MOVIMENTOSITENS_VALORIPI']) +                            
                            cents(item['MOVIMENTOSITENS_VALORST'])  +                            
                            cents(item['MOVIMENTOSITENS_DESPESAS'])
                        ) / 100;

                        if (operacao['OPERACOES_ACAO'] == 'VN') {
                            const nacional  = grams(item['NCMS_ALIQUOTANACIONAL']);
                            const estadual  = grams(item['NCMS_ALIQUOTAESTADUAL']);
                            const municipal = grams(item['NCMS_ALIQUOTAMUNICIPAL']);
                            const temAliquota = !!(nacional + estadual + municipal);

                            if(temAliquota){
                                item['MOVIMENTOSITENS_IMPOSTO'] = (
                                    Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * nacional  / 1000) +
                                    Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * estadual  / 1000) +
                                    Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * municipal / 1000)
                                ) / 100;
                            } else {//calcula alíquota fixa de 34%
                                item['MOVIMENTOSITENS_IMPOSTO'] = (
                                    Math.round(cents(item['MOVIMENTOSITENS_TOTAL']) * 0.01 * grams(34) / 1000)
                                ) / 100;
                            }
                            data['MOVIMENTOS_IMPOSTO'] = (cents(data['MOVIMENTOS_IMPOSTO']) + cents(item['MOVIMENTOSITENS_IMPOSTO'])) / 100;
                        }
                    } catch(error) {
                        samosFB.enviarRespostaErro(`Falha ao calcular imposto nos itens`, null, error, reject);
                    }
                }));

                // ============================================================
                // CALCULO IBS/CBS
                // Uma única requisição para todos os itens da operação
                // ============================================================
                if (usarCalculadoraIbsCbs) { // Calculo via api calculadora
                    const itensIbsCbs = itens.map((item, index) => {

                        const produto = produtosIbsCbs[index];

                        if (!produto) {
                            throw new Error(
                                `Produto não carregado para cálculo IBS/CBS do item ${index + 1}. ` +
                                `Produto ID: ${item['MOVIMENTOSITENS_ID_PRODUTOS']}`
                            );
                        }

                        return {
                            item,
                            produto
                        };
                    });

                    let resultadosIbsCbs;

                    if (crtIbsCbs === 1 || crtIbsCbs === 2) {

                        console.log(
                            'CALCULADORA IBS/CBS: SIMPLES NACIONAL',
                            'CRT =',
                            crtIbsCbs
                        );

                        resultadosIbsCbs = await calculadoraIbsCbs.calcularSimples({
                            itens: itensIbsCbs,
                            data,
                            crt: crtIbsCbs
                        });

                    } else {

                        console.log(
                            'CALCULADORA IBS/CBS: REGIME GERAL',
                            'CRT =',
                            crtIbsCbs
                        );

                        resultadosIbsCbs = await calculadoraIbsCbs.calcular({
                            itens: itensIbsCbs,
                            pessoa,
                            data
                        });
                    }

                    // Zera novamente os totais antes de acumular
                    // os valores devolvidos pela calculadora.
                    data['MOVIMENTOS_BASEIBSCBS'] = 0;
                    data['MOVIMENTOS_VALORIBS']   = 0;
                    data['MOVIMENTOS_VALORCBS']   = 0;

                    resultadosIbsCbs.forEach(resultado => {

                        const indexItem = resultado.numero - 1;
                        const item = itens[indexItem];

                        if (!item) {
                            throw new Error(
                                `Não foi encontrado o item ${resultado.numero} ` +
                                `retornado pela Calculadora IBS/CBS.`
                            );
                        }


                        // --------------------------------------------------------
                        // Identificação tributária
                        // --------------------------------------------------------

                        item['MOVIMENTOSITENS_CSTIBSCBS'] =
                            resultado.cst;

                        item['MOVIMENTOSITENS_CCLASSTRIB'] =
                            resultado.cClassTrib;


                        // --------------------------------------------------------
                        // Base
                        // --------------------------------------------------------

                        item['MOVIMENTOSITENS_BASEIBSCBS'] =
                            resultado.baseCalculo;


                        // --------------------------------------------------------
                        // IBS
                        // --------------------------------------------------------

                        item['MOVIMENTOSITENS_ALIQUOTAIBS'] =
                            resultado.aliquotaIbs;

                        item['MOVIMENTOSITENS_VALORIBS'] =
                            resultado.valorIbs;

                        item['MOVIMENTOSITENS_PERREDIBS'] =
                            resultado.reducaoIbsUf;

                        item['MOVIMENTOSITENS_PERDIFIBS'] =
                            resultado.diferimentoIbs;

                        item['MOVIMENTOSITENS_VLRDIFIBS'] =
                            resultado.valorDiferimentoIbs;

                        item['MOVIMENTOSITENS_VLRDEVIBS'] =
                            resultado.valorDevolucaoIbs;


                        // --------------------------------------------------------
                        // CBS
                        // --------------------------------------------------------

                        item['MOVIMENTOSITENS_ALIQUOTACBS'] =
                            resultado.aliquotaCbs;

                        item['MOVIMENTOSITENS_VALORCBS'] =
                            resultado.valorCbs;

                        item['MOVIMENTOSITENS_PERREDCBS'] =
                            resultado.reducaoCbs;

                        item['MOVIMENTOSITENS_PERDIFCBS'] =
                            resultado.diferimentoCbs;

                        item['MOVIMENTOSITENS_VLRDIFCBS'] =
                            resultado.valorDiferimentoCbs;

                        item['MOVIMENTOSITENS_VLRDEVCBS'] =
                            resultado.valorDevolucaoCbs;


                        // --------------------------------------------------------
                        // Acumula IBS/CBS no cabeçalho do movimento
                        // --------------------------------------------------------

                        data['MOVIMENTOS_BASEIBSCBS'] =
                            (
                                cents(data['MOVIMENTOS_BASEIBSCBS']) +
                                cents(item['MOVIMENTOSITENS_BASEIBSCBS'])
                            ) / 100;


                        data['MOVIMENTOS_VALORIBS'] =
                            (
                                cents(data['MOVIMENTOS_VALORIBS']) +
                                cents(item['MOVIMENTOSITENS_VALORIBS'])
                            ) / 100;


                        data['MOVIMENTOS_VALORCBS'] =
                            (
                                cents(data['MOVIMENTOS_VALORCBS']) +
                                cents(item['MOVIMENTOSITENS_VALORCBS'])
                            ) / 100;


                        // Mantém o comportamento que já existia no sistema.
                        // Se houver alíquotas diferentes entre produtos,
                        // estes campos do cabeçalho ficarão com a última.
                        data['MOVIMENTOS_ALIQUOTAIBS'] =
                            item['MOVIMENTOSITENS_ALIQUOTAIBS'];

                        data['MOVIMENTOS_ALIQUOTACBS'] =
                            item['MOVIMENTOSITENS_ALIQUOTACBS'];
                    });
                } else { // Cálculo padrão IBS/CBS (sem a api da calculadora)

                    itens.forEach((item, index) => {

                        const produto = produtosIbsCbs[index] || {};

                        const cstIbsCbs =
                            (produto['PRODUTOS_CSTIBSCBS'] || '000')
                                .toString()
                                .trim();

                        const cClassTrib =
                            (produto['PRODUTOS_CLASSTRIB'] || '000001')
                                .toString()
                                .trim();

                        item['MOVIMENTOSITENS_CSTIBSCBS']  = cstIbsCbs;
                        item['MOVIMENTOSITENS_CCLASSTRIB'] = cClassTrib;

                        item['MOVIMENTOSITENS_BASEIBSCBS'] =
                            item['TOTAL_LIQUIDO'] +
                            item['MOVIMENTOSITENS_FRETE'] +
                            item['MOVIMENTOSITENS_SEGURO'] +
                            item['MOVIMENTOSITENS_DESPESAS'];

                        // IBS
                        item['MOVIMENTOSITENS_ALIQUOTAIBS'] = 0.1;

                        item['MOVIMENTOSITENS_VALORIBS'] =
                            Math.round(
                                cents(item['MOVIMENTOSITENS_BASEIBSCBS']) *
                                0.01 *
                                grams(item['MOVIMENTOSITENS_ALIQUOTAIBS']) /
                                1000
                            ) / 100;

                        item['MOVIMENTOSITENS_PERREDIBS'] = 0;
                        item['MOVIMENTOSITENS_PERDIFIBS'] = 0;
                        item['MOVIMENTOSITENS_VLRDIFIBS'] = 0;
                        item['MOVIMENTOSITENS_VLRDEVIBS'] = 0;

                        // CBS
                        item['MOVIMENTOSITENS_ALIQUOTACBS'] = 0.9;

                        item['MOVIMENTOSITENS_VALORCBS'] =
                            Math.round(
                                cents(item['MOVIMENTOSITENS_BASEIBSCBS']) *
                                0.01 *
                                grams(item['MOVIMENTOSITENS_ALIQUOTACBS']) /
                                1000
                            ) / 100;

                        item['MOVIMENTOSITENS_PERREDCBS'] = 0;
                        item['MOVIMENTOSITENS_PERDIFCBS'] = 0;
                        item['MOVIMENTOSITENS_VLRDIFCBS'] = 0;
                        item['MOVIMENTOSITENS_VLRDEVCBS'] = 0;

                        // Acumula no cabeçalho
                        data['MOVIMENTOS_BASEIBSCBS'] =
                            (
                                cents(data['MOVIMENTOS_BASEIBSCBS']) +
                                cents(item['MOVIMENTOSITENS_BASEIBSCBS'])
                            ) / 100;

                        data['MOVIMENTOS_VALORIBS'] =
                            (
                                cents(data['MOVIMENTOS_VALORIBS']) +
                                cents(item['MOVIMENTOSITENS_VALORIBS'])
                            ) / 100;

                        data['MOVIMENTOS_VALORCBS'] =
                            (
                                cents(data['MOVIMENTOS_VALORCBS']) +
                                cents(item['MOVIMENTOSITENS_VALORCBS'])
                            ) / 100;

                        data['MOVIMENTOS_ALIQUOTAIBS'] =
                            item['MOVIMENTOSITENS_ALIQUOTAIBS'];

                        data['MOVIMENTOS_ALIQUOTACBS'] =
                            item['MOVIMENTOSITENS_ALIQUOTACBS'];
                    });
                }
                // ============================================================
                // FIM DO CALCULO IBS/CBS
                // ============================================================                
        
                if(!usarDesconto) {
                  data['MOVIMENTOS_DESCONTOS'] = 0;
                  data['MOVIMENTOS_PERCENTUAL'] = 0;  // Desconto %  
                }

                if(operacao['OPERACOES_UNICA'] != 'T'){

                    const operacaoPrimeiroItem = itens[0]['MOVIMENTOSITENS_ID_OPERACOES'];
                    const todosItemComMesmaOperacao = itens.every(item => {
                        return item['MOVIMENTOSITENS_ID_OPERACOES'] == operacaoPrimeiroItem;
                    });

                    const algumProdutoTributado = itens.filter(item => {
                        return item['MOVIMENTOSITENS_CST'] == '000';
                    });

                    if(todosItemComMesmaOperacao){
                        data['MOVIMENTOS_ID_OPERACOES'] = operacaoPrimeiroItem;
                    } else {
                      if(algumProdutoTributado.length > 0 && regimeNormal) {
                        data['MOVIMENTOS_ID_OPERACOES'] = algumProdutoTributado[0]['MOVIMENTOSITENS_ID_OPERACOES'];
                      }
                    }
                } else {
                    itens.forEach(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = data['MOVIMENTOS_ID_OPERACOES'];
                        if(pessoa['PESSOAS_CATEGORIA'] == '3' && data['MOVIMENTOS_ID_OPERACOES'] == 710100 && regimeNormal) {
                          item['MOVIMENTOSITENS_BASEICMS'] = 0;
                          item['MOVIMENTOSITENS_VALORICMS'] = 0;
                          item['MOVIMENTOSITENS_ICMS'] = 0;
                          item['MOVIMENTOSITENS_CST'] = '041'
                        }
                        if(item['MOVIMENTOSITENS_ID_OPERACOES'] == 611000) {  // ZONA FRANCA MANAUS
                          item['MOVIMENTOSITENS_BASEICMS'] = 0;
                          item['MOVIMENTOSITENS_VALORICMS'] = 0;
                          item['MOVIMENTOSITENS_ICMS'] = 0;
                          item['MOVIMENTOSITENS_CST'] = '040'
                        }
                    });
                }

                // Calcula a retenção configurada no cadastro da pessoa.
                // PESSOAS_RETENCAO é percentual (ex.: 1,5 = 1,5%).
                const percentualRetencao = cents(pessoa['PESSOAS_RETENCAO'] || 0) / 100;

                if (percentualRetencao > 0 && regimeNormal) {  // Só retem no regime normal
                    data['MOVIMENTOS_VALORRETENCAO'] = Math.round(cents(data['MOVIMENTOS_TOTAL']) * percentualRetencao) / 10000;
                } else {
                    data['MOVIMENTOS_VALORRETENCAO'] = 0;
                }

                samosFB.enviarRespostaSucesso(null, [data], 1, resolve);
            } catch(error){
                samosFB.enviarRespostaErro(`Falha ao calcular imposto`, null, error && error.message ? error.message : error, reject);
            }
        });
    }
};

const montaConvenio = function(arrayConvenios, foraEstado) {

  let listaConvenios = '';

  for(let i in arrayConvenios) {
      if(foraEstado) {
        if(arrayConvenios[i] == 'U')       { listaConvenios += "|RICMS-SP/2000, LIVRO VI, ANEXO II, ARTIGO 10, INCISO III"; }
        else if (arrayConvenios[i] == 'V') { listaConvenios += "|RICMS-SP/2000, LIVRO VI, ANEXO II, ARTIGO 9, INCISO IV"; }
      } else {
        if(arrayConvenios[i] == 'O')       { listaConvenios += "|RICMS-SP/2000, LIVRO VI, ANEXO I, ARTIGO 41, INCISO XIII"; }
        else if (arrayConvenios[i] == 'S') { listaConvenios += "|RICMS-SP/2000, LIVRO VI, ANEXO I, ARTIGO 41, INCISO V"; }
      }
  }

  return listaConvenios;

};