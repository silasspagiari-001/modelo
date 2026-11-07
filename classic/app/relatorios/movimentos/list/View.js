Ext.define('SamosAdmin.relatorios.movimentos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosmovimentoslist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.movimentos.list.ViewController',
        'SamosAdmin.relatorios.movimentos.list.ViewModel'
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
                    xtype: 'container',
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Documento',            
                                    flex: 1,
                                    store: [
                                        [1, 'Orçamento'],
                                        [2, 'Pedido'],
                                        [3, 'NF-e'],
                                        [4, 'Requisição'],
                                        [5, 'Nota Entrada'],
                                        [6, 'Compras'],
                                        [10, 'Nota Consumidor'],
                                        [12, 'Devolução']
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Operação',            
                                    flex: 1,
                                    store: [
                                        [0, 'Tudo'],                
                                        [1, 'Vendas'],
                                        [2, 'Transferências'],
                                        [3, 'Devoluções']
                                    ],
                                    bind: {
                                        value: '{valueOperacao}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',            
                                    flex: 1,
                                    store: [
                                        ['T', 'Todos'],  
                                        ['E', 'Emitidos'],              
                                        ['C', 'Cancelados'],
                                        ['D', 'Devolvidos'],
                                        ['R', 'Recusados']
                                    ],
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'inicio',
                                    callbackFn: 'onBuscarClick',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_NOME', 'valuePessoa'],
                                        ['PESSOAS_ID',   'valueIdPessoa']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoa',
                                    itemId: 'idpessoa'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Emissão'],
                                        [1, 'Pessoas'],
                                        [2, 'Número'],
                                        [3, 'Entrada/Saída'],
                                        [4, 'Operação']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
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