Ext.define('SamosAdmin.movimentos.promocoes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formpromocoes',

    requires: [
        'SamosAdmin.movimentos.promocoes.form.ViewModel',
        'SamosAdmin.movimentos.promocoes.form.ViewController'
    ],

    title: 'Promoção',

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Produtos',
        'Imprimir'
    ],

    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    bind: {
                                        value: '{modelId}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.PROMOCOES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 6,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'inicio',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.PROMOCOES_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                },
                                {
                                    xtype: 'datefield',
                                    width: 135,
                                    flex: false,
                                    fieldLabel: 'Início',
                                    reference: 'inicio',
                                    proximoFoco: 'termino',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PROMOCOES_EMISSAO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 135,
                                    flex: false,
                                    fieldLabel: 'Término',
                                    reference: 'termino',
                                    proximoFoco: 'custotecnico',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PROMOCOES_VALIDADE}'
                                    },
                                    listeners: {
                                        blur: 'validarDatas'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Custo Técnico',
                                    reference: 'custotecnico',
                                    mask: '#9.999.990,000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'desconto',
                                    listeners: {
                                        keydown: 'onCustoTecnicoChange'
                                    },
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_CUSTOTECNICO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: '% Desc Pix/Din',
                                    reference: 'desconto',
                                    mask: '#9.999.990,000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'descontoA',
                                    listeners: {
                                        keydown: 'onDescontoChange'
                                    },
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_DESCONTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: '% Desc 1 a 3x',
                                    reference: 'descontoA',
                                    mask: '#9.999.990,000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'descontoB',
                                    listeners: {
                                        keydown: 'onDescontoAChange'
                                    },
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_DESCONTOA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: '% Desc 4 a 10x',
                                    reference: 'descontoB',
                                    mask: '#9.999.990,000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'descontoC',
                                    listeners: {
                                        keydown: 'onDescontoBChange'
                                    },
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_DESCONTOB}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 110,
                                    fieldLabel: '% Desc 11 e 12x',
                                    reference: 'descontoC',
                                    mask: '#9.999.990,000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'indice',
                                    listeners: {
                                        keydown: 'onDescontoCChange'
                                    },
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_DESCONTOC}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Índice',
                                    reference: 'indice',
                                    mask: '#9.999.990,0000',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'parcelas',
                                    hidden: true, //configs.getMovimentos().promocaoBasica,
                                    bind: {
                                        value: '{model.PROMOCOES_INDICE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Parcelas',
                                    xtype: 'numberfield',
                                    reference: 'parcelas',
                                    proximoFoco: 'empresasselecionadas',
                                    hideTrigger: true,
                                    flex: false,
                                    minValue: 0,
                                    width: 60,
                                    hidden: true,//configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PROMOCOES_PARCELAS}'
                                    }
                                },
                                {
                                    xtype: 'tagfield',
                                    fieldLabel: 'Selecione as empresas',
                                    emptyText: '',
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        value: '{model.PROMOCOES_EMPRESAS}',
                                        readOnly: '{readOnly}'
                                    },
                                    store: (function(){
                                        const cfgPromocao = configs.getMovimentos().promocao;
                                        const empresasPermissoes = Ext.$('combobox[reference="comboempresa"]')[0].getStore().data.items.map(empresa => empresa.get('EMPRESAS_ID'));
                                        
                                        if(cfgPromocao && cfgPromocao['PROMOCOES_EMPRESAS']) {
                                            const empresas = cfgPromocao['PROMOCOES_EMPRESAS'];
                                            return empresas.split('|');
                                        } else {
                                            return empresasPermissoes;
                                        }
                                    })(),
                                    reference: 'empresasselecionadas',
                                    displayField: 'EMPRESAS_ID',
                                    valueField: 'EMPRESAS_ID',
                                    collapseOnSelect: true,
                                    filterPickList: true,
                                    queryMode: 'local',
                                    publishes: 'value',
                                    listeners: {
                                        change: 'iniciarEdicao'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'PROMOCOES_ITENS',
                            idProperty: 'PROMOCOESITENS_ID',
                            descartarSeVazio: 'PROMOCOESITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'calcularProduto'
                            },
                            fields: [
                                { hidden: true, name: 'PROMOCOESITENS_ID' },
                                {
                                    title: 'Produto',
                                    width: 80, // 100
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    proximoFoco: 'rspromocao',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararProduto',
                                    name: 'PROMOCOESITENS_ID_PRODUTOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['PROMOCOESITENS_ID_PRODUTOS',  'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',               'PRODUTOS_NOME'],
                                        ['PRODUTOS_MARCA',              'PRODUTOS_MARCA'],
                                        ['PRODUTOS_APLICACAO',          'PRODUTOS_APLICACAO'],
                                        ['PRODUTOS_UNIDADE',            'PRODUTOS_UNIDADE'],
                                        ['PRECOMINIMO_DB',              'PRECOMINIMO_DB'],
                                        ['SALDOS_PRECO',                'SALDOS_PRECO'],
                                        ['SALDOS_CUSTO',                'SALDOS_CUSTO']
                                    ]
                                },
                                {
                                    title: 'Nome do Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    title: 'Marca',
                                    width: 120,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_MARCA',
                                    hidden: !configs.getMovimentos().promocaoBasica,                                    
                                    readOnly: true
                                },
                                {
                                    title: 'Qtde',
                                    name: 'PROMOCOESITENS_CUSTOTECNICO',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: { textAlign: 'right' },
                                    proximoFoco: 'rspromocao',
                                    width: 45, // 85
                                    hidden: configs.getMovimentos().promocaoBasica,
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true,
                                    title: 'R$ Mínimo',
                                    name: 'PRECOMINIMO_DB',
                                    width: 85,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'rSVenda',
                                    hidden: configs.getMovimentos().promocaoBasica,
                                    readOnly: true
                                },
                                {
                                    empty: true,
                                    title: 'R$ Venda',
                                    name: 'SALDOS_PRECO',
                                    width: 85,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'rspromocao',
                                    readOnly: true
                                },
                                {
                                    empty: true, // Anterior - mantido por compatibilidade
                                    title: configs.getMovimentos().promocaoBasica ? 'Promoção' : 'R$ PixDin',
                                    name: 'PROMOCOESITENS_VALOR',
                                    width: 95,
                                    xtype: 'samoswidgets-textmoney',
                                    reference: 'rspromocao',
                                    proximoFoco: configs.getMovimentos().promocaoBasica ? 'produto[linhadebaixo]' : 'perpix',
                                    listeners: {
                                        blur: 'setarCustoTecnico'
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '%PixDin',
                                    reference: 'perpix',
                                    name: 'DESCONTO_CALCULADO', 
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    empty: true,
                                    proximoFoco: 'valorA',
                                    width: 70,
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true, // Valor A
                                    title: 'R$ 1-3x',
                                    name: 'PROMOCOESITENS_VALORA',
                                    reference: 'valorA',
                                    width: 95,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: configs.getMovimentos().promocaoBasica ? 'produto[linhadebaixo]' : 'descontoA',
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    listeners: {
                                        blur: 'setarCustoTecnico'
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% 1-3x',
                                    name: 'DESCONTO_CALCULADOA', 
                                    reference: 'descontoA',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#90,000',
                                    empty: true,
                                    proximoFoco: 'valorB',
                                    width: 70,
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true, // Valor B
                                    title: 'R$ 4-10x',
                                    name: 'PROMOCOESITENS_VALORB',
                                    reference: 'valorB',
                                    width: 95,
                                    hidden: configs.getMovimentos().promocaoBasica,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: configs.getMovimentos().promocaoBasica ? 'produto[linhadebaixo]' : 'descontoB',
                                    listeners: {
                                        blur: 'setarCustoTecnico'
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% 4-10x',
                                    name: 'DESCONTO_CALCULADOB', 
                                    reference: 'descontoB',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    empty: true,
                                    proximoFoco: 'valorC',
                                    width: 72,
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true, // Valor C
                                    title: 'R$ 11/12x',
                                    name: 'PROMOCOESITENS_VALORC',
                                    reference: 'valorC',
                                    width: 95,
                                    hidden: configs.getMovimentos().promocaoBasica,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: configs.getMovimentos().promocaoBasica ? 'produto[linhadebaixo]' : 'descontoC',
                                    listeners: {
                                        blur: 'setarCustoTecnico'
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% 11/12x',
                                    name: 'DESCONTO_CALCULADOC', 
                                    reference: 'descontoC',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    empty: true,
                                    width: 74,
                                    hidden: configs.getMovimentos().promocaoBasica,                                    
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                { hidden: true, name: 'PROMOCOESITENS_EMPRESAS' },
                                { hidden: true, name: 'SALDOS_CUSTO' }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);
    }
});
