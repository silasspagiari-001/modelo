Ext.define('SamosAdmin.consultas.logsusuarios.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.logsusuarios',

    getServerUrl: function() {
        return 'server/consultas/logsusuarios';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            usuario: vm.get('valueIdUsuario'),
            inicio : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final  : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
            tipo   : vm.get('valueTipo')
        };
    },

    onItemDblClick: async function(grid, record) {
        if(record.get('LOGS_STATUS') != 'P') { return }

        const partes = (record.get('LOGS_NOME') || '|||').split('|');
        const tema = configs.getTema();

        const win = Ext.create({
            xtype: 'window',
            title: 'Ponto',
            autoShow: true,
            model: record,
            width: 480,
            height: 240,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',
            tbar: [
                '->',
                {
                    xtype: 'button',
                    text: 'Gravar',
                    margin: '7',
                    width: 100,
                    ui: 'primary-' + tema,
                    handler: async () => {
                        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                            win.initGauge();
    
                            try {
                                const entradamanha  = win.down('textfield[reference="entradamanha"]').getValue();
                                const saidaalmoco   = win.down('textfield[reference="saidaalmoco"]').getValue();
                                const retornoalmoco = win.down('textfield[reference="retornoalmoco"]').getValue();
                                const saidatarde    = win.down('textfield[reference="saidatarde"]').getValue();
        
                                const queryUpdate = await SamosUtils.Request.nodeApi({
                                    url: `/processos/usuarios/expediente/${record.get('LOGS_ID_PESSOAS')}`,
                                    method: 'PUT',
                                    data: {
                                        'ponto'  : 'update',
                                        'LOGS_ID': record.get('LOGS_ID'),
                                        'LOGS_NOME': `${entradamanha}|${saidaalmoco}|${retornoalmoco}|${saidatarde}`
                                    }
                                });

                                record.set(queryUpdate.results[0]);
    
                                win.destroy();
                                Ext.Note('success', 'Ponto atualizado');
    
                            } catch (error) {
                                win.stopGauge();
                                SamosUtils.Msg.error(error, 'Falha ao atualizar ponto');
                            }
                        }
                    }
                },
                {
                    xtype: 'button',
                    text: 'Sair',
                    margin: '7 10 7 7',
                    width: 100,
                    ui: 'secondary-' + tema,
                    handler: () => {
                        win.destroy();
                    }
                }
            ],
            items: [
                {
                    xtype: 'container',
                    margin: '15 15 5 15',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'datefield',
                            fieldLabel: 'Data',
                            readOnly: true,
                            ui: 'field-readonly',
                            value: record.get('LOGS_DATA'),
                            width: 100
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Usuário',
                            readOnly: true,
                            ui: 'field-readonly',
                            value: record.get('USUARIOS_LOGIN'),
                            flex: 1
                        }
                    ]
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    margin: '0 15 15 15',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Entrada Manhã',
                            reference: 'entradamanha',
                            value: partes[0],
                            flex: 1
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Saída Almoço',
                            reference: 'saidaalmoco',
                            value: partes[1],
                            flex: 1
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Retorno Almoço',
                            reference: 'retornoalmoco',
                            value: partes[2],
                            flex: 1
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Saída Tarde',
                            reference: 'saidatarde',
                            value: partes[3],
                            flex: 1
                        }
                    ]
                }
            ]
        });

        Ext.asap(() => {
            win.focus(true);
        });

        return win;
    }
});
