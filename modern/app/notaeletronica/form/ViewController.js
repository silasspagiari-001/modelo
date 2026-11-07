Ext.define('SamosAdminModern.notaeletronica.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.notaeletronicaform',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('notaeletronica');
        main.down('container[reference="title"]').setHtml('Nota Eletrônica');

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

        main.down('panel').setActiveItem('notaeletronicaprodutos');
        main.down('container[reference="title"]').setHtml('Nota Eletrônica - Itens');

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

    onWhatsappClick: async function() {
        const view  = this.getView();

        try {
            const movimento = this.getViewModel().get('model');
            
            if(!(/iPhone/.test(navigator.userAgent))) {
                const numero = await SamosUtils.Msg.prompt({
                    title       : 'WhatsApp',
                    mensagem    : 'Digite ou confirme o número:',
                    initialValue: movimento.get('PESSOAS_CELULAR') || movimento.get('PESSOAS_CELULARCOBRANCA') || movimento.get('PESSOAS_TELEFONE') || movimento.get('PESSOAS_TELEFONECOBRANCA'),
                    field       : { upperCased: false }
                });
        
                if(numero === false) { return; }
        
                cleanedNumber = SamosUtils.String.onlyNumbers(numero).replace(/^0/, '');
                
                if(!SamosUtils.String.isTelefoneOuCelular(cleanedNumber)){
                    return SamosUtils.Msg.alert('Atenção', 'O número informado é inválido');
                }
            }
    
            view.initGauge();
    
            const pdf    = await NotaEletronica.services.Email.imprimir(view, movimento);
            const pdfUrl = configs.getApiNode() + '/' + pdf;

            if(/iPhone/.test(navigator.userAgent)) {
                view.stopGauge();
                
                await SamosUtils.Msg.prompt({
                    title       : 'WhatsApp',
                    mensagem    : 'Copie o link e cole no WhatsApp',
                    initialValue: pdfUrl.replace('https://', '')
                });

            } else {
                const texto  = `Baixe aqui sua Nota Eletrônica: ${pdfUrl}`;
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
            await NotaEletronica.services.Email.enviar(view, movimento);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    }
});
