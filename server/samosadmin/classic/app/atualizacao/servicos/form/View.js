Ext.define('SamosAdmin.atualizacao.servicos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formservicos', 

    title: 'Serviço',

    requires: [
        'SamosAdmin.atualizacao.servicos.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir'
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
                    title: 'Dados Básicos',
                    items:[
                        {
                            items: [
                                {
                                    flex: false, 
                                    width: 80,
                                    fieldLabel: 'Controle',
                                    reference: 'codigo',
                                    bind: {
                                        value: '{modelId}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.SERVICOS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 100,
                                    fieldLabel: 'Código',
                                    reference: 'codigoservico',
                                    proximoFoco: 'nome',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.SERVICOS_CODIGO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'iss',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.SERVICOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },  
                                {
                                    flex: false,
                                    width: 60,
                                    fieldLabel: '% Iss',
                                    reference: 'iss',
                                    proximoFoco: 'preco',                                    
                                    xtype: 'samoswidgets-textmoney', 
                                    bind: {
                                        value: '{model.SERVICOS_ISS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Preço',
                                    reference: 'preco',
                                    proximoFoco: 'descricao',                                    
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.SERVICOS_PRECO}',
                                        readOnly: '{readOnly}'
                                    }
                                }                                      
                            ]
                        }
                    ]
                },
                {
                    title: 'Descrição do serviço',
                    layout: 'hbox',            
                    items: [
                        {
                            xtype: 'container',

                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10',
                            height: 335,
                            flex: 1,
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    height: 350,
                                    lines: 10,
                                    lineHeight: 30,
                                    maxLength: 50,
                                    reference: 'descricao',
                                    proximoFoco: 'iss',
                                    bind: {
                                        value: '{model.SERVICOS_DESCRICAO}',
                                        readOnly: '{readOnly}'
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
