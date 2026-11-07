Ext.define('SamosAdmin.movimentos.romaneiosindustria.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formromaneiosindustria',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')    || 
                       get('isExecutado') || 
                       get('isFaturado');
            },

            hideExcluir: function(get) {
                return get('updating')    || 
                       get('isExecutado') || 
                       get('isFaturado');
            },
           
            hideExecutar: function (get) {
                return get('updating')    || 
                       get('isExecutado') || 
                       get('isRetirado') ||
                       get('isFaturado');
            },

            hideReativar: function (get) {
                return get('updating')    || 
                       !configs.getUsuario().privilegiado ||                
                       !get('isExecutado') || 
                       get('isRetirado') ||
                       get('isFaturado');
            },            

            hideImprimir: function (get) {
                return get('updating');
            },

            disableImprimir: function(get) {
                return get('isRomaneioImpresso');
            },

            hidePedidos: function (get) {
                return get('readOnly');
            },

            hideBaixar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating') || 
                       !get('isExecutado');
            },

            disableGravar: function(get) {
                return false;
            },

            isRomaneioImpresso: function(get) {
                return configs.getMovimentos().disableImpressao &&
                      !configs.getUsuario().privilegiado &&
                      parseInt(get('model.ROMANEIOS_CONTADOR')) > 0
            },

            isExecutado: function(get) {
                return get('model.ROMANEIOS_STATUS') == 'E';
            },

            isFaturado: function(get) {
                return get('model.ROMANEIOS_STATUS') == 'F';
            },

            isRetirado: function(get) {
                return get('model.ROMANEIOS_STATUS') == 'R';
            },

            isMontagem: function(get) {
                const result = get('listName').match(/Montagem/);
                return result;
            },

            marcaDaguaStyle: function(get) {
                const text  = get('isMontagem') ? 'Romaneio Montagem' : 'Romaneio Entrega';
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
            model: 'SamosAdmin.movimentos.romaneiosindustria.ModelItens',
            autoLoad: true,
            data: '{model.ROMANEIOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
