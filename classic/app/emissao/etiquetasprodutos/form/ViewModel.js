Ext.define('SamosAdmin.emissao.etiquetasprodutos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formemissaoetiquetas',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') ||
                       get('model.ETIQUETAS_STATUS') == 'I'
            },

            hideProdutos: function(get) {
                return !get('updating');
            },

            hideImprimir: function(get) {
                return get('updating') ||
                       configs.getClientName() == 'prudenmoveis' ||
                       get('model.ETIQUETAS_STATUS') == 'I'
            },

            hideEmitir: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'prudenmoveis'
            },

            hideCancelarImpressao: function(get) {
                return get('updating') ||
                       get('model.ETIQUETAS_STATUS') != 'I'
            },

            tipoAplicacao: function (get) {
                return (get('model.TIPO') || '').toUpperCase() == 'APLICACAO';
            }
        });
    },

    stores: {
        produtos: {
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
