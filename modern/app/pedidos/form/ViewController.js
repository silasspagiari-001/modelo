Ext.define('SamosAdminModern.pedidos.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pedidosform',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('pedidos');
        main.down('container[reference="title"]').setHtml('Pedidos');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    },

    onProdutosClick: async function () {
        const main = this.getView().up('main');

        const movimento = this.getViewModel().get('model');

        main.down('panel').setActiveItem('pedidosprodutos');
        main.down('container[reference="title"]').setHtml('Pedidos - Itens');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': movimento,
            'readOnly': true,
            'hideForm': true,
            'initialValues': Object.assign({}, movimento.data)
        });
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    },

    onPagamentosClick: async function () {
        const main = this.getView().up('main');

        const movimento = this.getViewModel().get('model');

        main.down('panel').setActiveItem('pedidospagamentos');
        main.down('container[reference="title"]').setHtml('Pedidos - Pagamentos');

        main.down('panel').getActiveItem().getViewModel().set({
            'model'        : movimento,
            'pagamento'    : movimento.get('MOVIMENTOS_FORMASPAGAMENTO')[0],
            'readOnly'     : true,
            'initialValues': Object.assign({}, movimento.data)
        });
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    },

    onConferenciaClick: async function () {
        const main = this.getView().up('main');

        const movimento = this.getViewModel().get('model');

        main.down('panel').setActiveItem('pedidosconferencia');
        main.down('container[reference="title"]').setHtml('Pedidos - Conferência');

        main.down('panel').getActiveItem().getViewModel().set({
            idMovimento: movimento.get('MOVIMENTOS_ID')
        });

        main.down('panel').getActiveItem().getViewModel().get('main').setData(Array.from(movimento.get('MOVIMENTOS_ITENS')));

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    },

    onWhatsappClick: async function() {
        const view  = this.getView();

        try {
            const movimento = this.getViewModel().get('model');
            
            if(!(/iPhone/.test(navigator.userAgent))) {
                const numero = await SamosUtils.Msg.prompt({
                    title       : 'WhatsApp',
                    mensagem    : 'Digite ou confirme o número:',
                    initialValue: record.get('PESSOAS_CELULAR') || record.get('PESSOAS_CELULARCOBRANCA') || record.get('PESSOAS_TELEFONE') || record.get('PESSOAS_TELEFONECOBRANCA'),
                    field       : { upperCased: false }
                });
        
                if(numero === false) { return; }
        
                cleanedNumber = SamosUtils.String.onlyNumbers(numero).replace(/^0/, '');
                
                if(!SamosUtils.String.isTelefoneOuCelular(cleanedNumber)){
                    return SamosUtils.Msg.alert('Atenção', 'O número informado é inválido');
                }
            }
    
            view.initGauge();
    
            const pdf    = await Pedido.services.Email.imprimir(view, movimento);
            const pdfUrl = configs.getApiNode() + '/' + pdf;

            if(/iPhone/.test(navigator.userAgent)) {
                view.stopGauge();
                
                await SamosUtils.Msg.prompt({
                    title       : 'WhatsApp',
                    mensagem    : 'Copie o link e cole no WhatsApp',
                    initialValue: pdfUrl.replace('https://', '')
                });
            } else {
                const texto  = `Baixe aqui o seu pedido: ${pdfUrl}`;
                const url = `whatsapp://send?phone=55${cleanedNumber}&text=${window.encodeURIComponent(texto)}`
                window.open(url, '_blank');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao encaminhar para o whatsapp');
        }

        view.stopGauge();
    },

    onEmailClick: async function() {
        const view = this.getView();
        const movimento = this.getViewModel().get('model');

        try {
            await Pedido.services.Email.enviar(view, movimento);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    }
});
