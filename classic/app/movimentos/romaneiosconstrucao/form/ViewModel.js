Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formromaneiosconstrucao',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')    || 
                       get('isEntregue');
            },

            hideExcluir: function(get) {
                return get('updating')    ||
                       get('isEntregue');
            },
           
            hideImprimir: function (get) {
                return get('updating');
            },

            hidePedidos: function (get) {
                return  get('readOnly') || 
                        (get('pedidos.data.items') || []).length > 0;
            },

            hideOpcoes: function (get) {
                return get('hideEnviarEmail') &&
                       get('hideEntregar')    &&
                       get('hideReativar');
            },

            hideEnviarEmail: function (get) {
                return get('updating');
            },

            hideEntregar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating')         || 
                       get('isEntregue');
            },

            hideReativar: function(get) {
                return get('updating')         ||
                       !configs.getUsuario().privilegiado ||
                       !get('hideEntregar');
            },            

            disableFechar: function (get) {
                return get('editionClosed');
            },

            isEntregue: function(get) {
                return get('model.ROMANEIOS_STATUS') == 'E';
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            marcaDaguaStyle: function(get) {
                const text  = 'Romaneio';
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
        pedidos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.romaneiosconstrucao.ModelItens',
            autoLoad: true,
            data: '{model.ROMANEIOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
