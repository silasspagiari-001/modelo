Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Documento', {
    alternateClassName: 'CupomEletronico.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, movimento) {
        movimento.set({
            'MOVIMENTOS_ID_DOCUMENTOS':    documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_NOME':             documento.get('DOCUMENTOS_NOME'),
            'DOCUMENTOS_ALTERAPRECO':      documento.get('DOCUMENTOS_ALTERAPRECO'),
            'DOCUMENTOS_ID_PESSOAS':       documento.get('DOCUMENTOS_ID_PESSOAS'),
            'DOCUMENTOS_LAYOUT':           documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_DESCONTOITEM':     documento.get('DOCUMENTOS_DESCONTOITEM'),
            'DOCUMENTOS_COLETACARTAO':     documento.get('DOCUMENTOS_COLETACARTAO'),
            'DOCUMENTOS_COLETACHEQUE':     documento.get('DOCUMENTOS_COLETACHEQUE'),
            'DOCUMENTOS_COLETAENTREGA':    documento.get('DOCUMENTOS_COLETAENTREGA'),
            'DOCUMENTOS_COLETAOUTRO':      documento.get('DOCUMENTOS_COLETAOUTRO'),
            'MOVIMENTOS_ID_OPERACOES':     documento.get('DOCUMENTOS_ID_OPERACOES'),
            'MOVIMENTOS_ID_PRAZOS':        1,
            'PRAZOS_NOME':                 documento.get('PRAZOS_NOME'),
            'PRAZOS_PARCELAS':             documento.get('PRAZOS_PARCELAS'),
            'PRAZOS_PARCELAMENTO':         documento.get('PRAZOS_PARCELAMENTO'),
            'PESSOAS_TIPO':                documento.get('PESSOAS_TIPO'),
            'CONSUMIDOR_CIDADESNOME':      documento.get('CIDADES_NOME'),
            'CONSUMIDOR_CIDADESESTADO':    documento.get('CIDADES_ESTADO')
        });

        const itensAtualizados = (movimento.get('MOVIMENTOS_ITENS') || []).map(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);
    },

    iniciarVendaConsumidor: function(form) {
        form.getViewModel().set('isVendaConsumidor', true);
        this.setarConsumidorPadrao(form);
    },

    cancelarVendaConsumidor: function(form) {
        form.getViewModel().set('isVendaConsumidor', false);
        this.limparVendaConsumidor(form);
    },

    checkVendaConsumidor: function(form){
        const movimento = form.model;
        const idConsumidor = movimento.get('DOCUMENTOS_ID_PESSOAS');
        const idPessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');

        if(movimento.get('PESSOAS_STATUS') == 'F') {
            Ext.Note('warning', 'Pessoa inativa - Contate Gerência');
            movimento.set({
                'MOVIMENTOS_ID_PESSOAS': '',
                'MOVIMENTOS_NOME':       '',
                'MOVIMENTOS_CPFCNPJ':    '',
                'CIDADES_NOME':          '',
                'CIDADES_ESTADO':        '',
                'MOVIMENTOS_EMAIL':      '',
                'PESSOAS_TELEFONE':      '',
                'MOVIMENTOS_CELULAR':    '',
            });
        }

        if(configs.getMovimentos().carregaVendedorPessoa) { // Pega o usuário (vendedor) do cadastro da pessoa            
            const idVendedor = movimento.get('PESSOAS_ID_USUARIOS') || 0;
            const nmVendedor = movimento.get('USUARIOS_NOMEVENDEDOR') || '';
            const lgVendedor = movimento.get('USUARIOS_LOGINVENDEDOR') || '';
            if(configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) {
                if(nmVendedor) {
                    movimento.set('MOVIMENTOS_ID_USUARIOS', idVendedor);
                    movimento.set('USUARIOS_NOME', nmVendedor);
                    movimento.set('USUARIOS_LOGIN', lgVendedor);
                    const txtUsuario = form.lookup('vendedor');
                    txtUsuario.setValue(nmVendedor);
                    txtUsuario.setSearchedId(nmVendedor);
                    txtUsuario.onTextSearch(txtUsuario, {type: 'script'});
                } else {
                    movimento.set('MOVIMENTOS_ID_USUARIOS', configs.getUsuario().id);
                    movimento.set('USUARIOS_NOME', configs.getUsuario().nome);
                    movimento.set('USUARIOS_LOGIN', configs.getUsuario().login);
                    const txtUsuario = form.lookup('vendedor');
                    txtUsuario.setValue(configs.getUsuario().nome);
                    txtUsuario.setSearchedId(configs.getUsuario().nome);
                    txtUsuario.onTextSearch(txtUsuario, {type: 'script'});
                }    
            }
        }

        if(form.getViewModel().get('readOnly')) { 
            form.getViewModel().set('isVendaConsumidor', idConsumidor == idPessoa);
        }
    },

    limparVendaConsumidor: function(form) {
        const movimento = form.model;

        movimento.set({
            'MOVIMENTOS_ID_PESSOAS': '',
            'MOVIMENTOS_NOME':       '',
            'MOVIMENTOS_CPFCNPJ':    '',
            'CIDADES_NOME':          '',
            'CIDADES_ESTADO':        '',
            'MOVIMENTOS_EMAIL':      '',
            'PESSOAS_TELEFONE':      '',
            'MOVIMENTOS_CELULAR':    '',
        });
    },

    setarConsumidorPadrao: function(form) {
        const movimento = form.model;

        movimento.set({
            'MOVIMENTOS_ID_PESSOAS': movimento.get('DOCUMENTOS_ID_PESSOAS'),
            'MOVIMENTOS_NOME':       '',
            'MOVIMENTOS_CPFCNPJ':    '',
            'CIDADES_NOME':          movimento.get('CONSUMIDOR_CIDADESNOME'),
            'CIDADES_ESTADO':        movimento.get('CONSUMIDOR_CIDADESESTADO'),
            'MOVIMENTOS_EMAIL':      '',
            'PESSOAS_TELEFONE':      '',
            'MOVIMENTOS_CELULAR':    ''
        });
    }
});
