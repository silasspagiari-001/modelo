Ext.define('SamosAdmin.atualizacao.veiculos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formveiculos', 

    title: 'Veículo',

    requires: [
        'SamosAdmin.atualizacao.veiculos.form.ViewModel'
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
                                    flex: 1,
                                    fieldLabel: 'Renavam',
                                    reference: 'codigoservico',
                                    proximoFoco: 'placa',
                                    maxLength: 11,
                                    bind: {
                                        value: '{model.VEICULO_RENAVAM}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 85,
                                    fieldLabel: 'Placa',
                                    reference: 'placa',
                                    proximoFoco: 'anomodelo',
                                    maxLength: 8,
                                    bind: {
                                        value: '{model.VEICULO_PLACA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Ano/Modelo',
                                    reference: 'anomodelo',
                                    proximoFoco: 'tiposervico',
                                    maxLength: 11,
                                    bind: {
                                        value: '{model.VEICULO_ANOMODELO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo Serviço',
                                    reference: 'tiposervico',
                                    proximoFoco: 'unidadeservico',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.VEICULO_TIPO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['GUINDASTE', 'Guindaste'],
                                            ['MUNCK',     'Munck'],
                                            ['FRETE',     'Frete'],
                                            ['LOCACAO',   'Locação']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    xtype: 'combobox',
                                    fieldLabel: 'Unidade Serviço',
                                    reference: 'unidadeservico',
                                    proximoFoco: 'preco',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.VEICULO_HORADIA}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['H', 'Hora'],
                                            ['D', 'Diária'],
                                            ['U', 'Serviço']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Preço',
                                    reference: 'preco',
                                    proximoFoco: 'adicional',                                    
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.SERVICOS_PRECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: 'Vlr Hora Adicional',
                                    reference: 'adicional',
                                    proximoFoco: 'valorsdf',                                    
                                    xtype: 'samoswidgets-textmoney', 
                                    bind: {
                                        value: '{model.VEICULO_VHA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 100,
                                    fieldLabel: 'Vlr Sáb/Dom/Fer',
                                    reference: 'valorsdf',
                                    proximoFoco: 'iss',
                                    xtype: 'samoswidgets-textmoney', 
                                    bind: {
                                        value: '{model.VEICULO_VSD}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,
                                    fieldLabel: '% Iss',
                                    reference: 'iss',
                                    proximoFoco: 'nome',                                    
                                    xtype: 'samoswidgets-textmoney', 
                                    bind: {
                                        value: '{model.SERVICOS_ISS}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
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
