Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentossefazformcartas',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            showXmlView: false
        });

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') || get('hasProtocolo');
            },

            hideExcluir: function(get) {
                return get('updating') || get('hasProtocolo');
            },

            hideEnviar: function(get) {
                return get('updating') || get('hasProtocolo');
            },
            
            hideEmitir: function(get) {
                return get('updating') || !get('hasProtocolo');
            },

            hideEmail: function(get) {
                return get('updating') || !get('hasProtocolo');
            },

            hasProtocolo: function(get) {
                return !!get('model.MOVIMENTOSCARTAS_PROTOCOLO');
            }
        });
    }
});
