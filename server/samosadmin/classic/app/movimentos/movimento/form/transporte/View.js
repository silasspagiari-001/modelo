Ext.define('SamosAdmin.movimentos.movimento.form.transporte.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentostransporte',

    requires: [
        'SamosAdmin.movimentos.movimento.form.transporte.ViewModel',
        'SamosAdmin.movimentos.movimento.form.transporte.ViewController'
    ],

    title: 'Transporte',
    hidePaging: true,
    width: 900, // 800
    height: 335,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        SamosUtils.Utils.adicionarBotaoImpressao({
            btnName   : 'Imprimir',
            showLayout: true,
            index     : 1,
            visualizar: true,
            view      : this
        });
        
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
                                    width: 95,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Transporte',
                                    tabela: 'transportes',
                                    reference: 'transporte',
                                    proximoFoco: 'nometransporte',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    callbackFn: 'setCepSearchedId',
                                    associations: [
                                        ['MOVIMENTOSENVIO_ID_TRANSPORTES', 'TRANSPORTES_ID'],
                                        ['MOVIMENTOSENVIO_NOME',           'TRANSPORTES_NOME'],
                                        ['MOVIMENTOSENVIO_MODO',           'TRANSPORTES_MODO'],
                                        ['MOVIMENTOSENVIO_CPFCNPJ',        'TRANSPORTES_CPFCNPJ'],
                                        ['MOVIMENTOSENVIO_CEP',            'TRANSPORTES_CEP'],
                                        ['MOVIMENTOSENVIO_ENDERECO',       'TRANSPORTES_ENDERECO'],
                                        ['MOVIMENTOSENVIO_INSCRICAO',      'TRANSPORTES_INSCRICAO'],
                                        ['MOVIMENTOSENVIO_NUMERO',         'TRANSPORTES_NUMERO'],
                                        ['MOVIMENTOSENVIO_BAIRRO',         'TRANSPORTES_BAIRRO'],
                                        ['MOVIMENTOSENVIO_ID_CIDADES',     'TRANSPORTES_ID_CIDADES'],
                                        ['TRANSPORTES_EMAIL',              'TRANSPORTES_EMAIL'],
                                        ['CIDADES_NOME',                   'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',                 'CIDADES_ESTADO'],
                                        ['CIDADES_IBGE',                   'CIDADES_IBGE']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_ID_TRANSPORTES}',
                                        associations: '{transporteAssociations}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'checkTransporteLivre'
                                    }                                    
                                },
                                {
                                    flex: 1,
                                    reference: 'nometransporte',
                                    proximoFoco: 'tipofrete',
                                    fieldLabel: 'Nome do Transporte',
                                    maxLength: 50,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSENVIO_NOME}'
                                    }
                                },
                                {
                                    width: 140,  //110
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Modo',
                                    emptyText: '',
                                    reference: 'tipofrete',
                                    editable: false,                                                                                
                                    proximoFoco: 'cpfcnpj',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hideTrigger: true,                                    
                                    store: [
                                        ['F', 'Destinatário'],
                                        ['C', 'Emitente'],
                                        ['T', 'Terceiros'],
                                        ['S', 'Sem Frete'],
                                        ['D', 'Sem Frete/Dados'],
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_MODO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    reference: 'cpfcnpj',
                                    proximoFoco: 'inscricao',
                                    flex: false,
                                    width: 162,
                                    fieldLabel: 'CPF/CNPJ',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSENVIO_CPFCNPJ}'
                                    }
                                },
                                {
                                    width: 133,
                                    flex: false,
                                    fieldLabel: 'Inscrição',
                                    reference: 'inscricao',
                                    proximoFoco: 'cep',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_INSCRICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '_____-___',
                                    width: 95,
                                    flex: false,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    proximoFoco: 'bairro',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'onSearchCeps',
                                        validitychange: function (txt) {
                                            txt.clearInvalid();
                                        }
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Cidade',
                                    tabela: 'cidades',
                                    reference: 'cidade',
                                    proximoFoco: 'endereco',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'validarCidade',
                                    associations: [
                                        ['CIDADES_NOME',               'CIDADES_NOME'],
                                        ['MOVIMENTOSENVIO_ID_CIDADES', 'CIDADES_ID'],
                                        ['CIDADES_ESTADO',             'CIDADES_ESTADO'],
                                        ['CIDADES_IBGE',               'CIDADES_IBGE']
                                    ],
                                    bind: {
                                        value: '{model.CIDADES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_ID_CIDADES}'
                                    }
                                },
                                {
                                    width: 57,
                                    flex: false,
                                    fieldLabel: 'UF',
                                    bind: '{model.CIDADES_ESTADO}',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    reference: 'estado'
                                },
                                {
                                    flex: false,
                                    width: 300,
                                    fieldLabel: 'Bairro',
                                    reference: 'bairro',
                                    proximoFoco: 'endereco',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 65,
                                    fieldLabel: 'N.º',
                                    reference: 'numero',
                                    proximoFoco: 'motorista',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 149,
                                    flex: false,
                                    fieldLabel: 'Motorista',
                                    reference: 'motorista',
                                    maxLength: 50,
                                    proximoFoco: 'placa',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_MOTORISTA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 135,
                                    flex: false,
                                    reference: 'placa',
                                    proximoFoco: 'placauf',
                                    maxLength: 10,
                                    fieldLabel: 'Placa',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_PLACA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 45,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'placauf',
                                    proximoFoco: 'qtde',
                                    fieldLabel: 'UF',
                                    emptyText: '',
                                    forceSelection: true,
                                    hideTrigger: true,
                                    store: Object.keys(SamosUtils.Info.getEstados()),
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_PLACAUF}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 65,
                                    fieldLabel: 'Qtde',
                                    reference: 'qtde',
                                    proximoFoco: 'especie',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_QUANTIDADE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Espécie',
                                    reference: 'especie',
                                    proximoFoco: 'marca',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_ESPECIE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 125,
                                    fieldLabel: 'Marca',
                                    reference: 'marca',
                                    proximoFoco: 'volumes',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_MARCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 149,
                                    flex: false,
                                    fieldLabel: 'Volumes',
                                    reference: 'volumes',
                                    proximoFoco: 'pesobruto',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_VOLUMES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Peso Bruto',
                                    reference: 'pesobruto',
                                    proximoFoco: 'pesoliquido',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_PESOBRUTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'onPesoNfeChange'
                                    },                                    
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Peso Líquido',
                                    reference: 'pesoliquido',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_PESOLIQUIDO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'onPesoNfeChange'
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
