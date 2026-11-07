Ext.define('SamosAdmin.movimentos.notificacao.search.reagendamento.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.notificacaoreagendamento',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideGravar: false,
            hideSair: false,
            dataAvisar: momentServer().format('YYYY-MM-DD'),
            horaAvisar: momentServer().add(5, 'minutes').format('HH:mm')
        });
    }
});
