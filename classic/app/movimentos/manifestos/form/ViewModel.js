Ext.define('SamosAdmin.movimentos.manifestos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmanifestos',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            isCancelado: function(get) {
                return get('model.MANIFESTOS_STATUS') == 'C';
            },

            isEnviado: function(get) {
                return get('model.MANIFESTOS_STATUS') == 'E';
            },

            isEncerrado: function(get) {
                return get('model.MANIFESTOS_STATUS') == 'F';
            },

            hideSefaz: function (get) {
                return get('updating');
            },

            hasProtocolo: function(get) {
                return !!get('model.MANIFESTOS_PROTOCOLO');
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelado')) {
                    text  = 'Cancelado';
                    color = 'rgb(255,0,0,0.3)';
                } else {
                    text  = this.getView().title;
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
        notas: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.manifestos.ModelItens',
            autoLoad: true,
            data: '{model.MANIFESTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
