Ext.define('SamosAdmin.movimentos.notaservicos.services.Sefaz', {
    alternateClassName: 'NotaServicos.services.Sefaz',
    singleton: true,

    criarJanela: function() {
        const form = Ext.$('formnotaservicos')[0];
        const vm = form.getViewModel();
        const viewSefaz = Ext.create({
            xtype: 'formnotaservicossefaz'
        });
        
        viewSefaz.getViewModel().set({
            model:        vm.get('model'),
            hasProtocolo: vm.get('hasProtocolo'),
            readOnly:     true
        });

        form.add(viewSefaz);
    }
});