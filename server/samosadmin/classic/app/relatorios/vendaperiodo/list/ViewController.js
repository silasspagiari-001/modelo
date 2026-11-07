Ext.define('SamosAdmin.relatorios.vendaperiodo.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendaperiodolist',

    onImprimirClick: function (btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const vm = this.getViewModel();
  
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/vendaperiodo`,
                        method: 'GET',
                        timeout: 360000,
   
                        data: {
                            empresa     : configs.getEmpresa().id,
                            empresacnpj : configs.getEmpresa().cnpj,
                            tipo        : vm.get('valueTipo'),
                            status      : vm.get('valueStatus'),
                            pesinicio   : this.lookup('codpessoai').getValue(),
                            pesfinal    : this.lookup('codpessoaf').getValue(),
                            grpinicio   : this.lookup('codgrupoi').getValue(),
                            grpfinal    : this.lookup('codgrupof').getValue(),
                            proinicio   : this.lookup('codprodutoi').getValue(),
                            profinal    : this.lookup('codprodutof').getValue(),
                            usuinicio   : this.lookup('codusuarioi').getValue(),
                            usufinal    : this.lookup('codusuariof').getValue(),
                            emiinicio   : momentTz(this.lookup('emiinicio').getValue()).format('DD/MM/YYYY'),
                            emifinal    : momentTz(this.lookup('emifinal').getValue()).format('DD/MM/YYYY'),
                            quebra      : vm.get('valueQuebra'),
                            operacao    : vm.get('valueOperacao'),
                            itens       : vm.get('valueItens'),
                            vacina      : vm.get('valueVacina'),
                            tipocliente : vm.get('valueTipoCliente')
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

    //onTesteClick: function() {
    //    Ext.Note('warning', 'Aviso no servidor');
   // }

    

});
