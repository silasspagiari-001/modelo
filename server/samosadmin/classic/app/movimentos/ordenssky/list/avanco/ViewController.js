Ext.define('SamosAdmin.movimentos.ordenssky.list.avanco.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyavanco',

    carregarMaterial: function(combo, tecnico) {
        this.getView().initGauge();
    
        SamosUtils.Request.nodeApi({
            url: `/ordenssky/avanco`,
            method: 'GET',
            query: {
                empresa: configs.getEmpresa().id,
                usuario: tecnico
            }
        })
        .done(res => {
            setTimeout(() => {
                const store = this.lookup('gridordensskyavanco').getStore();
                
                if(res.results.length > 0) {
                    store.setData(res.results);
                } else {
                    store.setData([]);
                }

                this.getView().stopGauge(true);
            }, 300);
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);

            setTimeout(() => {
                const store = this.lookup('gridordensskyavanco').getStore();

                store.setData([]);

                this.getView().stopGauge();
            }, 300);
        });
    },

    onGravarClick: function() {
        const grid  = this.lookup('gridordensskyavanco');
        const store = grid.getStore();

        grid.finalizarEdicao();

        const items = (store.getData().items || [])
            .filter(produto => produto.get('QTDE_AVANCAR') > 0)
            .map(produto => produto.data);

        if(items.length == 0) {
            Ext.Note('warning', 'Preencha a quantidade que deseja avançar');
            this.getView().down('field[reference^="qtdeavancar"]').focus(true);
            return;
        }

        Ext.Msg.confirm('Confirmação', 'Deseja realmente avançar os produtos?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge();

                const tecnico = this.lookup('comboSelecionarTecnico').getValue();

                SamosUtils.Request.nodeApi({
                    url: `/ordenssky/avanco`,
                    method: 'POST',
                    data: items,
                    query: {
                        usuario: tecnico,
                        empresa: configs.getEmpresa().id
                    }
                })
                .done(res => {
                    const idPedido = res.results[0]['MOVIMENTOS_ID'];

                    Ext.Note('success', `Pedido gerado<br><br>
                    <a href="#" onclick="Ordem.services.Model.exibirPedidoGerado(${idPedido})">
                        <font color="blue">Visualizar</font>
                    </a>`, 7000);

                    setTimeout(() => {
                        const store = this.lookup('gridordensskyavanco').getStore();
                        
                        if(res.results.length > 0) {
                            store.setData(res.results);
                        } else {
                            store.setData([]);
                        }
        
                        this.getView().stopGauge(true);
                    }, 300);
                })
                .fail(err => {
                    Ext.Note('error', 'Erro no servidor');
                    console.error(err);
                    this.getView().stopGauge();
                });
            }
        });
    }
});
