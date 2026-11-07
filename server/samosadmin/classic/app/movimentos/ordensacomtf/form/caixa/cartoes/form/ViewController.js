Ext.define('SamosAdmin.movimentos.ordensacomtf.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.ordensacomtf.form.caixa.ViewController',
    alias: 'controller.formordensacomtfcaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formordensacomtf'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formordensacomtfcaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});
