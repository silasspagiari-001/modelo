Ext.define('SamosAdmin.atualizacao.permissoes.services.Model', {
    alternateClassName: 'Permissao.services.Model',
    singleton: true,

    get: function(options = {}) {
        const { groupName, moduleName } = options;
        const empresa = options.empresa || configs.getEmpresa().id;

        const permissoes = Ext.$('combo[reference="comboempresa"]')[0].getStore().getData().items.filter(permissao => {
            return permissao.get('PERMISSOES_ID_EMPRESAS') == empresa;
        });

        const permissao = SamosUtils.Json.tryJsonToObj(permissoes[0].get('PERMISSOES_ITENS'));

        if(!groupName) {
            return permissao;
        } else {
            const selectedGroup = permissao.children.filter(group => group.text == groupName);

            if(!moduleName) {
                return selectedGroup ? selectedGroup[0] : undefined;
            } else {
                const selectedModule = selectedGroup[0] ? selectedGroup[0].children.filter(module => module.text == moduleName) : undefined;
                return selectedModule ? selectedModule[0] : undefined;
            }
        }
    },

    podeLer: function(options) {
        const permissao = this.get(options);

        return permissao ? (permissao.read === true || permissao.read === 'T') : false;
    },

    podeIncluir: function(options) {
        const permissao = this.get(options);

        return permissao ? (permissao.create === true || permissao.create === 'T') : false;
    }
});
