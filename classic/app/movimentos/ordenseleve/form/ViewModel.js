Ext.define('SamosAdmin.movimentos.ordenseleve.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordenseleve',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            isOSConsumidor: false
        });

        this.setFormulas({

            hideAlterar: function(get) {
                return get('updating')    || 
                       get('isFinalizada') || 
                       get('isFaturada');
            },

            hideExcluir: function(get) {
                return get('updating')    || 
                       get('isFinalizada') || 
                       get('isFaturada');
            },
           
            hideFinalizar: function (get) {
                return get('updating')    ||
                       get('isFinalizada') ||
                       get('isFaturada');
            },

            hideEspelhoNFSe: function (get) {
                return get('updating')    ||
                       !get('isFaturada');
            },

            hideBaixar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating') || 
                       !get('isFinalizada');
            },

            hideReativar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating') ||
                       (!get('isFaturada') &&                        
                        !get('isFinalizada'));
            },

            hideImprimir: function (get) {
                return get('updating');
            },

            isFinalizada: function(get) {
                return get('model.ORDENS_STATUS') == 'E';
            },

            isFaturada: function(get) {
                return get('model.ORDENS_STATUS') == 'F';
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },
            
            isCancelada: function(get) {
                return get('model.ORDENS_STATUS') == 'C';
            },

            permitidoAlterarPreco: function(get) {
                return  get('model.DOCUMENTOS_ALTERAPRECO') == 'T';
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelada')) {
                    text  = 'Cancelada';
                    color = 'rgb(255,0,0,0.3)';
                } else {
                    text  = 'Ordem de Serviço';
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

        servicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenseleve.ModelServicos',
            autoLoad: true,
            data: '{model.ORDENS_SERVICOSITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
