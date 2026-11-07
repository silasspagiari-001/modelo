Ext.define('SamosAdmin.atualizacao.veiculos.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.veiculossearch',

    onItemDblClick: function (grid, record) {
        const txt = this.getView().txt;

        if(cents(record.get('SERVICOS_PRECO') <= 0)) {
            Ext.Note('warning', 'Este veículo está sem valor diária/hora');
            if(!this.getView().isVisible(true)) {
                Ext.defer(txt.focus, 400, txt, [true]);
            }
        } else {
            this.callParent(arguments);
        }
    }

});
