Ext.define('SamosAdmin.movimentos.movimento.services.Sefaz', {
    alternateClassName: 'Movimento.services.Sefaz',
    singleton: true,

    criarJanela: function(type, tabela) {//usado também em manifestos, conhecimentos e notas de serviços
        const form = Ext.$('form' + type)[0];
        const vm = form.getViewModel();
        const viewSefaz = Ext.create({
            xtype: 'formmovimentossefaz',
            tipo: tabela
        });
        
        viewSefaz.getViewModel().set({
            model:            vm.get('model'),
            isNotaEletronica: vm.get('isNotaEletronica') || false,
            hasProtocolo:     vm.get('hasProtocolo'),
            isDevolvido:      vm.get('isDevolvido'),
            isDenegado:       vm.get('isDenegado'),
            isRecusado:       vm.get('isRecusado'),
            isCancelado:      vm.get('isCancelado'),
            readOnly: true
        });

        form.add(viewSefaz);
    }
});
