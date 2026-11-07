Ext.define('SamosAdmin.movimentos.movimento.services.Impostos', {
    alternateClassName: 'Movimento.services.Impostos',
    singleton: true,

    calcular: async function(form) {
        try {
            const vm = form.getViewModel();
            
            if( vm.get('isNotaEletronica') || vm.get('isPedidoST') || vm.get('isPreVendaST')) {
                await this.calcularNota(form);

            } else if(vm.get('isOrcamento') && configs.getMovimentos().calcularOrcamentoST){ 
                await this.calcularST(form);
            } 
    
        } catch(error) {
            console.error(error);
            throw 'Falha ao calcular imposto';
        }
    },

    calcularNota: async function(form) {
        const vm = form.getViewModel();
        const ctrl  = form.getController();
        const model = ctrl.getRecord();
        const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;

        ctrl.colocarFilhosNoModel(model, false);

        await SamosUtils.Utils.sleep(1000);

        const data = {
            'aliquotas'                  : configs.getAliquotas() || [],//para calculo regime especial (exterior)
            'MOVIMENTOS_ID_DOCUMENTOS'   : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
            'MOVIMENTOS_ID_PESSOAS'      : model.get('MOVIMENTOS_ID_PESSOAS'),
            'MOVIMENTOS_ID_PROPRIEDADES' : model.get('MOVIMENTOS_ID_PROPRIEDADES'),
            'MOVIMENTOS_ID_EMPRESAS'     : model.get('MOVIMENTOS_ID_EMPRESAS'),
            'MOVIMENTOS_NUMERO'          : model.get('MOVIMENTOS_NUMERO'),
            'MOVIMENTOS_SERIE'           : model.get('MOVIMENTOS_SERIE'),
            'MOVIMENTOS_ID_OPERACOES'    : model.get('MOVIMENTOS_ID_OPERACOES'),
            'MOVIMENTOS_BASEICMS'        : model.get('MOVIMENTOS_BASEICMS'),
            'MOVIMENTOS_VALORICMS'       : model.get('MOVIMENTOS_VALORICMS'),

            'MOVIMENTOS_BASEIBSCBS'      : model.get('MOVIMENTOS_BASEIBSCBS'),
            'MOVIMENTOS_ALIQUOTAIBS'     : model.get('MOVIMENTOS_ALIQUOTAIBS'),
            'MOVIMENTOS_VALORIBS'        : model.get('MOVIMENTOS_VALORIBS'),
            'MOVIMENTOS_ALIQUOTACBS'     : model.get('MOVIMENTOS_ALIQUOTACBS'),
            'MOVIMENTOS_VALORCBS'        : model.get('MOVIMENTOS_VALORCBS'),

            'MOVIMENTOS_BASEST'          : model.get('MOVIMENTOS_BASEST'),
            'MOVIMENTOS_VALORST'         : model.get('MOVIMENTOS_VALORST'),
            'MOVIMENTOS_VALORIPI'        : model.get('MOVIMENTOS_VALORIPI'),
            'MOVIMENTOS_FRETE'           : model.get('MOVIMENTOS_FRETE'),
            'MOVIMENTOS_IMPOSTO'         : model.get('MOVIMENTOS_IMPOSTO'),
            'MOVIMENTOS_SEGURO'          : configs.getMovimentos().usarMarkup ? 0 : model.get('MOVIMENTOS_SEGURO'),
            'MOVIMENTOS_DESPESAS'        : model.get('MOVIMENTOS_DESPESAS'),
            'MOVIMENTOS_PRODUTOS'        : model.get('MOVIMENTOS_PRODUTOS'),
            'MOVIMENTOS_DESCONTOS'       : model.get('MOVIMENTOS_DESCONTOS'),
            'MOVIMENTOS_PERCENTUAL'      : grams(model.get('MOVIMENTOS_PERCENTUAL')) / 1000,
            'MOVIMENTOS_TOTAL'           : model.get('MOVIMENTOS_TOTAL'),
            'MOVIMENTOS_OBSERVACOES'     : model.get('MOVIMENTOS_OBSERVACOES'),
            'MOVIMENTOS_SITUACAO'        : model.get('MOVIMENTOS_SITUACAO'),
            'MOVIMENTOS_ITENS'           : (model.get('MOVIMENTOS_ITENS') || []).map(item => {
                    item['MOVIMENTOSITENS_QUANTIDADE']     = grams(item['MOVIMENTOSITENS_QUANTIDADE'])     / 1000;
                    item['MOVIMENTOSITENS_PERCENTUAL']     = grams(item['MOVIMENTOSITENS_PERCENTUAL'])     / 1000;
                    item['MOVIMENTOSITENS_CUSTO']          = cents(item['MOVIMENTOSITENS_CUSTO'])          / 100;
                    item['MOVIMENTOSITENS_PRECO']          = toPrecision(item['MOVIMENTOSITENS_PRECO'], casasDecimaisPreco) / Math.pow(10, casasDecimaisPreco);
                    item['VALOR_LIQUIDO']                  = cents(item['VALOR_LIQUIDO'])                  / 100;
                    item['TOTAL_LIQUIDO']                  = cents(item['TOTAL_LIQUIDO'])                  / 100;
                    item['MOVIMENTOSITENS_IMPOSTO']        = cents(item['MOVIMENTOSITENS_IMPOSTO'])        / 100;
                    item['MOVIMENTOSITENS_CST']            = item['MOVIMENTOSITENS_CST'];
                    item['MOVIMENTOSITENS_CSTPIS']         = item['MOVIMENTOSITENS_CSTPIS'];
                    item['MOVIMENTOSITENS_CSTCOFINS']      = item['MOVIMENTOSITENS_CSTCOFINS'];
                    item['MOVIMENTOSITENS_ESCRITURACAO']   = item['MOVIMENTOSITENS_ESCRITURACAO'];
                    item['MOVIMENTOSITENS_EXCECAO']        = item['MOVIMENTOSITENS_EXCECAO'];
                    item['MOVIMENTOSITENS_ALIQUOTAPIS']    = grams(item['MOVIMENTOSITENS_ALIQUOTAPIS'])    / 1000;
                    item['MOVIMENTOSITENS_BASEPIS']        = cents(item['MOVIMENTOSITENS_BASEPIS'])        / 100;
                    item['MOVIMENTOSITENS_VALORPIS']       = cents(item['MOVIMENTOSITENS_VALORPIS'])       / 100;
                    item['MOVIMENTOSITENS_VALORPISST']     = 0;
                    item['MOVIMENTOSITENS_ALIQUOTACOFINS'] = grams(item['MOVIMENTOSITENS_ALIQUOTACOFINS']) / 1000;
                    item['MOVIMENTOSITENS_BASECOFINS']     = cents(item['MOVIMENTOSITENS_BASECOFINS'])     / 100;
                    item['MOVIMENTOSITENS_VALORCOFINS']    = cents(item['MOVIMENTOSITENS_VALORCOFINS'])    / 100;
                    item['MOVIMENTOSITENS_VALORCOFINSST']  = 0;
                    item['MOVIMENTOSITENS_ICMS']           = grams(item['MOVIMENTOSITENS_ICMS'])           / 1000;
                    item['MOVIMENTOSITENS_BASEICMS']       = cents(item['MOVIMENTOSITENS_BASEICMS'])       / 100;
                    item['MOVIMENTOSITENS_VALORICMS']      = cents(item['MOVIMENTOSITENS_VALORICMS'])      / 100;
                    item['MOVIMENTOSITENS_FRETE']          = cents(item['MOVIMENTOSITENS_FRETE'])          / 100;
                    item['MOVIMENTOSITENS_VALORST']        = cents(item['MOVIMENTOSITENS_VALORST'])        / 100;
                    item['MOVIMENTOSITENS_BASEST']         = cents(item['MOVIMENTOSITENS_BASEST'])         / 100;

                    item['MOVIMENTOSITENS_CSTIBSCBS']      = item['MOVIMENTOSITENS_CSTIBSCBS'];
                    item['MOVIMENTOSITENS_CCLASSTRIB']     = item['MOVIMENTOSITENS_CCLASSTRIB'];
                    item['MOVIMENTOSITENS_BASEIBSCBS']     = cents(item['MOVIMENTOSITENS_BASEIBSCBS'])     / 100;
                    item['MOVIMENTOSITENS_ALIQUOTAIBS']    = grams(item['MOVIMENTOSITENS_ALIQUOTAIBS'])    / 1000;
                    item['MOVIMENTOSITENS_VALORIBS']       = cents(item['MOVIMENTOSITENS_VALORIBS'])       / 100;
                    item['MOVIMENTOSITENS_PERREDIBS']      = grams(item['MOVIMENTOSITENS_PERREDIBS'])      / 1000;
                    item['MOVIMENTOSITENS_PERDIFIBS']      = grams(item['MOVIMENTOSITENS_PERDIFIBS'])      / 1000;
                    item['MOVIMENTOSITENS_VLRDIFIBS']      = cents(item['MOVIMENTOSITENS_VLRDIFIBS'])      / 100;
                    item['MOVIMENTOSITENS_VLRDEVIBS']      = cents(item['MOVIMENTOSITENS_VLRDEVIBS'])      / 100;
                    item['MOVIMENTOSITENS_ALIQUOTACBS']    = grams(item['MOVIMENTOSITENS_ALIQUOTACBS'])    / 1000;
                    item['MOVIMENTOSITENS_VALORCBS']       = cents(item['MOVIMENTOSITENS_VALORCBS'])       / 100;
                    item['MOVIMENTOSITENS_PERREDCBS']      = grams(item['MOVIMENTOSITENS_PERREDCBS'])      / 1000;
                    item['MOVIMENTOSITENS_PERDIFCBS']      = grams(item['MOVIMENTOSITENS_PERDIFCBS'])      / 1000;
                    item['MOVIMENTOSITENS_VLRDIFCBS']      = cents(item['MOVIMENTOSITENS_VLRDIFCBS'])      / 100;
                    item['MOVIMENTOSITENS_VLRDEVCBS']      = cents(item['MOVIMENTOSITENS_VLRDEVCBS'])      / 100;

                    item['MOVIMENTOSITENS_IPI']            = cents(item['MOVIMENTOSITENS_IPI'])            / 100;
                    item['MOVIMENTOSITENS_VALORIPI']       = cents(item['MOVIMENTOSITENS_VALORIPI'])       / 100;
                    item['MOVIMENTOSITENS_SEGURO']         = configs.getMovimentos().usarMarkup ? 0 : cents(item['MOVIMENTOSITENS_SEGURO'])         / 100;
                    item['MOVIMENTOSITENS_DESPESAS']       = cents(item['MOVIMENTOSITENS_DESPESAS'])       / 100;
                    item['MOVIMENTOSITENS_TOTAL']          = cents(item['MOVIMENTOSITENS_TOTAL'])          / 100;
                    item['SALDOS_IPI']                     = grams(item['SALDOS_IPI'])                     / 1000;
                    item['SALDOS_ICMSLC']                  = grams(item['SALDOS_ICMSLC'])                  / 1000;
                    item['SALDOS_ICMS01']                  = grams(item['SALDOS_ICMS01'])                  / 1000;
                    item['SALDOS_ICMS02']                  = grams(item['SALDOS_ICMS02'])                  / 1000;
                    item['SALDOS_BASELC']                  = cents(item['SALDOS_BASELC'])                  / 100;
                    item['SALDOS_BASE01']                  = cents(item['SALDOS_BASE01'])                  / 100;
                    item['SALDOS_BASE02']                  = cents(item['SALDOS_BASE02'])                  / 100;
                    item['SALDOS_PRAZO']                   = cents(item['SALDOS_PRAZO'])                   / 100;
                    item['SALDOS_PRECO']                   = cents(item['SALDOS_PRECO'])                   / 100;
                    item['SALDOS_PRECOMINIMO']             = cents(item['SALDOS_PRECOMINIMO'])             / 100;
                    item['SALDOS_RESERVADO']               = cents(item['SALDOS_RESERVADO'])               / 100;                    
                    item['VALOR_PROMOCAO']                 = cents(item['VALOR_PROMOCAO'])                 / 100;
                    item['SALDOS_DISPONIVEL']              = cents(item['SALDOS_DISPONIVEL'])              / 100;
                    item['SALDOS_DEPOSITO']                = cents(item['SALDOS_DEPOSITO'])                / 100;
                    item['SALDOS_ALIQUOTASUBST']           = cents(item['SALDOS_ALIQUOTASUBST'])           / 100;
                    item['NCMS_ALIQUOTANACIONAL']          = grams(item['NCMS_ALIQUOTANACIONAL'])          / 1000;
                    item['NCMS_ALIQUOTAESTADUAL']          = grams(item['NCMS_ALIQUOTAESTADUAL'])          / 1000;
                    item['NCMS_ALIQUOTAIMPORTADO']         = grams(item['NCMS_ALIQUOTAIMPORTADO'])         / 1000;
                    item['NCMS_ALIQUOTAMUNICIPAL']         = grams(item['NCMS_ALIQUOTAMUNICIPAL'])         / 1000;
                    item['NCMS_ALIQUOTAPIS']               = grams(item['NCMS_ALIQUOTAPIS'])               / 1000;
                    item['NCMS_ALIQUOTACOFINS']            = grams(item['NCMS_ALIQUOTACOFINS'])            / 1000;
                    item['NCMS_ALIQUOTAFCP']               = grams(item['NCMS_ALIQUOTAFCP'])               / 1000;
                    item['NCMS_STATUS']                    = item['NCMS_STATUS'];
                    item['NCMS_NCM']                       = item['NCMS_NCM'];
                    item['NCMS_CSTPIS']                    = item['NCMS_CSTPIS'];
                    item['NCMS_CSTCOFINS']                 = item['NCMS_CSTCOFINS'];
                    item['NCMS_DIFAL']                     = item['NCMS_DIFAL'];
                    item['NCMS_CEST']                      = item['NCMS_CEST'];
                    return item;
                })                
        };

        const queryCalculo = await SamosUtils.Request.nodeApi({
            url: `/docsfiscais/calculoimposto`,
            method: 'POST',
            data: data
        });
        
        model.set(queryCalculo.results[0]);

    },

    calcularST: async function(form) {
        const ctrl  = form.getController();
        const model = ctrl.getRecord();
        
        if(model.get('CIDADES_ESTADO') == configs.getPermissao()['CIDADES_ESTADO']) {
            return;
        }

        ctrl.colocarFilhosNoModel(model, false);

        const itens = model.get('MOVIMENTOS_ITENS');
        
        let baseST = 0;
        let valorST = 0;

        const estados12porcento = 'PR#SC#RJ#MG#RS';
        
        async function getAliquotaIvaCliente(uf, ncm) {
            if(uf == 'MS') {
                const aliquotas = {
                    '50'   : '39173900#39269090#40082100#73071920#73181500#73181600#73182900#73269090#84254100#84099969#84138100#84219910#84254200#84818099#87087090#87089990#90269090',
                    '38'   : '82041100#82041200#82052000#82055900#82057000#82079000#84671190#84671900#84672992#84813000#85044010#90303329',
                    '47.26': '84243090'
                }

                let aliquota = 50;

                Object.values(aliquotas).forEach((ncms, index) => {
                    if(ncms.split('#').find(str => str == ncm)) {
                        aliquota = Object.keys(aliquotas)[index];
                    }
                });

                return aliquota;
                
            } else {
                const STRUF = 'RS59,60#MS50,00#PR71,78#MG71,78#RJ71,78#SC71,78#AC571,78#AL71,78#AM71,78#AP71,78#BA71,78#CE40,00#DF71,78#ES71,78#MA71,78#PA71,78#PB71,78#PE71,78#PI40,00#RN59,60#RO35,00#RR71,78#SE71,78#TO71,78';
                const aliquota = STRUF.split('#').find(str => str.slice(0, 2) == uf);
                
                return !aliquota ? 0 : aliquota.slice(2, 7).replace(',', '.');
            }
        }
        
        function calcularAliquotaICMS(produto) {
            if (produto['SALDOS_CSTOUTROS'] == '999') {
                return 0;
            } else if(model.get('PESSOAS_TIPO') == 'C'){//Revenda
                return '060#500'.match(produto['SALDOS_CSTOUTROS']) ? 0 : 18;
            } else if(estados12porcento.match(model.get('CIDADES_ESTADO'))) {
                return !model.get('PESSOAS_INSCRICAO') ? 18 : 12;
            } else {
                return !model.get('PESSOAS_INSCRICAO') ? 18 : 7;
            }
        }
    
        if(model.get('PESSOAS_TIPO') != 'C') {//Se não for Revenda...
            for (let item of itens) {
                const aliquotaIva = await getAliquotaIvaCliente(model.get('CIDADES_ESTADO'), item['NCMS_NCM']);

                if (aliquotaIva > 0) {
                    const valorLiquido = cents(item['TOTAL_LIQUIDO']);
                    const valorDespesa = cents(item['MOVIMENTOSITENS_DESPESAS']);
                    
                    const percBaseICMS = item['SALDOS_CSTOUTROS'] == '999' ? 0 : 100;
                    const aliquotaICMS = calcularAliquotaICMS(item);
    
                    const baseICMS  = Math.round(((valorLiquido + valorDespesa) / 100) * percBaseICMS);
                    const valorICMS = Math.round((baseICMS / 100) * aliquotaICMS);
    
                    const baseSTItem = valorLiquido + Math.round((valorLiquido / 100) * aliquotaIva);
    
                    let aliquotaST;
    
                    if('MG#PR#SP'.match(model.get('CIDADES_ESTADO'))) {
                        aliquotaST = 18;
                    } else if('AC#AL#AM#AP#BA#CE#DF#ES#GO#MA#MT#MS#PA#PB#PE#PI#RN#RS#RO#RR#SC#SE#TO'.match(model.get('CIDADES_ESTADO'))){
                        aliquotaST = 17;
                    } else if('RJ'.match(model.get('CIDADES_ESTADO'))) {
                        aliquotaST = 19;
                    } else {
                        aliquotaST = 18;
                    }
    
                    baseST  += baseSTItem;
                    valorST += Math.round((baseSTItem / 100) * aliquotaST) - valorICMS;
                }
            }
        }
    
        const obs = model.get('MOVIMENTOS_OBSERVACOES') || '||||||||';

        let preenchido = false;

        const newObs = obs.split('|').map(linha => {
            if(!preenchido && (!linha || linha.match(/^BASEST:/))) {
                preenchido = true;
                linha = baseST > 0 ? `BASEST: (${Ext.util.Format.maskRenderer('#9.990,00', true)(baseST  / 100)}) - VALORST: (${Ext.util.Format.maskRenderer('#9.990,00', true)(valorST / 100)})` : ''
            }
            return linha;
        }).join('|');

        model.set('MOVIMENTOS_OBSERVACOES', newObs);

        return {
            baseST : baseST  / 100,
            valorST: valorST / 100
        }
    }
});
