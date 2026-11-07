Ext.define('SamosAdmin.relatorios.precos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosprecoslist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const relatorioView = Ext.$('relatoriosprecoslist')[0];

        //Se os campos não estiverem preenchidos
        if( relatorioView.query('samoswidgets-adaptative-textsearch[fieldLabel=Produto]')[0].getValue().trim() == '' ||
            relatorioView.query('samoswidgets-adaptative-textsearch[fieldLabel=Até]')[0].getValue().trim() == ''     ||
            relatorioView.query('samoswidgets-adaptative-textsearch[fieldLabel=Grupo]')[0].getValue().trim() == ''   ||
            relatorioView.query('samoswidgets-adaptative-textsearch[fieldLabel=Final]')[0].getValue().trim() == ''   
        ){
            Ext.Note('warning', 'Preencha os campos Grupo e Produto!');
            return;
        }

        try {
            relatorioView.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            relatorioView.stopGauge();

            //Exibe o PDF
            if(queryPDF.results[0]) {
                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            } else {
                Ext.Note('warning', 'Nenhum registro')
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        relatorioView.stopGauge();
    },

    onAposPesquisarTextSearch: function(selfField, selfView, foundedRecord, isWindowSearch){
        
    },  

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            empresacnpj: configs.getEmpresa().cnpj,
            tipo: vm.get('valueTipo'),
            situacao: vm.get('valueSituacao'),
            produtoinicial: vm.get('valueProduto'),
            produtofinal: vm.get('valueAte'),
            grupoinicial: vm.get('valueGrupo'),
            grupofinal: vm.get('valueFinal'),
            pessoa: vm.get('valueIdPessoa')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
