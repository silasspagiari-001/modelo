Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.cheques.detalhes.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formnotaservicoscaixachequesdetalhes',

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    onConfirmarClick: function (btn, e) {
        this.getView().formItem.setValues(this.getViewModel().get('model').data);
        this.onSairClick();
    },

    onCancelarClick: function(btn, event) {
        const vm = this.getViewModel();
        const previousModel = this.getViewModel().get('previousModel');

        if (previousModel) {
            vm.get('model').set(previousModel);
        }

        this.onSairClick();
    },

    getRecord: function() {
        return this.getViewModel().get('model');
    }
});
