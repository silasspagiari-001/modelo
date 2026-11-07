Ext.define('SamosAdmin.movimentos.notaservicos.services.Model', {
    alternateClassName: 'NotaServicos.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.notaservicos.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/notaservicos/${id}`
            }
        });

        if(params){
            store.getProxy().setExtraParams(params);
        }

        return store.load()
            .then(records => records)
            .catch(() => {
                Ext.Note('error', 'Erro no servidor');
                Ext.$('container')[0].stopGauge();
            });
    },

    updateUltimoDoctoNFS: function(empresa) {
        empresa = empresa || configs.getEmpresa().id;
        
        const store = Ext.create('Ext.data.NodeJSStore', {
            proxy: {
                url: 'server/consultas/ultimodocto'
            }
        });

        store.getProxy().setExtraParams({
            docto: (Math.pow(10, (2 - empresa.toString().length)) * empresa) + '016',
            empresa: empresa,
            tabela: 'ORDENS'
        });
        
        return store.load().then(records => {
            if(records && records[0]) {
                localStorage.setItem('ultimoNumeroNFS', records[0].get('ULTIMO'));
                localStorage.setItem('ultimaSerieNFS',  records[0].get('SERIE'));
            }
            return records[0];
        });
    },

    definirValoresPadrao: async function(form, nomeDocumento) {
        const ultimoDocto = localStorage.getItem('ultimoNumeroNFS');

        form.model.set({
            'ORDENS_NUMERO': isNaN(ultimoDocto) ? '' : (parseInt(ultimoDocto) + 1),
            'ORDENS_SERIE': localStorage.getItem('ultimaSerieNFS')
        });
        
        const documento = await Documento.services.Model.get(nomeDocumento);
        await NotaServicos.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();

        return documento;
    },

    bloquearParaEdicao: function(model, form) {
        let status = model.get('ORDENS_STATUS');

        if(status == 'C') {
            status = 'B';
        } else if (status == 'N') {
            status = 'M';
        } else if (status == 'F'){
            status = 'E';
        }

        const data = { 'ORDENS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/notaservicos/${model.get('ORDENS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    liberarParaEdicao: function(model, form) {
        if(!form) { return; }
        let status = model.get('ORDENS_STATUS');

        if(status == 'B') {
            status = 'C';
        } else if (status == 'M') {
            status = 'N';
        } else if (status == 'E'){
            status = 'F';
        }

        const data = { 'ORDENS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/notaservicos/${model.get('ORDENS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    carregarCpfExistente: async function(pessoasId) {
        const formPessoas = Ext.$('formnotaservicospessoa')[0];
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
            formPessoas.stopGauge();
            formPessoas.applyTextSearches();
        }
    }
});
