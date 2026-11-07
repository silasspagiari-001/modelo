Ext.define('SamosAdmin.relatorios.financeiro.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosfinanceirolist',

    onRelatorioIRChange: function (chk, newValue) {
        var statusCombo = this.lookupReference('status');

        if (!statusCombo) {
            return;
        }

        if (newValue === true) {
            statusCombo.setValue(1); // Pagos
            // opcional:
            // statusCombo.setReadOnly(true);
        } else {
            statusCombo.setValue(0); // Abertos
            // statusCombo.setReadOnly(false);
        }
    },

    onImprimirClick: function (btn, e) {
        const form = this.getView();
        const vm = this.getViewModel();

  
//        campoData.validate();

/*
       if (vm.get('valueRelirf') == true) {
            var campoData = form.lookupReference('pgtinicio');

            if (!campoData.isValid()) {
                campoData.focus();      // coloca o foco
                Ext.Msg.alert('Atenção', 'Informe o Pagamento Inicial.');
                return;                 // aborta a gravação
            };          

            var campoData = form.lookupReference('pgtfinal');

            if (!campoData.isValid()) {
                campoData.focus();      // coloca o foco
                Ext.Msg.alert('Atenção', 'Informe o Pagamento Final.');
                return;                 // aborta a gravação
            };                      
       };
*/

        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');
                try {
                   // const vm = this.getViewModel();
                    let nomeRelatorio = configs.getClientName() == 'eleve' ? 
                                        (vm.get('valueTipo') == 0 ? 'receber' : 'pagar') : 
                                        'financeiro';
   
                   let varrelirf  = vm.get('valueRelirf');      
                   nomeRelatorio = (varrelirf == true) ? 'financeiroirf' : nomeRelatorio;                               

                   const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/${nomeRelatorio}`,
                        method: 'GET',
                        timeout: 120000,                        
                        data: {
                            empresa    : (configs.getFinanceiros().multiEmpresa ? vm.get('valueIdEmpresa') : configs.getEmpresa().id),
                            empresacnpj: configs.getEmpresa().cnpj,
                            tipo       : (vm.get('valueTipo') == 0 ? 'R' : 
                                          vm.get('valueTipo') == 1 ? 'P' : 'T'),
                            documento  : vm.get('valueDocumento'),
                            pesinicio  : this.lookup('codpessoai').getValue(),
                            pesfinal   : this.lookup('codpessoaf').getValue(),
                            porinicio  : this.lookup('codportadori').getValue(),
                            porfinal   : this.lookup('codportadorf').getValue(),
                            aplinicio  : this.lookup('codaplicacaoi').getValue(),
                            aplfinal   : this.lookup('codaplicacaof').getValue(),
                            cusinicio  : this.lookup('codcustoi').getValue(),
                            cusfinal   : this.lookup('codcustof').getValue(),
                            vloinicio  : this.lookup('vloinicio').getValue(),
                            vlofinal   : this.lookup('vlofinal').getValue(),
                            emiinicio  : momentTz(this.lookup('emiinicio').getValue()).format('DD/MM/YYYY'),
                            emifinal   : momentTz(this.lookup('emifinal').getValue()).format('DD/MM/YYYY'),
                            vctinicio  : momentTz(this.lookup('vctinicio').getValue()).format('DD/MM/YYYY'),
                            vctfinal   : momentTz(this.lookup('vctfinal').getValue()).format('DD/MM/YYYY'),
                            paginicio  : momentTz(this.lookup('pgtinicio').getValue()).format('DD/MM/YYYY'),
                            pagfinal   : momentTz(this.lookup('pgtfinal').getValue()).format('DD/MM/YYYY'),
                            database   : momentTz(this.lookup('database').getValue()).format('DD/MM/YYYY'),
                            quebra     : vm.get('valueQuebra'),
                            relirf     : vm.get('valueRelirf'),
                            semnn      : vm.get('valueSemnn'),
                            ordem      : vm.get('valueOrdem'),
                            status     : vm.get('valueStatus'),
                            codprofis  : this.lookup('codprofissional').getValue(),
                            nomeprofis : this.lookup('profissional').getValue()
                        }                                
                    });
 
                    await SamosUtils.Utils.sleep(1000);  
                    
                    this.getView().stopGauge()

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
                    this.getView().stopGauge();                    
                    Ext.Note('error', 'Erro no servidor');
                    console.error(error);
                }

            }
        });
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }

});
