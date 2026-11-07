Ext.define('SamosAdmin.movimentos.movimento.form.dadosimportacao.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosdadosimportacao',

    requires: [
        'SamosAdmin.movimentos.movimento.form.dadosimportacao.ViewModel',
        'SamosAdmin.movimentos.movimento.form.dadosimportacao.ViewController'
    ],

    title: 'Dados da Importação',
    hidePaging: true,
    width: 750, // 800
    height: 230,

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
                                    width: 180,
                                    flex: false,
                                    fieldLabel: 'Número Declaração (DI)',
                                    reference: 'di',
                                    proximoFoco: 'datadi',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_DI}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    fieldLabel: 'Data Registro DI',
                                    reference: 'datadi',
                                    proximoFoco: 'dtdesembarque',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSENVIO_DATADI}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    fieldLabel: 'Data Desembarque',
                                    reference: 'dtdesembarque',
                                    proximoFoco: 'viaimportacao',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOSENVIO_DTDESEMBARQUE}'
                                    }
                                },
                                {
                                    width: 230, 
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Via de transporte',
                                    emptyText: '',
                                    reference: 'viatransporte',
                                    editable: false,                                                                                
                                    proximoFoco: 'cpfcnpj',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hideTrigger: true,                                    
                                    store: [
                                        ['01', 'Marítima'],
                                        ['02', 'Fluvial'],
                                        ['03', 'Lacustre'],
                                        ['04', 'Aérea'],
                                        ['05', 'Postal'],
                                        ['06', 'Ferroviária'],
                                        ['07', 'Rodoviária'],
                                        ['08', 'Conduto/Rede Transmissão'],
                                        ['09', 'Meios Próprios'],
                                        ['10', 'Entrada/Saída Ficta'],
                                        ['11', 'Courier'],
                                        ['12', 'Em Mãos'],
                                        ['13', 'Por Reboque']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_VIATRANSPORTE}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    width: 180,
                                    flex: false,
                                    fieldLabel: 'Local Desembarque',
                                    reference: 'desembarque',
                                    proximoFoco: 'ufdesembarque',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_DESEMBARQUE}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 45,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'ufdesembarque',
                                    proximoFoco: 'codigoexp',
                                    fieldLabel: 'UF',
                                    emptyText: '',
                                    forceSelection: true,
                                    hideTrigger: true,
                                    store: Object.keys(SamosUtils.Info.getEstados()),
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_UFDESEMBARQUE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 140,
                                    flex: false,
                                    fieldLabel: 'Código Exportador',
                                    reference: 'codexportador',
                                    proximoFoco: 'codfabricante',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_CODEXPORTADOR}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 140,
                                    flex: false,
                                    fieldLabel: 'Código Fabricante',
                                    reference: 'codfabricante',
                                    proximoFoco: 'intermediario',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_CODFABRICANTE}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 160, 
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Intermédio',
                                    emptyText: '',
                                    reference: 'intermediario',
                                    editable: false,                                                                                
                                    proximoFoco: 'cpfcnpj',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hideTrigger: true,                                    
                                    store: [
                                        ['1', 'Por Conta Própria'],
                                        ['2', 'Por Conta e Ordem'],
                                        ['3', 'Por Encomenda']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOSENVIO_INTERMEDIARIO}',
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
