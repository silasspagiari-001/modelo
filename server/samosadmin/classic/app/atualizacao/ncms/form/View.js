Ext.define('SamosAdmin.atualizacao.ncms.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formncms',

    title: 'Ncm',

    requires: [
        'SamosAdmin.atualizacao.ncms.form.ViewModel',
        'SamosAdmin.atualizacao.ncms.form.ViewController'
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

    formgroups: [
        {
            title: 'Dados Básicos',
            items: [
                {
                    items: [
                        {
                            flex: false,
                            width: 80,
                            fieldLabel: 'Código',
                            reference: 'codigo',
                            bind: {
                                value: '{modelId}'
                            },
                            ui: 'field-readonly',
                            fieldStyle: 'text-align:right;',
                            readOnly: true,

                        },
                        {
                            width: 67,
                            flex: false,
                            fieldLabel: 'Status',
                            reference: 'status',
                            bind: {
                                value: '{model.NCMS_STATUS}',
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
                            fieldLabel: 'NCM',
                            reference: 'ncm',
                            maxLength: 10,
                            proximoFoco: 'aliquotanacional',
                            bind: {
                                value: '{model.NCMS_NCM}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'Nacional',
                            reference: 'aliquotanacional',
                            proximoFoco: 'aliquotaimportado',
                            bind: {
                                value: '{model.NCMS_ALIQUOTANACIONAL}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'Importado',
                            reference: 'aliquotaimportado',
                            proximoFoco: 'aliquotaestadual',
                            bind: {
                                value: '{model.NCMS_ALIQUOTAIMPORTADO}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'Estadual',
                            reference: 'aliquotaestadual',
                            proximoFoco: 'aliquotamunicipal',
                            bind: {
                                value: '{model.NCMS_ALIQUOTAESTADUAL}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'Municipal',
                            reference: 'aliquotamunicipal',
                            proximoFoco: 'versao',
                            bind: {
                                value: '{model.NCMS_ALIQUOTAMUNICIPAL}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Versão',
                            reference: 'versao',
                            proximoFoco: 'cstpis',
                            maxLength: 10,
                            bind: {
                                value: '{model.NCMS_VERSAO}',
                                readOnly: '{readOnly}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            flex: 1,
                            fieldLabel: 'CST PIS',
                            reference: 'cstpis',
                            maxLength: 10,
                            proximoFoco: 'cstcofins',
                            bind: {
                                value: '{model.NCMS_CSTPIS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            fieldLabel: 'CST COFINS',
                            reference: 'cstcofins',
                            maxLength: 10,
                            proximoFoco: 'pis',
                            bind: {
                                value: '{model.NCMS_CSTCOFINS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'PIS',
                            reference: 'pis',
                            proximoFoco: 'cofins',
                            bind: {
                                value: '{model.NCMS_ALIQUOTAPIS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'COFINS',
                            reference: 'cofins',
                            proximoFoco: 'fcp',
                            bind: {
                                value: '{model.NCMS_ALIQUOTACOFINS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            xtype: 'samoswidgets-textmoney',
                            flex: 1,
                            fieldLabel: 'FCP',
                            reference: 'fcp',
                            proximoFoco: 'referencia',
                            bind: {
                                value: '{model.NCMS_ALIQUOTAFCP}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Referência',
                            reference: 'referencia',
                            proximoFoco: 'cest',
                            maxLength: 10,
                            bind: {
                                value: '{model.NCMS_REFERENCIA}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: 1,
                            fieldLabel: 'Cest',
                            reference: 'cest',
                            proximoFoco: 'nome',
                            maxLength: 10,
                            bind: {
                                value: '{model.NCMS_CEST}',
                                readOnly: '{readOnly}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            xtype: 'textarea',
                            reference: 'nome',
                            fieldLabel: 'Nome',
                            maxLength: 512,
                            bind: {
                                value: '{model.NCMS_NOME}',
                                readOnly: '{readOnly}'
                            },
                            anchor: '100%',
                            grow  : true,
                            width : '100%'
                        }
                    ]
                },
            ]
        },
        {
            title: 'Difal',
            layout: 'hbox',
            items: [
                {
                    flex: 1,
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'difalA',
                            qtdeLinhasMinima: 0,
                            name: 'NCMS_DIFALA',
                            idProperty: 'ID',
                            bind: {
                                store: '{difalA}'
                            },
                            fields: [
                                { hidden: true, name: 'ID' },
                                {
                                    title: 'UF',
                                    reference: 'ufA',
                                    flex: 0.5,
                                    xtype: 'textfield',
                                    name: 'UF',
                                    readOnly: true
                                },
                                {
                                    title: '% IVA',
                                    name: 'IVA',
                                    reference: 'ivaA',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'divA',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    title: '% Divisor',
                                    name: 'DIV',
                                    reference: 'divA',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 1,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpA',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% FCP',
                                    name: 'FCP',
                                    reference: 'fcpA',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'difA',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% Difal',
                                    name: 'DIF',
                                    reference: 'difA',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpA[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'component',
                    width: 20
                },
                {
                    flex: 1,
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'difalB',
                            qtdeLinhasMinima: 0,
                            name: 'NCMS_DIFALB',
                            idProperty: 'ID',
                            bind: {
                                store: '{difalB}'
                            },
                            fields: [
                                { hidden: true, name: 'ID' },
                                {
                                    title: 'UF',
                                    reference: 'ufB',
                                    flex: 0.5,
                                    xtype: 'textfield',
                                    name: 'UF',
                                    readOnly: true
                                },
                                {
                                    title: '% IVA',
                                    name: 'IVA',
                                    reference: 'ivaB',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'divB',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% Divisor',
                                    name: 'DIV',
                                    reference: 'divB',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 1,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpB',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% FCP',
                                    name: 'FCP',
                                    reference: 'fcpB',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'difB',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% Difal',
                                    name: 'DIF',
                                    reference: 'difB',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpB[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'component',
                    width: 20
                },
                {
                    flex: 1,
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'difalC',
                            qtdeLinhasMinima: 0,
                            name: 'NCMS_DIFALC',
                            idProperty: 'ID',
                            bind: {
                                store: '{difalC}'
                            },
                            fields: [
                                { hidden: true, name: 'ID' },
                                {
                                    title: 'UF',
                                    reference: 'ufC',
                                    flex: 0.5,
                                    xtype: 'textfield',
                                    name: 'UF',
                                    readOnly: true
                                },
                                {
                                    title: '% IVA',
                                    name: 'IVA',
                                    reference: 'ivaC',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'divC',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% Divisor',
                                    name: 'DIV',
                                    reference: 'divC',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 1,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpC',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% FCP',
                                    name: 'FCP',
                                    reference: 'fcpC',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'difC',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: '% Difal',
                                    name: 'DIF',
                                    reference: 'difC',
                                    maxValue: 99.99,
                                    empty: true,
                                    flex: 0.7,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'fcpC[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
});
