Ext.define('SamosAdmin.relatorios.vendasservicosmes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendasservicosmeslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.vendasservicosmes.list.ViewController',
        'SamosAdmin.relatorios.vendasservicosmes.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    proximoFoco: 'final',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    proximoFoco: 'usuarioi',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                }                                                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoai',
                                    proximoFoco: 'idpessoaf',
                                    reference: 'pessoai',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valuePessoai}'
                                    }
                                },                
                                {
                                    fieldLabel: 'Código', //'IdPessoai',
                                    fieldStyle: 'text-align:right;',
                                    itemId: 'idpessoai',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    hidden: configs.getClientName() != 'prudenaco',  
                                    width: 65,                          
                                    bind: {
                                        value: '{valueIdPessoai}'
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
