Ext.define('SamosAdmin.movimentos.movimento.form.casco.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentoscasco',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') ||
                      !formMovimento.getViewModel().get('readOnly');
            },

            disableConfirmar: function(get) {
                return false;
            },

            disableGravar: function(get) {
                return false;
            }
        });        
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelItens',
            autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }    
});
