Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formassistencias',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.assistencias.form.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.assistencias.form.ViewController'
    ],

    title: 'Assistência Técnica',
    hidePaging: true,
    width: 850,
    height: 380,

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        
        Ext.apply(this, {
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 132
                        }
                    },
                    items: [
                        {   
                            items: [
                                {
                                    width: 80,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }    
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.ORDENS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    xtype: 'textfield',
                                    flex: 2,
                                    fieldLabel: 'Descrição',
                                    reference: 'descricao',
                                    proximoFoco: 'observacoes',
                                    maxLength: 100,
                                    bind: {
                                        value: '{model.ORDENS_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Inclusão',
                                    reference: 'inclusao',
                                    proximoFoco: 'observacoes',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_EMISSAO}',
                                    },
                                    xtype: 'datefield'    
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    height: 200,
                                    xtype: 'textarea',
                                    reference: 'observacoes',
                                    fieldLabel: 'Assistencia Técnica',
                                    maxLength: 512,
                                    bind: {
                                        value: '{model.ORDENS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    },
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%'
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
