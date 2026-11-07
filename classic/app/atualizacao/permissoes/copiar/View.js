Ext.define('SamosAdmin.atualizacao.permissoes.copiar.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'permissoescopiar',

    requires: [
        'SamosAdmin.atualizacao.permissoes.copiar.ViewModel',
        'SamosAdmin.atualizacao.permissoes.copiar.ViewController'
    ],

    title: 'Copiar Permissões',

    controller: 'permissoescopiar',
    viewModel: 'permissoescopiar',
    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    width: 300,
    height: 235,

    rightbuttons: [
        'Copiar',
        'Sair'
    ],

    initComponent: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Usuário',
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    proximoFoco: 'Empresa',
                                    buscarPor: 'Genérica',
                                    proximoFoco: 'empresa',
                                    bind: {
                                        value: '{model.USUARIOS_LOGIN}'
                                    },
                                    associations: [
                                        ['USUARIOS_LOGIN', 'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID',    'USUARIOS_ID']
                                    ]           
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Empresa',
                                    reference: 'empresa',
                                    clicarNoProximoFoco: true,
                                    proximoFoco: 'copiar',
                                    flex: 7.6,
                                    editable: false,
                                    forceSelection: true,
                                    displayField: 'EMPRESAS_FANTASIA',
                                    valueField: 'EMPRESAS_ID',
                                    bind: {
                                        value: '{selectedEmpresa}',
                                        store: '{empresas}'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
