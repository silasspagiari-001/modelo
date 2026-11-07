Ext.define('SamosAdmin.movimentos.ordenssky.list.recebidas.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.ordensskyrecebidas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem    : '0',
            valueConteudo : ''
        });
    }
});
