Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyrotasdetalhes',

    initViewModel: function(vm) {
        setTimeout(() => {
            const view = this.getView();
            const dataInicial = momentTz(view.griditems.up('ordensskyrotas').lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');
            const diasSemana = {
                'Segunda': 0,
                'Terça'  : 1,
                'Quarta' : 2,
                'Quinta' : 3,
                'Sexta'  : 4,
                'Sábado' : 5
            };
    
            Object.keys(diasSemana).forEach(dia => {
                const txt = view.down(`textfield[fieldLabel="${dia}"]`);
                const parent = txt.up('component');
                const data = momentTz(dataInicial).add(diasSemana[dia], 'days');

                if(momentTz(data.format()).isSameOrAfter(momentServer().hours(0).minutes(0).seconds(0))) {
                    parent.query('numberfield')
                        .forEach(field => {
                            field.setReadOnly(false);
                            field.setUi('textbold-' + configs.getTema());
                        });
                    
                    parent.query('checkbox')
                        .forEach(field => {
                            field.setReadOnly(false);
                        });
                } else {
                    parent.query('numberfield')
                        .forEach(field => {
                            field.setReadOnly(true);
                            field.setUi('field-readonly');
                        });
                        
                    parent.query('checkbox')
                        .forEach(field => {
                            field.setReadOnly(true);
                        });
                }
            });
        }, 200);
    },

    onGravarClick: function () {
        setTimeout(() => {
            const view  = this.getView();
            const model = this.getViewModel().get('model');
            const dataInicial = momentTz(this.getView().griditems.up('ordensskyrotas').lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');

            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async confirm => {
                if (confirm == 'yes') {
                    view.initGauge();

                    SamosUtils.Request.nodeApi({
                        url: `/ordenssky/rotas/${model.get('ORDENSROTAS_ID_CIDADES')}`,
                        method: 'PUT',
                        data: model.data,
                        query: {
                            dataInicial: dataInicial
                        }
                    })
                    .done(res => {
                        view.formItem.setValues(model.data);
                        view.destroy();
                        Ext.Note('success', 'Serviço gravado com sucesso');
                    })
                    .fail(err => {
                        view.stopGauge();
                        Ext.Note('error', 'Erro no servidor');
                        console.error(err);
                    });
                }
            });
        }, 400);
    },

    onCancelarClick: function(btn, event) {
        const vm = this.getViewModel();
        const previousModel = vm.get('previousModel');

        if (previousModel) {
            vm.get('model').set(previousModel);
        }

        this.onSairClick();
    }
});