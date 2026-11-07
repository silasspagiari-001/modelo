Ext.define('SamosAdmin.atualizacao.servicos.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.servicossearch',

    onItemDblClick: function (grid, record) {
        const txt = this.getView().txt;

        if(cents(record.get('SERVICOS_PRECO') <= 0)) {
            Ext.Note('warning', 'Este serviço está sem preço');
            if(!this.getView().isVisible(true)) {
                Ext.defer(txt.focus, 400, txt, [true]);
            }
        } else {
            this.callParent(arguments);
        }
    }

});
