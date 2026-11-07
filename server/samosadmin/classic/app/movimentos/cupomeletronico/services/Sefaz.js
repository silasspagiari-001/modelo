Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Sefaz', {
    alternateClassName: 'CupomEletronico.services.Sefaz',
    singleton: true,

    criarJanela: function() {
        const form = Ext.$('formcupomeletronico')[0];
        const vm = form.getViewModel();
        const viewSefaz = Ext.create({
            xtype: 'formcupomeletronicosefaz'
        });
        
        viewSefaz.getViewModel().set({
            model:        vm.get('model'),
            hasProtocolo: vm.get('hasProtocolo'),
            readOnly:     true
        });

        form.add(viewSefaz);
    }
});