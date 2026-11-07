Ext.define('SamosAdminModern.notificacao.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.notificacaoform',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            dataAvisar: momentServer().add(1, 'day').format('YYYY-MM-DD'),
            horaAvisar: momentServer().format('HH:mm')
        });
    }
});
