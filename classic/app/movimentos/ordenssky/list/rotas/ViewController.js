Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyrotas',

    loadRotas: function(combo, dataInicial) {
        this.getView().initGauge();
    
        SamosUtils.Request.nodeApi({
            url: `/ordenssky/rotas`,
            method: 'GET',
            query: {
                dataInicial: momentTz(dataInicial, 'DD/MM/YYYY').format('YYYY-MM-DD')
            }
        })
        .done(res => {
            setTimeout(() => {
                const store = this.lookup('gridordensskyrotas').getStore();
                
                if(res.results.length > 0) {
                    store.setData(res.results);
                } else {
                    Ext.Msg.confirm('Confirmação', 'Rota ainda não cadastrada. Copiar da anterior?', btn => {
                        if (btn == 'yes') {
                            this.copiarRotaAnterior(dataInicial);
                        } else {
                            store.setData([]);
                        }
                    });
                }

                this.getView().stopGauge(true);
            }, 300);
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);

            setTimeout(() => {
                const store = this.lookup('gridordensrotas').getStore();

                store.setData([]);

                this.getView().stopGauge();
            }, 300);
        });
    },

    copiarRotaAnterior: function(dataInicial) {
        this.getView().initGauge();

        const dataAnterior = momentTz(dataInicial, 'DD/MM/YYYY').subtract(7, 'days');
    
        SamosUtils.Request.nodeApi({
            url: `/ordenssky/rotas`,
            method: 'GET',
            query: {
                dataInicial: dataAnterior.format('YYYY-MM-DD')
            }
        })
        .done(res => {
            setTimeout(() => {
                const store = this.lookup('gridordensskyrotas').getStore();
                
                if(res.results.length > 0) {
                    res.results = res.results.map(rota => {
                        rota['ROTAS_ID_DOMINGO'] = '';
                        rota['ROTAS_ID_QUARTA']  = '';
                        rota['ROTAS_ID_QUINTA']  = '';
                        rota['ROTAS_ID_SABADO']  = '';
                        rota['ROTAS_ID_SEGUNDA'] = '';
                        rota['ROTAS_ID_SEXTA']   = '';
                        rota['ROTAS_ID_TERCA']   = '';

                        return rota;
                    });

                    store.setData(res.results);
                } else {
                    Ext.Note('warning', 'Não há rotas na semana anterior');
                }

                this.getView().stopGauge();
            }, 300);
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);

            setTimeout(() => {
                const store = this.lookup('gridordensskyrotas').getStore();

                store.setData([]);

                this.getView().stopGauge();
            }, 300);
        });
    },

    aposCarregarRotas: function(grid) {
        const dataInicial = momentTz(this.lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');
        const diasSemana = {
            'Segunda': 0,
            'Terça'  : 1,
            'Quarta' : 2,
            'Quinta' : 3,
            'Sexta'  : 4,
            'Sábado' : 5
        };

        if(dataInicial) {
            grid.query('displayfield').forEach(title => {
                const value = title.getValue();
    
                Object.keys(diasSemana).forEach(dia => {
                    if(value && value.match(dia)) {
                        const data = momentTz(dataInicial).add(diasSemana[dia], 'days');
                        title.setValue(`${dia} ${data.format('DD/MM')}`);
                    }
                });
            });
            
            this.bloquearRotasAntigas(grid, dataInicial, diasSemana);
        }
    },

    bloquearRotasAntigas: function(grid, dataInicial, diasSemana) {
        const linhas = grid.query('form');

        if(linhas.length > 0) {
            linhas.forEach(linha => {
                Object.keys(diasSemana).forEach(dia => {
                    const txt   = linha.down(`textfield[title="${dia}"]`);
                    const input = txt.getEl().dom.querySelector('input');
                    const data  = momentTz(dataInicial).add(diasSemana[dia], 'days');

                    if(momentTz(data.format()).isSameOrAfter(momentServer().hours(0).minutes(0).seconds(0))) {
                        txt.selectOnFocus = true;
                        txt.setReadOnly(false);
                        input.style.color = 'black';
                        grid.config.fields.find(field => field.title == dia).readOnly = false;
                    } else {
                        txt.selectOnFocus = false;
                        txt.setReadOnly(true);
                        input.style.color = '#c1c1c1';
                        grid.config.fields.find(field => field.title == dia).readOnly = true;
                    }
                });
            });
        } else {
            setTimeout(() => {
                this.bloquearRotasAntigas(grid, dataInicial, diasSemana);
            }, 400);
        }
    },

    checarLocacoes: function(txt, tecnico) {
        const grid     = this.lookup('gridordensskyrotas');
        const store    = grid.getStore();
        const rota     = grid.getSelection().getValues();
        const nomeDia  = SamosUtils.String.clearSpecial(txt.title).toUpperCase();
        const idRota   = rota['ROTAS_ID_' + nomeDia];
        const alocadas = rota['ALOCADAS_' + nomeDia];
        
        if(alocadas > 0 && !this.liberarAlteracao) {
            const text = alocadas == 1 ? 'ordem' : 'ordens'
            const msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  `Esta rota está atribuída a ${alocadas} ${text} de serviço.<br><br>
                        Deseja realocar todas as OS associadas para o técnico ${tecnico.get('USUARIOS_LOGIN')}?`
            });

            const dialog = Ext.Msg.confirm('Aviso', msgCmp, btn => {
                if (btn == 'yes') {
                    this.getView().initGauge();

                    grid.finalizarEdicao();

                    const items = store.getData().items;
                    const dataInicial = momentTz(this.lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');
    
                    SamosUtils.Request.nodeApi({
                        url: `/ordenssky/rotas`,
                        method: 'POST',
                        data: items.map(item => item.data),
                        query: {
                            dataInicial: dataInicial,
                            realocar: idRota,
                            tecnico: tecnico.get('USUARIOS_ID')
                        }
                    })
                    .done(res => {
                        Ext.Note('success', 'Rotas gravadas com sucesso');
    
                        setTimeout(() => {
                            const store = grid.getStore();
            
                            store.setData(res.results);
            
                            this.getView().stopGauge();
                            this.getView().up('ordenssky').getController().onBuscarClick();
                        }, 300);
                    })
                    .fail(err => {
                        Ext.Note('error', 'Erro no servidor');
                        console.error(err);
                        this.getView().stopGauge();
                    });
                } else {
                    txt.setValue(txt.oldSearchedId);
                    this.liberarAlteracao = true;
                    txt.onTextSearch(txt, { keyCode: 9 });
                }
            });

            dialog.down('button[text="Sim"]').setStyle({
                backgroundColor:'red',
                borderColor: 'red'
            });
        } else {
            this.liberarAlteracao = false;
        }
    },

    exibirOrdensAssociadas: function(txt, event) {
        const diaSemana = (txt.name || '').split('_')[1];
        const values = txt.up('form').getValues();
        const tecnico = values['USUARIOS_' + diaSemana];
        const cidade = values['CIDADES_NOME'];

        const view = Ext.create({
            xtype: 'ordensskyrotasassociadas',
            title: `Ordens alocadas para <b>${tecnico}</b> em <b>${cidade} (${txt.title})</b>`
        });

        view.getViewModel().set({
            'rota'   : values['ROTAS_ID_' + diaSemana]
        });

        view.focus(true);
    },

    onGravarClick: function() {
        const grid  = this.lookup('gridordensskyrotas');
        const store = grid.getStore();

        grid.finalizarEdicao();

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge();

                const items = store.getData().items;
                const dataInicial = momentTz(this.lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD')

                SamosUtils.Request.nodeApi({
                    url: `/ordenssky/rotas`,
                    method: 'POST',
                    data: items.map(item => item.data),
                    query: {
                        dataInicial: dataInicial
                    }
                })
                .done(res => {
                    Ext.Note('success', 'Rotas gravadas com sucesso');

                    setTimeout(() => {
                        const store = grid.getStore();
        
                        store.setData(res.results);
        
                        this.getView().stopGauge();
                    }, 300);
                })
                .fail(err => {
                    Ext.Note('error', 'Erro no servidor');
                    console.error(err);
                    this.getView().stopGauge();
                });
            }
        });
    }
});
