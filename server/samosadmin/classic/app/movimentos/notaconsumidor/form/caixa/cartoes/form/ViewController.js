Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.cartoes.form.ViewController', {
    extend: 'SamosAdmin.movimentos.notaconsumidor.form.caixa.ViewController',
    alias: 'controller.formnotaconsumidorcaixaformcartoes',

    onAlterarClick: function() {
        var formMovimento = this.getView().up('formnotaconsumidor'),
            ctrlMovimento = formMovimento.getController(),
            ctrlCartao = formMovimento.down('formnotaconsumidorcaixacartoes').getController();

        ctrlCartao.onAlterarClick.call(ctrlCartao);
        ctrlMovimento.setReadOnly.call(this, false);
        ctrlMovimento.doDefaultFocus.call(this);
    },

    onConfirmarClick: function (btn, e) {
        Ext.defer(this.getView().destroy, 200, this.getView());
    }
});
