Ext.define('SamosAdmin.movimentos.ordenssky.form.detalhesavariados.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyformdetalhesavariados',

    onGravarClick: function () {
        setTimeout(() => {
            const view  = this.getView();
            const model = this.getViewModel().get('model');

            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async confirm => {
                if (confirm == 'yes') {
                    view.initGauge();

                    SamosUtils.Request.nodeApi({
                        url: `/ordenssky/processos/avariados/${model.get('ORDENSAVARIADOS_ID')}`,
                        method: 'PUT',
                        data: model.data
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