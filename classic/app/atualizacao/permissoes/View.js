Ext.define('SamosAdmin.atualizacao.permissoes.View', {
    extend: 'Ext.window.Window',
    xtype: 'permissoes',

    mixins: [
        'SamosWidgets.container.Smart'
    ],

    requires: [
        'Ext.tree.Panel',
        'SamosAdmin.atualizacao.permissoes.ViewModel',
        'SamosAdmin.atualizacao.permissoes.ViewController',
        'SamosAdmin.atualizacao.permissoes.copiar.View'
    ],

    title: 'Permissões',

    autoShow: true,
    width: 800,
    height: 460,

    layout: {
        type: 'vbox',
        align: 'stretch',
        pack: 'center'
    },

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Copiar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    formgroups: [
        {
            items: [
                {
                    items: [
                        {
                            xtype: 'combobox',
                            fieldLabel: 'Empresa',
                            reference: 'empresa',
                            flex: 7.6,
                            forceSelection: true,
                            editable: false,
                            displayField: 'EMPRESAS_FANTASIA',
                            valueField: 'EMPRESAS_ID',
                            bind: {
                                value: '{selectedEmpresa}',
                                store: '{empresas}',
                                readOnly: '{updating}'
                            },
                            listeners: {
                                change: 'onChangeEmpresa'
                            }
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: 'Mudar Perfil',
                            flex: 3.5,
                            editable: false,
                            forceSelection: true,
                            displayField: 'field2',
                            value: 0,//for supress first change, when set perfil
                            bind: {
                                readOnly: '{readOnly}',
                                value: '{perfil}'
                            },
                            store: [
                                [0, 'Selecione...', 'Usuario'],
                                [1, 'Usuário',      'Usuario'],
                                [2, 'Privilegiado', 'Privilegiado']
                            ],
                            listeners: {
                                change: 'changeProfileDefault'
                            }
                        }
                    ]
                },
                {
                    xtype: 'container',
                    reference: 'tree',
                    flex: 1,
                    scrollable: 'vertical',
                    defaults: {
                        padding: '0'
                    },
                    layout: {
                        type: 'vbox',
                        align: 'stretch',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'permissoestree',
                            flex: 1
                        }
                    ]
                }
            ]
        }
    ],

    constructor: function () {
        this.addController();
        this.reference = this.xtype;
        this.callParent(arguments);
        this.attachReference(this);
        this.addViewModel();
        this.addButtons();
        this.addFormGroups();
    }
});
