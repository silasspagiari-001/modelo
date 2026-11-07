Ext.define('SamosAdmin.relatorios.contascorrentes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioscontascorrenteslist',

    onImprimirClick: function (btn, e) {
        if(configs.getClientName() == 'herbiquimica' && 
           configs.getUsuario().id != 117 &&
           configs.getUsuario().id != 118 &&
           configs.getUsuario().id != 1) {
            return Ext.Note('warning', 'Usuário sem permissão')
        }

        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/contascorrentes`,
                        method: 'GET',
                        query: {
                            empresacnpj : configs.getEmpresa().cnpj,                            
                            inicio      : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final       : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                            idContai    : vm.get('valueIdContai'),
                            idContaf    : vm.get('valueIdContaf'),
                            idAplicacaoi: vm.get('valueIdAplicacaoi'),
                            idAplicacaof: vm.get('valueIdAplicacaof'),
                            tipo        : vm.get('valueTipo'),
                            despesas    : vm.get('valueDespesas')
                        }                                
                    });

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
