Ext.define('SamosAdmin.atualizacao.usuarios.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.usuarios',

    onNovoClick: async function() {
        if(configs.getUsuarios().maxUsuariosCadastrados) {
            const queryUsuariosCadastrados = await SamosUtils.Request.nodeApi({
                url: `/usuarios`,
                method: 'GET',
                query: {
                    conteudo: '',
                    ordem: 0,
                    status: 0,
                    start: 0,
                    limit: 1,
                }
            });

            if((queryUsuariosCadastrados.total || 0) - 1 >= configs.getUsuarios().maxUsuariosCadastrados) {
                SamosUtils.Msg.alert('Atenção', `Limite de ${configs.getUsuarios().maxUsuariosCadastrados} usuários atingido.`);
            } else {
                return this.callParent(arguments);
            }
        } else {
            return this.callParent(arguments);
        }
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            tipo: vm.get('valueTipo'),
            empresa: vm.get('valueIdEmpresa'),
            empresacnpj: configs.getEmpresa().cnpj,
            status: vm.get('valueStatus')
        }; 
    },

    onImprimirClick: async function (btn, event) {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const vm = this.getViewModel();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/usuarios`,
                    method: 'GET',
                    query: {
                        empresa    : vm.get('valueIdEmpresa'),            
                        empresacnpj: configs.getEmpresa().cnpj,
                        conteudo   : vm.get('valueConteudo'),
                        ordem      : vm.get('valueOrdem'),
                        tipo       : vm.get('valueTipo'),
                        status     : vm.get('valueStatus')
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
