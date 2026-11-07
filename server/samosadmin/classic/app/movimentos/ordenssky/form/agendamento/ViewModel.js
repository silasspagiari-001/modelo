Ext.define('SamosAdmin.movimentos.ordenssky.form.agendamento.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ordensskyformagendamento',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            agendamento: {},
            hideGravar: false,
            hideSair: false,
        });

        this.setFormulas({
            readOnly: function(get) {
                return !get('isAberta');
            },

            hideAlterarRota: function(get) {
                return !get('isAberta') || !get('isAgendado');
            },

            hideSelecionarRota: function(get) {
                return !get('isAberta') || get('isAgendado');
            },

            hideGravar: function(get) {
                return !get('isAberta');
            },

            isAgendado: function(get) {
                return get('agendamento.ORDENS_ID_ORDENSROTAS');
            }
        });
    }
});
