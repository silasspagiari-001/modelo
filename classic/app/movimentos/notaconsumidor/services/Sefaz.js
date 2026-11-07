Ext.define('SamosAdmin.movimentos.notaconsumidor.services.Sefaz', {
    alternateClassName: 'NotaConsumidor.services.Sefaz',
    singleton: true,

    criarJanela: function() {
        const form = Ext.$('formnotaconsumidor')[0];
        const vm = form.getViewModel();
        const viewSefaz = Ext.create({
            xtype: 'formnotaconsumidorsefaz'
        });
        
        viewSefaz.getViewModel().set({
            model:        vm.get('model'),
            hasProtocolo: vm.get('hasProtocolo'),
            readOnly:     true
        });

        form.add(viewSefaz);
    }
});