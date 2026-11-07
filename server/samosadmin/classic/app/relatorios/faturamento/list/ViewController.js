Ext.define('SamosAdmin.relatorios.faturamento.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosfaturamentolist',

    onImprimirClick: function (btn, e) {

        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                const vm = this.getViewModel();
                const clientName = configs.getClientName();

                SamosUtils.Request.nodeApi({
                    url: `/relatorios/${clientName}/faturamento`,
                    method: 'GET',
                    data: {
                        empresa    : vm.get('valueIdEmpresa'),
                        empresacnpj: configs.getEmpresa().cnpj,
                        tipo       : vm.get('valueTipo'),
                        inicio     : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
                        final      : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
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
