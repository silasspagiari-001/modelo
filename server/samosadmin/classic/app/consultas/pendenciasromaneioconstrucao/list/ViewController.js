Ext.define('SamosAdmin.consultas.pendenciasromaneioconstrucao.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.pendenciasromaneioconstrucao',

    afterLoadMainStore: function (store, records, success, operation) {
        if(records.length == 0){
           Ext.Note('warning', 'Não há pendências para esse cliente');
       }
    },

    onBuscarClick: function(btn, e) {
        const txtPessoa = this.lookup('pessoa');
        const txtInicio = this.lookup('inicio');
        const txtFinal = this.lookup('final');

        if(!this.getViewModel().get('valueIdPessoa')) {
            Ext.Note('warning', 'Selecione a pessoa');
            Ext.defer(txtPessoa.focus, 100, txtPessoa, [true]);
        } else if(!this.getViewModel().get('valueInicio')) {
            Ext.Note('warning', 'Selecione a data');
            Ext.defer(txtInicio.focus, 100, txtInicio, [true]);
        } else if(!this.getViewModel().get('valueFinal')) {
            Ext.Note('warning', 'Selecione a data');
            Ext.defer(txtFinal.focus, 100, txtFinal, [true]);
        } else {
            this.callParent(arguments);
        }
    },

    getServerUrl: function() {
        return 'server/consultas/pendenciasromaneioconstrucao';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            pessoa : vm.get('valueIdPessoa'),
            produto: vm.get('valueIdProduto'),
            inicio : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final  : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    }
});
