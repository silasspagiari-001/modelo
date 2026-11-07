Ext.define('SamosAdmin.movimentos.movimento.form.entregaconstrucao.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosentregaconstrucao',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('movimentoReadOnly') ||
                       !get('isSupervisor') ||
                        get('updating') || 
                        get('model.MOVIMENTOS_SITUACAO') == 0;
            },

            hideSelecionar: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideLoja: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideDeposito: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideImediata: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideRetirar: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideGravar: function(get) {
                return !get('movimentoReadOnly') || 
                       !get('hideAlterar') || 
                       get('model.MOVIMENTOS_SITUACAO') == 0;
            },

            hideConfirmar: function(get) {
                return get('movimentoReadOnly') || !get('hideAlterar');
            },

            hideImprimir: function(get) {
                return !get('movimentoReadOnly') ||
                       !get('isSupervisor') ||
                        get('updating');
            },

            listaEmpresas: function(get) {
                return Ext.$('samosviewport')[0].getViewModel().getStore('permissoes').getData().items.map(item => item.get('EMPRESAS_ID'));
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
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
