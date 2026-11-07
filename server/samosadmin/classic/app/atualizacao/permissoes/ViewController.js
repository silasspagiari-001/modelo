Ext.define('SamosAdmin.atualizacao.permissoes.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.permissoes',

    onNovoClick: async function (btn, e) {
        SamosUtils.Events.enableWarnReload();

        this.getViewModel().set({
            readOnly: false,
            semPermissoes: false
        });

        return null;
    },
    
    beforeLoadPermissoes: function (store) {
        this.getView().initGauge();
    },

    afterLoadPermissoes: function (store, records, success, operation) {
        this.getView().stopGauge();

        if (success) {
            this.getViewModel().set('semPermissoes', !records[0]);

            if (records && records[0]) {
                records.forEach(function (item) {
                    if (!SamosUtils.Json.tryJsonToObj(item.get('PERMISSOES_ITENS'))) {
                        item.set(
                            'PERMISSOES_ITENS',
                            SamosUtils.Json.objToJson(Ext.create('SamosAdmin.atualizacao.permissoes.defaults.Pattern').getData())
                        );
                    }
                });

                const permissoes = SamosUtils.Json.tryJsonToObj(records[0].get('PERMISSOES_ITENS'));

                this.getViewModel().set('model', records[0]);
                this.getViewModel().set('initialValues', Object.assign({}, records[0].getData()));
                this.setPermissoes(permissoes);

            } else {
                this.getViewModel().set('model', {});
                this.setPermissoes({
                    children: []
                });
            }

        } else {
            this.getViewModel().set('semPermissoes', true);
            Ext.Note('error', 'Erro no servidor');
        }
    },

    onChangeEmpresa: function () {
        setTimeout(() => {
            this.getViewModel().getStore('main').load();
        }, 200);
    },

    changeProfileDefault: function (combo, newValue, oldValue) {
        var profiles = combo.getStore().data.items, i;

        for (i in profiles) {
            if (profiles[i].get('field1') == newValue) {
                profileType = profiles[i].get('field3');
                break;
            }
        }

        this.setProfileDefault(profileType);
    },

    onCopiarClick: function(){
        const vm = this.getViewModel();
        const view = Ext.create({
            xtype: 'permissoescopiar'
        });

        view.getViewModel().set({
            model          : vm.get('model'),
            usuarioDestino : vm.get('usuario'),
            empresaDestino : vm.get('selectedEmpresa'),
            selectedEmpresa: null
        });

        setTimeout(() => {
            view.focus(true);
        }, 200);
    },

    onGravarClick: function (btn, event) {
        var vm = this.getViewModel(),
            dataPermissoes = this.buildPermissoes(),
            model = this.getRecord();

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Gravando...');
                vm.set('semPermissoes', false);

                if(!(model && model.set)) {
                    const dataModel = {
                        'PERMISSOES_ID': 0,
                        'PERMISSOES_ID_EMPRESAS': vm.get('selectedEmpresa')
                    };
                    dataModel['PERMISSOES_ID_USUARIOS'] = vm.get('usuario');
                    model = Ext.create('SamosAdmin.atualizacao.permissoes.Model', dataModel);
                    model.phantom = true;
                }

                model.set('PERMISSOES_ITENS', JSON.stringify(dataPermissoes));
                this.getViewModel().set('model', model);
                this.getView().down('treepanel').collapseAll();
                model.save()
                    .then(record => {
                        //vm.set('perfil', 0);
                        
                        setTimeout(() => {
                            this.onGravacaoSucesso(record);
                        }, 400);
                    })
                    .catch(this.onGravacaoFalha.bind(this))
                    .finally(this.aposGravar.bind(this));
            }
        });
    },

    onGravacaoSucesso: async function (record) { 
        this.callParent(arguments);

        await SamosUtils.Utils.sleep(500);

        if(record.get('PERMISSOES_ID_USUARIOS') == configs.getUsuario().id) {
            if(await SamosUtils.Msg.confirm('O usuário logado sofreu alterações. Recarregar o sistema?')) {
                window.location.reload();
            }
        }
    },

    onExcluirClick: function (btn, event) {
        const model = this.getRecord();

        if(!this.permiteExclusao && !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteExclusao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onExcluirClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            delete this.permiteExclusao;
            
            Ext.Msg.confirmDelete(btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Excluindo...');

                    model.erase()
                        .then(() => {
                            this.getViewModel().get('main').load();
                            Ext.Note('success', 'Registro excluído');
                        })
                        .catch(e => {
                            Ext.Note('error', 'Erro no servidor');
                            console.error(e);
                        })
                        .finally(() => this.getView().stopGauge())
                }
            });
        }
    },

    onCancelarClick: function (btn, e) {
        var vm = this.getViewModel();

        SamosUtils.Events.disableWarnReload();
        this.setReadOnly(true);
        vm.set('perfil', 0);
        vm.set('model', vm.get('initialValues'));
        vm.getStore('main').load();
    },

    setPermissoes: function (permissoes) {
        const treepanel = this.getView().down('permissoestree');
        const pattern = Ext.create('SamosAdmin.atualizacao.permissoes.defaults.Pattern').getData();

        permissoes = permissoes || {};

        if (!permissoes.children) {
            permissoes.children = [];
        }        

        if(configs.getMenuRelatorios()) {
            const indexRelatoriosPattern   = pattern.children.findIndex(node => node.text == 'Relatórios');
            const indexRelatoriosPermissao = permissoes.children.findIndex(node => node.text == 'Relatórios');
            const indexDefault = 4;//posição default de Relatórios no Menu

            //se tiver relatórios detalhados na permissão padrão...
            if(
                pattern.children[indexRelatoriosPattern] && 
                pattern.children[indexRelatoriosPattern].children &&
                pattern.children[indexRelatoriosPattern].children.length
            ) {
                //Retira o menu de Relatórios controlado pelas permissões e coloca um genérico
                pattern.children.splice((indexRelatoriosPattern || indexDefault), 1, {
                    text: 'Relatórios',
                    iconCls: 'x-fa fa-folder',
                    read: 'F'
                });
            }

            //se tiver relatórios detalhados na permissão do usuário...
            if(
                permissoes.children[indexRelatoriosPermissao] && 
                permissoes.children[indexRelatoriosPermissao].children &&
                permissoes.children[indexRelatoriosPermissao].children.length
            ) {
                //Retira o menu de Relatórios controlado pelas permissões e coloca um genérico
                permissoes.children.splice((indexRelatoriosPermissao || indexDefault), 1, {
                    text: 'Relatórios',
                    iconCls: 'x-fa fa-folder',
                    read: 'F'
                });
            }
        }

        for (let i in pattern.children) {
            for (let j in permissoes.children) {
                if (pattern.children[i].text == permissoes.children[j].text) {
                    if (pattern.children[i]/*.children && pattern.children[i].children.length == 0*/) {
                        this.setDefaultProperties(pattern.children[i], permissoes.children[j]);
                    }

                    for (let k in pattern.children[i].children) {
                        for (let l in permissoes.children[j].children) {
                            if (pattern.children[i].children[k].text == permissoes.children[j].children[l].text) {
                                this.setDefaultProperties(pattern.children[i].children[k], permissoes.children[j].children[l]);
                            }
                        }
                    }
                }
            }
        }

        treepanel.getRootNode().removeAll();
        treepanel.getRootNode().appendChild(pattern.children);
    },

    setProfileDefault: function (profileType) {
        var profileType = profileType ? profileType : 'Usuario',
            defaultProfile = Ext.create('SamosAdmin.atualizacao.permissoes.defaults.' + profileType);

        this.setPermissoes(defaultProfile.getData());
    },

    buildPermissoes: function () {
        const rootNodes = this.getView().down('permissoestree').getRootNode().childNodes;
        const objPermissoes = {};
        objPermissoes.children = [];
        
        let k = 0;

        for (let i in rootNodes) {
            const dataGroup = rootNodes[i].data;

            if (
                this.hasReadableChilds(dataGroup.children) || 
                !dataGroup.children || 
                (
                    dataGroup.children && 
                    dataGroup.children.length == 0 && 
                    (
                        dataGroup['read'] === true || 
                        dataGroup['read'] === 'T'
                    )
                )
            ) {
                objPermissoes.children[k] = {};
                this.setDefaultProperties(objPermissoes.children[k], dataGroup);
                objPermissoes.children[k].children = [];
                
                let m = 0;

                for (let j in dataGroup.children) {
                    if (dataGroup.children[j]['read'] === true || dataGroup.children[j]['read'] === 'T') {
                        objPermissoes.children[k].children[m] = {};
                        this.setDefaultProperties(objPermissoes.children[k].children[m], dataGroup.children[j]);
                        m++;
                    }
                }

                k++;
            }
        }

        return objPermissoes;
    },

    hasReadableChilds: function (module) {
        var i, result = false;

        for (i in module) {
            if (module[i]['read'] === true || module[i]['read'] === 'T') {
                result = true;
            }
        }

        return result;
    },

    setDefaultProperties: function (objTarget, objOrigin) {
        var i, properties = [
                'text',
                'module',
                'url',
                'iconCls',
                'isWindow',
                'documento',
                'isLink',
                'read',
                'create',
                'update',
                'destroy'
            ];

        for (i in properties) {
            //se existir a propriedade no treepanel, adiciona ao objeto permissoes
            if (objOrigin[properties[i]] || objOrigin[properties[i]] === false) {
                if(
                    properties[i] == 'read'   || 
                    properties[i] == 'create' || 
                    properties[i] == 'update' || 
                    properties[i] == 'destroy'
                ){
                    objTarget[properties[i]] = objOrigin[properties[i]] === true ? 'T' : 
                                               objOrigin[properties[i]] === 'T'  ? 'T' : 'F';
                } else {
                    objTarget[properties[i]] = objOrigin[properties[i]];
                }
            }
        }
    },

    checkReadOnly: function (field, checked) {
        return !this.getViewModel().get('readOnly');
    },

    validarCabecalho: function () {
        return new Ext.Promise((resolve, reject) => {
            if (!this.getViewModel().get('selectedEmpresa')) {
                Ext.Note('warning', 'Selecione a Empresa');
                this.getView().focus();
                reject();
            } else {
                resolve();
            }
        });
    }
});
