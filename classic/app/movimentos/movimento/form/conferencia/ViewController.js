Ext.define('SamosAdmin.movimentos.movimento.form.conferencia.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formmovimentosconferencia',

    /*onKeyDownCamposToolbar: function(txt) {
        if()
    },
*/
    getServerUrl: function() {
        return 'server/consultas/conferenciaitens';
    },

    onBuscarClick: async function () {
        Ext.asap(async () => {
            this.getView().initGauge();

            try {

                const codigoBarras = this.lookup('barras').value;

                if(codigoBarras == '') {
                    Ext.defer(() => Ext.Note('warning', 'Nenhum código de barras informado'), 100);
                    this.getView().stopGauge();                    
                }

                const queryConferencia = await SamosUtils.Request.nodeApi({
                    url: `/consultas/conferenciaitems`,
                    method: 'GET',
                    query: {
                        movimento: this.getViewModel().get('idMovimento'),
                        barras   : codigoBarras
                    }
                });

                const items = this.getViewModel().getStore('main').getData().items;

                if(queryConferencia.results['MOVIMENTOSITENS_ID_PRODUTOS']) {
                    items.map(item => {
                        const qtdeItem = item.get('ITENS_QUANTIDADERESTANTE');
                        const qtdeAbater = this.getViewModel().get('valueQtde');
                        const novaQtde = qtdeItem - qtdeAbater;

                        if(item.get('MOVIMENTOSITENS_ID_PRODUTOS') == queryConferencia.results['MOVIMENTOSITENS_ID_PRODUTOS']) {
                            item.set('ITENS_QUANTIDADERESTANTE', novaQtde < 0 ? 0 : novaQtde);
                        }
                    });
                } else {
                    Ext.defer(() => Ext.Note('warning', 'Produto não consta neste pedido'), 100);
                }

                this.getViewModel().getStore('main').setData(items);

                if(items.every(item => item.get('ITENS_QUANTIDADERESTANTE') == 0)) {
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
        if(!this.permiteLiberar){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteLiberar = true;
                    this.onLiberarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else  {
            this.getView().initGauge();

            this.getView().up('formmovimentos').model.set('MOVIMENTOS_SITUACAO', 1);  // Conferido
            this.getView().up('formmovimentos').model.set('MOVIMENTOS_STATUS', 'I');  // Fechado

            try {
                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/atualizarsituacao/${this.getView().up('formmovimentos').model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: {
                        situacao: 1,
                        status: 'I'
                    }
                });

            } catch(error) {
                console.log(error)
            }

            Ext.Msg.alert('Aviso', `Pedido conferido com sucesso`);
            this.onSairClick();

        }
    }
});
