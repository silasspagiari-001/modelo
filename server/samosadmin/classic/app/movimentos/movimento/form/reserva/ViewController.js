Ext.define('SamosAdmin.movimentos.movimento.form.reserva.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosreserva',

    onAlterarClick: function() {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
        if(
            !this.permiteAlteracao && 
            movimento.get('ROMANEIOS_MOVEIS') &&
            movimento.get('ROMANEIOS_MOVEIS').length > 0
        ){
            Ext.Note('warning', 'Este movimento está em romaneio');

            if(configs.getUsuario().privilegiado) {
                this.permiteAlteracao = true;
                movimento.getProxy().setExtraParam('senhaNivel', 'true');
                this.onAlterarClick();
            } else {
                const nivel = 1;
    
                Ext.create({ xtype: 'samoswidgets-senhanivel' })
                    .iniciar(nivel)
                    .then(() => {
                        this.permiteAlteracao = true;
                        movimento.getProxy().setExtraParam('senhaNivel', 'true');
                        this.onAlterarClick();
                    })
                    .catch(() => {/*acao ao sair*/});
            }
        } else {
            const id      = movimento.get('MOVIMENTOS_ID');
            const numero  = movimento.get('MOVIMENTOS_NUMERO');
            const serie   = movimento.get('MOVIMENTOS_SERIE');
            const empresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

            movimento.getProxy().setExtraParam('log', `PUT /movimentos/reserva/${id} (${numero}|${serie}|${empresa})`);
            SamosUtils.Events.enableWarnReload();
            this.setReadOnly(false);
            this.doDefaultFocus();
            delete this.permiteAlteracao;
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        if(Movimento.services.Reserva.validar()){
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', async btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Gravando...');

                    let statusReserva;
                    let reservasCD = '';
                    let assunto = '';
                    let proCor = '';

                    this.getViewModel().get('produtos').data.items.forEach(produto => {

                        if((produto.get('PRODUTOS_MARCA') || '') != '') {
                            proCor = ' cor: ' + produto.get('PRODUTOS_MARCA');
                        } else {
                            proCor = '';
                        }
                        if(configs.getClientName() == 'prudenmoveis' &&
                           (configs.getMovimentos().usuariosNotificarReserva || []).length > 0 &&
                            produto.get('MOVIMENTOSITENS_ID_EMPRESAS') == 1) {  // Se reserva CD
                            reservasCD += ('0' + produto.get('MOVIMENTOSITENS_QUANTIDADE').toString()).slice(-2) + ' ' +
                                          produto.get('PRODUTOS_UNIDADE') + ' - ' +
                                          produto.get('PRODUTOS_NOME') + proCor + ' (Cód: ' +
                                          produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ') - PV ' +
                                          movimento.get('MOVIMENTOS_NUMERO') + ' ' +
                                          (movimento.get('EMPRESAS_FANTASIA').split('-')[1]) + '\n';                                        
                            assunto = `Reserva PV ${movimento.get('MOVIMENTOS_NUMERO')} ${movimento.get('EMPRESAS_FANTASIA').split('-')[1]} entrega dia ${moment(produto.get('MOVIMENTOSITENS_DATAENTREGA')).format('DD/MM/YYYY')}`
                        }

                        if(produto.get('MOVIMENTOSITENS_DEPOSITO') == 0) { //se a reserva estiver aguardando
                            produto.set('MOVIMENTOSITENS_DEPOSITO', 1); //coloca como realizada
                            statusReserva = 'T';
                        }
                    });

                    if(reservasCD.length > 0) {
                        await this.notificarUsuarios(assunto, reservasCD);
                    }

                    if(statusReserva == 'T'){
                        movimento.set('RESERVAS_STATUS', 'T');

                        const btnOpcoes = formMovimento.down('button[text="Opções"]');
                        const menuReservas = Array.from(document.querySelectorAll('.x-menu-item-text.x-menu-item-text-menu-clean-blue.x-menu-item-indent-no-separator')).filter(item => item.innerHTML == 'Reserva')[0];

                        if(btnOpcoes) {
                            btnOpcoes.getEl().dom.style.backgroundColor = '';
                            btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                        }

                        if(menuReservas){
                            menuReservas.parentElement.style.backgroundColor = '';
                        }
                    }

                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento, false);

                    movimento.save()
                        .then(() => Ext.Note('success', 'Gravado com sucesso'))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(this.onSairClick.bind(this));
                }
            });
        };
    },

    atualizarSaldo: function(txt, empresa){
        const selection = txt.up('form').getForm();
        const produto = selection.getValues();
        
        this.getView().initGauge('Atualizando saldo...');

        SamosUtils.Request.nodeApi({
            url: `/consultas/saldoproduto`,
            query: {
                empresa: empresa.get('EMPRESAS_ID'),
                produto: produto['MOVIMENTOSITENS_ID_PRODUTOS']
            },
            method: 'GET'
        })
        .done(res => {
            produto['SALDOS_DISPONIVEL'] = res.results[0]['SALDOS_DISPONIVEL'];
            selection.setValues(produto);
            txt.up('form').down('field[reference^="reservar"]').focus(true);
        })
        .fail(err => {
            Ext.Note('error', 'Erro no servidor');
            console.error(err);
        })
        .always(() => this.getView().stopGauge());
    },

    validarReserva: function(txt){
        setTimeout(() => {
            const selection = txt.up('form').getForm();
            const produto = selection.getValues();
            const reservado = grams(txt.getValue());
            const comprado = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
    
            if(reservado > comprado) {
                Ext.Note('warning', 'Quantidade máxima: ' + comprado / 1000);
                setTimeout(() => {
                    produto['MOVIMENTOSITENS_ENTREGUE'] = '';
                    selection.setValues(produto);
                    txt.up('form').down('field[reference^="reservar"]').focus(true);
                }, 200);
            } else if(reservado <= 0){
                Ext.Note('warning', 'Quantidade inválida');
                setTimeout(() => {
                    produto['MOVIMENTOSITENS_ENTREGUE'] = '';
                    selection.setValues(produto);
                    txt.up('form').down('field[reference^="reservar"]').focus(true);
                }, 200);
            }
        }, 200);
    },

    notificarUsuarios: async function(assunto, reservasCD) {
        try {
            const usuarios = configs.getMovimentos().usuariosNotificarReserva || [];
            const horaAtual = parseInt(momentServer().format('HH'));
            const saudacaoTurno = horaAtual >= 18 ? 'Boa noite\n' :
                                  horaAtual >= 12 && horaAtual < 18 ? 'Boa tarde\n' :
                                 'Bom dia\n';
            const notificacoes = usuarios.map((usuario, index) => {
                return Ext.create('SamosAdmin.movimentos.notificacao.Model', {
                    'NOTIFICACAO_ID'         : (index + 1) * -1,
                    'NOTIFICACAO_ID_DESTINO' : usuario,
                    'NOTIFICACAO_NOME'       : assunto,
                    'NOTIFICACAO_HORAAVISAR' : momentServer().format('HH:mm'),
                    'NOTIFICACAO_MENSAGEM'   : `${saudacaoTurno}${reservasCD}`
                }).data;
            });
    
            await SamosUtils.Request.nodeApi({
                url: '/notificacao/lote',
                method: 'POST',
                data: notificacoes
            });

        } catch(error) {
            console.error(error);
        }
    }

});
