Ext.define('SamosAdmin.relatorios.inventario.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosinventariolist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/inventario`,
                        method: 'GET',
                        timeout: 360000,
                        query: {
                            empresa     : configs.getEmpresa().id,
                            empresacnpj : configs.getEmpresa().cnpj,
                            tipo        : vm.get('valueTipo'),
                            preco       : vm.get('valuePreco'),
                            grupoinicial: vm.get('valueIdGrupoi'),
                            grupofinal  : vm.get('valueIdGrupof'),
                            tiposaldo   : vm.get('valueTiposaldo'),
                            valueacrescimo  : vm.get('valueAcresDecrescimo'),
                            valuepercentual : vm.get('percentualAcrescimoDecrescimo'),
                            inicio      : momentTz(this.lookup('database').getValue()).format('YYYY-MM-DD')
                        }                                
                    });

                    await SamosUtils.Utils.sleep(6000);

                    if(queryPdf.results[0]) {
                        SamosUtils.Pdf.exibir({
                            local: 'window',
                            caminho: queryPdf.results[0]['name'], 
                            serverType: 'nodejs'
                        });
                    } else {
                        Ext.Note('warning', 'Nenhum registro')
                    }
                } catch(error) {
                    Ext.Note('error', 'Erro no servidor');
                    console.error(error);
                }
                this.getView().stopGauge()
            }
        });
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
