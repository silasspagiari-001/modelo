Ext.define('SamosAdmin.atualizacao.prazos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formprazos',

    gerarParcelas: function (numberfield, event, eOpts) {
        const view = this.getView();
        let diasParcelas = "";
        let qtdParcelas = numberfield.getValue();
        let intervalo = view.lookupReference('intervalo').getValue() || 30;

        for (let i = 1; i <= qtdParcelas; i++) {
            diasParcelas = diasParcelas + (i * intervalo);

            if(i < qtdParcelas) {
                diasParcelas = diasParcelas + "#";
            }
        }

        this.getViewModel().set('model.PRAZOS_PARCELAMENTO', diasParcelas);
    }
});
