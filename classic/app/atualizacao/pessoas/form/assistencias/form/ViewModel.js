Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formassistencias',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            cadastroCpfDuplicadoLiberado: false
        });

        this.setFormulas({


            hideExcluir: function(get) {
                return !configs.getUsuario().privilegiado;
            },

            hideGravar: function (get) {
                return get('readOnly');
            },

            hideSair: function (get) {
                return !get('readOnly');
            }
        });
    }
});
