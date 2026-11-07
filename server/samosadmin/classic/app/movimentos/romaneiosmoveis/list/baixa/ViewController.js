Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.baixa.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.romaneiosmoveisbaixa',

    onBuscarClick: function() {
        if(this.getViewModel().get('valueIdPessoa')){
            this.callParent(arguments);
        } else {
            const nomeDocumento = this.getView().up('romaneiosmoveis').title;

            if(nomeDocumento == 'Romaneio Entrega') {
                Ext.Note('warning', 'Selecione o transportador');
            } else {
                Ext.Note('warning', 'Selecione o montador');
            }
            this.lookup('pessoa').focus(true);
        }
    },

    getServerUrl: function() {
        return 'server/romaneiosmoveis';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const nomeDocumento = this.getView().up('romaneiosmoveis').title;

        return {
            empresa      : '',
            documento    : '',
            nomedocumento: nomeDocumento,
            numero       : vm.get('valueNumero'),
            pessoa       : vm.get('valueIdPessoa'),
            inicio       : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final        : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            ordem        : vm.get('valueOrdem'),
            status       : vm.get('valueStatus')
        };
    },

    onBaixarClick: function() {
        const romaneios = this.getView().down('grid').getSelectionModel().getSelection();

        if(!romaneios[0]){
            Ext.Note('warning', 'Selecione o(s) romaneio(s)');
        } else {
            const view = Ext.create({
                xtype: 'romaneiosmoveisbaixaform'
            });
    
            view.romaneios = romaneios;
        }
    }
});
