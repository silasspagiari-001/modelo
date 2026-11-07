Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Impostos', {
    alternateClassName: 'CupomEletronico.services.Impostos',
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

        let imposto = 0
        
        const itens = model.get('MOVIMENTOS_ITENS') || [];

        itens.map(async item => {
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
            
            imposto = (cents(imposto) + cents(item['MOVIMENTOSITENS_IMPOSTO'])) / 100;
        });
        
        model.set({
            'MOVIMENTOS_IMPOSTO': imposto,
            'MOVIMENTOS_ITENS'  : itens
        });
    }
});
