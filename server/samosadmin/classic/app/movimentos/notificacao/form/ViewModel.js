Ext.define('SamosAdmin.movimentos.notificacao.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formnotificacao',    

    constructor: function () {
        this.callParent(arguments);
        
        this.setFormulas({
            hideEnviar: function(get) {
                return get('hideGravar');
            },
            hideReagendar: function(get) {
                return get('updating');
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
            },
            readOnlyParaTodos: function(get) {
                return get('readOnly') || !configs.getUsuario().privilegiado;
            }
        });
    }
});
