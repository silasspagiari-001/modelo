Ext.define('SamosAdmin.atualizacao.operacoes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formoperacoes',

    title: 'Operação',

    requires: [
        'SamosAdmin.atualizacao.operacoes.form.ViewModel'
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
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 70, //100
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    proximoFoco: 'nome',
                                    emptyText: '000000',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 6,
                                    minLength: 6,
                                    msgTarget: 'none',
                                    bind: {
                                        value: '{model.OPERACOES_ID}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'checarSeExiste'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,  // 90
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.OPERACOES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 0.8,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'aplicacao',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.OPERACOES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Aplicação',
                                    flex: 0.7,
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacao',
                                    proximoFoco: 'finalidade',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['APLICACOES_NOME',          'APLICACOES_NOME'],
                                        ['OPERACOES_ID_APLICACOES',  'APLICACOES_ID']
                                    ],
                                    bind: {
                                        value: '{model.APLICACOES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.OPERACOES_ID_APLICACOES}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Centro de Custo',
                                    flex: 0.7,
                                    tabela: 'custos',
                                    reference: 'centrocusto',
                                    proximoFoco: 'prazo',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['CUSTOS_NOME',          'CUSTOS_NOME'],
                                        ['OPERACOES_ID_CUSTOS',  'CUSTOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.CUSTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.OPERACOES_ID_CUSTOS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Prazo',
                                    flex: 1,
                                    tabela: 'prazos',
                                    reference: 'prazo',
                                    proximoFoco: 'tipo',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRAZOS_NOME',          'PRAZOS_NOME'],
                                        ['OPERACOES_ID_PRAZOS',  'PRAZOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PRAZOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 100,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'estoque',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_TIPO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['E', 'Entrada'],
                                            ['S', 'Saída']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 100,
                                    xtype: 'combobox',
                                    fieldLabel: 'Estoque',
                                    reference: 'estoque',
                                    proximoFoco: 'financeiro',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_ESTOQUE}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['D', 'Debita'],
                                            ['C', 'Credita'],
                                            ['N', 'Nulo']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 127,
                                    xtype: 'combobox',
                                    fieldLabel: 'Financeiro',
                                    reference: 'financeiro',
                                    proximoFoco: 'acao',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_FINANCEIRO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['P', 'Pagar'],
                                            ['R', 'Receber'],
                                            ['N', 'Nulo'],
                                            ['O', 'Orçamento']
                                        ]
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ação',
                                    reference: 'acao',
                                    proximoFoco: 'baixa',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_ACAO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['VN', 'VN-Venda Normal'],
                                            ['CN', 'CN-Compra Normal'],
                                            ['DV', 'DV-Devolução de Venda'],
                                            ['DC', 'DC-Devolução de Compra'],
                                            ['TS', 'TS-Transferência Saída'],
                                            ['TE', 'TE-Transferência Entrada'],
                                            ['IM', 'IM-Importação'],
                                            ['IN', 'IN-Industrialização'],
                                            ['BO', 'BO-Bonificação'],
                                            ['AI', 'AI-Ativo Imobilizado'],
                                            ['NG', 'NG-Não gera Gráfico']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 180,
                                    xtype: 'combobox',
                                    fieldLabel: 'Finalidade',
                                    reference: 'finalidade',
                                    proximoFoco: 'cstpis',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_FINALIDADE}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['N', 'Normal'],
                                            ['A', 'Ajuste'],
                                            ['D', 'Devolução'],
                                            ['C', 'Complementar']
                                        ]
                                    }
                                }
                            ]
                        },
                        // inicio do insert
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Cst PIS',
                                    reference: 'cstpis',
                                    proximoFoco: 'cstcofins',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_CSTPIS}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['01','01-stpisValorAliquotaNormal'],
                                            ['02','02-stpisValorAliquotaDiferenciada'],
                                            ['03','03-stpisQtdeAliquotaUnidade'],
                                            ['04','04-stpisMonofaticaAliquotaZero'],
                                            ['05','05-stpisValorAliquotaPorST'],
                                            ['06','06-stpisAliquotaZero'],
                                            ['07','07-stpisIsentaContribuicao'],
                                            ['08','08-stpisSemIncidenciaContribuicao'],
                                            ['09','09-stpisSuspensaoContribuicao'],
                                            ['49','49-stpisOutrasOperacoesSaida'],
                                            ['50','50-stpisOperCredExcRecTribMercInt'],
                                            ['51','51-stpisOperCredExcRecNaoTribMercInt'],
                                            ['52','52-stpisOperCredExcRecExportacao'],
                                            ['53','53-stpisOperCredRecTribNaoTribMercInt'],
                                            ['54','54-stpisOperCredRecTribMercIntEExportacao'],
                                            ['55','55-stpisOperCredRecNaoTribMercIntEExportacao'],
                                            ['56','56-stpisOperCredRecTribENaoTribMercIntEExportacao'],
                                            ['60','60-stpisCredPresAquiExcRecTribMercInt'],
                                            ['61','61-stpisCredPresAquiExcRecNaoTribMercInt'],
                                            ['62','62-stpisCredPresAquiExcExcRecExportacao'],
                                            ['63','63-stpisCredPresAquiRecTribNaoTribMercInt'],
                                            ['64','64-stpisCredPresAquiRecTribMercIntEExportacao'],
                                            ['65','65-stpisCredPresAquiRecNaoTribMercIntEExportacao'],
                                            ['66','66-stpisCredPresAquiRecTribENaoTribMercIntEExportacao'],
                                            ['67','67-stpisOutrasOperacoes_CredPresumido'],
                                            ['70','70-stpisOperAquiSemDirCredito'],
                                            ['71','71-stpisOperAquiComIsensao'],
                                            ['72','72-stpisOperAquiComSuspensao'],
                                            ['73','73-stpisOperAquiAliquotaZero'],
                                            ['74','74-stpisOperAqui_SemIncidenciaContribuicao'],
                                            ['75','75-stpisOperAquiPorST'],
                                            ['98','98-stpisOutrasOperacoesEntrada'],
                                            ['99','99-stpisOutrasOperacoes'],
                                            ['00','00-stpisNenhum']
                                        ]
                                    }
                                },
                                {
                                    flex: 1,                                    
                                    xtype: 'combobox',
                                    fieldLabel: 'Cst COFINS',
                                    reference: 'cstcofins',
                                    proximoFoco: 'prazo',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.OPERACOES_CSTCOFINS}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['01','01-stcofinsValorAliquotaNormal'],
                                            ['02','02-stcofinsValorAliquotaDiferenciada'],
                                            ['03','03-stcofinsQtdeAliquotaUnidade'],
                                            ['04','04-stcofinsMonofaticaAliquotaZero'],
                                            ['05','05-stcofinsValorAliquotaPorST'],
                                            ['06','06-stcofinsAliquotaZero'],
                                            ['07','07-stcofinsIsentaContribuicao'],
                                            ['08','08-stcofinsSemIncidenciaContribuicao'],
                                            ['09','09-stcofinsSuspensaoContribuicao'],
                                            ['49','49-stcofinsOutrasOperacoesSaida'],
                                            ['50','50-stcofinsOperCredExcRecTribMercInt'],
                                            ['51','51-stcofinsOperCredExcRecNaoTribMercInt'],
                                            ['52','52-stcofinsOperCredExcRecExportacao'],
                                            ['53','53-stcofinsOperCredRecTribNaoTribMercInt'],
                                            ['54','54-stcofinsOperCredRecTribMercIntEExportacao'],
                                            ['55','55-stcofinsOperCredRecNaoTribMercIntEExportacao'],
                                            ['56','56-stcofinsOperCredRecTribENaoTribMercIntEExportacao'],
                                            ['60','60-stcofinsCredPresAquiExcRecTribMercInt'],
                                            ['61','61-stcofinsCredPresAquiExcRecNaoTribMercInt'],
                                            ['62','62-stcofinsCredPresAquiExcExcRecExportacao'],
                                            ['63','63-stcofinsCredPresAquiRecTribNaoTribMercInt'],
                                            ['64','64-stcofinsCredPresAquiRecTribMercIntEExportacao'],
                                            ['65','65-stcofinsCredPresAquiRecNaoTribMercIntEExportacao'],
                                            ['66','66-stcofinsCredPresAquiRecTribENaoTribMercIntEExportacao'],
                                            ['67','67-stcofinsOutrasOperacoes_CredPresumido'],
                                            ['70','70-stcofinsOperAquiSemDirCredito'],
                                            ['71','71-stcofinsOperAquiComIsensao'],
                                            ['72','72-stcofinsOperAquiComSuspensao'],
                                            ['73','73-stcofinsOperAquiAliquotaZero'],
                                            ['74','74-stcofinsOperAqui_SemIncidenciaContribuicao'],
                                            ['75','75-stcofinsOperAquiPorST'],
                                            ['98','98-stcofinsOutrasOperacoesEntrada'],
                                            ['99','99-stcofinsOutrasOperacoes'],
                                            ['00','00-stcofinsNenhum']                                            
                                        ]
                                    }
                                }
                            ]
                        },                        
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Baixa ÀVista',
                                    reference: 'baixa',
                                    bind: {
                                        value: '{model.OPERACOES_BAIXAVISTA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'NF Complemento',
                                    reference: 'complementar',
                                    bind: {
                                        value: '{model.OPERACOES_COMPLEMENTAR}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Calcula Icms',
                                    reference: 'icms',
                                    bind: {
                                        value: '{model.OPERACOES_ICMS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Calcula Ipi',
                                    reference: 'ipi',
                                    bind: {
                                        value: '{model.OPERACOES_IPI}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Calcula Subst',
                                    reference: 'st',
                                    bind: {
                                        value: '{model.OPERACOES_ST}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Calcula PisCofins',
                                    reference: 'pis',
                                    bind: {
                                        value: '{model.OPERACOES_PISCOFINS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },                                
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: '^ Total',
                                    reference: 'sobretotal',
                                    bind: {
                                        value: '{model.OPERACOES_SOBRETOTAL}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Custo Médio',
                                    reference: 'custo',
                                    bind: {
                                        value: '{model.OPERACOES_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Cfop Única',
                                    reference: 'unica',
                                    bind: {
                                        value: '{model.OPERACOES_UNICA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
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
