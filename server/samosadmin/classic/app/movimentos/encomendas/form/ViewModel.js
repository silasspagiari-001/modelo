Ext.define('SamosAdmin.movimentos.encomendas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formencomendas',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating');
            },

            hideExcluir: function(get) {
                return get('updating');
            },

            hideImprimir: function (get) {
                return get('updating');
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            marcaDaguaStyle: function(get) {
                const text  = this.getView().title;
                const color = 'rgb(0,0,0,0.3)';

                this.set('marcaDaguaText', text.toUpperCase());

                return {
                    padding: '0px 0px 0px 0px',
                    textAlign: 'center',
                    fontSize: '25px',
                    fontFamily: 'monospace',
                    letterSpacing: '3px',
                    color: color,
                    height: '0px',
                    lineHeight: '38px',
                    fontWeight: 'bold'
                };
            }
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.encomendas.ModelItens',
            autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
