Ext.define('SamosAdminModern.orcamentos.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentosform',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onExcluirClick: async function() {
        const view = this.getView();

        if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')) {
            try {
                view.initGauge();
                await this.getViewModel().get('model').erase();
                this.onVoltarClick();
                SamosUtils.Msg.alert('Sucesso', 'Excluído com sucesso', 2000)
            } catch (error) {
                SamosUtils.Msg.error(error, 'Falha ao excluir');
            }
        }

        view.stopGauge();
    },

    onAlterarClick: async function () {
        if(await SamosUtils.Msg.confirm('Deseja realmente alterar?')) {
            const main = this.getView().up('main');
    
            main.getViewModel().set({
                hideVoltar : false,
                hideExcluir: true,
                hideAlterar: true,
                hideGravar : false,
                hideNovo   : true
            });
    
            this.getViewModel().set('readOnly', false);

            Ext.defer(() => {
                this.getView().query('field')
                    .filter(field => !field.getReadOnly())  
                    .map(field => {
                        try { field.el.dom.querySelector('input').style.backgroundColor = '#e5e5e5'; } catch (e) { }
                    })
            }, 100);
        }
    },

    onGravarClick: async function() {
        const view = this.getView();
        const main = view.up('main');

        if(this.validarModel() && await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            try {
                view.initGauge();

                const model = this.getViewModel().get('model');

                const obs = model.get('MOVIMENTOS_OBSERVACOES')

                //substitui as quebras por ! para salvar
                model.set('MOVIMENTOS_OBSERVACOES', obs.replace(/\n/ig, '|'));
                
                await model.save();

                //volta as quebras normais para exibição
                model.set('MOVIMENTOS_OBSERVACOES', obs.replace(/\|/ig, '\n'));
                
                main.getViewModel().set({
                    hideVoltar : false,
                    hideExcluir: false,
                    hideAlterar: false,
                    hideGravar : true,
                    hideNovo   : true
                });
                
                this.getViewModel().set({
                    'readOnly': true,
                    'initialValues': Object.assign({}, model.data)
                });

                Ext.defer(() => {
                    this.getView().query('field')
                        .map(field => {
                            try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                        })
                }, 100);

                SamosUtils.Msg.alert('Sucesso', 'Gravado com sucesso', 2000);
            } catch (error) {
                SamosUtils.Msg.error(error, 'Falha ao gravar');
            }
        }

        view.stopGauge();
    },

    onVoltarClick: async function() {
        const main = this.getView().up('main');

        if(!this.getViewModel().get('readOnly')) {
            if(!(await SamosUtils.Msg.confirm('Deseja realmente sair sem gravar?'))) {
                return;
            }
        }    
        
        if(!this.getViewModel().get('readOnly')) {
            this.getViewModel().get('model').set(this.getViewModel().get('initialValues'))
        }

        main.down('panel').setActiveItem('orcamentos');
        main.down('container[reference="title"]').setHtml('Orçamentos');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : false
        });

        Ext.defer(() => {
            this.getView().query('field')
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                })
        }, 100)
    },

    validarModel: function () {
        const model = this.getViewModel().get('model');
        const fields = this.getView().query('textfield');
        const vObj = model.getValidation ? model.getValidation(true) : {};

        if (vObj.dirty) {
            for (let i in vObj.data) {
                if (vObj.data[i] != true) {
                    for (let j in fields) {
                        if ((
                            fields[j].getBind() && 
                            fields[j].getBind().value && 
                            fields[j].getBind().value.stub ? 
                            fields[j].getBind().value.stub.name : 
                            fields[j].name
                        ) == i) {
                            const fieldName = fields[j].getLabel();
                            
                            if (fields[j].isVisible(true)) {
                                SamosUtils.Msg.alert((fieldName || ''), vObj.data[i], 1500);
                                Ext.defer(fields[j].focus, 300, fields[j], [true]);
                                return false;
                            }
                        }
                    }
                }
            }
        }

        return true;
    },

    onPessoaClick: async function () {
        const main = this.getView().up('main');

        const movimento = this.getViewModel().get('model');

        main.down('panel').setActiveItem('orcamentospessoassearch');
        main.down('container[reference="title"]').setHtml('Orçamentos - Pessoas');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': movimento
        });
        
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
        const readOnly = this.getViewModel().get('readOnly');

        main.down('panel').setActiveItem('orcamentosprodutos');
        main.down('container[reference="title"]').setHtml('Orçamentos - Itens');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': movimento,
            'readOnly': readOnly,
            'hideForm': true,
            'initialValues': Object.assign({}, movimento.data)
        });
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: readOnly,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : readOnly
        });

        Ext.defer(() => {
            main.down('panel').getActiveItem().query('field')
                .filter(field => !field.getReadOnly())  
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = '#e5e5e5'; } catch (e) { }
                })
        }, 100);
    },

    onPagamentosClick: async function () {
        const main = this.getView().up('main');

        const movimento = this.getViewModel().get('model');

        if(!movimento.get('MOVIMENTOS_ITENS')[0]) {
            return SamosUtils.Msg.alert('Atenção', 'Adicione os produtos antes do pagamento');
        }

        const readOnly = this.getViewModel().get('readOnly');

        main.down('panel').setActiveItem('orcamentospagamentos');
        main.down('container[reference="title"]').setHtml('Orçamentos - Pagamentos');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': movimento,
            'pagamento': movimento.get('MOVIMENTOS_FORMASPAGAMENTO')[0],
            'readOnly': readOnly,
            'initialValues': Object.assign({}, movimento.data)
        });
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });

        Ext.defer(() => {
            if(!readOnly) {
                main.down('panel').getActiveItem().query('field')
                    .filter(field => !field.getReadOnly())  
                    .map(field => {
                        try { field.el.dom.querySelector('input').style.backgroundColor = '#e5e5e5'; } catch (e) { }
                    })
            }
        }, 100);
    },

    onWhatsappClick: async function() {
        const view  = this.getView();

        try {
            const movimento = this.getViewModel().get('model');
            
            const numero = await SamosUtils.Msg.prompt({
                title       : 'WhatsApp',
                mensagem    : 'Digite ou confirme o número:',
                initialValue: movimento.get('PESSOAS_CELULAR') || movimento.get('PESSOAS_TELEFONE')
            });
    
            if(numero === false) { return; }
    
            cleanedNumber = SamosUtils.String.onlyNumbers(numero).replace(/^0/, '');
            
            if(!SamosUtils.String.isTelefoneOuCelular(cleanedNumber)){
                throw 'Digite o número com DDD';
            }
    
            view.initGauge();
    
            const pdf    = await Orcamento.services.Email.imprimir(view, movimento);

            const pdfUrl = configs.getApiNode() + '/' + pdf;
            const texto  =  `Baixe aqui seu orçamento: ${pdfUrl}`
            const url    = `whatsapp://send?phone=55${cleanedNumber}&text=${window.encodeURIComponent(texto)}`
            
            window.open(url, '_blank');

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao encaminhar para o whatsapp');
        }

        view.stopGauge();
    },

    onEmailClick: async function() {
        const view = this.getView();
        const movimento = this.getViewModel().get('model');

        try {
            await Orcamento.services.Email.enviar(view, movimento);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    }
});
