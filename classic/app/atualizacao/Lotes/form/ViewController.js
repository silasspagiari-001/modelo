Ext.define('SamosAdmin.atualizacao.lotes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formlotes',

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const model = this.getRecord();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/lotes`,
                    method: 'GET',
                    query: {
                        conteudo   : model.get('LOTES_ID'),
                        empresacnpj: configs.getEmpresa().cnpj
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    }

});
