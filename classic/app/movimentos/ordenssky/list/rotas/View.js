Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyrotas',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.rotas.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.rotas.ViewController',
        'SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.View',
        'SamosAdmin.movimentos.ordenssky.list.rotas.associadas.View'
    ],

    title: 'Cadastro de Rotas',
    modelName: 'SamosAdmin.movimentos.ordenssky.ModelRotas',

    controller: 'ordensskyrotas',
    viewModel: 'ordensskyrotas',
    
    height: 450,
    
    rightbuttons: [
        'Gravar',
        'Sair'
    ],
    
    initComponent: function () {
        Ext.apply(this, {
            width: innerWidth - 250,
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
                            qtdeLinhasMinima: 1,
                            name: 'ORDENS_ROTAS',
                            idProperty: 'ORDENSROTAS_ID_CIDADES',
                            descartarSeVazio: 'CIDADES_NOME',
                            janelaDetalhes: {
                                xtype: 'ordensskyrotasdetalhes'
                            },
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
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'cidades',
                                    proximoFoco: 'segunda',
                                    naoFocarAposPesquisar: true,
                                    naoSairSeVazio: true,
                                    buscarPor: 'Genérica',
                                    name: 'CIDADES_NOME',
                                    associations:[
                                        ['CIDADES_NOME',           'CIDADES_NOME'],
                                        ['ORDENSROTAS_ID_CIDADES', 'CIDADES_ID']
                                    ]
                                },
                                {
                                    title: 'Segunda',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'terca',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_SEGUNDA',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_SEGUNDA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SEGUNDA', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
                                    }
                                },
                                {
                                    title: 'Terça',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'quarta',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_TERCA',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_TERCA',        'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_TERCA', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
                                    }
                                },
                                {
                                    title: 'Quarta',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'quinta',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_QUARTA',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_QUARTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_QUARTA', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
                                    }
                                },
                                {
                                    title: 'Quinta',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'sexta',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_QUINTA',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_QUINTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_QUINTA', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
                                    }
                                },
                                {
                                    title: 'Sexta',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'sabado',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_SEXTA',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_SEXTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SEXTA', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
                                    }
                                },
                                {
                                    title: 'Sábado',
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'segunda[linhadebaixo]',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_SABADO',
                                    callbackFn: 'checarLocacoes',
                                    associations:[
                                        ['USUARIOS_SABADO',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SABADO', 'USUARIOS_ID']
                                    ],
                                    triggers: {
                                        option: {
                                            cls: 'x-fa fa-ellipsis-v',
                                            handler: 'exibirOrdensAssociadas'
                                        } 
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
