Ext.define('SamosAdmin.movimentos.ordensveiculos.services.Documento', {
    alternateClassName: 'Ordemveiculos.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, ordemveiculos) {
        ordemveiculos.set({
            'ORDENS_ID_DOCUMENTOS':     documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_ID_PESSOAS':    documento.get('DOCUMENTOS_ID_PESSOAS'),
            'DOCUMENTOS_LAYOUT':        documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_ALTERAPRECO':   documento.get('DOCUMENTOS_ALTERAPRECO'),
            'ORDENS_ID_OPERACOES':      documento.get('DOCUMENTOS_ID_OPERACOES'),
            'ORDENS_ID_PRAZOS':         documento.get('OPERACOES_ID_PRAZOS'),
            'ORDENS_ID_PESSOAS':        documento.get('DOCUMENTOS_ID_PESSOAS'),
            'CONSUMIDOR_CIDADESID':     documento.get('PESSOAS_ID_CIDADES'),
            'CONSUMIDOR_CIDADESNOME':   documento.get('CIDADES_NOME'),
            'CONSUMIDOR_CIDADESESTADO': documento.get('CIDADES_ESTADO'),
        });

        const itensAtualizados = (ordemveiculos.get('ORDENS_PRODUTOSITENS') || []).map(item => {
            item['ORDENSPRODUTOS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        ordemveiculos.set('ORDENS_PRODUTOSITENS', itensAtualizados);
    },

    iniciarOSConsumidor: function(form) {
        form.getViewModel().set('isOSConsumidor', true);
        this.setarConsumidorPadrao(form);
    },

    cancelarOSConsumidor: function(form) {
        form.getViewModel().set('isOSConsumidor', false);
        this.limparOSConsumidor(form);
    },

    limparOSConsumidor: function(form) {
        const ordem = form.model;

        ordem.set({
            'ORDENS_ID_PESSOAS': '',
            'ORDENS_NOME'      : '',
            'ORDENS_CPFCNPJ'   : '',
            'CIDADES_NOME'     : '',
            'CIDADES_ESTADO'   : '',
            'ORDENS_EMAIL'     : '',
            'PESSOAS_TELEFONE' : '',
            'ORDENS_CELULAR'   : ''
        });
    },

    checkOSConsumidor: function(form){
        const ordem = form.model;
        const idConsumidor = ordem.get('DOCUMENTOS_ID_PESSOAS');
        const idPessoa = ordem.get('ORDENS_ID_PESSOAS');


        if(ordem.get('PESSOAS_STATUS') == 'F') {
            Ext.Note('warning', 'Pessoa inativa - Contate Gerência');
            ordem.set({
                'ORDENS_ID_PESSOAS': '',
                'ORDENS_NOME':       '',
                'ORDENS_CPFCNPJ':    '',
                'CIDADES_NOME':          '',
                'CIDADES_ESTADO':        '',
                'ORDENS_EMAIL':      '',
                'PESSOAS_TELEFONE':      '',
                'ORDENS_CELULAR':    '',
            });
        }

        if(form.getViewModel().get('readOnly')) {
            form.getViewModel().set('isOSConsumidor', idConsumidor == idPessoa);
        }
    },

    setarConsumidorPadrao: function(form) {
        const ordem = form.model;

        ordem.set({
            'ORDENS_ID_PESSOAS': ordem.get('DOCUMENTOS_ID_PESSOAS'),
            'ORDENS_NOME':    '',
            'ORDENS_CPFCNPJ': '',
            'CIDADES_NOME':   ordem.get('CONSUMIDOR_CIDADESNOME'),
            'CIDADES_ESTADO': ordem.get('CONSUMIDOR_CIDADESESTADO'),
            'ORDENS_EMAIL': '',
            'PESSOAS_TELEFONE': '',
            'ORDENS_CELULAR': ''
        });
    }

});
