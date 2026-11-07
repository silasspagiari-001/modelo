Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.form.mixins.Status', {
    extend: 'SamosModule.form.ViewController',

    onEntregarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente fazer a entrega do romaneio?', btn => {
            if (btn == 'yes') {
                this.entregar();
            }
        });
    },

    entregar: function() {
        var model = this.getRecord();

        this.getView().initGauge('Entregando...');

        model.set({
            'ROMANEIOS_SAIDA': momentServer().format('YYYY-MM-DD'),
            'ROMANEIOS_LOG': SamosUtils.Info.getLog(),
            'ROMANEIOS_STATUS': 'E'
        });

        this.save(model);
    },

    onReativarClick: function(btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente reativar o romaneio?', btn => {
            if (btn == 'yes') {
                this.reativar();
            }
        });
    },

    reativar: function() {
        const model = this.getRecord();

        this.getView().initGauge('Reativando...');

        model.set({
            'ROMANEIOS_SAIDA': '1899-12-30',
            'ROMANEIOS_LOG': SamosUtils.Info.getLog(),            
            'ROMANEIOS_STATUS': 'N'
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
