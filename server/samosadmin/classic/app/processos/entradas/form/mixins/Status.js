Ext.define('SamosAdmin.processos.entradas.form.mixins.Status', {
    extend: 'SamosModule.form.ViewController',

    onReativarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar o caixa?', btn => {
            if (btn == 'yes') {
                this.reativar();
            }
        });
    },
    
    reativar: function() {
        const model = this.getRecord();

        this.getView().initGauge('Reativando...');

        model.set({
            'MOVIMENTOSCAIXA_LOG': SamosUtils.Info.getLog(),            
            'MOVIMENTOSCAIXA_STATUS': 'N'
        });

        this.save(model);
    },

    save: function(model) {
        this.colocarFilhosNoModel(model);
        model.save()
            .then(this.onGravacaoSucesso.bind(this))
            .catch(this.onGravacaoFalha.bind(this)) 
            .finally(this.aposGravar.bind(this));
    }

});
