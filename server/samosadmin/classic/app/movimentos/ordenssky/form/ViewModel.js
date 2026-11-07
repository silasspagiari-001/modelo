Ext.define('SamosAdmin.movimentos.ordenssky.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordenssky',

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

            hideLocalizacao: function (get) {
                return get('updating');
            },

            hideAgendamento: function (get) {
                return get('updating') || get('isTecnico');
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },

            hideTotais: function(get) {
                return (get('model.ORDENS_TOTAL') || 0) <= 0
            },

            isMaster: function(get) {
                return configs.getUsuario().tipo == '0';
            },

            isTecnico: function(get) {
                return configs.getUsuario().tipo == '2';
            },
            
            colorStatus: function(get) {
                const status = get('model.ORDENS_STATUS');
                
                if (status == '3') {
                    return "color:blue";
                }if (status == '7') {
                    return "color:black";
                } else if (status == '8') {
                    return "color:purple";
                } else if (status == '9' || status == '0') {
                    return "color:red";
                } else {
                    return "color:green";
                }
            },

            isCancelado: function(get) {
                return get('model.ORDENS_STATUS') == '9';
            },

            isRealocado: function(get) {
                return get('model.ORDENS_STATUS') == '0';
            },

            isAgendado: function(get) {
                return get('model.ORDENS_ID_ORDENSROTAS') > 0;
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelado')) {
                    text  = 'Cancelada';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isRealocado')) {
                    text  = 'Realocada';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isAgendado')) {
                    text  = 'Agendada';
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
        instalacoesativas: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelAtivos',
            autoLoad: true,
            data: '{model.ORDENS_ATIVOS}',
            proxy: {
                type: 'memory'
            }
        },

        instalacoesavariados: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelAvariados',
            autoLoad: true,
            data: '{model.ORDENS_AVARIADOS}',
            proxy: {
                type: 'memory'
            }
        },

        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelProdutos',
            autoLoad: true,
            data: '{model.ORDENS_PRODUTOSITENS}',
            proxy: {
                type: 'memory'
            }
        },

        servicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordenssky.ModelServicos',
            autoLoad: true,
            data: '{model.ORDENS_SERVICOSITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
