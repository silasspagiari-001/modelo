Ext.define('SamosAdmin.movimentos.liberacao.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formliberacao',

    constructor: function () {
        this.callParent(arguments);
        
        this.setFormulas({
            hideLiberar: function(get) {
                return get('model.NOTIFICACAO_STATUS') != 'P';
            },
            hideRecusar: function(get) {
                return get('model.NOTIFICACAO_STATUS') != 'P';
            },
            readOnlyUsuarioDestino: function(get) {
                const novo = get('model').phantom
                const status = get('model.NOTIFICACAO_TODOS');
                
                if(status != 'F' && novo) {
                    this.set('model.USUARIOS_NOMEDESTINO', '');
                    this.set('model.USUARIOS_CELULARDESTINO', '');
                    this.set('model.NOTIFICACAO_ID_DESTINO', 0);
                }

                return get('readOnly') || status !== 'F';
            }
        });
    }
});