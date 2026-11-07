Ext.define('SamosAdmin.movimentos.movimento.form.entregamoveis.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosentregamoveis',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                const vmMovimento = Ext.$('formmovimentos')[0].getViewModel();

                return get('updating') ||
                    (
                        parseInt(get('model.ROMANEIOSENTREGA_NUMERO')) > 0 &&
                        parseInt(get('model.ROMANEIOSMONTAGEM_NUMERO')) > 0   
                    ) || 
                    (
                        vmMovimento.get('isOrcamento') &&
                        vmMovimento.get('model.MOVIMENTOS_SERIEORIGEM') == 'PED' &&
                        vmMovimento.get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                        vmMovimento.get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                    );
            },

            hideImprimir: function(get) {
                const vmMovimento = Ext.$('formmovimentos')[0].getViewModel();                
                return configs.getClientName() != 'prudenmoveis' ||
                       vmMovimento.get('isOrcamento');
            },

            hideConfirmar: function(get) {
                return get('hideFechar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') ||
                      !formMovimento.getViewModel().get('readOnly');
            },

            disableImprimir: function(get) {
                return false;
            },

            disableConfirmar: function(get) {
                return false;
            },

            disableGravar: function(get) {
                return false;
            },

            temNumeroEntrega: function(get) {
                return !!parseInt(get('model.ROMANEIOSENTREGA_NUMERO'));
            },

            temNumeroMontagem: function(get) {
                return !!parseInt(get('model.ROMANEIOSMONTAGEM_NUMERO'));
            }
        });
    }
});
