Ext.define('SamosAdmin.consultas.pendencias.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.pendenciassearch',

    initViewModel: function() {
        this.callParent(arguments);
        setTimeout(() => this.onBuscarClick(), 500);
    },

    onBuscarClick: function(btn, e) {
        const vm = this.getViewModel();

        try {
            const txtInicio = this.lookup('inicio');
            const txtFinal = this.lookup('final');
    
            if(!vm.get('valueInicio')) {
                Ext.defer(txtInicio.focus, 100, txtInicio, [true]);
                throw 'Selecione a data';
            }
            
            if(!vm.get('valueFinal')) {
                Ext.defer(txtFinal.focus, 100, txtFinal, [true]);
                throw 'Selecione a data';
            }
            
            this.callParent(arguments);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Não foi possível buscar')
        }
    },

    getServerUrl: function() {
        return 'server/consultas/pendencias';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            pessoa : vm.get('valueIdPessoa'),
            produto: vm.get('valueIdProduto'),
            acao   : 'VN',
            inicio : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final  : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    },

    afterLoadMainStore: function(store, records, success, operation) {
        const lastModel = records[records.length -1];
        const totalGeral = lastModel ? lastModel.get('MOVIMENTOSITENS_TOTALGERAL') : 0;
        const totalFormatado = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(totalGeral);

        this.getViewModel().set('totalGeral', totalFormatado);
    },

    onItemDblClick: Ext.emptyFn
});
