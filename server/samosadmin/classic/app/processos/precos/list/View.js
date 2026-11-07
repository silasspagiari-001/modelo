Ext.define('SamosAdmin.processos.precos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'processosprecos',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.processos.precos.list.ViewController',
        'SamosAdmin.processos.precos.list.ViewModel'
    ],

    constructor: function() {
        Ext.apply(this, {
            leftbuttons: [
                'Processar',
                'Imprimir'
            ],
        
            rightbuttons: [
                'Sair'
            ],
        
            hidePaging: true,
            checkSelection: true,
            selecionarPrimeiroAposBuscar: false,

            gridListeners: {
                beforeitemclick: 'onBeforeItemClick',
                selectionchange: 'onSelectionChange'
            },
        
            toolbar: [
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Fornecedor',
                    tabela: 'pessoas',
                    complement: 'idfornecedor',
                    reference: 'fornecedor',
                    buscarPor: 'Genérica',
                    valueTipo: configs.getPessoas().tipos.find(tipo=> tipo[1] == 'Fornecedores')[0],
                    associations: [
                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                        ['PESSOAS_ID',   'PESSOAS_ID']
                    ]    
                },
                {
                    hidden: true,
                    fieldLabel: 'IdFornecedor',
                    itemId: 'idfornecedor'
                },
                {
                    flex: 1,
                    xtype: 'samoswidgets-textsearch',
                    fieldLabel: 'Grupo',
                    tabela: 'grupos',
                    complement: 'idgrupo',
                    reference: 'grupo',
                    buscarPor: 'Genérica',
                    associations: [
                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                        ['GRUPOS_ID',   'GRUPOS_ID']
                    ]    
                },
                {
                    hidden: true,
                    fieldLabel: 'IdGrupo',
                    itemId: 'idgrupo'
                },
                {
                    fieldLabel: 'Atualizar',
                    width: 155,
                    store: configs.getProdutos().atualizaPreco
                        .filter(opcao => opcao.ativo)
                        .map(opcao => {
                            return [opcao.field, opcao.title];
                        }),
                    listeners: {
                        change: 'onChangeAtualizar'
                    }
                },
                {
                    width: 130,
                    xtype: 'combobox',
                    fieldLabel: 'Ajuste',
                    reference: 'acaoacrescrimo',
                    forceSelection: true,
                    editable: false,
                    displayField: 'field2',
                    store: [
                        ['0', 'Acréscimo'],
                        ['1', 'Decréscimo']
                    ],
                    bind: {
                        value: '{valueAcresDecrescimo}'
                    },
                    listeners: {
                        added: function(field){
                            field.setValue('0');
                        },
                        change: 'onChangeAjusteTipo'
                    }
                },
                {
                    fieldLabel: 'Percentual',
                    xtype: 'samoswidgets-textmoney',
                    width: 130,
                    listeners: {
                        change: 'onChangePercentual'
                    }
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],
        
            columns: {
                items: [
                    {
                        width: 90,
                        text: 'Código',
                        dataIndex: 'PRODUTOS_ID',
                        align: 'right'
                        
                    },
                    {
                        width: 50,
                        text: 'Un',
                        dataIndex: 'PRODUTOS_UNIDADE',
                        align: 'center'
                    },
                    {
                        flex: 1,
                        text: 'Descrição',
                        dataIndex: 'PRODUTOS_NOME',
                        align: 'left'
                    },
                    {
                        width: 120,
                        text: '% Atual',  // % Comissão atual
                        xtype: 'moneycolumn',
                        dataIndex: 'SALDOS_COMISSAO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaComissao}'
                        },
                        renderer: function(value, meta, record) {
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: '% Novo',  // % Comissão nova
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_COMISSAO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaComissao}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: '% MarkUp',
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_MARKUP',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaMarkUp}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: 'R$ Custo',
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_CUSTO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaCusto}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },                    
                    {
                        width: 120,
                        text: '% Atual', // Margem Atual
                        xtype: 'moneycolumn',
                        dataIndex: 'SALDOS_MARGEM',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaMargem}'
                        },
                        renderer: function(value, meta, record) {
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: '% Novo', // Margem Nova
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_MARGEM',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaMargem}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: '% Atual', // Margem Mínima Atual
                        xtype: 'moneycolumn',
                        dataIndex: 'SALDOS_MARGEMMINIMA',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaMargemMinima}'
                        },
                        renderer: function(value, meta, record) {
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 140,
                        text: '% Novo', // Margem Mínima Nova
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_MARGEMMINIMA',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaMargemMinima}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: 'R$ PreçoMin',
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_PRECOMINIMO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaPrecoMinimo}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 120,
                        text: 'R$ Preço',
                        xtype: 'moneycolumn',
                        dataIndex: 'SALDOS_PRECO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaPreco}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "color: green;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    },
                    {
                        width: 140,
                        text: 'R$ Novo Preço',
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_PRECO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaNovoPreco}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "color: purple;";
                            if(record.get('SALDOS_PRECO') != value) {
                                return Ext.util.Format.maskRenderer('#9.990,00', true, true)(value);
                            } else {
                                return '';
                            }
                        }
                    },
                    {
                        width: 120,
                        text: 'R$ Prazo',
                        xtype: 'moneycolumn',
                        dataIndex: 'NOVO_PRAZO',
                        align: 'right',
                        bind: {
                            hidden: '{hideColunaPrazo}'
                        },
                        renderer: function(value, meta, record) {
                            meta.style = "background-color: yellow;";
                            return Ext.util.Format.maskRenderer('#9.990,00', true)(value);
                        }
                    }
                ]
            }
        });

        this.callParent(arguments);
    }
});