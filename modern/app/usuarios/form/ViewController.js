Ext.define('SamosAdminModern.usuarios.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.usuariosform',

    initViewModel: function(vm) {
        Ext.defer(() => {
            try {
                this.getView().down('selectfield[label="Tipo"]').setInputValue(
                    configs.getUsuarios().tipos.find(tipo => tipo[0] == vm.get('model.USUARIOS_TIPO'))[1]
                );
            } catch (error) {}
        }, 100);
    },

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
                if(p.text == 'Usuários') {
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

        main.down('panel').setActiveItem('usuarios');
        main.down('container[reference="title"]').setHtml('Usuários');
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
            module: 'usuariosform',
            title: 'Usuario',
            fields: [
                ['USUARIOS_CEP'       , 'CEPS_CEP'],
                ['USUARIOS_ENDERECO'  , 'CEPS_ENDERECO'],
                ['USUARIOS_BAIRRO'    , 'CEPS_BAIRRO'],
                ['CIDADES_NOME'       , 'CEPS_CIDADE'],
                ['USUARIOS_ID_CIDADES', 'CEPS_ID'],
                ['CIDADES_ESTADO'     , 'CEPS_ESTADO'],
                ['CIDADES_IBGE'       , 'CEPS_IBGE']
            ]
        };

        main.down('panel').getActiveItem().getViewModel().set({
            valueConteudo: '',
            valueCidade  : configs.getEmpresa().cidade,
            valueEstado  : configs.getEmpresa().estado,
            valueOrdem   : 0
        })
    },
    
    onEnviarSenhaWhatsAppClick: async function() {
        const model = this.getViewModel().get('model');
        const numero = model.get('USUARIOS_CELULAR');

        cleanedNumber = SamosUtils.String.onlyNumbers(numero).replace(/^0/, '');
        
        if(!SamosUtils.String.isTelefoneOuCelular(cleanedNumber)){
            SamosUtils.Msg.alert('Atenção', 'Número Celular inválido');
            return;
        } 
        
        const texto = window.encodeURIComponent(`*SISTEMA SAMOS* 
USUARIO: ${model.get('USUARIOS_LOGIN')}
SENHA: ${model.get('USUARIOS_SENHA')}`);

        const url   = `whatsapp://send?phone=55${cleanedNumber}&text=${texto}`
        
        window.open(url, '_blank');
    }
});
