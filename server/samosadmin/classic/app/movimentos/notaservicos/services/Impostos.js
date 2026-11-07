Ext.define('SamosAdmin.movimentos.notaservicos.services.Impostos', {
    alternateClassName: 'NotaServicos.services.Impostos',
    singleton: true,

    calcular: async function(form) {
        try {
            await this.calcularImpostos(form);
        } catch(error) {
            console.error(error);
            throw 'Falha ao calcular imposto';
        }
    },

    calcularImpostos: async function(form) {

        const ctrl  = form.getController();
        const model = ctrl.getRecord();

        ctrl.colocarFilhosNoModel(model, false);
    
        await SamosUtils.Utils.sleep(1000);
        
        let valorServicos  = cents(model.get('ORDENS_SERVICOS'));
        let valorDescontos = cents(model.get('ORDENS_DESCONTOS'));
        let valorRetencoes = cents(model.get('ORDENS_VALORRETENCOES'));
        
        let perBaseINSS   = cents(model.get('PESSOAS_CREDITO'));
        let aliqISS       = cents(model.get('ORDENS_ALIQUOTAISS'));
        let aliqINSS      = cents(model.get('ORDENS_ALIQUOTAINSS'));
        let aliqIRRF      = cents(model.get('ORDENS_ALIQUOTAIRRF'));

        let baseINSS =  ((valorServicos / 100) * perBaseINSS);
        let valorISS  = 0;
        let valorINSS = 0;
        let valorIRRF = 0;
        let valorTotal = 0;

        if(aliqISS > 0) {
            valorISS = (((valorServicos / 100) * aliqISS) / 10000);
        }

        if(aliqINSS > 0) {
            valorINSS = (((baseINSS / 100) * aliqINSS) / 1000000);
        }

        if(aliqIRRF > 0) {
            valorIRRF = Math.round(valorOrdem * 0.01 * aliqIRRF  / 10000);
        }

        if(model.get('ORDENS_ISSRETIDO')== 'R') {  // Imposto retido
            valorTotal = (valorServicos - valorDescontos - valorISS - valorINSS - valorRetencoes) / 100;
        } else {
            valorTotal = (valorServicos - valorDescontos) / 100;
        }

        let obsOriginal = model.get('ORDENS_OBSERVACOES').split('|');

        if(configs.getClientName() == 'eleve') {
            let impPerINSS = model.get('PESSOAS_CREDITO') == 50 ? '' : '(' + model.get('PESSOAS_CREDITO').toString() + ' %) ';

            if((obsOriginal[0] || '').match(/INSS/)) {
                obsOriginal[0] = '*** BASE DE CÁLCULO INSS ' + impPerINSS + Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00 ***').mask((baseINSS/100000000));
            } else {
                obsOriginal.unshift('*** BASE DE CÁLCULO INSS ' + impPerINSS + Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00 ***').mask((baseINSS/100000000)));
            }
    
            if((obsOriginal[1] || '').match(/CNO/) && (model.get('PESSOAS_PAGINA') || '').length > 0) {
                obsOriginal[1] = '***CNO: ' + model.get('PESSOAS_PAGINA') + '***';
            } else {
                if((model.get('PESSOAS_PAGINA') || '').length > 0) {
                    obsOriginal.unshift('***CNO: ' + model.get('PESSOAS_PAGINA') + '***');
                }
            }    
        }

        let obsAjustada = obsOriginal.join('|');

        if(configs.getClientName() != 'prudenart') {
            model.set({            
                'ORDENS_VALORISS'  : valorISS,
                'ORDENS_VALORINSS' : valorINSS,
                'ORDENS_VALORIRRF' : valorIRRF,
                'ORDENS_TOTAL'     : valorTotal,
                'ORDENS_OBSERVACOES': obsAjustada
            });    
        }
    }
});
