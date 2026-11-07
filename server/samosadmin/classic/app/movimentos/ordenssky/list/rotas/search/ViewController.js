Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.search.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskyrotassearch',

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
                    store.setData([]);
                }

                this.getView().stopGauge(true);
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

        grid.query('displayfield').forEach(title => {
            const value = title.getValue();

            Object.keys(diasSemana).forEach(dia => {
                if(dataInicial && value && value.match(dia)) {
                    const data = momentTz(dataInicial).add(diasSemana[dia], 'days');
                    title.setValue(`${dia} ${data.format('DD/MM')}`);
                }
            });
        });

        this.carregarContadores(grid, dataInicial, diasSemana);
    },

    carregarContadores: function(grid, dataInicial, diasSemana) {
        grid.removerLinhasEmBranco();
        
        document.querySelectorAll('.counter-rotas').forEach(contador => contador.remove());
        
        const linhas = grid.query('form');

        if(linhas.length > 0) {
            linhas.forEach(linha => {
                const values = linha.getValues();
                
                Object.keys(diasSemana).forEach(dia => {
                    const txt          = linha.down(`textfield[title="${dia}"]`);
                    const nomeDia      = SamosUtils.String.clearSpecial(dia).toUpperCase();
                    const input        = txt.getEl().dom.querySelector('input');
                    const parentEl     = input.parentElement;
                    const alocadas     = values[`ALOCADAS_${nomeDia}`];
                    const limite       = values[`LIMITE_${nomeDia}`];
                    const status       = values[`STATUS_${nomeDia}`];
                    const disponiveis  = limite - alocadas;
                    const data         = momentTz(dataInicial).add(diasSemana[dia], 'days');
                    const liberada     = disponiveis > 0 && status == 'T' && (momentTz(data.format()).isSameOrAfter(momentServer().hours(0).minutes(0).seconds(0)));
                    const counter      = document.createElement('div');
                    
                    counter.innerHTML  = alocadas;
                    counter.className  = 'counter-rotas' + (liberada ? '-verde' : '-cinza');
                    input.style.color  = liberada ? 'black'   : '#c1c1c1';
                    input.style.cursor = liberada ? 'pointer' : 'not-allowed';
                    parentEl.appendChild(counter);
                });
            });
        } else {
            setTimeout(() => {
                this.carregarContadores(grid, dataInicial, diasSemana);
            }, 400);
        }
    },

    clickEvent: function(txt) {
        setTimeout(() => {
            txt.getEl().dom.onclick = this.selecionarUsuario.bind(this, txt)
        }, 500);
    },

    selecionarUsuario: function(txt) {
        const nomeDia     = (txt.name || '').split('_')[1];
        const values      = txt.up('form').getForm().getValues();
        const nomeTecnico = values['USUARIOS_' + nomeDia];
        const nomeRota    = (values['CIDADES_NOME'] || '').toUpperCase();
        const alocadas    = values['ALOCADAS_' + nomeDia];
        const limite      = values['LIMITE_'   + nomeDia];
        const status      = values['STATUS_'   + nomeDia];
        const disponiveis = limite - alocadas;
        const dataInicial = momentTz(this.lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');
        const diasSemana  = {
            'Segunda': 0,
            'Terça'  : 1,
            'Quarta' : 2,
            'Quinta' : 3,
            'Sexta'  : 4,
            'Sábado' : 5
        };

        const data = momentTz(dataInicial).add(diasSemana[txt.title], 'days');

        if(
            disponiveis > 0 && 
            status == 'T' && 
            momentTz(data.format()).isSameOrAfter(momentServer().hours(0).minutes(0).seconds(0))
        ) {
            Ext.Msg.confirm('Confirmação', `Deseja selecionar a rota <b>${txt.title} (${data.format('DD/MM')})</b> com técnico <b>${nomeTecnico}</b>?`, btn => {
                if (btn == 'yes') {
                    this.preencherRota({
                        data       : data.format('YYYY-MM-DD'),
                        diaSemana  : txt.title,
                        idRota     : values['ROTAS_ID_'    + nomeDia],
                        nomeRota   : nomeRota,
                        idTecnico  : values['USUARIOS_ID_' + nomeDia],
                        nomeTecnico: nomeTecnico
                    });
                }
            });
        } else if(momentTz(data).isBefore(momentServer().hours(0).minutes(0).seconds(0))) {
            Ext.Note('warning', 'Esta rota está concluída');
        } else if(status != 'T') {
            Ext.Note('warning', 'Esta rota está inativa');
        } else {
            Ext.Note('warning', 'Esta rota já atingiu o limite de locação');
        }
    },

    preencherRota: function(options) {
        const { data, diaSemana, idRota, nomeRota, idTecnico, nomeTecnico } = options;
        const viewAgendamento = this.getViewModel().get('viewAgendamento');
        const vmAgendamento = viewAgendamento.getViewModel();
        
        vmAgendamento.set('agendamento.ORDENSAVARIADOS_AGENDADA', data);
        vmAgendamento.set('agendamento.ORDENS_ID_USUARIOS',       idTecnico);
        vmAgendamento.set('agendamento.USUARIOS_NOME',            nomeTecnico);
        vmAgendamento.set('agendamento.ORDENS_ID_ORDENSROTAS',    idRota);
        vmAgendamento.set('agendamento.ORDENSROTAS_NOME',         nomeRota);
        vmAgendamento.set('agendamento.DIA_SEMANA',               diaSemana);

        this.getView().destroy();

        setTimeout(() => {
            viewAgendamento.lookup('contato').focus(true);
        }, 200);
    },

    onSelecionarClick: function() {
        const grid  = this.lookup('gridordensskyrotas');
        const store = grid.getStore();

        grid.finalizarEdicao();

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge();

                const items = store.getData().items;
                const dataInicial = momentTz(this.lookup('comboSelecionarRota').getValue(), 'DD/MM/YYYY').format('YYYY-MM-DD');

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
