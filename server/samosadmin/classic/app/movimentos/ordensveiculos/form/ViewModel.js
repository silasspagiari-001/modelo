Ext.define('SamosAdmin.movimentos.ordensveiculos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensveiculos',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            isOSConsumidor: false
        });

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
                       get('isOrcamento') ||
                       get('isFaturado');
            },

            hideBaixar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating') || 
                       !get('isExecutado');
            },

            hideReativar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating') ||
                       (!get('isFaturado') &&                        
                        !get('isExecutado'));
            },

            hideImprimir: function (get) {
                return get('updating');
            },

            isExecutado: function(get) {
                return get('model.ORDENS_STATUS') == 'E';
            },

            isOrcamento: function(get) {
                return get('model.TIPO_OS') == 'O';
            },

            isFaturado: function(get) {
                return get('model.ORDENS_STATUS') == 'F';
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },
            
            isCancelado: function(get) {
                return get('model.ORDENS_STATUS') == 'C';
            },

            permitidoAlterarPreco: function(get) {
                return  get('model.DOCUMENTOS_ALTERAPRECO') == 'T';
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelado')) {
                    text  = 'Cancelado';
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

        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordensveiculos.ModelProdutos',
            autoLoad: true,
            data: '{model.ORDENS_PRODUTOSITENS}',
            proxy: {
                type: 'memory'
            }
        },

        servicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordensveiculos.ModelServicos',
            autoLoad: true,
            data: '{model.ORDENS_SERVICOSITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
