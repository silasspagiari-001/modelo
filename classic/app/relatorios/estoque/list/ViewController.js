Ext.define('SamosAdmin.relatorios.estoque.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosestoquelist',

    onImprimirClick: function (btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');
                var vm = this.getViewModel();

                SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/empresas`, 
                    method: 'GET',
                    data: {
                        empresacnpj: configs.getEmpresa().cnpj,
                        inicial: vm.get('valueInicio'),
                        final: vm.get('valueFinal'),
                        ordem: vm.get('valueOrdem'),
                        status: vm.get('valueStatus')                    
                    }                                
                })
                .done(res => {
                    SamosUtils.Pdf.exibir({
                        local: 'window',
                        caminho: res.results[0]['name'], 
                        serverType: 'nodejs'
                    });
                })
                .fail(err => {
                    Ext.Note('error', 'Erro no servidor');
                    console.error(err);
                })
                .always(() => this.getView().stopGauge());
            }
        });
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }

});
