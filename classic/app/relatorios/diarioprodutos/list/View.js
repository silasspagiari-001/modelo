Ext.define('SamosAdmin.relatorios.diarioprodutos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosdiarioprodutoslist',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.relatorios.diarioprodutos.list.ViewController',
        'SamosAdmin.relatorios.diarioprodutos.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    flex: 3,
                                    reference: 'inicio',
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    flex: 3,
                                    reference: 'final',
                                    bind: {
                                        value: '{valueFinal}'
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
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutoi',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID',   'valueIdProdutoi']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    proximoFoco: 'grupoi',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID',   'valueIdProdutof']
                                    ],
                                    valorPadraoAposLimpar: 999999,
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutof',
                                    itemId: 'idprodutof'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1.5,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupoi',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',   'valueIdGrupoi']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupoi',
                                    itemId: 'idgrupoi'
                                },
                                {
                                    flex: 1.5,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',   'valueIdGrupof']
                                    ],
                                    valorPadraoAposLimpar: 999999,
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupof',
                                    itemId: 'idgrupof'
                                },
                                {
                                    flex: 3,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo ',
                                    reference: 'tipomovimento',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Saídas'],
                                        ['1', 'Entradas'],
                                        ['2', 'Tudo']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                }

                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    },
    toolbar: [
        
    ]
});
