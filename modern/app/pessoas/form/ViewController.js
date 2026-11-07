Ext.define('SamosAdminModern.pessoas.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pessoasform',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();

        main.getViewModel().set({
            hideVoltar : false,
            hideGravar : true,
            hideNovo   : true
        })

        const permissoes = JSON.parse(configs.getPermissao()['PERMISSOES_ITENS']);

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Atualização').children) {
                if(p.text == 'Pessoas') {
                    main.getViewModel().set({
                        hideExcluir: p.destroy == 'F',
                        hideAlterar: p.update == 'F'
                    });
                }
            }
        } catch (e) {
            main.getViewModel().set({
                hideExcluir: true,
                hideAlterar: true
            });
        }
    },

    onExcluirClick: async function() {
        const view = this.getView();

        if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')) {
            try {
                view.initGauge();
                await this.getViewModel().get('model').erase();
                this.onVoltarClick();
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
            }, 100)
        }
    },

    onGravarClick: async function() {
        const view = this.getView();
        const main = view.up('main');

        if(this.validarModel() && await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            try {
                view.initGauge();
                await this.getViewModel().get('model').save();

                main.getViewModel().set({
                    hideVoltar : false,
                    hideExcluir: false,
                    hideAlterar: false,
                    hideGravar : true,
                    hideNovo   : true
                });
                
                this.getViewModel().set({
                    'readOnly': true,
                    'initialValues': Object.assign({}, this.getViewModel().get('model').data)
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

    onVoltarClick: function() {
        const main = this.getView().up('main');

        if(!this.getViewModel().get('readOnly')) {
            this.getViewModel().get('model').set(this.getViewModel().get('initialValues'))
        }

        main.down('panel').setActiveItem('pessoas');
        main.down('container[reference="title"]').setHtml('Pessoas');
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

    onCepClick: function () {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('ceps');
        main.down('container[reference="title"]').setHtml('CEP');

        main.down('panel').getActiveItem().target = {
            module: 'pessoasform',
            title: 'Pessoa',
            fields: [
                ['PESSOAS_CEP'       , 'CEPS_CEP'],
                ['PESSOAS_ENDERECO'  , 'CEPS_ENDERECO'],
                ['PESSOAS_BAIRRO'    , 'CEPS_BAIRRO'],
                ['CIDADES_NOME'      , 'CEPS_CIDADE'],
                ['PESSOAS_ID_CIDADES', 'CEPS_ID'],
                ['CIDADES_ESTADO'    , 'CEPS_ESTADO'],
                ['CIDADES_IBGE'      , 'CEPS_IBGE']
            ]
        };

        main.down('panel').getActiveItem().getViewModel().set({
            valueConteudo: '',
            valueCidade  : configs.getEmpresa().cidade,
            valueEstado  : configs.getEmpresa().estado,
            valueOrdem   : 0
        })
    },

    onCepCobrancaClick: function () {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('ceps');
        main.down('container[reference="title"]').setHtml('CEP');

        main.down('panel').getActiveItem().target = {
            module: 'pessoasform',
            title: 'Pessoa',
            fields: [
                ['PESSOAS_CEPCOBRANCA'       , 'CEPS_CEP'],
                ['PESSOAS_ENDERECOCOBRANCA'  , 'CEPS_ENDERECO'],
                ['PESSOAS_BAIRROCOBRANCA'    , 'CEPS_BAIRRO'],
                ['CIDADES_NOMECOBRANCA'      , 'CEPS_CIDADE'],
                ['PESSOAS_ID_CIDADESCOBRANCA', 'CEPS_ID'],
                ['CIDADES_ESTADOCOBRANCA'    , 'CEPS_ESTADO'],
                ['CIDADES_IBGECOBRANCA'      , 'CEPS_IBGE']
            ]
        };

        main.down('panel').getActiveItem().getViewModel().set({
            valueConteudo: '',
            valueCidade  : configs.getEmpresa().cidade,
            valueEstado  : configs.getEmpresa().estado,
            valueOrdem   : 0
        })
    },

    onComprasClick: function () {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('pessoascompras');
        main.down('container[reference="title"]').setHtml('Compras');

        const vm = main.down('panel').getActiveItem().getViewModel();

        vm.set({
            empresa: configs.getEmpresa().id,
            pessoa : this.getViewModel().get('model.PESSOAS_ID')
        });

        Ext.asap(async () => {
            const compras = await vm.get('main').load();

            vm.set('total', Ext.util.Format.maskRenderer("R$ #9.990,00", true, true)(compras[0].get('MOVIMENTOSITENS_TOTALGERAL')))
        });
    }
});
