Ext.define('SamosAdmin.movimentos.liberacao.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formliberacao',

    onLiberarClick: async function (btn, event) {
        const view = this.getView();

        try {
            await this.validarCabecalho();

            const model = this.getRecord();
            const notificaUsuario = model.get('NOTIFICACAO_ID_USUARIOS');
            const notificaDestino   = model.get('NOTIFICACAO_ID_DESTINO');
            
            if(await SamosUtils.Msg.confirm('Confirma a liberação?')) {
                model.set({
                    'NOTIFICACAO_STATUS'     : 'T',
                    'NOTIFICACAO_SMS'        : 'R',
                    'NOTIFICACAO_ID_USUARIOS': notificaUsuario,
                    'NOTIFICACAO_ID_DESTINO' : notificaDestino
                });
                await this.liberar(model);
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao liberar preço');
        }

        view.stopGauge();
    },

    onRecusarClick: async function (btn, event) {
        const view = this.getView();

        try {
            await this.validarCabecalho();

            const model = this.getRecord();
            const notificaUsuario = model.get('NOTIFICACAO_ID_USUARIOS');
            const notificaDestino = model.get('NOTIFICACAO_ID_DESTINO');

            
            if(await SamosUtils.Msg.confirm('Confirma a recusa?')) {
                model.set({
                    'NOTIFICACAO_STATUS'     : 'F',
                    'NOTIFICACAO_SMS'        : 'R',
                    'NOTIFICACAO_ID_USUARIOS': notificaUsuario,
                    'NOTIFICACAO_ID_DESTINO' : notificaDestino
                });
                await this.recusar(model);
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao recusar liberação de preço');
        }

        view.stopGauge();
    },

    liberar: async function(model) {
        this.getView().initGauge(`Liberando...`);
        
        await model.save();
            
        Ext.Note('success', 'Liberado com sucesso');

        Ext.asap(() => {
            this.setReadOnly(true);
            this.doDefaultFocus();
        });
    },

    recusar: async function(model) {
        this.getView().initGauge(`Recusando...`);
        
        await model.save();
            
        Ext.Note('success', 'Recusado com sucesso');

        Ext.asap(() => {
            this.setReadOnly(true);
            this.doDefaultFocus();
        });
    }
});
