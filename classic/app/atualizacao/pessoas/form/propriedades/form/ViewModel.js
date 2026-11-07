Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formpropriedades',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            cadastroCpfDuplicadoLiberado: false
        });

        this.setFormulas({

            hideGravar: function (get) {
                return get('readOnly');
            },

            hideSair: function (get) {
                return !get('readOnly');
            },

            isCepUnico: function(get) {
                var cep = get('model.PROPRIEDADES_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

        });
    }
});
