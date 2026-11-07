Ext.define('SamosAdminModern.pedidos.conferencia.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pedidosconferencia',

    onBuscarClick: async function () {
        Ext.asap(async () => {
            this.getView().initGauge();

            try {
                const queryConferencia = await SamosUtils.Request.nodeApi({
                    url: `/consultas/conferenciaitems`,
                    method: 'GET',
                    query: {
                        movimento: this.getViewModel().get('idMovimento'),
                        barras   : this.getViewModel().get('valueBarras')
                    }
                });

                const items = this.getViewModel().getStore('main').getData().items;

                if(queryConferencia.results['MOVIMENTOSITENS_ID_PRODUTOS']) {
                    items.map(item => {
                        if(item.get('MOVIMENTOSITENS_ID_PRODUTOS') == queryConferencia.results['MOVIMENTOSITENS_ID_PRODUTOS']) {
                            item.set('MOVIMENTOSITENS_QUANTIDADE', 0);
                        }
                    });
                } else {
                    Ext.defer(() => SamosUtils.Msg.alert('Alerta', 'Produto não consta neste pedido', 1000), 100);
                }

                this.getViewModel().getStore('main').setData(items);

                if(items.every(item => item.get('MOVIMENTOSITENS_QUANTIDADE') == 0)) {
                    this.permiteLiberar = true;
                    this.onLiberarClick();

                } else {
                    this.getView().stopGauge();
                }

            } catch (error) {
                this.getView().stopGauge();
                SamosUtils.Msg.error(error, 'Falha ao verificar código de barras');
            }
        });
    },

    onLiberarClick: async function() {
        if(!this.permiteLiberar && !configs.getUsuario().privilegiado){
            //const nivel = 1;

            //Ext.create({ xtype: 'samoswidgets-senhanivel' })
                //.iniciar(nivel)
                //.then(() => {
                    this.permiteLiberar = true;
                    this.onLiberarClick();
                //})
                //.catch(() => {/*acao ao sair*/});
        } else  {
            this.getView().initGauge();

            this.getView().up('main').down('pedidosform').getViewModel().set('model.MOVIMENTOS_SITUACAO', 1);
            this.getView().up('main').down('pedidosform').getViewModel().set('model.MOVIMENTOS_STATUS', 'I');

            try {
                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/atualizarsituacao/${this.getViewModel().get('idMovimento')}`,
                    method: 'PUT',
                    data: {
                        situacao: 1,
                        status: 'I'
                    }
                });

            } catch(error) {
                console.log(error)
            }

            this.getView().stopGauge();

            this.onVoltarClick();
            Ext.defer(() => SamosUtils.Msg.alert('Sucesso', 'Pedido conferido com successo', 1000), 100);
        }
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('pedidosform');
        main.down('container[reference="title"]').setHtml('Pedido');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    }
});
