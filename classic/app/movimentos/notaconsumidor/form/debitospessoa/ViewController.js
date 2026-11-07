Ext.define('SamosAdmin.movimentos.notaconsumidor.form.debitospessoa.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formnotaconsumidordebitospessoa',

    onLiberarClick: function(btn, e) {
        const nivel = 1;
        const formMovimento = this.getView().up('formnotaconsumidor');
        const idPessoa  = formMovimento.model.get('MOVIMENTOS_ID_PESSOAS');
        const gridItems = formMovimento.lookup('produtos');

        Ext.create({ xtype: 'samoswidgets-senhanivel' })
            .iniciar(nivel)
            .then(() => {
                this.getView().destroy();
                Ext.defer(gridItems.focarNovoItem, 200, gridItems);

                SamosUtils.Request.nodeApi({
                    url: `/processos/gerarlog`,
                    method: 'POST',
                    query: {
                        senhaNivel: true,
                        log: `Venda cliente c/ débito ID:${idPessoa}`
                    }
                });
            })
            .catch(() => this.onSairClick());
        
    },

    onSairClick: function() {
        this.getView().up('formnotaconsumidor').getController().cancelar();
        this.callParent(arguments);
    }
});
