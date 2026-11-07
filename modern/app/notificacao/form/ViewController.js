Ext.define('SamosAdminModern.notificacao.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.notificacaoform',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onMarcarClick: async function() {
        const view = this.getView();
        
        try {
            view.initGauge();
            
            const notificacao = this.getViewModel().get('model');

            notificacao.set({
                'NOTIFICACAO_STATUS'     : 'L',
                'NOTIFICACAO_DATALEITURA': momentServer().format('YYYY-MM-DD'),
                'NOTIFICACAO_HORALEITURA': momentServer().format('HH:mm')
            })
            
            await SamosUtils.Request.nodeApi({
                url: `/notificacao/lote`,
                method: 'PUT',
                data: [notificacao.data]
            });

            Notificacao.services.Monitor.verificarNaoLidas();

            this.onVoltarClick();
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao gravar');
        }

        view.stopGauge();
    },

    onReagendarClick: async function () {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            view.initGauge('Reagendando...');

            const notificacao = vm.get('model');
            const dataAvisar  = vm.get('dataAvisar');
            const horaAvisar  = vm.get('horaAvisar');

            notificacao.set({
                'NOTIFICACAO_DATAAVISAR' : dataAvisar, 
                'NOTIFICACAO_HORAAVISAR' : horaAvisar, 
                'NOTIFICACAO_STATUS'     : 'R', 
                'NOTIFICACAO_DATALEITURA': '1899-12-30',
                'NOTIFICACAO_HORALEITURA': ''
            });

            await SamosUtils.Request.nodeApi({
                url: '/notificacao/lote',
                method: 'PUT',
                data: [notificacao.data]
            });

            Notificacao.services.Monitor.verificarNaoLidas();

            this.onVoltarClick();

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao reagendar');
        }

        view.stopGauge();  
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        if(!this.getViewModel().get('readOnly')) {
            this.getViewModel().get('model').set(this.getViewModel().get('initialValues'))
        }

        main.down('panel').setActiveItem('notificacao');
        main.down('container[reference="title"]').setHtml('Notificação');
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });

        Ext.defer(() => {
            this.getView().query('field')
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                })
        }, 100)
    }
});
