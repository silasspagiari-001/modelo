Ext.define('SamosAdmin.emissao.etiquetaspessoas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formemissaoetiquetaspessoas',

    initViewModel: function(vm) {
        Ext.asap(() => {
            const etiqueta = vm.get('model');
            const status = etiqueta.get('ETIQUETAS_STATUS');

            if(etiqueta.isNew()) {
                etiqueta.set({
                    'TABELA': 'PESSOAS',
                    'TIPO'  : configs.getEmissao().etiquetaProdutos.tipos[0]
                });
            }

            if(status == 'I') {
                this.verificarStatus(etiqueta.get('ETIQUETAS_ID'));
            }
        });
    },

    onNovoClick: async function () {
        const form = await this.callParent(arguments);
        await SamosUtils.Utils.sleep(300);
        this.setTabelaTipo(this.getView().model);
        return form;
    },

    setTabelaTipo: function(etiqueta) {
        etiqueta.set({
            'TABELA': 'PESSOAS',
            'TIPO'  : (configs.getEmissao().etiquetaPessoas.tipos || [])[0]
        });
    },

    prepararPessoa: function(txt, record) {
        const selection = this.lookup('pessoas').getSelection();
        if(!selection){ return; }

        const pessoa = selection.getValues();

        pessoa['ETIQUETASITENS_QUANTIDADE'] = (pessoa['ETIQUETASITENS_QUANTIDADE'] == 0 ? 1 : pessoa['MOVIMENTOSITENS_QUANTIDADE']);

        selection.setValues(pessoa);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    onImprimirClick: async function(impressora, layout) {

        if(impressora == 'Visualizar' || !configs.getRedis()) {
            this.onVisualizarClick(); 
            return;           
        }

        const view = this.getView();
    
        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const etiqueta = this.getViewModel().get('model');

                SamosUtils.Request.nodeApi({
                    url: `/processos/movimentosredis`,
                    method: 'POST',
                    data: {
                        'MOVIMENTOSREDIS_ID'         : etiqueta.get('ETIQUETAS_ID'),
                        'MOVIMENTOSREDIS_TABELA'     : 'ETIQUETAS', 
                        'MOVIMENTOSREDIS_IMPRESSORA' : impressora,
                        'MOVIMENTOSREDIS_LAYOUT'     : layout,
                        'MOVIMENTOSREDIS_PAGINAS'    : 1,
                        'MOVIMENTOSREDIS_PARAMETROS' : ''
                    }
                });
    
                Ext.Note('success', 'Enviado para impressora');

            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();

    },

    onVisualizarClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const tipo = (this.getRecord().get('TIPO') || '').toLowerCase() ;

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiqueta${tipo}`,
                    method: 'GET',
                    query: {
                        empresa: configs.getEmpresa().id,
                        empresacnpj : configs.getEmpresa().cnpj,                        
                        id     : this.getRecord().get('ETIQUETAS_ID'),
                        start  : 0,
                        limit  : 1
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
    },


    onCancelarImpressaoClick: async function(btn, e) {
        const view = this.getView();

        try {
            view.initGauge();

            const etiqueta = this.getViewModel().get('model');

            etiqueta.set({
                'IMPRESSORA'      : '',
                'ETIQUETAS_LAYOUT': '',
                'ETIQUETAS_STATUS': 'F'
            });

            await etiqueta.save();

            Ext.Note('success', 'Impressão cancelada');

        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível cancelar');
        }

        view.stopGauge(false);
    },

    verificarStatus: async function(id) {
        await SamosUtils.Utils.sleep(5000);

        const vm = this.getViewModel();

        //executa enquanto a view estiver aberta e fora de edição
        if(this.getView() && vm.get('readOnly')) {
            try {
                const queryEtiqueta = await SamosUtils.Request.nodeApi({
                    url: `/etiquetas`,
                    method: 'GET',
                    query: {
                        conteudo: `.${id}`
                    }
                });

                const etiqueta = queryEtiqueta.results[0];
    
                if(etiqueta['ETIQUETAS_STATUS'] != 'I') {
                    this.getViewModel().get('model').set({
                        'ETIQUETAS_STATUS': etiqueta['ETIQUETAS_STATUS']
                    });
                } else {
                    this.verificarStatus(id);
                }
    
            } catch(error) {
                console.error(error);
            }
        }
    }
});
