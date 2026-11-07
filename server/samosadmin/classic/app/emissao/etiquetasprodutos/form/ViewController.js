Ext.define('SamosAdmin.emissao.etiquetasprodutos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formemissaoetiquetas',

    onNovoClick: async function () {
        const form = await this.callParent(arguments);
        await SamosUtils.Utils.sleep(300);
        this.setTabelaTipo(this.getView().model);
        return form;
    },

    setTabelaTipo: function(etiqueta) {
        etiqueta.set({
            'TABELA': 'PRODUTOS',
            'TIPO'  : (configs.getEmissao().etiquetaProdutos.tipos || [])[0]
        });
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

    onProdutosClick: async function(btn, e) {
        this.iniciarEdicao();

        const produtosAtuais = this.lookup('produtos').getStore().data.items.map(produtos => produtos);

        const records = await btn.up('samoswidgets-dinamicbutton').openSearch({
            title: 'Produtos',
            tabela: 'produtos',
            proximoFoco: 'nome',
            multi: true,
            valueOrdem: 1,
            valueStatus: 'T'
        });

        const produtos = records.map(produto => {

            return Ext.create('SamosAdmin.emissao.EtiquetaItens', {
                'ETIQUETASITENS_ID'           : '',
                'ETIQUETASITENS_ID_ETIQUETAS' : '',
                'ETIQUETASITENS_ID_PRODUTOS'  : produto.get('PRODUTOS_ID'),
                'PRODUTOS_NOME'               : produto.get('PRODUTOS_NOME'),
                'ETIQUETASITENS_MODELO'       : produto.get('PRODUTOS_DESCRICAO'),
                'ETIQUETASITENS_APLICACAO'    : produto.get('PRODUTOS_APLICACAO'),
                'PRODUTOS_UNIDADE'            : produto.get('PRODUTOS_UNIDADE'),
                'SALDOS_PRECO'                : produto.get('SALDOS_PRECO'),
                'SALDOS_PRAZO'                : produto.get('SALDOS_PRAZO'),
                'ETIQUETASITENS_QUANTIDADE'   : 1
            });
        });

        this.getViewModel().get('model').set({
            'ETIQUETAS_ITENS': produtosAtuais.concat(produtos)
        });
    },

    onVisualizarClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const tipo = (this.getRecord().get('TIPO') || '').toLowerCase() || 'produto';
                const layout = (this.getRecord().get('ETIQUETAS_LAYOUT') || '').toLowerCase();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiqueta${tipo}${layout}`,
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

    onComPromocaoClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiquetapromocao`,
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

    onSemPromocaoClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiquetaproduto`,
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

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();
        if(!selection){ return; }

        const model = this.getRecord();
        const txtQtde = txt.up('form').down('field[reference^="qtde"]');
        const produto = selection.getValues();

        produto['ETIQUETASITENS_QUANTIDADE'] = (produto['ETIQUETASITENS_QUANTIDADE'] == 0 ? 1 : produto['ETIQUETASITENS_QUANTIDADE']);

        txtQtde.suspendEvents();

        selection.setValues(produto);
        Ext.defer(txtQtde.resumeEvents, 50, txtQtde);

        setTimeout(() => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    }
});
