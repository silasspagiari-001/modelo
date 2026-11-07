Ext.define('SamosAdmin.atualizacao.pessoas.services.Model', {
    alternateClassName: 'Pessoa.services.Model',
    singleton: true,

    get: function(id) {
        const store = this.criarStorePessoas();

        if(parseInt(id)){
            store.getProxy().setExtraParam('conteudo', `.${id}`);
        }

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    criarStorePessoas: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.pessoas.Model',
            proxy: {
                url: 'server/pessoas'
            }
        });
    },

    liberarCadastroCpfExistente: function() {
        const formPessoas = Ext.$('formpessoas')[0];

        try { Ext.$('note')[0].destroy(); } catch(e) {}

        setTimeout(() => {
            formPessoas.getViewModel().set('cadastroCpfDuplicadoLiberado', true);
            formPessoas.lookup('nome').focus(true);
        }, 200);
    },

    carregarCpfExistente: async function(pessoasId) {
        const formPessoas = Ext.$('formpessoas')[0];
        const vmPessoas = formPessoas.getViewModel();

        try { Ext.$('note')[0].destroy(); } catch(e) {}

        formPessoas.initGauge();

        const queryPessoa = await SamosUtils.Request.nodeApi({
            url: `/pessoas`,
            method: 'GET',
            query: {
                conteudo: `.${pessoasId}`
            }
        });

        if (queryPessoa.results[0]) {
            vmPessoas.get('model').set(queryPessoa.results[0]);
            vmPessoas.get('model').phantom = false;
            vmPessoas.set('readOnly', true);
            formPessoas.stopGauge();
            formPessoas.applyTextSearches();
        }
    }
});
