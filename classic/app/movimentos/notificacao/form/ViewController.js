Ext.define('SamosAdmin.movimentos.notificacao.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formnotificacao',

    onReagendarClick: function(btn, event) {
        const notificacoes = [this.getRecord()];

        const view = Ext.create({
            xtype: 'notificacaoreagendamento'
        });

        view.getViewModel().set({
            'model': notificacoes
        });
    },

    onEnviarClick: async function (btn, event) {
        const view = this.getView();

        try {
            await this.validarCabecalho();

            const model = this.getRecord();
            const horaAvisar = momentTz(`${model.get('NOTIFICACAO_DATAAVISAR')} ${model.get('NOTIFICACAO_HORAAVISAR')}`, 'YYYY-MM-DD HH:mm')
            
            if(model.get('NOTIFICACAO_SMS') == 'T' && model.get('NOTIFICACAO_MENSAGEM').length > 160) {
                throw 'Tamanho máximo para notificação via SMS: 160 caracteres';
            }

            if(momentServer().isSameOrAfter(horaAvisar)) {
                if(await SamosUtils.Msg.confirm('A hora de envio já passou. Deseja enviar agora?')) {
                    model.set({
                        'NOTIFICACAO_DATAAVISAR': momentServer().format('YYYY-MM-DD'),
                        'NOTIFICACAO_HORAAVISAR': momentServer().add(1, 'minute').format('HH:mm')
                    });
    
                    await this.enviar(model);
                }
            } else {
                if(await SamosUtils.Msg.confirm('Deseja realmente enviar?')) {
                    await this.enviar(model);
                }
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar notificações');
        }

        view.stopGauge();
    },

    enviar: async function(model) {
        const paraTodos = model.get('NOTIFICACAO_TODOS') == 'T';

        this.getView().initGauge(`Enviando... ${paraTodos ? 'Isso pode levar alguns minutos.' : ''}`);
        
        await model.save();
            
        Ext.Note('success', 'Enviado com sucesso');

        Ext.asap(() => {
            this.setReadOnly(true);
            this.doDefaultFocus();
        });
    }
});
