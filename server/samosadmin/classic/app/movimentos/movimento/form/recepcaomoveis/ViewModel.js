Ext.define('SamosAdmin.movimentos.movimento.form.recepcaomoveis.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosrecepcaomoveis',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({

            hideSelecionar: function(get) {
                return get('isRecebido');
            },

            hideRecebido: function(get) { 
                return get('isRecebido');
            },

            hidePendente: function(get) {
                return get('isRecebido');
            },

            hideConfirmar: function(get) {
                return get('isRecebido');
            },

            isRecebido: function(get) {
                return get('model.MOVIMENTOS_SITUACAO') == 'R';
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