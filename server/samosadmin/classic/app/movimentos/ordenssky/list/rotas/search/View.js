Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyrotassearch',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.rotas.search.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.rotas.search.ViewController'
    ],

    title: 'Rotas',
    modelName: 'SamosAdmin.movimentos.ordenssky.ModelRotas',

    controller: 'ordensskyrotassearch',
    viewModel: 'ordensskyrotassearch',

    defaultFocus: 'textfield',
    
    width: 1075,
    height: 450,

    rightbuttons: [
        'Sair'
    ],

    initComponent: function () {
        Ext.apply(this, {
            leftbuttons: [
                {
                    fieldLabel: 'Selecionar Rota',
                    xtype: 'combobox',
                    ui: 'textbold-basic',
                    width: 230,
                    margin: '10 0 0 10',
                    reference: 'comboSelecionarRota',
                    labelAlign: 'left',
                    bind: {
                        readOnly: '{updating}',
                        value: '{valueSelecionarRota}'
                    },
                    listeners: {
                        change: 'loadRotas'
                    },
                    store: (() => {
                        const primeiraSegundaFeiraHaUmAno = momentServer().subtract(1, 'year').day(1);

                        return Array(104).fill().map(() => {
                            return primeiraSegundaFeiraHaUmAno.add(7, 'days').format('DD/MM/YYYY');
                        });
                    })()
                }
            ],

            formgroups: [
                {
                    collapsible: false,
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'gridordensskyrotas',
                            qtdeLinhasMinima: 0,
                            name: 'ORDENS_ROTAS',
                            idProperty: 'ORDENSROTAS_ID_CIDADES',
                            descartarSeVazio: 'CIDADES_NOME',
                            bind: {
                                store: '{ordensskyrotas}'
                            },
                            listeners: {
                                //aposCarregar: 'aposCarregarRotas'
                            },
                            fields: [
                                { hidden: true, name: 'ORDENSROTAS_ID_CIDADES' },
                                {
                                    title: 'Cidade',
                                    flex: 1,
                                    name: 'CIDADES_NOME',
                                    selectOnFocus: false,
                                    readOnly: true
                                },
                                {
                                    title: 'Segunda',
                                    width: 142,
                                    name: 'USUARIOS_SEGUNDA',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                {
                                    title: 'Terça',
                                    width: 142,
                                    name: 'USUARIOS_TERCA',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                {
                                    title: 'Quarta',
                                    width: 142,
                                    name: 'USUARIOS_QUARTA',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                {
                                    title: 'Quinta',
                                    width: 142,
                                    name: 'USUARIOS_QUINTA',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                {
                                    title: 'Sexta',
                                    width: 142,
                                    name: 'USUARIOS_SEXTA',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                {
                                    title: 'Sábado',
                                    width: 142,
                                    name: 'USUARIOS_SABADO',
                                    readOnly: true,
                                    selectOnFocus: false,
                                    listeners: {
                                        afterrender: 'clickEvent'
                                    }
                                },
                                { hidden: true, name: 'USUARIOS_ID_SEGUNDA' },
                                { hidden: true, name: 'USUARIOS_ID_TERCA' },
                                { hidden: true, name: 'USUARIOS_ID_QUARTA' },
                                { hidden: true, name: 'USUARIOS_ID_QUINTA' },
                                { hidden: true, name: 'USUARIOS_ID_SEXTA' },
                                { hidden: true, name: 'USUARIOS_ID_SABADO' },
                                { hidden: true, name: 'ROTAS_ID_SEGUNDA' },
                                { hidden: true, name: 'ROTAS_ID_TERCA' },
                                { hidden: true, name: 'ROTAS_ID_QUARTA' },
                                { hidden: true, name: 'ROTAS_ID_QUINTA' },
                                { hidden: true, name: 'ROTAS_ID_SEXTA' },
                                { hidden: true, name: 'ROTAS_ID_SABADO' },
                                { hidden: true, name: 'STATUS_SEGUNDA' },
                                { hidden: true, name: 'STATUS_TERCA' },
                                { hidden: true, name: 'STATUS_QUARTA' },
                                { hidden: true, name: 'STATUS_QUINTA' },
                                { hidden: true, name: 'STATUS_SEXTA' },
                                { hidden: true, name: 'STATUS_SABADO' },
                                { hidden: true, name: 'LIMITE_SEGUNDA' },
                                { hidden: true, name: 'LIMITE_TERCA' },
                                { hidden: true, name: 'LIMITE_QUARTA' },
                                { hidden: true, name: 'LIMITE_QUINTA' },
                                { hidden: true, name: 'LIMITE_SEXTA' },
                                { hidden: true, name: 'LIMITE_SABADO' },
                                { hidden: true, name: 'ALOCADAS_SEGUNDA' },
                                { hidden: true, name: 'ALOCADAS_TERCA' },
                                { hidden: true, name: 'ALOCADAS_QUARTA' },
                                { hidden: true, name: 'ALOCADAS_QUINTA' },
                                { hidden: true, name: 'ALOCADAS_SEXTA' },
                                { hidden: true, name: 'ALOCADAS_SABADO' }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
