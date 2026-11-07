Ext.define('SamosAdmin.atualizacao.portadores.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formportadores',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideExcluir: function(get) {
                return get('updating') || get('model.PORTADORES_ID') == 1;
            },

            isCepUnico: function(get) {
                var cep = get('model.PORTADORES_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

        });
    }
});
