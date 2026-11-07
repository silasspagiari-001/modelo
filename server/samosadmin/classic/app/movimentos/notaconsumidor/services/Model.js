Ext.define('SamosAdmin.movimentos.notaconsumidor.services.Model', {
    alternateClassName: 'NotaConsumidor.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.notaconsumidor.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/notaconsumidor/${id}`
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

    updateUltimoDoctoNFC: function(empresa) {
        empresa = empresa || configs.getEmpresa().id;
        
        const store = Ext.create('Ext.data.NodeJSStore', {
            proxy: {
                url: 'server/consultas/ultimodocto'
            }
        });

        store.getProxy().setExtraParams({
            docto: (Math.pow(10, (2 - empresa.toString().length)) * empresa) + '010',
            empresa: empresa,
            tabela: 'MOVIMENTOS'
        });
        
        return store.load().then(records => {
            if(records && records[0]) {
                localStorage.setItem('ultimoNumeroNFC', records[0].get('ULTIMO'));
                localStorage.setItem('ultimaSerieNFC',  records[0].get('SERIE'));
            }
            return records[0];
        });
    },

    definirValoresPadrao: async function(form, nomeDocumento) {
        const ultimoDocto = localStorage.getItem('ultimoNumeroNFC');

        form.model.set({
            'MOVIMENTOS_NUMERO': isNaN(ultimoDocto) ? '' : (parseInt(ultimoDocto) + 1),
            'MOVIMENTOS_SERIE': localStorage.getItem('ultimaSerieNFC')
        });
        
        const documento = await Documento.services.Model.get(nomeDocumento);
        await NotaConsumidor.services.Documento.atribuirDocumento(documento, form.model);

        if((form.model.get('MOVIMENTOS_SERIEORIGEM') || '').length == 0) {
            form.getViewModel().set('isVendaConsumidor', true); // Nota consumidor sempre inicia setado como consumidor, se for um novo documento
        }

        form.applyTextSearches();

        return documento;
    },

    bloquearParaEdicao: function(model, form) {
        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'C') {
            status = 'B';
        } else if (status == 'N') {
            status = 'M';
        } else if (status == 'F'){
            status = 'E';
        }

        const data = { 'MOVIMENTOS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    liberarParaEdicao: function(model, form) {
        if(!form) { return; }
        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'B') {
            status = 'C';
        } else if (status == 'M') {
            status = 'N';
        } else if (status == 'E'){
            status = 'F';
        }

        const data = { 'MOVIMENTOS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/notaconsumidor/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    carregarCpfExistente: async function(pessoasId) {
        const formPessoas = Ext.$('formnotaconsumidorpessoa')[0];
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
