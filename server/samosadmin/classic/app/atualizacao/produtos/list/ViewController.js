Ext.define('SamosAdmin.atualizacao.produtos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.produtos',

    onKeyDownCamposToolbar: function (txt, event) {
        if(SamosUtils.Events.isF2(event)) {
            const view = Ext.create({ 
                xtype: 'gridajudas'
            });
    
            this.getView().add(view);
        } else {
            this.callParent(arguments);
        }
    },

    afterLoadMainStore: function(store, records) {
        var grid = this.getView().down('grid');

        this.callParent(arguments);

        (records || []).forEach(record => {
            Ext.Object.merge(record.data, record.get('SALDOS')[0]);
            delete record.data['SALDOS'];
        });

        grid.reconfigure(grid.getStore());
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            empresa : configs.getEmpresa().id,
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus'),
            tipopreco: configs.getMovimentos().tipoPreco
        };
    }
});
