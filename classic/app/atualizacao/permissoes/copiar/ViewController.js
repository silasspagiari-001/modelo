Ext.define('SamosAdmin.atualizacao.permissoes.copiar.ViewController', {
    extend: 'SamosAdmin.atualizacao.permissoes.ViewController',
    alias: 'controller.permissoescopiar',

    initViewModel: function(vm) {
        vm.set('model', Ext.create('SamosAdmin.atualizacao.usuarios.Model'));
    },

    onCopiarClick: async function (btn, e) {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            const usuarioOrigem = vm.get('model.USUARIOS_ID');
            const empresaOrigem = vm.get('selectedEmpresa');
    
            if(parseInt(usuarioOrigem).toString() == 'NaN'){
                this.lookup('usuario').focus(true);
                throw 'Selecione o usuario a ser copiado';
            }
            
            if(!empresaOrigem){
                this.lookup('empresa').focus(true);
                throw 'Selecione a empresa';
            }
            
            const queryPermissoes = await SamosUtils.Request.nodeApi({
                url: `/permissoes`,
                method: 'GET',
                query: {
                    pessoa:  usuarioOrigem,
                    empresa: empresaOrigem
                }
            });

            const viewPermissoes = Ext.$('permissoes')[0];
            const ctrlPermissoes = viewPermissoes.getController();
            const vmPermissoes = viewPermissoes.getViewModel();
            const record = queryPermissoes.results && queryPermissoes.results[0] ? queryPermissoes.results[0] : null;
            const permissao = this.getViewModel().get('model');

            if(record){
                if (!SamosUtils.Json.tryJsonToObj(record['PERMISSOES_ITENS'])) {
                    record['PERMISSOES_ITENS'] = SamosUtils.Json.objToJson(Ext.create('SamosAdmin.atualizacao.permissoes.defaults.Pattern').getData());
                }

                permissao.set('PERMISSOES_ITENS', record['PERMISSOES_ITENS']);
                const permissoes = SamosUtils.Json.tryJsonToObj(permissao.get('PERMISSOES_ITENS'));

                vmPermissoes.set('model', permissao);
                vmPermissoes.set('initialValues', Object.assign({}, permissao.getData()));
                ctrlPermissoes.setPermissoes.call(ctrlPermissoes, permissoes);
            } else {
                vmPermissoes.set('model', {});
                ctrlPermissoes.setPermissoes.call(ctrlPermissoes, '{}');
            }

            await SamosUtils.Utils.sleep(200);
            this.onSairClick();
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao copiar');
        }

        view.stopGauge();
    }
});
