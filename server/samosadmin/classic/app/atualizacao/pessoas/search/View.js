Ext.define('SamosAdmin.atualizacao.pessoas.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'pessoassearch',

    requires: [
        'SamosAdmin.atualizacao.pessoas.search.ViewModel',
        'SamosAdmin.atualizacao.pessoas.search.ViewController'
    ],

    title: 'Pessoas',

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    constructor: function(){
        let isRomaneioMoveis = Ext.$('formromaneiosmoveis')[0] ? true : false;
        let isMontagem = (isRomaneioMoveis ? (Ext.$('formromaneiosmoveis')[0].getViewModel().get('isMontagem') ? true : false) : false);
        let isMovimento = Ext.$('formmovimentos')[0] ? true : false;


        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    flex: 3
                },
                {
                    fieldLabel: 'Ordem',
                    width: 125,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [9, 'Fantasia'],                        
                        [2, 'Endereço'],
                        [3, 'Email'],
                        [4, 'CPF/CNPJ'],
                        [7, 'Cidade'],
                        [8, 'Telefone'],
                        [5, 'Código'],
                        [6, 'Genérica']
                    ]
                },
                {
                    fieldLabel: 'Tipo',                     
                    width: 172,
                    hidden: (configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor && configs.getClientName() == 'prudenmoveis'),
                    store: isRomaneioMoveis ? (isMontagem ? configs.getPessoas().tipos.filter(tipo => tipo[1].match(/Montadores/)) 
                                            : configs.getPessoas().tipos.filter(tipo => tipo[1].match(/Transportadores/))) 
                                            : configs.getPessoas().tipos.concat([['', 'Todos']])
                },        
                {
                    fieldLabel: 'Status',
                    width: 110,
                    store: [
                        [0, 'Ativos'],
                        [1, 'Inativos'],
                        [2, 'Todos']
                    ]
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],

            columns: [
                {
                    width: 100,
                    text: 'Código',
                    dataIndex: 'PESSOAS_ID',
                    align: 'right',
                    renderer: function(value, meta, record) {
                        if(configs.getClientName() == 'racaforte') {
                            if ((record.get('PESSOAS_PROPRIEDADES') || '').length > 1) {
                                return '(P) ' + value;
                            } else {
                                return value;
                            }    
                        } else {
                            if ((record.get('PESSOAS_PROPRIEDADES') || '').length > 0) {
                                return '(P) ' + value;
                            } else {
                                return value;
                            }    
                        }
                    }    
                },
                {
                    flex: 5,
                    text: 'Nome',
                    dataIndex: 'PESSOAS_NOME'
                },
                {
                    width: 150,
                    text: 'CPF/CNPJ',
                    xtype: 'cpfcnpjcolumn',
                    dataIndex: 'PESSOAS_CPFCNPJ'
                },
                {
                    width: 60,
                    text: 'UF',
                    dataIndex: 'CIDADES_ESTADO'
                },
                {
                    xtype: 'actioncolumn',
                    width: 60,
                    text: 'Prop',
                    align: 'center',
                    hidden: (!configs.getPessoas().propriedades || !isMovimento),
                    items: [{
                        iconCls: 'x-fa fa-list',
                        handler: function(grid, rowIndex, colIndex) {
                            var record = grid.getStore().getAt(rowIndex);
                            if((record.get('PESSOAS_PROPRIEDADES') || []).length > 0 ||
                               ((record.get('PESSOAS_PROPRIEDADES') || []).length > 1 && configs.getMovimentos().autoEnvioSefaz)) {
                                const janelaPropriedades = Ext.create({
                                    xtype: 'propriedadessearch',
                                    title: 'Propriedades ' + record.get('PESSOAS_NOME')
                                });
                        
                                janelaPropriedades.getViewModel().set({
                                    model: record
                                });    
                            }
                        }
                    }]
                }
            ],
        
            footPanel: [
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 0 0 15',
                    style : 'font-weight: bold;color:blue;',
                    bind: {
                        text: '({gridpessoassearch.selection.PESSOAS_FANTASIA}) '+
                              '{gridpessoassearch.selection.PESSOAS_ENDERECO}, '+
                              '{gridpessoassearch.selection.CIDADES_NOME}, ' +
                              '{gridpessoassearch.selection.CIDADES_ESTADO}, ' + 
                              '{gridpessoassearch.selection.PESSOAS_CEP}'
                    }
                }
            ]            

        });

        this.callParent(arguments);
    }

});
