Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.services.Model', {
    alternateClassName: 'Propriedade.services.Model',
    singleton: true,

    get: function(id) {
        const store = this.criarStorePropriedades();

        if(parseInt(id)){
            store.getProxy().setExtraParam('conteudo', `.${id}`);
        }

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    criarStorePropriedades: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.pessoas.form.propriedades.Model',
            proxy: {
                url: 'server/propriedades'
            }
        });
    },

    liberarCadastroCpfExistente: function() {
        const formPropriedades = Ext.$('formpropriedades')[0];

        try { Ext.$('note')[0].destroy(); } catch(e) {}

        setTimeout(() => {
            formPropriedades.getViewModel().set('cadastroCpfDuplicadoLiberado', true);
            formPropriedades.lookup('inscricao_tipo').focus(true);
        }, 200);
    },

    carregarCpfExistente: async function(propriedadesId) {
        const formPropriedades = Ext.$('formpropriedades')[0];
        const vmPropriedades = formPropriedades.getViewModel();

        try { Ext.$('note')[0].destroy(); } catch(e) {}

        formPropriedades.initGauge();

        const queryPropriedade = await SamosUtils.Request.nodeApi({
            url: `/propriedades`,
            method: 'GET',
            query: {
                conteudo: `.${propriedadesId}`
            }
        });

        if (queryPropriedade.results[0]) {
            vmPropriedades.get('model').set(queryPropriedade.results[0]);
            vmPropriedades.get('model').phantom = false;
            vmPropriedades.set('readOnly', true);
            formPropriedades.stopGauge();
            formPropriedades.applyTextSearches();
        }
    }
});
