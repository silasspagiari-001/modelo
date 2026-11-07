Ext.define('SamosAdmin.processos.estoque.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.processosestoque',

    initViewModel: async function() {
        try {
            const form = this.getView();
            const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
            const newModel = Ext.create('SamosAdmin.movimentos.movimento.Model');

            newModel.set(newModel.getIdProperty(), 0);

            this.cleanChilds();

            form.model = newModel;

            form.getViewModel().set({
                'model':         newModel,
                'initialValues': {},
                'readOnly':      false,
                'previousModel': {}
            });

            SamosUtils.Events.enableWarnReload();

            if(tabpanel){
                tabpanel.setActiveTab(form);
            }

            this.doDefaultFocus();

            await Movimento.services.Model.definirValoresPadrao(form, 'Requisições');
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro incluir novo acerto de estoque');
        }
    },

    prepararProduto: function(txt, record) {
        const selection = this.lookup('produtos').getSelection();

        if(!selection){ return; }

        const produto = selection.getValues();

        produto['MOVIMENTOSITENS_QUANTIDADE'] = (!produto['MOVIMENTOSITENS_QUANTIDADE'] ? record.get('SALDOS_DISPONIVEL') : produto['MOVIMENTOSITENS_QUANTIDADE']);

        selection.setValues(produto);

        setTimeout(async () => {
            txt.up('samoswidgets-griditems').publicarModel(txt, txt.up('form'));
        }, 200);
    },

    onAtualizarClick: async function() {
        const view = this.getView();

        try {
            const produtos = this.lookup('produtos').getStore().data.items;
            const diaBase  = moment(this.lookup('inicio').getValue()).format('YYYY-MM-DD');
    
            if(produtos.length == 0) {
                throw 'Selecione os produtos'
            }

            if(produtos.some(produto => isNaN(parseFloat(produto.get('MOVIMENTOSITENS_QUANTIDADE'))))) {
                throw 'Digite os novos saldos dos produtos'
            }

            if(produtos.some(produto => produto.get('MOVIMENTOSITENS_QUANTIDADE') == produto.get('SALDOS_DISPONIVEL'))) {
                throw 'A nova quantidade deve ser diferente da anterior'
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente acertar o estoque?')) {
                view.initGauge();
    
                const queryAtualizarEstoque = await SamosUtils.Request.nodeApi({
                    url: `/processos/produtos/atualizarestoque`,
                    method: 'POST',
                    data: produtos.map(produto => {
                        return {
                            'PRODUTOS_ID'      : produto.get('MOVIMENTOSITENS_ID_PRODUTOS'),
                            'SALDOS_DISPONIVEL': produto.get('SALDOS_DISPONIVEL').toString().replace(',','.'),
                            'NOVO_SALDO'       : produto.get('MOVIMENTOSITENS_QUANTIDADE'),
                            'DATA_BASE'        : diaBase,
                            'SALDOS_CUSTO'     : produto.get('SALDOS_CUSTO')
                        }
                    })
                });
    
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/atualizacaoestoque`,
                    method: 'GET',
                    query: {
                        idRequisicao: queryAtualizarEstoque.results[0]['MOVIMENTOS_ID'] 
                    }
                });
    
                await SamosUtils.Utils.sleep(500);
    
                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
    
                Ext.Note('success', 'Estoque atualizado com sucesso');
    
                this.cleanChilds();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Não foi possível atualizar o estoque dos itens');
        }

        view.stopGauge();
    }
});
