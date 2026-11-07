Ext.define('SamosAdmin.movimentos.ordensacomtf.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensacomtf',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            isConsultaKardex: false          
        });

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')    || 
                       get('isFinalizado') ||
                       get('isFaturado');
            },

            hideExcluir: function(get) {
                return get('updating')    || 
                       get('isFaturado');
            },
           
            hidePagar: function(get){
                return  get('isEmUso')  ||
                        get('updating') || 
                        get('financeiroNulo') ||
                        get('isConsultaKardex')
            },
            
             /*
            hidePagamento: function (get) {
               
                return  get('isEmUso')  ||
                        get('updating') || 
                        get('financeiroNulo') ||
                        get('isConsultaKardex') ||
                        !get('pagarObrigatorio') ||
                        (
                            !get('isNotaEntrada') &&
                            !get('isRequisicaoEntrada')
                        );

                get('hideExcluir');
                return false;
            },*/

            /*
            hideCaixa: function(get){
                return false;
            },*/

            pagarObrigatorio: function(get){
                return ((get('model.OPERACOES_FINANCEIRO') == 'P' || (get('isRequisicao') && get('model.OPERACOES_FINANCEIRO') != 'N')) && get('model.ORDENS_STATUS') == 'N');
            },

            isEmUso: function(get) {
                return  get('readOnly') && (
                            get('model.ORDENS_STATUS') == 'B' ||
                            get('model.ORDENS_STATUS') == 'M' ||
                            get('model.ORDENS_STATUS') == 'E' 
                        );
            },

            financeiroNulo: function(get){
                return get('model.OPERACOES_FINANCEIRO') == 'N';
            },

            hideFinalizar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('isFaturado') ||
                       get('isFinalizado') ||
                       get('updating');
            },

            hideReativar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       (!get('isFaturado') && !get('isFinalizado')) ||
                       get('updating');
            },

            hideImprimir: function (get) {
                return get('updating');
            },

            hideServicos: function (get) {
                return get('updating');
            },

            hideGarantia: function (get) {
                return get('updating');
            },

            hideOpcoes: function (get) {
                return (
                            get('hideReativar')     &&
                            get('hideFinalizar')
                       );
            },

            isFinalizado: function(get) {
                return get('model.ORDENS_STATUS') == 'E';
            },

            isFaturado: function(get) {
                return get('model.ORDENS_STATUS') == 'F';
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },

            isExecutado: function(get) {
                return get('model.ORDENS_STATUS') == 'E';
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
            model: 'SamosAdmin.movimentos.ordensacomtf.ModelProdutos',
            autoLoad: true,
            data: '{model.ORDENS_PRODUTOSITENS}',
            proxy: {
                type: 'memory'
            }
        },

        servicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordensacomtf.ModelServicos',
            autoLoad: true,
            data: '{model.ORDENS_SERVICOSITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
