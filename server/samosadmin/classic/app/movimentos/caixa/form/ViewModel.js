Ext.define('SamosAdmin.movimentos.caixa.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formcaixa',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideVencimento: function (get) {
                return get('model.MOVIMENTOSCAIXA_EXPORTADO') == 'N'
            },

            hideRecibo: function(get) {
                return get('updating');
            },
            
            hideAlterar: function(get) {
                return get('updating')    || 
                       get('isFechado');
            },

            hideExcluir: function(get) {
                return get('updating')    ||
                       get('isFechado');
            },
           
            hideImprimir: function (get) {
                return get('updating');
            },

            hideOpcoes: function (get) {
                return get('hideEnviarEmail') &&
                       get('hideReativar');
            },

            hideEnviarEmail: function (get) {
                return get('updating');
            },

            hideEntregar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       get('updating')         || 
                       get('isFechado');
            },

            hideReativar: function(get) {
                return get('updating')         ||
                       !configs.getUsuario().privilegiado ||
                       !get('hideFechar');
            },
                        
            hideFieldsCaixa: function(get) {
                return true;
            },            

            hideFechamento: function(get) {
                return get('updating')         ||
                       !configs.getUsuario().privilegiado ||
                       get('isFechado');
            },                       
            
            disableFechar: function (get) {
                return get('editionClosed');
            },

            disableGravar: function(get) {
                return false;
            },
            
            isFechado: function(get) {
                return get('model.MOVIMENTOSCAIXA_STATUS') == 'F';
            },

            isCaixa: function(get) {
                return get('listName').match(/Caixa/);
            }          
        });
    }
});
