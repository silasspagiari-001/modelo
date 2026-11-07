Ext.define('SamosAdmin.movimentos.ordensproducao.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensproducao',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') || 
                       get('model.PRODUCOES_STATUS') != 'A';
            },

            hideExcluir: function(get) {
                return get('updating') || 
                       get('model.PRODUCOES_STATUS') != 'A';
            },

            hideLoteProducao: function(get) {
                return configs.getMovimentos().hideLoteProducao || false;
            },

            hideFinalizar: function(get) {
                return get('updating') ||
                       get('model.PRODUCOES_STATUS') != 'A';
            },

            hideReabrir: function(get) {
                return get('updating') ||
                       get('model.PRODUCOES_STATUS') != 'F';
            },

            hideCancelamento: function(get) {
                return get('updating') ||
                       get('model.PRODUCOES_STATUS') != 'A';
            },

            hideOpcoes: function(get) {
                return get('hideFinalizar') &&
                       get('hideReabrir')   &&
                       get('hideCancelamento');
            },

            hideImprimir: function(get) {
                return get('updating')  ||
                       get('model.PRODUCOES_STATUS') != 'F'
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },

/*            hideFechar: function (get) {
                return true
            },
            */

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('model.PRODUCOES_STATUS') == 'C') {
                    text  = 'Cancelado';
                    color = 'rgb(255,0,0,0.3)';
                } else {
                    text  = 'Ordem de Produção';
                    color = 'rgb(0,0,0,0.3)';
                }

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
            model: 'SamosAdmin.movimentos.ordensproducao.ModelProdutos',
            autoLoad: true,
            data: '{model.PRODUCOES_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
