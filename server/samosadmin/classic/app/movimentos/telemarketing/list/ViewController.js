Ext.define('SamosAdmin.movimentos.telemarketing.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.telemarketing',

    onBuscarClick: async function (btn, event) {

        if(this.getViewModel().get('valueOrdem') == 3 && isNaN(parseInt(this.getViewModel().get('valueMes')))) {        
            Ext.Note('warning', 'Selecione o mês');
        } else {
            this.callParent(arguments);
        }
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            vendedor: vm.get('valueIdUsuario'),
            pessoa: vm.get('valueIdPessoa'),
            cidade: vm.get('valueIdCidade'),
            mes   : vm.get('valueMes'),
            inicio: momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem : vm.get('valueOrdem')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();
    
            const janelaItens = Ext.create({
                xtype: 'formtelemarketing',
                title: 'Pessoa:  ' + record.get('PESSOAS_NOME') + ' - ' + record.get('CIDADES_NOME') + '/' + record.get('CIDADES_ESTADO'),
                permissoes: view.getPermissoes()
            });
    
            janelaItens.getViewModel().set({
                model: record
            });
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar o telemarketing');
        }
        
        view.stopGauge();
    }

});
