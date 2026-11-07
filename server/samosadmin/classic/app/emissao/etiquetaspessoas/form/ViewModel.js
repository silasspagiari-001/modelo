Ext.define('SamosAdmin.emissao.etiquetaspessoas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formemissaoetiquetaspessoas',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') ||
                       get('model.ETIQUETAS_STATUS') == 'I'
            },

            hideImprimir: function(get) {
                return get('updating') ||
                       get('model.ETIQUETAS_STATUS') == 'I'
            },

            hideCancelarImpressao: function(get) {
                return get('updating') ||
                       get('model.ETIQUETAS_STATUS') != 'I'
            }
        });
    },

    stores: {
        pessoas: {
            type: 'nodejsstore',
            model: 'SamosAdmin.emissao.EtiquetaItens',
            autoLoad: true,
            data: '{model.ETIQUETAS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
