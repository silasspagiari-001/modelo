Ext.define('SamosAdmin.movimentos.ordenssky.form.agendamento.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyformagendamento',

    onSelecionarRotaClick: function() {
        const view = Ext.create({
            xtype: 'ordensskyrotassearch'
        });

        view.getViewModel().set('viewAgendamento', this.getView());

        setTimeout(() => {
            view.focus(true);
        }, 100);
    }, 

    onAlterarRotaClick: function() {
        this.onSelecionarRotaClick();
    },

    onGravarClick: function () {
        setTimeout(() => {
            const view        = this.getView();
            const ordem       = this.getViewModel().get('ordem');
            const agendamento = this.getViewModel().get('agendamento');
            const txtRota     = this.lookup('idrotas');

            agendamento['celular'] = this.lookup('celular').getValue();//por causa da mascara nao pega direto
            agendamento['ORDENSAVARIADOS_SITUACAO'] = agendamento['ORDENSAVARIADOS_SITUACAO'] === true ? 'T' : 
                                                      agendamento['ORDENSAVARIADOS_SITUACAO'] === 'T'  ? 'T' : 'F'

            if(txtRota.getValue() > 0) {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async confirm => {
                    if (confirm == 'yes') {
                        view.initGauge();

                        SamosUtils.Request.nodeApi({
                            url: `/ordenssky/processos/agendamento/${ordem.get('ORDENS_ID')}`,
                            method: 'PUT',
                            data: agendamento
                        })
                        .done(res => {
                            if(res && res.results && res.results[0]) {
                                ordem.set(res.results[0]);
                            }

                            view.up('formordenssky').listView.getController().onBuscarClick();
                            view.destroy();
                            Ext.Note('success', 'Agendamento realizado com sucesso');
                        })
                        .fail(err => {
                            view.stopGauge();
                            Ext.Note('error', 'Erro no servidor');
                            console.error(err);
                        });
                    }
                });
            } else {
                Ext.Note('warning', 'Selecione a Rota');
            }
        }, 400);
    }
});